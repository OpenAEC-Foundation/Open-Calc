import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * This seed adds specification texts to the library items
 * Specification texts are detailed technical descriptions of work items
 */
async function main() {
  console.log("Adding specification texts to library...");

  // NL-SfB Items with specifications
  const nlsfbSpecifications: Record<string, string> = {
    // Buitenwanden (21)
    "21.11.01": `Leveren en verwerken van metselwerk in waalformaat baksteen.
- Baksteen: waalformaat 210x100x50mm, kleur nader te bepalen
- Mortel: cementmortel M10 conform NEN-EN 998-2
- Voegwerk: platvolle voeg, doorgestreken
- Inclusief: lintvoegen, rollagen en strekse koppen
- Spouwankers conform BRL 2816
- Uitsparingen voor kozijnen en leidingdoorvoeren`,

    "21.11.02": `Leveren en verwerken van metselwerk in strengpers baksteen.
- Baksteen: strengpers 210x100x50mm, machinaal gevormd
- Mortel: cementmortel M10 conform NEN-EN 998-2
- Voegwerk: platvolle voeg, uitgekrabde voeg of nabehandeld
- Inclusief: muurafdekkers, rollagen, strekse koppen
- Spouwankers conform BRL 2816
- Thermisch onderbroken lateien bij openingen`,

    "21.12.01": `Leveren en metselen van kalkzandsteen (CS-blokken).
- Kalkzandsteen: blokken 434x214x100mm of 150mm
- Lijm: dunbedmortel conform NEN-EN 998-2
- Inclusief: waterpas stellen eerste laag op mortelbed
- Hoekoplossingen en aansluitingen
- Spouwankers conform BRL 2816, h.o.h. max 4/m²`,

    "21.21.01": `Leveren en aanbrengen van complete spouwmuur.
BUITENBLAD:
- Metselwerk in waalformaat baksteen
- Mortel: cementmortel M10
SPOUW:
- Isolatie: minerale wol of PIR, Rc ≥ 4.7 m²K/W
- Spouwaansluiting bij kozijnen
BINNENBLAD:
- Kalkzandsteen 100mm
- Bepleisterd of gestuct
Inclusief: spouwankers, lateiconstructies, rollagen`,

    "21.31.01": `Leveren en monteren van houtskeletbouw buitenwand.
CONSTRUCTIE:
- Stijl- en regelwerk: vurenhout C24, 45x145mm h.o.h. 600mm
- Dampremmende folie aan warme zijde
- Isolatie: minerale wol 140mm, Rc ≥ 4.0 m²K/W
BEPLATING:
- Binnenzijde: OSB 15mm + gipskarton 12.5mm
- Buitenzijde: houtvezel windscherm 22mm
Inclusief: hoekoplossingen, aansluitingen vloer/dak`,

    // Binnenwanden (22)
    "22.11.01": `Leveren en metselen van binnenmuur halfsteens.
- Baksteen: waalformaat 210x100x50mm
- Mortel: cementmortel M5
- Inclusief: waterpas stellen, lintvoegen
- Aansluitingen vloer en plafond
- Uitsparingen voor leidingen en doorvoeren`,

    "22.21.01": `Leveren en aanbrengen van metal stud scheidingswand.
CONSTRUCTIE:
- Stijlen: verzinkt staal 50x40mm h.o.h. 600mm
- U-profielen vloer en plafond
BEPLATING:
- Enkelzijdig: gipskarton 12.5mm
- Afwerking: voegen en aansluiten
Inclusief: hoekprofielen, versterkingen bij openingen`,

    "22.21.02": `Leveren en aanbrengen van metal stud scheidingswand.
CONSTRUCTIE:
- Stijlen: verzinkt staal 50x40mm h.o.h. 600mm
- U-profielen vloer en plafond
BEPLATING:
- Dubbelzijdig: gipskarton 2x12.5mm per zijde
- Afwerking: voegen en aansluiten
Inclusief: hoekprofielen, versterkingen bij openingen
Geluidsisolatie: ca. Rw 45 dB`,

    "22.21.03": `Leveren en aanbrengen van geïsoleerde metal stud scheidingswand.
CONSTRUCTIE:
- Stijlen: verzinkt staal 75x40mm h.o.h. 600mm
- Isolatie: minerale wol 50mm tussen stijlen
BEPLATING:
- Dubbelzijdig: gipskarton 12.5mm per zijde
- Afwerking: voegen en aansluiten
Inclusief: hoekprofielen, versterkingen bij openingen
Geluidsisolatie: ca. Rw 52 dB`,

    // Vloeren (23)
    "23.11.01": `Leveren en leggen van prefab betonvloer (kanaalplaten).
- Kanaalplaten: hoogte 200-265mm conform berekening
- Druklaag: beton C28/35 50mm met wapening
- Oplegging: minimaal 100mm conform tekening
- Inclusief: randelementen, vloervelden
- Veiligheidsmaatregelen tijdens montage`,

    "23.11.02": `Storten van betonvloer in het werk.
- Beton: C28/35 conform NEN-EN 206
- Dikte: conform constructief ontwerp
- Wapening: FeB500 conform tekening
- Bekisting: glad/ruw conform bestek
- Nabehandeling: curing compound of nat houden
Inclusief: randbekisting, sparingen`,

    "23.21.01": `Leveren en aanbrengen van zwevende cementdekvloer.
- Dikte: minimaal 65mm (verwarmde vloer 55mm boven leiding)
- Mortel: cementgebonden, druksterkte ≥ 25 N/mm²
- Isolatie: PE-schuim 10mm onder dekvloer
- Randen: dilatatie met randstroken
- Afwerking: machinaal vlak schuren
Inclusief: wapeningsnet indien vereist`,

    // Daken (27)
    "27.11.01": `Leveren en aanbrengen van bitumineuze dakbedekking.
- Ondergrond: isolatie met toplaag of dampremmende laag
- Systeem: 2-laags APP of SBS bitumen dakbedekking
- Dakranden: opstanddetails conform fabrikant
- Doorvoeren: manchetten conform voorschriften
- Brandklasse: Broof(t1) conform NEN 6063
Inclusief: hoekstukken, kiezelbak`,

    "27.11.02": `Leveren en aanbrengen van EPDM dakbedekking.
- EPDM: dikte 1.14mm of dikker, los liggend
- Ballast: grind 16-32mm, 50 kg/m² of betontegels
- Naden: verlijmd met EPDM-lijm
- Opstanddetails: mechanisch bevestigd
- Doorvoeren: geprefabriceerde manchetten
Inclusief: dakranden, inspectieluik`,

    "27.21.01": `Leveren en leggen van keramische dakpannen.
- Dakpan: keramisch, OVH model, kleur nader te bepalen
- Tengellat: verduurzaamd vuren 25x50mm
- Panlat: verduurzaamd vuren 30x25mm
- Onderdak: dampopen folie
- Bevestiging: RVS panschroeven of klemmen
Inclusief: nokvorst, kilgoot, randpannen`,

    // Kozijnen (31)
    "31.11.01": `Leveren en monteren van kunststof kozijn met draai-kiepraam.
- Kozijnprofiel: minimaal 5-kamersysteem, wit
- Beglazing: HR++ glas, Ug ≤ 1.1 W/m²K
- Beslag: RVS druk-draai-kiepsluiting
- Afdichting: EPDM rubber strips
- Ventilatie: ZR of rooster in bovendorpel
Inclusief: afkitten, stelkozijn, binnen-/buitendorpels`,

    "31.11.02": `Leveren en monteren van houten kozijn met draai-kiepraam.
- Kozijn: hardhout of verduurzaamd naaldhout, dubbel gegrond
- Afmeting: conform kozijnstaat
- Beglazing: HR++ glas, Ug ≤ 1.1 W/m²K
- Beslag: RVS druk-draai-kiepsluiting
- Schilderwerk: 2x dekkend aflakken RAL kleur
Inclusief: waterhol, binnenlatei, afkitten`,

    "31.21.03": `Leveren en monteren van aluminium schuifpui.
- Profiel: thermisch onderbroken aluminium
- Afwerking: gepoedercoat RAL kleur
- Beglazing: HR++ glas, Ug ≤ 1.1 W/m²K
- Rail: verdiept of drempelloos
- Afsluitbaar: 3-punts espagnolet
Inclusief: aftimmering, rails, beglazing`,

    // Sanitair (72)
    "72.11.01": `Leveren en monteren van hangtoilet.
- Toiletpot: keramisch, wandhangend
- Zitting: duroplast softclose
- Inbouwreservoir: 6/9 liter, geluidsarm
- Bedieningsplaat: kunststof/chroom, 2-toets
- Afvoer: aansluiting op HWA Ø90/110mm
Inclusief: bevestigingsframe, aansluitmateriaal`,

    "72.21.01": `Leveren en monteren van wastafel met onderkast.
- Wastafel: keramisch, inbouw of opbouw
- Onderkast: watervast materiaal, deuren/laden
- Mengkraan: éénhendel, chroom
- Sifon: chroom design sifon
- Aansluiting: koud/warm water, afvoer
Inclusief: bevestigingsmateriaal, afkitten`,

    "72.31.03": `Leveren en aanbrengen van complete inloopdouche.
- Douchewand: gehard glas 8mm, walk-in
- Douchedrain: RVS goot of putje
- Tegels: wand- en vloertegels nader te bepalen
- Kraan: inbouw thermostatisch mengkraan
- Douchekop: hoofddouche Ø200mm + handdouche
Inclusief: waterdichte afwerking, tegelwerk`,

    // Elektra (60)
    "60.11.01": `Leveren en monteren van groepenkast.
- Kast: kunststof IP40, 12 groepen
- Hoofdschakelaar: 40A
- Aardlekschakelaar: 30mA
- Installatieautomaten: B-karakteristiek
- Bekabeling: conform NEN1010
Inclusief: labeling, keuringscertificaat`,

    "60.21.01": `Leveren en aanbrengen van wandcontactdoos enkel.
- Inbouwdoos: standaard Ø60mm
- Wandcontactdoos: met randaarde
- Afdekraam: kunststof wit of aluminium
- Bekabeling: 3x2.5mm² VD vanaf verdeler
Inclusief: aansluitklemmen, buis/goot`,

    "60.31.01": `Leveren en aanbrengen van lichtpunt plafond.
- Centraaldoos: Ø70mm
- Kroonsteentje of connector
- Bekabeling: 3x1.5mm² VD vanaf schakelaar
- Armatuur: exclusief (door opdrachtgever)
Inclusief: aansluitklemmen, buis/goot`,
  };

  // Update NL-SfB items with specifications
  let updated = 0;
  for (const [code, specification] of Object.entries(nlsfbSpecifications)) {
    const result = await prisma.libraryItem.updateMany({
      where: {
        code,
        library: { standard: "NL_SFB" },
      },
      data: { specification },
    });
    if (result.count > 0) updated++;
  }

  console.log(`Updated ${updated} NL-SfB items with specifications`);

  // STABU Items with specifications
  const stabuSpecifications: Record<string, string> = {
    "01.01.01": `GRONDWERK - Ontgraven bouwput machinaal
Omschrijving:
Het machinaal ontgraven van grond t.b.v. bouwput.
- Grondsoort: conform grondonderzoek
- Ontgravingsdiepte: conform tekening
- Taluds: conform grondmechanisch advies
- Bouwputwanden: indien nodig conform tekening
- Afvoer: naar depot of afvoeren (separaat)
Inclusief: uitzetten, bemaling indien nodig`,

    "04.11.01": `BETONWERK - Beton in funderingsstroken
Omschrijving:
Het storten van beton in funderingsstroken.
- Betonsorten: C20/25 conform NEN-EN 206
- Milieuklasse: XC1 of conform bestek
- Stortkwaliteit: homogeen verdicht
- Nabehandeling: conform NEN-EN 13670
Inclusief: bekisting, verdichten, nabehandeling`,

    "05.11.01": `METSELWERK - Halfsteens binnenmuur
Omschrijving:
Het metselen van halfsteens binnenmuur.
- Steensoort: baksteen waalformaat
- Mortel: cementmortel M5 conform NEN-EN 998-2
- Verband: halfsteens klezoor
- Voegwerk: platvolle voeg
Inclusief: lintvoegen, uitsparingen`,

    "21.11.01": `TIMMERWERK - Kapconstructie zadeldak
Omschrijving:
Het leveren en monteren van houten kapconstructie.
- Houtsoort: vurenhout C24 of C18 conform berekening
- Spanten: h.o.h. conform tekening
- Gordingen: conform tekening
- Bevestiging: balkdragers, spantenkeerders
- Brandbeschermende behandeling indien vereist
Inclusief: hijswerk, steigerwerk`,

    "40.11.01": `STUCWERK - Pleisterwerk kalk-cement
Omschrijving:
Het aanbrengen van kalk-cement pleisterwerk.
- Ondergrond: baksteen of betonblokken
- Systeem: raaplaag + schuurlaag
- Dikte: totaal ca. 15mm
- Afwerking: fijn geschuurd
Inclusief: beugelen, hoekbeschermers`,

    "45.11.01": `SCHILDERWERK - Gronden en aflakken houtwerk
Omschrijving:
Het gronden en 2x dekkend aflakken van houtwerk.
- Ondergrond: grenen of hardhout
- Voorbehandeling: ontvetten, schuren
- Grondlaag: alkyd grondverf
- Aflaklagen: 2x alkyd hoogglans of zijdeglans
- Kleur: conform RAL-nummer
Inclusief: plamuren, schuren tussen lagen`,
  };

  // Update STABU items with specifications
  updated = 0;
  for (const [code, specification] of Object.entries(stabuSpecifications)) {
    const result = await prisma.libraryItem.updateMany({
      where: {
        code,
        library: { standard: "STABU" },
      },
      data: { specification },
    });
    if (result.count > 0) updated++;
  }

  console.log(`Updated ${updated} STABU items with specifications`);

  // RAW Items with specifications
  const rawSpecifications: Record<string, string> = {
    "01.01.01": `GRONDWERK - Ontgraven en verwerken in depot
Omschrijving:
Het machinaal ontgraven van grond en verwerken in depot op de werklocatie.
- Grondsoort: conform grondonderzoek
- Depot: binnen werkterrein
- Verwerking: in lagen verdicht
Voorwaarden:
- Depot niet hoger dan 2.00m
- Keuring vrijgave materiaal`,

    "10.01.01": `RIOLERING - PVC buis Ø125mm
Omschrijving:
Het leveren en aanbrengen van PVC rioolbuis.
- Materiaal: PVC-U SN8 volgens NEN 7037
- Diameter: 125mm
- Verbinding: schuifmof met rubber manchet
- Fundering: zandbed 150mm onder buis
Inclusief: bochten, hulpstukken, inspectie`,

    "11.01.01": `PUTTEN - Inspectieput beton Ø600mm
Omschrijving:
Het leveren en aanbrengen van betonnen inspectieput.
- Putringen: beton Ø600mm
- Bodem: prefab met stroominlaat
- Afdekking: betondeksel met gietijzeren rij-insteek
- Diepte: conform tekening
Inclusief: aansluiten leidingen, voegen`,

    "22.01.01": `ASFALT - Onderbak AC 16 base
Omschrijving:
Het leveren en aanbrengen van asfaltonderbak.
- Mengseltype: AC 16 base volgens RAW 2020
- Laagdikte: 60mm verdicht
- Bindmiddel: bitumen 70/100
- Ondergrond: gefundeerd volgens bestek
Inclusief: transport, walsen, voegen`,

    "23.01.01": `BESTRATING - Betonstraatstenen 21x10.5x8
Omschrijving:
Het leveren en straten van betonstraatstenen.
- Formaat: 210x105x80mm
- Druksterkte: ≥55 N/mm²
- Kleur: grijs of conform bestek
- Verband: keperverband of elleboogverband
- Straatzand: voegvulling 0-2mm
Inclusief: aftrillen, aanvullen voegen`,
  };

  // Update RAW items with specifications
  updated = 0;
  for (const [code, specification] of Object.entries(rawSpecifications)) {
    const result = await prisma.libraryItem.updateMany({
      where: {
        code,
        library: { standard: "RAW" },
      },
      data: { specification },
    });
    if (result.count > 0) updated++;
  }

  console.log(`Updated ${updated} RAW items with specifications`);
  console.log("Specification texts added successfully!");
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
