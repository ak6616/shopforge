"use client";

import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, TrendingUp, Percent, Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const REVENUE_DATA = [
  { date: "Mar 1", revenue: 1200 }, { date: "Mar 5", revenue: 1800 }, { date: "Mar 8", revenue: 1400 },
  { date: "Mar 12", revenue: 2200 }, { date: "Mar 15", revenue: 1900 }, { date: "Mar 18", revenue: 2800 },
  { date: "Mar 21", revenue: 2400 }, { date: "Mar 24", revenue: 3100 }, { date: "Mar 27", revenue: 2700 },
  { date: "Mar 29", revenue: 3500 },
];

const TOP_PRODUCTS = [
  { name: "Premium T-Shirt", revenue: 8420 }, { name: "Classic Hoodie", revenue: 6800 },
  { name: "Slim Fit Jeans", revenue: 5200 }, { name: "Leather Wallet", revenue: 4100 },
  { name: "Running Shoes", revenue: 3800 },
];

const ORDERS_DATA = Array.from({ length: 25 }, (_, i) => ({
  id: `SF-${20260329 - i}-${1000 + i}`,
  customer: ["John Doe", "Jane Smith", "Mike Wilson", "Sarah Brown", "Alex Lee"][i % 5],
  date: `Mar ${29 - (i % 28)}, 2026`,
  items: (i % 4) + 1,
  total: 50 + Math.floor(Math.random() * 300),
  status: ["delivered", "shipped", "processing", "delivered", "shipped"][i % 5],
}));

const KPI_CARDS = [
  { label: "Revenue", value: "$42,190", change: "+12%", up: true, icon: DollarSign },
  { label: "Orders", value: "318", change: "+8%", up: true, icon: ShoppingCart },
  { label: "Avg. AOV", value: "$132.67", change: "+2%", up: true, icon: TrendingUp },
  { label: "Conversion Rate", value: "3.2%", change: "-0.1%", up: false, icon: Percent },
];

export default function AnalyticsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const perPage = 5;

  const filteredOrders = useMemo(() => {
    let orders = ORDERS_DATA;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      orders = orders.filter((o) => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q));
    }
    orders = [...orders].sort((a, b) => {
      const aVal = a[sortField as keyof typeof a];
      const bVal = b[sortField as keyof typeof b];
      if (typeof aVal === "number" && typeof bVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return orders;
  }, [searchQuery, sortField, sortDir]);

  const paginatedOrders = filteredOrders.slice((orderPage - 1) * perPage, orderPage * perPage);
  const totalOrderPages = Math.ceil(filteredOrders.length / perPage);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const statusColor: Record<string, string> = {
    delivered: "bg-green-100 text-green-800",
    shipped: "bg-blue-100 text-blue-800",
    processing: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Sales Analytics</h1>
        <select className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
          <option>Last 30 days</option><option>Last 7 days</option><option>Last 90 days</option><option>This year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-lg border bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold tabular-nums">{kpi.value}</div>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? "text-green-600" : "text-red-600"}`}>
                {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.change} from last period
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold mb-4">Revenue Over Time</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(240 3.8% 46.1%)" }} />
              <YAxis className="text-xs" tick={{ fill: "hsl(240 3.8% 46.1%)" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(240 5.9% 90%)", borderRadius: "8px", fontSize: "14px" }} formatter={(value) => [`$${value}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(263 70% 50.4%)" strokeWidth={2} dot={{ fill: "hsl(263 70% 50.4%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 rounded-lg border bg-card p-6">
          <h2 className="font-semibold mb-4">Top Products</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_PRODUCTS} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fill: "hsl(240 3.8% 46.1%)", fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: "hsl(240 3.8% 46.1%)", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0 0% 100%)", border: "1px solid hsl(240 5.9% 90%)", borderRadius: "8px", fontSize: "14px" }} formatter={(value) => [`$${value}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(263 70% 50.4%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-lg border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold">Recent Orders</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setOrderPage(1); }}
                  className="h-8 w-48 rounded-md border border-input bg-transparent pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
              <button className="inline-flex items-center gap-1 h-8 rounded-md border px-3 text-xs font-medium hover:bg-muted"><Download className="h-3 w-3" /> Export</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {[{ key: "id", label: "Order ID" }, { key: "customer", label: "Customer" }, { key: "date", label: "Date" }, { key: "items", label: "Items" }, { key: "total", label: "Total" }, { key: "status", label: "Status" }].map((col) => (
                    <th key={col.key} onClick={() => toggleSort(col.key)} className="text-left py-3 px-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground whitespace-nowrap">
                      {col.label}{sortField === col.key && (sortDir === "asc" ? " \u2191" : " \u2193")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-mono text-xs">{order.id}</td>
                    <td className="py-3 px-2">{order.customer}</td>
                    <td className="py-3 px-2 whitespace-nowrap">{order.date}</td>
                    <td className="py-3 px-2 tabular-nums">{order.items}</td>
                    <td className="py-3 px-2 tabular-nums">${order.total.toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor[order.status] || ""}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">Page {orderPage} of {totalOrderPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setOrderPage(Math.max(1, orderPage - 1))} disabled={orderPage <= 1} className="h-8 w-8 rounded-md border flex items-center justify-center disabled:opacity-50 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setOrderPage(Math.min(totalOrderPages, orderPage + 1))} disabled={orderPage >= totalOrderPages} className="h-8 w-8 rounded-md border flex items-center justify-center disabled:opacity-50 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
