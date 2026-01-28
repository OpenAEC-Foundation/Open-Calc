import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string; lineId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId, lineId } = await params;

    // Fetch line with library item reference
    const line = await prisma.estimateLine.findFirst({
      where: {
        id: lineId,
        estimateId,
        estimate: {
          projectId,
          project: { userId },
        },
      },
      include: {
        libraryItem: true,
      },
    });

    if (!line) {
      return NextResponse.json({ error: "Regel niet gevonden" }, { status: 404 });
    }

    if (!line.libraryItemId || !line.libraryItem) {
      return NextResponse.json(
        { updated: false, message: "Deze regel is niet gekoppeld aan de kostenbibliotheek" },
        { status: 200 }
      );
    }

    const lib = line.libraryItem;

    // Check if prices actually changed
    const oldUnitPrice = line.unitPrice;
    const newLaborCost = lib.laborHours * lib.laborRate;
    const newUnitPrice = newLaborCost + lib.materialCost + lib.equipmentCost + lib.subcontrCost;

    if (
      line.laborHours === lib.laborHours &&
      line.laborRate === lib.laborRate &&
      line.materialCost === lib.materialCost &&
      line.equipmentCost === lib.equipmentCost &&
      line.subcontrCost === lib.subcontrCost
    ) {
      return NextResponse.json({
        updated: false,
        message: "De prijs is al actueel",
      });
    }

    // Update line with library prices
    const newTotalPrice = newUnitPrice * line.quantity;

    const updatedLine = await prisma.estimateLine.update({
      where: { id: lineId },
      data: {
        laborHours: lib.laborHours,
        laborRate: lib.laborRate,
        laborCost: newLaborCost,
        materialCost: lib.materialCost,
        equipmentCost: lib.equipmentCost,
        subcontrCost: lib.subcontrCost,
        unitPrice: newUnitPrice,
        totalPrice: newTotalPrice,
      },
    });

    // Update estimate totals
    await updateEstimateTotals(estimateId);

    return NextResponse.json({
      updated: true,
      oldUnitPrice,
      newUnitPrice,
      message: `Prijs bijgewerkt: ${formatCurrency(oldUnitPrice)} → ${formatCurrency(newUnitPrice)}`,
    });
  } catch (error) {
    console.error("Error updating price:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de prijs" },
      { status: 500 }
    );
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(value);
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
