"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Box, Printer, Settings, ChevronDown } from "lucide-react";
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
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Exportformaat</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`${baseUrl}/pdf`} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              <div>
                <div className="font-medium">PDF Offerte</div>
                <div className="text-xs text-muted-foreground">
                  Professionele offerte met bedrijfslogo
                </div>
              </div>
            </Link>
          </DropdownMenuItem>
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
