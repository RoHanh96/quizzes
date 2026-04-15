import { prisma } from "@/lib/prisma";
import type { CrosswordQuestion, Quiz } from "@prisma/client";

export type QuizWithCrossword = Quiz & {
  crosswordQuestions: CrosswordQuestion[];
};

export async function getQuizWithCrosswordById(
  quizId: string
): Promise<QuizWithCrossword | null> {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      crosswordQuestions: {
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function getQuizWithCrosswordByShareLink(
  shareLink: string
): Promise<QuizWithCrossword | null> {
  return prisma.quiz.findFirst({
    where: { shareLink },
    include: {
      crosswordQuestions: {
        orderBy: { order: "asc" },
      },
    },
  });
}

/** Task-002 §3.3.6: đã có người đoán đúng từ khóa trên link public. */
export async function isKeywordGloballySolved(
  shareLink: string
): Promise<boolean> {
  const row = await prisma.crosswordPublicKeywordSolve.findUnique({
    where: { shareLink },
    select: { id: true },
  });
  return row !== null;
}
