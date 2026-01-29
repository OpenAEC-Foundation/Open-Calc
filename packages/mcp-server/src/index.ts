#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Default user ID (in production, this would come from auth)
const DEFAULT_USER_ID = "default-user";

// Ensure default user exists
async function ensureDefaultUser() {
  const user = await prisma.user.findUnique({ where: { id: DEFAULT_USER_ID } });
  if (!user) {
    await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        name: "MCP User",
        email: "mcp@opencalc.local",
      },
    });
  }
  return DEFAULT_USER_ID;
}

// Helper function to update estimate totals after line changes
async function updateEstimateTotals(estimateId: string) {
  const lines = await prisma.estimateLine.findMany({
    where: { estimateId },
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

  const estimate = await prisma.estimate.findUnique({ where: { id: estimateId } });
  if (!estimate) return;

  const generalCostsAmount = subtotal * ((estimate.generalCostsPercent || 0) / 100);
  const profitAmount = (subtotal + generalCostsAmount) * ((estimate.profitPercent || 0) / 100);
  const riskAmount = (subtotal + generalCostsAmount + profitAmount) * ((estimate.riskPercent || 0) / 100);
  const totalExclVat = subtotal + generalCostsAmount + profitAmount + riskAmount;
  const vatAmount = totalExclVat * ((estimate.vatPercent || 21) / 100);
  const totalInclVat = totalExclVat + vatAmount;

  await prisma.estimate.update({
    where: { id: estimateId },
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
}

// Update chapter totals
async function updateChapterTotals(chapterId: string) {
  const lines = await prisma.estimateLine.findMany({
    where: { chapterId },
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

  await prisma.estimateChapter.update({
    where: { id: chapterId },
    data: { ...totals, subtotal },
  });
}

// Create MCP Server
const server = new Server(
  {
    name: "opencalc-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool definitions
const tools = [
  {
    name: "create_project",
    description: "Maak een nieuw project aan. Een project is de container voor begrotingen.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Naam van het project (verplicht)" },
        projectNumber: { type: "string", description: "Projectnummer" },
        description: { type: "string", description: "Beschrijving van het project" },
        address: { type: "string", description: "Adres van het project" },
        city: { type: "string", description: "Plaats" },
        postalCode: { type: "string", description: "Postcode" },
      },
      required: ["name"],
    },
  },
  {
    name: "list_projects",
    description: "Toon alle projecten",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "create_estimate",
    description: "Maak een nieuwe begroting aan voor een project",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string", description: "ID van het project (verplicht)" },
        name: { type: "string", description: "Naam van de begroting (verplicht)" },
        description: { type: "string", description: "Beschrijving" },
        generalCostsPercent: { type: "number", description: "Algemene kosten percentage (standaard 10)" },
        profitPercent: { type: "number", description: "Winst percentage (standaard 5)" },
        riskPercent: { type: "number", description: "Risico percentage (standaard 3)" },
        vatPercent: { type: "number", description: "BTW percentage (standaard 21)" },
      },
      required: ["projectId", "name"],
    },
  },
  {
    name: "list_estimates",
    description: "Toon alle begrotingen voor een project",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectId: { type: "string", description: "ID van het project" },
      },
      required: ["projectId"],
    },
  },
  {
    name: "get_estimate",
    description: "Haal een begroting op met alle details (hoofdstukken en regels)",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimateId: { type: "string", description: "ID van de begroting" },
      },
      required: ["estimateId"],
    },
  },
  {
    name: "create_chapter",
    description: "Maak een hoofdstuk aan in een begroting (bijv. NL-SfB of STABU code)",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimateId: { type: "string", description: "ID van de begroting (verplicht)" },
        code: { type: "string", description: "Hoofdstukcode bijv. '21' voor Buitenwanden (verplicht)" },
        name: { type: "string", description: "Naam van het hoofdstuk (verplicht)" },
        parentId: { type: "string", description: "ID van parent hoofdstuk (optioneel)" },
      },
      required: ["estimateId", "code", "name"],
    },
  },
  {
    name: "create_estimate_line",
    description: "Voeg een begrotingsregel toe. Dit kan een werkpost, materiaal, of gecombineerde post zijn.",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimateId: { type: "string", description: "ID van de begroting (verplicht)" },
        chapterId: { type: "string", description: "ID van het hoofdstuk (optioneel)" },
        code: { type: "string", description: "Postcode bijv. '21.11.01'" },
        description: { type: "string", description: "Omschrijving van de post (verplicht)" },
        specification: { type: "string", description: "Specificatie/details" },
        quantity: { type: "number", description: "Hoeveelheid (standaard 1)" },
        unit: { type: "string", description: "Eenheid: st, m, m2, m3, kg, uur (standaard 'st')" },
        laborHours: { type: "number", description: "Arbeidsuren per eenheid" },
        laborRate: { type: "number", description: "Uurtarief (standaard 45)" },
        materialCost: { type: "number", description: "Materiaalkosten per eenheid" },
        equipmentCost: { type: "number", description: "Materieel/gereedschapkosten per eenheid" },
        subcontrCost: { type: "number", description: "Onderaannemerskosten per eenheid" },
      },
      required: ["estimateId", "description"],
    },
  },
  {
    name: "create_bulk_lines",
    description: "Voeg meerdere begrotingsregels tegelijk toe",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimateId: { type: "string", description: "ID van de begroting (verplicht)" },
        chapterId: { type: "string", description: "ID van het hoofdstuk (optioneel)" },
        lines: {
          type: "array",
          description: "Array van begrotingsregels",
          items: {
            type: "object",
            properties: {
              code: { type: "string" },
              description: { type: "string" },
              specification: { type: "string" },
              quantity: { type: "number" },
              unit: { type: "string" },
              laborHours: { type: "number" },
              laborRate: { type: "number" },
              materialCost: { type: "number" },
              equipmentCost: { type: "number" },
              subcontrCost: { type: "number" },
            },
            required: ["description"],
          },
        },
      },
      required: ["estimateId", "lines"],
    },
  },
  {
    name: "update_estimate_line",
    description: "Wijzig een bestaande begrotingsregel",
    inputSchema: {
      type: "object" as const,
      properties: {
        lineId: { type: "string", description: "ID van de regel (verplicht)" },
        code: { type: "string" },
        description: { type: "string" },
        specification: { type: "string" },
        quantity: { type: "number" },
        unit: { type: "string" },
        laborHours: { type: "number" },
        laborRate: { type: "number" },
        materialCost: { type: "number" },
        equipmentCost: { type: "number" },
        subcontrCost: { type: "number" },
      },
      required: ["lineId"],
    },
  },
  {
    name: "delete_estimate_line",
    description: "Verwijder een begrotingsregel",
    inputSchema: {
      type: "object" as const,
      properties: {
        lineId: { type: "string", description: "ID van de regel" },
      },
      required: ["lineId"],
    },
  },
  {
    name: "search_library",
    description: "Zoek in de kostenbibliotheek naar standaard posten",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Zoekterm" },
        categoryId: { type: "string", description: "Filter op categorie ID" },
      },
      required: ["query"],
    },
  },
  {
    name: "add_library_item_to_estimate",
    description: "Voeg een bibliotheekpost toe aan een begroting",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimateId: { type: "string", description: "ID van de begroting (verplicht)" },
        chapterId: { type: "string", description: "ID van het hoofdstuk (optioneel)" },
        libraryItemId: { type: "string", description: "ID van het bibliotheekitem (verplicht)" },
        quantity: { type: "number", description: "Hoeveelheid (standaard 1)" },
      },
      required: ["estimateId", "libraryItemId"],
    },
  },
  {
    name: "update_estimate_settings",
    description: "Wijzig begroting instellingen (opslagpercentages, BTW)",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimateId: { type: "string", description: "ID van de begroting (verplicht)" },
        name: { type: "string" },
        description: { type: "string" },
        generalCostsPercent: { type: "number" },
        profitPercent: { type: "number" },
        riskPercent: { type: "number" },
        vatPercent: { type: "number" },
        notes: { type: "string" },
      },
      required: ["estimateId"],
    },
  },
  {
    name: "duplicate_estimate",
    description: "Kopieer een begroting (optioneel naar ander project)",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimateId: { type: "string", description: "ID van de begroting om te kopieren" },
        targetProjectId: { type: "string", description: "ID van doelproject (optioneel, anders zelfde project)" },
        newName: { type: "string", description: "Naam voor de kopie" },
      },
      required: ["estimateId"],
    },
  },
  {
    name: "get_estimate_summary",
    description: "Krijg een samenvatting van de begroting met totalen",
    inputSchema: {
      type: "object" as const,
      properties: {
        estimateId: { type: "string", description: "ID van de begroting" },
      },
      required: ["estimateId"],
    },
  },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const userId = await ensureDefaultUser();

    switch (name) {
      case "create_project": {
        const project = await prisma.project.create({
          data: {
            name: args.name as string,
            projectNumber: args.projectNumber as string | undefined,
            description: args.description as string | undefined,
            address: args.address as string | undefined,
            city: args.city as string | undefined,
            postalCode: args.postalCode as string | undefined,
            status: "DRAFT",
            userId,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Project "${project.name}" aangemaakt`,
                  project: {
                    id: project.id,
                    name: project.name,
                    projectNumber: project.projectNumber,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_projects": {
        const projects = await prisma.project.findMany({
          where: { userId },
          include: {
            _count: { select: { estimates: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  projects: projects.map((p) => ({
                    id: p.id,
                    name: p.name,
                    projectNumber: p.projectNumber,
                    city: p.city,
                    status: p.status,
                    estimateCount: p._count.estimates,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "create_estimate": {
        // Get highest version for this project
        const existingEstimates = await prisma.estimate.findMany({
          where: { projectId: args.projectId as string },
          select: { version: true },
          orderBy: { version: "desc" },
          take: 1,
        });
        const nextVersion = existingEstimates.length > 0 ? existingEstimates[0].version + 1 : 1;

        const estimate = await prisma.estimate.create({
          data: {
            name: args.name as string,
            description: args.description as string | undefined,
            version: nextVersion,
            status: "DRAFT",
            generalCostsPercent: (args.generalCostsPercent as number) ?? 10,
            profitPercent: (args.profitPercent as number) ?? 5,
            riskPercent: (args.riskPercent as number) ?? 3,
            vatPercent: (args.vatPercent as number) ?? 21,
            projectId: args.projectId as string,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Begroting "${estimate.name}" (v${estimate.version}) aangemaakt`,
                  estimate: {
                    id: estimate.id,
                    name: estimate.name,
                    version: estimate.version,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_estimates": {
        const estimates = await prisma.estimate.findMany({
          where: { projectId: args.projectId as string },
          include: {
            _count: { select: { lines: true, chapters: true } },
          },
          orderBy: { version: "desc" },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  estimates: estimates.map((e) => ({
                    id: e.id,
                    name: e.name,
                    version: e.version,
                    status: e.status,
                    totalInclVat: e.totalInclVat,
                    lineCount: e._count.lines,
                    chapterCount: e._count.chapters,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_estimate": {
        const estimate = await prisma.estimate.findUnique({
          where: { id: args.estimateId as string },
          include: {
            project: { select: { name: true, projectNumber: true } },
            chapters: {
              include: {
                lines: { orderBy: { sortOrder: "asc" } },
              },
              orderBy: { sortOrder: "asc" },
            },
            lines: {
              where: { chapterId: null },
              orderBy: { sortOrder: "asc" },
            },
          },
        });
        if (!estimate) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Begroting niet gevonden" }) }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(estimate, null, 2) }],
        };
      }

      case "create_chapter": {
        // Get highest sortOrder
        const existingChapters = await prisma.estimateChapter.findMany({
          where: { estimateId: args.estimateId as string },
          select: { sortOrder: true },
          orderBy: { sortOrder: "desc" },
          take: 1,
        });
        const nextSortOrder = existingChapters.length > 0 ? existingChapters[0].sortOrder + 1 : 1;

        const chapter = await prisma.estimateChapter.create({
          data: {
            code: args.code as string,
            name: args.name as string,
            sortOrder: nextSortOrder,
            estimateId: args.estimateId as string,
            parentId: args.parentId as string | undefined,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Hoofdstuk "${chapter.code} - ${chapter.name}" aangemaakt`,
                  chapter: { id: chapter.id, code: chapter.code, name: chapter.name },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "create_estimate_line": {
        // Get highest sortOrder for this chapter or estimate
        const whereClause = args.chapterId
          ? { chapterId: args.chapterId as string }
          : { estimateId: args.estimateId as string, chapterId: null };

        const existingLines = await prisma.estimateLine.findMany({
          where: whereClause,
          select: { sortOrder: true },
          orderBy: { sortOrder: "desc" },
          take: 1,
        });
        const nextSortOrder = existingLines.length > 0 ? existingLines[0].sortOrder + 1 : 1;

        const laborHours = (args.laborHours as number) || 0;
        const laborRate = (args.laborRate as number) || 45;
        const laborCost = laborHours * laborRate;
        const materialCost = (args.materialCost as number) || 0;
        const equipmentCost = (args.equipmentCost as number) || 0;
        const subcontrCost = (args.subcontrCost as number) || 0;
        const unitPrice = laborCost + materialCost + equipmentCost + subcontrCost;
        const quantity = (args.quantity as number) || 1;
        const totalPrice = unitPrice * quantity;

        const line = await prisma.estimateLine.create({
          data: {
            code: args.code as string | undefined,
            description: args.description as string,
            specification: args.specification as string | undefined,
            quantity,
            unit: (args.unit as string) || "st",
            laborHours,
            laborRate,
            laborCost,
            materialCost,
            equipmentCost,
            subcontrCost,
            unitPrice,
            totalPrice,
            sortOrder: nextSortOrder,
            estimateId: args.estimateId as string,
            chapterId: args.chapterId as string | undefined,
          },
        });

        // Update totals
        await updateEstimateTotals(args.estimateId as string);
        if (args.chapterId) {
          await updateChapterTotals(args.chapterId as string);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Regel "${line.description}" toegevoegd`,
                  line: {
                    id: line.id,
                    description: line.description,
                    quantity: line.quantity,
                    unit: line.unit,
                    unitPrice: line.unitPrice,
                    totalPrice: line.totalPrice,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "create_bulk_lines": {
        const lines = args.lines as Array<{
          code?: string;
          description: string;
          specification?: string;
          quantity?: number;
          unit?: string;
          laborHours?: number;
          laborRate?: number;
          materialCost?: number;
          equipmentCost?: number;
          subcontrCost?: number;
        }>;

        // Get starting sortOrder
        const whereClause = args.chapterId
          ? { chapterId: args.chapterId as string }
          : { estimateId: args.estimateId as string, chapterId: null };

        const existingLines = await prisma.estimateLine.findMany({
          where: whereClause,
          select: { sortOrder: true },
          orderBy: { sortOrder: "desc" },
          take: 1,
        });
        let nextSortOrder = existingLines.length > 0 ? existingLines[0].sortOrder + 1 : 1;

        const createdLines = [];
        for (const lineData of lines) {
          const laborHours = lineData.laborHours || 0;
          const laborRate = lineData.laborRate || 45;
          const laborCost = laborHours * laborRate;
          const materialCost = lineData.materialCost || 0;
          const equipmentCost = lineData.equipmentCost || 0;
          const subcontrCost = lineData.subcontrCost || 0;
          const unitPrice = laborCost + materialCost + equipmentCost + subcontrCost;
          const quantity = lineData.quantity || 1;
          const totalPrice = unitPrice * quantity;

          const line = await prisma.estimateLine.create({
            data: {
              code: lineData.code,
              description: lineData.description,
              specification: lineData.specification,
              quantity,
              unit: lineData.unit || "st",
              laborHours,
              laborRate,
              laborCost,
              materialCost,
              equipmentCost,
              subcontrCost,
              unitPrice,
              totalPrice,
              sortOrder: nextSortOrder++,
              estimateId: args.estimateId as string,
              chapterId: args.chapterId as string | undefined,
            },
          });
          createdLines.push(line);
        }

        // Update totals once
        await updateEstimateTotals(args.estimateId as string);
        if (args.chapterId) {
          await updateChapterTotals(args.chapterId as string);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `${createdLines.length} regels toegevoegd`,
                  lines: createdLines.map((l) => ({
                    id: l.id,
                    description: l.description,
                    totalPrice: l.totalPrice,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "update_estimate_line": {
        const line = await prisma.estimateLine.findUnique({
          where: { id: args.lineId as string },
        });
        if (!line) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Regel niet gevonden" }) }],
          };
        }

        const laborHours = (args.laborHours as number) ?? line.laborHours ?? 0;
        const laborRate = (args.laborRate as number) ?? line.laborRate ?? 45;
        const laborCost = laborHours * laborRate;
        const materialCost = (args.materialCost as number) ?? line.materialCost ?? 0;
        const equipmentCost = (args.equipmentCost as number) ?? line.equipmentCost ?? 0;
        const subcontrCost = (args.subcontrCost as number) ?? line.subcontrCost ?? 0;
        const unitPrice = laborCost + materialCost + equipmentCost + subcontrCost;
        const quantity = (args.quantity as number) ?? line.quantity ?? 1;
        const totalPrice = unitPrice * quantity;

        const updatedLine = await prisma.estimateLine.update({
          where: { id: args.lineId as string },
          data: {
            code: args.code !== undefined ? (args.code as string) : undefined,
            description: args.description !== undefined ? (args.description as string) : undefined,
            specification: args.specification !== undefined ? (args.specification as string) : undefined,
            quantity,
            unit: args.unit !== undefined ? (args.unit as string) : undefined,
            laborHours,
            laborRate,
            laborCost,
            materialCost,
            equipmentCost,
            subcontrCost,
            unitPrice,
            totalPrice,
          },
        });

        await updateEstimateTotals(line.estimateId);
        if (line.chapterId) {
          await updateChapterTotals(line.chapterId);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Regel "${updatedLine.description}" bijgewerkt`,
                  line: {
                    id: updatedLine.id,
                    description: updatedLine.description,
                    totalPrice: updatedLine.totalPrice,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "delete_estimate_line": {
        const line = await prisma.estimateLine.findUnique({
          where: { id: args.lineId as string },
        });
        if (!line) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Regel niet gevonden" }) }],
          };
        }

        await prisma.estimateLine.delete({
          where: { id: args.lineId as string },
        });

        await updateEstimateTotals(line.estimateId);
        if (line.chapterId) {
          await updateChapterTotals(line.chapterId);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, message: "Regel verwijderd" }, null, 2),
            },
          ],
        };
      }

      case "search_library": {
        const items = await prisma.libraryItem.findMany({
          where: {
            AND: [
              { isActive: true },
              {
                OR: [
                  { description: { contains: args.query as string } },
                  { code: { contains: args.query as string } },
                  { specification: { contains: args.query as string } },
                ],
              },
              args.categoryId ? { categoryId: args.categoryId as string } : {},
            ],
          },
          include: {
            category: { select: { name: true } },
          },
          take: 20,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  results: items.map((i) => ({
                    id: i.id,
                    code: i.code,
                    description: i.description,
                    unit: i.unit,
                    unitPrice: i.unitPrice,
                    category: i.category?.name,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "add_library_item_to_estimate": {
        const item = await prisma.libraryItem.findUnique({
          where: { id: args.libraryItemId as string },
        });
        if (!item) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Bibliotheekitem niet gevonden" }) }],
          };
        }

        // Get highest sortOrder
        const whereClause = args.chapterId
          ? { chapterId: args.chapterId as string }
          : { estimateId: args.estimateId as string, chapterId: null };

        const existingLines = await prisma.estimateLine.findMany({
          where: whereClause,
          select: { sortOrder: true },
          orderBy: { sortOrder: "desc" },
          take: 1,
        });
        const nextSortOrder = existingLines.length > 0 ? existingLines[0].sortOrder + 1 : 1;

        const quantity = (args.quantity as number) || 1;
        const totalPrice = (item.unitPrice || 0) * quantity;

        const line = await prisma.estimateLine.create({
          data: {
            code: item.code || undefined,
            description: item.description,
            specification: item.specification || undefined,
            quantity,
            unit: item.unit || "st",
            laborHours: item.laborHours || 0,
            laborRate: item.laborRate || 45,
            laborCost: item.laborCost || 0,
            materialCost: item.materialCost || 0,
            equipmentCost: item.equipmentCost || 0,
            subcontrCost: item.subcontrCost || 0,
            unitPrice: item.unitPrice || 0,
            totalPrice,
            sortOrder: nextSortOrder,
            estimateId: args.estimateId as string,
            chapterId: args.chapterId as string | undefined,
            libraryItemId: item.id,
          },
        });

        await updateEstimateTotals(args.estimateId as string);
        if (args.chapterId) {
          await updateChapterTotals(args.chapterId as string);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Bibliotheekitem "${item.description}" toegevoegd`,
                  line: {
                    id: line.id,
                    description: line.description,
                    totalPrice: line.totalPrice,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "update_estimate_settings": {
        const estimate = await prisma.estimate.update({
          where: { id: args.estimateId as string },
          data: {
            name: args.name !== undefined ? (args.name as string) : undefined,
            description: args.description !== undefined ? (args.description as string) : undefined,
            generalCostsPercent: args.generalCostsPercent !== undefined ? (args.generalCostsPercent as number) : undefined,
            profitPercent: args.profitPercent !== undefined ? (args.profitPercent as number) : undefined,
            riskPercent: args.riskPercent !== undefined ? (args.riskPercent as number) : undefined,
            vatPercent: args.vatPercent !== undefined ? (args.vatPercent as number) : undefined,
            notes: args.notes !== undefined ? (args.notes as string) : undefined,
          },
        });

        // Recalculate totals with new percentages
        await updateEstimateTotals(args.estimateId as string);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Begroting "${estimate.name}" bijgewerkt`,
                  estimate: {
                    id: estimate.id,
                    name: estimate.name,
                    generalCostsPercent: estimate.generalCostsPercent,
                    profitPercent: estimate.profitPercent,
                    riskPercent: estimate.riskPercent,
                    vatPercent: estimate.vatPercent,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "duplicate_estimate": {
        const source = await prisma.estimate.findUnique({
          where: { id: args.estimateId as string },
          include: {
            chapters: {
              include: { lines: true },
            },
            lines: { where: { chapterId: null } },
          },
        });
        if (!source) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Begroting niet gevonden" }) }],
          };
        }

        const targetProjectId = (args.targetProjectId as string) || source.projectId;

        // Get next version
        const existingEstimates = await prisma.estimate.findMany({
          where: { projectId: targetProjectId },
          select: { version: true },
          orderBy: { version: "desc" },
          take: 1,
        });
        const nextVersion = existingEstimates.length > 0 ? existingEstimates[0].version + 1 : 1;

        // Create new estimate
        const newEstimate = await prisma.estimate.create({
          data: {
            name: (args.newName as string) || `${source.name} (kopie)`,
            description: source.description,
            version: nextVersion,
            status: "DRAFT",
            generalCostsPercent: source.generalCostsPercent,
            profitPercent: source.profitPercent,
            riskPercent: source.riskPercent,
            vatPercent: source.vatPercent,
            notes: source.notes,
            projectId: targetProjectId,
          },
        });

        // Copy chapters and lines
        const chapterIdMap = new Map<string, string>();

        for (const chapter of source.chapters) {
          const newChapter = await prisma.estimateChapter.create({
            data: {
              code: chapter.code,
              name: chapter.name,
              sortOrder: chapter.sortOrder,
              estimateId: newEstimate.id,
            },
          });
          chapterIdMap.set(chapter.id, newChapter.id);

          // Copy chapter lines
          for (const line of chapter.lines) {
            await prisma.estimateLine.create({
              data: {
                code: line.code,
                description: line.description,
                specification: line.specification,
                quantity: line.quantity,
                unit: line.unit,
                laborHours: line.laborHours,
                laborRate: line.laborRate,
                laborCost: line.laborCost,
                materialCost: line.materialCost,
                equipmentCost: line.equipmentCost,
                subcontrCost: line.subcontrCost,
                unitPrice: line.unitPrice,
                totalPrice: line.totalPrice,
                sortOrder: line.sortOrder,
                estimateId: newEstimate.id,
                chapterId: newChapter.id,
                libraryItemId: line.libraryItemId,
              },
            });
          }
        }

        // Copy unassigned lines
        for (const line of source.lines) {
          await prisma.estimateLine.create({
            data: {
              code: line.code,
              description: line.description,
              specification: line.specification,
              quantity: line.quantity,
              unit: line.unit,
              laborHours: line.laborHours,
              laborRate: line.laborRate,
              laborCost: line.laborCost,
              materialCost: line.materialCost,
              equipmentCost: line.equipmentCost,
              subcontrCost: line.subcontrCost,
              unitPrice: line.unitPrice,
              totalPrice: line.totalPrice,
              sortOrder: line.sortOrder,
              estimateId: newEstimate.id,
              libraryItemId: line.libraryItemId,
            },
          });
        }

        // Calculate totals
        await updateEstimateTotals(newEstimate.id);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: `Begroting gekopieerd als "${newEstimate.name}" (v${newEstimate.version})`,
                  estimate: {
                    id: newEstimate.id,
                    name: newEstimate.name,
                    version: newEstimate.version,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_estimate_summary": {
        const estimate = await prisma.estimate.findUnique({
          where: { id: args.estimateId as string },
          include: {
            project: { select: { name: true, projectNumber: true } },
            _count: { select: { lines: true, chapters: true } },
          },
        });
        if (!estimate) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Begroting niet gevonden" }) }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  project: {
                    name: estimate.project.name,
                    projectNumber: estimate.project.projectNumber,
                  },
                  estimate: {
                    id: estimate.id,
                    name: estimate.name,
                    version: estimate.version,
                    status: estimate.status,
                  },
                  counts: {
                    chapters: estimate._count.chapters,
                    lines: estimate._count.lines,
                  },
                  kosten: {
                    arbeid: estimate.totalLabor,
                    materiaal: estimate.totalMaterial,
                    materieel: estimate.totalEquipment,
                    onderaanneming: estimate.totalSubcontr,
                    subtotaal: estimate.subtotal,
                  },
                  opslagen: {
                    algemeenPercent: estimate.generalCostsPercent,
                    algemeenBedrag: estimate.generalCostsAmount,
                    winstPercent: estimate.profitPercent,
                    winstBedrag: estimate.profitAmount,
                    risicoPercent: estimate.riskPercent,
                    risicoBedrag: estimate.riskAmount,
                  },
                  totalen: {
                    totaalExclBtw: estimate.totalExclVat,
                    btwPercent: estimate.vatPercent,
                    btwBedrag: estimate.vatAmount,
                    totaalInclBtw: estimate.totalInclVat,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Onbekende tool: ${name}` }) }],
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Onbekende fout";
    return {
      content: [{ type: "text", text: JSON.stringify({ error: errorMessage }) }],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "opencalc://projects",
        name: "Alle Projecten",
        description: "Overzicht van alle projecten",
        mimeType: "application/json",
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "opencalc://projects") {
    const userId = await ensureDefaultUser();
    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        estimates: {
          select: {
            id: true,
            name: true,
            version: true,
            status: true,
            totalInclVat: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  }

  throw new Error(`Resource niet gevonden: ${uri}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpenCalc MCP Server gestart");
}

main().catch((error) => {
  console.error("Server fout:", error);
  process.exit(1);
});
