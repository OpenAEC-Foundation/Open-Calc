import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createLineSchema = z.object({
  chapterId: z.string().nullable().optional(),
  code: z.string().optional(),
  description: z.string().min(1, "Omschrijving is verplicht"),
  specification: z.string().optional(),
  quantity: z.number().min(0).default(1),
  unit: z.string().default("st"),
  laborHours: z.number().min(0).default(0),
  laborRate: z.number().min(0).default(45),
  laborCost: z.number().min(0).default(0),
  materialCost: z.number().min(0).default(0),
  equipmentCost: z.number().min(0).default(0),
  subcontrCost: z.number().min(0).default(0),
  unitPrice: z.number().min(0).default(0),
  totalPrice: z.number().min(0).default(0),
  libraryItemId: z.string().optional(),
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
    const validated = createLineSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    // If chapterId is provided, verify it belongs to this estimate
    if (validated.data.chapterId) {
      const chapter = await prisma.estimateChapter.findFirst({
        where: { id: validated.data.chapterId, estimateId },
      });

      if (!chapter) {
        return NextResponse.json({ error: "Hoofdstuk niet gevonden" }, { status: 404 });
      }
    }

    // Get the highest sort order for the target (chapter or estimate)
    const lastLine = await prisma.estimateLine.findFirst({
      where: {
        estimateId,
        chapterId: validated.data.chapterId || null,
      },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const line = await prisma.estimateLine.create({
      data: {
        ...validated.data,
        estimateId,
        sortOrder: (lastLine?.sortOrder || 0) + 1,
      },
    });

    // Update estimate totals
    await updateEstimateTotals(estimateId);

    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    console.error("Error creating line:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van de regel" },
      { status: 500 }
    );
  }
}

async function updateEstimateTotals(estimateId: string) {
  const lines = await prisma.estimateLine.findMany({
    where: { estimateId },
  });

  const totalLabor = lines.reduce((sum, line) => sum + line.laborCost * line.quantity, 0);
  const totalMaterial = lines.reduce((sum, line) => sum + line.materialCost * line.quantity, 0);
  const totalEquipment = lines.reduce((sum, line) => sum + line.equipmentCost * line.quantity, 0);
  const totalSubcontr = lines.reduce((sum, line) => sum + line.subcontrCost * line.quantity, 0);
  const subtotal = totalLabor + totalMaterial + totalEquipment + totalSubcontr;

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
  });

  if (!estimate) return;

  const generalCostsAmount = subtotal * (estimate.generalCostsPercent / 100);
  const profitAmount = (subtotal + generalCostsAmount) * (estimate.profitPercent / 100);
  const riskAmount = (subtotal + generalCostsAmount + profitAmount) * (estimate.riskPercent / 100);
  const totalExclVat = subtotal + generalCostsAmount + profitAmount + riskAmount;
  const vatAmount = totalExclVat * (estimate.vatPercent / 100);
  const totalInclVat = totalExclVat + vatAmount;

  await prisma.estimate.update({
    where: { id: estimateId },
    data: {
      totalLabor,
      totalMaterial,
      totalEquipment,
      totalSubcontr,
      subtotal,
      generalCostsAmount,
      profitAmount,
      riskAmount,
      totalExclVat,
      vatAmount,
      totalInclVat,
    },
  });
}
