"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Percent, Loader2 } from "lucide-react";

interface EstimateSettingsProps {
  estimateId: string;
  projectId: string;
  initialData: {
    generalCostsPercent: number;
    profitPercent: number;
    riskPercent: number;
    vatPercent: number;
    notes: string | null;
  };
}

export function EstimateSettings({
  estimateId,
  projectId,
  initialData,
}: EstimateSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [generalCostsPercent, setGeneralCostsPercent] = useState(
    initialData.generalCostsPercent.toString()
  );
  const [profitPercent, setProfitPercent] = useState(
    initialData.profitPercent.toString()
  );
  const [riskPercent, setRiskPercent] = useState(
    initialData.riskPercent.toString()
  );
  const [vatPercent, setVatPercent] = useState(
    initialData.vatPercent.toString()
  );
  const [notes, setNotes] = useState(initialData.notes || "");

  async function handleSave() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generalCostsPercent: parseFloat(generalCostsPercent) || 0,
            profitPercent: parseFloat(profitPercent) || 0,
            riskPercent: parseFloat(riskPercent) || 0,
            vatPercent: parseFloat(vatPercent) || 21,
            notes: notes || null,
          }),
        }
      );

      if (response.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Percent className="mr-2 h-4 w-4" />
          BTW en opslagen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            BTW en opslagen
          </DialogTitle>
          <DialogDescription>
            Pas de opslagen en BTW percentages aan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Markups section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Opslagen</h4>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="generalCosts" className="text-xs">
                  Algemene kosten
                </Label>
                <div className="relative">
                  <Input
                    id="generalCosts"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={generalCostsPercent}
                    onChange={(e) => setGeneralCostsPercent(e.target.value)}
                    className="pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profit" className="text-xs">
                  Winst
                </Label>
                <div className="relative">
                  <Input
                    id="profit"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={profitPercent}
                    onChange={(e) => setProfitPercent(e.target.value)}
                    className="pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="risk" className="text-xs">
                  Risico
                </Label>
                <div className="relative">
                  <Input
                    id="risk"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(e.target.value)}
                    className="pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VAT */}
          <div className="space-y-2">
            <Label htmlFor="vat">BTW percentage</Label>
            <div className="relative w-32">
              <Input
                id="vat"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={vatPercent}
                onChange={(e) => setVatPercent(e.target.value)}
                className="pr-6"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                %
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              placeholder="Interne notities..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuleren
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Opslaan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
