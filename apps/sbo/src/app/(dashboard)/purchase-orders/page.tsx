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
import { Plus, ShoppingCart, Send, CheckCircle, Package, Eye, Edit } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface PurchaseOrder {
  id: string;
  projectId: string;
  project?: { name: string };
  orderNumber: string;
  supplierId?: string;
  supplier?: { name: string };
  status: string;
  totalAmount: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  deliveredAt?: string;
  notes?: string;
}

interface Project {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Concept",
  SENT: "Verzonden",
  CONFIRMED: "Bevestigd",
  DELIVERED: "Geleverd",
  CANCELLED: "Geannuleerd",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "secondary",
  SENT: "default",
  CONFIRMED: "default",
  DELIVERED: "default",
  CANCELLED: "secondary",
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [projectId, setProjectId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchProjects();
    fetchSuppliers();
    fetchOrders();
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

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      // Filter for suppliers only
      setSuppliers(data.filter((c: { type: string }) => c.type === "SUPPLIER"));
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/projects");
      const projectsData = await res.json();

      const allOrders: PurchaseOrder[] = [];
      for (const project of projectsData) {
        try {
          const ordersRes = await fetch(`/api/projects/${project.id}/purchase-orders`);
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            allOrders.push(
              ...ordersData.map((o: PurchaseOrder) => ({
                ...o,
                project: { name: project.name },
              }))
            );
          }
        } catch {
          // Skip projects without purchase orders
        }
      }

      // Sort by order date descending
      allOrders.sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
      setOrders(allOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectId("");
    setSupplierId("");
    setOrderDate(format(new Date(), "yyyy-MM-dd"));
    setExpectedDeliveryDate("");
    setTotalAmount("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      supplierId: supplierId || null,
      orderDate,
      expectedDeliveryDate: expectedDeliveryDate || null,
      totalAmount: parseFloat(totalAmount),
      notes: notes || null,
    };

    try {
      await fetch(`/api/projects/${projectId}/purchase-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const handleStatusChange = async (order: PurchaseOrder, newStatus: string) => {
    try {
      const body: Record<string, unknown> = { status: newStatus };
      if (newStatus === "DELIVERED") {
        body.deliveredAt = new Date().toISOString();
      }

      await fetch(`/api/projects/${order.projectId}/purchase-orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const totalOrdered = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalDelivered = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter(
    (o) => o.status === "SENT" || o.status === "CONFIRMED"
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inkoopbeheer</h1>
          <p className="text-muted-foreground">Beheer inkooporders en leveringen</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe inkooporder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nieuwe inkooporder</DialogTitle>
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
                <Label>Leverancier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer leverancier (optioneel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Orderdatum</Label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Verwachte leverdatum</Label>
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Totaalbedrag (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="1000.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Notities</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionele notities"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit">Aanmaken</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal besteld</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalOrdered.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In afwachting</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geleverd</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              €{totalDelivered.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders table */}
      <Card>
        <CardHeader>
          <CardTitle>Inkooporders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Laden...</p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground">Geen inkooporders gevonden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordernummer</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Leverancier</TableHead>
                  <TableHead>Orderdatum</TableHead>
                  <TableHead>Leverdatum</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.project?.name}</TableCell>
                    <TableCell>{order.supplier?.name || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(order.orderDate), "d MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      {order.expectedDeliveryDate
                        ? format(new Date(order.expectedDeliveryDate), "d MMM yyyy", {
                            locale: nl,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      €{order.totalAmount.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[order.status] as "default" | "secondary" | "destructive"}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title="Bekijken">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === "DRAFT" && (
                          <>
                            <Button size="icon" variant="ghost" title="Bewerken">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Verzenden"
                              onClick={() => handleStatusChange(order, "SENT")}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {order.status === "SENT" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Bevestigen"
                            onClick={() => handleStatusChange(order, "CONFIRMED")}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {order.status === "CONFIRMED" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Markeer als geleverd"
                            onClick={() => handleStatusChange(order, "DELIVERED")}
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        )}
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
