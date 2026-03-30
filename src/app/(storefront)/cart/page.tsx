"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, Lock } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotal = useCartStore((s) => s.getTotal);

  const subtotal = getTotal();
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add some products to get started.</p>
        <Link href="/products" className="inline-flex h-10 items-center rounded-lg bg-primary text-primary-foreground px-6 font-medium shadow hover:bg-primary/90">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Shopping Cart</h1>
      <p className="text-sm text-muted-foreground mb-8">{items.length} item{items.length !== 1 ? "s" : ""}</p>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-lg border bg-card p-4">
              <div className="relative w-24 h-24 rounded-md overflow-hidden bg-muted shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">No Img</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="font-medium text-sm hover:text-accent line-clamp-1">{item.name}</Link>
                <p className="text-sm text-muted-foreground mt-0.5">{item.variant}</p>
                <p className="font-semibold mt-1 tabular-nums">${item.price.toFixed(2)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border rounded-md">
                    <button onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))} className="p-1.5 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="px-3 text-sm tabular-nums">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="p-1.5 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-lg border bg-card p-4">
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Promo code" className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              <button className="h-9 rounded-md border px-4 text-sm font-medium hover:bg-muted">Apply</button>
            </form>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="tabular-nums">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span className="tabular-nums">${tax.toFixed(2)}</span></div>
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base"><span>Total</span><span className="tabular-nums">${total.toFixed(2)}</span></div>
            </div>
            <Link href="/checkout" className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90">Checkout</Link>
            <Link href="/products" className="mt-2 flex h-10 w-full items-center justify-center rounded-lg border text-sm font-medium hover:bg-muted">Continue Shopping</Link>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Secure checkout</div>
          </div>
        </div>
      </div>
    </div>
  );
}
