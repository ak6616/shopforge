import { ShoppingCart } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">No orders yet</p>
        <p className="text-sm mt-1">Orders will appear here once customers start purchasing.</p>
      </div>
    </div>
  );
}
