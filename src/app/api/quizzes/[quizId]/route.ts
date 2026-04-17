import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { parseQuizCreateBody } from "@/modules/quiz/validation/quiz-create-body";

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
    const parsed = parseQuizCreateBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const d = parsed.data;

    await prisma.crosswordQuestion.deleteMany({
      where: { quizId: params.quizId },
    });
    await prisma.multipleChoiceQuestion.deleteMany({
      where: { quizId: params.quizId },
    });

    const updateData: Prisma.QuizUpdateInput = {
      title: d.title,
      type: d.type,
      verticalWord: d.verticalWord ?? null,
      secretWord: d.secretWord ?? null,
      imageUrl: d.imageUrl ?? null,
      playLength: d.type === "multiple_choice" ? d.playLength! : null,
    };

    if (d.type === "crossword_basic" || d.type === "crossword_advanced") {
      const norm = d.normalizedCrosswordQuestions!;
      if (d.type === "crossword_advanced") {
        updateData.advancedLayoutSeed = Math.floor(Math.random() * 0x7fffffff);
      }
      updateData.crosswordQuestions = {
        create: norm.map((q) => ({
          question: q.question,
          answer: q.answer,
          order: q.order,
          position: q.position,
          letterIndex: q.letterIndex,
        })),
      };
    } else if (d.type === "multiple_choice") {
      const norm = d.normalizedMcQuestions!;
      updateData.multipleChoiceQuestions = {
        create: norm.map((q) => ({
          question: q.question,
          options: JSON.stringify(q.options),
          answer: q.answer,
          difficulty: q.difficulty,
          order: q.order,
        })),
      };
    }

    const quiz = await prisma.quiz.update({
      where: { id: params.quizId },
      data: updateData,
      include: {
        crosswordQuestions: true,
        multipleChoiceQuestions: true,
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
