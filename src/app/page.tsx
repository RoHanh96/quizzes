import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import DeleteQuizButton from "@/components/quizzes/DeleteQuizButton"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!session.user.isAdmin) {
    redirect("/quizzes")
  }

  const quizzes = await prisma.quiz.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      crosswordQuestions: true,
    },
  })

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Quiz Creator</h1>
          <Link
            href="/quizzes/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create New Quiz
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="border rounded-lg p-6 hover:border-blue-500">
              <h2 className="text-2xl font-semibold mb-2">{quiz.title}</h2>
              {quiz.verticalWord && (
                <p className="text-gray-600 mb-2">
                  Từ khóa: {quiz.verticalWord}
                </p>
              )}
              <p className="text-gray-500 mb-4">
                {quiz.crosswordQuestions.length} Câu hỏi
              </p>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Chơi Quiz
                  </Link>
                  <Link
                    href={`/quizzes/${quiz.id}/edit`}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Chỉnh sửa
                  </Link>
                </div>
                <DeleteQuizButton quizId={quiz.id} />
              </div>
            </div>
          ))}
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Chưa có quiz nào. Hãy tạo quiz đầu tiên!
          </div>
        )}
      </div>
    </main>
  )
}
