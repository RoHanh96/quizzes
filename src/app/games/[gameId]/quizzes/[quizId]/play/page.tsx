import { notFound } from "next/navigation"
import { getQuizById } from "@/lib/quiz"
import CrosswordGame from "@/components/games/CrosswordGame"

interface PlayQuizPageProps {
  params: {
    gameId: string
    quizId: string
  }
}

export default async function PlayQuizPage({ params }: PlayQuizPageProps) {
  const quiz = await getQuizById(params.quizId)
  if (!quiz) notFound()

  return (
    <div className="container mx-auto py-8">
      <CrosswordGame
        title={quiz.title}
        type={quiz.type as "crossword_basic" | "crossword_advanced"}
        verticalWord={quiz.verticalWord || undefined}
        imageUrl={quiz.imageUrl || undefined}
        questions={quiz.crosswordQuestions}
        gameId={params.gameId}
      />
    </div>
  )
} 