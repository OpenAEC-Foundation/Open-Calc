/**
 * NL-SfB and STABU chapter templates for construction cost estimation
 *
 * NL-SfB: Nederlandse variant van de SfB-classificatie (bouwkundig)
 * STABU: Standaardbestek Burger- en Utiliteitsbouw
 */

export type CodingStandard = "NL_SFB" | "STABU" | "CUSTOM";

export interface ChapterTemplate {
  code: string;
  name: string;
  description?: string;
  children?: ChapterTemplate[];
}

export interface CodingSystem {
  id: CodingStandard;
  name: string;
  description: string;
  chapters: ChapterTemplate[];
}

/**
 * NL-SfB Elementencodering
 * Gebaseerd op de Nederlandse SfB-classificatie voor bouwelementen
 */
export const NL_SFB_CHAPTERS: ChapterTemplate[] = [
  {
    code: "0",
    name: "Terrein",
    description: "Buitenruimte en terreinvoorzieningen",
    children: [
      { code: "00", name: "Terrein algemeen" },
      { code: "01", name: "Beplanting en groen" },
      { code: "02", name: "Bestrating en verharding" },
      { code: "03", name: "Terreinafscheidingen" },
      { code: "04", name: "Terreinmeubilair" },
      { code: "05", name: "Speel- en sportvoorzieningen" },
      { code: "06", name: "Waterhuishouding terrein" },
      { code: "07", name: "Terreinverlichting" },
    ],
  },
  {
    code: "1",
    name: "Ruwbouw",
    description: "Dragende constructie en primaire elementen",
    children: [
      { code: "10", name: "Ruwbouw algemeen" },
      { code: "11", name: "Bodemvoorzieningen" },
      { code: "12", name: "Funderingsconstructies" },
      { code: "13", name: "Vloerconstructies" },
      { code: "14", name: "Trapconstructies" },
      { code: "15", name: "Dak- en vlieringconstructies" },
      { code: "16", name: "Hoofddraagconstructies" },
    ],
  },
  {
    code: "2",
    name: "Buitenwanden",
    description: "Gevels en buitenwandconstructies",
    children: [
      { code: "20", name: "Buitenwanden algemeen" },
      { code: "21", name: "Buitenwanden steenachtig" },
      { code: "22", name: "Buitenwanden hout" },
      { code: "23", name: "Buitenwanden metaal" },
      { code: "24", name: "Buitenwanden glas" },
      { code: "25", name: "Buitenwanden kunststof" },
      { code: "26", name: "Buitenwand gevelbekleding" },
      { code: "27", name: "Buitenwandisolatie" },
    ],
  },
  {
    code: "3",
    name: "Binnenwanden",
    description: "Binnenwanden en scheidingsconstructies",
    children: [
      { code: "30", name: "Binnenwanden algemeen" },
      { code: "31", name: "Binnenwanden steenachtig" },
      { code: "32", name: "Binnenwanden hout" },
      { code: "33", name: "Binnenwanden metaal" },
      { code: "34", name: "Binnenwanden glas" },
      { code: "35", name: "Systeemwanden" },
      { code: "36", name: "Binnenwandafwerkingen" },
    ],
  },
  {
    code: "4",
    name: "Vloeren",
    description: "Vloeren en vloerafwerkingen",
    children: [
      { code: "40", name: "Vloeren algemeen" },
      { code: "41", name: "Vloerconstructies begane grond" },
      { code: "42", name: "Vloerconstructies verdiepingen" },
      { code: "43", name: "Vloerafwerkingen" },
      { code: "44", name: "Systeemvloeren" },
      { code: "45", name: "Vloerisolatie" },
      { code: "46", name: "Dekvloeren" },
    ],
  },
  {
    code: "5",
    name: "Trappen en hellingen",
    description: "Trappen, hellingen en bordessen",
    children: [
      { code: "50", name: "Trappen algemeen" },
      { code: "51", name: "Trappen betonnen" },
      { code: "52", name: "Trappen houten" },
      { code: "53", name: "Trappen metalen" },
      { code: "54", name: "Trappen natuursteen" },
      { code: "55", name: "Hellingbanen" },
      { code: "56", name: "Bordessen" },
      { code: "57", name: "Balustrades en leuningen" },
    ],
  },
  {
    code: "6",
    name: "Daken",
    description: "Dakconstructies en dakbedekkingen",
    children: [
      { code: "60", name: "Daken algemeen" },
      { code: "61", name: "Dakconstructies hellend" },
      { code: "62", name: "Dakconstructies plat" },
      { code: "63", name: "Dakbedekkingen hellend" },
      { code: "64", name: "Dakbedekkingen plat" },
      { code: "65", name: "Dakisolatie" },
      { code: "66", name: "Dakranden en -aansluitingen" },
      { code: "67", name: "Dakdoorbrekingen" },
      { code: "68", name: "Goten en hemelwaterafvoer" },
    ],
  },
  {
    code: "7",
    name: "Afbouw",
    description: "Afbouwwerkzaamheden en afwerkingen",
    children: [
      { code: "70", name: "Afbouw algemeen" },
      { code: "71", name: "Plafonds en plafondafwerkingen" },
      { code: "72", name: "Wandafwerkingen" },
      { code: "73", name: "Vloerafwerkingen" },
      { code: "74", name: "Stukadoorwerk" },
      { code: "75", name: "Tegelwerk" },
      { code: "76", name: "Schilderwerk" },
      { code: "77", name: "Behangwerk" },
    ],
  },
  {
    code: "8",
    name: "Installaties",
    description: "Technische installaties",
    children: [
      { code: "80", name: "Installaties algemeen" },
      { code: "81", name: "Elektrotechnische installaties" },
      { code: "82", name: "Verlichting" },
      { code: "83", name: "Verwarming" },
      { code: "84", name: "Koeling en ventilatie" },
      { code: "85", name: "Sanitair" },
      { code: "86", name: "Riolering en drainage" },
      { code: "87", name: "Brandbeveiliging" },
      { code: "88", name: "Beveiliging en toegang" },
      { code: "89", name: "Transport (liften, etc.)" },
    ],
  },
  {
    code: "9",
    name: "Vaste voorzieningen",
    description: "Vaste inrichtingen en voorzieningen",
    children: [
      { code: "90", name: "Vaste voorzieningen algemeen" },
      { code: "91", name: "Keukeninrichting" },
      { code: "92", name: "Sanitaire inrichting" },
      { code: "93", name: "Kasten en opbergruimte" },
      { code: "94", name: "Zonwering" },
      { code: "95", name: "Binnenkozijnen en deuren" },
      { code: "96", name: "Buitenkozijnen en deuren" },
      { code: "97", name: "Ramen en beglazing" },
      { code: "98", name: "IJzerwerk en hang- en sluitwerk" },
    ],
  },
];

