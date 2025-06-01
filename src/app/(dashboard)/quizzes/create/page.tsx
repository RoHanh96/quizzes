import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import QuizForm from "@/components/quizzes/QuizForm"
import Link from "next/link"

export default async function CreateQuizPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!session.user.isAdmin) {
    redirect("/quizzes")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tạo Quiz Mới</h1>
        <Link
          href="/quizzes"
          className="text-gray-600 hover:text-gray-800"
        >
          ← Quay lại
        </Link>
      </div>

      <QuizForm />
    </div>
  )
} 