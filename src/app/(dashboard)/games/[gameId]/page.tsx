import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function GamePage({
  params,
}: {
  params: { gameId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const game = await prisma.game.findUnique({
    where: { id: params.gameId },
    include: {
      quizzes: {
        include: {
          crosswordQuestions: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!game) {
    redirect("/games")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{game.name}</h1>
            {session.user.isAdmin && (
              <Link
                href={`/games/${game.id}/edit`}
                className="text-gray-600 hover:text-gray-800"
              >
                Chỉnh sửa
              </Link>
            )}
          </div>
          <p className="text-gray-600 mt-2">{game.description}</p>
        </div>
        {session.user.isAdmin && (
          <Link
            href={`/games/${game.id}/quizzes/create`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Tạo Quiz Mới
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {game.quizzes.map((quiz) => (
          <div key={quiz.id} className="border rounded-lg p-6 hover:border-blue-500">
            <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
            {game.type === "crossword_basic" && quiz.verticalWord && (
              <p className="text-sm text-gray-500 mb-2">
                Từ khóa: {quiz.verticalWord}
              </p>
            )}
            <p className="text-sm text-gray-500 mb-4">
              {quiz.crosswordQuestions?.length || 0} Câu hỏi
            </p>
            <div className="flex justify-between items-center">
              <Link
                href={`/games/${game.id}/quizzes/${quiz.id}`}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Chơi Quiz
              </Link>
              {session.user.isAdmin && (
                <Link
                  href={`/games/${game.id}/quizzes/${quiz.id}/edit`}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Chỉnh sửa
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {game.quizzes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có quiz nào.</p>
          {session.user.isAdmin && (
            <Link
              href={`/games/${game.id}/quizzes/create`}
              className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
            >
              Tạo quiz đầu tiên
            </Link>
          )}
        </div>
      )}
    </div>
  )
} 