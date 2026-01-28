"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  TableFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
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
  BookOpen,
  Search,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { LibrarySelector } from "./library-selector";
import {
  CODING_SYSTEMS,
  type CodingStandard,
  type ChapterTemplate,
  flattenChapters,
} from "@/lib/chapter-templates";

interface EstimateLine {
  id: string;
  sortOrder: number;
  code: string | null;
  description: string;
  quantity: number;
  unit: string;
  lineType: string; // NORMAL, PROVISIONAL, ADJUSTABLE
  laborHours: number;
  laborRate: number;
  laborCost: number;
  materialCost: number;
  equipmentCost: number;
  subcontrCost: number;
  unitPrice: number;
  totalPrice: number;
  libraryItemId: string | null;
}

const LINE_TYPE_LABELS: Record<string, string> = {
  NORMAL: "Regulier",
  PROVISIONAL: "Stelpost",
  ADJUSTABLE: "Verrekenbaar",
};

const LINE_TYPE_COLORS: Record<string, string> = {
  NORMAL: "",
  PROVISIONAL: "bg-amber-100 text-amber-800 border-amber-300",
  ADJUSTABLE: "bg-purple-100 text-purple-800 border-purple-300",
};

const UNIT_OPTIONS = [
  { value: "st", label: "stuks" },
  { value: "m", label: "meter" },
  { value: "m2", label: "m\u00b2" },
  { value: "m3", label: "m\u00b3" },
  { value: "kg", label: "kg" },
  { value: "ton", label: "ton" },
  { value: "uur", label: "uur" },
  { value: "dag", label: "dag" },
  { value: "week", label: "week" },
  { value: "ps", label: "post" },
  { value: "ls", label: "lump sum" },
  { value: "km", label: "km" },
  { value: "l", label: "liter" },
  { value: "kWh", label: "kWh" },
];

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
  const [isEditingLine, setIsEditingLine] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [isLibrarySelectorOpen, setIsLibrarySelectorOpen] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [updatingPriceLineId, setUpdatingPriceLineId] = useState<string | null>(null);
  const [updatingAllPrices, setUpdatingAllPrices] = useState(false);

  // Chapter form state
  const [chapterCode, setChapterCode] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [chapterTab, setChapterTab] = useState<"template" | "custom">("template");
  const [selectedCodingSystem, setSelectedCodingSystem] = useState<CodingStandard>("NL_SFB");
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");

  // Line form state
  const [lineDescription, setLineDescription] = useState("");
  const [lineQuantity, setLineQuantity] = useState("1");
  const [lineUnit, setLineUnit] = useState("st");
  const [lineType, setLineType] = useState("NORMAL");
  const [lineLaborHours, setLineLaborHours] = useState("0");
  const [lineLaborRate, setLineLaborRate] = useState("45");
  const [lineMaterialCost, setLineMaterialCost] = useState("0");
  const [lineEquipmentCost, setLineEquipmentCost] = useState("0");
  const [lineSubcontrCost, setLineSubcontrCost] = useState("0");

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
    setLoading(true);
    try {
      if (chapterTab === "template" && selectedTemplates.size > 0) {
        // Add multiple chapters from templates
        const system = CODING_SYSTEMS.find(s => s.id === selectedCodingSystem);
        if (!system) return;

        const allChapters = flattenChapters(system.chapters);
        const chaptersToAdd = allChapters.filter(c => selectedTemplates.has(c.code));

        for (const template of chaptersToAdd) {
          await fetch(
            `/api/projects/${projectId}/estimates/${estimateId}/chapters`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: template.code,
                name: template.name,
              }),
            }
          );
        }

        setSelectedTemplates(new Set());
        setIsAddingChapter(false);
        router.refresh();
      } else if (chapterTab === "custom" && chapterCode && chapterName) {
        // Add single custom chapter
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
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleTemplateSelection(code: string) {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedTemplates(newSelected);
  }

  function selectAllMainChapters() {
    const system = CODING_SYSTEMS.find(s => s.id === selectedCodingSystem);
    if (!system) return;
    const mainCodes = new Set(system.chapters.map(c => c.code));
    setSelectedTemplates(mainCodes);
  }

  function getFilteredTemplates(): ChapterTemplate[] {
    const system = CODING_SYSTEMS.find(s => s.id === selectedCodingSystem);
    if (!system) return [];

    const allChapters = flattenChapters(system.chapters);
    if (!templateSearchQuery) return allChapters;

    const query = templateSearchQuery.toLowerCase();
    return allChapters.filter(
      c => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
    );
  }

  async function handleAddLine() {
    if (!lineDescription) return;

    const laborHours = parseFloat(lineLaborHours) || 0;
    const laborRate = parseFloat(lineLaborRate) || 45;
    const materialCost = parseFloat(lineMaterialCost) || 0;
    const equipmentCost = parseFloat(lineEquipmentCost) || 0;
    const subcontrCost = parseFloat(lineSubcontrCost) || 0;
    const quantity = parseFloat(lineQuantity) || 1;
    const laborCost = laborHours * laborRate;
    const unitPrice = laborCost + materialCost + equipmentCost + subcontrCost;
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
            lineType,
            laborHours,
            laborRate,
            laborCost,
            materialCost,
            equipmentCost,
            subcontrCost,
            unitPrice,
            totalPrice,
          }),
        }
      );

      if (response.ok) {
        resetLineForm();
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

  function openEditLineDialog(line: EstimateLine) {
    setEditingLineId(line.id);
    setLineDescription(line.description);
    setLineQuantity(line.quantity.toString());
    setLineUnit(line.unit);
    setLineType(line.lineType || "NORMAL");
    setLineLaborHours(line.laborHours.toString());
    setLineLaborRate(line.laborRate.toString());
    setLineMaterialCost(line.materialCost.toString());
    setLineEquipmentCost(line.equipmentCost.toString());
    setLineSubcontrCost(line.subcontrCost.toString());
    setIsEditingLine(true);
  }

  async function handleUpdateLine() {
    if (!lineDescription || !editingLineId) return;

    const laborHours = parseFloat(lineLaborHours) || 0;
    const laborRate = parseFloat(lineLaborRate) || 45;
    const materialCost = parseFloat(lineMaterialCost) || 0;
    const equipmentCost = parseFloat(lineEquipmentCost) || 0;
    const subcontrCost = parseFloat(lineSubcontrCost) || 0;
    const quantity = parseFloat(lineQuantity) || 1;
    const laborCost = laborHours * laborRate;
    const unitPrice = laborCost + materialCost + equipmentCost + subcontrCost;
    const totalPrice = unitPrice * quantity;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/lines/${editingLineId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: lineDescription,
            quantity,
            unit: lineUnit,
            lineType,
            laborHours,
            laborRate,
            laborCost,
            materialCost,
            equipmentCost,
            subcontrCost,
            unitPrice,
            totalPrice,
          }),
        }
      );

      if (response.ok) {
        resetLineForm();
        setIsEditingLine(false);
        setEditingLineId(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function resetLineForm() {
    setLineDescription("");
    setLineQuantity("1");
    setLineUnit("st");
    setLineType("NORMAL");
    setLineLaborHours("0");
    setLineLaborRate("45");
    setLineMaterialCost("0");
    setLineEquipmentCost("0");
    setLineSubcontrCost("0");
  }

  async function handleUpdatePrice(line: EstimateLine) {
    setUpdatingPriceLineId(line.id);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/lines/${line.id}/update-price`,
        { method: "POST" }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.updated) {
          router.refresh();
        } else {
          alert(result.message || "Geen bijgewerkte prijs beschikbaar");
        }
      } else {
        const err = await response.json();
        alert(err.error || "Kon de prijs niet bijwerken");
      }
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Er is een fout opgetreden bij het bijwerken van de prijs");
    } finally {
      setUpdatingPriceLineId(null);
    }
  }

  async function handleUpdateAllPrices() {
    setUpdatingAllPrices(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/estimates/${estimateId}/lines/update-prices`,
        { method: "POST" }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        if (result.updatedCount > 0) {
          router.refresh();
        }
      } else {
        alert("Er is een fout opgetreden bij het bijwerken van de prijzen");
      }
    } catch (error) {
      console.error("Error updating all prices:", error);
      alert("Er is een fout opgetreden bij het bijwerken van de prijzen");
    } finally {
      setUpdatingAllPrices(false);
    }
  }

  async function handleExport(format: "ifc" | "ods" | "cuf") {
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
      <div className="flex gap-2 flex-wrap">
        <Dialog open={isAddingChapter} onOpenChange={setIsAddingChapter}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Hoofdstuk toevoegen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Hoofdstuk toevoegen
              </DialogTitle>
              <DialogDescription>
                Kies uit NL-SfB of STABU, of maak een eigen hoofdstuk
              </DialogDescription>
            </DialogHeader>

            <Tabs value={chapterTab} onValueChange={(v) => setChapterTab(v as "template" | "custom")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="template">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Standaard
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <Plus className="mr-2 h-4 w-4" />
                  Eigen
                </TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-3 mt-3">
                {/* Coding system selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Select
                      value={selectedCodingSystem}
                      onValueChange={(v) => {
                        setSelectedCodingSystem(v as CodingStandard);
                        setSelectedTemplates(new Set());
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CODING_SYSTEMS.map((system) => (
                          <SelectItem key={system.id} value={system.id}>
                            {system.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllMainChapters}
                    >
                      Alle hoofdgroepen
                    </Button>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek..."
                    value={templateSearchQuery}
                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Chapter list */}
                <ScrollArea className="h-[250px] border rounded-lg">
                  <div className="p-1.5 space-y-0.5">
                    {getFilteredTemplates().map((template) => {
                      const isMainChapter = template.code.length <= 2;
                      const isSelected = selectedTemplates.has(template.code);
                      const alreadyExists = chapters.some(c => c.code === template.code);

                      return (
                        <div
                          key={template.code}
                          className={`flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 ${
                            isMainChapter ? "" : "pl-6"
                          } ${alreadyExists ? "opacity-50" : ""}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTemplateSelection(template.code)}
                            disabled={alreadyExists}
                            className="h-4 w-4"
                          />
                          <Badge
                            variant={isMainChapter ? "default" : "secondary"}
                            className="font-mono text-xs min-w-[40px] justify-center"
                          >
                            {template.code}
                          </Badge>
                          <span className={`text-sm truncate ${isMainChapter ? "font-medium" : ""}`}>
                            {template.name}
                          </span>
                          {alreadyExists && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {selectedTemplates.size > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplates.size} geselecteerd
                  </p>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="chapterCode">Code</Label>
                  <Input
                    id="chapterCode"
                    placeholder="21"
                    value={chapterCode}
                    onChange={(e) => setChapterCode(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chapterName">Naam</Label>
                  <Input
                    id="chapterName"
                    placeholder="Buitenwanden"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingChapter(false)}>
                Annuleren
              </Button>
              <Button
                onClick={handleAddChapter}
                disabled={
                  loading ||
                  (chapterTab === "template" && selectedTemplates.size === 0) ||
                  (chapterTab === "custom" && (!chapterCode || !chapterName))
                }
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : chapterTab === "template" ? (
                  `Toevoegen (${selectedTemplates.size})`
                ) : (
                  "Toevoegen"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={() => setIsLibrarySelectorOpen(true)}>
          <Library className="mr-2 h-4 w-4" />
          Uit bibliotheek
        </Button>

        <Button variant="outline" onClick={handleUpdateAllPrices} disabled={updatingAllPrices}>
          {updatingAllPrices ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Prijzen actualiseren
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

        <Button variant="outline" onClick={() => handleExport("cuf")} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export CUF-XML
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
                                    <div className="flex items-center gap-2">
                                      <p>{line.description}</p>
                                      {line.lineType && line.lineType !== "NORMAL" && (
                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${LINE_TYPE_COLORS[line.lineType]}`}>
                                          {LINE_TYPE_LABELS[line.lineType]}
                                        </Badge>
                                      )}
                                    </div>
                                    {line.code && (
                                      <p className="text-xs text-muted-foreground">{line.code}</p>
                                    )}
                                    {/* Cost breakdown mini badges */}
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {line.laborCost > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                          Arbeid {formatCurrency(line.laborCost)}
                                        </Badge>
                                      )}
                                      {line.materialCost > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                          Materiaal {formatCurrency(line.materialCost)}
                                        </Badge>
                                      )}
                                      {line.equipmentCost > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                          Materieel {formatCurrency(line.equipmentCost)}
                                        </Badge>
                                      )}
                                      {line.subcontrCost > 0 && (
                                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                          Onderaann. {formatCurrency(line.subcontrCost)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{line.quantity}</TableCell>
                                <TableCell>{line.unit}</TableCell>
                                <TableCell className="text-right">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger className="cursor-help underline decoration-dotted">
                                        {formatCurrency(line.unitPrice)}
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="text-xs">
                                        <div className="space-y-0.5">
                                          {line.laborCost > 0 && (
                                            <div className="flex justify-between gap-4">
                                              <span>Arbeid ({line.laborHours}u × {formatCurrency(line.laborRate)}):</span>
                                              <span>{formatCurrency(line.laborCost)}</span>
                                            </div>
                                          )}
                                          {line.materialCost > 0 && (
                                            <div className="flex justify-between gap-4">
                                              <span>Materiaal:</span>
                                              <span>{formatCurrency(line.materialCost)}</span>
                                            </div>
                                          )}
                                          {line.equipmentCost > 0 && (
                                            <div className="flex justify-between gap-4">
                                              <span>Materieel:</span>
                                              <span>{formatCurrency(line.equipmentCost)}</span>
                                            </div>
                                          )}
                                          {line.subcontrCost > 0 && (
                                            <div className="flex justify-between gap-4">
                                              <span>Onderaanneming:</span>
                                              <span>{formatCurrency(line.subcontrCost)}</span>
                                            </div>
                                          )}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(line.totalPrice)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    {line.libraryItemId && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleUpdatePrice(line)}
                                              disabled={updatingPriceLineId === line.id}
                                            >
                                              <RefreshCw className={`h-4 w-4 text-muted-foreground hover:text-green-600 ${
                                                updatingPriceLineId === line.id ? "animate-spin" : ""
                                              }`} />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Prijs actualiseren vanuit bibliotheek</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditLineDialog(line)}
                                    >
                                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteLine(line.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={5} className="text-right font-medium">
                                Totaal hoofdstuk
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {formatCurrency(
                                  chapter.lines.reduce((sum, line) => sum + line.totalPrice, 0)
                                )}
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableFooter>
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
                          <TableCell>
                            <div>
                              <p>{line.description}</p>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {line.laborCost > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                    Arbeid {formatCurrency(line.laborCost)}
                                  </Badge>
                                )}
                                {line.materialCost > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                    Materiaal {formatCurrency(line.materialCost)}
                                  </Badge>
                                )}
                                {line.equipmentCost > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                    Materieel {formatCurrency(line.equipmentCost)}
                                  </Badge>
                                )}
                                {line.subcontrCost > 0 && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 font-normal">
                                    Onderaann. {formatCurrency(line.subcontrCost)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{line.quantity}</TableCell>
                          <TableCell>{line.unit}</TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-help underline decoration-dotted">
                                  {formatCurrency(line.unitPrice)}
                                </TooltipTrigger>
                                <TooltipContent side="left" className="text-xs">
                                  <div className="space-y-0.5">
                                    {line.laborCost > 0 && (
                                      <div className="flex justify-between gap-4">
                                        <span>Arbeid ({line.laborHours}u × {formatCurrency(line.laborRate)}):</span>
                                        <span>{formatCurrency(line.laborCost)}</span>
                                      </div>
                                    )}
                                    {line.materialCost > 0 && (
                                      <div className="flex justify-between gap-4">
                                        <span>Materiaal:</span>
                                        <span>{formatCurrency(line.materialCost)}</span>
                                      </div>
                                    )}
                                    {line.equipmentCost > 0 && (
                                      <div className="flex justify-between gap-4">
                                        <span>Materieel:</span>
                                        <span>{formatCurrency(line.equipmentCost)}</span>
                                      </div>
                                    )}
                                    {line.subcontrCost > 0 && (
                                      <div className="flex justify-between gap-4">
                                        <span>Onderaanneming:</span>
                                        <span>{formatCurrency(line.subcontrCost)}</span>
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(line.totalPrice)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {line.libraryItemId && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleUpdatePrice(line)}
                                        disabled={updatingPriceLineId === line.id}
                                      >
                                        <RefreshCw className={`h-4 w-4 text-muted-foreground hover:text-green-600 ${
                                          updatingPriceLineId === line.id ? "animate-spin" : ""
                                        }`} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Prijs actualiseren vanuit bibliotheek</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditLineDialog(line)}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLine(line.id)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-600" />
                              </Button>
                            </div>
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
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type regel</Label>
              <Select value={lineType} onValueChange={setLineType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Regulier</SelectItem>
                  <SelectItem value="PROVISIONAL">Stelpost</SelectItem>
                  <SelectItem value="ADJUSTABLE">Verrekenbaar</SelectItem>
                </SelectContent>
              </Select>
              {lineType === "PROVISIONAL" && (
                <p className="text-xs text-amber-600">Stelpost: vaste schatting, wordt later definitief vastgesteld</p>
              )}
              {lineType === "ADJUSTABLE" && (
                <p className="text-xs text-purple-600">Verrekenbaar: wordt op basis van werkelijk verrekend</p>
              )}
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lineMaterialCost">Materiaal (€)</Label>
                <Input
                  id="lineMaterialCost"
                  type="number"
                  step="0.01"
                  value={lineMaterialCost}
                  onChange={(e) => setLineMaterialCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineEquipmentCost">Materieel (€)</Label>
                <Input
                  id="lineEquipmentCost"
                  type="number"
                  step="0.01"
                  value={lineEquipmentCost}
                  onChange={(e) => setLineEquipmentCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineSubcontrCost">Onderaann. (€)</Label>
                <Input
                  id="lineSubcontrCost"
                  type="number"
                  step="0.01"
                  value={lineSubcontrCost}
                  onChange={(e) => setLineSubcontrCost(e.target.value)}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Arbeid:</span>
                <span>
                  {formatCurrency(
                    (parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Materiaal:</span>
                <span>{formatCurrency(parseFloat(lineMaterialCost) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Materieel:</span>
                <span>{formatCurrency(parseFloat(lineEquipmentCost) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Onderaanneming:</span>
                <span>{formatCurrency(parseFloat(lineSubcontrCost) || 0)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1 mt-1">
                <span>Eenheidsprijs:</span>
                <span>
                  {formatCurrency(
                    (parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0) +
                      (parseFloat(lineMaterialCost) || 0) +
                      (parseFloat(lineEquipmentCost) || 0) +
                      (parseFloat(lineSubcontrCost) || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Totaal ({lineQuantity} {lineUnit}):</span>
                <span>
                  {formatCurrency(
                    ((parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0) +
                      (parseFloat(lineMaterialCost) || 0) +
                      (parseFloat(lineEquipmentCost) || 0) +
                      (parseFloat(lineSubcontrCost) || 0)) *
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

      {/* Edit Line Dialog */}
      <Dialog open={isEditingLine} onOpenChange={(open) => {
        setIsEditingLine(open);
        if (!open) {
          resetLineForm();
          setEditingLineId(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Regel bewerken</DialogTitle>
            <DialogDescription>
              Pas de gegevens van deze regel aan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editLineDescription">Omschrijving *</Label>
              <Input
                id="editLineDescription"
                placeholder="Metselwerk buitenmuur"
                value={lineDescription}
                onChange={(e) => setLineDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editLineQuantity">Aantal</Label>
                <Input
                  id="editLineQuantity"
                  type="number"
                  step="0.01"
                  value={lineQuantity}
                  onChange={(e) => setLineQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLineUnit">Eenheid</Label>
                <Select value={lineUnit} onValueChange={setLineUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type regel</Label>
              <Select value={lineType} onValueChange={setLineType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Regulier</SelectItem>
                  <SelectItem value="PROVISIONAL">Stelpost</SelectItem>
                  <SelectItem value="ADJUSTABLE">Verrekenbaar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editLineLaborHours">Uren per eenheid</Label>
                <Input
                  id="editLineLaborHours"
                  type="number"
                  step="0.01"
                  value={lineLaborHours}
                  onChange={(e) => setLineLaborHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLineLaborRate">Uurtarief (€)</Label>
                <Input
                  id="editLineLaborRate"
                  type="number"
                  step="0.01"
                  value={lineLaborRate}
                  onChange={(e) => setLineLaborRate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editLineMaterialCost">Materiaal (€)</Label>
                <Input
                  id="editLineMaterialCost"
                  type="number"
                  step="0.01"
                  value={lineMaterialCost}
                  onChange={(e) => setLineMaterialCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLineEquipmentCost">Materieel (€)</Label>
                <Input
                  id="editLineEquipmentCost"
                  type="number"
                  step="0.01"
                  value={lineEquipmentCost}
                  onChange={(e) => setLineEquipmentCost(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLineSubcontrCost">Onderaann. (€)</Label>
                <Input
                  id="editLineSubcontrCost"
                  type="number"
                  step="0.01"
                  value={lineSubcontrCost}
                  onChange={(e) => setLineSubcontrCost(e.target.value)}
                />
              </div>
            </div>

            {/* Preview */}
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Arbeid:</span>
                <span>
                  {formatCurrency(
                    (parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Materiaal:</span>
                <span>{formatCurrency(parseFloat(lineMaterialCost) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Materieel:</span>
                <span>{formatCurrency(parseFloat(lineEquipmentCost) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Onderaanneming:</span>
                <span>{formatCurrency(parseFloat(lineSubcontrCost) || 0)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1 mt-1">
                <span>Eenheidsprijs:</span>
                <span>
                  {formatCurrency(
                    (parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0) +
                      (parseFloat(lineMaterialCost) || 0) +
                      (parseFloat(lineEquipmentCost) || 0) +
                      (parseFloat(lineSubcontrCost) || 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Totaal ({lineQuantity} {lineUnit}):</span>
                <span>
                  {formatCurrency(
                    ((parseFloat(lineLaborHours) || 0) * (parseFloat(lineLaborRate) || 0) +
                      (parseFloat(lineMaterialCost) || 0) +
                      (parseFloat(lineEquipmentCost) || 0) +
                      (parseFloat(lineSubcontrCost) || 0)) *
                      (parseFloat(lineQuantity) || 1)
                  )}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditingLine(false);
              resetLineForm();
              setEditingLineId(null);
            }}>
              Annuleren
            </Button>
            <Button onClick={handleUpdateLine} disabled={loading || !lineDescription}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
