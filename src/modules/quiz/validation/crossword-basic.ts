import { normalizeKeyword, stripDiacritics } from "../lib/text";
import type { NormalizedCrosswordQuestion } from "./crossword-questions";

export type BasicDraftQuestion = {
  question: string;
  answer: string;
  order: number;
  position: number;
};

function normalizeLetterChar(ch: string): string {
  return stripDiacritics(ch).toUpperCase();
}

/** Tìm vị trí 0-based trong đáp án: ký tự đầu tiên (bỏ space) khớp ký tự từ khóa (đã normalize 1 char) */
export function findFirstKeywordLetterIndexInAnswer(
  answer: string,
  keywordCharNormalized: string
): number {
  for (let j = 0; j < answer.length; j++) {
    const c = answer[j];
    if (/\s/.test(c)) continue;
    if (normalizeLetterChar(c) === keywordCharNormalized) {
      return j;
    }
  }
  return -1;
}

/**
 * Crossword basic: N = độ dài từ khóa (đã chuẩn hóa).
 * Đúng N câu (theo position tăng dần); câu i phải chứa ký tự thứ i của từ khóa.
 * letterIndex = vị trí đầu tiên trong đáp án (1-based).
 */
export function assignLetterIndexesForBasic(
  verticalWord: string,
  questionsSortedByPosition: BasicDraftQuestion[]
):
  | { ok: true; questions: NormalizedCrosswordQuestion[] }
  | { ok: false; message: string } {
  const kw = normalizeKeyword(verticalWord);
  const N = kw.length;
  if (N === 0) {
    return { ok: false, message: "Từ khóa không hợp lệ sau khi chuẩn hóa." };
  }

  const sorted = [...questionsSortedByPosition].sort(
    (a, b) => a.position - b.position
  );

  if (sorted.length !== N) {
    return {
      ok: false,
      message: `Crossword basic: cần đúng ${N} câu hỏi (theo từ khóa đã bỏ dấu và khoảng trắng), hiện có ${sorted.length} câu.`,
    };
  }

  const out: NormalizedCrosswordQuestion[] = [];

  for (let i = 0; i < N; i++) {
    const q = sorted[i];
    const need = kw[i];
    const idx = findFirstKeywordLetterIndexInAnswer(q.answer, need);
    if (idx < 0) {
      return {
        ok: false,
        message: `Câu ${q.position}: đáp án phải chứa ký tự "${need}" (vị trí ${i + 1} trong từ khóa đã chuẩn hóa).`,
      };
    }
    out.push({
      question: q.question,
      answer: q.answer,
      order: q.order,
      position: q.position,
      letterIndex: idx + 1,
    });
  }

  return { ok: true, questions: out };
}

/** Thông báo lỗi draft form (editor) — không mutate */
export function validateBasicDraftMessage(
  verticalWord: string,
  questions: BasicDraftQuestion[]
): string | null {
  const r = assignLetterIndexesForBasic(verticalWord, questions);
  return r.ok ? null : r.message;
}

/**
 * Lỗi theo từng `position` khi đáp án đã có nội dung nhưng không chứa ký tự từ khóa ở slot tương ứng.
 * Chỉ kiểm tra khi đã đủ đúng N câu (tránh trùng thông báo "thiếu/số câu" với `validateBasicDraftMessage`).
 */
export function getBasicAnswerErrorsByPosition(
  verticalWord: string,
  questions: BasicDraftQuestion[]
): Record<number, string> {
  const kw = normalizeKeyword(verticalWord);
  const N = kw.length;
  const errors: Record<number, string> = {};
  if (N === 0) return errors;

  const sorted = [...questions].sort((a, b) => a.position - b.position);
  if (sorted.length !== N) return errors;

  for (let i = 0; i < N; i++) {
    const q = sorted[i];
    const answer = String(q.answer ?? "").trim();
    if (!answer) continue;
    const need = kw[i];
    if (findFirstKeywordLetterIndexInAnswer(q.answer, need) < 0) {
      errors[q.position] =
        `Đáp án phải chứa ký tự "${need}" (vị trí ${i + 1} trên từ khóa đã chuẩn hóa: "${kw}").`;
    }
  }
  return errors;
}

/** Cột căn chỉnh 0-based: ô chứa chữ từ khóa thẳng cột */
export function alignmentColumnZeroBased(
  questions: Pick<NormalizedCrosswordQuestion, "letterIndex">[]
): number {
  if (questions.length === 0) return 0;
  return Math.max(0, ...questions.map((q) => q.letterIndex - 1));
}
