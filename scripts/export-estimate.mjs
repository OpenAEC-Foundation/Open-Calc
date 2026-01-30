import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const estimate = await prisma.estimate.findFirst({
    where: {
      project: { name: { contains: "Lepelaarssingel" } }
    },
    include: {
      project: true,
      chapters: {
        orderBy: { sortOrder: 'asc' },
        include: {
          lines: { orderBy: { sortOrder: 'asc' } }
        }
      },
      lines: {
        where: { chapterId: null },
        orderBy: { sortOrder: 'asc' }
      }
    }
  });

  if (!estimate) {
    console.log("Geen begroting gevonden");
    return;
  }

  // Generate HTML report
  let html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Begroting ${estimate.project.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a3a4a; border-bottom: 3px solid #c9a962; padding-bottom: 10px; }
    h2 { color: #1a3a4a; margin-top: 30px; background: #f5f5f5; padding: 10px; }
    h3 { color: #2a5a6a; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #1a3a4a; color: white; }
    tr:nth-child(even) { background: #f9f9f9; }
    .number { text-align: right; }
    .subtotal { font-weight: bold; background: #e8f0f4 !important; }
    .total { font-weight: bold; font-size: 1.1em; background: #c9a962 !important; }
    .chapter-total { font-weight: bold; background: #f0f0f0 !important; }
    .spec { font-size: 0.85em; color: #666; font-style: italic; }
    .summary { background: #f8f6f2; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .summary table { width: auto; min-width: 400px; }
    .optional { border: 2px dashed #c9a962; padding: 15px; margin: 20px 0; background: #fffef5; }
    .optional h2 { background: #c9a962; color: #1a3a4a; }
  </style>
</head>
<body>
  <h1>Begroting: ${estimate.name}</h1>
  <p><strong>Project:</strong> ${estimate.project.name}</p>
  <p><strong>Projectnummer:</strong> ${estimate.project.projectNumber || '-'}</p>
  <p><strong>Adres:</strong> ${estimate.project.address}, ${estimate.project.city}</p>
  <p><strong>Versie:</strong> ${estimate.version} | <strong>Status:</strong> ${estimate.status}</p>
  <p><strong>Omschrijving:</strong> ${estimate.description || '-'}</p>
`;

  // Chapters and lines
  for (const chapter of estimate.chapters) {
    const isOptional = chapter.code === "95";

    if (isOptional) {
      html += `<div class="optional">`;
    }

    html += `
  <h2>${chapter.code} - ${chapter.name}</h2>
  <table>
    <tr>
      <th style="width:40%">Omschrijving</th>
      <th style="width:10%">Aantal</th>
      <th style="width:8%">Eenheid</th>
      <th style="width:12%" class="number">Arbeid</th>
      <th style="width:12%" class="number">Materiaal</th>
      <th style="width:12%" class="number">Totaal</th>
    </tr>`;

    let chapterTotal = 0;
    for (const line of chapter.lines) {
      const lineTotal = line.totalPrice || 0;
      chapterTotal += lineTotal;

      html += `
    <tr>
      <td>${line.description}${line.specification ? `<br><span class="spec">${line.specification}</span>` : ''}</td>
      <td class="number">${line.quantity}</td>
      <td>${line.unit}</td>
      <td class="number">€ ${((line.laborCost || 0) * line.quantity).toFixed(2)}</td>
      <td class="number">€ ${((line.materialCost || 0) * line.quantity).toFixed(2)}</td>
      <td class="number">€ ${lineTotal.toFixed(2)}</td>
    </tr>`;
    }

    html += `
    <tr class="chapter-total">
      <td colspan="5">Subtotaal ${chapter.name}</td>
      <td class="number">€ ${chapterTotal.toFixed(2)}</td>
    </tr>
  </table>`;

    if (isOptional) {
      html += `</div>`;
    }
  }

  // Summary
  const fmt = (n) => n ? n.toFixed(2) : '0.00';

  html += `
  <div class="summary">
    <h2>Samenvatting</h2>
    <table>
      <tr><td>Arbeid</td><td class="number">€ ${fmt(estimate.totalLabor)}</td></tr>
      <tr><td>Materiaal</td><td class="number">€ ${fmt(estimate.totalMaterial)}</td></tr>
      <tr><td>Materieel</td><td class="number">€ ${fmt(estimate.totalEquipment)}</td></tr>
      <tr><td>Onderaanneming</td><td class="number">€ ${fmt(estimate.totalSubcontr)}</td></tr>
      <tr class="subtotal"><td>Subtotaal</td><td class="number">€ ${fmt(estimate.subtotal)}</td></tr>
      <tr><td>Algemene kosten (${estimate.generalCostsPercent}%)</td><td class="number">€ ${fmt(estimate.generalCostsAmount)}</td></tr>
      <tr><td>Winst (${estimate.profitPercent}%)</td><td class="number">€ ${fmt(estimate.profitAmount)}</td></tr>
      <tr><td>Risico (${estimate.riskPercent}%)</td><td class="number">€ ${fmt(estimate.riskAmount)}</td></tr>
      <tr class="subtotal"><td>Totaal excl. BTW</td><td class="number">€ ${fmt(estimate.totalExclVat)}</td></tr>
      <tr><td>BTW (${estimate.vatPercent}%)</td><td class="number">€ ${fmt(estimate.vatAmount)}</td></tr>
      <tr class="total"><td>TOTAAL INCL. BTW</td><td class="number">€ ${fmt(estimate.totalInclVat)}</td></tr>
    </table>
  </div>

  <p><em>Gegenereerd op: ${new Date().toLocaleString('nl-NL')}</em></p>
</body>
</html>`;

  // Write to file
  const outputPath = 'Z:/50_projecten/3_3BM_bouwtechniek/2967 Begroting Burgemeester Lepelaarssingel 38 Krimpen aan den IJssel/Begroting.html';
  fs.writeFileSync(outputPath, html);
  console.log(`Begroting geëxporteerd naar: ${outputPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
