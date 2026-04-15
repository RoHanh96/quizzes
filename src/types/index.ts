import type { QuizType } from "@/modules/quiz/types";

export type { QuizType } from "@/modules/quiz/types";
export { QUIZ_TYPES, isQuizType, isCrosswordType } from "@/modules/quiz/types";

export interface CrosswordQuestion {
  id: string;
  question: string;
  answer: string;
  order: number;
  position: number;
  letterIndex: number;
  quizId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  type: QuizType;
  verticalWord?: string;
  secretWord?: string;
  imageUrl?: string;
  shareLink?: string;
  crosswordQuestions: CrosswordQuestion[];
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  creator?: {
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: Date | null;
    image: string | null;
    isAdmin: boolean;
  };
}
