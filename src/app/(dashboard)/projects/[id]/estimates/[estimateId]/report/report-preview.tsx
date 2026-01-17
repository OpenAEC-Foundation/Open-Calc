"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

interface EstimateLine {
  id: string;
  code: string | null;
  description: string;
  specification: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface EstimateChapter {
  id: string;
  code: string;
  name: string;
  lines: EstimateLine[];
}

interface Client {
  name: string;
  contactPerson: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
}

interface Project {
  name: string;
  projectNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  client: Client | null;
}

interface Estimate {
  id: string;
  name: string;
  version: number;
  description: string | null;
  validUntil: Date | null;
  notes: string | null;
  generalCostsPercent: number;
  profitPercent: number;
  riskPercent: number;
  vatPercent: number;
  project: Project;
  chapters: EstimateChapter[];
  lines: EstimateLine[];
}

interface CompanySettings {
  companyName: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyPostalCode: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  companyWebsite: string | null;
  companyLogo: string | null;
  kvkNumber: string | null;
  btwNumber: string | null;
  ibanNumber: string | null;
}

interface Totals {
  labor: number;
  material: number;
  equipment: number;
  subcontr: number;
  subtotal: number;
  generalCosts: number;
  profit: number;
  risk: number;
  totalExclVat: number;
  vat: number;
  totalInclVat: number;
}

interface ReportPreviewProps {
  estimate: Estimate;
  company: CompanySettings | null;
  totals: Totals;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ReportPreview({ estimate, company, totals }: ReportPreviewProps) {
  const today = new Date();

  return (
    <Card className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none print:p-0">
      {/* Header with Logo and Company Info */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {company?.companyLogo ? (
            <img
              src={company.companyLogo}
              alt={company.companyName || "Logo"}
              className="h-16 mb-4 object-contain"
            />
          ) : company?.companyName ? (
            <h1 className="text-2xl font-bold text-primary mb-2">
              {company.companyName}
            </h1>
          ) : null}
          {company && (
            <div className="text-sm text-muted-foreground">
              {company.companyAddress && <p>{company.companyAddress}</p>}
              {(company.companyPostalCode || company.companyCity) && (
                <p>
                  {company.companyPostalCode} {company.companyCity}
                </p>
              )}
              {company.companyPhone && <p>Tel: {company.companyPhone}</p>}
              {company.companyEmail && <p>E-mail: {company.companyEmail}</p>}
              {company.companyWebsite && <p>{company.companyWebsite}</p>}
            </div>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-primary mb-2">OFFERTE</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              <span className="font-medium">Datum:</span> {formatDate(today)}
            </p>
            {estimate.project.projectNumber && (
              <p>
                <span className="font-medium">Projectnr:</span>{" "}
                {estimate.project.projectNumber}
              </p>
            )}
            <p>
              <span className="font-medium">Versie:</span> {estimate.version}
            </p>
            {estimate.validUntil && (
              <p>
                <span className="font-medium">Geldig tot:</span>{" "}
                {formatDate(estimate.validUntil)}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Client & Project Info */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            OPDRACHTGEVER
          </h3>
          {estimate.project.client ? (
            <div className="text-sm">
              <p className="font-medium">{estimate.project.client.name}</p>
              {estimate.project.client.contactPerson && (
                <p>t.a.v. {estimate.project.client.contactPerson}</p>
              )}
              {estimate.project.client.address && (
                <p>{estimate.project.client.address}</p>
              )}
              {(estimate.project.client.postalCode ||
                estimate.project.client.city) && (
                <p>
                  {estimate.project.client.postalCode}{" "}
                  {estimate.project.client.city}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Geen opdrachtgever gekoppeld
            </p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            PROJECTLOCATIE
          </h3>
          <div className="text-sm">
            <p className="font-medium">{estimate.project.name}</p>
            {estimate.project.address && <p>{estimate.project.address}</p>}
            {(estimate.project.postalCode || estimate.project.city) && (
              <p>
                {estimate.project.postalCode} {estimate.project.city}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Estimate Title & Description */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">{estimate.name}</h2>
        {estimate.description && (
          <p className="text-sm text-muted-foreground">{estimate.description}</p>
        )}
      </div>

      {/* Chapter Summary */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          SAMENVATTING PER HOOFDSTUK
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">Code</TableHead>
              <TableHead>Omschrijving</TableHead>
              <TableHead className="text-right w-[120px]">Bedrag</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimate.chapters.map((chapter) => {
              const chapterTotal = chapter.lines.reduce(
                (sum, line) => sum + line.totalPrice,
                0
              );
              return (
                <TableRow key={chapter.id}>
                  <TableCell className="font-mono">{chapter.code}</TableCell>
                  <TableCell>{chapter.name}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(chapterTotal)}
                  </TableCell>
                </TableRow>
              );
            })}
            {estimate.lines.length > 0 && (
              <TableRow>
                <TableCell className="font-mono">-</TableCell>
                <TableCell>Overige posten</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(
                    estimate.lines.reduce((sum, line) => sum + line.totalPrice, 0)
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold">
                Subtotaal
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(totals.subtotal)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Totals Section */}
      <div className="mb-8">
        <div className="bg-muted/30 rounded-lg p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotaal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {estimate.generalCostsPercent > 0 && (
              <div className="flex justify-between text-sm">
                <span>Algemene kosten ({estimate.generalCostsPercent}%)</span>
                <span>{formatCurrency(totals.generalCosts)}</span>
              </div>
            )}
            {estimate.profitPercent > 0 && (
              <div className="flex justify-between text-sm">
                <span>Winst & risico ({estimate.profitPercent}%)</span>
                <span>{formatCurrency(totals.profit)}</span>
              </div>
            )}
            {estimate.riskPercent > 0 && (
              <div className="flex justify-between text-sm">
                <span>Onvoorzien ({estimate.riskPercent}%)</span>
                <span>{formatCurrency(totals.risk)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-medium">
              <span>Totaal exclusief BTW</span>
              <span>{formatCurrency(totals.totalExclVat)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>BTW ({estimate.vatPercent}%)</span>
              <span>{formatCurrency(totals.vat)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-xl font-bold">
              <span>Totaal inclusief BTW</span>
              <span>{formatCurrency(totals.totalInclVat)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown (page break for print) */}
      <div className="print:break-before-page">
        <h3 className="text-lg font-semibold mb-4">Gedetailleerde specificatie</h3>
        {estimate.chapters.map((chapter) => (
          <div key={chapter.id} className="mb-6">
            <h4 className="font-medium bg-muted px-3 py-2 rounded mb-2">
              {chapter.code} - {chapter.name}
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Omschrijving</TableHead>
                  <TableHead className="text-right w-[80px]">Aantal</TableHead>
                  <TableHead className="w-[60px]">Eenheid</TableHead>
                  <TableHead className="text-right w-[100px]">Prijs</TableHead>
                  <TableHead className="text-right w-[100px]">Totaal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapter.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div>
                        <p>{line.description}</p>
                        {line.code && (
                          <p className="text-xs text-muted-foreground">
                            {line.code}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell>{line.unit}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Subtotaal {chapter.name}</TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      chapter.lines.reduce((sum, line) => sum + line.totalPrice, 0)
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        ))}
      </div>

      {/* Notes */}
      {estimate.notes && (
        <div className="mt-8 print:break-before-page">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            OPMERKINGEN
          </h3>
          <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
        </div>
      )}

      {/* Footer with Company Details */}
      <div className="mt-12 pt-6 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <div>
            {company?.companyName && <span>{company.companyName}</span>}
            {company?.kvkNumber && <span> | KvK: {company.kvkNumber}</span>}
            {company?.btwNumber && <span> | BTW: {company.btwNumber}</span>}
          </div>
          <div>
            {company?.ibanNumber && <span>IBAN: {company.ibanNumber}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
}
