"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "../../store/useCartStore";
import {
  ShoppingBag,
  Search,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export default function StorefrontNavbar({
  categories,
}: {
  categories: Array<{ id: string; name: string; slug: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { openCart, getItemCount } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setMobileMenuOpen(false);
  };

  const isAdmin =
    session?.user?.role &&
    ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      {/* Top Promo Banner */}
      <div className="bg-slate-950 text-slate-200 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>
          AI-Powered Storefront • Free Express Shipping on Orders Over $150
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl text-slate-900 tracking-tight"
          >
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm">
              AI
            </span>
            <span>COMMERCE</span>
          </Link>

          {/* Desktop Category Links */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link href="/products" className="hover:text-blue-600 transition">
              All Products
            </Link>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="hover:text-blue-600 transition"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, SKUs, specs..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 border border-transparent focus:bg-white focus:border-blue-500 text-sm text-slate-900 focus:outline-none transition"
          />
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
            >
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Panel</span>
            </Link>
          )}

          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-xs font-bold text-slate-800 hover:text-blue-600 transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>{session.user.name.split(" ")[0]}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Cart Trigger Button */}
          <button
            onClick={openCart}
            className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{mounted ? getItemCount() : 0}</span>
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 text-sm text-slate-900"
            />
          </form>

          <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1"
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-slate-600"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
