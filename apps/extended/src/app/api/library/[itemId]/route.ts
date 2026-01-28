import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  const item = await prisma.libraryItem.findUnique({
    where: { id: itemId },
    include: {
      library: {
        select: {
          id: true,
          name: true,
          standard: true,
          userId: true,
        },
      },
      category: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      images: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const body = await request.json();

  // Find the item
  const item = await prisma.libraryItem.findUnique({
    where: { id: itemId },
    include: {
      library: true,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Update allowed fields
  const allowedFields = [
    "code",
    "description",
    "specification",
    "offerText",
    "unit",
    "laborHours",
    "laborRate",
    "materialCost",
    "equipmentCost",
    "subcontrCost",
    "unitPrice",
    "notes",
    "isActive",
  ];

  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  // Recalculate unit price if cost fields are updated
  if (
    "laborHours" in updateData ||
    "laborRate" in updateData ||
    "materialCost" in updateData ||
    "equipmentCost" in updateData ||
    "subcontrCost" in updateData
  ) {
    const laborHours = (updateData.laborHours as number) ?? item.laborHours;
    const laborRate = (updateData.laborRate as number) ?? item.laborRate;
    const materialCost = (updateData.materialCost as number) ?? item.materialCost;
    const equipmentCost = (updateData.equipmentCost as number) ?? item.equipmentCost;
    const subcontrCost = (updateData.subcontrCost as number) ?? item.subcontrCost;

    updateData.unitPrice = laborHours * laborRate + materialCost + equipmentCost + subcontrCost;
    updateData.lastPriceUpdate = new Date();
  }

  const updated = await prisma.libraryItem.update({
    where: { id: itemId },
    data: updateData,
    include: {
      library: {
        select: {
          id: true,
          name: true,
          standard: true,
          userId: true,
        },
      },
      category: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      images: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json(updated);
}
