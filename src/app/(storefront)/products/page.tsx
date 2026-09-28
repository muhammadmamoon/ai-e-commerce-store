"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import ProductCard from "../../../components/storefront/ProductCard";
import { Search, SlidersHorizontal, Loader2, X } from "lucide-react";

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
    setSort("newest");
    setFeatured(false);
    setHot(false);
    router.push("/products");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs text-blue-600 hover:underline font-medium"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Keyword / SKU
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. iPhone 17..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            </form>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Special Collection Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hot}
                  onChange={(e) => setHot(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Hot Trending Products Only</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Featured Products Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Product Grid */}
        <div className="flex-1 space-y-6">
          {/* Top Sort & Results Count Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs font-medium text-slate-600">
              Showing{" "}
              <strong className="text-slate-900">{products.length}</strong>{" "}
              results
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="hot">Hot Score (Popularity)</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-sm">Searching catalog...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center space-y-3">
              <p className="text-base font-bold text-slate-800">
                No matching products found
              </p>
              <p className="text-xs text-slate-500">
                Try clearing your search filters or exploring another category.
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
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
