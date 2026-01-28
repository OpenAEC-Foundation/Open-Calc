import { ERPNextImport } from "./erpnext-import";

export default function ImportProjectPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project importeren</h1>
        <p className="text-muted-foreground">
          Importeer projectgegevens uit externe systemen zoals ERPNext
        </p>
      </div>

      <ERPNextImport />
    </div>
  );
}
