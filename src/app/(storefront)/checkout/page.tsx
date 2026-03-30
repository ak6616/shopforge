"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Lock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCartStore } from "@/store/cart";
import { createCheckoutIntent } from "@/lib/api";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Step = 1 | 2 | 3;

interface CheckoutAddress {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const SHIPPING_METHODS = [
  { id: "standard", label: "Standard (5-7 days)", price: 0 },
  { id: "express", label: "Express (2-3 days)", price: 9.99 },
  { id: "overnight", label: "Overnight (next day)", price: 24.99 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);

  const [step, setStep] = useState<Step>(1);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [address, setAddress] = useState<CheckoutAddress>({
    email: "", phone: "", firstName: "", lastName: "",
    address1: "", address2: "", city: "", state: "", postalCode: "", country: "US",
  });

  const [shippingMethod, setShippingMethod] = useState("standard");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);

  const selectedShipping = SHIPPING_METHODS.find((m) => m.id === shippingMethod)!;
  const subtotal = getTotal();
  const shipping = selectedShipping.price;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleContactSubmit = (e: React.FormEvent) => { e.preventDefault(); setStep(2); };
  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentLoading(true);
    setIntentError(null);
    try {
      const result = await createCheckoutIntent({
        cartItems: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        shippingAddress: {
          firstName: address.firstName,
          lastName: address.lastName,
          address1: address.address1,
          address2: address.address2 || undefined,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        },
        shippingMethod,
      });
      setClientSecret(result.clientSecret);
      setOrderId(result.orderNumber);
      setStep(3);
    } catch (err) {
      setIntentError(err instanceof Error ? err.message : "Failed to initialize payment. Please try again.");
    } finally {
      setIntentLoading(false);
    }
  };

  if (items.length === 0 && !orderConfirmed) { router.push("/cart"); return null; }

  if (orderConfirmed) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6"><Check className="h-8 w-8 text-green-600" /></div>
        <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-1">Order #{orderId}</p>
        <p className="text-sm text-muted-foreground mb-8">A confirmation email has been sent to {address.email}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={`/orders/${orderId}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 font-medium">Track Your Order</Link>
          <Link href="/products" className="inline-flex h-10 items-center justify-center rounded-lg border px-6 font-medium hover:bg-muted">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-center mb-10">
        {[{ num: 1, label: "Contact" }, { num: 2, label: "Shipping" }, { num: 3, label: "Payment" }].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step > s.num ? "bg-green-600 text-white" : step === s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`text-sm font-medium ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < 2 && <div className={`w-16 h-px mx-3 ${step > s.num ? "bg-green-600" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          {step === 1 && (
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
                <div className="space-y-3">
                  <InputField label="Email" type="email" required value={address.email} onChange={(v) => setAddress({ ...address, email: v })} />
                  <InputField label="Phone (optional)" type="tel" value={address.phone} onChange={(v) => setAddress({ ...address, phone: v })} />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="First Name" required value={address.firstName} onChange={(v) => setAddress({ ...address, firstName: v })} />
                    <InputField label="Last Name" required value={address.lastName} onChange={(v) => setAddress({ ...address, lastName: v })} />
                  </div>
                  <InputField label="Address Line 1" required value={address.address1} onChange={(v) => setAddress({ ...address, address1: v })} />
                  <InputField label="Address Line 2" value={address.address2} onChange={(v) => setAddress({ ...address, address2: v })} />
                  <div className="grid grid-cols-3 gap-3">
                    <InputField label="City" required value={address.city} onChange={(v) => setAddress({ ...address, city: v })} />
                    <InputField label="State" required value={address.state} onChange={(v) => setAddress({ ...address, state: v })} />
                    <InputField label="ZIP" required value={address.postalCode} onChange={(v) => setAddress({ ...address, postalCode: v })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Country</label>
                    <select value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                      <option value="US">United States</option><option value="CA">Canada</option><option value="GB">United Kingdom</option><option value="PL">Poland</option><option value="DE">Germany</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 font-medium shadow hover:bg-primary/90">
                Continue to Shipping <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              <h2 className="text-lg font-semibold mb-4">Shipping Method</h2>
              <div className="space-y-3">
                {SHIPPING_METHODS.map((method) => (
                  <label key={method.id} className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${shippingMethod === method.id ? "border-accent bg-accent/5" : "hover:bg-muted"}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" value={method.id} checked={shippingMethod === method.id} onChange={(e) => setShippingMethod(e.target.value)} className="accent-accent" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{method.price === 0 ? "Free" : `$${method.price.toFixed(2)}`}</span>
                  </label>
                ))}
              </div>
              {intentError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {intentError}
                </div>
              )}
              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="h-10 rounded-lg border px-6 text-sm font-medium hover:bg-muted">Back</button>
                <button type="submit" disabled={intentLoading} className="flex h-10 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 font-medium shadow hover:bg-primary/90 disabled:opacity-50">
                  {intentLoading ? "Preparing payment..." : <>{`Continue to Payment`} <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </form>
          )}

          {step === 3 && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                total={total}
                onBack={() => setStep(2)}
                onSuccess={() => setOrderConfirmed(true)}
              />
            </Elements>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6 lg:sticky lg:top-24">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                  <span className="tabular-nums">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="tabular-nums">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="tabular-nums">${tax.toFixed(2)}</span></div>
              <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span className="tabular-nums">${total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({ total, onBack, onSuccess }: {
  total: number;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const clearCart = useCartStore((s) => s.clearCart);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setPaymentError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setPaymentError(error.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    clearCart();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Payment</h2>
      <div className="rounded-lg border p-4 space-y-4">
        <PaymentElement />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Lock className="h-3 w-3" /> Secured by Stripe
        </p>
      </div>
      {paymentError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {paymentError}
        </div>
      )}
      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="h-10 rounded-lg border px-6 text-sm font-medium hover:bg-muted">Back</button>
        <button type="submit" disabled={submitting || !stripe} className="flex h-12 items-center gap-2 rounded-lg bg-primary text-primary-foreground px-8 font-semibold shadow hover:bg-primary/90 disabled:opacity-50">
          {submitting ? "Processing..." : `Place Order $${total.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

function InputField({ label, type = "text", required = false, placeholder, value, onChange }: {
  label: string; type?: string; required?: boolean; placeholder?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <input type={type} required={required} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
    </div>
  );
}
