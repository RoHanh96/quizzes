export type QuizType =
  | "multiple_choice"
  | "crossword_basic"
  | "crossword_advanced";

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
