"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Library, Plus, Check } from "lucide-react";

interface LibraryItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  laborHours: number;
  laborRate: number;
  materialCost: number;
  equipmentCost: number;
  subcontrCost: number;
  unitPrice: number;
  library: { name: string; standard: string };
  category: { code: string; name: string } | null;
}

interface Chapter {
  id: string;
  code: string;
  name: string;
}

interface LibrarySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  estimateId: string;
  chapters: Chapter[];
  onItemsAdded: () => void;
}

const standardLabels: Record<string, string> = {
  NL_SFB: "NL-SfB",
  STABU: "STABU",
  RAW: "RAW",
  CUSTOM: "Eigen",
};

const standardColors: Record<string, string> = {
  NL_SFB: "bg-blue-100 text-blue-800",
  STABU: "bg-green-100 text-green-800",
  RAW: "bg-orange-100 text-orange-800",
  CUSTOM: "bg-gray-100 text-gray-800",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function LibrarySelector({
  open,
  onOpenChange,
  projectId,
  estimateId,
  chapters,
  onItemsAdded,
}: LibrarySelectorProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<string, { item: LibraryItem; quantity: number }>>(new Map());
  const [targetChapterId, setTargetChapterId] = useState<string>("none");

  useEffect(() => {
    if (open) {
      fetchItems("");
    }
  }, [open]);

  async function fetchItems(query: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      params.set("limit", "50");

      const response = await fetch(`/api/library?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error fetching library items:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchItems(search);
  }

  function toggleItem(item: LibraryItem) {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.set(item.id, { item, quantity: 1 });
    }
    setSelectedItems(newSelected);
  }

  function updateQuantity(itemId: string, quantity: number) {
    const newSelected = new Map(selectedItems);
    const entry = newSelected.get(itemId);
    if (entry) {
      entry.quantity = quantity;
      newSelected.set(itemId, entry);
      setSelectedItems(newSelected);
    }
  }

  async function handleAddItems() {
    if (selectedItems.size === 0) return;

    setAdding(true);
    try {
      const linesToAdd = Array.from(selectedItems.values()).map(({ item, quantity }) => ({
        chapterId: targetChapterId === "none" ? null : targetChapterId,
        code: item.code,
        description: item.description,
        quantity,
        unit: item.unit,
        laborHours: item.laborHours,
        laborRate: item.laborRate,
        laborCost: item.laborHours * item.laborRate,
        materialCost: item.materialCost,
        equipmentCost: item.equipmentCost,
        subcontrCost: item.subcontrCost,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * quantity,
        libraryItemId: item.id,
      }));

      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/lines/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines: linesToAdd }),
        }
      );

      if (response.ok) {
        setSelectedItems(new Map());
        setSearch("");
        onOpenChange(false);
        onItemsAdded();
        router.refresh();
      }
    } catch (error) {
      console.error("Error adding items:", error);
    } finally {
      setAdding(false);
    }
  }

  function handleClose() {
    setSelectedItems(new Map());
    setSearch("");
    onOpenChange(false);
  }

  const totalSelected = selectedItems.size;
  const totalValue = Array.from(selectedItems.values()).reduce(
    (sum, { item, quantity }) => sum + item.unitPrice * quantity,
    0
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-5 w-5" />
            Uit bibliotheek toevoegen
          </DialogTitle>
          <DialogDescription>
            Zoek en selecteer items uit de kostenbibliotheek om toe te voegen aan je begroting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op code of omschrijving..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Zoeken"}
            </Button>
          </form>

          {/* Target chapter selection */}
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Toevoegen aan:</Label>
            <Select value={targetChapterId} onValueChange={setTargetChapterId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecteer hoofdstuk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen hoofdstuk (losse regels)</SelectItem>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.code} - {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <ScrollArea className="flex-1 border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Library className="h-12 w-12 mb-4 opacity-50" />
                <p>Geen items gevonden</p>
                <p className="text-sm">Probeer een andere zoekopdracht</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead className="w-[60px]">Eenheid</TableHead>
                    <TableHead className="w-[100px] text-right">Prijs</TableHead>
                    <TableHead className="w-[80px]">Bron</TableHead>
                    <TableHead className="w-[80px]">Aantal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const selectedEntry = selectedItems.get(item.id);

                    return (
                      <TableRow
                        key={item.id}
                        className={isSelected ? "bg-primary/5" : "cursor-pointer hover:bg-muted/50"}
                        onClick={() => toggleItem(item)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(item)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {item.category && (
                              <p className="text-xs text-muted-foreground">
                                {item.category.name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell>
                          <Badge className={standardColors[item.library.standard]}>
                            {standardLabels[item.library.standard]}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isSelected && (
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={selectedEntry?.quantity || 1}
                              onChange={(e) =>
                                updateQuantity(item.id, parseFloat(e.target.value) || 1)
                              }
                              className="w-20 h-8"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </ScrollArea>

          {/* Selection summary */}
          {totalSelected > 0 && (
            <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-medium">{totalSelected} item(s) geselecteerd</span>
              </div>
              <div className="font-medium">
                Totaal: {formatCurrency(totalValue)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuleren
          </Button>
          <Button onClick={handleAddItems} disabled={adding || totalSelected === 0}>
            {adding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Toevoegen...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {totalSelected} item(s) toevoegen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
