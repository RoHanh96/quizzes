import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CrosswordGame from "@/components/quizzes/CrosswordGame"
import Link from "next/link"

export default async function PlayQuizPage({
  params,
}: {
  params: { quizId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      crosswordQuestions: {
        orderBy: {
          order: "asc",
        },
      },
    },
  })

  if (!quiz) {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-800"
        >
          ← Quay lại
        </Link>
      </div>

      <CrosswordGame quiz={quiz} />
    </div>
  )
} 