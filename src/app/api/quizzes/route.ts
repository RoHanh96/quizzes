import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { parseQuizCreateBody } from "@/modules/quiz/validation/quiz-create-body";
import { normalizeCrosswordQuestions } from "@/modules/quiz/validation/crossword-questions";

export async function POST(request: Request) {
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

    const { data } = parsed;
    const shareLink = nanoid();

    if (data.type === "crossword_basic" || data.type === "crossword_advanced") {
      const norm = data.normalizedCrosswordQuestions!;
      const layoutSeed =
        data.type === "crossword_advanced"
          ? Math.floor(Math.random() * 0x7fffffff)
          : null;
      const quiz = await prisma.quiz.create({
        data: {
          title: data.title,
          type: data.type,
          verticalWord: data.verticalWord ?? undefined,
          secretWord: data.secretWord ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          advancedLayoutSeed: layoutSeed ?? undefined,
          shareLink,
          creatorId: session.user.id,
          crosswordQuestions: {
            create: norm.map((q) => ({
              question: q.question,
              answer: q.answer,
              order: q.order,
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
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        type: data.type,
        shareLink,
        creatorId: session.user.id,
      },
      include: {
        crosswordQuestions: true,
      },
    });

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, type, verticalWord, secretWord, imageUrl, questions } = body;

    if (!id || !title || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    await prisma.crosswordQuestion.deleteMany({
      where: { quizId: id },
    });

    const updateData: Prisma.QuizUpdateInput = {
      title,
      type,
      verticalWord: verticalWord ?? null,
      secretWord: secretWord ?? null,
      imageUrl: imageUrl ?? null,
    };

    if (type === "crossword_basic" || type === "crossword_advanced") {
      const norm = normalizeCrosswordQuestions(
        questions,
        type,
        type === "crossword_basic" ? verticalWord : null
      );
      if (!norm.ok) {
        return NextResponse.json({ message: norm.message }, { status: 400 });
      }
      if (type === "crossword_advanced") {
        updateData.advancedLayoutSeed = Math.floor(Math.random() * 0x7fffffff);
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
      where: { id },
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
