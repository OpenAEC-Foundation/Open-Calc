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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, Loader2 } from "lucide-react";

interface OfferSpecificationProps {
  estimateId: string;
  projectId: string;
  initialData: {
    offerWorkDescription: string | null;
    offerMaterials: string | null;
    offerEquipment: string | null;
    offerExclusions: string | null;
    offerExtraWorkRate: number | null;
    offerExtraWorkTerms: string | null;
    offerPaymentTerms: string | null;
    offerValidityWeeks: number;
    offerPlanningNotes: string | null;
  };
}

export function OfferSpecification({
  estimateId,
  projectId,
  initialData,
}: OfferSpecificationProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [workDescription, setWorkDescription] = useState(initialData.offerWorkDescription || "");
  const [materials, setMaterials] = useState(initialData.offerMaterials || "");
  const [equipment, setEquipment] = useState(initialData.offerEquipment || "");
  const [exclusions, setExclusions] = useState(initialData.offerExclusions || "");
  const [extraWorkRate, setExtraWorkRate] = useState(
    initialData.offerExtraWorkRate?.toString() || "62"
  );
  const [extraWorkTerms, setExtraWorkTerms] = useState(
    initialData.offerExtraWorkTerms ||
    "Werkzaamheden die niet expliciet in deze offerte zijn opgenomen, maar die op verzoek van de opdrachtgever of door onvoorziene omstandigheden nodig zijn, worden als meerwerk beschouwd. Eventueel meerwerk wordt in overleg uitgevoerd. Nacalculatie op basis van uren en materialen."
  );
  const [paymentTerms, setPaymentTerms] = useState(
    initialData.offerPaymentTerms ||
    "14 dagen na facturatie\nFacturatie geschied na gezamenlijk goedkeuren door opdrachtgever en opdrachtnemer"
  );
  const [validityWeeks, setValidityWeeks] = useState(
    initialData.offerValidityWeeks.toString()
  );
  const [planningNotes, setPlanningNotes] = useState(
    initialData.offerPlanningNotes || "Start werkzaamheden in onderling overleg"
  );

  async function handleSave() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerWorkDescription: workDescription || null,
            offerMaterials: materials || null,
            offerEquipment: equipment || null,
            offerExclusions: exclusions || null,
            offerExtraWorkRate: parseFloat(extraWorkRate) || null,
            offerExtraWorkTerms: extraWorkTerms || null,
            offerPaymentTerms: paymentTerms || null,
            offerValidityWeeks: parseInt(validityWeeks) || 4,
            offerPlanningNotes: planningNotes || null,
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
          <FileText className="mr-2 h-4 w-4" />
          Offertespecificatie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Offertespecificatie
          </DialogTitle>
          <DialogDescription>
            Vul de teksten in die op de offertespecificatie komen te staan
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-2">
            {/* Werkzaamheden */}
            <div className="space-y-2">
              <Label htmlFor="workDescription" className="text-base font-medium">
                Uit te voeren werkzaamheden
              </Label>
              <p className="text-xs text-muted-foreground">
                Beschrijf de werkzaamheden die uitgevoerd worden (één per regel)
              </p>
              <Textarea
                id="workDescription"
                placeholder="Preventieve maatregelen ten behoeve van transport en arbeid&#10;Indien nodig veiligstellen van installaties E+W&#10;Demontage en afvoeren"
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                rows={4}
              />
            </div>

            <Separator />

            {/* Materialen */}
            <div className="space-y-2">
              <Label htmlFor="materials" className="text-base font-medium">
                Toe te passen materialen
              </Label>
              <p className="text-xs text-muted-foreground">
                Beschrijf de materialen die toegepast worden (één per regel)
              </p>
              <Textarea
                id="materials"
                placeholder="Diverse klein-materiaal&#10;..."
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            {/* Materieel */}
            <div className="space-y-2">
              <Label htmlFor="equipment" className="text-base font-medium">
                Toe te passen materieel
              </Label>
              <p className="text-xs text-muted-foreground">
                Beschrijf het materieel/gereedschap dat ingezet wordt
              </p>
              <Textarea
                id="equipment"
                placeholder="Niet van toepassing"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                rows={2}
              />
            </div>

            <Separator />

            {/* Exclusief */}
            <div className="space-y-2">
              <Label htmlFor="exclusions" className="text-base font-medium">
                De offerte is exclusief
              </Label>
              <p className="text-xs text-muted-foreground">
                Wat is NIET inbegrepen in de offerte? (één per regel)
              </p>
              <Textarea
                id="exclusions"
                placeholder="Nabehandelen van materialen&#10;Vergunningen en leges&#10;Alle niet nader genoemde zaken"
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            {/* Meerwerk */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Meerwerk en aanvullende kosten
              </Label>
              <div className="space-y-2">
                <Label htmlFor="extraWorkRate" className="text-sm">
                  Meerwerk uurtarief (excl. BTW)
                </Label>
                <div className="relative w-32">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    €
                  </span>
                  <Input
                    id="extraWorkRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={extraWorkRate}
                    onChange={(e) => setExtraWorkRate(e.target.value)}
                    className="pl-6"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="extraWorkTerms" className="text-sm">
                  Meerwerkvoorwaarden
                </Label>
                <Textarea
                  id="extraWorkTerms"
                  value={extraWorkTerms}
                  onChange={(e) => setExtraWorkTerms(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Betalingsvoorwaarden */}
            <div className="space-y-2">
              <Label htmlFor="paymentTerms" className="text-base font-medium">
                Betalingsvoorwaarden
              </Label>
              <Textarea
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            {/* Planning */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Planning
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validityWeeks" className="text-sm">
                    Geldigheid offerte (weken)
                  </Label>
                  <Input
                    id="validityWeeks"
                    type="number"
                    min="1"
                    max="52"
                    value={validityWeeks}
                    onChange={(e) => setValidityWeeks(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planningNotes" className="text-sm">
                  Planningsnotities
                </Label>
                <Textarea
                  id="planningNotes"
                  placeholder="Start werkzaamheden in onderling overleg"
                  value={planningNotes}
                  onChange={(e) => setPlanningNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

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
