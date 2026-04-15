"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { CrosswordQuestion, Quiz as PrismaQuiz } from "@prisma/client";
import {
  answersMatch,
  normalizeKeyword,
  keywordLettersPreserveSource,
  answerLettersStripSpaces,
  answerLetterCountDisplay,
} from "@/modules/quiz/lib/text";
import {
  alignmentColumnZeroBased,
  visibleLetterIndexZeroBased,
} from "@/modules/quiz/validation/crossword-basic";
import {
  buildAdvancedCellLabels,
  computeRC,
  effectiveAdvancedSeed,
} from "@/modules/quiz/lib/crossword-advanced-grid";
import CrosswordAdvancedImageGrid from "./CrosswordAdvancedImageGrid";

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

  const advancedLayout = useMemo(() => {
    if (quiz.type !== "crossword_advanced") return null;
    const qs = [...quiz.crosswordQuestions].sort((a, b) => a.order - b.order);
    const n = qs.length;
    if (n < 1) return null;
    const seed = effectiveAdvancedSeed(quiz);
    const { R, C } = computeRC(n);
    const cells = buildAdvancedCellLabels(n, seed);
    return { R, C, cells };
  }, [quiz]);

  /** R×C − N: ô không đánh số (đệm), chỉ lộ ảnh sau khi xong N câu hoặc thắng từ khóa */
  const advancedPadCellCount = useMemo(() => {
    if (quiz.type !== "crossword_advanced" || !advancedLayout) return 0;
    const n = quiz.crosswordQuestions.length;
    return advancedLayout.R * advancedLayout.C - n;
  }, [quiz.type, quiz.crosswordQuestions.length, advancedLayout]);

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

  const advancedNormKw = useMemo(
    () =>
      quiz.type === "crossword_advanced" && quiz.secretWord
        ? normalizeKeyword(quiz.secretWord)
        : "",
    [quiz.type, quiz.secretWord]
  );

  const basicKeywordDisplayLetters = useMemo(
    () =>
      quiz.type === "crossword_basic" && quiz.verticalWord
        ? keywordLettersPreserveSource(quiz.verticalWord)
        : [],
    [quiz.type, quiz.verticalWord]
  );

  const advancedKeywordDisplayLetters = useMemo(
    () =>
      quiz.type === "crossword_advanced" && quiz.secretWord
        ? keywordLettersPreserveSource(quiz.secretWord)
        : [],
    [quiz.type, quiz.secretWord]
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
  /** Advanced: đã mở tile cho câu `order` */
  const [revealedByOrder, setRevealedByOrder] = useState<Record<number, boolean>>(
    {}
  );

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
    if (quiz.type !== "crossword_advanced") return;
    if (!(globalSolved || wonByOwnKeyword)) return;
    setRevealedByOrder(() => {
      const next: Record<number, boolean> = {};
      for (const q of quiz.crosswordQuestions) {
        next[q.order] = true;
      }
      return next;
    });
  }, [quiz.type, quiz.crosswordQuestions, globalSolved, wonByOwnKeyword]);

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

  const boardReadOnlyBasic =
    quiz.type === "crossword_basic" &&
    (globalSolved || wonByOwnKeyword || allSubQuestionsAnswered);

  const boardReadOnlyAdvanced =
    quiz.type === "crossword_advanced" &&
    (globalSolved || wonByOwnKeyword || allSubQuestionsAnswered);

  const hardLockedBasic =
    quiz.type === "crossword_basic" && eliminated && !globalSolved;

  const hardLockedAdvanced =
    quiz.type === "crossword_advanced" && eliminated && !globalSolved;

  const hardLocked = hardLockedBasic || hardLockedAdvanced;

  const canOpenQuestion = (q: CrosswordQuestion) => {
    if (gameState[q.id]?.isAnswered) return false;
    if (quiz.type === "crossword_basic" && (hardLockedBasic || boardReadOnlyBasic))
      return false;
    if (
      quiz.type === "crossword_advanced" &&
      (hardLockedAdvanced || boardReadOnlyAdvanced)
    )
      return false;
    return true;
  };

  /** §3.3: đoán từ khóa bất cứ lúc nào — không ẩn sau khi làm hết hàng ngang. */
  const showKeywordButton =
    ((quiz.type === "crossword_basic" &&
      quiz.verticalWord &&
      basicNormKw.length > 0) ||
      (quiz.type === "crossword_advanced" &&
        quiz.secretWord &&
        advancedNormKw.length > 0)) &&
    !eliminated &&
    !globalSolved &&
    !wonByOwnKeyword;

  /** §3.2 mục 3: đã giải đúng từ khóa (phiên hoặc server) → lộ chữ trên dải. */
  const keywordStripFullyRevealedBasic =
    quiz.type === "crossword_basic" && (globalSolved || wonByOwnKeyword);

  const keywordStripFullyRevealedAdvanced =
    quiz.type === "crossword_advanced" && (globalSolved || wonByOwnKeyword);

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

  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;
    if (quiz.type === "crossword_basic" && (hardLockedBasic || boardReadOnlyBasic))
      return;
    if (
      quiz.type === "crossword_advanced" &&
      (hardLockedAdvanced || boardReadOnlyAdvanced)
    )
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
        setRevealedByOrder((prev) => ({
          ...prev,
          [selectedQuestion.order]: true,
        }));
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
    const keywordSource =
      quiz.type === "crossword_basic"
        ? quiz.verticalWord
        : quiz.type === "crossword_advanced"
          ? quiz.secretWord
          : null;
    if (!keywordSource) return;

    if (!answersMatch(keywordSource, keywordDraft)) {
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
            {keywordStripFullyRevealedBasic
              ? "Từ khóa — đã giải"
              : `Từ khóa — ${basicNormKw.length} ký tự`}
          </p>
          <div
            className="flex flex-wrap gap-1"
            data-testid="keyword-strip"
            aria-label={
              keywordStripFullyRevealedBasic
                ? `Từ khóa đã lộ: ${basicKeywordDisplayLetters.length === basicNormKw.length ? basicKeywordDisplayLetters.join("") : basicNormKw}`
                : `Từ khóa, ${basicNormKw.length} ô trống`
            }
          >
            {Array.from({ length: basicNormKw.length }, (_, i) => {
              const letter = keywordStripFullyRevealedBasic
                ? basicKeywordDisplayLetters.length === basicNormKw.length
                  ? basicKeywordDisplayLetters[i]!
                  : basicNormKw[i]!
                : null;
              return (
                <div
                  key={i}
                  className={`min-w-[2rem] h-8 px-0.5 shrink-0 flex items-center justify-center text-sm font-bold border-2
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
          {!keywordStripFullyRevealedBasic && (
            <p className="text-xs text-gray-500">
              Ô trên chỉ gợi độ dài; không hiện chữ từ các câu đã đúng. Dùng nút bên dưới để đoán cả từ khóa (có xác nhận rủi ro).
            </p>
          )}
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

      {quiz.type === "crossword_advanced" && quiz.secretWord && advancedNormKw && (
        <div
          className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3"
          data-testid="keyword-strip-advanced"
        >
          <p className="text-sm font-medium text-gray-700">
            {keywordStripFullyRevealedAdvanced
              ? "Từ khóa bí ẩn — đã giải"
              : `Từ khóa bí ẩn — ${advancedNormKw.length} ký tự`}
          </p>
          <div
            className="flex flex-wrap gap-1"
            aria-label={
              keywordStripFullyRevealedAdvanced
                ? `Từ khóa đã lộ: ${advancedKeywordDisplayLetters.length === advancedNormKw.length ? advancedKeywordDisplayLetters.join("") : advancedNormKw}`
                : `Từ khóa, ${advancedNormKw.length} ô trống`
            }
          >
            {Array.from({ length: advancedNormKw.length }, (_, i) => {
              const letter = keywordStripFullyRevealedAdvanced
                ? advancedKeywordDisplayLetters.length === advancedNormKw.length
                  ? advancedKeywordDisplayLetters[i]!
                  : advancedNormKw[i]!
                : null;
              return (
                <div
                  key={i}
                  className={`min-w-[2rem] h-8 px-0.5 shrink-0 flex items-center justify-center text-sm font-bold border-2
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
          {!keywordStripFullyRevealedAdvanced && (
            <p className="text-xs text-gray-500">
              Lưới ảnh gợi ý từ khóa bên dưới. Dùng nút để đoán cả từ khóa (có xác nhận rủi ro).
            </p>
          )}
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

      {hardLocked && (
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

      {showKeywordModal &&
        (quiz.type === "crossword_basic" || quiz.type === "crossword_advanced") && (
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

      {quiz.type === "crossword_advanced" && quiz.imageUrl && advancedLayout && (
        <CrosswordAdvancedImageGrid
          imageUrl={quiz.imageUrl}
          title={quiz.title}
          R={advancedLayout.R}
          C={advancedLayout.C}
          cells={advancedLayout.cells}
          revealedByOrder={revealedByOrder}
          forceRevealAll={
            globalSolved || wonByOwnKeyword || allSubQuestionsAnswered
          }
        />
      )}

      {quiz.type === "crossword_advanced" && (
        <p className="text-sm text-gray-600">
          Gợi ý từ khóa nằm trong lưới ảnh; trả lời đúng từng câu để mở đúng một mảnh (số trên ô =
          thứ tự câu).
          {advancedPadCellCount > 0 && (
            <>
              {" "}
              Có {advancedPadCellCount} ô không đánh số (ô đệm): không gắn câu hỏi; mảnh ảnh tại đó
              chỉ hiện sau khi bạn trả lời đúng toàn bộ các câu hàng ngang hoặc đoán đúng từ khóa.
            </>
          )}
        </p>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-6">
          {sortedQuestions.map((question) => {
            const state = gameState[question.id];
            const answerRaw = question.answer;
            const lettersRow = answerLettersStripSpaces(answerRaw).toUpperCase();
            const keywordVisibleCol =
              quiz.type === "crossword_basic"
                ? visibleLetterIndexZeroBased(answerRaw, question.letterIndex)
                : 0;
            const rowLocked =
              (quiz.type === "crossword_basic" &&
                (hardLockedBasic || boardReadOnlyBasic)) ||
              (quiz.type === "crossword_advanced" &&
                (hardLockedAdvanced || boardReadOnlyAdvanced));

            return (
              <div key={question.id} data-testid={`crossword-question-${question.order}`}>
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
                                (basicAlignmentMaxCol - keywordVisibleCol) *
                                ALIGN_UNIT_REM
                              }rem`,
                            }
                          : undefined
                      }
                    >
                      {[...lettersRow].map((letter, vi) => (
                        <div
                          key={vi}
                          className={`w-8 h-8 border-2 flex items-center justify-center font-medium shrink-0
                            transition-all duration-200 ease-in-out
                            ${
                              state.isAnswered
                                ? quiz.type === "crossword_basic" &&
                                  vi === keywordVisibleCol
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
                    <p className="mb-2 text-gray-600 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span>{question.question}</span>
                      <span className="text-sm text-gray-500 tabular-nums">
                        ({answerLetterCountDisplay(answerRaw)} chữ)
                      </span>
                    </p>
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
                          aria-label={`Đáp án câu ${question.order}`}
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
