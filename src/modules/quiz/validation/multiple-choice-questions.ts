export const MC_DIFFICULTIES = ["easy", "medium", "hard", "extreme"] as const;

export type McDifficulty = (typeof MC_DIFFICULTIES)[number];

export function isMcDifficulty(value: string): value is McDifficulty {
  return (MC_DIFFICULTIES as readonly string[]).includes(value);
}

export type NormalizedMultipleChoiceQuestion = {
  question: string;
  options: [string, string, string, string];
  answer: number;
  difficulty: McDifficulty;
  order: number;
};

function parseOptions(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x ?? "").trim());
  }
  if (typeof raw === "string") {
    try {
      const j = JSON.parse(raw) as unknown;
      if (Array.isArray(j)) {
        return j.map((x) => String(x ?? "").trim());
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function normalizeMultipleChoiceQuestions(
  questions: unknown,
  playLengthRaw: unknown
): | { ok: true; questions: NormalizedMultipleChoiceQuestion[]; playLength: number }
  | { ok: false; message: string } {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: false, message: "Multiple choice cần ít nhất một câu hỏi." };
  }

  const pl =
    typeof playLengthRaw === "number"
      ? playLengthRaw
      : typeof playLengthRaw === "string"
        ? parseInt(playLengthRaw, 10)
        : NaN;
  if (!Number.isInteger(pl) || pl < 1) {
    return {
      ok: false,
      message: "Số câu trong một lần chơi (playLength) phải là số nguyên ≥ 1.",
    };
  }
  if (pl > questions.length) {
    return {
      ok: false,
      message: `playLength (${pl}) không được lớn hơn số câu trong ngân hàng (${questions.length}).`,
    };
  }

  const out: NormalizedMultipleChoiceQuestion[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q || typeof q !== "object") {
      return { ok: false, message: `Câu ${i + 1}: dữ liệu không hợp lệ.` };
    }
    const rec = q as Record<string, unknown>;
    const question = String(rec.question ?? "").trim();
    if (!question) {
      return { ok: false, message: `Câu ${i + 1}: thiếu nội dung câu hỏi.` };
    }

    const opts = parseOptions(rec.options);
    if (!opts || opts.length !== 4) {
      return {
        ok: false,
        message: `Câu ${i + 1}: cần đúng 4 phương án (A–D).`,
      };
    }
    if (opts.some((s) => !s)) {
      return {
        ok: false,
        message: `Câu ${i + 1}: mỗi phương án phải có nội dung.`,
      };
    }

    const answerRaw = rec.answer ?? rec.correctOption;
    const answer =
      typeof answerRaw === "number"
        ? answerRaw
        : typeof answerRaw === "string"
          ? parseInt(answerRaw, 10)
          : NaN;
    if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
      return {
        ok: false,
        message: `Câu ${i + 1}: đáp án đúng phải là chỉ số 0–3 (A–D).`,
      };
    }

    const diffRaw = String(rec.difficulty ?? "").trim();
    if (!isMcDifficulty(diffRaw)) {
      return {
        ok: false,
        message: `Câu ${i + 1}: độ khó phải là easy, medium, hard hoặc extreme.`,
      };
    }

    out.push({
      question,
      options: [opts[0]!, opts[1]!, opts[2]!, opts[3]!],
      answer,
      difficulty: diffRaw,
      order:
        typeof rec.order === "number" && Number.isInteger(rec.order)
          ? rec.order
          : i + 1,
    });
  }

  return { ok: true, questions: out, playLength: pl };
}
