import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CrosswordGame from "@/components/games/CrosswordGame"

export default async function PlayQuizPage({
  params,
}: {
  params: { gameId: string; quizId: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      game: true,
      crosswordQuestions: true,
    },
  })

  if (!quiz || quiz.gameId !== params.gameId) {
    redirect("/games")
  }

  if (!quiz.game.type.startsWith("crossword_")) {
    // Handle other game types here
    return <div>This game type is not supported yet.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CrosswordGame
        title={quiz.title}
        type={quiz.game.type as "crossword_basic" | "crossword_advanced"}
        verticalWord={quiz.verticalWord || undefined}
        imageUrl={quiz.imageUrl || undefined}
        questions={quiz.crosswordQuestions}
        gameId={params.gameId}
      />
    </div>
  )
} 