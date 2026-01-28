import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST: Create a new version by copying the current estimate
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    // Get the source estimate with all related data
    const sourceEstimate = await prisma.estimate.findFirst({
      where: {
        id: estimateId,
        projectId,
        project: { userId },
      },
      include: {
        chapters: {
          include: {
            lines: true,
          },
        },
        lines: {
          where: { chapterId: null },
        },
      },
    });

    if (!sourceEstimate) {
      return NextResponse.json(
        { error: "Begroting niet gevonden" },
        { status: 404 }
      );
    }

    // Find the highest version number for estimates with the same name in this project
    const highestVersion = await prisma.estimate.findFirst({
      where: {
        projectId,
        name: sourceEstimate.name,
      },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const newVersion = (highestVersion?.version || 0) + 1;

    // Create the new estimate (copy)
    const newEstimate = await prisma.estimate.create({
      data: {
        name: sourceEstimate.name,
        version: newVersion,
        description: sourceEstimate.description,
        status: "DRAFT", // New versions always start as draft
        projectId,
        // Copy markup settings
        generalCostsPercent: sourceEstimate.generalCostsPercent,
        profitPercent: sourceEstimate.profitPercent,
        riskPercent: sourceEstimate.riskPercent,
        vatPercent: sourceEstimate.vatPercent,
        notes: sourceEstimate.notes,
      },
    });

    // Create a mapping from old chapter IDs to new chapter IDs
    const chapterIdMap = new Map<string, string>();

    // Copy chapters
    for (const chapter of sourceEstimate.chapters) {
      const newChapter = await prisma.estimateChapter.create({
        data: {
          code: chapter.code,
          name: chapter.name,
          sortOrder: chapter.sortOrder,
          estimateId: newEstimate.id,
        },
      });
      chapterIdMap.set(chapter.id, newChapter.id);

      // Copy lines within this chapter
      for (const line of chapter.lines) {
        await prisma.estimateLine.create({
          data: {
            code: line.code,
            description: line.description,
            specification: line.specification,
            quantity: line.quantity,
            unit: line.unit,
            laborHours: line.laborHours,
            laborRate: line.laborRate,
            laborCost: line.laborCost,
            materialCost: line.materialCost,
            equipmentCost: line.equipmentCost,
            subcontrCost: line.subcontrCost,
            unitPrice: line.unitPrice,
            totalPrice: line.totalPrice,
            sortOrder: line.sortOrder,
            notes: line.notes,
            libraryItemId: line.libraryItemId,
            estimateId: newEstimate.id,
            chapterId: newChapter.id,
          },
        });
      }
    }

    // Copy unassigned lines (lines without a chapter)
    for (const line of sourceEstimate.lines) {
      await prisma.estimateLine.create({
        data: {
          code: line.code,
          description: line.description,
          specification: line.specification,
          quantity: line.quantity,
          unit: line.unit,
          laborHours: line.laborHours,
          laborRate: line.laborRate,
          laborCost: line.laborCost,
          materialCost: line.materialCost,
          equipmentCost: line.equipmentCost,
          subcontrCost: line.subcontrCost,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          sortOrder: line.sortOrder,
          notes: line.notes,
          libraryItemId: line.libraryItemId,
          estimateId: newEstimate.id,
          chapterId: null,
        },
      });
    }

    return NextResponse.json(newEstimate, { status: 201 });
  } catch (error) {
    console.error("Error creating new version:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van de nieuwe versie" },
      { status: 500 }
    );
  }
}
