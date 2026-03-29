"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart";

export function Navbar() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const itemCount = useCartStore((s) => s.getItemCount());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        {/* Mobile menu button */}
        <button
          className="mr-2 lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2 font-bold text-xl">
          <span>ShopForge</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
          <Link href="/products" className="transition-colors hover:text-accent">
            Products
          </Link>
          <Link href="/admin/analytics" className="transition-colors hover:text-accent">
            Admin
          </Link>
        </nav>

        {/* Search bar - desktop */}
        <div className="hidden lg:flex flex-1 mx-8">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </form>
        </div>

        <div className="flex items-center space-x-4 ml-auto">
          {/* Mobile search toggle */}
          <button
            className="lg:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <Link href="#" className="hidden sm:block">
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      {searchOpen && (
        <div className="border-t px-4 py-2 lg:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-9 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t px-4 py-4 lg:hidden">
          <nav className="flex flex-col space-y-3">
            <Link href="/products" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Products
            </Link>
            <Link href="/admin/analytics" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
