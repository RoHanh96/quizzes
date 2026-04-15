import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { normalizeCrosswordQuestions } from "@/modules/quiz/validation/crossword-questions";

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
    const { title, type, verticalWord, secretWord, imageUrl, questions } = body;

    await prisma.crosswordQuestion.deleteMany({
      where: { quizId: params.quizId },
    });

    const updateData: Prisma.QuizUpdateInput = {
      title,
      type,
      verticalWord: verticalWord ?? null,
      secretWord: secretWord ?? null,
      imageUrl: imageUrl ?? null,
    };

    if (
      type === "crossword_basic" ||
      type === "crossword_advanced"
    ) {
      const norm = normalizeCrosswordQuestions(
        questions,
        type,
        type === "crossword_basic" ? verticalWord : null
      );
      if (!norm.ok) {
        return NextResponse.json({ message: norm.message }, { status: 400 });
      }
      updateData.crosswordQuestions = {
        create: norm.questions.map((q) => ({
          question: q.question,
          answer: q.answer,
          order: q.order,
          position: q.position,
          letterIndex: q.letterIndex,
        })),
      };
    }

    const quiz = await prisma.quiz.update({
      where: { id: params.quizId },
      data: updateData,
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
      where: { id: params.quizId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[QUIZ_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
