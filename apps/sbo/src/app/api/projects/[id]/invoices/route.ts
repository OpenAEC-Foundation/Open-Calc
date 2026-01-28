import { NextResponse } from "next/server";
import { getDefaultUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createInvoiceSchema = z.object({
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  subtotal: z.number().min(0, "Subtotaal moet positief zijn"),
  vatPercent: z.number().min(0).max(100).default(21),
  clientId: z.string().nullable().optional(),
});

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `F-${year}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  });

  let seq = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.replace(prefix, ""), 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getDefaultUserId();
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const invoices = await prisma.invoice.findMany({
      where: { projectId: id },
      include: {
        client: true,
      },
      orderBy: { issueDate: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Fout bij ophalen facturen:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het ophalen van de facturen" },
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

    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: { client: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project niet gevonden" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = createInvoiceSchema.safeParse(body);

    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "Validatie fout" },
        { status: 400 }
      );
    }

    const { subtotal, vatPercent, clientId, description, notes } = validated.data;

    // Bereken BTW en totaalbedrag
    const vatAmount = Math.round(subtotal * (vatPercent / 100) * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;

    // Genereer factuurnummer
    const invoiceNumber = await generateInvoiceNumber();

    // Bepaal vervaldatum op basis van betalingstermijn klant
    const issueDate = new Date();
    const resolvedClient = project.client as { paymentTermDays?: number | null } | null;
    const paymentTermDays = resolvedClient?.paymentTermDays ?? 30;
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + paymentTermDays);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        projectId: id,
        clientId: clientId ?? project.clientId,
        subtotal,
        vatPercent,
        vatAmount,
        total,
        issueDate,
        dueDate,
        description,
        notes,
      },
      include: {
        client: true,
        project: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Fout bij aanmaken factuur:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden bij het aanmaken van de factuur" },
      { status: 500 }
    );
  }
}
