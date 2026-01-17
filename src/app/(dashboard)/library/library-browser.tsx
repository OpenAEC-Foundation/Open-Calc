"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Library, Filter, FileText, ChevronDown, ChevronUp, Edit, Image } from "lucide-react";
import { LibraryItemDialog } from "./library-item-dialog";

interface CostLibrary {
  id: string;
  name: string;
  standard: string;
  _count: { items: number };
  categories: {
    id: string;
    code: string;
    name: string;
  }[];
}

interface LibraryItem {
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
  unitPrice: number;
  category: { code: string; name: string } | null;
  library: { name: string; standard: string };
  _count?: { images: number };
}

interface LibraryBrowserProps {
  libraries: CostLibrary[];
  items: LibraryItem[];
  selectedLibrary?: string;
  selectedCategory?: string;
  searchQuery?: string;
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

export function LibraryBrowser({
  libraries,
  items,
  selectedLibrary,
  selectedCategory,
  searchQuery,
}: LibraryBrowserProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery || "");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const currentLibrary = libraries.find((l) => l.id === selectedLibrary);

  function toggleExpand(itemId: string) {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  }

  function updateFilters(params: Record<string, string | undefined>) {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    router.push(`/library?${newParams.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters({ search: search || undefined });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  function openEditDialog(itemId: string) {
    setEditItemId(itemId);
    setEditDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Library Selection Tabs */}
      <Tabs
        value={selectedLibrary || "all"}
        onValueChange={(value) =>
          updateFilters({
            library: value === "all" ? undefined : value,
            category: undefined,
          })
        }
      >
        <TabsList>
          <TabsTrigger value="all">Alle bibliotheken</TabsTrigger>
          {libraries.map((library) => (
            <TabsTrigger key={library.id} value={library.id}>
              {standardLabels[library.standard]} ({library._count.items})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Zoek op code of omschrijving..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Zoeken</Button>
        </form>

        {currentLibrary && currentLibrary.categories.length > 0 && (
          <Select
            value={selectedCategory || "all"}
            onValueChange={(value) =>
              updateFilters({ category: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-[250px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter op categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle categorieën</SelectItem>
              {currentLibrary.categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.code}>
                  {cat.code} - {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Results */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Library className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Geen resultaten gevonden</h3>
            <p className="text-muted-foreground text-center">
              Probeer een andere zoekopdracht of filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Kostenposten</CardTitle>
            <CardDescription>
              {items.length} resultaten gevonden
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Code</TableHead>
                    <TableHead>Omschrijving</TableHead>
                    <TableHead className="w-[80px]">Eenheid</TableHead>
                    <TableHead className="text-right w-[100px]">Arbeid</TableHead>
                    <TableHead className="text-right w-[100px]">Materiaal</TableHead>
                    <TableHead className="text-right w-[120px]">Eenheidsprijs</TableHead>
                    <TableHead className="w-[80px]">Bron</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <>
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => item.specification && toggleExpand(item.id)}
                      >
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            {item.specification && (
                              expandedItems.has(item.id) ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )
                            )}
                            {item.code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {item.category && (
                              <p className="text-xs text-muted-foreground">
                                {item.category.code} - {item.category.name}
                              </p>
                            )}
                            {(item.specification || item.offerText) && !expandedItems.has(item.id) && (
                              <div className="flex items-center gap-2 mt-1">
                                {item.specification && (
                                  <span className="text-xs text-blue-600 flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Spec
                                  </span>
                                )}
                                {item.offerText && (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <Edit className="h-3 w-3" />
                                    Offerte
                                  </span>
                                )}
                                {item._count?.images && item._count.images > 0 && (
                                  <span className="text-xs text-purple-600 flex items-center gap-1">
                                    <Image className="h-3 w-3" />
                                    {item._count.images}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          {item.laborHours > 0 && (
                            <span className="text-sm">
                              {item.laborHours.toFixed(2)} u
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.materialCost)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell>
                          <Badge className={standardColors[item.library.standard]}>
                            {standardLabels[item.library.standard]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(item.id);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {item.specification && expandedItems.has(item.id) && (
                        <TableRow key={`${item.id}-spec`} className="bg-muted/30">
                          <TableCell colSpan={7} className="p-4">
                            <div className="bg-background rounded-lg p-4 border">
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Specificatietekst
                              </h4>
                              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                                {item.specification}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <LibraryItemDialog
        itemId={editItemId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  );
}
