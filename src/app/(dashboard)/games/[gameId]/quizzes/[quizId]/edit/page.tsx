import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CrosswordForm from "@/components/games/CrosswordForm"
import Link from "next/link"

export default async function EditQuizPage({
  params,
}: {
  params: { gameId: string; quizId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!session.user.isAdmin) {
    redirect("/games")
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      game: true,
      crosswordQuestions: {
        orderBy: {
          position: 'asc'
        }
      }
    }
  })

  if (!quiz) {
    redirect(`/games/${params.gameId}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa Quiz</h1>
        <Link
          href={`/games/${params.gameId}`}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Quay lại Game
        </Link>
      </div>

      {quiz.game.type.startsWith("crossword_") ? (
        <CrosswordForm
          gameId={params.gameId}
          type={quiz.game.type as "crossword_basic" | "crossword_advanced"}
          initialData={{
            id: quiz.id,
            title: quiz.title,
            verticalWord: quiz.verticalWord || "",
            imageUrl: quiz.imageUrl || "",
            questions: quiz.crosswordQuestions.map(q => ({
              id: q.id,
              question: q.question,
              answer: q.answer,
              position: q.position,
              letterIndex: q.letterIndex
            }))
          }}
        />
      ) : (
        <div className="text-red-600">
          Loại game này chưa được hỗ trợ.
        </div>
      )}
    </div>
  )
} 