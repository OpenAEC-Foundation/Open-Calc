import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDefaultUserId } from "@/lib/auth";

// GET /api/clients - Get all clients
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const clients = await prisma.client.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: Request) {
  try {
    await getDefaultUserId(); // Ensure user exists

    const body = await request.json();

    const client = await prisma.client.create({
      data: {
        name: body.name,
        contactPerson: body.contactPerson || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        notes: body.notes || null,
        type: body.type || "CUSTOMER",
        website: body.website || null,
        vatNumber: body.vatNumber || null,
        kvkNumber: body.kvkNumber || null,
        paymentTermDays: body.paymentTermDays ? parseInt(body.paymentTermDays) : 30,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
