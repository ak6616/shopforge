"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Package, CreditCard, Cog, Truck, MapPin, CheckCircle, ExternalLink, AlertCircle, Loader2 } from "lucide-react";

type OrderEventType =
  | "CREATED"
  | "PAYMENT_INITIATED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PAYMENT_REFUNDED"
  | "STATUS_CHANGED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "NOTE_ADDED"
  | "TRACKING_UPDATED";

interface OrderEvent {
  id: string;
  type: OrderEventType;
  description: string | null;
  source: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  totalAmount: number;
  courierCarrier: string | null;
  courierTrackingId: string | null;
  trackingUrl: string | null;
  createdAt: string;
  items: OrderItem[];
  events: OrderEvent[];
  address: Address | null;
}

const EVENT_ICON_MAP: Partial<Record<OrderEventType, React.ElementType>> = {
  CREATED: Package,
  PAYMENT_INITIATED: CreditCard,
  PAYMENT_SUCCEEDED: CreditCard,
  SHIPPED: Truck,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERED: CheckCircle,
  STATUS_CHANGED: Cog,
  TRACKING_UPDATED: Truck,
};

const EVENT_LABEL_MAP: Partial<Record<OrderEventType, string>> = {
  CREATED: "Order Placed",
  PAYMENT_INITIATED: "Payment Initiated",
  PAYMENT_SUCCEEDED: "Payment Confirmed",
  PAYMENT_FAILED: "Payment Failed",
  PAYMENT_REFUNDED: "Payment Refunded",
  STATUS_CHANGED: "Status Updated",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  NOTE_ADDED: "Note Added",
  TRACKING_UPDATED: "Tracking Updated",
};

const TERMINAL_EVENTS: OrderEventType[] = ["DELIVERED", "CANCELLED", "PAYMENT_FAILED"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount / 100);
}

function statusBadgeClass(status: string) {
  switch (status.toUpperCase()) {
    case "DELIVERED": return "bg-green-100 text-green-800";
    case "SHIPPED": return "bg-blue-100 text-blue-800";
    case "OUT_FOR_DELIVERY": return "bg-blue-100 text-blue-800";
    case "CANCELLED": return "bg-red-100 text-red-800";
    case "PAYMENT_FAILED": return "bg-red-100 text-red-800";
    default: return "bg-yellow-100 text-yellow-800";
  }
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/v1/orders/${orderId}`);
        if (res.status === 404) {
          setError("Order not found.");
          return;
        }
        if (!res.ok) {
          setError("Failed to load order details. Please try again.");
          return;
        }
        const data: Order = await res.json();
        setOrder(data);
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-4" />
        <p className="text-lg font-medium">{error ?? "Order not found."}</p>
        <Link href="/products" className="mt-4 inline-block text-sm text-accent hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const latestTerminalEvent = order.events.find((e) =>
    TERMINAL_EVENTS.includes(e.type as OrderEventType)
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Placed: {formatDate(order.createdAt)} &middot; Total: {formatAmount(order.totalAmount, order.currency)}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(order.status)}`}>
          {order.status.charAt(0) + order.status.slice(1).toLowerCase().replace(/_/g, " ")}
        </span>
      </div>

      {/* Tracking Timeline */}
      {order.events.length > 0 && (
        <div className="mb-10">
          <h2 className="font-semibold mb-6">Tracking Timeline</h2>
          <ol className="relative border-l-2 border-muted ml-4 space-y-0">
            {order.events.map((event, i) => {
              const Icon = EVENT_ICON_MAP[event.type as OrderEventType] ?? Package;
              const isLast = i === order.events.length - 1;
              const isTerminal = !!latestTerminalEvent && latestTerminalEvent.id === event.id;
              return (
                <li key={event.id} className="ml-6 pb-8 last:pb-0">
                  <div
                    className={`absolute -left-[13px] w-6 h-6 rounded-full flex items-center justify-center ${
                      isTerminal
                        ? "bg-green-600 text-white"
                        : isLast
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-muted-foreground text-white"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium text-sm ${isLast ? "text-foreground" : "text-muted-foreground"}`}>
                      {EVENT_LABEL_MAP[event.type as OrderEventType] ?? event.type}
                    </span>
                    {isLast && !isTerminal && (
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">Current</span>
                    )}
                    {isTerminal && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.createdAt)}</p>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Carrier Info */}
      {(order.courierCarrier || order.courierTrackingId) && (
        <div className="rounded-lg border p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {order.courierCarrier && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Carrier:</span>{" "}
                  <span className="font-medium">{order.courierCarrier}</span>
                </p>
              )}
              {order.courierTrackingId && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Tracking #:</span>{" "}
                  <span className="font-mono">{order.courierTrackingId}</span>
                </p>
              )}
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Track Package <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="mb-8">
        <h2 className="font-semibold mb-4">Order Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="w-16 h-16 rounded-md bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.productName}</p>
                <p className="text-xs text-muted-foreground">{item.variantName} &middot; x{item.quantity}</p>
              </div>
              <span className="font-semibold text-sm tabular-nums">
                {formatAmount(item.totalPrice, order.currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      {order.address && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Delivery Address</h2>
          <p className="text-sm text-muted-foreground">
            {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ""}
            {`, ${order.address.city}`}
            {order.address.state ? `, ${order.address.state}` : ""}
            {`, ${order.address.postalCode}, ${order.address.country}`}
          </p>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link href="/products" className="text-sm text-accent hover:underline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
