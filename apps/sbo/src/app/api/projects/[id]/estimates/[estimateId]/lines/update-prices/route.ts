import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Preview which lines can be updated
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    // Verify estimate belongs to user
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

    // Fetch all lines with library items
    const lines = await prisma.estimateLine.findMany({
      where: {
        estimateId,
        libraryItemId: { not: null },
      },
      include: {
        libraryItem: true,
        chapter: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { chapter: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    });

    const updatableLines = [];

    for (const line of lines) {
      if (!line.libraryItem) continue;

      const lib = line.libraryItem;
      const newLaborCost = lib.laborHours * lib.laborRate;
      const newUnitPrice = newLaborCost + lib.materialCost + lib.equipmentCost + lib.subcontrCost;

      // Check if anything changed
      const hasChanges = !(
        line.laborHours === lib.laborHours &&
        line.laborRate === lib.laborRate &&
        line.materialCost === lib.materialCost &&
        line.equipmentCost === lib.equipmentCost &&
        line.subcontrCost === lib.subcontrCost
      );

      if (hasChanges) {
        const oldUnitPrice = line.unitPrice;
        const priceDiff = newUnitPrice - oldUnitPrice;
        const priceDiffPercent = oldUnitPrice > 0 ? (priceDiff / oldUnitPrice) * 100 : 0;

        updatableLines.push({
          id: line.id,
          description: line.description,
          code: line.code,
          quantity: line.quantity,
          unit: line.unit,
          chapterCode: line.chapter?.code || null,
          chapterName: line.chapter?.name || null,
          currentUnitPrice: oldUnitPrice,
          newUnitPrice: newUnitPrice,
          priceDiff: priceDiff,
          priceDiffPercent: priceDiffPercent,
          currentTotal: line.totalPrice,
          newTotal: newUnitPrice * line.quantity,
        });
      }
    }

    return NextResponse.json({
      updatableLines,
      totalWithLibrary: lines.length,
    });
  } catch (error) {
    console.error("Error fetching updatable prices:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

// POST - Update selected lines (or all if no lineIds provided)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; estimateId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id: projectId, estimateId } = await params;

    // Parse request body for optional line IDs
    let lineIds: string[] | null = null;
    try {
      const body = await request.json();
      if (body.lineIds && Array.isArray(body.lineIds)) {
        lineIds = body.lineIds;
      }
    } catch {
      // No body or invalid JSON, update all lines
    }

    // Verify estimate belongs to user
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

    // Fetch lines with library items (optionally filtered by lineIds)
    const whereClause: {
      estimateId: string;
      libraryItemId: { not: null };
      id?: { in: string[] };
    } = {
      estimateId,
      libraryItemId: { not: null },
    };

    if (lineIds && lineIds.length > 0) {
      whereClause.id = { in: lineIds };
    }

    const lines = await prisma.estimateLine.findMany({
      where: whereClause,
      include: {
        libraryItem: true,
      },
    });

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const line of lines) {
      if (!line.libraryItem) continue;

      const lib = line.libraryItem;
      const newLaborCost = lib.laborHours * lib.laborRate;
      const newUnitPrice = newLaborCost + lib.materialCost + lib.equipmentCost + lib.subcontrCost;

      // Check if anything changed
      if (
        line.laborHours === lib.laborHours &&
        line.laborRate === lib.laborRate &&
        line.materialCost === lib.materialCost &&
        line.equipmentCost === lib.equipmentCost &&
        line.subcontrCost === lib.subcontrCost
      ) {
        unchangedCount++;
        continue;
      }

      const newTotalPrice = newUnitPrice * line.quantity;

      await prisma.estimateLine.update({
        where: { id: line.id },
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

      updatedCount++;
    }

    // Update estimate totals
    if (updatedCount > 0) {
      await updateEstimateTotals(estimateId);
    }

    const totalWithLibrary = await prisma.estimateLine.count({
      where: { estimateId, libraryItemId: { not: null } },
    });
    const totalWithoutLibrary = await prisma.estimateLine.count({
      where: { estimateId, libraryItemId: null },
    });

    return NextResponse.json({
      updatedCount,
      unchangedCount,
      totalWithLibrary,
      totalWithoutLibrary,
      message: updatedCount > 0
        ? `${updatedCount} regel(s) bijgewerkt, ${unchangedCount} ongewijzigd`
        : `Alle ${unchangedCount} prijzen zijn al actueel`,
    });
  } catch (error) {
    console.error("Error updating prices:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de prijzen" },
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