/**
 * STABU hoofdstukken
 * Standaardbestek voor Burger- en Utiliteitsbouw
 */
export const STABU_CHAPTERS: ChapterTemplate[] = [
  {
    code: "00",
    name: "Algemeen",
    description: "Algemene bepalingen en voorwaarden",
    children: [
      { code: "00.01", name: "Algemene technische bepalingen" },
      { code: "00.02", name: "Bouwplaatsvoorzieningen" },
      { code: "00.03", name: "Sloopwerkzaamheden" },
      { code: "00.04", name: "Grondwerken" },
    ],
  },
  {
    code: "01",
    name: "Grondwerken",
    description: "Grond- en funderingswerken",
    children: [
      { code: "01.01", name: "Bouwrijp maken" },
      { code: "01.02", name: "Ontgraven en grondverwijdering" },
      { code: "01.03", name: "Aanvullen en verdichten" },
      { code: "01.04", name: "Bemaling en drainage" },
    ],
  },
  {
    code: "02",
    name: "Funderingen",
    description: "Funderingsconstructies",
    children: [
      { code: "02.01", name: "Paalfunderingen" },
      { code: "02.02", name: "Funderingsbalken" },
      { code: "02.03", name: "Funderingsplaten" },
      { code: "02.04", name: "Kelderconstructies" },
    ],
  },
  {
    code: "03",
    name: "Betonwerk",
    description: "Betonconstructies en -elementen",
    children: [
      { code: "03.01", name: "Betonwerk in het werk gestort" },
      { code: "03.02", name: "Prefab betonelementen" },
      { code: "03.03", name: "Wapening" },
      { code: "03.04", name: "Bekisting" },
    ],
  },
  {
    code: "04",
    name: "Metselwerk",
    description: "Metselwerk en voegwerk",
    children: [
      { code: "04.01", name: "Metselwerk baksteen" },
      { code: "04.02", name: "Metselwerk kalkzandsteen" },
      { code: "04.03", name: "Metselwerk betonblokken" },
      { code: "04.04", name: "Voegwerk" },
    ],
  },
  {
    code: "05",
    name: "Staalconstructies",
    description: "Staal- en metaalconstructies",
    children: [
      { code: "05.01", name: "Staalconstructies" },
      { code: "05.02", name: "Stalen trappen en bordessen" },
      { code: "05.03", name: "Aluminium constructies" },
      { code: "05.04", name: "RVS constructies" },
    ],
  },
  {
    code: "06",
    name: "Houtconstructies",
    description: "Hout- en houtskeletbouw",
    children: [
      { code: "06.01", name: "Houtskeletbouw" },
      { code: "06.02", name: "Dakconstructies hout" },
      { code: "06.03", name: "Houten vloeren" },
      { code: "06.04", name: "Houten trappen" },
    ],
  },
  {
    code: "07",
    name: "Dakbedekkingen",
    description: "Dak- en gevelbedekkingen",
    children: [
      { code: "07.01", name: "Hellende dakbedekkingen" },
      { code: "07.02", name: "Platte dakbedekkingen" },
      { code: "07.03", name: "Dakranden en -aansluitingen" },
      { code: "07.04", name: "Dakdoorbrekingen" },
    ],
  },
  {
    code: "08",
    name: "Gevels",
    description: "Gevelconstructies en -bekleding",
    children: [
      { code: "08.01", name: "Gevelbekleding" },
      { code: "08.02", name: "Gevelpuien" },
      { code: "08.03", name: "Kozijnen buitenwanden" },
      { code: "08.04", name: "Beglazing gevels" },
    ],
  },
  {
    code: "09",
    name: "Vloerafwerking",
    description: "Vloerafwerkingen en dekvloeren",
    children: [
      { code: "09.01", name: "Cementgebonden dekvloeren" },
      { code: "09.02", name: "Anhydriet gietvloeren" },
      { code: "09.03", name: "Natuursteen vloeren" },
      { code: "09.04", name: "Tegelvloeren" },
      { code: "09.05", name: "Houten vloeren" },
      { code: "09.06", name: "Kunststof vloeren" },
    ],
  },
  {
    code: "10",
    name: "Plafonds",
    description: "Plafondconstructies en -afwerkingen",
    children: [
      { code: "10.01", name: "Systeemplafonds" },
      { code: "10.02", name: "Gipsplaten plafonds" },
      { code: "10.03", name: "Stukadoors plafonds" },
      { code: "10.04", name: "Houten plafonds" },
    ],
  },
  {
    code: "11",
    name: "Wanden",
    description: "Wandconstructies en -afwerkingen",
    children: [
      { code: "11.01", name: "Scheidingswanden" },
      { code: "11.02", name: "Systeemwanden" },
      { code: "11.03", name: "Stukadoorwerk wanden" },
      { code: "11.04", name: "Wandtegels" },
    ],
  },
  {
    code: "12",
    name: "Kozijnen en deuren",
    description: "Binnen- en buitenkozijnen, deuren",
    children: [
      { code: "12.01", name: "Binnenkozijnen hout" },
      { code: "12.02", name: "Binnenkozijnen staal" },
      { code: "12.03", name: "Binnendeuren" },
      { code: "12.04", name: "Buitendeuren" },
      { code: "12.05", name: "Hang- en sluitwerk" },
    ],
  },
  {
    code: "13",
    name: "Trappen",
    description: "Trapconstructies",
    children: [
      { code: "13.01", name: "Betonnen trappen" },
      { code: "13.02", name: "Houten trappen" },
      { code: "13.03", name: "Stalen trappen" },
      { code: "13.04", name: "Balustrades en leuningen" },
    ],
  },
  {
    code: "14",
    name: "Schilderwerk",
    description: "Schilder- en lakwerk",
    children: [
      { code: "14.01", name: "Schilderwerk houtwerk" },
      { code: "14.02", name: "Schilderwerk staalwerk" },
      { code: "14.03", name: "Schilderwerk wanden" },
      { code: "14.04", name: "Schilderwerk plafonds" },
    ],
  },
  {
    code: "15",
    name: "Tegelwerk",
    description: "Tegelwerk wanden en vloeren",
    children: [
      { code: "15.01", name: "Wandtegels" },
      { code: "15.02", name: "Vloertegels" },
      { code: "15.03", name: "Mozaïek" },
      { code: "15.04", name: "Natuursteen tegels" },
    ],
  },
  {
    code: "20",
    name: "Elektra",
    description: "Elektrische installaties",
    children: [
      { code: "20.01", name: "Laagspanningsinstallatie" },
      { code: "20.02", name: "Verlichtingsinstallatie" },
      { code: "20.03", name: "Data en communicatie" },
      { code: "20.04", name: "Noodstroomvoorziening" },
    ],
  },
  {
    code: "21",
    name: "Werktuigbouwkundig",
    description: "Werktuigbouwkundige installaties",
    children: [
      { code: "21.01", name: "Verwarming" },
      { code: "21.02", name: "Koeling" },
      { code: "21.03", name: "Ventilatie" },
      { code: "21.04", name: "Sanitaire installaties" },
    ],
  },
  {
    code: "22",
    name: "Transport",
    description: "Transportinstallaties",
    children: [
      { code: "22.01", name: "Personenliften" },
      { code: "22.02", name: "Goederenliften" },
      { code: "22.03", name: "Roltrappen" },
      { code: "22.04", name: "Platformliften" },
    ],
  },
  {
    code: "30",
    name: "Terrein",
    description: "Terreinvoorzieningen",
    children: [
      { code: "30.01", name: "Bestrating" },
      { code: "30.02", name: "Beplanting" },
      { code: "30.03", name: "Terreinafscheidingen" },
      { code: "30.04", name: "Buitenverlichting" },
    ],
  },
];

