"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileBox,
  FileText,
  FileImage,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface Document {
  id: string;
  projectId: string;
  project?: { name: string };
  name: string;
  type: string;
  category: string;
  filePath?: string;
  fileSize?: number;
  version: number;
  uploadedAt: string;
}

interface Project {
  id: string;
  name: string;
}

const DOCUMENT_CATEGORIES = [
  "Tekeningen",
  "Bestekken",
  "Offertes",
  "Contracten",
  "Correspondentie",
  "Foto's",
  "Rapporten",
  "Overig",
];

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  default: FileBox,
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Form state
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("pdf");
  const [category, setCategory] = useState("");
  const [filePath, setFilePath] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchDocuments();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/projects");
      const projectsData = await res.json();

      const allDocuments: Document[] = [];
      for (const project of projectsData) {
        try {
          const docsRes = await fetch(`/api/projects/${project.id}/documents`);
          if (docsRes.ok) {
            const docsData = await docsRes.json();
            allDocuments.push(
              ...docsData.map((d: Document) => ({
                ...d,
                project: { name: project.name },
              }))
            );
          }
        } catch {
          // Skip projects without documents
        }
      }

      // Sort by upload date descending
      allDocuments.sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      setDocuments(allDocuments);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectId("");
    setName("");
    setType("pdf");
    setCategory("");
    setFilePath("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      name,
      type,
      category,
      filePath: filePath || null,
    };

    try {
      await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error("Error creating document:", error);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Weet je zeker dat je "${doc.name}" wilt verwijderen?`)) return;

    try {
      await fetch(`/api/projects/${doc.projectId}/documents/${doc.id}`, {
        method: "DELETE",
      });
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const getFileIcon = (type: string) => {
    const Icon = FILE_ICONS[type.toLowerCase()] || FILE_ICONS.default;
    return <Icon className="h-5 w-5" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocuments = documents.filter((doc) => {
    if (filterProject !== "ALL" && doc.projectId !== filterProject) return false;
    if (filterCategory !== "ALL" && doc.category !== filterCategory) return false;
    return true;
  });

  const stats = {
    total: documents.length,
    categories: new Set(documents.map((d) => d.category)).size,
    projects: new Set(documents.map((d) => d.projectId)).size,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentbeheer</h1>
          <p className="text-muted-foreground">Beheer projectdocumenten en bestanden</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuw document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuw document</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Documentnaam</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bijv. Bouwtekening fase 1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">Word</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="dwg">AutoCAD</SelectItem>
                      <SelectItem value="jpg">Afbeelding</SelectItem>
                      <SelectItem value="other">Overig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bestandslocatie (optioneel)</Label>
                <Input
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="C:\Documents\project\bestand.pdf"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">Toevoegen</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal documenten</CardTitle>
            <FileBox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorieën</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projecten met documenten</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter op project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle projecten</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter op categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle categorieën</SelectItem>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents table */}
      <Card>
        <CardHeader>
          <CardTitle>Documenten</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : filteredDocuments.length === 0 ? (
            <p className="text-muted-foreground">Geen documenten gevonden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Grootte</TableHead>
                  <TableHead>Versie</TableHead>
                  <TableHead>Geüpload</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.type)}
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.project?.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{doc.category}</Badge>
                    </TableCell>
                    <TableCell className="uppercase text-xs">{doc.type}</TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>v{doc.version}</TableCell>
                    <TableCell>
                      {format(new Date(doc.uploadedAt), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title="Bekijken">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Downloaden">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Verwijderen"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
