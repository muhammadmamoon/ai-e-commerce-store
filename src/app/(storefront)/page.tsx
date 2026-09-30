import Link from "next/link";
import prisma from "../../lib/prisma";
import ProductCard from "../../components/storefront/ProductCard";
import {
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
  Truck,
  Zap,
  Star,
  TicketPercent,
  Rocket,
  Gift,
} from "lucide-react";

export const revalidate = 60;

export default async function StorefrontHomePage() {
  const [hotProductsRaw, featuredProductsRaw, recentReviews, activeCouponsRaw] =
    await Promise.all([
      prisma.product.findMany({
        where: { isHot: true },
        include: {
          category: true,
          variants: true,
          images: { orderBy: { isPrimary: "desc" } },
        },
        orderBy: { hotScore: "desc" },
        take: 4,
      }),
      prisma.product.findMany({
        include: {
          category: true,
          variants: true,
          images: { orderBy: { isPrimary: "desc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.review.findMany({
        where: { isApproved: true, rating: { gte: 4 } },
        include: {
          user: { select: { name: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      // MySQL se saare Active Coupons direct fetch karein
      prisma.coupon.findMany({
        where: { isActive: true },
        orderBy: { startDate: "desc" },
      }),
    ]);

  const serializeProduct = (p: any) => ({
    ...p,
    basePrice: Number(p.basePrice),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    variants: p.variants.map((v: any) => ({
      ...v,
      price: Number(v.price),
      costPrice: v.costPrice !== null ? Number(v.costPrice) : null,
    })),
  });

  const hotProducts = hotProductsRaw.map(serializeProduct);
  const featuredProducts = featuredProductsRaw.map(serializeProduct);

  // Filter non-expired coupons
  const now = new Date();
  const activeCoupons = activeCouponsRaw
    .filter((c) => {
      const end = new Date(c.endDate);
      end.setHours(23, 59, 59, 999);
      return end >= now;
    })
    .map((c) => ({
      id: c.id,
      code: c.code,
      discountType: c.discountType,
      amount: Number(c.amount),
      minPurchase: c.minPurchase !== null ? Number(c.minPurchase) : null,
      endDate: c.endDate,
    }));

  // Dynamic Headline based on your first active coupon in Admin Panel
  const firstCoupon = activeCoupons[0];
  const dynamicBannerHeadline = firstCoupon
    ? firstCoupon.discountType === "PERCENTAGE"
      ? `Take ${firstCoupon.amount}% Off Your Order`
      : `Take $${firstCoupon.amount.toFixed(2)} Off Your Order`
    : "Exclusive Storewide Promotional Offers";

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner (Updated with Fail-proof Lucide Animated Icons) */}
      <section className="relative bg-slate-950 text-white overflow-hidden min-h-[80vh] flex items-center">
        {/* Background Subtle Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 w-full flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Side: Text Content */}
          <div className="max-w-2xl space-y-8 lg:w-1/2 z-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-blue-300 text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Next-Gen AI Curated Store</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1]">
              Flagship Tech. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Real-Time Intelligence.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              Experience instant variant stock verification, dynamic Hot Product
              rankings, and express delivery across our entire catalog.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/products"
                className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm inline-flex items-center gap-2 shadow-[0_0_30px_-5px_rgba(37,99,235,0.6)] hover:shadow-[0_0_40px_-5px_rgba(37,99,235,0.8)] hover:-translate-y-1 transition-all duration-300"
              >
                <span>Shop All Products</span>
                <ArrowRight className="w-4 h-4 animate-bounce-x" />
              </Link>
              {/* FIXED: Browse Categories -> Explore Catalog -> Points to /products */}
              <Link
                href="/products"
                className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white font-bold text-sm hover:-translate-y-1 transition-all duration-300"
              >
                Explore Catalog
              </Link>
            </div>
          </div>

          {/* Right Side: Attractive Floating Built-in Icons (Fail-proof) */}
          <div className="hidden lg:flex lg:w-1/2 relative justify-center items-center h-[500px]">
            {/* Center Glowing Orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/30 blur-[80px] rounded-full animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-indigo-500/30 blur-[80px] rounded-full" />

            {/* Main Glowing Rocket (Bouncing smoothly) */}
            <div className="relative z-10 animate-[bounce_4s_ease-in-out_infinite] bg-gradient-to-br from-blue-400 to-indigo-600 p-8 rounded-full shadow-[0_0_80px_rgba(59,130,246,0.6)]">
              <Rocket
                className="w-32 h-32 text-white drop-shadow-2xl"
                strokeWidth={1.5}
              />
            </div>

            {/* Secondary Floating Elements */}
            <div className="absolute top-10 right-16 animate-[bounce_5s_ease-in-out_infinite_0.5s] bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-xl">
              <Star
                className="w-12 h-12 text-amber-400 fill-amber-400/50 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                strokeWidth={1.5}
              />
            </div>

            <div className="absolute bottom-16 left-10 animate-[bounce_6s_ease-in-out_infinite_1s] bg-white/10 backdrop-blur-md p-5 rounded-full border border-white/20 shadow-xl">
              <Gift
                className="w-14 h-14 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Trust Badges */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-10 relative z-20">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xl shadow-slate-200/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Free Express Shipping
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Automatically applied on standard orders over Rs 3000
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xl shadow-slate-200/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Verified Live Inventory
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Every SKU variant is locked in real time at checkout
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xl shadow-slate-200/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                AI-Ranked Hot Sellers
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Trending items updated from real 30-day order velocity
              </p>
            </div>
          </div>
        </section>

        {/* Hot & Trending Products */}
        {hotProducts.length > 0 && (
          <section className="space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
                  <Flame className="w-4 h-4 fill-current animate-pulse" />
                  <span>High Velocity</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Trending Right Now
                </h2>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800 transition"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {hotProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 100% LIVE ADMIN COUPONS BANNER */}
        {activeCoupons.length > 0 && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 p-8 sm:p-12 text-white shadow-2xl hover:shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-shadow duration-500 group">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-700" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-blue-100 backdrop-blur-sm">
                  <TicketPercent className="w-4 h-4" />
                  <span>Limited Time Promotion</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                  {dynamicBannerHeadline}
                </h2>

                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                  {activeCoupons.map((c, idx) => {
                    const valStr =
                      c.discountType === "PERCENTAGE"
                        ? `${c.amount}% off`
                        : `Rs${c.amount.toFixed(2)} off`;
                    const minStr = c.minPurchase
                      ? `on orders over Rs${c.minPurchase.toFixed(2)}`
                      : "with no minimum order";

                    return (
                      <span key={c.id}>
                        {idx === 0 ? "Use promo code " : " or "}
                        <strong className="px-2.5 py-1 mx-1 rounded-lg bg-white/20 font-mono text-white border border-white/10 shadow-sm">
                          {c.code}
                        </strong>
                        for <strong className="text-white">{valStr}</strong>{" "}
                        {minStr}
                        {idx === activeCoupons.length - 1 ? "." : ","}
                      </span>
                    );
                  })}
                </p>

                {/* Badges for each active coupon */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {activeCoupons.map((c) => (
                    <div
                      key={c.id}
                      className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-sm flex items-center gap-3 backdrop-blur-md hover:bg-white/20 transition cursor-default"
                    >
                      <span className="font-mono font-black text-white tracking-wider">
                        {c.code}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-emerald-400/20 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                        {c.discountType === "PERCENTAGE"
                          ? `${c.amount}% OFF`
                          : `$${c.amount.toFixed(2)} OFF`}
                      </span>
                      {c.minPurchase && (
                        <span className="text-[11px] text-blue-200">
                          (Min: Rs{c.minPurchase.toFixed(2)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-950 font-black text-sm shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:scale-105 hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-300"
                >
                  <span>Claim Offer Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Latest Arrivals */}
        <section className="space-y-8">
          <div className="flex items-end justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Latest Arrivals
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Freshly added products directly from our MySQL catalog
              </p>
            </div>
            <Link
              href="/products"
              className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black uppercase tracking-wider transition hidden sm:inline-block"
            >
              Explore Catalog
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Customer Reviews Highlight */}
        {recentReviews.length > 0 && (
          <section className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Loved by Thousands
              </h2>
              <p className="text-sm text-slate-500">
                Real feedback from verified buyers across the globe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-8 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-lg shadow-slate-200/40 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-50 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      {rev.user?.name || "Verified Buyer"}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-4 h-4 fill-current drop-shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic relative z-10">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                  <Link
                    href={`/products/${rev.product?.slug}`}
                    className="inline-block text-xs font-bold text-blue-600 hover:text-blue-800 pt-2 relative z-10"
                  >
                    Purchased: {rev.product?.name} →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
