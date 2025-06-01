import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, type, verticalWord, secretWord, imageUrl, questions } = body;

    if (!title || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        type,
        verticalWord,
        secretWord,
        imageUrl,
        creatorId: session.user.id,
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
    const { id, title, type, verticalWord, imageUrl, questions } = body;

    if (!id || !title || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Xóa các câu hỏi cũ
    await prisma.crosswordQuestion.deleteMany({
      where: { quizId: id },
    });

    // Cập nhật quiz và tạo câu hỏi mới
    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title,
        type,
        verticalWord,
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
