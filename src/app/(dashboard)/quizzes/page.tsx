import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import QuizListView from "@/components/quizzes/QuizListView";
import { listQuizzesForDashboard } from "@/modules/quiz/server/queries";

export default async function QuizzesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const quizzes = await listQuizzesForDashboard();

  return <QuizListView quizzes={quizzes} user={session.user} />;
}
