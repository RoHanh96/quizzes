import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuizListView from "@/components/quizzes/QuizListView";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/quizzes");
  }

  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      crosswordQuestions: true,
      creator: true,
    },
  });

  return <QuizListView quizzes={quizzes} user={session.user} />;
}
