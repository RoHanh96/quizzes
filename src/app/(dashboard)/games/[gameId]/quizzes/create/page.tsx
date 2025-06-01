import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CrosswordForm from "@/components/games/CrosswordForm"
import Link from "next/link"

export default async function CreateQuizPage({
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
  })

  if (!game) {
    redirect("/games")
  }

  if (!session.user.isAdmin) {
    redirect("/games")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tạo Quiz Mới</h1>
        <Link
          href={`/games/${params.gameId}`}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Quay lại Game
        </Link>
      </div>

      {(() => {
        switch (game.type) {
          case "crossword_basic":
            return (
              <CrosswordForm
                gameId={params.gameId}
                type="crossword_basic"
              />
            )
          case "crossword_advanced":
            return (
              <CrosswordForm
                gameId={params.gameId}
                type="crossword_advanced"
              />
            )
          case "multiple_choice":
            return (
              <div className="text-red-600">
                Loại game Multiple Choice đang được phát triển.
              </div>
            )
          default:
            return (
              <div className="text-red-600">
                Loại game này chưa được hỗ trợ.
              </div>
            )
        }
      })()}
    </div>
  )
} 