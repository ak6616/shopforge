"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Package, CreditCard, Cog, Truck, MapPin, CheckCircle, ExternalLink } from "lucide-react";

const TIMELINE_STEPS = [
  { label: "Order Placed", icon: Package, date: "Mar 29, 2026 10:02 AM", completed: true },
  { label: "Payment Confirmed", icon: CreditCard, date: "Mar 29, 2026 10:03 AM", completed: true },
  { label: "Processing", icon: Cog, date: "Mar 29, 2026 2:15 PM", completed: true },
  { label: "Shipped", icon: Truck, date: "Mar 30, 2026 (estimated)", completed: false, current: true },
  { label: "Out for Delivery", icon: MapPin, date: "Mar 31, 2026 (estimated)", completed: false },
  { label: "Delivered", icon: CheckCircle, date: "Apr 1, 2026 (estimated)", completed: false },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Order #{orderId}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed: March 29, 2026 &middot; Total: $280.76
          </p>
        </div>
        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800">
          Shipped
        </span>
      </div>

      {/* Tracking Timeline */}
      <div className="mb-10">
        <h2 className="font-semibold mb-6">Tracking Timeline</h2>
        <ol className="relative border-l-2 border-muted ml-4 space-y-0">
          {TIMELINE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="ml-6 pb-8 last:pb-0">
                <div
                  className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${
                    step.completed
                      ? "bg-green-600 text-white"
                      : step.current
                      ? "bg-blue-600 text-white animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`font-medium text-sm ${step.completed || step.current ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                  {step.completed && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {step.current && (
                    <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">Current</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Carrier Info */}
      <div className="rounded-lg border p-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm">
              <span className="text-muted-foreground">Carrier:</span>{" "}
              <span className="font-medium">FedEx</span>
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Tracking #:</span>{" "}
              <span className="font-mono">789456123012</span>
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Track on FedEx <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-8">
        <h2 className="font-semibold mb-4">Order Items</h2>
        <div className="space-y-3">
          {[
            { name: "Premium T-Shirt", variant: "Blue / M", qty: 1, price: 129.99 },
            { name: "Classic Hoodie", variant: "Red / L", qty: 2, price: 129.98 },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="w-16 h-16 rounded-md bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.variant} &middot; x{item.qty}</p>
              </div>
              <span className="font-semibold text-sm tabular-nums">${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-2">Delivery Address</h2>
        <p className="text-sm text-muted-foreground">
          John Doe, 123 Main St, Warsaw, 00-001, PL
        </p>
      </div>

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link href="/products" className="text-sm text-accent hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
