import { prisma } from "@/lib/prisma";
import { Quiz, CrosswordQuestion, Game } from "@prisma/client";

interface QuizWithQuestions extends Quiz {
  crosswordQuestions: CrosswordQuestion[];
  game: Game;
}

interface TransformedQuiz {
  id: string;
  title: string;
  verticalWord?: string;
  imageUrl?: string;
  type: string;
  questions: {
    id: string;
    question: string;
    answer: string;
    position: number;
    letterIndex: number;
  }[];
}

export async function getQuizById(
  quizId: string
): Promise<TransformedQuiz | null> {
  try {
    const quiz = (await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        game: true,
        crosswordQuestions: {
          orderBy: {
            position: "asc",
          },
        },
      },
    })) as QuizWithQuestions | null;

    if (!quiz) return null;

    // Transform data to match the expected format
    return {
      id: quiz.id,
      title: quiz.title,
      type: quiz.game.type,
      verticalWord: quiz.verticalWord || undefined,
      imageUrl: quiz.imageUrl || undefined,
      questions: quiz.crosswordQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        position: q.position,
        letterIndex: q.letterIndex,
      })),
    };
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return null;
  }
}
