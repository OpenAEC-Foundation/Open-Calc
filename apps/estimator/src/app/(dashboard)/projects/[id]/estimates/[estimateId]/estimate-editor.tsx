"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  GripVertical,
  Library,
  FileText,
  Loader2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { LibrarySelector } from "./library-selector";

interface EstimateLine {
  id: string;
  sortOrder: number;
  code: string | null;
  description: string;
  quantity: number;
  unit: string;
  laborHours: number;
  laborRate: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  subcontrCost: number;
  unitPrice: number;
  totalPrice: number;
}

interface EstimateChapter {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  lines: EstimateLine[];
}

interface EstimateEditorProps {
  estimateId: string;
  projectId: string;
  chapters: EstimateChapter[];
  unassignedLines: EstimateLine[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function EstimateEditor({
  estimateId,
  projectId,
  chapters,
  unassignedLines,
}: EstimateEditorProps) {
  const router = useRouter();
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set(chapters.map((c) => c.id))
  );
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [isAddingLine, setIsAddingLine] = useState(false);
  const [isLibrarySelectorOpen, setIsLibrarySelectorOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Chapter form state
  const [chapterCode, setChapterCode] = useState("");
  const [chapterName, setChapterName] = useState("");

  // Line form state
  const [lineDescription, setLineDescription] = useState("");
  const [lineQuantity, setLineQuantity] = useState("1");
  const [lineUnit, setLineUnit] = useState("st");
  const [lineLaborHours, setLineLaborHours] = useState("0");
  const [lineLaborRate, setLineLaborRate] = useState("45");
  const [lineMaterialCost, setLineMaterialCost] = useState("0");

  function toggleChapter(chapterId: string) {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  }

  async function handleAddChapter() {
    if (!chapterCode || !chapterName) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/chapters`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: chapterCode,
            name: chapterName,
          }),
        }
      );

      if (response.ok) {
        setChapterCode("");
        setChapterName("");
        setIsAddingChapter(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLine() {
    if (!lineDescription) return;

    const laborHours = parseFloat(lineLaborHours) || 0;
    const laborRate = parseFloat(lineLaborRate) || 45;
    const materialCost = parseFloat(lineMaterialCost) || 0;
    const quantity = parseFloat(lineQuantity) || 1;
    const laborCost = laborHours * laborRate;
    const unitPrice = laborCost + materialCost;
    const totalPrice = unitPrice * quantity;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/lines`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chapterId: selectedChapterId,
            description: lineDescription,
            quantity,
            unit: lineUnit,
            laborHours,
            laborRate,
            laborCost,
            materialCost,
            unitPrice,
            totalPrice,
          }),
        }
      );

      if (response.ok) {
        setLineDescription("");
        setLineQuantity("1");
        setLineUnit("st");
        setLineLaborHours("0");
        setLineLaborRate("45");
        setLineMaterialCost("0");
        setIsAddingLine(false);
        setSelectedChapterId(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLine(lineId: string) {
    if (!confirm("Weet je zeker dat je deze regel wilt verwijderen?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/lines/${lineId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting line:", error);
    }
  }

  async function handleDeleteChapter(chapterId: string) {
    if (!confirm("Weet je zeker dat je dit hoofdstuk en alle regels wilt verwijderen?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/chapters/${chapterId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting chapter:", error);
    }
  }

  function openAddLineDialog(chapterId: string | null) {
    setSelectedChapterId(chapterId);
    setIsAddingLine(true);
  }

  async function handleExport(format: "ifc" | "ods") {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/export/${format}`
      );

      if (!response.ok) {
        throw new Error("Export mislukt");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `begroting.${format}`;

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error exporting ${format}:`, error);
      alert("Er is een fout opgetreden bij het exporteren");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2">
        <Dialog open={isAddingChapter} onOpenChange={setIsAddingChapter}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Hoofdstuk toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuw hoofdstuk</DialogTitle>
              <DialogDescription>
                Voeg een nieuw hoofdstuk toe aan de begroting
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="chapterCode">Code</Label>
                <Input
                  id="chapterCode"
                  placeholder="21"
                  value={chapterCode}
                  onChange={(e) => setChapterCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chapterName">Naam</Label>
                <Input
                  id="chapterName"
                  placeholder="Buitenwanden"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingChapter(false)}>
                Annuleren
              </Button>
              <Button onClick={handleAddChapter} disabled={loading || !chapterCode || !chapterName}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Toevoegen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => setIsLibrarySelectorOpen(true)}>
          <Library className="mr-2 h-4 w-4" />
          Uit bibliotheek
        </Button>

        <Button variant="outline" onClick={() => handleExport("ods")} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="mr-2 h-4 w-4" />
          )}
          Export ODS
        </Button>

        <Button variant="outline" onClick={() => handleExport("ifc")} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export IFC
        </Button>
      </div>

      {/* Library Selector Dialog */}
      <LibrarySelector
        open={isLibrarySelectorOpen}
        onOpenChange={setIsLibrarySelectorOpen}
        projectId={projectId}
        estimateId={estimateId}
        chapters={chapters}
        onItemsAdded={() => router.refresh()}
      />

      {/* Chapters */}
      {chapters.length === 0 && unassignedLines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Lege begroting</h3>
            <p className="text-muted-foreground text-center mb-4">
              Begin met het toevoegen van hoofdstukken en regels aan je begroting.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddingChapter(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Hoofdstuk toevoegen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <Card key={chapter.id}>
              <Collapsible
                open={expandedChapters.has(chapter.id)}
                onOpenChange={() => toggleChapter(chapter.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedChapters.has(chapter.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <CardTitle className="text-base">
                          <span className="text-muted-foreground mr-2">{chapter.code}</span>
                          {chapter.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {chapter.lines.length} regels
                        </span>
                        <span className="font-medium">
                          {formatCurrency(
                            chapter.lines.reduce((sum, line) => sum + line.totalPrice, 0)
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapter.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {chapter.lines.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40px]"></TableHead>
                              <TableHead>Omschrijving</TableHead>
                              <TableHead className="w-[80px] text-right">Aantal</TableHead>
                              <TableHead className="w-[60px]">Eenheid</TableHead>
                              <TableHead className="w-[100px] text-right">Eenheidsprijs</TableHead>
                              <TableHead className="w-[100px] text-right">Totaal</TableHead>
                              <TableHead className="w-[40px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {chapter.lines.map((line) => (
                              <TableRow key={line.id}>
                                <TableCell>
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p>{line.description}</p>
                                    {line.code && (
                                      <p className="text-xs text-muted-foreground">{line.code}</p>
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
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteLine(line.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Nog geen regels in dit hoofdstuk
                      </p>
                    )}
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddLineDialog(chapter.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Regel toevoegen
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}

          {/* Unassigned lines */}
          {unassignedLines.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base text-muted-foreground">
                  Losse regels (zonder hoofdstuk)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]"></TableHead>
                        <TableHead>Omschrijving</TableHead>
                        <TableHead className="w-[80px] text-right">Aantal</TableHead>
                        <TableHead className="w-[60px]">Eenheid</TableHead>
                        <TableHead className="w-[100px] text-right">Eenheidsprijs</TableHead>
                        <TableHead className="w-[100px] text-right">Totaal</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unassignedLines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          </TableCell>
                          <TableCell>{line.description}</TableCell>
                          <TableCell className="text-right">{line.quantity}</TableCell>
                          <TableCell>{line.unit}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(line.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(line.totalPrice)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLine(line.id)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add Line Dialog */}
      <Dialog open={isAddingLine} onOpenChange={setIsAddingLine}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nieuwe regel</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe regel toe aan de begroting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lineDescription">Omschrijving *</Label>
              <Input
                id="lineDescription"
                placeholder="Metselwerk buitenmuur"
                value={lineDescription}
                onChange={(e) => setLineDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lineQuantity">Aantal</Label>
                <Input
                  id="lineQuantity"
                  type="number"
                  step="0.01"
                  value={lineQuantity}
                  onChange={(e) => setLineQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineUnit">Eenheid</Label>
                <Select value={lineUnit} onValueChange={setLineUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="st">stuks</SelectItem>
                    <SelectItem value="m">meter</SelectItem>
                    <SelectItem value="m2">m²</SelectItem>
                    <SelectItem value="m3">m³</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="uur">uur</SelectItem>
                    <SelectItem value="ps">post</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lineLaborHours">Uren per eenheid</Label>
                <Input
                  id="lineLaborHours"
                  type="number"
                  step="0.01"
                  value={lineLaborHours}
                  onChange={(e) => setLineLaborHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineLaborRate">Uurtarief (€)</Label>
                <Input
                  id="lineLaborRate"
                  type="number"
                  step="0.01"
                  value={lineLaborRate}
                  onChange={(e) => setLineLaborRate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lineMaterialCost">Materiaalkosten per eenheid (€)</Label>
              <Input
                id="lineMaterialCost"
                type="number"
                step="0.01"
                value={lineMaterialCost}
                onChange={(e) => setLineMaterialCost(e.target.value)}
              />
            </div>

            {/* Preview */}
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Arbeidskosten:</span>
                <span>
                  {formatCurrency(
                    (parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Materiaalkosten:</span>
                <span>{formatCurrency(parseFloat(lineMaterialCost) || 0)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1 mt-1">
                <span>Eenheidsprijs:</span>
                <span>
                  {formatCurrency(
                    (parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0) +
                      (parseFloat(lineMaterialCost) || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Totaal ({lineQuantity} {lineUnit}):</span>
                <span>
                  {formatCurrency(
                    ((parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0) +
                      (parseFloat(lineMaterialCost) || 0)) *
                      (parseFloat(lineQuantity) || 1)
                  )}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingLine(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddLine} disabled={loading || !lineDescription}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
