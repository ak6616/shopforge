"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, Minus, Plus, Heart, Check, Truck, RotateCcw } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { getProduct, type Product } from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");

  useEffect(() => {
    getProduct(slug).then((p) => {
      setProduct(p);
      if (p?.variants?.[0]) {
        const opts = p.variants[0].options;
        if (opts?.color) setSelectedColor(opts.color);
        if (opts?.size) setSelectedSize(opts.size);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-muted rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/products" className="text-accent hover:underline">Back to Products</Link>
      </div>
    );
  }

  const images = product.images || [];
  const colors = Array.from(new Set(product.variants?.map((v) => v.options?.color).filter(Boolean) || [])) as string[];
  const sizes = Array.from(new Set(product.variants?.map((v) => v.options?.size).filter(Boolean) || [])) as string[];

  const selectedVariant = product.variants?.find((v) => {
    const matchColor = !selectedColor || v.options?.color === selectedColor;
    const matchSize = !selectedSize || v.options?.size === selectedSize;
    return matchColor && matchSize;
  }) || product.variants?.[0];

  const currentPrice = selectedVariant?.price || product.price;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : product.inStock;
  const stockCount = selectedVariant?.stock;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || product.id,
      slug: product.slug,
      name: product.name,
      variant: [selectedColor, selectedSize].filter(Boolean).join(" / ") || "Default",
      price: currentPrice,
      quantity,
      image: images[0]?.url || "",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-foreground">Products</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-square relative rounded-lg overflow-hidden bg-muted mb-4">
            {images[selectedImage]?.url ? (
              <Image src={images[selectedImage].url} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`relative w-20 h-20 rounded-md overflow-hidden shrink-0 border-2 ${i === selectedImage ? "border-accent" : "border-transparent"}`}>
                  <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.name}</h1>
          {product.rating != null && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating!) ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.reviewCount || 0} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-bold">${currentPrice.toFixed(2)}</span>
            {product.compareAtPrice && product.compareAtPrice > currentPrice && (
              <span className="text-lg text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</span>
            )}
          </div>

          <div className="border-t pt-6 space-y-6">
            {colors.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Color: <span className="text-muted-foreground">{selectedColor}</span></label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button key={color} onClick={() => setSelectedColor(color)} className={`px-4 py-2 rounded-md border text-sm ${selectedColor === color ? "border-accent bg-accent/10 text-accent" : "hover:bg-muted"}`}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Size</label>
                <div className="flex gap-2">
                  {sizes.map((size) => (
                    <button key={size} onClick={() => setSelectedSize(size)} className={`px-4 py-2 rounded-md border text-sm min-w-[48px] ${selectedSize === size ? "border-accent bg-accent/10 text-accent" : "hover:bg-muted"}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center border rounded-md w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-muted"><Minus className="h-4 w-4" /></button>
                <span className="px-4 py-2 text-sm font-medium min-w-[48px] text-center tabular-nums">{quantity}</span>
                <button onClick={() => setQuantity(stockCount != null ? Math.min(quantity + 1, stockCount) : quantity + 1)} disabled={stockCount != null && quantity >= stockCount} className="p-2 hover:bg-muted disabled:opacity-50"><Plus className="h-4 w-4" /></button>
              </div>
            </div>

            <button onClick={handleAddToCart} disabled={!inStock} className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-colors disabled:opacity-50">
              {inStock ? "Add to Cart" : "Out of Stock"}
            </button>

            <button className="w-full h-10 rounded-lg border text-sm font-medium hover:bg-muted flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" /> Add to Wishlist
            </button>

            {inStock && stockCount != null && stockCount <= 5 && (
              <p className="text-sm text-yellow-600 font-medium">Only {stockCount} left in stock</p>
            )}

            <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><Truck className="h-4 w-4" />Free shipping over $50</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /><RotateCcw className="h-4 w-4" />30-day returns</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t pt-8">
        <div className="flex border-b">
          {(["description", "specs", "reviews"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="py-6">
          {activeTab === "description" && <div className="prose prose-sm max-w-none text-muted-foreground"><p>{product.description || "No description available."}</p></div>}
          {activeTab === "specs" && (
            product.specs ? (
              <table className="w-full text-sm"><tbody>
                {Object.entries(product.specs as Record<string, string>).map(([key, val]) => (
                  <tr key={key} className="border-b"><td className="py-2 font-medium pr-4 capitalize">{key}</td><td className="py-2 text-muted-foreground">{val}</td></tr>
                ))}
              </tbody></table>
            ) : <p className="text-sm text-muted-foreground">No specifications available.</p>
          )}
          {activeTab === "reviews" && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}
