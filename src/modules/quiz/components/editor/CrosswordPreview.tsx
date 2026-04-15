"use client";

import { useMemo } from "react";
import {
  assignLetterIndexesForBasic,
  alignmentColumnZeroBased,
  visibleLetterIndexZeroBased,
} from "@/modules/quiz/validation/crossword-basic";
import { normalizeKeyword, answerLettersStripSpaces } from "@/modules/quiz/lib/text";

/** Khoảng một ô (w-8) + gap-1 — dùng căn cột từ khóa */
const ALIGN_UNIT_REM = 2.25;

interface CrosswordQuestion {
  question: string;
  answer: string;
  position: number;
  letterIndex?: number;
}

interface CrosswordPreviewProps {
  questions: CrosswordQuestion[];
  verticalWord: string;
}

export default function CrosswordPreview({
  questions,
  verticalWord,
}: CrosswordPreviewProps) {
  const kw = useMemo(
    () => normalizeKeyword(verticalWord),
    [verticalWord]
  );

  const assigned = useMemo(() => {
    const drafts = questions
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((q) => ({
        question: q.question,
        answer: q.answer,
        order: q.position,
        position: q.position,
      }));
    return assignLetterIndexesForBasic(verticalWord, drafts);
  }, [questions, verticalWord]);

  const maxCol = useMemo(() => {
    if (!assigned.ok) return 0;
    return alignmentColumnZeroBased(assigned.questions);
  }, [assigned]);

  if (!assigned.ok) {
    return (
      <div className="bg-amber-50 text-amber-900 p-4 rounded-lg text-sm">
        {assigned.message}
      </div>
    );
  }

  const rows = [...assigned.questions].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-1">Từ khóa (đã chuẩn hóa)</h3>
        <p className="text-sm text-gray-500 mb-2">{kw || "—"}</p>
        <div className="flex flex-wrap gap-2">
          {kw.split("").map((letter, index) => (
            <div
              key={index}
              className="w-8 h-8 border-2 border-indigo-500 flex items-center justify-center font-bold text-indigo-600"
            >
              {letter}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {rows.map((question, index) => {
          const answer = question.answer;
          const lettersRow = answerLettersStripSpaces(answer).toUpperCase();
          const letterVisibleCol = visibleLetterIndexZeroBased(
            answer,
            question.letterIndex
          );
          const marginLeftRem = (maxCol - letterVisibleCol) * ALIGN_UNIT_REM;

          return (
            <div key={index} className="relative">
              <div className="font-medium mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span>
                  Câu {index + 1}: {question.question}
                </span>
                <span className="text-sm font-normal text-gray-500 tabular-nums">
                  ({answerLettersStripSpaces(answer).length} chữ)
                </span>
              </div>
              <div
                className="flex items-center gap-1"
                style={{ marginLeft: `${marginLeftRem}rem` }}
              >
                {[...lettersRow].map((letter, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 border-2 flex items-center justify-center font-medium shrink-0
                      ${
                        i === letterVisibleCol
                          ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                          : "border-gray-300"
                      }`}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
