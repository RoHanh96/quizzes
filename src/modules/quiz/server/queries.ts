import { prisma } from "@/lib/prisma";
import { whereQuizExcludingE2eSeed } from "@/lib/e2e-seed";
import type {
  CrosswordQuestion,
  MultipleChoiceQuestion,
  Quiz,
  User,
} from "@prisma/client";

export type QuizWithCrossword = Quiz & {
  crosswordQuestions: CrosswordQuestion[];
  multipleChoiceQuestions?: MultipleChoiceQuestion[];
};

/** Danh sách quiz cho `QuizListView` — không gồm seed Playwright. */
export type QuizForDashboardList = Quiz & {
  crosswordQuestions: CrosswordQuestion[];
  creator: User | null;
};

export async function listQuizzesForDashboard(): Promise<QuizForDashboardList[]> {
  const showE2eSeed =
    process.env.SHOW_E2E_SEED_IN_DASHBOARD_LIST === "1" ||
    process.env.SHOW_E2E_SEED_IN_DASHBOARD_LIST === "true";

  return prisma.quiz.findMany({
    where: showE2eSeed ? undefined : whereQuizExcludingE2eSeed,
    orderBy: { createdAt: "desc" },
    include: {
      crosswordQuestions: true,
      creator: true,
    },
  });
}

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
      multipleChoiceQuestions: {
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
