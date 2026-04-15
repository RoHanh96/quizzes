import type { QuizType } from "../types";
import { assignLetterIndexesForBasic } from "./crossword-basic";

export type IncomingCrosswordQuestion = {
  question?: string;
  answer?: string;
  order?: number;
  position?: number;
  letterIndex?: number;
};

export type NormalizedCrosswordQuestion = {
  question: string;
  answer: string;
  order: number;
  position: number;
  letterIndex: number;
};

/**
 * Chuẩn hóa câu hỏi crossword từ client.
 * - **basic**: bỏ qua `letterIndex` từ body; gán bằng `assignLetterIndexesForBasic` + `verticalWord`.
 * - **advanced**: không dùng `letterIndex` (task-003); luôn `0`; sort theo `order`.
 */
export function normalizeCrosswordQuestions(
  raw: unknown,
  quizType: QuizType,
  verticalWord?: string | null
): { ok: true; questions: NormalizedCrosswordQuestion[] } | { ok: false; message: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, message: "Cần ít nhất một câu hỏi crossword." };
  }

  if (quizType === "crossword_basic") {
    const vw = String(verticalWord ?? "").trim();
    if (!vw) {
      return { ok: false, message: "Crossword basic cần từ khóa dọc." };
    }

    const drafts: {
      question: string;
      answer: string;
      order: number;
      position: number;
    }[] = [];

    for (let i = 0; i < raw.length; i++) {
      const q = raw[i] as IncomingCrosswordQuestion;
      const question = typeof q?.question === "string" ? q.question.trim() : "";
      const answer = typeof q?.answer === "string" ? q.answer.trim() : "";
      if (!question || !answer) {
        return { ok: false, message: `Câu ${i + 1}: thiếu nội dung hoặc đáp án.` };
      }
      const order = typeof q?.order === "number" ? q.order : i + 1;
      const position = typeof q?.position === "number" ? q.position : order;
      drafts.push({ question, answer, order, position });
    }

    return assignLetterIndexesForBasic(vw, drafts);
  }

  type Draft = {
    question: string;
    answer: string;
    order: number;
    position: number;
  };

  const drafts: Draft[] = [];

  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as IncomingCrosswordQuestion;
    const question = typeof q?.question === "string" ? q.question.trim() : "";
    const answer = typeof q?.answer === "string" ? q.answer.trim() : "";
    if (!question || !answer) {
      return { ok: false, message: `Câu ${i + 1}: thiếu nội dung hoặc đáp án.` };
    }

    const order = typeof q?.order === "number" ? q.order : i + 1;
    const position = typeof q?.position === "number" ? q.position : order;
    drafts.push({ question, answer, order, position });
  }

  drafts.sort((a, b) => a.order - b.order);

  const out: NormalizedCrosswordQuestion[] = drafts.map((d, i) => ({
    question: d.question,
    answer: d.answer,
    order: i + 1,
    position: i + 1,
    letterIndex: 0,
  }));

  return { ok: true, questions: out };
}
