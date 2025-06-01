import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import GameForm from "@/components/games/GameForm"
import Link from "next/link"

export default async function EditGamePage({
  params,
}: {
  params: { gameId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!session.user.isAdmin) {
    redirect("/games")
  }

  const game = await prisma.game.findUnique({
    where: { id: params.gameId },
  })

  if (!game) {
    redirect("/games")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chỉnh sửa Game</h1>
        <Link
          href={`/games/${params.gameId}`}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Quay lại Game
        </Link>
      </div>
      <GameForm initialData={game} />
    </div>
  )
} 