"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

interface CostLibrary {
  id: string;
  name: string;
  standard: string;
  categories: {
    id: string;
    code: string;
    name: string;
  }[];
}

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraries: CostLibrary[];
  selectedLibraryId?: string;
}

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

export function AddItemDialog({
  open,
  onOpenChange,
  libraries,
  selectedLibraryId,
}: AddItemDialogProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [libraryId, setLibraryId] = useState(selectedLibraryId || "");
  const [categoryId, setCategoryId] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("st");
  const [laborHours, setLaborHours] = useState("0");
  const [laborRate, setLaborRate] = useState("45");
  const [materialCost, setMaterialCost] = useState("0");
  const [equipmentCost, setEquipmentCost] = useState("0");
  const [subcontrCost, setSubcontrCost] = useState("0");
  const [specification, setSpecification] = useState("");

  const selectedLibrary = libraries.find((l) => l.id === libraryId);

  function calculateUnitPrice(): number {
    const hours = parseFloat(laborHours) || 0;
    const rate = parseFloat(laborRate) || 0;
    const material = parseFloat(materialCost) || 0;
    const equipment = parseFloat(equipmentCost) || 0;
    const subcontr = parseFloat(subcontrCost) || 0;
    return (hours * rate) + material + equipment + subcontr;
  }

  function resetForm() {
    setCode("");
    setDescription("");
    setUnit("st");
    setLaborHours("0");
    setLaborRate("45");
    setMaterialCost("0");
    setEquipmentCost("0");
    setSubcontrCost("0");
    setSpecification("");
    setCategoryId("");
    setError(null);
  }

  async function handleSave() {
    if (!libraryId || !code || !description) {
      setError("Bibliotheek, code en omschrijving zijn verplicht");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libraryId,
          categoryId: categoryId || null,
          code,
          description,
          unit,
          laborHours: parseFloat(laborHours) || 0,
          laborRate: parseFloat(laborRate) || 45,
          materialCost: parseFloat(materialCost) || 0,
          equipmentCost: parseFloat(equipmentCost) || 0,
          subcontrCost: parseFloat(subcontrCost) || 0,
          specification,
        }),
      });

      if (response.ok) {
        resetForm();
        onOpenChange(false);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Er is een fout opgetreden");
      }
    } catch (err) {
      console.error("Error saving item:", err);
      setError("Er is een fout opgetreden");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nieuwe kostenpost toevoegen
          </DialogTitle>
          <DialogDescription>
            Voeg een nieuwe regel toe aan de kostenbibliotheek
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Library Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="library">Bibliotheek *</Label>
              <Select value={libraryId} onValueChange={setLibraryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer bibliotheek" />
                </SelectTrigger>
                <SelectContent>
                  {libraries.map((lib) => (
                    <SelectItem key={lib.id} value={lib.id}>
                      {standardLabels[lib.standard]} - {lib.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categorie</Label>
              <Select
                value={categoryId || "none"}
                onValueChange={(value) => setCategoryId(value === "none" ? "" : value)}
                disabled={!selectedLibrary || selectedLibrary.categories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer categorie (optioneel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen categorie</SelectItem>
                  {selectedLibrary?.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.code} - {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Code and Description */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="bijv. 99.01.01"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Omschrijving *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Omschrijving van de kostenpost"
              />
            </div>
          </div>

          {/* Unit and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Eenheid</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="st, m2, uur, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Eenheidsprijs</Label>
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted font-medium">
                {formatCurrency(calculateUnitPrice())}
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="border rounded-lg p-4 space-y-4">
            <Label className="text-sm font-medium">Kostenopbouw</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="laborHours" className="text-xs text-muted-foreground">Arbeid (uren)</Label>
                <Input
                  id="laborHours"
                  type="number"
                  step="0.01"
                  min="0"
                  value={laborHours}
                  onChange={(e) => setLaborHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laborRate" className="text-xs text-muted-foreground">Uurtarief</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  <Input
                    id="laborRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={laborRate}
                    onChange={(e) => setLaborRate(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="materialCost" className="text-xs text-muted-foreground">Materiaalkosten</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  <Input
                    id="materialCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={materialCost}
                    onChange={(e) => setMaterialCost(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipmentCost" className="text-xs text-muted-foreground">Materieelkosten</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  <Input
                    id="equipmentCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={equipmentCost}
                    onChange={(e) => setEquipmentCost(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcontrCost" className="text-xs text-muted-foreground">Onderaanneming</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                  <Input
                    id="subcontrCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={subcontrCost}
                    onChange={(e) => setSubcontrCost(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Specification */}
          <div className="space-y-2">
            <Label htmlFor="specification">Specificatie (optioneel)</Label>
            <Textarea
              id="specification"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="Technische specificatie..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Opslaan...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Toevoegen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
