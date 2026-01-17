import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