/**
 * All coding systems
 */
export const CODING_SYSTEMS: CodingSystem[] = [
  {
    id: "NL_SFB",
    name: "NL-SfB",
    description: "Nederlandse elementencodering voor bouwkundige elementen",
    chapters: NL_SFB_CHAPTERS,
  },
  {
    id: "STABU",
    name: "STABU",
    description: "Standaardbestek voor Burger- en Utiliteitsbouw",
    chapters: STABU_CHAPTERS,
  },
];

/**
 * Get chapters for a coding system
 */
export function getChaptersForSystem(systemId: CodingStandard): ChapterTemplate[] {
  const system = CODING_SYSTEMS.find(s => s.id === systemId);
  return system?.chapters || [];
}

/**
 * Flatten chapters to include children
 */
export function flattenChapters(chapters: ChapterTemplate[]): ChapterTemplate[] {
  const result: ChapterTemplate[] = [];

  for (const chapter of chapters) {
    result.push({ code: chapter.code, name: chapter.name, description: chapter.description });
    if (chapter.children) {
      for (const child of chapter.children) {
        result.push({ code: child.code, name: child.name, description: child.description });
      }
    }
  }

  return result;
}

/**
 * Get all main chapters (without children) for quick selection
 */
export function getMainChapters(systemId: CodingStandard): ChapterTemplate[] {
  const chapters = getChaptersForSystem(systemId);
  return chapters.map(c => ({ code: c.code, name: c.name, description: c.description }));
}
