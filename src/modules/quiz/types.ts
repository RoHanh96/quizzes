export const QUIZ_TYPES = [
  "multiple_choice",
  "crossword_basic",
  "crossword_advanced",
] as const;

export type QuizType = (typeof QUIZ_TYPES)[number];

export function isQuizType(value: string): value is QuizType {
  return (QUIZ_TYPES as readonly string[]).includes(value);
}

export function isCrosswordType(
  value: string
): value is "crossword_basic" | "crossword_advanced" {
  return value === "crossword_basic" || value === "crossword_advanced";
}
