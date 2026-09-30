import Link from "next/link";
import prisma from "../../../lib/prisma";
import { LayoutGrid, ChevronRight, PackageOpen } from "lucide-react";

// Hamesha fresh data fetch karne ke liye
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  // Database se tamam categories aur unke products ka count fetch karein
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold uppercase tracking-widest">
          <LayoutGrid className="w-4 h-4" />
          <span>Store Catalog</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Explore Categories
        </h1>
        <p className="text-base text-slate-500 leading-relaxed">
          Browse our complete collection of products organized by category. Find
          exactly what you are looking for in our curated catalog.
        </p>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?categoryId=${cat.id}`}
              className="group p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden"
            >
              {/* Card Hover Background Glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors duration-300 shadow-sm">
                  <PackageOpen className="w-8 h-8" strokeWidth={1.5} />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-8 relative z-10">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-1.5">
                  {cat._count.products}{" "}
                  {cat._count.products === 1 ? "Product" : "Products"} available
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-24 bg-slate-50 rounded-3xl border border-slate-200">
          <PackageOpen
            className="w-16 h-16 text-slate-300 mx-auto mb-4"
            strokeWidth={1.5}
          />
          <h3 className="text-xl font-bold text-slate-700">
            No categories found
          </h3>
          <p className="text-sm text-slate-500 mt-2">
            Categories added from the admin panel will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
