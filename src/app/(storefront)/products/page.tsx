"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingCart, ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { getProducts, getCategories, type Product, type Category } from "@/lib/api";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="animate-pulse"><div className="h-8 bg-muted rounded w-1/4 mb-6" /><div className="grid grid-cols-4 gap-6">{Array.from({length:8}).map((_,i)=><div key={i} className="aspect-square bg-muted rounded-lg" />)}</div></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const page = Number(searchParams.get("page") || "1");
  const sort = searchParams.get("sort") || "featured";
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      if (!("page" in updates)) params.set("page", "1");
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProducts({ page, sort, category, search, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined, limit: 12 }),
      getCategories(),
    ]).then(([prodData, cats]) => {
      setProducts(prodData.data);
      setTotalPages(prodData.totalPages);
      setCategories(cats);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, sort, category, search, minPrice, maxPrice]);

  const handleAddToCart = (product: Product) => {
    const variant = product.variants?.[0];
    addItem({
      productId: product.id,
      variantId: variant?.id || product.id,
      name: product.name,
      variant: variant?.name || "Default",
      price: variant?.price || product.price,
      quantity: 1,
      image: product.images?.[0]?.url || "",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Products</span>
      </nav>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0">
          <FilterPanel categories={categories} activeCategory={category} minPrice={minPrice} maxPrice={maxPrice} onUpdate={updateParams} />
        </aside>

        <div className="lg:hidden fixed bottom-4 left-4 z-40">
          <button onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>

        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-background p-6 shadow-xl overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg">Filters</h2>
                <button onClick={() => setFiltersOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <FilterPanel categories={categories} activeCategory={category} minPrice={minPrice} maxPrice={maxPrice} onUpdate={(u) => { updateParams(u); setFiltersOpen(false); }} />
            </div>
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {search && <>Results for &quot;{search}&quot; &middot; </>}
              Page {page} of {totalPages}
            </p>
            <select value={sort} onChange={(e) => updateParams({ sort: e.target.value, page: "1" })} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="best-rated">Best Rated</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No products found.</p>
              <Link href="/products" className="text-sm text-accent hover:underline mt-2 inline-block">Clear filters</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.id} className="group rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/products/${product.slug || product.id}`}>
                    <div className="aspect-square relative bg-muted">
                      {product.images?.[0]?.url ? (
                        <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No Image</div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${product.slug || product.id}`}>
                      <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-accent transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${product.price.toFixed(2)}</span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">${product.compareAtPrice.toFixed(2)}</span>
                        )}
                      </div>
                      <button onClick={() => handleAddToCart(product)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-muted" title="Add to cart">
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => updateParams({ page: String(page - 1) })} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => updateParams({ page: String(p) })} className={`rounded-md px-3 py-2 text-sm ${p === page ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => updateParams({ page: String(page + 1) })} disabled={page >= totalPages} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm disabled:opacity-50">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ categories, activeCategory, minPrice, maxPrice, onUpdate }: {
  categories: Category[];
  activeCategory: string;
  minPrice: string;
  maxPrice: string;
  onUpdate: (updates: Record<string, string>) => void;
}) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-sm">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" name="category" checked={!activeCategory} onChange={() => onUpdate({ category: "", page: "1" })} className="rounded" />
            All
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="category" checked={activeCategory === cat.slug || activeCategory === cat.id} onChange={() => onUpdate({ category: cat.slug || cat.id, page: "1" })} className="rounded" />
              {cat.name}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3 text-sm">Price Range</h3>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="$0" value={localMin} onChange={(e) => setLocalMin(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" />
          <span className="text-muted-foreground">-</span>
          <input type="number" placeholder="$500" value={localMax} onChange={(e) => setLocalMax(e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" />
        </div>
        <button onClick={() => onUpdate({ minPrice: localMin, maxPrice: localMax, page: "1" })} className="mt-2 w-full h-8 rounded-md border text-sm hover:bg-muted transition-colors">Apply</button>
      </div>
    </div>
  );
}
