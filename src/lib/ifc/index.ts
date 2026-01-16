/**
 * IFC (Industry Foundation Classes) Export Generator
 *
 * Generates IFC4 files for cost estimation data.
 * IFC is an open, international standard (ISO 16739-1:2018) for BIM data exchange.
 *
 * This implementation focuses on IfcCostSchedule and IfcCostItem entities
 * to represent the cost estimate structure.
 */

interface EstimateChapter {
  id: string;
  code: string;
  name: string;
  lines: EstimateLine[];
  subtotal: number;
}

interface EstimateLine {
  id: string;
  code: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  subcontrCost: number;
}

interface EstimateData {
  id: string;
  name: string;
  version: number;
  project: {
    name: string;
    projectNumber: string | null;
    address: string | null;
    city: string | null;
  };
  chapters: EstimateChapter[];
  totals: {
    totalLabor: number;
    totalMaterial: number;
    totalEquipment: number;
    totalSubcontr: number;
    subtotal: number;
    generalCostsPercent: number;
    generalCostsAmount: number;
    profitPercent: number;
    profitAmount: number;
    riskPercent: number;
    riskAmount: number;
    totalExclVat: number;
    vatPercent: number;
    vatAmount: number;
    totalInclVat: number;
  };
}

export class IFCGenerator {
  private entityId: number = 0;
  private lines: string[] = [];

  private nextId(): number {
    return ++this.entityId;
  }

  private formatFloat(value: number): string {
    return value.toFixed(2);
  }

  private formatString(value: string): string {
    // IFC string escaping
    return `'${value.replace(/'/g, "''")}'`;
  }

  private formatDate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `'${year}-${month}-${day}'`;
  }

  private addLine(entityId: number, content: string): void {
    this.lines.push(`#${entityId}=${content};`);
  }

  generate(estimate: EstimateData): string {
    this.entityId = 0;
    this.lines = [];

    // Generate header
    const header = this.generateHeader(estimate);

    // Generate data section entities
    this.generateEntities(estimate);

    // Assemble the IFC file
    const dataSection = this.lines.join('\n');

    return `${header}
DATA;
${dataSection}
ENDSEC;
END-ISO-10303-21;`;
  }

  private generateHeader(estimate: EstimateData): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const projectName = estimate.project.name.replace(/'/g, "''");

    return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('Cost Estimate Export','${estimate.name.replace(/'/g, "''")}'),'2;1');
