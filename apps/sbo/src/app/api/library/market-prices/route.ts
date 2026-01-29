import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Simulated market price data source
// In production, this would fetch from external APIs like:
// - Bouwkosten.nl
// - CROW kennisbank
// - BouwQ
// - Material supplier APIs
function getSimulatedMarketPrice(item: {
  code: string;
  laborHours: number;
  laborRate: number;
  materialCost: number;
  equipmentCost: number;
  subcontrCost: number;
  unitPrice: number;
}): {
  laborRate: number;
  materialCost: number;
  equipmentCost: number;
  subcontrCost: number;
  source: string;
  confidence: number;
} {
  // Simulate market price variations (3-12% difference)
  // In reality, this would come from external price databases
  // Use code hash for consistent results per item
  const codeHash = item.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseVariation = ((codeHash % 20) - 5) / 100; // -5% to +15% based on code

  const laborVariation = 1 + baseVariation + 0.03; // Always at least 3% change
  const materialVariation = 1 + baseVariation + 0.05; // Always at least 5% change
  const equipmentVariation = 1 + (baseVariation * 0.8) + 0.02;

  const newLaborRate = Math.round(item.laborRate * laborVariation * 100) / 100;
  const newMaterialCost = Math.round(item.materialCost * materialVariation * 100) / 100;
  const newEquipmentCost = Math.round(item.equipmentCost * equipmentVariation * 100) / 100;
  const newSubcontrCost = Math.round(item.subcontrCost * (1 + baseVariation * 0.5) * 100) / 100;

  // Simulate different sources based on item code
  const sources = [
    "Bouwkosten.nl Q1 2025",
    "CROW Kennisbank 2025",
    "BouwQ Index",
    "Materiaalgroothandel NL",
  ];

  return {
    laborRate: newLaborRate,
    materialCost: newMaterialCost,
    equipmentCost: newEquipmentCost,
    subcontrCost: newSubcontrCost,
    source: sources[codeHash % sources.length],
    confidence: 70 + (codeHash % 26), // 70-95% confidence
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const libraryId = searchParams.get("libraryId");
    const itemId = searchParams.get("itemId");

    if (!libraryId && !itemId) {
      return NextResponse.json(
        { error: "libraryId of itemId is verplicht" },
        { status: 400 }
      );
    }

    // Build query
    const where: Record<string, unknown> = {};
    if (libraryId) {
      where.libraryId = libraryId;
    }
    if (itemId) {
      where.id = itemId;
    }

    // Get items to check for price updates
    const items = await prisma.libraryItem.findMany({
      where,
      select: {
        id: true,
        code: true,
        description: true,
        unit: true,
        laborHours: true,
        laborRate: true,
        materialCost: true,
        equipmentCost: true,
        subcontrCost: true,
        unitPrice: true,
        lastPriceUpdate: true,
        library: {
          select: {
            id: true,
            name: true,
            standard: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    // Get market prices for each item
    const updates = items
      .map((item) => {
        const marketPrice = getSimulatedMarketPrice(item);

        // Calculate new unit price
        const newUnitPrice =
          item.laborHours * marketPrice.laborRate +
          marketPrice.materialCost +
          marketPrice.equipmentCost +
          marketPrice.subcontrCost;

        const priceDifference = newUnitPrice - item.unitPrice;
        const percentageChange = item.unitPrice > 0
          ? (priceDifference / item.unitPrice) * 100
          : 0;

        return {
          itemId: item.id,
          code: item.code,
          description: item.description,
          unit: item.unit,
          library: item.library,
          currentPrices: {
            laborRate: item.laborRate,
            materialCost: item.materialCost,
            equipmentCost: item.equipmentCost,
            subcontrCost: item.subcontrCost,
            unitPrice: item.unitPrice,
          },
          marketPrices: {
            laborRate: marketPrice.laborRate,
            materialCost: marketPrice.materialCost,
            equipmentCost: marketPrice.equipmentCost,
            subcontrCost: marketPrice.subcontrCost,
            unitPrice: newUnitPrice,
          },
          priceDifference,
          percentageChange: Math.round(percentageChange * 10) / 10,
          source: marketPrice.source,
          confidence: marketPrice.confidence,
          lastUpdate: item.lastPriceUpdate,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      totalItems: items.length,
      itemsWithUpdates: updates.length,
      updates,
    });
  } catch (error) {
    console.error("Error fetching market prices:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van marktprijzen" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemIds, updates } = body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "itemIds array is verplicht" },
        { status: 400 }
      );
    }

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "updates array is verplicht" },
        { status: 400 }
      );
    }

    // Create a map of updates by itemId
    const updateMap = new Map(
      updates.map((u: { itemId: string; marketPrices: { laborRate: number; materialCost: number; equipmentCost: number; subcontrCost: number; unitPrice: number } }) => [u.itemId, u])
    );

    // Update each selected item
    const results = await Promise.all(
      itemIds.map(async (itemId: string) => {
        const update = updateMap.get(itemId);
        if (!update) return null;

        const marketPrices = update.marketPrices as {
          laborRate: number;
          materialCost: number;
          equipmentCost: number;
          subcontrCost: number;
          unitPrice: number;
        };

        return prisma.libraryItem.update({
          where: { id: itemId },
          data: {
            laborRate: marketPrices.laborRate,
            materialCost: marketPrices.materialCost,
            equipmentCost: marketPrices.equipmentCost,
            subcontrCost: marketPrices.subcontrCost,
            unitPrice: marketPrices.unitPrice,
            lastPriceUpdate: new Date(),
          },
        });
      })
    );

    const updatedCount = results.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `${updatedCount} item(s) bijgewerkt met marktprijzen`,
    });
  } catch (error) {
    console.error("Error updating market prices:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van prijzen" },
      { status: 500 }
    );
  }
}
