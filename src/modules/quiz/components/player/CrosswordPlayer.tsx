"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { CrosswordQuestion, Quiz as PrismaQuiz } from "@prisma/client";
import Image from "next/image";
import { answersMatch, normalizeKeyword } from "@/modules/quiz/lib/text";
import { alignmentColumnZeroBased } from "@/modules/quiz/validation/crossword-basic";

/** w-8 + gap-1 — đồng bộ với CrosswordPreview */
const ALIGN_UNIT_REM = 2.25;

function eliminatedStorageKey(storageKey: string) {
  return `crossword-basic-eliminated:${storageKey}`;
}

export interface CrosswordPlayerProps {
  quiz: PrismaQuiz & {
    crosswordQuestions: CrosswordQuestion[];
  };
  backHref?: string | null;
  backLabel?: string;
  /** Link public — API + poll global từ khóa (task-002). */
  playShareLink?: string | null;
  /** SSR: đã có người giải đúng từ khóa trên server. */
  keywordGloballySolved?: boolean;
}

export default function CrosswordPlayer({
  quiz,
  backHref,
  backLabel = "Quay lại",
  playShareLink = null,
  keywordGloballySolved = false,
}: CrosswordPlayerProps) {
  const storageKey = playShareLink ?? `id:${quiz.id}`;

  const sortedQuestions = useMemo(() => {
    const arr = [...quiz.crosswordQuestions];
    if (quiz.type === "crossword_basic") {
      arr.sort((a, b) => a.position - b.position);
    } else {
      arr.sort((a, b) => a.order - b.order);
    }
    return arr;
  }, [quiz.crosswordQuestions, quiz.type]);

  const basicAlignmentMaxCol = useMemo(() => {
    if (quiz.type !== "crossword_basic") return 0;
    return alignmentColumnZeroBased(sortedQuestions);
  }, [quiz.type, sortedQuestions]);

  const basicNormKw = useMemo(
    () =>
      quiz.type === "crossword_basic" && quiz.verticalWord
        ? normalizeKeyword(quiz.verticalWord)
        : "",
    [quiz.type, quiz.verticalWord]
  );

  const [gameState, setGameState] = useState<{
    [key: string]: {
      isAnswered: boolean;
      isActive: boolean;
      userAnswer: string;
      showError: boolean;
    };
  }>(() =>
    Object.fromEntries(
      quiz.crosswordQuestions.map((q) => [
        q.id,
        { isAnswered: false, isActive: false, userAnswer: "", showError: false },
      ])
    )
  );

  const [selectedQuestion, setSelectedQuestion] =
    useState<CrosswordQuestion | null>(null);
  const [revealedParts, setRevealedParts] = useState<boolean[]>(
    Array(quiz.crosswordQuestions.length).fill(false)
  );
  const [secretWordGuess, setSecretWordGuess] = useState("");
  const [showSecretWordForm, setShowSecretWordForm] = useState(false);
  const [isSecretWordFound, setIsSecretWordFound] = useState(false);
  const [secretWordError, setSecretWordError] = useState(false);

  const [eliminated, setEliminated] = useState(false);
  const [globalSolved, setGlobalSolved] = useState(keywordGloballySolved);
  /** User (phiên hiện tại) vừa đoán đúng từ khóa — khác với mở link khi server đã ghi sẵn. */
  const [wonByOwnKeyword, setWonByOwnKeyword] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keywordRiskChecked, setKeywordRiskChecked] = useState(false);
  const [keywordSubmitError, setKeywordSubmitError] = useState("");

  const fillAllAnswered = useCallback(() => {
    setGameState((prev) => {
      const next = { ...prev };
      for (const q of quiz.crosswordQuestions) {
        next[q.id] = {
          isAnswered: true,
          isActive: false,
          userAnswer: "",
          showError: false,
        };
      }
      return next;
    });
    setSelectedQuestion(null);
  }, [quiz.crosswordQuestions]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(eliminatedStorageKey(storageKey)) === "1") {
        setEliminated(true);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (keywordGloballySolved) {
      setGlobalSolved(true);
    }
  }, [keywordGloballySolved]);

  useEffect(() => {
    if (!globalSolved) return;
    fillAllAnswered();
  }, [globalSolved, fillAllAnswered]);

  useEffect(() => {
    if (!playShareLink || !eliminated || globalSolved) return;
    const poll = async () => {
      try {
        const r = await fetch(
          `/api/play/${encodeURIComponent(playShareLink)}/keyword`,
          { cache: "no-store" }
        );
        if (!r.ok) return;
        const data = (await r.json()) as { solved?: boolean };
        if (data.solved) setGlobalSolved(true);
      } catch {
        /* ignore */
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [playShareLink, eliminated, globalSolved]);

  const allSubQuestionsAnswered = useMemo(
    () =>
      quiz.crosswordQuestions.length > 0 &&
      quiz.crosswordQuestions.every((q) => gameState[q.id]?.isAnswered),
    [gameState, quiz.crosswordQuestions]
  );

  const boardReadOnly =
    quiz.type === "crossword_basic" &&
    (globalSolved || wonByOwnKeyword || allSubQuestionsAnswered);

  const hardLockedBasic =
    quiz.type === "crossword_basic" && eliminated && !globalSolved;

  const canOpenQuestion = (q: CrosswordQuestion) => {
    if (gameState[q.id]?.isAnswered) return false;
    if (quiz.type === "crossword_basic" && (hardLockedBasic || boardReadOnly))
      return false;
    return true;
  };

  /** §3.3: đoán từ khóa bất cứ lúc nào — không ẩn sau khi làm hết hàng ngang. */
  const showKeywordButton =
    quiz.type === "crossword_basic" &&
    quiz.verticalWord &&
    basicNormKw.length > 0 &&
    !eliminated &&
    !globalSolved &&
    !wonByOwnKeyword;

  /** §3.2 mục 3: đã giải đúng từ khóa (phiên hoặc server) → lộ chữ trên dải. */
  const keywordStripFullyRevealed =
    quiz.type === "crossword_basic" && (globalSolved || wonByOwnKeyword);

  const handleQuestionClick = (question: CrosswordQuestion) => {
    if (!canOpenQuestion(question)) return;

    if (selectedQuestion?.id === question.id) {
      setSelectedQuestion(null);
      setGameState((prev) => ({
        ...prev,
        [question.id]: { ...prev[question.id], isActive: false },
      }));
      return;
    }

    if (selectedQuestion) {
      setGameState((prev) => ({
        ...prev,
        [selectedQuestion.id]: {
          ...prev[selectedQuestion.id],
          isActive: false,
        },
      }));
    }

    setSelectedQuestion(question);
    setGameState((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], isActive: true, showError: false },
    }));
  };

  const getRevealedWidth = () => {
    const answeredCount = revealedParts.filter(Boolean).length;
    const n = quiz.crosswordQuestions.length;
    return answeredCount > 0 && n > 0 ? answeredCount * (100 / n) : 0;
  };

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;
    if (quiz.type === "crossword_basic" && (hardLockedBasic || boardReadOnly))
      return;

    const isCorrect = answersMatch(
      selectedQuestion.answer,
      gameState[selectedQuestion.id].userAnswer
    );

    if (isCorrect) {
      setGameState((prev) => ({
        ...prev,
        [selectedQuestion.id]: {
          ...prev[selectedQuestion.id],
          isAnswered: true,
          isActive: false,
          showError: false,
        },
      }));

      if (quiz.type === "crossword_advanced") {
        const index = sortedQuestions.findIndex((q) => q.id === selectedQuestion.id);
        if (index !== -1) {
          setRevealedParts((prev) => {
            const newParts = [...prev];
            newParts[index] = true;
            return newParts;
          });
        }
      }

      setSelectedQuestion(null);
    } else {
      setGameState((prev) => ({
        ...prev,
        [selectedQuestion.id]: {
          ...prev[selectedQuestion.id],
          showError: true,
        },
      }));
    }
  };

  const handleSecretWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz.secretWord) return;

    const isCorrect =
      secretWordGuess.toLowerCase().trim() ===
      quiz.secretWord.toLowerCase().trim();
    if (isCorrect) {
      setIsSecretWordFound(true);
      setShowSecretWordForm(false);
      setSecretWordError(false);
    } else {
      setSecretWordError(true);
    }
  };

  const persistEliminated = () => {
    try {
      sessionStorage.setItem(eliminatedStorageKey(storageKey), "1");
    } catch {
      /* ignore */
    }
    setEliminated(true);
  };

  const submitKeywordGuess = async () => {
    setKeywordSubmitError("");
    const vw = quiz.verticalWord;
    if (!vw || quiz.type !== "crossword_basic") return;

    if (!answersMatch(vw, keywordDraft)) {
      persistEliminated();
      setShowKeywordModal(false);
      setKeywordDraft("");
      setKeywordRiskChecked(false);
      return;
    }

    if (playShareLink) {
      try {
        const r = await fetch(
          `/api/play/${encodeURIComponent(playShareLink)}/keyword`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guess: keywordDraft }),
          }
        );
        const data = (await r.json()) as {
          ok?: boolean;
          alreadySolved?: boolean;
          message?: string;
        };
        if (!data.ok && !data.alreadySolved) {
          setKeywordSubmitError(data.message || "Không gửi được đoán.");
          return;
        }
        setGlobalSolved(true);
        if (!data.alreadySolved) {
          setWonByOwnKeyword(true);
        } else {
          fillAllAnswered();
        }
      } catch {
        setKeywordSubmitError("Lỗi mạng, thử lại.");
        return;
      }
    } else {
      setWonByOwnKeyword(true);
      fillAllAnswered();
    }

    setShowKeywordModal(false);
    setKeywordDraft("");
    setKeywordRiskChecked(false);
  };

  const spectatorMessage =
    eliminated && globalSolved
      ? "Bạn đã hết quyền chơi sau khi đoán sai từ khóa. Từ khóa đã được giải — bên dưới là đáp án (chỉ xem)."
      : globalSolved && !eliminated && !wonByOwnKeyword
        ? "Từ khóa đã được giải trên link này — toàn bộ đáp án hiển thị (chỉ xem)."
        : null;

  const winMessage =
    wonByOwnKeyword && !eliminated
      ? "Chúc mừng! Bạn đã đoán đúng từ khóa."
      : allSubQuestionsAnswered && !wonByOwnKeyword && !globalSolved
        ? "Bạn đã hoàn thành tất cả các câu!"
        : null;

  return (
    <div className="space-y-8">
      {backHref ? (
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>{backLabel}</span>
          </Link>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
        </div>
      ) : (
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
      )}

      {quiz.type === "crossword_basic" && quiz.verticalWord && basicNormKw && (
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {keywordStripFullyRevealed
              ? "Từ khóa — đã giải (hiển thị theo chuỗi chuẩn hóa khi chơi)"
              : `Từ khóa — ${basicNormKw.length} ký tự (sau chuẩn hóa)`}
          </p>
          <div
            className="flex flex-wrap gap-1"
            data-testid="keyword-strip"
            aria-label={
              keywordStripFullyRevealed
                ? `Từ khóa đã lộ: ${basicNormKw}`
                : `Từ khóa, ${basicNormKw.length} ô trống`
            }
          >
            {Array.from({ length: basicNormKw.length }, (_, i) => {
              const letter = keywordStripFullyRevealed ? basicNormKw[i] : null;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 shrink-0 flex items-center justify-center text-sm font-bold border-2
                    ${
                      letter
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                        : "border-dashed border-gray-300 bg-transparent"
                    }`}
                  aria-hidden={letter ? undefined : true}
                >
                  {letter ?? ""}
                </div>
              );
            })}
          </div>
          {keywordStripFullyRevealed &&
            quiz.verticalWord.trim() &&
            quiz.verticalWord !== basicNormKw && (
              <p className="text-xs text-gray-600">
                Bản ghi khi tạo bài: <span className="font-medium">{quiz.verticalWord}</span>
              </p>
            )}
          <p className="text-xs text-gray-500">
            {keywordStripFullyRevealed
              ? "Các chữ trên là chuỗi dùng khi so đúng/sai (bỏ dấu, bỏ khoảng trắng, không phân biệt hoa thường)."
              : "Ô trên chỉ gợi độ dài; không hiện chữ từ các câu đã đúng. Dùng nút bên dưới để đoán cả từ khóa (có xác nhận rủi ro)."}
          </p>
          {showKeywordButton && (
            <button
              type="button"
              onClick={() => {
                setKeywordDraft("");
                setKeywordRiskChecked(false);
                setKeywordSubmitError("");
                setShowKeywordModal(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium"
            >
              Trả lời từ khóa
            </button>
          )}
        </div>
      )}

      {hardLockedBasic && (
        <div className="rounded-md bg-amber-50 text-amber-900 px-4 py-3 text-sm">
          Bạn đã đoán sai từ khóa và không còn quyền trả lời.{" "}
          {playShareLink
            ? "Nếu người khác giải đúng từ khóa trên link này, đáp án sẽ hiện tự động (đang kiểm tra…)."
            : "Tải lại trang (F5) để bắt đầu phiên mới trên trình duyệt này."}
        </div>
      )}

      {(spectatorMessage || winMessage) && (
        <div
          className={`rounded-md px-4 py-3 text-sm ${
            spectatorMessage ? "bg-slate-100 text-slate-800" : "bg-green-50 text-green-800"
          }`}
        >
          {spectatorMessage || winMessage}
        </div>
      )}

      {quiz.type === "crossword_basic" && (
        <p className="text-sm text-gray-600">
          Click từng hàng để trả lời câu hỏi; các ô tô màu tím trên hàng ngang là chữ thuộc từ khóa
          dọc.
        </p>
      )}

      {showKeywordModal && quiz.type === "crossword_basic" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="keyword-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 id="keyword-modal-title" className="text-lg font-semibold">
              Trả lời từ khóa
            </h2>
            <p className="text-sm text-gray-700">
              Nếu <strong>sai một lần</strong>, bạn sẽ <strong>mất quyền</strong> trả lời từ khóa và
              mọi câu hàng ngang trong phiên này
              {playShareLink
                ? " (trên link public có thể xem đáp án sau nếu người khác giải đúng)."
                : "."}
            </p>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={keywordRiskChecked}
                onChange={(e) => setKeywordRiskChecked(e.target.checked)}
                className="mt-1 rounded border-gray-300"
              />
              <span>Tôi đã hiểu và muốn gửi đoán.</span>
            </label>
            <input
              type="text"
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              placeholder="Nhập từ khóa đầy đủ…"
              className="w-full border rounded-md px-3 py-2 border-gray-300 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
              disabled={!keywordRiskChecked}
            />
            {keywordSubmitError && (
              <p className="text-sm text-red-600">{keywordSubmitError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  setShowKeywordModal(false);
                  setKeywordDraft("");
                  setKeywordRiskChecked(false);
                  setKeywordSubmitError("");
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!keywordRiskChecked || !keywordDraft.trim()}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                onClick={() => void submitKeywordGuess()}
              >
                Gửi đoán
              </button>
            </div>
          </div>
        </div>
      )}

      {quiz.type === "crossword_advanced" && quiz.imageUrl && (
        <>
          <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            {allSubQuestionsAnswered ? (
              <Image
                src={quiz.imageUrl || ""}
                alt={quiz.title}
                fill
                className="object-contain"
              />
            ) : (
              <div className="relative h-full w-full overflow-hidden">
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    clipPath: `inset(0 ${100 - getRevealedWidth()}% 0 0)`,
                    transition: "clip-path 0.3s ease-in-out",
                  }}
                >
                  <Image
                    src={quiz.imageUrl || ""}
                    alt={quiz.title}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>
            )}
          </div>

          {quiz.type === "crossword_advanced" && quiz.secretWord && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Từ khóa bí ẩn:</h3>
                {!isSecretWordFound && !showSecretWordForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecretWordForm(true);
                      setSecretWordError(false);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Đoán từ khóa
                  </button>
                )}
              </div>

              {showSecretWordForm ? (
                <form onSubmit={handleSecretWordSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={secretWordGuess}
                      onChange={(e) => {
                        setSecretWordGuess(e.target.value);
                        setSecretWordError(false);
                      }}
                      className={`flex-1 border rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none
                        ${secretWordError ? "border-red-500" : ""}`}
                      placeholder="Nhập từ khóa bí ẩn..."
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 transition-colors"
                    >
                      Kiểm tra
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSecretWordForm(false);
                        setSecretWordError(false);
                      }}
                      className="border border-gray-300 px-4 py-1.5 rounded hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                  {secretWordError && (
                    <p className="text-red-500 text-sm">
                      Từ khóa không chính xác, vui lòng thử lại!
                    </p>
                  )}
                </form>
              ) : (
                <div className="flex justify-center space-x-2">
                  {Array.from(quiz.secretWord).map((letter, index) => (
                    <div
                      key={index}
                      className={`w-10 h-10 border-2 flex items-center justify-center font-bold text-xl
                        ${
                          isSecretWordFound
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-indigo-500"
                        }`}
                    >
                      {isSecretWordFound ? letter : "?"}
                    </div>
                  ))}
                </div>
              )}

              {isSecretWordFound && (
                <div className="mt-4 text-center text-green-600">
                  <p>Chúc mừng! Bạn đã tìm ra từ khóa bí ẩn!</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-6">
          {sortedQuestions.map((question) => {
            const state = gameState[question.id];
            const answer = question.answer.toUpperCase();
            const rowLocked =
              quiz.type === "crossword_basic" &&
              (hardLockedBasic || boardReadOnly);

            return (
              <div key={question.id}>
                <div
                  className={`transition-colors duration-200
                    ${
                      state.isAnswered
                        ? "text-green-600"
                        : rowLocked
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer hover:bg-gray-50"
                    }
                    ${state.isActive ? "bg-indigo-50" : ""}`}
                  onClick={() => handleQuestionClick(question)}
                >
                  <div className="flex items-center space-x-4">
                    <span className="font-medium min-w-[4rem]">Câu {question.order}:</span>
                    <div
                      className="flex gap-1"
                      style={
                        quiz.type === "crossword_basic"
                          ? {
                              marginLeft: `${
                                (basicAlignmentMaxCol - (question.letterIndex - 1)) *
                                ALIGN_UNIT_REM
                              }rem`,
                            }
                          : undefined
                      }
                    >
                      {answer.split("").map((letter, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 border-2 flex items-center justify-center font-medium shrink-0
                            transition-all duration-200 ease-in-out
                            ${
                              state.isAnswered
                                ? quiz.type === "crossword_basic" &&
                                  i === question.letterIndex - 1
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 scale-110"
                                  : "border-green-500 bg-green-50"
                                : state.isActive
                                  ? "border-indigo-200 bg-indigo-50/30"
                                  : "border-gray-300"
                            }`}
                        >
                          {state.isAnswered ? letter : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {state.isActive && !rowLocked && (
                  <div className="mt-3 ml-[4rem] pl-4 border-l-2 border-indigo-200">
                    <p className="mb-2 text-gray-600">{question.question}</p>
                    <form onSubmit={handleAnswerSubmit} className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={state.userAnswer}
                          onChange={(e) =>
                            setGameState((prev) => ({
                              ...prev,
                              [question.id]: {
                                ...prev[question.id],
                                userAnswer: e.target.value,
                              },
                            }))
                          }
                          className={`flex-1 border rounded px-3 py-1.5 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none
                            ${state.showError ? "border-red-500" : ""}`}
                          placeholder="Nhập câu trả lời..."
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 transition-colors"
                        >
                          Trả lời
                        </button>
                      </div>
                      {state.showError && (
                        <p className="text-red-500 text-sm">
                          Đáp án không chính xác, vui lòng thử lại!
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
