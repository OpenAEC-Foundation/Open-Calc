import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string; chapterId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, estimateId, chapterId } = await params;

    // Verify chapter belongs to user's estimate
    const chapter = await prisma.estimateChapter.findFirst({
      where: {
        id: chapterId,
        estimateId,
        estimate: {
          projectId,
          project: { userId: session.user.id },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Hoofdstuk niet gevonden" }, { status: 404 });
    }

    // Delete chapter (lines will be cascade deleted)
    await prisma.estimateChapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen van het hoofdstuk" },
      { status: 500 }
    );
  }
}
