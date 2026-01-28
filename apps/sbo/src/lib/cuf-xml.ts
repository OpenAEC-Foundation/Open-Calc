/**
 * CUF-XML (Calculatie Uitwisseling Formaat)
 *
 * Nederlandse standaard voor het uitwisselen van calculatiegegevens
 * tussen begrotingsprogramma's in de bouwsector.
 */

// ============================================
// TYPES
// ============================================

export interface CufProject {
  name: string;
  number?: string;
  description?: string;
  client?: string;
  address?: string;
  city?: string;
}

export interface CufChapter {
  code: string;
  name: string;
  lines: CufLine[];
}

export interface CufLine {
  code?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  lineType?: "NORMAL" | "PROVISIONAL" | "ADJUSTABLE";
}

export interface CufEstimate {
  project: CufProject;
  chapters: CufChapter[];
  totalExclVat: number;
  vatPercentage: number;
  totalInclVat: number;
  createdAt: string;
  exportedBy?: string;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Generate CUF-XML from estimate data
 */
export function generateCufXml(estimate: CufEstimate): string {
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<CUF xmlns="http://www.cuf-standaard.nl/schema/2.0" version="2.0">
  <Header>
    <ExportDate>${new Date().toISOString()}</ExportDate>
    <ExportedBy>${escapeXml(estimate.exportedBy || "OpenCalc SBO")}</ExportedBy>
    <Software>OpenCalc SBO</Software>
    <SoftwareVersion>1.0.0</SoftwareVersion>
  </Header>
  <Project>
    <Name>${escapeXml(estimate.project.name)}</Name>
    ${estimate.project.number ? `<Number>${escapeXml(estimate.project.number)}</Number>` : ""}
    ${estimate.project.description ? `<Description>${escapeXml(estimate.project.description)}</Description>` : ""}
    ${estimate.project.client ? `<Client>${escapeXml(estimate.project.client)}</Client>` : ""}
    ${estimate.project.address ? `<Address>${escapeXml(estimate.project.address)}</Address>` : ""}
    ${estimate.project.city ? `<City>${escapeXml(estimate.project.city)}</City>` : ""}
  </Project>
  <Estimate>
    <CreatedAt>${estimate.createdAt}</CreatedAt>
    <Chapters>
`;

  for (const chapter of estimate.chapters) {
    xml += `      <Chapter>
        <Code>${escapeXml(chapter.code)}</Code>
        <Name>${escapeXml(chapter.name)}</Name>
        <Lines>
`;
    for (const line of chapter.lines) {
      xml += `          <Line>
            ${line.code ? `<Code>${escapeXml(line.code)}</Code>` : ""}
            <Description>${escapeXml(line.description)}</Description>
            <Unit>${escapeXml(line.unit)}</Unit>
            <Quantity>${formatNumber(line.quantity)}</Quantity>
            <UnitPrice>${formatNumber(line.unitPrice)}</UnitPrice>
            <TotalPrice>${formatNumber(line.totalPrice)}</TotalPrice>
            ${line.lineType && line.lineType !== "NORMAL" ? `<LineType>${line.lineType}</LineType>` : ""}
          </Line>
`;
    }
    xml += `        </Lines>
      </Chapter>
`;
  }

  xml += `    </Chapters>
    <Totals>
      <TotalExclVat>${formatNumber(estimate.totalExclVat)}</TotalExclVat>
      <VatPercentage>${formatNumber(estimate.vatPercentage)}</VatPercentage>
      <VatAmount>${formatNumber(estimate.totalExclVat * (estimate.vatPercentage / 100))}</VatAmount>
      <TotalInclVat>${formatNumber(estimate.totalInclVat)}</TotalInclVat>
    </Totals>
  </Estimate>
</CUF>`;

  return xml;
}

// ============================================
// IMPORT/PARSE FUNCTIONS
// ============================================

/**
 * Parse CUF-XML to estimate data
 */
export function parseCufXml(xmlString: string): CufEstimate {
  // Simple XML parser for CUF format
  const getTagContent = (xml: string, tag: string): string => {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match ? match[1] : "";
  };

  const getAllTagContents = (xml: string, tag: string): string[] => {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
    const results: string[] = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
      results.push(match[1]);
    }
    return results;
  };

  // Parse project
  const projectXml = getAllTagContents(xmlString, "Project")[0] || "";
  const project: CufProject = {
    name: getTagContent(projectXml, "Name"),
    number: getTagContent(projectXml, "Number") || undefined,
    description: getTagContent(projectXml, "Description") || undefined,
    client: getTagContent(projectXml, "Client") || undefined,
    address: getTagContent(projectXml, "Address") || undefined,
    city: getTagContent(projectXml, "City") || undefined,
  };

  // Parse chapters
  const chaptersXml = getAllTagContents(xmlString, "Chapter");
  const chapters: CufChapter[] = chaptersXml.map((chapterXml) => {
    const linesXml = getAllTagContents(chapterXml, "Line");
    const lines: CufLine[] = linesXml.map((lineXml) => ({
      code: getTagContent(lineXml, "Code") || undefined,
      description: getTagContent(lineXml, "Description"),
      unit: getTagContent(lineXml, "Unit"),
      quantity: parseFloat(getTagContent(lineXml, "Quantity")) || 0,
      unitPrice: parseFloat(getTagContent(lineXml, "UnitPrice")) || 0,
      totalPrice: parseFloat(getTagContent(lineXml, "TotalPrice")) || 0,
      lineType: (getTagContent(lineXml, "LineType") as "NORMAL" | "PROVISIONAL" | "ADJUSTABLE") || "NORMAL",
    }));

    return {
      code: getTagContent(chapterXml, "Code"),
      name: getTagContent(chapterXml, "Name"),
      lines,
    };
  });

  // Parse totals
  const totalsXml = getAllTagContents(xmlString, "Totals")[0] || "";
  const estimateXml = getAllTagContents(xmlString, "Estimate")[0] || "";

  return {
    project,
    chapters,
    totalExclVat: parseFloat(getTagContent(totalsXml, "TotalExclVat")) || 0,
    vatPercentage: parseFloat(getTagContent(totalsXml, "VatPercentage")) || 21,
    totalInclVat: parseFloat(getTagContent(totalsXml, "TotalInclVat")) || 0,
    createdAt: getTagContent(estimateXml, "CreatedAt") || new Date().toISOString(),
  };
}

/**
 * Validate CUF-XML structure
 */
export function validateCufXml(xmlString: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check XML declaration
  if (!xmlString.startsWith("<?xml")) {
    errors.push("Ontbrekende XML declaratie");
  }

  // Check CUF root element
  if (!xmlString.includes("<CUF")) {
    errors.push("Ontbrekende CUF root element");
  }

  // Check required elements
  const requiredElements = ["Project", "Name", "Estimate", "Chapters"];
  for (const element of requiredElements) {
    if (!xmlString.includes(`<${element}`)) {
      errors.push(`Ontbrekend verplicht element: ${element}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
