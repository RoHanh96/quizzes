"use client";

import { useCallback, useEffect, useState } from "react";

type SessionPayload = {
  sessionSeed: string;
  title: string;
  questions: { question: string; options: string[] }[];
};

const REVEAL_MS = 5000;

export default function MultipleChoicePlayer({
  shareLink,
  title: titleProp,
}: {
  shareLink: string;
  title?: string;
}) {
  const [title, setTitle] = useState(titleProp ?? "");
  const [sessionSeed, setSessionSeed] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SessionPayload["questions"]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [correctDisplayIndex, setCorrectDisplayIndex] = useState<number | null>(
    null
  );
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSession = useCallback(
    async (fixedSeed?: string) => {
      setLoading(true);
      setError(null);
      setGameOver(false);
      setWon(false);
      setRoundIndex(0);
      setSelectedIndex(null);
      setLocked(false);
      setRevealed(false);
      setCorrectDisplayIndex(null);
      try {
        const q = fixedSeed
          ? `?sessionSeed=${encodeURIComponent(fixedSeed)}`
          : "";
        const res = await fetch(
          `/api/play/${encodeURIComponent(shareLink)}/multiple-choice-session${q}`
        );
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(
            typeof j.message === "string" ? j.message : "Không tải được phiên chơi"
          );
        }
        const data = (await res.json()) as SessionPayload;
        setSessionSeed(data.sessionSeed);
        setTitle(data.title);
        setQuestions(data.questions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi tải phiên");
      } finally {
        setLoading(false);
      }
    },
    [shareLink]
  );

  useEffect(() => {
    void loadSession(
      shareLink.startsWith("e2e-") ? "playwright-session" : undefined
    );
  }, [loadSession, shareLink]);

  const current = questions[roundIndex];
  const showOptionsBlock =
    Boolean(current) && !won && (!gameOver || (gameOver && revealed));

  const handlePick = async (idx: number) => {
    if (locked || gameOver || won || !sessionSeed || !current) return;
    setLocked(true);
    setSelectedIndex(idx);

    let revealPayload: {
      correctDisplayIndex: number;
      isCorrect: boolean;
      gameOver: boolean;
      won: boolean;
    };
    try {
      const res = await fetch(
        `/api/play/${encodeURIComponent(shareLink)}/multiple-choice-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionSeed,
            roundIndex,
            selectedIndex: idx,
          }),
        }
      );
      if (!res.ok) {
        throw new Error("Không gửi được đáp án");
      }
      revealPayload = (await res.json()) as typeof revealPayload;
    } catch {
      setError("Lỗi máy chủ khi chấm đáp án");
      setLocked(false);
      setSelectedIndex(null);
      return;
    }

    await new Promise((r) => setTimeout(r, REVEAL_MS));
    setCorrectDisplayIndex(revealPayload.correctDisplayIndex);
    setRevealed(true);

    if (!revealPayload.isCorrect) {
      /** Spec: sau reveal vẫn thấy đáp án đúng (xanh nhạt + nhấp nháy) rồi mới kết thúc. */
      await new Promise((r) => setTimeout(r, 2800));
      setGameOver(true);
      return;
    }
    if (revealPayload.won) {
      /** Giữ lưới đáp án một lúc để thấy nhấp nháy xanh/cam rồi mới chuyển màn thắng. */
      await new Promise((r) => setTimeout(r, 1800));
      setWon(true);
      return;
    }
    setTimeout(() => {
      setRoundIndex((r) => r + 1);
      setSelectedIndex(null);
      setLocked(false);
      setRevealed(false);
      setCorrectDisplayIndex(null);
    }, 1500);
  };

  const playAgain = () => {
    void loadSession(shareLink.startsWith("e2e-") ? "playwright-session" : undefined);
  };

  if (loading && questions.length === 0) {
    return (
      <div className="text-gray-600" data-testid="mc-loading">
        Đang tải…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600" data-testid="mc-error">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="mc-title">
        {title}
      </h1>

      {won && (
        <div
          className="rounded-lg border border-green-200 bg-green-50 p-6 text-center space-y-4"
          data-testid="mc-win"
        >
          <p className="text-lg font-semibold text-green-900">
            Bạn là người chiến thắng
          </p>
          <button
            type="button"
            onClick={playAgain}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            data-testid="mc-play-again"
          >
            Chơi lại
          </button>
        </div>
      )}

      {showOptionsBlock && current && (
        <>
          <p className="text-sm text-gray-500">
            Câu {roundIndex + 1} / {questions.length}
          </p>
          <p className="text-lg" data-testid="mc-question-text">
            {current.question}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {current.options.map((label, idx) => {
              const isSelected = selectedIndex === idx;
              const isCorrectSlot =
                revealed && correctDisplayIndex !== null && idx === correctDisplayIndex;
              const blinkGreenAmber = revealed && isCorrectSlot && isSelected;
              const blinkGreenOnly = revealed && isCorrectSlot && !isSelected;

              let ring = "border-gray-300";
              if (revealed && isCorrectSlot) {
                ring = blinkGreenAmber
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-emerald-500 bg-emerald-50";
              } else if (isSelected && !revealed) {
                ring = "border-amber-500 bg-amber-50";
              } else if (revealed && isSelected && !isCorrectSlot) {
                ring = "border-amber-500 bg-amber-50";
              }

              const blinkClass = blinkGreenAmber
                ? "mc-blink-green-amber"
                : blinkGreenOnly
                  ? "mc-blink-green"
                  : "";

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={locked || won || gameOver}
                  data-testid={`mc-option-${idx}`}
                  data-mc-correct-reveal={
                    revealed && isCorrectSlot ? "true" : undefined
                  }
                  aria-pressed={isSelected}
                  onClick={() => handlePick(idx)}
                  className={`rounded-lg border-2 p-4 text-left transition ${ring} ${blinkClass} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span className="sr-only">Phương án {idx + 1}.</span>
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {gameOver && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-6 text-center space-y-4"
          data-testid="mc-game-over"
        >
          <p className="text-lg font-semibold text-red-900">Bạn đã thua</p>
          <button
            type="button"
            onClick={playAgain}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            data-testid="mc-play-again"
          >
            Chơi lại
          </button>
        </div>
      )}
    </div>
  );
}
