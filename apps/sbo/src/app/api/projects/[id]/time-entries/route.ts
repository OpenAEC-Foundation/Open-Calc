import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const timeEntrySchema = z.object({
  date: z.string().min(1, "Datum is verplicht"),
  hours: z.number().positive("Uren moet groter dan 0 zijn"),
  description: z.string().min(1, "Omschrijving is verplicht"),
  costCategory: z.string().min(1, "Kostencategorie is verplicht"),
  hourlyRate: z.number().nonnegative("Uurtarief mag niet negatief zijn"),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await params;

    // Controleer of het project bestaat en van de gebruiker is
    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId: id },
      orderBy: { date: "desc" },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(timeEntries);
  } catch (error) {
    console.error("Fout bij ophalen urenregistratie:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van de urenregistratie" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await params;

    // Controleer of het project bestaat en van de gebruiker is
    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = timeEntrySchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    const { date, hours, description, costCategory, hourlyRate } = validated.data;
    const totalCost = hours * hourlyRate;

    const timeEntry = await prisma.timeEntry.create({
      data: {
        date: new Date(date),
        hours,
        description,
        costCategory,
        hourlyRate,
        totalCost,
        projectId: id,
        userId,
      },
    });

    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    console.error("Fout bij aanmaken urenregistratie:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van de urenregistratie" },
      { status: 500 }
    );
  }
}
