import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import type { Quiz } from "@/types"

export default async function QuizzesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const quizzes = await prisma.quiz.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      crosswordQuestions: true,
      creator: true,
    },
  }) as Quiz[]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Quizzes</h1>
        {session.user.isAdmin && (
          <Link
            href="/quizzes/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Tạo Quiz Mới
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="border rounded-lg overflow-hidden hover:border-blue-500">
            {quiz.type === "crossword_advanced" && quiz.imageUrl && (
              <div className="relative w-full h-48">
                <Image
                  src={quiz.imageUrl}
                  alt={quiz.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
              <div className="text-sm text-gray-500 mb-2">
                Loại: {quiz.type === "crossword_basic" ? "Crossword cơ bản" : 
                       quiz.type === "crossword_advanced" ? "Crossword nâng cao" :
                       "Multiple Choice"}
              </div>
              {quiz.type === "crossword_basic" && quiz.verticalWord && (
                <p className="text-sm text-gray-500 mb-2">
                  Từ khóa: {quiz.verticalWord}
                </p>
              )}
              <p className="text-sm text-gray-500 mb-4">
                {quiz.crosswordQuestions.length} Câu hỏi
              </p>
              <div className="flex justify-between items-center">
                <Link
                  href={`/quizzes/${quiz.id}`}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Chơi Quiz
                </Link>
                {session.user.isAdmin && (
                  <Link
                    href={`/quizzes/${quiz.id}/edit`}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Chỉnh sửa
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {quizzes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Chưa có quiz nào. {session.user.isAdmin && "Hãy tạo quiz đầu tiên!"}
        </div>
      )}
    </div>
  )
} 