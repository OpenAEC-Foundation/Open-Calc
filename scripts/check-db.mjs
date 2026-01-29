import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { estimates: { select: { id: true, name: true, version: true } } }
  });

  console.log("=== PROJECTEN ===");
  for (const p of projects) {
    console.log(`\nProject: ${p.name}`);
    console.log(`  ID: ${p.id}`);
    console.log(`  Begrotingen:`);
    for (const e of p.estimates) {
      console.log(`    - ${e.name} (v${e.version}): ${e.id}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
