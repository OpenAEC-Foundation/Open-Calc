import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createChapterSchema = z.object({
  code: z.string().min(1, "Code is verplicht"),
  name: z.string().min(1, "Naam is verplicht"),
  parentId: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, estimateId } = await params;

    // Verify estimate belongs to user's project
    const estimate = await prisma.estimate.findFirst({
      where: {
        id: estimateId,
        projectId,
        project: { userId: session.user.id },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Begroting niet gevonden" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createChapterSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    // Get the highest sort order
    const lastChapter = await prisma.estimateChapter.findFirst({
      where: { estimateId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const chapter = await prisma.estimateChapter.create({
      data: {
        ...validated.data,
        estimateId,
        sortOrder: (lastChapter?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error("Error creating chapter:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van het hoofdstuk" },
      { status: 500 }
    );
  }
}
