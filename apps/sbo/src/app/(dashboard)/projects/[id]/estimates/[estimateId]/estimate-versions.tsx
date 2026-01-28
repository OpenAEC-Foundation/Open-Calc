"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, Copy, Check, Loader2, GitBranch } from "lucide-react";

interface Version {
  id: string;
  version: number;
  status: string;
  createdAt: string;
}

interface EstimateVersionsProps {
  estimateId: string;
  projectId: string;
  currentVersion: number;
  versions: Version[];
}

const statusLabels: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  ACCEPTED: "Geaccepteerd",
  REJECTED: "Afgewezen",
  EXPIRED: "Verlopen",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  EXPIRED: "bg-orange-100 text-orange-800",
};

export function EstimateVersions({
  estimateId,
  projectId,
  currentVersion,
  versions,
}: EstimateVersionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleCreateVersion() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/versions`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const newEstimate = await response.json();
        // Navigate to the new version
        router.push(`/projects/${projectId}/estimates/${newEstimate.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <GitBranch className="h-4 w-4" />
            Versie {currentVersion}
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Versies</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {versions.map((v) => (
            <DropdownMenuItem
              key={v.id}
              asChild
              className="flex items-center justify-between"
            >
              <Link href={`/projects/${projectId}/estimates/${v.id}`}>
                <span className="flex items-center gap-2">
                  Versie {v.version}
                  {v.id === estimateId && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1 py-0 h-4 ${statusColors[v.status]}`}
                >
                  {statusLabels[v.status]}
                </Badge>
              </Link>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            <Copy className="mr-2 h-4 w-4" />
            Nieuwe versie maken
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nieuwe versie maken</AlertDialogTitle>
            <AlertDialogDescription>
              Er wordt een kopie gemaakt van de huidige begroting (versie{" "}
              {currentVersion}) met alle hoofdstukken en regels. De nieuwe versie
              krijgt de status &quot;Concept&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateVersion} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Versie maken
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
