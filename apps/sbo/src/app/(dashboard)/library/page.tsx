import { prisma } from "@/lib/db";
import { LibraryBrowser } from "./library-browser";

async function getLibraries() {
  const libraries = await prisma.costLibrary.findMany({
    where: { isPublic: true },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { items: true } },
    },
  });

  return libraries;
}

async function getLibraryItems(libraryId?: string, categoryCode?: string, search?: string) {
  const where: Record<string, unknown> = {};

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
    take: 100,
    include: {
      category: { select: { code: true, name: true } },
      library: { select: { name: true, standard: true } },
    },
  });

  return items;
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ library?: string; category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const libraries = await getLibraries();
  const items = await getLibraryItems(params.library, params.category, params.search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kostenbibliotheek</h1>
        <p className="text-muted-foreground">
          Zoek en bekijk kostenposten uit NL-SfB, STABU en RAW bibliotheken
        </p>
      </div>

      <LibraryBrowser
        libraries={libraries}
        items={items}
        selectedLibrary={params.library}
        selectedCategory={params.category}
        searchQuery={params.search}
      />
    </div>
  );
}
