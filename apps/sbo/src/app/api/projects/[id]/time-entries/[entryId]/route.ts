import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateTimeEntrySchema = z.object({
  date: z.string().min(1, "Datum is verplicht").optional(),
  hours: z.number().positive("Uren moet groter dan 0 zijn").optional(),
  description: z.string().min(1, "Omschrijving is verplicht").optional(),
  costCategory: z.string().min(1, "Kostencategorie is verplicht").optional(),
  hourlyRate: z.number().nonnegative("Uurtarief mag niet negatief zijn").optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, entryId } = await params;

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

    // Controleer of de urenregistratie bestaat
    const existingEntry = await prisma.timeEntry.findFirst({
      where: { id: entryId, projectId: id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Urenregistratie niet gevonden" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateTimeEntrySchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { ...validated.data };

    // Converteer datum string naar Date object indien aanwezig
    if (validated.data.date) {
      updateData.date = new Date(validated.data.date);
    }

    // Herbereken totalCost
    const hours = validated.data.hours ?? existingEntry.hours;
    const hourlyRate = validated.data.hourlyRate ?? existingEntry.hourlyRate;
    updateData.totalCost = hours * hourlyRate;

    const timeEntry = await prisma.timeEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("Fout bij bijwerken urenregistratie:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de urenregistratie" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, entryId } = await params;

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

    // Controleer of de urenregistratie bestaat
    const existingEntry = await prisma.timeEntry.findFirst({
      where: { id: entryId, projectId: id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Urenregistratie niet gevonden" },
        { status: 404 }
      );
    }

    await prisma.timeEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij verwijderen urenregistratie:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen van de urenregistratie" },
      { status: 500 }
    );
  }
}
