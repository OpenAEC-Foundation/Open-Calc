import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  subtotal: z.number().min(0, "Subtotaal moet positief zijn").optional(),
  paidDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, invoiceId } = await params;

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

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, projectId: id },
      include: {
        project: {
          include: { client: true },
        },
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factuur niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Fout bij ophalen factuur:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van de factuur" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, invoiceId } = await params;

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

    const existingInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, projectId: id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Factuur niet gevonden" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateInvoiceSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Kopieer velden die zijn meegegeven
    if (validated.data.status !== undefined) {
      updateData.status = validated.data.status;
    }
    if (validated.data.description !== undefined) {
      updateData.description = validated.data.description;
    }
    if (validated.data.notes !== undefined) {
      updateData.notes = validated.data.notes;
    }
    if (validated.data.paidDate !== undefined) {
      updateData.paidAt = validated.data.paidDate
        ? new Date(validated.data.paidDate)
        : null;
    }
    if (validated.data.dueDate !== undefined) {
      updateData.dueDate = validated.data.dueDate
        ? new Date(validated.data.dueDate)
        : undefined;
    }

    // Herbereken bedragen als subtotaal is gewijzigd
    if (validated.data.subtotal !== undefined) {
      const subtotal = validated.data.subtotal;
      const vatPercent = existingInvoice.vatPercent || 21;
      const vatAmount = Math.round(subtotal * (vatPercent / 100) * 100) / 100;
      const total = Math.round((subtotal + vatAmount) * 100) / 100;

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.total = total;
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        client: true,
        project: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Fout bij bijwerken factuur:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het bijwerken van de factuur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; invoiceId: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id, invoiceId } = await params;

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

    const existingInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, projectId: id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Factuur niet gevonden" },
        { status: 404 }
      );
    }

    // Alleen conceptfacturen mogen verwijderd worden
    if (existingInvoice.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Alleen conceptfacturen kunnen verwijderd worden" },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fout bij verwijderen factuur:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het verwijderen van de factuur" },
      { status: 500 }
    );
  }
}
