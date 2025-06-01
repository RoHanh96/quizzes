import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, verticalWord, secretWord, imageUrl, questions } = body;

    // Delete existing questions
    await prisma.crosswordQuestion.deleteMany({
      where: {
        quizId: params.quizId,
      },
    });

    // Update quiz and create new questions
    const quiz = await prisma.quiz.update({
      where: {
        id: params.quizId,
      },
      data: {
        title,
        verticalWord,
        secretWord,
        imageUrl,
        crosswordQuestions: {
          create: questions.map((q: any) => ({
            question: q.question,
            answer: q.answer,
            order: q.order,
          })),
        },
      },
      include: {
        crosswordQuestions: true,
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { quizId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    await prisma.quiz.delete({
      where: {
        id: params.quizId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUIZ_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
