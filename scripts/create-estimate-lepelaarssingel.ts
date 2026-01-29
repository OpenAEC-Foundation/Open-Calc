import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Ensure default user exists
  const userId = "default-user";
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        name: "MCP User",
        email: "mcp@opencalc.local",
      },
    });
  }

  // Create project
  const project = await prisma.project.create({
    data: {
      name: "Renovatie Burgemeester Lepelaarssingel 38",
      projectNumber: "2967",
      description: "Volledige renovatie & verduurzaming woning Krimpen aan den IJssel",
      address: "Burgemeester Lepelaarssingel 38",
      city: "Krimpen aan den IJssel",
      postalCode: "",
      status: "DRAFT",
      userId,
    },
  });
  console.log(`Project aangemaakt: ${project.id}`);

  // Create estimate
  const estimate = await prisma.estimate.create({
    data: {
      name: "Hoofdbegroting Renovatie",
      description: "Begroting op basis van opname 23 januari 2026",
      version: 1,
      status: "DRAFT",
      generalCostsPercent: 10,
      profitPercent: 5,
      riskPercent: 5,
      vatPercent: 21,
      projectId: project.id,
    },
  });
  console.log(`Begroting aangemaakt: ${estimate.id}`);

  // Helper function to create chapter
  async function createChapter(code: string, name: string, sortOrder: number) {
    return prisma.estimateChapter.create({
      data: { code, name, sortOrder, estimateId: estimate.id },
    });
  }

  // Helper function to create line
  let globalSortOrder = 0;
  async function createLine(
    chapterId: string,
    description: string,
    options: {
      code?: string;
      specification?: string;
      quantity?: number;
      unit?: string;
      laborHours?: number;
      laborRate?: number;
      materialCost?: number;
      equipmentCost?: number;
      subcontrCost?: number;
    } = {}
  ) {
    const laborHours = options.laborHours || 0;
    const laborRate = options.laborRate || 55;
    const laborCost = laborHours * laborRate;
    const materialCost = options.materialCost || 0;
    const equipmentCost = options.equipmentCost || 0;
    const subcontrCost = options.subcontrCost || 0;
    const unitPrice = laborCost + materialCost + equipmentCost + subcontrCost;
    const quantity = options.quantity || 1;
    const totalPrice = unitPrice * quantity;

    globalSortOrder++;
    return prisma.estimateLine.create({
      data: {
        code: options.code,
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
        sortOrder: globalSortOrder,
        estimateId: estimate.id,
        chapterId,
      },
    });
  }

  // ===== HOOFDSTUKKEN EN REGELS =====

  // 00 - Voorbereidende werkzaamheden
  const ch00 = await createChapter("00", "Voorbereidende werkzaamheden", 1);
  await createLine(ch00.id, "Asbestonderzoek isolatiemateriaal en kitvoegen", { subcontrCost: 850, specification: "Onderzoek door erkend bureau" });
  await createLine(ch00.id, "Constructieberekeningen dak en horizontale scheur", { subcontrCost: 1500, specification: "Door constructeur" });
  await createLine(ch00.id, "Bouwplaatsinrichting en afzetting", { laborHours: 8, materialCost: 250 });
  await createLine(ch00.id, "Container huur (afvoer puin)", { quantity: 4, unit: "wk", materialCost: 350, specification: "10m3 container" });

  // 10 - Sloopwerk
  const ch10 = await createChapter("10", "Sloopwerk", 2);
  await createLine(ch10.id, "Verwijderen radiatoren 1e en 2e verdieping", { quantity: 6, unit: "st", laborHours: 1.5 });
  await createLine(ch10.id, "Verwijderen bestaande gashaard", { laborHours: 4, equipmentCost: 50 });
  await createLine(ch10.id, "Verwijderen beveiligingssysteem", { laborHours: 4 });
  await createLine(ch10.id, "Verwijderen oude plafonds verdiepingen", { quantity: 45, unit: "m2", laborHours: 0.5 });
  await createLine(ch10.id, "Verwijderen gevelbekleding", { quantity: 80, unit: "m2", laborHours: 0.4, specification: "Inclusief isolatie" });
  await createLine(ch10.id, "Verwijderen oude kozijnen", { quantity: 12, unit: "st", laborHours: 2 });
  await createLine(ch10.id, "Dichtmaken oude gaskachelpijp door buitenmuur", { laborHours: 3, materialCost: 45 });
  await createLine(ch10.id, "Afvoer sloopafval", { quantity: 1, unit: "ps", subcontrCost: 1500 });

  // 21 - Buitenwanden
  const ch21 = await createChapter("21", "Buitenwanden / Gevel", 3);
  await createLine(ch21.id, "Gevelbekleding Keralit inclusief isolatie en folies", { quantity: 80, unit: "m2", laborHours: 1.2, materialCost: 85, specification: "Nieuwe gevelbekleding volledig" });
  await createLine(ch21.id, "Verticale gevelbekleding garage/schuur", { quantity: 25, unit: "m2", laborHours: 1.0, materialCost: 75 });
  await createLine(ch21.id, "Horizontale scheur onderzoeken en herstellen", { laborHours: 16, materialCost: 350, specification: "Constructief herstel na onderzoek" });

  // 22 - Binnenwanden
  const ch22 = await createChapter("22", "Binnenwanden", 4);
  await createLine(ch22.id, "Scheidingswand bijkeuken in garage", { quantity: 8, unit: "m2", laborHours: 2, materialCost: 65, specification: "Metal stud met gipsplaat" });
  await createLine(ch22.id, "Extra wandje tussen aanbouw en zithoek", { quantity: 4, unit: "m2", laborHours: 2, materialCost: 65 });
  await createLine(ch22.id, "Stalen pui speelkamer/werkkamer (GewoonGers look)", { quantity: 1, unit: "st", laborHours: 16, materialCost: 2800, specification: "Inclusief montage" });

  // 31 - Buitenkozijnen
  const ch31 = await createChapter("31", "Buitenkozijnen, ramen en deuren", 5);
  await createLine(ch31.id, "Aluminium kozijnen begane grond", { quantity: 5, unit: "st", laborHours: 4, materialCost: 1200, specification: "HR++ glas" });
  await createLine(ch31.id, "Kunststof/alu kozijnen 1e verdieping", { quantity: 4, unit: "st", laborHours: 3, materialCost: 850, specification: "HR++ glas" });
  await createLine(ch31.id, "Kunststof/alu kozijnen 2e verdieping incl. loodwerk", { quantity: 3, unit: "st", laborHours: 4, materialCost: 950, specification: "HR++ glas + nieuw lood" });
  await createLine(ch31.id, "Voordeurkozijn aluminium of hout", { quantity: 1, unit: "st", laborHours: 8, materialCost: 2200 });
  await createLine(ch31.id, "Garagedeur geïsoleerd met brede loopdeur", { quantity: 1, unit: "st", laborHours: 8, materialCost: 3500 });
  await createLine(ch31.id, "Aluminium puien aanbouw met schuifdelen", { quantity: 1, unit: "st", laborHours: 16, materialCost: 8500, specification: "Grote schuifpui naar tuin" });
  await createLine(ch31.id, "Dakramen slaapkamer 2e verdieping", { quantity: 2, unit: "st", laborHours: 6, materialCost: 1400, specification: "Velux of gelijkwaardig" });
  await createLine(ch31.id, "Dakraam inloopkast/kamer 2e verdieping", { quantity: 1, unit: "st", laborHours: 6, materialCost: 1400 });

  // 32 - Binnenkozijnen
  const ch32 = await createChapter("32", "Binnenkozijnen en deuren", 6);
  await createLine(ch32.id, "Stalen taatsdeur naar woonkamer (GewoonGers look)", { quantity: 1, unit: "st", laborHours: 8, materialCost: 1800 });
  await createLine(ch32.id, "Stompe deur naar speelkamer/werkkamer", { quantity: 1, unit: "st", laborHours: 4, materialCost: 450 });
  await createLine(ch32.id, "Overige binnendeuren", { quantity: 6, unit: "st", laborHours: 3, materialCost: 380 });

  // 43 - Isolatie
  const ch43 = await createChapter("43", "Isolatie", 7);
  await createLine(ch43.id, "Dakisolatie kap 2e verdieping", { quantity: 55, unit: "m2", laborHours: 0.6, materialCost: 45, specification: "PIR of minerale wol Rc 6.0" });
  await createLine(ch43.id, "Plafondisolatie 1e verdieping", { quantity: 45, unit: "m2", laborHours: 0.4, materialCost: 35 });
  await createLine(ch43.id, "Gevelisolatie (bij gevelbekleding)", { quantity: 80, unit: "m2", materialCost: 25, specification: "Inbegrepen bij gevelbekleding" });

  // 45 - Afwerking wanden/plafonds
  const ch45 = await createChapter("45", "Afwerking wanden en plafonds", 8);
  await createLine(ch45.id, "Stucwerk wanden begane grond", { quantity: 120, unit: "m2", laborHours: 0.5, materialCost: 8 });
  await createLine(ch45.id, "Stucwerk wanden 1e verdieping", { quantity: 85, unit: "m2", laborHours: 0.5, materialCost: 8 });
  await createLine(ch45.id, "Stucwerk wanden en kap 2e verdieping", { quantity: 70, unit: "m2", laborHours: 0.6, materialCost: 10 });
  await createLine(ch45.id, "Plafonds vervangen 1e verdieping", { quantity: 45, unit: "m2", laborHours: 0.8, materialCost: 35 });
  await createLine(ch45.id, "Plafondafwerking kap 2e verdieping", { quantity: 35, unit: "m2", laborHours: 1.0, materialCost: 45 });

  // 46 - Vloerafwerking
  const ch46 = await createChapter("46", "Vloerafwerking", 9);
  await createLine(ch46.id, "Vloerafwerking aanbouw", { quantity: 25, unit: "m2", laborHours: 1.0, materialCost: 85, specification: "Nog te bepalen" });
  await createLine(ch46.id, "Natuursteenvloer reinigen hal/toilet", { quantity: 12, unit: "m2", laborHours: 1.5, materialCost: 15 });

  // 52 - Riolering
  const ch52 = await createChapter("52", "Riolering", 10);
  await createLine(ch52.id, "Leidingschema keuken in orde maken", { laborHours: 8, materialCost: 150 });
  await createLine(ch52.id, "Aansluitingen bijkeuken (wasmachine/droger)", { laborHours: 6, materialCost: 200 });

  // 53 - Waterinstallatie
  const ch53 = await createChapter("53", "Waterinstallatie", 11);
  await createLine(ch53.id, "Wateraansluitingen bijkeuken", { laborHours: 4, materialCost: 120 });
  await createLine(ch53.id, "Wastafelvoorziening behouden 2e verdieping", { laborHours: 2, materialCost: 50, specification: "Controleren en indien nodig herstellen" });

  // 54 - Gasinstallatie
  const ch54 = await createChapter("54", "Gasinstallatie", 12);
  await createLine(ch54.id, "Allesbrandkachel plaatsen (i.p.v. gashaard)", { quantity: 1, unit: "st", laborHours: 12, materialCost: 3500, specification: "Inclusief rookgasafvoer" });

  // 56 - Verwarmingsinstallatie
  const ch56 = await createChapter("56", "Verwarmingsinstallatie", 13);
  await createLine(ch56.id, "Airco-installatie binnenunits slaapkamers", { quantity: 3, unit: "st", laborHours: 4, materialCost: 1200, specification: "Split-unit per slaapkamer" });
  await createLine(ch56.id, "Airco-installatie binnenunits begane grond", { quantity: 2, unit: "st", laborHours: 4, materialCost: 1400 });
  await createLine(ch56.id, "Airco buitenunit(s) / warmtepomp", { quantity: 1, unit: "st", laborHours: 8, materialCost: 4500, specification: "Opstelling op dakterras te onderzoeken" });
  await createLine(ch56.id, "Vloerverwarming aanbouw", { quantity: 25, unit: "m2", laborHours: 0.8, materialCost: 65 });

  // 61 - Elektra
  const ch61 = await createChapter("61", "Elektra-installatie", 14);
  await createLine(ch61.id, "Nieuwe meterkast", { quantity: 1, unit: "st", laborHours: 8, materialCost: 1200, specification: "Groepenkast 3-fasen" });
  await createLine(ch61.id, "Elektra vernieuwing begane grond", { quantity: 1, unit: "ps", laborHours: 32, materialCost: 800 });
  await createLine(ch61.id, "Elektra vernieuwing 1e verdieping incl. freeswerk", { quantity: 1, unit: "ps", laborHours: 40, materialCost: 650 });
  await createLine(ch61.id, "Elektra vernieuwing 2e verdieping incl. freeswerk", { quantity: 1, unit: "ps", laborHours: 32, materialCost: 500 });
  await createLine(ch61.id, "LED-opbouw slaapkamer", { quantity: 1, unit: "st", laborHours: 4, materialCost: 350 });
  await createLine(ch61.id, "Elektra aanbouw", { quantity: 1, unit: "ps", laborHours: 16, materialCost: 400 });

  // 64 - Beveiliging
  const ch64 = await createChapter("64", "Beveiliging", 15);
  await createLine(ch64.id, "Nieuw beveiligingssysteem (Eufy of gelijkwaardig)", { quantity: 1, unit: "st", laborHours: 8, materialCost: 450 });

  // 73 - Keuken
  const ch73 = await createChapter("73", "Keuken", 16);
  await createLine(ch73.id, "Keuken vernieuwing door derden", { quantity: 1, unit: "ps", specification: "Exclusief - door klant" });

  // 74 - Sanitair
  const ch74 = await createChapter("74", "Sanitair", 17);
  await createLine(ch74.id, "Toilet begane grond vervangen", { quantity: 1, unit: "st", laborHours: 6, materialCost: 650, specification: "Behoud natuurstenen vloer" });
  await createLine(ch74.id, "Badkamer behouden", { quantity: 1, unit: "ps", specification: "Geen werkzaamheden - blijft behouden" });

  // 90 - Diversen
  const ch90 = await createChapter("90", "Diversen en nader te bepalen", 18);
  await createLine(ch90.id, "Maatwerkmeubel aanbouw (tv/kasten)", { quantity: 1, unit: "st", laborHours: 24, materialCost: 2500, specification: "Nog te detailleren" });
  await createLine(ch90.id, "Stelpost schimmel/vochtproblematiek knieschot", { quantity: 1, unit: "ps", materialCost: 1500, specification: "Schimmel achter knieschot" });
  await createLine(ch90.id, "Stelpost dak reparaties (kapotte plekken)", { quantity: 1, unit: "ps", materialCost: 2500, specification: "Incl. loodwerk vervangen" });
  await createLine(ch90.id, "Stelpost constructief herstel (na onderzoek)", { quantity: 1, unit: "ps", materialCost: 5000, specification: "Dakconstructie knikken/doorbuiging" });
  await createLine(ch90.id, "Stelpost asbestsanering (indien nodig)", { quantity: 1, unit: "ps", subcontrCost: 3500, specification: "Na onderzoek, PM" });
  await createLine(ch90.id, "Stelpost onvoorzien", { quantity: 1, unit: "ps", materialCost: 7500 });

  // ===== BEREKEN TOTALEN =====

  // Calculate estimate totals
  const lines = await prisma.estimateLine.findMany({
    where: { estimateId: estimate.id },
  });

  const totals = lines.reduce(
    (acc, line) => ({
      totalLabor: acc.totalLabor + (line.laborCost || 0) * (line.quantity || 1),
      totalMaterial: acc.totalMaterial + (line.materialCost || 0) * (line.quantity || 1),
      totalEquipment: acc.totalEquipment + (line.equipmentCost || 0) * (line.quantity || 1),
      totalSubcontr: acc.totalSubcontr + (line.subcontrCost || 0) * (line.quantity || 1),
    }),
    { totalLabor: 0, totalMaterial: 0, totalEquipment: 0, totalSubcontr: 0 }
  );

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
    },
  });

  // Update chapter totals
  const chapters = await prisma.estimateChapter.findMany({
    where: { estimateId: estimate.id },
  });

  for (const chapter of chapters) {
    const chapterLines = await prisma.estimateLine.findMany({
      where: { chapterId: chapter.id },
    });

    const chapterTotals = chapterLines.reduce(
      (acc, line) => ({
        totalLabor: acc.totalLabor + (line.laborCost || 0) * (line.quantity || 1),
        totalMaterial: acc.totalMaterial + (line.materialCost || 0) * (line.quantity || 1),
        totalEquipment: acc.totalEquipment + (line.equipmentCost || 0) * (line.quantity || 1),
        totalSubcontr: acc.totalSubcontr + (line.subcontrCost || 0) * (line.quantity || 1),
      }),
      { totalLabor: 0, totalMaterial: 0, totalEquipment: 0, totalSubcontr: 0 }
    );

    const chapterSubtotal = chapterTotals.totalLabor + chapterTotals.totalMaterial + chapterTotals.totalEquipment + chapterTotals.totalSubcontr;

    await prisma.estimateChapter.update({
      where: { id: chapter.id },
      data: { ...chapterTotals, subtotal: chapterSubtotal },
    });
  }

  // Print summary
  console.log("\n========================================");
  console.log("BEGROTING AANGEMAAKT");
  console.log("========================================");
  console.log(`Project: ${project.name}`);
  console.log(`Projectnummer: ${project.projectNumber}`);
  console.log(`Adres: ${project.address}, ${project.city}`);
  console.log("----------------------------------------");
  console.log(`Begroting: ${estimate.name}`);
  console.log(`Aantal hoofdstukken: ${chapters.length}`);
  console.log(`Aantal regels: ${lines.length}`);
  console.log("----------------------------------------");
  console.log(`Arbeid:        € ${totals.totalLabor.toFixed(2)}`);
  console.log(`Materiaal:     € ${totals.totalMaterial.toFixed(2)}`);
  console.log(`Materieel:     € ${totals.totalEquipment.toFixed(2)}`);
  console.log(`Onderaanneming:€ ${totals.totalSubcontr.toFixed(2)}`);
  console.log("----------------------------------------");
  console.log(`Subtotaal:     € ${subtotal.toFixed(2)}`);
  console.log(`AK (${estimate.generalCostsPercent}%):     € ${generalCostsAmount.toFixed(2)}`);
  console.log(`W&R (${estimate.profitPercent}%):    € ${profitAmount.toFixed(2)}`);
  console.log(`Risico (${estimate.riskPercent}%):  € ${riskAmount.toFixed(2)}`);
  console.log("----------------------------------------");
  console.log(`Totaal excl:   € ${totalExclVat.toFixed(2)}`);
  console.log(`BTW (${estimate.vatPercent}%):     € ${vatAmount.toFixed(2)}`);
  console.log("========================================");
  console.log(`TOTAAL INCL:   € ${totalInclVat.toFixed(2)}`);
  console.log("========================================");
  console.log(`\nOpen de begroting in de app: http://localhost:3002/projects/${project.id}/estimates/${estimate.id}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
