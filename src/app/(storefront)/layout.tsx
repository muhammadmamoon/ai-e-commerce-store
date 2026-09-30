import prisma from "../../lib/prisma";
import StorefrontNavbar from "../../components/storefront/StorefrontNavbar";
import CartDrawer from "../../components/storefront/CartDrawer";
import NewsletterForm from "../../components/storefront/NewsletterForm";
import Link from "next/link";
import React from "react";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rootCategories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <StorefrontNavbar categories={rootCategories} />
      <CartDrawer />

      <main className="flex-1">{children}</main>

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
              real-time inventory and AI analytics.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">
              Catalog
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/products" className="hover:text-white transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?featured=true"
                  className="hover:text-white transition"
                >
                  Featured Releases
                </Link>
              </li>
              <li>
                <Link
                  href="/products?hot=true"
                  className="hover:text-white transition"
                >
                  Hot Trending Items
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase text-xs tracking-wider mb-3">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                {/* Yahan Order Tracking ko /account par point kar diya gaya hai */}
                <Link href="/account" className="hover:text-white transition">
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/warranty"
                  className="hover:text-white transition"
                >
                  Official Warranty Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/secure-payment"
                  className="hover:text-white transition"
                >
                  Secure Payment Guarantee
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
            <NewsletterForm />
          </div>
        </div>
      </footer>
    </div>
  );
}
