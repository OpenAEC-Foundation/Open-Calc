"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Loader2, Save, X, Trash2, Image as ImageIcon, RefreshCw, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LibraryItemImage {
  id: string;
  filename: string;
  originalName: string;
  url: string | null;
  alt: string | null;
  caption: string | null;
}

interface LibraryItemData {
  id: string;
  code: string;
  description: string;
  specification: string | null;
  offerText: string | null;
  unit: string;
  laborHours: number;
  laborRate: number;
  materialCost: number;
  equipmentCost: number;
  subcontrCost: number;
  unitPrice: number;
  notes: string | null;
  library: {
    id: string;
    name: string;
    standard: string;
    userId: string | null;
  };
  category: {
    id: string;
    code: string;
    name: string;
  } | null;
  images: LibraryItemImage[];
}

interface LibraryItemDialogProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function LibraryItemDialog({
  itemId,
  open,
  onOpenChange,
}: LibraryItemDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<LibraryItemData | null>(null);
  const [offerText, setOfferText] = useState("");
  const [specification, setSpecification] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  // Editable price fields
  const [unit, setUnit] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const [equipmentCost, setEquipmentCost] = useState("");
  const [subcontrCost, setSubcontrCost] = useState("");

  // Market price update state
  const [fetchingMarketPrice, setFetchingMarketPrice] = useState(false);
  const [marketPriceData, setMarketPriceData] = useState<{
    laborRate: number;
    materialCost: number;
    equipmentCost: number;
    subcontrCost: number;
    unitPrice: number;
    source: string;
    confidence: number;
    percentageChange: number;
  } | null>(null);

  useEffect(() => {
    if (open && itemId) {
      fetchItem(itemId);
    } else {
      setItem(null);
      setOfferText("");
      setSpecification("");
      setUnit("");
      setLaborHours("");
      setLaborRate("");
      setMaterialCost("");
      setEquipmentCost("");
      setSubcontrCost("");
      setMarketPriceData(null);
    }
  }, [open, itemId]);

  async function fetchItem(id: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/library/${id}`);
      if (response.ok) {
        const data = await response.json();
        setItem(data);
        setOfferText(data.offerText || "");
        setSpecification(data.specification || "");
        setUnit(data.unit || "");
        setLaborHours(data.laborHours?.toString() || "0");
        setLaborRate(data.laborRate?.toString() || "45");
        setMaterialCost(data.materialCost?.toString() || "0");
        setEquipmentCost(data.equipmentCost?.toString() || "0");
        setSubcontrCost(data.subcontrCost?.toString() || "0");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate unit price from components
  function calculateUnitPrice(): number {
    const hours = parseFloat(laborHours) || 0;
    const rate = parseFloat(laborRate) || 0;
    const material = parseFloat(materialCost) || 0;
    const equipment = parseFloat(equipmentCost) || 0;
    const subcontr = parseFloat(subcontrCost) || 0;
    return (hours * rate) + material + equipment + subcontr;
  }

  async function fetchMarketPrice() {
    if (!item) return;

    setFetchingMarketPrice(true);
    setMarketPriceData(null);
    try {
      const response = await fetch(`/api/library/market-prices?itemId=${item.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.updates && data.updates.length > 0) {
          const update = data.updates[0];
          setMarketPriceData({
            laborRate: update.marketPrices.laborRate,
            materialCost: update.marketPrices.materialCost,
            equipmentCost: update.marketPrices.equipmentCost,
            subcontrCost: update.marketPrices.subcontrCost,
            unitPrice: update.marketPrices.unitPrice,
            source: update.source,
            confidence: update.confidence,
            percentageChange: update.percentageChange,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching market price:", error);
    } finally {
      setFetchingMarketPrice(false);
    }
  }

  function applyMarketPrices() {
    if (!marketPriceData) return;

    setLaborRate(marketPriceData.laborRate.toString());
    setMaterialCost(marketPriceData.materialCost.toString());
    setEquipmentCost(marketPriceData.equipmentCost.toString());
    setSubcontrCost(marketPriceData.subcontrCost.toString());
    setMarketPriceData(null);
  }

  async function handleSave() {
    if (!item) return;

    setSaving(true);
    try {
      const calculatedUnitPrice = calculateUnitPrice();

      const response = await fetch(`/api/library/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specification,
          offerText,
          unit,
          laborHours: parseFloat(laborHours) || 0,
          laborRate: parseFloat(laborRate) || 0,
          materialCost: parseFloat(materialCost) || 0,
          equipmentCost: parseFloat(equipmentCost) || 0,
          subcontrCost: parseFloat(subcontrCost) || 0,
          unitPrice: calculatedUnitPrice,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setItem(updated);
        router.refresh();
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving item:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File): Promise<string> {
    if (!item) throw new Error("No item selected");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/library/${item.id}/images`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const image = await response.json();

    // Update item with new image
    setItem((prev) =>
      prev
        ? {
            ...prev,
            images: [image, ...prev.images],
          }
        : null
    );

    return image.url;
  }

  async function handleDeleteImage(imageId: string) {
    if (!item) return;

    try {
      const response = await fetch(`/api/library/${item.id}/images/${imageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItem((prev) =>
          prev
            ? {
                ...prev,
                images: prev.images.filter((img) => img.id !== imageId),
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : item ? (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">
                    <span className="font-mono mr-2">{item.code}</span>
                    {item.description}
                  </DialogTitle>
                  <DialogDescription className="mt-2 flex items-center gap-2">
                    <Badge className={standardColors[item.library.standard]}>
                      {standardLabels[item.library.standard]}
                    </Badge>
                    <span>{item.library.name}</span>
                    {item.category && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span>
                          {item.category.code} - {item.category.name}
                        </span>
                      </>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="specification">Specificatie</TabsTrigger>
                <TabsTrigger value="offertext">Offertetekst</TabsTrigger>
                <TabsTrigger value="images">
                  Afbeeldingen ({item.images.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="flex-1 overflow-auto">
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Eenheid</Label>
                    <Input
                      id="unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="m2, st, uur, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Eenheidsprijs</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted font-medium">
                      {formatCurrency(calculateUnitPrice())}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Berekend uit onderstaande kosten
                    </p>
                  </div>

                  {/* Market Price Update Section */}
                  <div className="col-span-2 border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-sm font-medium">Marktprijs actualiseren</Label>
                        <p className="text-xs text-muted-foreground">
                          Vergelijk met actuele marktprijzen
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchMarketPrice}
                        disabled={fetchingMarketPrice}
                      >
                        {fetchingMarketPrice ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ophalen...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Marktprijs ophalen
                          </>
                        )}
                      </Button>
                    </div>

                    {marketPriceData && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Uurtarief:</span>
                            <span className={marketPriceData.laborRate > parseFloat(laborRate) ? "text-orange-600" : "text-green-600"}>
                              {formatCurrency(marketPriceData.laborRate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Materiaal:</span>
                            <span className={marketPriceData.materialCost > parseFloat(materialCost) ? "text-orange-600" : "text-green-600"}>
                              {formatCurrency(marketPriceData.materialCost)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Materieel:</span>
                            <span className={marketPriceData.equipmentCost > parseFloat(equipmentCost) ? "text-orange-600" : "text-green-600"}>
                              {formatCurrency(marketPriceData.equipmentCost)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Onderaann.:</span>
                            <span className={marketPriceData.subcontrCost > parseFloat(subcontrCost) ? "text-orange-600" : "text-green-600"}>
                              {formatCurrency(marketPriceData.subcontrCost)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Nieuwe eenheidsprijs: {formatCurrency(marketPriceData.unitPrice)}
                            </span>
                            <span className={`flex items-center gap-1 text-sm ${
                              marketPriceData.percentageChange > 0 ? "text-orange-600" : "text-green-600"
                            }`}>
                              {marketPriceData.percentageChange > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {marketPriceData.percentageChange > 0 ? "+" : ""}
                              {marketPriceData.percentageChange}%
                            </span>
                          </div>
                          <Button size="sm" onClick={applyMarketPrices}>
                            Toepassen
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          <span>Bron: {marketPriceData.source}</span>
                          <span>•</span>
                          <span>Betrouwbaarheid: {marketPriceData.confidence}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="laborHours">Arbeid (uren)</Label>
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
                    <Label htmlFor="laborRate">Uurtarief</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
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
                  <div className="space-y-2">
                    <Label htmlFor="materialCost">Materiaalkosten</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
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
                    <Label htmlFor="equipmentCost">Materieelkosten</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
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
                    <Label htmlFor="subcontrCost">Onderaanneming</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
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
              </TabsContent>

              <TabsContent value="specification" className="flex-1 overflow-auto">
                <div className="space-y-2 py-4">
                  <Label>Specificatietekst (platte tekst)</Label>
                  <Textarea
                    value={specification}
                    onChange={(e) => setSpecification(e.target.value)}
                    placeholder="Voer hier de technische specificatie in..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    De specificatietekst bevat technische details en wordt als platte
                    tekst opgeslagen.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="offertext" className="flex-1 overflow-auto">
                <div className="space-y-2 py-4">
                  <Label>Offertetekst (opmaak mogelijk)</Label>
                  <RichTextEditor
                    content={offerText}
                    onChange={setOfferText}
                    onImageUpload={handleImageUpload}
                    placeholder="Voer hier de offertetekst in..."
                    className="min-h-[300px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    De offertetekst wordt op offertes en facturen getoond. Gebruik de
                    werkbalk voor opmaak en afbeeldingen.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="images" className="flex-1 overflow-auto">
                <div className="py-4">
                  <div className="mb-4">
                    <Label>Afbeeldingen uploaden</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Sleep afbeeldingen hierheen of klik om te selecteren. Max 5MB
                      per bestand.
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            await handleImageUpload(file);
                          } catch (error) {
                            console.error("Upload failed:", error);
                          }
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {item.images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                      <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
                      <p>Nog geen afbeeldingen</p>
                      <p className="text-sm">
                        Upload afbeeldingen via bovenstaand veld of via de
                        offertetekst editor
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {item.images.map((image) => (
                        <div
                          key={image.id}
                          className="relative group border rounded-lg overflow-hidden"
                        >
                          <img
                            src={image.url || ""}
                            alt={image.alt || image.originalName}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteImage(image.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Verwijderen
                            </Button>
                          </div>
                          <div className="p-2 text-xs truncate">
                            {image.originalName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-shrink-0">
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
                    <Save className="mr-2 h-4 w-4" />
                    Opslaan
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>Item niet gevonden</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
