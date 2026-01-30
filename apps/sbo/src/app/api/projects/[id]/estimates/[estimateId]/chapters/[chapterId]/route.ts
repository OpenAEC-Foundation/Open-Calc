import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string; chapterId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId, chapterId } = await params;
    const body = await request.json();

    // Verify chapter belongs to user's estimate
    const chapter = await prisma.estimateChapter.findFirst({
      where: {
        id: chapterId,
        estimateId,
        estimate: {
          projectId,
          project: { userId },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Hoofdstuk niet gevonden" }, { status: 404 });
    }

    // Update chapter
    const updated = await prisma.estimateChapter.update({
      where: { id: chapterId },
      data: {
        name: body.name ?? chapter.name,
        code: body.code ?? chapter.code,
        sortOrder: body.sortOrder ?? chapter.sortOrder,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating chapter:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van het hoofdstuk" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string; chapterId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId, chapterId } = await params;

    // Verify chapter belongs to user's estimate
    const chapter = await prisma.estimateChapter.findFirst({
      where: {
        id: chapterId,
        estimateId,
        estimate: {
          projectId,
          project: { userId },
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
