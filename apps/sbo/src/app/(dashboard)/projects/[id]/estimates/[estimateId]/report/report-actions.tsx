"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Box, Printer, Settings, ChevronDown, FileCheck, ClipboardList, FileStack } from "lucide-react";
import Link from "next/link";

interface ReportActionsProps {
  projectId: string;
  estimateId: string;
}

export function ReportActions({ projectId, estimateId }: ReportActionsProps) {
  const baseUrl = `/api/projects/${projectId}/estimates/${estimateId}/export`;

  return (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href="/settings">
          <Settings className="mr-2 h-4 w-4" />
          Bedrijfsinstellingen
        </Link>
      </Button>
      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Printen
      </Button>

      {/* Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exporteren
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>PDF Export</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Begroting opties */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Begroting</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DropdownMenuItem asChild>
                <Link href={`${baseUrl}/pdf?type=complete`} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">Complete begroting</div>
                    <div className="text-xs text-muted-foreground">
                      Alle hoofdstukken met regeldetails
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${baseUrl}/pdf?type=summary`} className="cursor-pointer">
                  <FileCheck className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">Begroting samengevat</div>
                    <div className="text-xs text-muted-foreground">
                      Alleen hoofdstuktotalen
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Offerte opties */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FileStack className="mr-2 h-4 w-4" />
              <span>Offerte</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DropdownMenuItem asChild>
                <Link href={`${baseUrl}/pdf?type=offer`} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">Offerte</div>
                    <div className="text-xs text-muted-foreground">
                      Samenvatting + offertespecificatie
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${baseUrl}/pdf?type=offer-summary`} className="cursor-pointer">
                  <FileCheck className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">Offerte met samenvatting</div>
                    <div className="text-xs text-muted-foreground">
                      Offerte + begroting samengevat
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`${baseUrl}/pdf?type=offer-complete`} className="cursor-pointer">
                  <FileStack className="mr-2 h-4 w-4" />
                  <div>
                    <div className="font-medium">Offerte compleet</div>
                    <div className="text-xs text-muted-foreground">
                      Offerte + complete begroting + samenvatting
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Andere formaten</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/ods`} className="cursor-pointer">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <div>
                <div className="font-medium">ODS Spreadsheet</div>
                <div className="text-xs text-muted-foreground">
                  LibreOffice / Excel bestand
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/ifc`} className="cursor-pointer">
              <Box className="mr-2 h-4 w-4" />
              <div>
                <div className="font-medium">IFC Export</div>
                <div className="text-xs text-muted-foreground">
                  BIM-compatibel kostenmodel
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/cuf`} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              <div>
                <div className="font-medium">CUF-XML Export</div>
                <div className="text-xs text-muted-foreground">
                  Calculatie Uitwisseling Formaat
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
