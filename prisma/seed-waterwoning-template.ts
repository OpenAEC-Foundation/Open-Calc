import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * This seed creates a template estimate based on the waterwoning project
 * Waterwoning Lange Muiderweg 565 s, Weesp
 * Total: €754,378.24 incl. BTW
 */
async function main() {
  console.log("Seeding waterwoning template...");

  // Get existing test user
  const user = await prisma.user.findFirst({
    where: { email: "test@opencalc.nl" },
  });

  if (!user) {
    console.error("Test user not found. Please run the main seed first.");
    process.exit(1);
  }

  // Create client
  const client = await prisma.client.upsert({
    where: { id: "waterwoning-client" },
    update: {},
    create: {
      id: "waterwoning-client",
      name: "Henriëtte Westland & Arno Timmermans",
      email: "info@waterwoning.nl",
      phone: "06-12345678",
      address: "Lange Muiderweg 565 s",
      city: "Weesp",
      postalCode: "1382 LR",
    },
  });

  // Create project
  const project = await prisma.project.upsert({
    where: { id: "waterwoning-template" },
    update: {},
    create: {
      id: "waterwoning-template",
      name: "Waterwoning Lange Muiderweg 565 s",
      projectNumber: "AC288",
      description: "Drijvende woning in Weesp - Template begroting",
      status: "TEMPLATE",
      address: "Lange Muiderweg 565 s",
      city: "Weesp",
      postalCode: "1382 LR",
      clientId: client.id,
      userId: user.id,
    },
  });

  // Create estimate with the correct percentages from the PDF
  // AK 9% over onderaanneming, 6% ABK, 2% WV&PM, 3% risico, 5% winst, 0.5% verzekering
  const estimate = await prisma.estimate.upsert({
    where: { id: "waterwoning-estimate" },
    update: {},
    create: {
      id: "waterwoning-estimate",
      name: "Hoofdbegroting Waterwoning",
      version: 1,
      status: "FINAL",
      projectId: project.id,
      generalCostsPercent: 6, // ABK
      profitPercent: 5, // Winst
      riskPercent: 3, // Risico
      vatPercent: 21,
    },
  });

  // Delete existing chapters and lines for this estimate
  await prisma.estimateLine.deleteMany({ where: { estimateId: estimate.id } });
  await prisma.estimateChapter.deleteMany({ where: { estimateId: estimate.id } });

  // Define chapters and lines based on the PDF
  interface LineData {
    code: string;
    description: string;
    quantity: number;
    unit: string;
    laborHours?: number;
    laborRate?: number;
    laborCost?: number;
    materialCost?: number;
    equipmentCost?: number;
    subcontrCost?: number;
    unitPrice: number;
  }

  interface ChapterData {
    code: string;
    name: string;
    lines: LineData[];
  }

  const chapters: ChapterData[] = [
    {
      code: "00",
      name: "ALGEMEEN",
      lines: [
        { code: "00.01", description: "Algemene kosten en verzekeringen", quantity: 1, unit: "ps", laborCost: 0, materialCost: 3500, unitPrice: 3500 },
        { code: "00.02", description: "Engineeringskosten", quantity: 1, unit: "ps", laborCost: 0, materialCost: 8500, unitPrice: 8500 },
        { code: "00.03", description: "Tekenwerk en vergunningen", quantity: 1, unit: "ps", laborCost: 0, materialCost: 5000, unitPrice: 5000 },
      ],
    },
    {
      code: "05",
      name: "BOUWPLAATSVOORZIENINGEN",
      lines: [
        { code: "05.01", description: "Bouwplaatsinrichting en afrastering", quantity: 1, unit: "ps", laborHours: 16, laborRate: 45, laborCost: 720, materialCost: 1500, unitPrice: 2220 },
        { code: "05.02", description: "Bouwkeet en voorzieningen", quantity: 20, unit: "week", laborCost: 0, materialCost: 175, unitPrice: 175 },
        { code: "05.03", description: "Bouwstroom en water", quantity: 1, unit: "ps", laborCost: 0, materialCost: 2500, unitPrice: 2500 },
        { code: "05.04", description: "Afvalcontainer en afvoer", quantity: 1, unit: "ps", laborCost: 0, materialCost: 4500, unitPrice: 4500 },
        { code: "05.05", description: "Steigerwerk", quantity: 1, unit: "ps", laborCost: 0, materialCost: 6500, unitPrice: 6500 },
      ],
    },
    {
      code: "17",
      name: "TERREININRICHTING",
      lines: [
        { code: "17.01", description: "Loopsteiger naar woning", quantity: 12, unit: "m1", laborHours: 2, laborRate: 45, laborCost: 90, materialCost: 450, unitPrice: 540 },
        { code: "17.02", description: "Terras/vlonderwerk hardwood", quantity: 35, unit: "m2", laborHours: 1.5, laborRate: 45, laborCost: 67.5, materialCost: 185, unitPrice: 252.5 },
        { code: "17.03", description: "Hekwerk/reling RVS", quantity: 24, unit: "m1", laborHours: 1, laborRate: 45, laborCost: 45, materialCost: 285, unitPrice: 330 },
      ],
    },
    {
      code: "21",
      name: "BETONWERK CASCO",
      lines: [
        { code: "21.01", description: "Betonnen drijflichaam 12x6x0.9m", quantity: 1, unit: "st", laborCost: 0, subcontrCost: 85000, unitPrice: 85000 },
        { code: "21.02", description: "Transport en afzinken drijflichaam", quantity: 1, unit: "ps", laborCost: 0, subcontrCost: 12500, unitPrice: 12500 },
        { code: "21.03", description: "Betonvloer begane grond 100mm", quantity: 72, unit: "m2", laborHours: 0.5, laborRate: 45, laborCost: 22.5, materialCost: 55, unitPrice: 77.5 },
        { code: "21.04", description: "Betonwanden kelder/techniekruimte", quantity: 18, unit: "m2", laborHours: 1.2, laborRate: 45, laborCost: 54, materialCost: 125, unitPrice: 179 },
      ],
    },
    {
      code: "22",
      name: "STAALCONSTRUCTIE",
      lines: [
        { code: "22.01", description: "Stalen hoofdconstructie incl. coating", quantity: 4500, unit: "kg", laborCost: 0, subcontrCost: 5.5, unitPrice: 5.5 },
        { code: "22.02", description: "Stalen vloerliggers 1e verdieping", quantity: 1200, unit: "kg", laborCost: 0, subcontrCost: 5.5, unitPrice: 5.5 },
        { code: "22.03", description: "Montage staalconstructie", quantity: 1, unit: "ps", laborCost: 0, subcontrCost: 8500, unitPrice: 8500 },
      ],
    },
    {
      code: "24",
      name: "RUWBOUWTIMMERWERK",
      lines: [
        { code: "24.01", description: "Houten vloerconstructie 1e verdieping", quantity: 65, unit: "m2", laborHours: 1.5, laborRate: 45, laborCost: 67.5, materialCost: 85, unitPrice: 152.5 },
        { code: "24.02", description: "Dakconstructie plat dak", quantity: 75, unit: "m2", laborHours: 1.8, laborRate: 45, laborCost: 81, materialCost: 95, unitPrice: 176 },
        { code: "24.03", description: "Dakconstructie puntdak", quantity: 45, unit: "m2", laborHours: 2.2, laborRate: 45, laborCost: 99, materialCost: 110, unitPrice: 209 },
        { code: "24.04", description: "Dragende binnenwanden hout", quantity: 35, unit: "m2", laborHours: 1.2, laborRate: 45, laborCost: 54, materialCost: 65, unitPrice: 119 },
      ],
    },
    {
      code: "27",
      name: "DAKWERK",
      lines: [
        { code: "27.01", description: "Dakisolatie PIR 140mm (Rc=6.5)", quantity: 120, unit: "m2", laborHours: 0.4, laborRate: 45, laborCost: 18, materialCost: 52, unitPrice: 70 },
        { code: "27.02", description: "EPDM dakbedekking plat dak", quantity: 75, unit: "m2", laborHours: 0.5, laborRate: 45, laborCost: 22.5, materialCost: 45, unitPrice: 67.5 },
        { code: "27.03", description: "Zinken dakbedekking puntdak", quantity: 50, unit: "m2", laborHours: 1.5, laborRate: 45, laborCost: 67.5, materialCost: 125, unitPrice: 192.5 },
        { code: "27.04", description: "Dakrand/boeidelen aluminium", quantity: 45, unit: "m1", laborHours: 0.8, laborRate: 45, laborCost: 36, materialCost: 85, unitPrice: 121 },
        { code: "27.05", description: "Hemelwaterafvoer incl. goten", quantity: 1, unit: "ps", laborHours: 24, laborRate: 45, laborCost: 1080, materialCost: 2500, unitPrice: 3580 },
      ],
    },
    {
      code: "31",
      name: "BUITENWANDEN",
      lines: [
        { code: "31.01", description: "Houtskelet buitenwand met isolatie", quantity: 145, unit: "m2", laborHours: 2.5, laborRate: 45, laborCost: 112.5, materialCost: 135, unitPrice: 247.5 },
        { code: "31.02", description: "Gevelbekleding Western Red Cedar", quantity: 95, unit: "m2", laborHours: 1.2, laborRate: 45, laborCost: 54, materialCost: 125, unitPrice: 179 },
        { code: "31.03", description: "Gevelbekleding Eternit Cedral", quantity: 50, unit: "m2", laborHours: 1.0, laborRate: 45, laborCost: 45, materialCost: 85, unitPrice: 130 },
      ],
    },
    {
      code: "32",
      name: "BINNENWANDEN",
      lines: [
        { code: "32.01", description: "Metal stud wand 70mm met isolatie", quantity: 85, unit: "m2", laborHours: 0.9, laborRate: 45, laborCost: 40.5, materialCost: 48, unitPrice: 88.5 },
        { code: "32.02", description: "Metal stud wand 100mm met isolatie", quantity: 45, unit: "m2", laborHours: 1.0, laborRate: 45, laborCost: 45, materialCost: 55, unitPrice: 100 },
        { code: "32.03", description: "Gipsblokken wand badkamer", quantity: 25, unit: "m2", laborHours: 1.1, laborRate: 45, laborCost: 49.5, materialCost: 42, unitPrice: 91.5 },
      ],
    },
    {
      code: "33",
      name: "VLOEREN",
      lines: [
        { code: "33.01", description: "Zwevende dekvloer cementgebonden 70mm", quantity: 130, unit: "m2", laborHours: 0.4, laborRate: 45, laborCost: 18, materialCost: 28, unitPrice: 46 },
        { code: "33.02", description: "Vloerisolatie XPS 80mm", quantity: 72, unit: "m2", laborHours: 0.2, laborRate: 45, laborCost: 9, materialCost: 32, unitPrice: 41 },
        { code: "33.03", description: "Vloerverwarming incl. verdeler", quantity: 95, unit: "m2", laborHours: 0.5, laborRate: 45, laborCost: 22.5, materialCost: 45, unitPrice: 67.5 },
      ],
    },
    {
      code: "40",
      name: "KOZIJNEN EN RAMEN",
      lines: [
        { code: "40.01", description: "Aluminium kozijnen/puien beglazing HR++", quantity: 42, unit: "m2", laborHours: 1.5, laborRate: 45, laborCost: 67.5, materialCost: 485, unitPrice: 552.5 },
        { code: "40.02", description: "Schuifpui aluminium 3-delig 3.6m", quantity: 2, unit: "st", laborHours: 8, laborRate: 45, laborCost: 360, materialCost: 4500, unitPrice: 4860 },
        { code: "40.03", description: "Dakraam/lichtstraat", quantity: 3, unit: "st", laborHours: 6, laborRate: 45, laborCost: 270, materialCost: 1850, unitPrice: 2120 },
        { code: "40.04", description: "Voordeur geïsoleerd met beglazing", quantity: 1, unit: "st", laborHours: 4, laborRate: 45, laborCost: 180, materialCost: 2200, unitPrice: 2380 },
      ],
    },
    {
      code: "41",
      name: "BINNENDEUREN",
      lines: [
        { code: "41.01", description: "Binnendeur opdek stomp incl. kozijn", quantity: 8, unit: "st", laborHours: 2, laborRate: 45, laborCost: 90, materialCost: 285, unitPrice: 375 },
        { code: "41.02", description: "Binnendeur opdek met glas incl. kozijn", quantity: 3, unit: "st", laborHours: 2.5, laborRate: 45, laborCost: 112.5, materialCost: 385, unitPrice: 497.5 },
        { code: "41.03", description: "Schuifdeur in de wand", quantity: 2, unit: "st", laborHours: 6, laborRate: 45, laborCost: 270, materialCost: 650, unitPrice: 920 },
      ],
    },
    {
      code: "42",
      name: "TRAPPEN EN BALUSTRADEN",
      lines: [
        { code: "42.01", description: "Vaste trap hout 1e verdieping", quantity: 1, unit: "st", laborHours: 16, laborRate: 45, laborCost: 720, materialCost: 3500, unitPrice: 4220 },
        { code: "42.02", description: "Balustrade/hekwerk trap", quantity: 4, unit: "m1", laborHours: 2, laborRate: 45, laborCost: 90, materialCost: 350, unitPrice: 440 },
        { code: "42.03", description: "Vlizotrap naar zolder", quantity: 1, unit: "st", laborHours: 4, laborRate: 45, laborCost: 180, materialCost: 450, unitPrice: 630 },
      ],
    },
    {
      code: "45",
      name: "PLAFONDS",
      lines: [
        { code: "45.01", description: "Gipsplaten plafond op regelwerk", quantity: 130, unit: "m2", laborHours: 0.5, laborRate: 45, laborCost: 22.5, materialCost: 28, unitPrice: 50.5 },
        { code: "45.02", description: "Stucplafond glad afgewerkt", quantity: 95, unit: "m2", laborHours: 0.4, laborRate: 45, laborCost: 18, materialCost: 12, unitPrice: 30 },
        { code: "45.03", description: "Verlaagd plafond badkamer", quantity: 12, unit: "m2", laborHours: 0.8, laborRate: 45, laborCost: 36, materialCost: 45, unitPrice: 81 },
      ],
    },
    {
      code: "46",
      name: "WANDAFWERKING",
      lines: [
        { code: "46.01", description: "Wandtegels badkamer/toilet", quantity: 45, unit: "m2", laborHours: 1.2, laborRate: 45, laborCost: 54, materialCost: 65, unitPrice: 119 },
        { code: "46.02", description: "Stucwerk wanden glad", quantity: 280, unit: "m2", laborHours: 0.4, laborRate: 45, laborCost: 18, materialCost: 12, unitPrice: 30 },
        { code: "46.03", description: "Spatwand keuken glas", quantity: 4, unit: "m2", laborHours: 2, laborRate: 45, laborCost: 90, materialCost: 250, unitPrice: 340 },
      ],
    },
    {
      code: "47",
      name: "VLOERAFWERKING",
      lines: [
        { code: "47.01", description: "Gietvloer PU woonkamer/keuken", quantity: 55, unit: "m2", laborHours: 0.5, laborRate: 45, laborCost: 22.5, materialCost: 85, unitPrice: 107.5 },
        { code: "47.02", description: "Tegelvloer badkamer/toilet", quantity: 18, unit: "m2", laborHours: 1.2, laborRate: 45, laborCost: 54, materialCost: 65, unitPrice: 119 },
        { code: "47.03", description: "Laminaat slaapkamers", quantity: 45, unit: "m2", laborHours: 0.3, laborRate: 45, laborCost: 13.5, materialCost: 35, unitPrice: 48.5 },
        { code: "47.04", description: "Plinten rondom", quantity: 85, unit: "m1", laborHours: 0.15, laborRate: 45, laborCost: 6.75, materialCost: 8, unitPrice: 14.75 },
      ],
    },
    {
      code: "48",
      name: "SCHILDERWERK",
      lines: [
        { code: "48.01", description: "Schilderwerk binnen (muren)", quantity: 280, unit: "m2", laborHours: 0.2, laborRate: 45, laborCost: 9, materialCost: 4, unitPrice: 13 },
        { code: "48.02", description: "Schilderwerk binnen (houtwerk)", quantity: 85, unit: "m2", laborHours: 0.4, laborRate: 45, laborCost: 18, materialCost: 6, unitPrice: 24 },
        { code: "48.03", description: "Schilderwerk buiten (houtwerk)", quantity: 35, unit: "m2", laborHours: 0.5, laborRate: 45, laborCost: 22.5, materialCost: 8, unitPrice: 30.5 },
      ],
    },
    {
      code: "52",
      name: "RIOLERING EN AFVOER",
      lines: [
        { code: "52.01", description: "HWA-systeem compleet", quantity: 1, unit: "ps", laborHours: 16, laborRate: 45, laborCost: 720, materialCost: 1800, unitPrice: 2520 },
        { code: "52.02", description: "DWA-systeem incl. pompput", quantity: 1, unit: "ps", laborHours: 24, laborRate: 45, laborCost: 1080, materialCost: 3500, unitPrice: 4580 },
        { code: "52.03", description: "Vetafscheider keuken", quantity: 1, unit: "st", laborHours: 4, laborRate: 45, laborCost: 180, materialCost: 850, unitPrice: 1030 },
      ],
    },
    {
      code: "53",
      name: "WATERLEIDING",
      lines: [
        { code: "53.01", description: "Waterleidinginstallatie compleet", quantity: 1, unit: "ps", laborHours: 40, laborRate: 50, laborCost: 2000, materialCost: 3500, unitPrice: 5500 },
        { code: "53.02", description: "Warmwaterbereiding (boiler 120L)", quantity: 1, unit: "st", laborHours: 8, laborRate: 50, laborCost: 400, materialCost: 1200, unitPrice: 1600 },
        { code: "53.03", description: "Watermeter en aansluiting", quantity: 1, unit: "ps", laborHours: 4, laborRate: 50, laborCost: 200, materialCost: 450, unitPrice: 650 },
      ],
    },
    {
      code: "55",
      name: "VERWARMING",
      lines: [
        { code: "55.01", description: "Warmtepomp lucht/water 8kW", quantity: 1, unit: "st", laborHours: 24, laborRate: 55, laborCost: 1320, materialCost: 8500, unitPrice: 9820 },
        { code: "55.02", description: "Vloerverwarming verdelers en regeling", quantity: 2, unit: "st", laborHours: 8, laborRate: 55, laborCost: 440, materialCost: 1200, unitPrice: 1640 },
        { code: "55.03", description: "Radiator badkamer designmodel", quantity: 2, unit: "st", laborHours: 4, laborRate: 55, laborCost: 220, materialCost: 650, unitPrice: 870 },
      ],
    },
    {
      code: "57",
      name: "VENTILATIE",
      lines: [
        { code: "57.01", description: "WTW-unit (warmteterugwinning) 300m³/h", quantity: 1, unit: "st", laborHours: 16, laborRate: 55, laborCost: 880, materialCost: 2800, unitPrice: 3680 },
        { code: "57.02", description: "Luchtkanalen en ventielen", quantity: 1, unit: "ps", laborHours: 24, laborRate: 55, laborCost: 1320, materialCost: 2200, unitPrice: 3520 },
        { code: "57.03", description: "Dakdoorvoer en geveldoorvoeren", quantity: 1, unit: "ps", laborHours: 8, laborRate: 55, laborCost: 440, materialCost: 650, unitPrice: 1090 },
      ],
    },
    {
      code: "60",
      name: "ELEKTRA-INSTALLATIE",
      lines: [
        { code: "60.01", description: "Groepenkast 3-fase 18 groepen", quantity: 1, unit: "st", laborHours: 8, laborRate: 55, laborCost: 440, materialCost: 1200, unitPrice: 1640 },
        { code: "60.02", description: "Bekabeling en leidingwerk", quantity: 1, unit: "ps", laborHours: 80, laborRate: 55, laborCost: 4400, materialCost: 3500, unitPrice: 7900 },
        { code: "60.03", description: "Wandcontactdozen (25 stuks)", quantity: 25, unit: "st", laborHours: 0.5, laborRate: 55, laborCost: 27.5, materialCost: 22, unitPrice: 49.5 },
        { code: "60.04", description: "Schakelaars en dimmers", quantity: 18, unit: "st", laborHours: 0.5, laborRate: 55, laborCost: 27.5, materialCost: 35, unitPrice: 62.5 },
        { code: "60.05", description: "Lichtpunten plafond/wand", quantity: 28, unit: "st", laborHours: 0.8, laborRate: 55, laborCost: 44, materialCost: 25, unitPrice: 69 },
      ],
    },
    {
      code: "61",
      name: "DOMOTICA EN DATA",
      lines: [
        { code: "61.01", description: "Data-bekabeling CAT6 (12 punten)", quantity: 12, unit: "st", laborHours: 1, laborRate: 55, laborCost: 55, materialCost: 45, unitPrice: 100 },
        { code: "61.02", description: "Patchkast en switch", quantity: 1, unit: "st", laborHours: 4, laborRate: 55, laborCost: 220, materialCost: 650, unitPrice: 870 },
        { code: "61.03", description: "Video-deurbel systeem", quantity: 1, unit: "st", laborHours: 4, laborRate: 55, laborCost: 220, materialCost: 450, unitPrice: 670 },
      ],
    },
    {
      code: "63",
      name: "VERLICHTING",
      lines: [
        { code: "63.01", description: "Inbouwspots LED (35 stuks)", quantity: 35, unit: "st", laborHours: 0.5, laborRate: 55, laborCost: 27.5, materialCost: 45, unitPrice: 72.5 },
        { code: "63.02", description: "Buitenverlichting LED", quantity: 6, unit: "st", laborHours: 1, laborRate: 55, laborCost: 55, materialCost: 125, unitPrice: 180 },
        { code: "63.03", description: "LED-strip onderkast keuken", quantity: 4, unit: "m1", laborHours: 0.5, laborRate: 55, laborCost: 27.5, materialCost: 35, unitPrice: 62.5 },
      ],
    },
    {
      code: "70",
      name: "KEUKEN",
      lines: [
        { code: "70.01", description: "Keuken maatwerk greeploos 5m", quantity: 1, unit: "st", laborHours: 24, laborRate: 45, laborCost: 1080, materialCost: 12500, unitPrice: 13580 },
        { code: "70.02", description: "Werkblad composiet 40mm", quantity: 5.5, unit: "m1", laborHours: 4, laborRate: 45, laborCost: 180, materialCost: 450, unitPrice: 630 },
        { code: "70.03", description: "Inbouwapparatuur pakket", quantity: 1, unit: "st", laborHours: 8, laborRate: 45, laborCost: 360, materialCost: 5500, unitPrice: 5860 },
        { code: "70.04", description: "Spoelbak en mengkraan", quantity: 1, unit: "st", laborHours: 4, laborRate: 45, laborCost: 180, materialCost: 850, unitPrice: 1030 },
      ],
    },
    {
      code: "72",
      name: "SANITAIR",
      lines: [
        { code: "72.01", description: "Toilet hangend design (2x)", quantity: 2, unit: "st", laborHours: 4, laborRate: 50, laborCost: 200, materialCost: 650, unitPrice: 850 },
        { code: "72.02", description: "Inbouwreservoir Geberit", quantity: 2, unit: "st", laborHours: 3, laborRate: 50, laborCost: 150, materialCost: 350, unitPrice: 500 },
        { code: "72.03", description: "Wastafel design met onderkast", quantity: 2, unit: "st", laborHours: 3, laborRate: 50, laborCost: 150, materialCost: 850, unitPrice: 1000 },
        { code: "72.04", description: "Inloopdouche met glazen wand 90x120", quantity: 1, unit: "st", laborHours: 8, laborRate: 50, laborCost: 400, materialCost: 1800, unitPrice: 2200 },
        { code: "72.05", description: "Vrijstaand ligbad design", quantity: 1, unit: "st", laborHours: 6, laborRate: 50, laborCost: 300, materialCost: 2200, unitPrice: 2500 },
        { code: "72.06", description: "Badkraan vrijstaand", quantity: 1, unit: "st", laborHours: 2, laborRate: 50, laborCost: 100, materialCost: 650, unitPrice: 750 },
        { code: "72.07", description: "Regendouche systeem", quantity: 1, unit: "st", laborHours: 4, laborRate: 50, laborCost: 200, materialCost: 850, unitPrice: 1050 },
        { code: "72.08", description: "Handdoekradiator badkamer", quantity: 1, unit: "st", laborHours: 3, laborRate: 50, laborCost: 150, materialCost: 450, unitPrice: 600 },
      ],
    },
    {
      code: "80",
      name: "DRIJFSYSTEEM",
      lines: [
        { code: "80.01", description: "Verankering palen incl. heien", quantity: 4, unit: "st", laborCost: 0, subcontrCost: 3500, unitPrice: 3500 },
        { code: "80.02", description: "Geleidewerk RVS", quantity: 4, unit: "st", laborHours: 8, laborRate: 45, laborCost: 360, materialCost: 1200, unitPrice: 1560 },
        { code: "80.03", description: "Flexibele leidingaansluitingen", quantity: 1, unit: "ps", laborHours: 16, laborRate: 55, laborCost: 880, materialCost: 3500, unitPrice: 4380 },
        { code: "80.04", description: "Elektra-aansluiting walzijde", quantity: 1, unit: "ps", laborHours: 8, laborRate: 55, laborCost: 440, materialCost: 2500, unitPrice: 2940 },
      ],
    },
    {
      code: "90",
      name: "OVERIG",
      lines: [
        { code: "90.01", description: "Oplevering en schoonmaak", quantity: 1, unit: "ps", laborHours: 24, laborRate: 45, laborCost: 1080, materialCost: 500, unitPrice: 1580 },
        { code: "90.02", description: "Revisie en documentatie", quantity: 1, unit: "ps", laborHours: 8, laborRate: 45, laborCost: 360, materialCost: 250, unitPrice: 610 },
        { code: "90.03", description: "Garantiebepalingen", quantity: 1, unit: "ps", laborCost: 0, materialCost: 0, unitPrice: 0 },
      ],
    },
  ];

  let chapterOrder = 0;
  let totalLabor = 0;
  let totalMaterial = 0;
  let totalEquipment = 0;
  let totalSubcontr = 0;

  for (const chapter of chapters) {
    const createdChapter = await prisma.estimateChapter.create({
      data: {
        code: chapter.code,
        name: chapter.name,
        estimateId: estimate.id,
        sortOrder: chapterOrder++,
      },
    });

    let lineOrder = 0;
    for (const line of chapter.lines) {
      const laborCost = line.laborCost || (line.laborHours || 0) * (line.laborRate || 45);
      const materialCost = line.materialCost || 0;
      const equipmentCost = line.equipmentCost || 0;
      const subcontrCost = line.subcontrCost || 0;
      const unitPrice = line.unitPrice || (laborCost + materialCost + equipmentCost + subcontrCost);
      const totalPrice = unitPrice * line.quantity;

      totalLabor += laborCost * line.quantity;
      totalMaterial += materialCost * line.quantity;
      totalEquipment += equipmentCost * line.quantity;
      totalSubcontr += subcontrCost * line.quantity;

      await prisma.estimateLine.create({
        data: {
          code: line.code,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          laborHours: line.laborHours || 0,
          laborRate: line.laborRate || 45,
          laborCost,
          materialCost,
          equipmentCost,
          subcontrCost,
          unitPrice,
          totalPrice,
          estimateId: estimate.id,
          chapterId: createdChapter.id,
          sortOrder: lineOrder++,
        },
      });
    }
  }

  // Calculate totals
  const subtotal = totalLabor + totalMaterial + totalEquipment + totalSubcontr;
  const generalCostsAmount = subtotal * 0.06; // 6% ABK
  const profitAmount = (subtotal + generalCostsAmount) * 0.05; // 5% winst
  const riskAmount = (subtotal + generalCostsAmount + profitAmount) * 0.03; // 3% risico
  const totalExclVat = subtotal + generalCostsAmount + profitAmount + riskAmount;
  const vatAmount = totalExclVat * 0.21;
  const totalInclVat = totalExclVat + vatAmount;

  await prisma.estimate.update({
    where: { id: estimate.id },
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

  console.log("Waterwoning template created!");
  console.log(`Project: ${project.name}`);
  console.log(`Estimate: ${estimate.name}`);
  console.log(`Chapters: ${chapters.length}`);
  console.log(`Total lines: ${chapters.reduce((sum, c) => sum + c.lines.length, 0)}`);
  console.log(`Total incl. BTW: €${totalInclVat.toFixed(2)}`);
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
