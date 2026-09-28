import prisma from "../lib/prisma";
import Link from "next/link";
import StorefrontNavbar from "../components/storefront/StorefrontNavbar";
import CartDrawer from "../components/storefront/CartDrawer";
import ProductCard from "../components/storefront/ProductCard";
import {
  Sparkles,
  Flame,
  Star,
  ArrowRight,
  Truck,
  ShieldCheck,
  Zap,
  FolderTree,
  MessageSquareQuote,
} from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Converts Prisma Decimal & Date objects into plain JavaScript primitives
 * so Next.js 16 Server Components can safely pass them to Client Components.
 */
function serializeProduct(p: any) {
  return {
    ...p,
    basePrice: Number(p.basePrice),
    createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    variants:
      p.variants?.map((v: any) => ({
        ...v,
        price: Number(v.price),
        costPrice: v.costPrice !== null ? Number(v.costPrice) : null,
      })) || [],
  };
}

export default async function HomePage() {
  const [
    rootCategories,
    categories,
    rawFeaturedProducts,
    rawHotProducts,
    rawNewArrivals,
    recentReviews,
  ] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      take: 6,
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isFeatured: true },
      include: { category: true, variants: true, images: true },
      take: 4,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({
      where: { isHot: true },
      include: { category: true, variants: true, images: true },
      take: 4,
      orderBy: { hotScore: "desc" },
    }),
    prisma.product.findMany({
      include: { category: true, variants: true, images: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { name: true } },
        product: { select: { name: true, slug: true } },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const featuredProducts = rawFeaturedProducts.map(serializeProduct);
  const hotProducts = rawHotProducts.map(serializeProduct);
  const newArrivals = rawNewArrivals.map(serializeProduct);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation & Slide-over Cart Drawer */}
      <StorefrontNavbar categories={rootCategories} />
      <CartDrawer />

      <main className="flex-1 space-y-16 pb-12">
        {/* 1. Hero / Banner Section */}
        <section className="relative bg-slate-950 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI-Curated Flagship Storefront</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Next-Gen Gear.{" "}
                <span className="text-blue-500">Intelligent</span> Shopping.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Discover real-time trending products, multi-variant
                configurations, and verified availability backed by our live
                MySQL catalog.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 transition"
                >
                  <span>Explore Full Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/products?hot=true"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition"
                >
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>View Hot Products</span>
                </Link>
              </div>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 w-full lg:w-80">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Live Stock Sync
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time variant availability
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Verified Authentic
                  </h3>
                  <p className="text-xs text-slate-400">
                    100% official store warranty
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Fast Dispatch
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tracked doorstep delivery
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Dynamic Categories Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-black text-slate-900">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Browse All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categoryId=${cat.id}`}
                className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition flex flex-col justify-between"
              >
                <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600">
                  {cat.name}
                </span>
                <span className="text-xs text-slate-400 mt-2">
                  {cat._count.products} Products
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Hot & Trending Products Section */}
        {hotProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-rose-600 fill-current" />
                  <h2 className="text-xl font-black text-slate-900">
                    Hot & Trending Now
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-velocity items ranked by our AI Hot Score engine
                </p>
              </div>
              <Link
                href="/products?hot=true"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                View All Hot Items →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 4. Featured Products Section */}
        {featuredProducts.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-current" />
                <h2 className="text-xl font-black text-slate-900">
                  Featured Selections
                </h2>
              </div>
              <Link
                href="/products?featured=true"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                See All Featured →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Promotional Coupon Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200">
                Limited Time Promotion
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">
                Take 15% Off Your First Order
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                Use promo code{" "}
                <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                  WELCOME15
                </span>{" "}
                at checkout on orders over $100, or{" "}
                <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                  TECH50
                </span>{" "}
                for $50 off orders above $500.
              </p>
            </div>
            <Link
              href="/products"
              className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm hover:bg-blue-50 transition shrink-0 shadow-md"
            >
              Claim Offer Now
            </Link>
          </div>
        </section>

        {/* 6. New Arrivals / Latest Catalog */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Latest Arrivals
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Freshly added products directly from our MySQL catalog
              </p>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Explore Catalog →
            </Link>
          </div>

          {newArrivals.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <p className="text-base font-bold text-slate-800">
                No products published yet
              </p>
              <p className="text-xs text-slate-500">
                Run{" "}
                <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                  npx prisma db seed
                </code>{" "}
                or head over to{" "}
                <Link
                  href="/admin/products"
                  className="text-blue-600 underline"
                >
                  /admin/products
                </Link>{" "}
                to add your first product!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* 7. Verified Customer Reviews */}
        {recentReviews.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquareQuote className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-black text-slate-900">
                Verified Customer Reviews
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      {rev.user.name}
                    </span>
                    <Link
                      href={`/products/${rev.product.slug}`}
                      className="text-blue-600 hover:underline font-medium truncate max-w-[160px]"
                    >
                      {rev.product.name}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 8. Storefront Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-black text-lg text-white">
              <span className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center text-xs">
                AI
              </span>
              <span>COMMERCE</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Next-generation intelligent e-commerce platform powered by
              real-time MySQL inventory and AI business intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">
              Catalog
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products" className="hover:text-white">
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?featured=true"
                  className="hover:text-white"
                >
                  Featured Releases
                </Link>
              </li>
              <li>
                <Link href="/products?hot=true" className="hover:text-white">
                  Hot Trending Items
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">
              Quick Access
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-white">
                  Customer Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-white">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">
              Newsletter
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Subscribe for exclusive drops and AI-curated deals.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              />
              <button className="px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500">
                Join
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
