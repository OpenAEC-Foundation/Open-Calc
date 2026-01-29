"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";

interface MarketPriceUpdate {
  itemId: string;
  code: string;
  description: string;
  unit: string;
  library: {
    id: string;
    name: string;
    standard: string;
  };
  currentPrices: {
    laborRate: number;
    materialCost: number;
    equipmentCost: number;
    subcontrCost: number;
    unitPrice: number;
  };
  marketPrices: {
    laborRate: number;
    materialCost: number;
    equipmentCost: number;
    subcontrCost: number;
    unitPrice: number;
  };
  priceDifference: number;
  percentageChange: number;
  source: string;
  confidence: number;
  lastUpdate: string | null;
}

interface MarketPriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraryId?: string;
  libraryName?: string;
  itemId?: string;
}

const standardColors: Record<string, string> = {
  NL_SFB: "bg-blue-100 text-blue-800",
  STABU: "bg-green-100 text-green-800",
  RAW: "bg-orange-100 text-orange-800",
  CUSTOM: "bg-gray-100 text-gray-800",
};

const standardLabels: Record<string, string> = {
  NL_SFB: "NL-SfB",
  STABU: "STABU",
  RAW: "RAW",
  CUSTOM: "Eigen",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function MarketPriceUpdateDialog({
  open,
  onOpenChange,
  libraryId,
  libraryName,
  itemId,
}: MarketPriceUpdateDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updates, setUpdates] = useState<MarketPriceUpdate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchMarketPrices();
    } else {
      setUpdates([]);
      setSelectedIds(new Set());
      setError(null);
    }
  }, [open, libraryId, itemId]);

  async function fetchMarketPrices() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (libraryId) params.set("libraryId", libraryId);
      if (itemId) params.set("itemId", itemId);

      const response = await fetch(`/api/library/market-prices?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates || []);
        setTotalItems(data.totalItems || 0);
        // Auto-select all by default
        setSelectedIds(new Set(data.updates?.map((u: MarketPriceUpdate) => u.itemId) || []));
      } else {
        setError("Kon marktprijzen niet ophalen");
      }
    } catch (error) {
      console.error("Error fetching market prices:", error);
      setError("Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  }

  function toggleSelection(itemId: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedIds(newSelected);
  }

  function toggleAll() {
    if (selectedIds.size === updates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(updates.map((u) => u.itemId)));
    }
  }

  async function handleUpdate() {
    if (selectedIds.size === 0) return;

    setUpdating(true);
    try {
      const selectedUpdates = updates.filter((u) => selectedIds.has(u.itemId));

      const response = await fetch("/api/library/market-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: Array.from(selectedIds),
          updates: selectedUpdates,
        }),
      });

      if (response.ok) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError("Kon prijzen niet bijwerken");
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      setError("Er is een fout opgetreden");
    } finally {
      setUpdating(false);
    }
  }

  const title = itemId
    ? "Marktprijs actualiseren"
    : libraryName
    ? `Marktprijzen actualiseren - ${libraryName}`
    : "Marktprijzen actualiseren";

  const description = itemId
    ? "Bekijk de actuele marktprijs voor dit item"
    : `Vergelijk huidige prijzen met actuele marktprijzen en selecteer welke je wilt bijwerken`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Marktprijzen ophalen...
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchMarketPrices}>
                Opnieuw proberen
              </Button>
            </div>
          ) : updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Check className="h-12 w-12 mb-4 text-green-500" />
              <p className="font-medium text-foreground">Alle prijzen zijn actueel</p>
              <p className="text-sm">
                Er zijn geen significante prijsverschillen gevonden voor{" "}
                {totalItems} item(s).
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {updates.length} van {totalItems} items hebben prijsupdates beschikbaar
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.size === updates.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm">Alles selecteren</span>
                </div>
              </div>

              <div className="flex-1 border rounded-md overflow-x-auto overflow-y-auto min-h-[300px]">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr className="border-b">
                      <th className="w-12 p-3 text-left"></th>
                      <th className="w-24 p-3 text-left font-medium">Code</th>
                      <th className="p-3 text-left font-medium">Omschrijving</th>
                      <th className="w-28 p-3 text-right font-medium">Huidig</th>
                      <th className="w-28 p-3 text-right font-medium">Nieuw</th>
                      <th className="w-24 p-3 text-right font-medium">Verschil</th>
                      <th className="w-32 p-3 text-left font-medium">Bron</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updates.map((update) => {
                      const isSelected = selectedIds.has(update.itemId);
                      const isIncrease = update.priceDifference > 0;
                      const isDecrease = update.priceDifference < 0;

                      return (
                        <tr
                          key={update.itemId}
                          className={`border-b cursor-pointer ${
                            isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleSelection(update.itemId)}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(update.itemId)}
                            />
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {update.code}
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-sm">{update.description}</p>
                            <Badge
                              className={`${
                                standardColors[update.library.standard]
                              } text-xs mt-1`}
                            >
                              {standardLabels[update.library.standard]}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium tabular-nums">
                            {formatCurrency(update.currentPrices.unitPrice)}
                          </td>
                          <td className="p-3 text-right tabular-nums">
                            <span
                              className={`font-medium ${
                                isIncrease
                                  ? "text-orange-600"
                                  : isDecrease
                                  ? "text-green-600"
                                  : ""
                              }`}
                            >
                              {formatCurrency(update.marketPrices.unitPrice)}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                isIncrease
                                  ? "text-orange-600"
                                  : isDecrease
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {isIncrease ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : isDecrease ? (
                                <TrendingDown className="h-4 w-4" />
                              ) : (
                                <Minus className="h-4 w-4" />
                              )}
                              {update.percentageChange > 0 ? "+" : ""}
                              {update.percentageChange}%
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {update.source.split(" ")[0]}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedIds.size > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{selectedIds.size}</span> item(s)
                    geselecteerd
                  </div>
                  <div className="text-sm">
                    Totaal verschil:{" "}
                    <span
                      className={`font-medium ${
                        updates
                          .filter((u) => selectedIds.has(u.itemId))
                          .reduce((sum, u) => sum + u.priceDifference, 0) > 0
                          ? "text-orange-600"
                          : "text-green-600"
                      }`}
                    >
                      {formatCurrency(
                        updates
                          .filter((u) => selectedIds.has(u.itemId))
                          .reduce((sum, u) => sum + u.priceDifference, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updating || selectedIds.size === 0 || loading}
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bijwerken...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {selectedIds.size} prijs(zen) actualiseren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
