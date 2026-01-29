import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: 'cmkzd34eg0001yfh0q3c11ndz' },
    include: {
      user: true,
      estimates: { select: { id: true, name: true, version: true } }
    }
  });

  console.log("=== PROJECT DETAILS ===");
  console.log(JSON.stringify(project, null, 2));

  // Check if default-user exists
  const defaultUser = await prisma.user.findUnique({
    where: { id: 'default-user' }
  });
  console.log("\n=== DEFAULT USER ===");
  console.log(JSON.stringify(defaultUser, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
