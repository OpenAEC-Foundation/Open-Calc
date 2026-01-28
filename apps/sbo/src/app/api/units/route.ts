import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van eenheden" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, symbol } = body;

    if (!code || !name || !symbol) {
      return NextResponse.json(
        { error: "Code, naam en symbool zijn verplicht" },
        { status: 400 }
      );
    }

    const existing = await prisma.unit.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Eenheid met code '" + code + "' bestaat al" },
        { status: 409 }
      );
    }

    const unit = await prisma.unit.create({
      data: { code, name, symbol },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van de eenheid" },
      { status: 500 }
    );
  }
}