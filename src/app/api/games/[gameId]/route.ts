import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !description) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const game = await prisma.game.update({
      where: { id: params.gameId },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("[GAME_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.game.delete({
      where: { id: params.gameId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[GAME_DELETE]", error);
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

    const game = await prisma.game.findUnique({
      where: { id: params.gameId },
      include: {
        quizzes: {
          include: {
            crosswordQuestions: true,
          },
        },
      },
    });

    if (!game) {
      return new NextResponse("Game not found", { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("[GAME_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
