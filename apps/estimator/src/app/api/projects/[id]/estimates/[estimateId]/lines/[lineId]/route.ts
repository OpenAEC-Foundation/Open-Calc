import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string; lineId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId, lineId } = await params;

    // Verify line belongs to user's estimate
    const line = await prisma.estimateLine.findFirst({
      where: {
        id: lineId,
        estimateId,
        estimate: {
          projectId,
          project: { userId },
        },
      },
    });

    if (!line) {
      return NextResponse.json({ error: "Regel niet gevonden" }, { status: 404 });
    }

    // Delete line
    await prisma.estimateLine.delete({
      where: { id: lineId },
    });

    // Update estimate totals
    await updateEstimateTotals(estimateId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting line:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen van de regel" },
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
