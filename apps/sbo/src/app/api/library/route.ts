import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const libraryId = searchParams.get("library");
    const categoryCode = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {
      library: { isPublic: true },
    };

    if (libraryId) {
      where.libraryId = libraryId;
    }

    if (categoryCode) {
      where.code = { startsWith: categoryCode };
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const items = await prisma.libraryItem.findMany({
      where,
      orderBy: { code: "asc" },
      take: limit,
      include: {
        category: { select: { code: true, name: true } },
        library: { select: { name: true, standard: true } },
        _count: { select: { images: true } },
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching library items:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      libraryId,
      code,
      description,
      unit,
      laborHours,
      laborRate,
      materialCost,
      equipmentCost,
      subcontrCost,
      specification,
      offerText,
      categoryId,
    } = body;

    if (!libraryId || !code || !description) {
      return NextResponse.json(
        { error: "libraryId, code en description zijn verplicht" },
        { status: 400 }
      );
    }

    // Check if library exists
    const library = await prisma.costLibrary.findUnique({
      where: { id: libraryId },
    });

    if (!library) {
      return NextResponse.json(
        { error: "Bibliotheek niet gevonden" },
        { status: 404 }
      );
    }

    // Check if code already exists in this library
    const existingItem = await prisma.libraryItem.findFirst({
      where: {
        libraryId,
        code,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "Code bestaat al in deze bibliotheek" },
        { status: 400 }
      );
    }

    // Calculate unit price
    const hours = parseFloat(laborHours) || 0;
    const rate = parseFloat(laborRate) || 45;
    const material = parseFloat(materialCost) || 0;
    const equipment = parseFloat(equipmentCost) || 0;
    const subcontr = parseFloat(subcontrCost) || 0;
    const unitPrice = (hours * rate) + material + equipment + subcontr;

    // Create the item
    const item = await prisma.libraryItem.create({
      data: {
        libraryId,
        code,
        description,
        unit: unit || "st",
        laborHours: hours,
        laborRate: rate,
        materialCost: material,
        equipmentCost: equipment,
        subcontrCost: subcontr,
        unitPrice,
        specification: specification || null,
        offerText: offerText || null,
        categoryId: categoryId || null,
      },
      include: {
        category: { select: { code: true, name: true } },
        library: { select: { name: true, standard: true } },
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error creating library item:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken" },
      { status: 500 }
    );
  }
}