FILE_NAME('${estimate.id}.ifc','${timestamp}',('OpenCalc'),('OpenCalc BV'),'OpenCalc IFC Export','OpenCalc 1.0','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
`;
  }

  private generateEntities(estimate: EstimateData): void {
    // 1. Create Organization and Person
    const orgId = this.nextId();
    this.addLine(orgId, `IFCORGANIZATION($,'OpenCalc','OpenCalc Begroting Software',$,$)`);

    const personId = this.nextId();
    this.addLine(personId, `IFCPERSON($,$,$,$,$,$,$,$)`);

    const personOrgId = this.nextId();
    this.addLine(personOrgId, `IFCPERSONANDORGANIZATION(#${personId},#${orgId},$)`);

    // 2. Create Application
    const appId = this.nextId();
    this.addLine(appId, `IFCAPPLICATION(#${orgId},'1.0','OpenCalc','OpenCalc')`);

    // 3. Create OwnerHistory
    const ownerHistoryId = this.nextId();
    this.addLine(ownerHistoryId, `IFCOWNERHISTORY(#${personOrgId},#${appId},$,.ADDED.,${Math.floor(Date.now() / 1000)},$,$,$)`);

    // 4. Create Units
    const lengthUnitId = this.nextId();
    this.addLine(lengthUnitId, `IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)`);

    const areaUnitId = this.nextId();
    this.addLine(areaUnitId, `IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.)`);

    const volumeUnitId = this.nextId();
    this.addLine(volumeUnitId, `IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.)`);

    const monetaryUnitId = this.nextId();
    this.addLine(monetaryUnitId, `IFCMONETARYUNIT('EUR')`);

    const unitAssignmentId = this.nextId();
    this.addLine(unitAssignmentId, `IFCUNITASSIGNMENT((#${lengthUnitId},#${areaUnitId},#${volumeUnitId},#${monetaryUnitId}))`);

    // 5. Create Project
    const projectId = this.nextId();
    const projectName = this.formatString(estimate.project.name);
    const projectNumber = estimate.project.projectNumber
      ? this.formatString(estimate.project.projectNumber)
      : '$';
    this.addLine(projectId, `IFCPROJECT('${this.generateGUID()}',#${ownerHistoryId},${projectName},${projectNumber},$,$,$,(#${unitAssignmentId}),$)`);

    // 6. Create Cost Schedule
    const costScheduleId = this.nextId();
    const scheduleName = this.formatString(estimate.name);
    this.addLine(costScheduleId, `IFCCOSTSCHEDULE('${this.generateGUID()}',#${ownerHistoryId},${scheduleName},$,$,$,$,$,$,.ESTIMATE.,$)`);

    // 7. Create Cost Items for each chapter
    const chapterCostItemIds: number[] = [];

    for (const chapter of estimate.chapters) {
      const chapterId = this.createChapterCostItem(chapter, ownerHistoryId, monetaryUnitId);
      chapterCostItemIds.push(chapterId);
    }

    // 8. Create summary cost items
    this.createSummaryCostItems(estimate.totals, ownerHistoryId, monetaryUnitId);

    // 9. Create relationships
    if (chapterCostItemIds.length > 0) {
      const relId = this.nextId();
      const itemRefs = chapterCostItemIds.map(id => `#${id}`).join(',');
      this.addLine(relId, `IFCRELASSIGNSTOCONTROL('${this.generateGUID()}',#${ownerHistoryId},$,$,(${itemRefs}),$,#${costScheduleId})`);
    }
  }

  private createChapterCostItem(
    chapter: EstimateChapter,
    ownerHistoryId: number,
    monetaryUnitId: number
  ): number {
    const chapterId = this.nextId();
    const name = this.formatString(`${chapter.code} ${chapter.name}`);

    this.addLine(chapterId, `IFCCOSTITEM('${this.generateGUID()}',#${ownerHistoryId},${name},$,$,$,$)`);

    // Create cost values for each line
    const lineCostItemIds: number[] = [];

    for (const line of chapter.lines) {
      const lineId = this.createLineCostItem(line, ownerHistoryId, monetaryUnitId);
      lineCostItemIds.push(lineId);
    }

    // Create nesting relationship for lines under chapter
    if (lineCostItemIds.length > 0) {
      const nestRelId = this.nextId();
      const lineRefs = lineCostItemIds.map(id => `#${id}`).join(',');
      this.addLine(nestRelId, `IFCRELNESTS('${this.generateGUID()}',#${ownerHistoryId},$,$,#${chapterId},(${lineRefs}))`);
    }

    return chapterId;
  }

  private createLineCostItem(
    line: EstimateLine,
    ownerHistoryId: number,
    monetaryUnitId: number
  ): number {
    const lineId = this.nextId();
    const code = line.code ? this.formatString(line.code) : '$';
    const description = this.formatString(line.description);

    this.addLine(lineId, `IFCCOSTITEM('${this.generateGUID()}',#${ownerHistoryId},${description},$,${code},$,$)`);

    // Create quantity
    const quantityId = this.nextId();
    const unitLabel = this.formatString(line.unit);
    this.addLine(quantityId, `IFCQUANTITYCOUNT('Quantity',$,${unitLabel},${this.formatFloat(line.quantity)},$)`);

    // Create cost value
    const costValueId = this.nextId();
    this.addLine(costValueId, `IFCCOSTVALUE($,$,$,#${monetaryUnitId},${this.formatFloat(line.totalPrice)},$,$,$,$)`);

    // Create applied value for cost breakdown
    if (line.laborCost > 0 || line.materialCost > 0) {
      // Labor cost value
      if (line.laborCost > 0) {
        const laborValueId = this.nextId();
        this.addLine(laborValueId, `IFCCOSTVALUE('Arbeid',$,$,#${monetaryUnitId},${this.formatFloat(line.laborCost)},$,$,$,$)`);
      }

      // Material cost value
      if (line.materialCost > 0) {
        const materialValueId = this.nextId();
        this.addLine(materialValueId, `IFCCOSTVALUE('Materiaal',$,$,#${monetaryUnitId},${this.formatFloat(line.materialCost)},$,$,$,$)`);
      }

      // Equipment cost value
      if (line.equipmentCost > 0) {
        const equipmentValueId = this.nextId();
        this.addLine(equipmentValueId, `IFCCOSTVALUE('Materieel',$,$,#${monetaryUnitId},${this.formatFloat(line.equipmentCost)},$,$,$,$)`);
      }

      // Subcontractor cost value
      if (line.subcontrCost > 0) {
        const subcontrValueId = this.nextId();
        this.addLine(subcontrValueId, `IFCCOSTVALUE('Onderaanneming',$,$,#${monetaryUnitId},${this.formatFloat(line.subcontrCost)},$,$,$,$)`);
      }
    }

    return lineId;
  }

  private createSummaryCostItems(
    totals: EstimateData['totals'],
    ownerHistoryId: number,
    monetaryUnitId: number
  ): void {
    // Summary cost item
    const summaryId = this.nextId();
    this.addLine(summaryId, `IFCCOSTITEM('${this.generateGUID()}',#${ownerHistoryId},'Totalen',$,$,$,$)`);

    // Subtotal
    const subtotalId = this.nextId();
    this.addLine(subtotalId, `IFCCOSTVALUE('Subtotaal',$,$,#${monetaryUnitId},${this.formatFloat(totals.subtotal)},$,$,$,$)`);

    // General costs
    if (totals.generalCostsAmount > 0) {
      const generalCostsId = this.nextId();
      this.addLine(generalCostsId, `IFCCOSTVALUE('Algemene kosten (${totals.generalCostsPercent}%)',$,$,#${monetaryUnitId},${this.formatFloat(totals.generalCostsAmount)},$,$,$,$)`);
    }

    // Profit
    if (totals.profitAmount > 0) {
      const profitId = this.nextId();
      this.addLine(profitId, `IFCCOSTVALUE('Winst (${totals.profitPercent}%)',$,$,#${monetaryUnitId},${this.formatFloat(totals.profitAmount)},$,$,$,$)`);
    }

    // Risk
    if (totals.riskAmount > 0) {
      const riskId = this.nextId();
      this.addLine(riskId, `IFCCOSTVALUE('Risico (${totals.riskPercent}%)',$,$,#${monetaryUnitId},${this.formatFloat(totals.riskAmount)},$,$,$,$)`);
    }

    // Total excl. VAT
    const totalExclVatId = this.nextId();
    this.addLine(totalExclVatId, `IFCCOSTVALUE('Totaal excl. BTW',$,$,#${monetaryUnitId},${this.formatFloat(totals.totalExclVat)},$,$,$,$)`);

    // VAT
    const vatId = this.nextId();
    this.addLine(vatId, `IFCCOSTVALUE('BTW (${totals.vatPercent}%)',$,$,#${monetaryUnitId},${this.formatFloat(totals.vatAmount)},$,$,$,$)`);

    // Total incl. VAT
    const totalInclVatId = this.nextId();
    this.addLine(totalInclVatId, `IFCCOSTVALUE('Totaal incl. BTW',$,$,#${monetaryUnitId},${this.formatFloat(totals.totalInclVat)},$,$,$,$)`);
  }

  private generateGUID(): string {
    // Generate a base64-like IFC GUID (22 characters)
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
    let guid = '';
    for (let i = 0; i < 22; i++) {
      guid += chars.charAt(Math.floor(Math.random() * 64));
    }
    return guid;
  }
}

export function generateIFC(estimate: EstimateData): string {
  const generator = new IFCGenerator();
  return generator.generate(estimate);
}

export type { EstimateData, EstimateChapter, EstimateLine };
