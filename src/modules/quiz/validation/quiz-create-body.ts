import { isQuizType, type QuizType } from "../types";
import {
  normalizeCrosswordQuestions,
  type NormalizedCrosswordQuestion,
} from "./crossword-questions";

export type QuizCreateBody = {
  title: string;
  type: QuizType;
  verticalWord?: string | null;
  secretWord?: string | null;
  imageUrl?: string | null;
  questions?: unknown;
  normalizedCrosswordQuestions?: NormalizedCrosswordQuestion[];
};

export function parseQuizCreateBody(
  body: unknown
): { ok: true; data: QuizCreateBody } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Body không hợp lệ." };
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const typeRaw = typeof b.type === "string" ? b.type : "";

  if (!title) {
    return { ok: false, message: "Thiếu tiêu đề." };
  }
  if (!isQuizType(typeRaw)) {
    return { ok: false, message: "Loại quiz không hợp lệ." };
  }

  const type = typeRaw;

  const data: QuizCreateBody = {
    title,
    type,
    verticalWord: typeof b.verticalWord === "string" ? b.verticalWord : null,
    secretWord: typeof b.secretWord === "string" ? b.secretWord : null,
    imageUrl: typeof b.imageUrl === "string" ? b.imageUrl : null,
    questions: b.questions,
  };

  if (type === "crossword_basic" || type === "crossword_advanced") {
    const norm = normalizeCrosswordQuestions(
      b.questions,
      type,
      type === "crossword_basic" ? data.verticalWord : null
    );
    if (!norm.ok) {
      return { ok: false, message: norm.message };
    }
    if (type === "crossword_basic" && !String(data.verticalWord || "").trim()) {
      return { ok: false, message: "Crossword basic cần từ khóa dọc." };
    }
    if (type === "crossword_advanced") {
      if (!String(data.imageUrl || "").trim()) {
        return { ok: false, message: "Crossword advanced cần URL hình ảnh." };
      }
      if (!String(data.secretWord || "").trim()) {
        return { ok: false, message: "Crossword advanced cần từ khóa bí ẩn." };
      }
    }

    return {
      ok: true,
      data: { ...data, normalizedCrosswordQuestions: norm.questions },
    };
  }

  return { ok: true, data };
}
