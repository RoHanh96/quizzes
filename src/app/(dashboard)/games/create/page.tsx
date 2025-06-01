import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import GameForm from "@/components/games/GameForm"

export default async function CreateGamePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (!session.user.isAdmin) {
    redirect("/games")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Quiz Game</h1>
      <GameForm />
    </div>
  )
} 