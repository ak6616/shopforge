import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div>
      <section className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 text-white">
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Discover Premium Products
            </h1>
            <p className="text-lg text-zinc-300 mb-8">
              Curated collections of high-quality products at competitive prices.
              Free shipping on orders over $50.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-zinc-900 px-6 py-3 font-semibold hover:bg-zinc-100 transition-colors"
            >
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Shop by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {["Men", "Women", "Accessories"].map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${cat.toLowerCase()}`}
              className="group relative overflow-hidden rounded-lg border bg-card p-8 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{cat}</h3>
              <p className="text-sm text-muted-foreground">Explore collection</p>
              <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="font-semibold mb-1">Free Shipping</h3>
              <p className="text-sm text-muted-foreground">On orders over $50</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">30-Day Returns</h3>
              <p className="text-sm text-muted-foreground">Hassle-free returns</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Secure Checkout</h3>
              <p className="text-sm text-muted-foreground">Powered by Stripe</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
