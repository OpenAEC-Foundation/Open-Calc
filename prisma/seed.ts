import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create standard units
  const units = [
    { code: "st", name: "stuks", symbol: "st" },
    { code: "m", name: "meter", symbol: "m" },
    { code: "m2", name: "vierkante meter", symbol: "m²" },
    { code: "m3", name: "kubieke meter", symbol: "m³" },
    { code: "kg", name: "kilogram", symbol: "kg" },
    { code: "ton", name: "ton", symbol: "t" },
    { code: "uur", name: "uur", symbol: "u" },
    { code: "dag", name: "dag", symbol: "dag" },
    { code: "week", name: "week", symbol: "wk" },
    { code: "l", name: "liter", symbol: "l" },
    { code: "m1", name: "strekkende meter", symbol: "m¹" },
    { code: "set", name: "set", symbol: "set" },
    { code: "ps", name: "post", symbol: "ps" },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: {},
      create: unit,
    });
  }

  // Create NL-SfB Cost Library
  const nlsfbLibrary = await prisma.costLibrary.upsert({
    where: { id: "nlsfb-default" },
    update: {},
    create: {
      id: "nlsfb-default",
      name: "NL-SfB Elementenbibliotheek",
      description: "Standaard kostenbibliotheek volgens NL-SfB elementenmethode",
      version: "2024",
      standard: "NL_SFB",
      isPublic: true,
      isDefault: true,
    },
  });

  // NL-SfB Categories (Tabel 1 - Elementen)
  const nlsfbCategories = [
    { code: "0", name: "Terreinelementen", sortOrder: 0 },
    { code: "1", name: "Ruwbouwelementen (fundering)", sortOrder: 1 },
    { code: "2", name: "Ruwbouwelementen (skelet)", sortOrder: 2 },
    { code: "21", name: "Buitenwanden", sortOrder: 21 },
    { code: "22", name: "Binnenwanden", sortOrder: 22 },
    { code: "23", name: "Vloeren", sortOrder: 23 },
    { code: "24", name: "Trappen en hellingen", sortOrder: 24 },
    { code: "27", name: "Daken", sortOrder: 27 },
    { code: "28", name: "Hoofddraagconstructie", sortOrder: 28 },
    { code: "3", name: "Afbouwelementen", sortOrder: 3 },
    { code: "31", name: "Buitenwandopeningen", sortOrder: 31 },
    { code: "32", name: "Binnenwandopeningen", sortOrder: 32 },
    { code: "33", name: "Vloerafwerking", sortOrder: 33 },
    { code: "34", name: "Trap- en hellingafwerking", sortOrder: 34 },
    { code: "35", name: "Plafondafwerking", sortOrder: 35 },
    { code: "37", name: "Dakafwerking", sortOrder: 37 },
    { code: "4", name: "Afwerkingselementen", sortOrder: 4 },
    { code: "41", name: "Buitenwandafwerking", sortOrder: 41 },
    { code: "42", name: "Binnenwandafwerking", sortOrder: 42 },
    { code: "5", name: "Installatie-elementen", sortOrder: 5 },
    { code: "52", name: "Afvoerinstallaties", sortOrder: 52 },
    { code: "53", name: "Waterinstallaties", sortOrder: 53 },
    { code: "55", name: "Verwarmingsinstallaties", sortOrder: 55 },
    { code: "56", name: "Koelinstallaties", sortOrder: 56 },
    { code: "57", name: "Luchtbehandelingsinstallaties", sortOrder: 57 },
    { code: "6", name: "Elektrotechnische installaties", sortOrder: 6 },
    { code: "61", name: "Centrale elektrotechnische voorzieningen", sortOrder: 61 },
    { code: "63", name: "Verlichting", sortOrder: 63 },
    { code: "64", name: "Communicatie", sortOrder: 64 },
    { code: "65", name: "Beveiliging", sortOrder: 65 },
    { code: "7", name: "Vaste voorzieningen", sortOrder: 7 },
    { code: "71", name: "Vaste keukeninrichtingen", sortOrder: 71 },
    { code: "72", name: "Sanitaire voorzieningen", sortOrder: 72 },
    { code: "73", name: "Vaste meubels", sortOrder: 73 },
    { code: "9", name: "Algemeen", sortOrder: 9 },
  ];

  for (const cat of nlsfbCategories) {
    await prisma.libraryCategory.upsert({
      where: {
        libraryId_code: {
          libraryId: nlsfbLibrary.id,
          code: cat.code,
        },
      },
      update: {},
      create: {
        ...cat,
        libraryId: nlsfbLibrary.id,
      },
    });
  }

  // Sample NL-SfB Items
  const nlsfbItems = [
    // Buitenwanden (21)
    { code: "21.11.01", description: "Metselwerk baksteen (waalformaat)", unit: "m2", laborHours: 1.5, laborRate: 45, materialCost: 35, unitPrice: 102.50 },
    { code: "21.11.02", description: "Metselwerk baksteen (strengpers)", unit: "m2", laborHours: 1.4, laborRate: 45, materialCost: 42, unitPrice: 105.00 },
    { code: "21.12.01", description: "Kalkzandsteen (CS-blokken)", unit: "m2", laborHours: 1.2, laborRate: 45, materialCost: 28, unitPrice: 82.00 },
    { code: "21.13.01", description: "Betonblokken (gewassen)", unit: "m2", laborHours: 1.1, laborRate: 45, materialCost: 32, unitPrice: 81.50 },
    { code: "21.21.01", description: "Spouwmuur: metselwerk + isolatie + kalkzandsteen", unit: "m2", laborHours: 2.8, laborRate: 45, materialCost: 95, unitPrice: 221.00 },
    { code: "21.31.01", description: "Houtskeletbouw wand", unit: "m2", laborHours: 2.0, laborRate: 45, materialCost: 85, unitPrice: 175.00 },
    { code: "21.41.01", description: "Staalframewand met beplating", unit: "m2", laborHours: 1.8, laborRate: 45, materialCost: 120, unitPrice: 201.00 },

    // Binnenwanden (22)
    { code: "22.11.01", description: "Metselwerk binnenmuur halfsteens", unit: "m2", laborHours: 1.0, laborRate: 45, materialCost: 22, unitPrice: 67.00 },
    { code: "22.12.01", description: "Gipsblokken wand 70mm", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 18, unitPrice: 54.00 },
    { code: "22.12.02", description: "Gipsblokken wand 100mm", unit: "m2", laborHours: 0.9, laborRate: 45, materialCost: 24, unitPrice: 64.50 },
    { code: "22.21.01", description: "Metal stud wand enkel beplaat", unit: "m2", laborHours: 0.6, laborRate: 45, materialCost: 28, unitPrice: 55.00 },
    { code: "22.21.02", description: "Metal stud wand dubbel beplaat", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 38, unitPrice: 74.00 },
    { code: "22.21.03", description: "Metal stud wand met isolatie", unit: "m2", laborHours: 0.9, laborRate: 45, materialCost: 48, unitPrice: 88.50 },

    // Vloeren (23)
    { code: "23.11.01", description: "Betonvloer prefab kanaalplaat", unit: "m2", laborHours: 0.3, laborRate: 45, materialCost: 65, unitPrice: 78.50 },
    { code: "23.11.02", description: "Betonvloer in het werk gestort", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 55, unitPrice: 91.00 },
    { code: "23.12.01", description: "Houten balkenvloer", unit: "m2", laborHours: 1.2, laborRate: 45, materialCost: 45, unitPrice: 99.00 },
    { code: "23.21.01", description: "Zwevende dekvloer cementgebonden", unit: "m2", laborHours: 0.4, laborRate: 45, materialCost: 18, unitPrice: 36.00 },
    { code: "23.21.02", description: "Anhydrietvloer", unit: "m2", laborHours: 0.3, laborRate: 45, materialCost: 22, unitPrice: 35.50 },

    // Daken (27)
    { code: "27.11.01", description: "Plat dak bitumen dakbedekking", unit: "m2", laborHours: 0.5, laborRate: 45, materialCost: 35, unitPrice: 57.50 },
    { code: "27.11.02", description: "Plat dak EPDM", unit: "m2", laborHours: 0.4, laborRate: 45, materialCost: 42, unitPrice: 60.00 },
    { code: "27.11.03", description: "Plat dak PVC dakbedekking", unit: "m2", laborHours: 0.4, laborRate: 45, materialCost: 38, unitPrice: 56.00 },
    { code: "27.21.01", description: "Hellend dak dakpannen keramisch", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 55, unitPrice: 91.00 },
    { code: "27.21.02", description: "Hellend dak dakpannen beton", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 42, unitPrice: 78.00 },
    { code: "27.21.03", description: "Hellend dak leien", unit: "m2", laborHours: 1.2, laborRate: 45, materialCost: 85, unitPrice: 139.00 },

    // Buitenwandopeningen (31)
    { code: "31.11.01", description: "Kozijn kunststof draai-kiepraam", unit: "st", laborHours: 1.5, laborRate: 45, materialCost: 350, unitPrice: 417.50 },
    { code: "31.11.02", description: "Kozijn hout draai-kiepraam", unit: "st", laborHours: 2.0, laborRate: 45, materialCost: 420, unitPrice: 510.00 },
    { code: "31.11.03", description: "Kozijn aluminium draai-kiepraam", unit: "st", laborHours: 1.5, laborRate: 45, materialCost: 550, unitPrice: 617.50 },
    { code: "31.21.01", description: "Buitendeur kunststof", unit: "st", laborHours: 2.0, laborRate: 45, materialCost: 650, unitPrice: 740.00 },
    { code: "31.21.02", description: "Buitendeur hout", unit: "st", laborHours: 2.5, laborRate: 45, materialCost: 850, unitPrice: 962.50 },
    { code: "31.21.03", description: "Schuifpui aluminium 2-delig", unit: "st", laborHours: 4.0, laborRate: 45, materialCost: 1800, unitPrice: 1980.00 },

    // Binnenwandopeningen (32)
    { code: "32.11.01", description: "Binnendeur opdek stompe", unit: "st", laborHours: 1.5, laborRate: 45, materialCost: 180, unitPrice: 247.50 },
    { code: "32.11.02", description: "Binnendeur opdek met glas", unit: "st", laborHours: 1.8, laborRate: 45, materialCost: 280, unitPrice: 361.00 },
    { code: "32.11.03", description: "Binnendeur paneeldeur", unit: "st", laborHours: 2.0, laborRate: 45, materialCost: 350, unitPrice: 440.00 },
    { code: "32.11.04", description: "Schuifdeur in de wand", unit: "st", laborHours: 4.0, laborRate: 45, materialCost: 450, unitPrice: 630.00 },

    // Vloerafwerking (33)
    { code: "33.11.01", description: "Tegelvloer keramisch 30x30", unit: "m2", laborHours: 1.0, laborRate: 45, materialCost: 35, unitPrice: 80.00 },
    { code: "33.11.02", description: "Tegelvloer keramisch 60x60", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 45, unitPrice: 81.00 },
    { code: "33.11.03", description: "Natuursteenvloer", unit: "m2", laborHours: 1.2, laborRate: 45, materialCost: 120, unitPrice: 174.00 },
    { code: "33.21.01", description: "Laminaatvloer", unit: "m2", laborHours: 0.3, laborRate: 45, materialCost: 25, unitPrice: 38.50 },
    { code: "33.21.02", description: "PVC vloer click", unit: "m2", laborHours: 0.3, laborRate: 45, materialCost: 35, unitPrice: 48.50 },
    { code: "33.21.03", description: "Eiken parketvloer", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 85, unitPrice: 121.00 },

    // Binnenwandafwerking (42)
    { code: "42.11.01", description: "Stucwerk gipspleister", unit: "m2", laborHours: 0.4, laborRate: 45, materialCost: 8, unitPrice: 26.00 },
    { code: "42.11.02", description: "Wandtegels 15x15", unit: "m2", laborHours: 1.0, laborRate: 45, materialCost: 35, unitPrice: 80.00 },
    { code: "42.11.03", description: "Wandtegels 30x60", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 42, unitPrice: 78.00 },
    { code: "42.21.01", description: "Latex muurverf (2x)", unit: "m2", laborHours: 0.15, laborRate: 45, materialCost: 3, unitPrice: 9.75 },
    { code: "42.21.02", description: "Behangen glasvlies + schilderen", unit: "m2", laborHours: 0.35, laborRate: 45, materialCost: 8, unitPrice: 23.75 },

    // Sanitair (72)
    { code: "72.11.01", description: "Toilet hangend compleet", unit: "st", laborHours: 3.0, laborRate: 45, materialCost: 450, unitPrice: 585.00 },
    { code: "72.11.02", description: "Toilet staand compleet", unit: "st", laborHours: 2.5, laborRate: 45, materialCost: 320, unitPrice: 432.50 },
    { code: "72.21.01", description: "Wastafel met onderkast", unit: "st", laborHours: 2.0, laborRate: 45, materialCost: 350, unitPrice: 440.00 },
    { code: "72.21.02", description: "Dubbele wastafel", unit: "st", laborHours: 3.0, laborRate: 45, materialCost: 550, unitPrice: 685.00 },
    { code: "72.31.01", description: "Ligbad acryl", unit: "st", laborHours: 4.0, laborRate: 45, materialCost: 450, unitPrice: 630.00 },
    { code: "72.31.02", description: "Douchebak 90x90", unit: "st", laborHours: 2.5, laborRate: 45, materialCost: 180, unitPrice: 292.50 },
    { code: "72.31.03", description: "Inloopdouche compleet", unit: "st", laborHours: 6.0, laborRate: 45, materialCost: 850, unitPrice: 1120.00 },

    // Keuken (71)
    { code: "71.11.01", description: "Keukenblok standaard (3m)", unit: "st", laborHours: 8.0, laborRate: 45, materialCost: 2500, unitPrice: 2860.00 },
    { code: "71.11.02", description: "Keuken maatwerk per strekkende meter", unit: "m", laborHours: 4.0, laborRate: 45, materialCost: 800, unitPrice: 980.00 },
    { code: "71.21.01", description: "Aanrechtblad composiet", unit: "m", laborHours: 1.0, laborRate: 45, materialCost: 350, unitPrice: 395.00 },
    { code: "71.21.02", description: "Aanrechtblad natuursteen", unit: "m", laborHours: 1.0, laborRate: 45, materialCost: 550, unitPrice: 595.00 },
  ];

  for (const item of nlsfbItems) {
    // Find or create category based on first 2 digits of code
    const categoryCode = item.code.split(".")[0];
    const category = await prisma.libraryCategory.findFirst({
      where: { libraryId: nlsfbLibrary.id, code: categoryCode },
    });

    await prisma.libraryItem.upsert({
      where: {
        libraryId_code: {
          libraryId: nlsfbLibrary.id,
          code: item.code,
        },
      },
      update: {},
      create: {
        ...item,
        libraryId: nlsfbLibrary.id,
        categoryId: category?.id,
      },
    });
  }

  // Create STABU Cost Library
  const stabuLibrary = await prisma.costLibrary.upsert({
    where: { id: "stabu-default" },
    update: {},
    create: {
      id: "stabu-default",
      name: "STABU Werksoorten Bibliotheek",
      description: "Standaard kostenbibliotheek volgens STABU werksoorten",
      version: "2024",
      standard: "STABU",
      isPublic: true,
      isDefault: false,
    },
  });

  // STABU Categories (Werksoorten)
  const stabuCategories = [
    { code: "00", name: "Algemeen", sortOrder: 0 },
    { code: "01", name: "Grondwerk", sortOrder: 1 },
    { code: "02", name: "Riolering", sortOrder: 2 },
    { code: "03", name: "Fundering", sortOrder: 3 },
    { code: "04", name: "Betonwerk", sortOrder: 4 },
    { code: "05", name: "Metselwerk", sortOrder: 5 },
    { code: "10", name: "Voegwerk", sortOrder: 10 },
    { code: "21", name: "Timmerwerk", sortOrder: 21 },
    { code: "22", name: "Metselwerk (afbouw)", sortOrder: 22 },
    { code: "30", name: "Kozijnen en ramen", sortOrder: 30 },
    { code: "31", name: "Deuren", sortOrder: 31 },
    { code: "32", name: "Trappen en balustraden", sortOrder: 32 },
    { code: "40", name: "Stukadoorwerk", sortOrder: 40 },
    { code: "41", name: "Tegelwerk", sortOrder: 41 },
    { code: "42", name: "Dekvloeren en vloerafwerking", sortOrder: 42 },
    { code: "43", name: "Natuursteen", sortOrder: 43 },
    { code: "45", name: "Schilderwerk", sortOrder: 45 },
    { code: "46", name: "Behangwerk", sortOrder: 46 },
    { code: "50", name: "Dakdekking", sortOrder: 50 },
    { code: "52", name: "Waterinstallaties", sortOrder: 52 },
    { code: "53", name: "Sanitair", sortOrder: 53 },
    { code: "54", name: "Gasinstallaties", sortOrder: 54 },
    { code: "55", name: "Verwarming", sortOrder: 55 },
    { code: "60", name: "Elektra", sortOrder: 60 },
    { code: "64", name: "Communicatie", sortOrder: 64 },
    { code: "70", name: "Keukeninrichting", sortOrder: 70 },
    { code: "90", name: "Terrein", sortOrder: 90 },
  ];

  for (const cat of stabuCategories) {
    await prisma.libraryCategory.upsert({
      where: {
        libraryId_code: {
          libraryId: stabuLibrary.id,
          code: cat.code,
        },
      },
      update: {},
      create: {
        ...cat,
        libraryId: stabuLibrary.id,
      },
    });
  }

  // Sample STABU Items
  const stabuItems = [
    // Grondwerk (01)
    { code: "01.01.01", description: "Ontgraven bouwput machinaal", unit: "m3", laborHours: 0.1, laborRate: 45, materialCost: 0, equipmentCost: 8, unitPrice: 12.50 },
    { code: "01.01.02", description: "Ontgraven sleuven handmatig", unit: "m3", laborHours: 2.0, laborRate: 45, materialCost: 0, unitPrice: 90.00 },
    { code: "01.02.01", description: "Aanvullen met zand", unit: "m3", laborHours: 0.2, laborRate: 45, materialCost: 25, unitPrice: 34.00 },
    { code: "01.03.01", description: "Afvoeren grond", unit: "m3", laborHours: 0.1, laborRate: 45, materialCost: 0, equipmentCost: 15, unitPrice: 19.50 },

    // Betonwerk (04)
    { code: "04.11.01", description: "Beton C20/25 in funderingsstroken", unit: "m3", laborHours: 1.5, laborRate: 45, materialCost: 110, unitPrice: 177.50 },
    { code: "04.11.02", description: "Beton C30/37 in vloeren", unit: "m3", laborHours: 1.2, laborRate: 45, materialCost: 125, unitPrice: 179.00 },
    { code: "04.21.01", description: "Wapening leveren en verwerken", unit: "kg", laborHours: 0.05, laborRate: 45, materialCost: 1.2, unitPrice: 3.45 },
    { code: "04.31.01", description: "Bekisting ruw", unit: "m2", laborHours: 0.8, laborRate: 45, materialCost: 15, unitPrice: 51.00 },

    // Metselwerk (05)
    { code: "05.11.01", description: "Metselwerk halfsteens", unit: "m2", laborHours: 1.0, laborRate: 45, materialCost: 22, unitPrice: 67.00 },
    { code: "05.11.02", description: "Metselwerk steens", unit: "m2", laborHours: 1.8, laborRate: 45, materialCost: 40, unitPrice: 121.00 },
    { code: "05.21.01", description: "Kalkzandsteen 15cm", unit: "m2", laborHours: 0.9, laborRate: 45, materialCost: 28, unitPrice: 68.50 },
    { code: "05.31.01", description: "Spouwanker plaatsen", unit: "st", laborHours: 0.05, laborRate: 45, materialCost: 0.80, unitPrice: 3.05 },

    // Timmerwerk (21)
    { code: "21.11.01", description: "Kapconstructie zadeldak", unit: "m2", laborHours: 1.5, laborRate: 45, materialCost: 45, unitPrice: 112.50 },
    { code: "21.12.01", description: "Dakbeschot multiplex", unit: "m2", laborHours: 0.4, laborRate: 45, materialCost: 18, unitPrice: 36.00 },
    { code: "21.21.01", description: "Houten vloer constructie", unit: "m2", laborHours: 1.2, laborRate: 45, materialCost: 42, unitPrice: 96.00 },

    // Stukadoorwerk (40)
    { code: "40.11.01", description: "Pleisterwerk kalk-cement", unit: "m2", laborHours: 0.5, laborRate: 45, materialCost: 8, unitPrice: 30.50 },
    { code: "40.11.02", description: "Pleisterwerk gips", unit: "m2", laborHours: 0.4, laborRate: 45, materialCost: 7, unitPrice: 25.00 },
    { code: "40.21.01", description: "Sierpleister", unit: "m2", laborHours: 0.6, laborRate: 45, materialCost: 12, unitPrice: 39.00 },

    // Schilderwerk (45)
    { code: "45.11.01", description: "Gronden en 2x aflakken houtwerk", unit: "m2", laborHours: 0.4, laborRate: 45, materialCost: 5, unitPrice: 23.00 },
    { code: "45.12.01", description: "Latex muurverf 2x", unit: "m2", laborHours: 0.15, laborRate: 45, materialCost: 3, unitPrice: 9.75 },
    { code: "45.13.01", description: "Beits houtwerk buiten", unit: "m2", laborHours: 0.25, laborRate: 45, materialCost: 4, unitPrice: 15.25 },

    // Elektra (60)
    { code: "60.11.01", description: "Groepenkast 12 groepen", unit: "st", laborHours: 4.0, laborRate: 50, materialCost: 350, unitPrice: 550.00 },
    { code: "60.21.01", description: "Wandcontactdoos enkel", unit: "st", laborHours: 0.5, laborRate: 50, materialCost: 15, unitPrice: 40.00 },
    { code: "60.21.02", description: "Wandcontactdoos dubbel", unit: "st", laborHours: 0.6, laborRate: 50, materialCost: 22, unitPrice: 52.00 },
    { code: "60.31.01", description: "Lichtpunt plafond", unit: "st", laborHours: 0.8, laborRate: 50, materialCost: 25, unitPrice: 65.00 },
    { code: "60.31.02", description: "Schakelaar enkel", unit: "st", laborHours: 0.4, laborRate: 50, materialCost: 12, unitPrice: 32.00 },
  ];

  for (const item of stabuItems) {
    const categoryCode = item.code.split(".")[0];
    const category = await prisma.libraryCategory.findFirst({
      where: { libraryId: stabuLibrary.id, code: categoryCode },
    });

    await prisma.libraryItem.upsert({
      where: {
        libraryId_code: {
          libraryId: stabuLibrary.id,
          code: item.code,
        },
      },
      update: {},
      create: {
        ...item,
        libraryId: stabuLibrary.id,
        categoryId: category?.id,
      },
    });
  }

  // Create RAW Cost Library
  const rawLibrary = await prisma.costLibrary.upsert({
    where: { id: "raw-default" },
    update: {},
    create: {
      id: "raw-default",
      name: "RAW GWW Bibliotheek",
      description: "Standaard kostenbibliotheek volgens RAW systematiek voor GWW",
      version: "2024",
      standard: "RAW",
      isPublic: true,
      isDefault: false,
    },
  });

  // RAW Categories
  const rawCategories = [
    { code: "01", name: "Grondwerk", sortOrder: 1 },
    { code: "02", name: "Sleufloze technieken", sortOrder: 2 },
    { code: "03", name: "Bemaling", sortOrder: 3 },
    { code: "04", name: "Damwanden", sortOrder: 4 },
    { code: "10", name: "Riolering en drainage", sortOrder: 10 },
    { code: "11", name: "Putten en kolken", sortOrder: 11 },
    { code: "20", name: "Wegverhardingen", sortOrder: 20 },
    { code: "21", name: "Funderingen wegen", sortOrder: 21 },
    { code: "22", name: "Asfalt", sortOrder: 22 },
    { code: "23", name: "Elementen verhardingen", sortOrder: 23 },
    { code: "24", name: "Beton verhardingen", sortOrder: 24 },
    { code: "30", name: "Betonconstructies", sortOrder: 30 },
    { code: "40", name: "Metselwerk", sortOrder: 40 },
    { code: "50", name: "Groenvoorzieningen", sortOrder: 50 },
    { code: "60", name: "Straatmeubilair", sortOrder: 60 },
    { code: "70", name: "Leidingwerk", sortOrder: 70 },
  ];

  for (const cat of rawCategories) {
    await prisma.libraryCategory.upsert({
      where: {
        libraryId_code: {
          libraryId: rawLibrary.id,
          code: cat.code,
        },
      },
      update: {},
      create: {
        ...cat,
        libraryId: rawLibrary.id,
      },
    });
  }

  // Sample RAW Items
  const rawItems = [
    // Grondwerk (01)
    { code: "01.01.01", description: "Grond ontgraven en verwerken in depot", unit: "m3", laborHours: 0.08, laborRate: 45, materialCost: 0, equipmentCost: 6, unitPrice: 9.60 },
    { code: "01.01.02", description: "Grond ontgraven en afvoeren", unit: "m3", laborHours: 0.1, laborRate: 45, materialCost: 0, equipmentCost: 18, unitPrice: 22.50 },
    { code: "01.02.01", description: "Zand aanbrengen in aanvulling", unit: "m3", laborHours: 0.15, laborRate: 45, materialCost: 22, unitPrice: 28.75 },
    { code: "01.03.01", description: "Verdichten van aanvulling", unit: "m2", laborHours: 0.05, laborRate: 45, materialCost: 0, equipmentCost: 1.5, unitPrice: 3.75 },

    // Riolering (10)
    { code: "10.01.01", description: "PVC rioolbuis diameter 125mm", unit: "m", laborHours: 0.3, laborRate: 45, materialCost: 12, unitPrice: 25.50 },
    { code: "10.01.02", description: "PVC rioolbuis diameter 160mm", unit: "m", laborHours: 0.35, laborRate: 45, materialCost: 18, unitPrice: 33.75 },
    { code: "10.01.03", description: "PVC rioolbuis diameter 200mm", unit: "m", laborHours: 0.4, laborRate: 45, materialCost: 25, unitPrice: 43.00 },
    { code: "10.01.04", description: "PVC rioolbuis diameter 315mm", unit: "m", laborHours: 0.5, laborRate: 45, materialCost: 45, unitPrice: 67.50 },
    { code: "10.02.01", description: "Betonbuis diameter 300mm", unit: "m", laborHours: 0.6, laborRate: 45, materialCost: 35, unitPrice: 62.00 },

    // Putten (11)
    { code: "11.01.01", description: "Inspectieput beton d600", unit: "st", laborHours: 2.0, laborRate: 45, materialCost: 280, unitPrice: 370.00 },
    { code: "11.01.02", description: "Inspectieput beton d800", unit: "st", laborHours: 3.0, laborRate: 45, materialCost: 420, unitPrice: 555.00 },
    { code: "11.02.01", description: "Straatkolk beton", unit: "st", laborHours: 1.5, laborRate: 45, materialCost: 180, unitPrice: 247.50 },
    { code: "11.03.01", description: "Putdeksel gietijzer", unit: "st", laborHours: 0.3, laborRate: 45, materialCost: 150, unitPrice: 163.50 },

    // Wegverhardingen funderingen (21)
    { code: "21.01.01", description: "Menggranulaat 0-31.5 mm", unit: "m3", laborHours: 0.15, laborRate: 45, materialCost: 28, unitPrice: 34.75 },
    { code: "21.01.02", description: "Steenmengsel 0-40 mm", unit: "m3", laborHours: 0.15, laborRate: 45, materialCost: 32, unitPrice: 38.75 },
    { code: "21.02.01", description: "Zandbed d=50mm", unit: "m2", laborHours: 0.08, laborRate: 45, materialCost: 2, unitPrice: 5.60 },

    // Asfalt (22)
    { code: "22.01.01", description: "Asfaltonderbak AC 16 base d=60mm", unit: "m2", laborHours: 0.02, laborRate: 45, materialCost: 8, unitPrice: 8.90 },
    { code: "22.01.02", description: "Asfalttussenlaag AC 11 bin d=50mm", unit: "m2", laborHours: 0.02, laborRate: 45, materialCost: 7, unitPrice: 7.90 },
    { code: "22.01.03", description: "Asfaltdeklaag AC 8 surf d=30mm", unit: "m2", laborHours: 0.02, laborRate: 45, materialCost: 5, unitPrice: 5.90 },

    // Elementverhardingen (23)
    { code: "23.01.01", description: "Betonstraatstenen 21x10.5x8 cm", unit: "m2", laborHours: 0.5, laborRate: 45, materialCost: 18, unitPrice: 40.50 },
    { code: "23.01.02", description: "Betontegels 30x30x4.5 cm", unit: "m2", laborHours: 0.35, laborRate: 45, materialCost: 15, unitPrice: 30.75 },
    { code: "23.01.03", description: "Gebakken klinkers waalformaat", unit: "m2", laborHours: 0.6, laborRate: 45, materialCost: 45, unitPrice: 72.00 },
    { code: "23.02.01", description: "Opsluitband 100x200mm", unit: "m", laborHours: 0.25, laborRate: 45, materialCost: 8, unitPrice: 19.25 },
    { code: "23.02.02", description: "Trottoirband 130x250mm", unit: "m", laborHours: 0.3, laborRate: 45, materialCost: 12, unitPrice: 25.50 },

    // Groenvoorzieningen (50)
    { code: "50.01.01", description: "Grasveld inzaaien", unit: "m2", laborHours: 0.05, laborRate: 45, materialCost: 1.5, unitPrice: 3.75 },
    { code: "50.01.02", description: "Graszoden leggen", unit: "m2", laborHours: 0.1, laborRate: 45, materialCost: 6, unitPrice: 10.50 },
    { code: "50.02.01", description: "Heester planten (40-60cm)", unit: "st", laborHours: 0.2, laborRate: 45, materialCost: 8, unitPrice: 17.00 },
    { code: "50.02.02", description: "Boom planten (maat 10-12)", unit: "st", laborHours: 1.0, laborRate: 45, materialCost: 120, unitPrice: 165.00 },
  ];

  for (const item of rawItems) {
    const categoryCode = item.code.split(".")[0];
    const category = await prisma.libraryCategory.findFirst({
      where: { libraryId: rawLibrary.id, code: categoryCode },
    });

    await prisma.libraryItem.upsert({
      where: {
        libraryId_code: {
          libraryId: rawLibrary.id,
          code: item.code,
        },
      },
      update: {},
      create: {
        ...item,
        libraryId: rawLibrary.id,
        categoryId: category?.id,
      },
    });
  }

  // ============================================
  // Create Example Project with Estimate
  // ============================================

  const DEFAULT_USER_ID = "default-user";

  // Ensure default user exists
  const defaultUser = await prisma.user.upsert({
    where: { id: DEFAULT_USER_ID },
    update: {},
    create: {
      id: DEFAULT_USER_ID,
      email: "gebruiker@opencalc.nl",
      name: "OpenCalc Gebruiker",
    },
  });

  // Create example client
  const exampleClient = await prisma.client.upsert({
    where: { id: "example-client" },
    update: {},
    create: {
      id: "example-client",
      name: "Familie De Vries",
      contactPerson: "Jan de Vries",
      email: "devries@example.nl",
      phone: "06-12345678",
      address: "Voorbeeldstraat 123",
      city: "Amsterdam",
      postalCode: "1234 AB",
    },
  });

  // Create example project
  const exampleProject = await prisma.project.upsert({
    where: { id: "example-project" },
    update: {},
    create: {
      id: "example-project",
      name: "Badkamer Renovatie Fam. De Vries",
      projectNumber: "2024-001",
      description: "Complete renovatie van de badkamer inclusief nieuw sanitair, tegelwerk en installaties.",
      address: "Voorbeeldstraat 123",
      city: "Amsterdam",
      postalCode: "1234 AB",
      status: "ACTIVE",
      userId: DEFAULT_USER_ID,
      clientId: exampleClient.id,
    },
  });

  // Create example estimate
  const exampleEstimate = await prisma.estimate.upsert({
    where: { id: "example-estimate" },
    update: {},
    create: {
      id: "example-estimate",
      name: "Offerte Badkamer Renovatie",
      description: "Complete renovatie badkamer 6m²",
      version: 1,
      status: "DRAFT",
      generalCostsPercent: 8,
      profitPercent: 10,
      riskPercent: 3,
      vatPercent: 21,
      projectId: exampleProject.id,
    },
  });

  // Create chapters for the estimate
  const chapters = [
    { id: "chapter-sloopwerk", code: "01", name: "Sloopwerk", sortOrder: 1 },
    { id: "chapter-sanitair", code: "02", name: "Sanitair", sortOrder: 2 },
    { id: "chapter-tegelwerk", code: "03", name: "Tegelwerk", sortOrder: 3 },
    { id: "chapter-installatie", code: "04", name: "Loodgieterswerk", sortOrder: 4 },
    { id: "chapter-elektra", code: "05", name: "Elektra", sortOrder: 5 },
    { id: "chapter-afwerking", code: "06", name: "Afwerking", sortOrder: 6 },
  ];

  for (const chapter of chapters) {
    await prisma.estimateChapter.upsert({
      where: { id: chapter.id },
      update: {},
      create: {
        ...chapter,
        estimateId: exampleEstimate.id,
      },
    });
  }

  // Create estimate lines
  const estimateLines = [
    // Sloopwerk
    { chapterId: "chapter-sloopwerk", code: "01.01", description: "Demonteren bestaand sanitair", quantity: 1, unit: "ps", laborHours: 4, laborRate: 45, laborCost: 180, materialCost: 0, unitPrice: 180, totalPrice: 180, sortOrder: 1 },
    { chapterId: "chapter-sloopwerk", code: "01.02", description: "Verwijderen bestaande wandtegels", quantity: 18, unit: "m2", laborHours: 0.5, laborRate: 45, laborCost: 22.50, materialCost: 0, unitPrice: 22.50, totalPrice: 405, sortOrder: 2 },
    { chapterId: "chapter-sloopwerk", code: "01.03", description: "Verwijderen bestaande vloertegels", quantity: 6, unit: "m2", laborHours: 0.6, laborRate: 45, laborCost: 27, materialCost: 0, unitPrice: 27, totalPrice: 162, sortOrder: 3 },
    { chapterId: "chapter-sloopwerk", code: "01.04", description: "Afvoeren puin en afval", quantity: 1, unit: "ps", laborHours: 2, laborRate: 45, laborCost: 90, materialCost: 150, unitPrice: 240, totalPrice: 240, sortOrder: 4 },

    // Sanitair
    { chapterId: "chapter-sanitair", code: "02.01", description: "Toilet hangend compleet incl. inbouwreservoir", quantity: 1, unit: "st", laborHours: 4, laborRate: 45, laborCost: 180, materialCost: 650, unitPrice: 830, totalPrice: 830, sortOrder: 1 },
    { chapterId: "chapter-sanitair", code: "02.02", description: "Wastafel met onderkast 80cm", quantity: 1, unit: "st", laborHours: 3, laborRate: 45, laborCost: 135, materialCost: 450, unitPrice: 585, totalPrice: 585, sortOrder: 2 },
    { chapterId: "chapter-sanitair", code: "02.03", description: "Inloopdouche 90x120cm compleet met glazen wand", quantity: 1, unit: "st", laborHours: 8, laborRate: 45, laborCost: 360, materialCost: 1200, unitPrice: 1560, totalPrice: 1560, sortOrder: 3 },
    { chapterId: "chapter-sanitair", code: "02.04", description: "Thermostatische douchekraan", quantity: 1, unit: "st", laborHours: 1.5, laborRate: 45, laborCost: 67.50, materialCost: 280, unitPrice: 347.50, totalPrice: 347.50, sortOrder: 4 },
    { chapterId: "chapter-sanitair", code: "02.05", description: "Wastafelkraan", quantity: 1, unit: "st", laborHours: 1, laborRate: 45, laborCost: 45, materialCost: 150, unitPrice: 195, totalPrice: 195, sortOrder: 5 },
    { chapterId: "chapter-sanitair", code: "02.06", description: "Designradiator 180x50cm", quantity: 1, unit: "st", laborHours: 2.5, laborRate: 45, laborCost: 112.50, materialCost: 380, unitPrice: 492.50, totalPrice: 492.50, sortOrder: 6 },

    // Tegelwerk
    { chapterId: "chapter-tegelwerk", code: "03.01", description: "Wandtegels 30x60cm incl. lijm en voegwerk", quantity: 18, unit: "m2", laborHours: 1.2, laborRate: 45, laborCost: 54, materialCost: 55, unitPrice: 109, totalPrice: 1962, sortOrder: 1 },
    { chapterId: "chapter-tegelwerk", code: "03.02", description: "Vloertegels 60x60cm incl. lijm en voegwerk", quantity: 6, unit: "m2", laborHours: 1.0, laborRate: 45, laborCost: 45, materialCost: 65, unitPrice: 110, totalPrice: 660, sortOrder: 2 },
    { chapterId: "chapter-tegelwerk", code: "03.03", description: "Kitwerk sanitair siliconen", quantity: 12, unit: "m", laborHours: 0.15, laborRate: 45, laborCost: 6.75, materialCost: 2, unitPrice: 8.75, totalPrice: 105, sortOrder: 3 },

    // Loodgieterswerk
    { chapterId: "chapter-installatie", code: "04.01", description: "Aanpassen waterleiding voor nieuwe indeling", quantity: 1, unit: "ps", laborHours: 6, laborRate: 50, laborCost: 300, materialCost: 180, unitPrice: 480, totalPrice: 480, sortOrder: 1 },
    { chapterId: "chapter-installatie", code: "04.02", description: "Aanpassen riolering", quantity: 1, unit: "ps", laborHours: 5, laborRate: 50, laborCost: 250, materialCost: 120, unitPrice: 370, totalPrice: 370, sortOrder: 2 },
    { chapterId: "chapter-installatie", code: "04.03", description: "Aansluiten radiator op CV", quantity: 1, unit: "st", laborHours: 2, laborRate: 50, laborCost: 100, materialCost: 45, unitPrice: 145, totalPrice: 145, sortOrder: 3 },

    // Elektra
    { chapterId: "chapter-elektra", code: "05.01", description: "Verplaatsen/aanpassen elektra groep badkamer", quantity: 1, unit: "ps", laborHours: 4, laborRate: 55, laborCost: 220, materialCost: 85, unitPrice: 305, totalPrice: 305, sortOrder: 1 },
    { chapterId: "chapter-elektra", code: "05.02", description: "LED inbouwspots IP65", quantity: 4, unit: "st", laborHours: 0.5, laborRate: 55, laborCost: 27.50, materialCost: 35, unitPrice: 62.50, totalPrice: 250, sortOrder: 2 },
    { chapterId: "chapter-elektra", code: "05.03", description: "Spiegelkast met verlichting 80cm", quantity: 1, unit: "st", laborHours: 1.5, laborRate: 55, laborCost: 82.50, materialCost: 350, unitPrice: 432.50, totalPrice: 432.50, sortOrder: 3 },
    { chapterId: "chapter-elektra", code: "05.04", description: "Ventilator met naloop en vochtsensor", quantity: 1, unit: "st", laborHours: 2, laborRate: 55, laborCost: 110, materialCost: 180, unitPrice: 290, totalPrice: 290, sortOrder: 4 },

    // Afwerking
    { chapterId: "chapter-afwerking", code: "06.01", description: "Plafond stuken en schilderen", quantity: 6, unit: "m2", laborHours: 0.6, laborRate: 45, laborCost: 27, materialCost: 12, unitPrice: 39, totalPrice: 234, sortOrder: 1 },
    { chapterId: "chapter-afwerking", code: "06.02", description: "Deurkozijn schilderen", quantity: 1, unit: "st", laborHours: 1.5, laborRate: 45, laborCost: 67.50, materialCost: 25, unitPrice: 92.50, totalPrice: 92.50, sortOrder: 2 },
    { chapterId: "chapter-afwerking", code: "06.03", description: "Accessoires (toiletrolhouder, handdoekrek, etc.)", quantity: 1, unit: "ps", laborHours: 1, laborRate: 45, laborCost: 45, materialCost: 120, unitPrice: 165, totalPrice: 165, sortOrder: 3 },
  ];

  for (const line of estimateLines) {
    const lineId = `line-${line.code.replace(/\./g, "-")}`;
    await prisma.estimateLine.upsert({
      where: { id: lineId },
      update: {},
      create: {
        id: lineId,
        ...line,
        estimateId: exampleEstimate.id,
      },
    });
  }

  // Calculate and update estimate totals
  const allLines = await prisma.estimateLine.findMany({
    where: { estimateId: exampleEstimate.id },
  });

  const totalLabor = allLines.reduce((sum, line) => sum + line.laborCost * line.quantity, 0);
  const totalMaterial = allLines.reduce((sum, line) => sum + line.materialCost * line.quantity, 0);
  const totalEquipment = allLines.reduce((sum, line) => sum + line.equipmentCost * line.quantity, 0);
  const totalSubcontr = allLines.reduce((sum, line) => sum + line.subcontrCost * line.quantity, 0);
  const subtotal = totalLabor + totalMaterial + totalEquipment + totalSubcontr;

  const generalCostsAmount = subtotal * (8 / 100);
  const profitAmount = (subtotal + generalCostsAmount) * (10 / 100);
  const riskAmount = (subtotal + generalCostsAmount + profitAmount) * (3 / 100);
  const totalExclVat = subtotal + generalCostsAmount + profitAmount + riskAmount;
  const vatAmount = totalExclVat * (21 / 100);
  const totalInclVat = totalExclVat + vatAmount;

  await prisma.estimate.update({
    where: { id: exampleEstimate.id },
    data: {
      totalLabor,
      totalMaterial,
      totalEquipment,
      totalSubcontr,
      subtotal,
      generalCostsAmount,
      profitAmount,
      riskAmount,
      totalExclVat,
      vatAmount,
      totalInclVat,
    },
  });

  console.log("Seeding completed!");
  console.log(`Created/updated ${units.length} units`);
  console.log(`Created NL-SfB library with ${nlsfbItems.length} items`);
  console.log(`Created STABU library with ${stabuItems.length} items`);
  console.log(`Created RAW library with ${rawItems.length} items`);
  console.log(`Created example project: ${exampleProject.name}`);
  console.log(`Created example estimate with ${estimateLines.length} lines`);
  console.log(`Estimate total incl. BTW: €${totalInclVat.toFixed(2)}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
