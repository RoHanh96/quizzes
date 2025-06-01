import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { gameId: string; quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, verticalWord, imageUrl, questions } = body;

    // Validate the quiz exists and belongs to the game
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: params.quizId,
        gameId: params.gameId,
      },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    // Update quiz and its questions
    const updatedQuiz = await prisma.$transaction(async (tx) => {
      // Delete existing questions
      await tx.crosswordQuestion.deleteMany({
        where: { quizId: params.quizId },
      });

      // Update quiz and create new questions
      return tx.quiz.update({
        where: { id: params.quizId },
        data: {
          title,
          verticalWord,
          imageUrl,
          crosswordQuestions: {
            create: questions.map((q: any) => ({
              question: q.question,
              answer: q.answer,
              position: q.position,
              letterIndex: q.letterIndex,
            })),
          },
        },
        include: {
          crosswordQuestions: true,
        },
      });
    });

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("[QUIZ_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { gameId: string; quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete quiz and its questions (cascade delete will handle questions)
    await prisma.quiz.delete({
      where: {
        id: params.quizId,
        gameId: params.gameId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUIZ_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { gameId: string; quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: params.quizId,
        gameId: params.gameId,
      },
      include: {
        crosswordQuestions: {
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
