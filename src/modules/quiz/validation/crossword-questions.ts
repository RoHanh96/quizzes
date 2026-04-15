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
 * - **advanced**: giữ `letterIndex` từ client (mặc định 1 nếu thiếu).
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

  const out: NormalizedCrosswordQuestion[] = [];

  for (let i = 0; i < raw.length; i++) {
    const q = raw[i] as IncomingCrosswordQuestion;
    const question = typeof q?.question === "string" ? q.question.trim() : "";
    const answer = typeof q?.answer === "string" ? q.answer.trim() : "";
    if (!question || !answer) {
      return { ok: false, message: `Câu ${i + 1}: thiếu nội dung hoặc đáp án.` };
    }

    const order = typeof q?.order === "number" ? q.order : i + 1;
    const position = typeof q?.position === "number" ? q.position : order;
    const letterIndex =
      typeof q?.letterIndex === "number" && q.letterIndex >= 1 ? q.letterIndex : 1;

    if (letterIndex > answer.length) {
      return {
        ok: false,
        message: `Câu ${i + 1}: letterIndex vượt quá độ dài đáp án.`,
      };
    }

    out.push({ question, answer, order, position, letterIndex });
  }

  return { ok: true, questions: out };
}
