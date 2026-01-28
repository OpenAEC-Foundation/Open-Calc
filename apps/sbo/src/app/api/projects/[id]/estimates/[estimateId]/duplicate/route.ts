import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST: Duplicate/copy an estimate to the same or another project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    // Parse optional body parameters
    const body = await request.json().catch(() => ({}));
    const targetProjectId = body.targetProjectId || projectId;
    const customName = body.name;
    // Verify source project ownership
    const sourceProject = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!sourceProject) {
      return NextResponse.json(
        { error: "Bronproject niet gevonden" },
        { status: 404 }
      );
    }

    // If copying to a different project, verify target project ownership
    if (targetProjectId !== projectId) {
      const targetProject = await prisma.project.findFirst({
        where: { id: targetProjectId, userId },
      });

      if (!targetProject) {
        return NextResponse.json(
          { error: "Doelproject niet gevonden" },
          { status: 404 }
        );
      }
    }
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

    // Determine the name for the copy
    const newName = customName || `${sourceEstimate.name} (kopie)`;
    // Create the new estimate (independent copy)
    const newEstimate = await prisma.estimate.create({
      data: {
        name: newName,
        version: 1,
        description: sourceEstimate.description,
        status: "DRAFT",
        projectId: targetProjectId,
        // Copy markup settings
        generalCostsPercent: sourceEstimate.generalCostsPercent,
        profitPercent: sourceEstimate.profitPercent,
        riskPercent: sourceEstimate.riskPercent,
        vatPercent: sourceEstimate.vatPercent,
        notes: sourceEstimate.notes,
        // Copy offertespecificatie fields
        offerWorkDescription: sourceEstimate.offerWorkDescription,
        offerMaterials: sourceEstimate.offerMaterials,
        offerEquipment: sourceEstimate.offerEquipment,
        offerExclusions: sourceEstimate.offerExclusions,
        offerExtraWorkRate: sourceEstimate.offerExtraWorkRate,
        offerExtraWorkTerms: sourceEstimate.offerExtraWorkTerms,
        offerPaymentTerms: sourceEstimate.offerPaymentTerms,
        offerValidityWeeks: sourceEstimate.offerValidityWeeks,
        offerPlanningNotes: sourceEstimate.offerPlanningNotes,
      },
    });
    // Copy chapters and their lines
    for (const chapter of sourceEstimate.chapters) {
      const newChapter = await prisma.estimateChapter.create({
        data: {
          code: chapter.code,
          name: chapter.name,
          sortOrder: chapter.sortOrder,
          estimateId: newEstimate.id,
        },
      });

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

    // Return the new estimate with chapters and lines
    const result = await prisma.estimate.findUnique({
      where: { id: newEstimate.id },
      include: {
        chapters: {
          include: { lines: true },
        },
        lines: { where: { chapterId: null } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error duplicating estimate:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het dupliceren van de begroting" },
      { status: 500 }
    );
  }
}
