import { Package } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Products</h1>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">Product management</p>
        <p className="text-sm mt-1">Manage your product catalog, inventory, and pricing here.</p>
      </div>
    </div>
  );
}
