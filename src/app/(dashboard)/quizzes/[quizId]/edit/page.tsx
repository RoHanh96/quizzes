import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CrosswordEditor from "@/modules/quiz/components/editor/CrosswordEditor";
import QuizForm from "@/components/quizzes/QuizForm";
import { isCrosswordType } from "@/modules/quiz/types";

export default async function EditQuizPage({
  params,
}: {
  params: { quizId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      crosswordQuestions: {
        orderBy: { order: "asc" },
      },
      multipleChoiceQuestions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!quiz) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa Quiz</h1>
        <Link href="/" className="text-gray-600 hover:text-gray-800">
          ← Quay lại
        </Link>
      </div>

      {isCrosswordType(quiz.type) ? (
        <CrosswordEditor
          type={quiz.type}
          initialData={{
            id: quiz.id,
            title: quiz.title,
            verticalWord: quiz.verticalWord || "",
            secretWord: quiz.secretWord || "",
            imageUrl: quiz.imageUrl || "",
            questions: quiz.crosswordQuestions.map((q) => ({
              id: q.id,
              question: q.question,
              answer: q.answer,
              position: q.position,
              letterIndex: q.letterIndex,
            })),
          }}
        />
      ) : (
        <QuizForm
          initialData={{
            id: quiz.id,
            title: quiz.title,
            type: quiz.type,
            playLength: quiz.playLength ?? 1,
            questions: quiz.multipleChoiceQuestions.map((q) => ({
              question: q.question,
              options: JSON.parse(q.options) as string[],
              correctOption: q.answer,
              difficulty: q.difficulty,
              order: q.order,
            })),
          }}
        />
      )}
    </div>
  );
}
