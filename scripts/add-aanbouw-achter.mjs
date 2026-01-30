import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the estimate
  const estimate = await prisma.estimate.findFirst({
    where: { project: { name: { contains: "Lepelaarssingel" } } },
    include: { chapters: true }
  });

  if (!estimate) {
    console.log("Begroting niet gevonden");
    return;
  }

  console.log(`Begroting gevonden: ${estimate.id}`);

  // Check if chapter already exists
  let chapter = estimate.chapters.find(c => c.code === "20");

  if (!chapter) {
    // Get highest sortOrder and insert after chapter 10 (Sloopwerk)
    const ch10 = estimate.chapters.find(c => c.code === "10");
    const newSortOrder = ch10 ? ch10.sortOrder + 1 : 3;

    // Update sortOrder of all chapters after this
    await prisma.estimateChapter.updateMany({
      where: {
        estimateId: estimate.id,
        sortOrder: { gte: newSortOrder }
      },
      data: { sortOrder: { increment: 1 } }
    });

    chapter = await prisma.estimateChapter.create({
      data: {
        code: "20",
        name: "Aanbouw achterzijde (3 x 3,5m op onderheid terras)",
        sortOrder: newSortOrder,
        estimateId: estimate.id
      }
    });
    console.log(`Hoofdstuk aangemaakt: ${chapter.code} - ${chapter.name}`);
  } else {
    // Delete existing lines in this chapter
    await prisma.estimateLine.deleteMany({ where: { chapterId: chapter.id } });
    console.log(`Bestaande regels verwijderd uit hoofdstuk ${chapter.code}`);
  }

  // Helper to create lines
  let sortOrder = 0;
  async function addLine(description, options = {}) {
    const laborHours = options.laborHours || 0;
    const laborRate = options.laborRate || 55;
    const laborCost = laborHours * laborRate;
    const materialCost = options.materialCost || 0;
    const equipmentCost = options.equipmentCost || 0;
    const subcontrCost = options.subcontrCost || 0;
    const unitPrice = laborCost + materialCost + equipmentCost + subcontrCost;
    const quantity = options.quantity || 1;
    const totalPrice = unitPrice * quantity;

    sortOrder++;
    return prisma.estimateLine.create({
      data: {
        description,
        specification: options.specification,
        quantity,
        unit: options.unit || "st",
        laborHours,
        laborRate,
        laborCost,
        materialCost,
        equipmentCost,
        subcontrCost,
        unitPrice,
        totalPrice,
        sortOrder,
        estimateId: estimate.id,
        chapterId: chapter.id
      }
    });
  }

  // Aanbouw 3 x 3,5m = 10,5 m2 vloeroppervlak
  // Op onderheid terras - dus geen fundering nodig
  // Aansluitend aan 2 zijden bestaande woning
  // Vrije wanden: 2 zijden (3m + 3,5m = 6,5m1)
  // Kozijnen zijn al in begroting

  // Wanden
  await addLine("Buitenwanden aanbouw houtskelet geïsoleerd", {
    quantity: 13, // 2 wanden: (3m + 3,5m) x 2m hoog = 13 m2
    unit: "m2",
    laborHours: 1.8,
    materialCost: 145,
    specification: "Vrije zijden (3m + 3,5m), h=2m, houtskelet met isolatie en dampscherm"
  });

  await addLine("Gevelbekleding aanbouw Keralit", {
    quantity: 13,
    unit: "m2",
    laborHours: 1.0,
    materialCost: 85,
    specification: "Passend bij bestaande gevelbekleding"
  });

  await addLine("Aansluiting op bestaande gevel (2 zijden)", {
    quantity: 2,
    unit: "st",
    laborHours: 6,
    materialCost: 180,
    specification: "Waterdichte aansluiting, incl. kitwerk en afwerking"
  });

  // Dak
  await addLine("Dakconstructie aanbouw plat dak", {
    quantity: 10.5, // 3 x 3,5m
    unit: "m2",
    laborHours: 2.0,
    materialCost: 85,
    specification: "Houten gordingen/spanten, aansluitend op bestaand"
  });

  await addLine("Dakbeschot en dampscherm", {
    quantity: 10.5,
    unit: "m2",
    laborHours: 0.6,
    materialCost: 35
  });

  await addLine("Dakisolatie PIR Rc 6.0", {
    quantity: 10.5,
    unit: "m2",
    laborHours: 0.4,
    materialCost: 55,
    specification: "120mm PIR isolatie"
  });

  await addLine("Dakbedekking EPDM", {
    quantity: 12, // iets meer voor opstand
    unit: "m2",
    laborHours: 0.8,
    materialCost: 45,
    specification: "EPDM dakbedekking incl. opstand en afwerking"
  });

  await addLine("Dakaansluiting op bestaande woning", {
    quantity: 1,
    unit: "st",
    laborHours: 8,
    materialCost: 250,
    specification: "Loodslabben, waterdichte aansluiting"
  });

  await addLine("Boeiboorden en windveren", {
    quantity: 6.5, // omtrek vrije zijden
    unit: "m1",
    laborHours: 0.8,
    materialCost: 35
  });

  // Binnenzijde
  await addLine("Plafondafwerking aanbouw (gipsplaat)", {
    quantity: 10.5,
    unit: "m2",
    laborHours: 0.8,
    materialCost: 28
  });

  await addLine("Binnenwandafwerking (gipsplaat op regelwerk)", {
    quantity: 13,
    unit: "m2",
    laborHours: 0.6,
    materialCost: 25,
    specification: "Vrije wanden binnenzijde"
  });

  console.log(`${sortOrder} regels toegevoegd aan hoofdstuk ${chapter.code}`);

  // Update chapter totals
  const lines = await prisma.estimateLine.findMany({ where: { chapterId: chapter.id } });
  const chapterTotals = lines.reduce((acc, line) => ({
    totalLabor: acc.totalLabor + (line.laborCost || 0) * (line.quantity || 1),
    totalMaterial: acc.totalMaterial + (line.materialCost || 0) * (line.quantity || 1),
    totalEquipment: acc.totalEquipment + (line.equipmentCost || 0) * (line.quantity || 1),
    totalSubcontr: acc.totalSubcontr + (line.subcontrCost || 0) * (line.quantity || 1),
  }), { totalLabor: 0, totalMaterial: 0, totalEquipment: 0, totalSubcontr: 0 });

  const chapterSubtotal = chapterTotals.totalLabor + chapterTotals.totalMaterial + chapterTotals.totalEquipment + chapterTotals.totalSubcontr;

  await prisma.estimateChapter.update({
    where: { id: chapter.id },
    data: { ...chapterTotals, subtotal: chapterSubtotal }
  });

  console.log(`Hoofdstuk subtotaal: € ${chapterSubtotal.toFixed(2)}`);

  // Update estimate totals
  const allLines = await prisma.estimateLine.findMany({ where: { estimateId: estimate.id } });
  const totals = allLines.reduce((acc, line) => ({
    totalLabor: acc.totalLabor + (line.laborCost || 0) * (line.quantity || 1),
    totalMaterial: acc.totalMaterial + (line.materialCost || 0) * (line.quantity || 1),
    totalEquipment: acc.totalEquipment + (line.equipmentCost || 0) * (line.quantity || 1),
    totalSubcontr: acc.totalSubcontr + (line.subcontrCost || 0) * (line.quantity || 1),
  }), { totalLabor: 0, totalMaterial: 0, totalEquipment: 0, totalSubcontr: 0 });

  const subtotal = totals.totalLabor + totals.totalMaterial + totals.totalEquipment + totals.totalSubcontr;
  const generalCostsAmount = subtotal * (estimate.generalCostsPercent || 0) / 100;
  const profitAmount = (subtotal + generalCostsAmount) * (estimate.profitPercent || 0) / 100;
  const riskAmount = (subtotal + generalCostsAmount + profitAmount) * (estimate.riskPercent || 0) / 100;
  const totalExclVat = subtotal + generalCostsAmount + profitAmount + riskAmount;
  const vatAmount = totalExclVat * (estimate.vatPercent || 21) / 100;
  const totalInclVat = totalExclVat + vatAmount;

  await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      ...totals,
      subtotal,
      generalCostsAmount,
      profitAmount,
      riskAmount,
      totalExclVat,
      vatAmount,
      totalInclVat,
    }
  });

  console.log("\n========================================");
  console.log("AANBOUW ACHTERZIJDE TOEGEVOEGD");
  console.log("========================================");
  console.log("Hoofdstuk 20: Aanbouw achterzijde (3 x 3,5m)");
  console.log(`  - Op onderheid terras (geen fundering nodig)`);
  console.log(`  - Aansluitend 2 zijden bestaande woning`);
  console.log(`  - Wanden + dak toegevoegd`);
  console.log(`  - Kozijnen waren al in begroting (hfdst 31)`);
  console.log("----------------------------------------");
  console.log(`Hoofdstuk subtotaal: € ${chapterSubtotal.toFixed(2)}`);
  console.log("----------------------------------------");
  console.log(`NIEUW TOTAAL INCL BTW: € ${totalInclVat.toFixed(2)}`);
  console.log("========================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
