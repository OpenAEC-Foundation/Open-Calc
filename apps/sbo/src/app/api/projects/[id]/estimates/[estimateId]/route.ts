import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateEstimateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
  generalCostsPercent: z.number().min(0).max(100).optional(),
  profitPercent: z.number().min(0).max(100).optional(),
  riskPercent: z.number().min(0).max(100).optional(),
  vatPercent: z.number().min(0).max(100).optional(),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // Offertespecificatie velden
  offerWorkDescription: z.string().optional().nullable(),
  offerMaterials: z.string().optional().nullable(),
  offerEquipment: z.string().optional().nullable(),
  offerExclusions: z.string().optional().nullable(),
  offerExtraWorkRate: z.number().min(0).optional().nullable(),
  offerExtraWorkTerms: z.string().optional().nullable(),
  offerPaymentTerms: z.string().optional().nullable(),
  offerValidityWeeks: z.number().min(1).max(52).optional(),
  offerPlanningNotes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    const estimate = await prisma.estimate.findFirst({
      where: {
        id: estimateId,
        projectId,
        project: { userId },
      },
      include: {
        project: {
          select: { id: true, name: true, projectNumber: true },
        },
        chapters: {
          orderBy: { sortOrder: "asc" },
          include: {
            lines: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        lines: {
          where: { chapterId: null },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Begroting niet gevonden" }, { status: 404 });
    }

    return NextResponse.json(estimate);
  } catch (error) {
    console.error("Error fetching estimate:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van de begroting" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    // Verify estimate belongs to user's project
    const existingEstimate = await prisma.estimate.findFirst({
      where: {
        id: estimateId,
        projectId,
        project: { userId },
      },
    });

    if (!existingEstimate) {
      return NextResponse.json({ error: "Begroting niet gevonden" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateEstimateSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...validated.data };

    // Handle validUntil date conversion
    if (validated.data.validUntil !== undefined) {
      updateData.validUntil = validated.data.validUntil
        ? new Date(validated.data.validUntil)
        : null;
    }

    const estimate = await prisma.estimate.update({
      where: { id: estimateId },
      data: updateData,
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error("Error updating estimate:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de begroting" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    // Verify estimate belongs to user's project
    const estimate = await prisma.estimate.findFirst({
      where: {
        id: estimateId,
        projectId,
        project: { userId },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: "Begroting niet gevonden" }, { status: 404 });
    }

    await prisma.estimate.delete({
      where: { id: estimateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting estimate:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen van de begroting" },
      { status: 500 }
    );
  }
}
