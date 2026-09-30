"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import ProductCard from "../../../components/storefront/ProductCard";
import {
  Search,
  SlidersHorizontal,
  Loader2,
  X,
  DollarSign,
} from "lucide-react";

export default function StorefrontProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states synced with URL query parameters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || "",
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [featured, setFeatured] = useState(
    searchParams.get("featured") === "true",
  );
  const [hot, setHot] = useState(searchParams.get("hot") === "true");

  // New Price Range States
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  useEffect(() => {
    axios.get("/api/categories?activeOnly=true").then((res) => {
      if (res.data.success) setCategories(res.data.data.flat);
    });
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/products", {
        params: {
          search: search || undefined,
          categoryId: categoryId || undefined,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sort,
          featured: featured ? "true" : undefined,
          hot: hot ? "true" : undefined,
          limit: 40,
        },
      });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryId, sort, featured, hot]);

  const resetFilters = () => {
    setSearch("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setFeatured(false);
    setHot(false);
    router.push("/products");
    // Manually trigger fetch to refresh state immediately after reset
    setTimeout(() => fetchProducts(), 50);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900 uppercase tracking-wider">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold transition"
              >
                Reset All
              </button>
            </div>

            {/* Keyword Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchProducts();
              }}
              className="space-y-2"
            >
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Keyword / SKU
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. iPhone 17..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </form>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* New: Price Range Filter */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Price Range (Rs)</span>
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchProducts();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition text-center"
                />
                <span className="text-slate-300 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition text-center"
                />
                <button
                  type="submit"
                  className="px-3 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-md transition"
                >
                  Go
                </button>
              </form>
            </div>

            {/* Special Collection Toggles */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Special Collections
              </label>

              <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 group-hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={hot}
                    onChange={(e) => setHot(e.target.checked)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  {hot && <div className="w-3 h-3 bg-rose-500 rounded-sm" />}
                </div>
                <span>Hot Trending Products</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-slate-300 group-hover:border-blue-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="absolute opacity-0 w-full h-full cursor-pointer"
                  />
                  {featured && (
                    <div className="w-3 h-3 bg-blue-600 rounded-sm" />
                  )}
                </div>
                <span>Featured Catalogs Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <div className="flex-1 space-y-6">
          {/* Top Sort & Results Count Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <p className="text-xs font-medium text-slate-600">
              Showing{" "}
              <strong className="text-slate-900 text-sm">
                {products.length}
              </strong>{" "}
              results
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Sort by:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="hot">Hot Score (Popularity)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <span className="text-sm font-semibold tracking-wide">
                Searching catalog...
              </span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white py-24 px-6 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-lg font-black text-slate-800">
                No matching products found
              </p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Try clearing your search filters, adjusting the price range, or
                exploring another category.
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-6 py-3 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition"
              >
                <X className="w-4 h-4" /> Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
