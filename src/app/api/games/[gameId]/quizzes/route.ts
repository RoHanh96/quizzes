import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

export async function POST(
  req: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, verticalWord, imageUrl, questions } = body;

    // Validate the game exists
    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
    });

    if (!game) {
      return new NextResponse("Game not found", { status: 404 });
    }

    // Create the quiz with crossword questions
    const quiz = await prisma.quiz.create({
      data: {
        title,
        verticalWord,
        imageUrl,
        questions: JSON.stringify([]), // We'll store the actual questions in CrosswordQuestion model
        shareLink: nanoid(),
        gameId: params.gameId,
        creatorId: session.user.id,
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

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZZES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: {
        gameId: params.gameId,
      },
      include: {
        crosswordQuestions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("[QUIZZES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
