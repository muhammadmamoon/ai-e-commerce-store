import prisma from "../../../lib/prisma";
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Aggregate real-time database metrics
  const [totalUsers, totalProducts, totalOrders, revenueData, lowStockCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { isPaid: true },
      }),
      prisma.productVariant.count({
        where: { stock: { lte: 10 } },
      }),
    ]);

  const totalRevenue = revenueData._sum.total
    ? Number(revenueData._sum.total)
    : 0;

  const cards = [
    {
      title: "Gross Paid Revenue",
      value: `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      title: "Total Orders",
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Customers & Staff",
      value: totalUsers.toString(),
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount.toString(),
      icon: AlertTriangle,
      color: lowStockCount > 0 ? "text-amber-400" : "text-slate-400",
      bg: lowStockCount > 0 ? "bg-amber-500/10" : "bg-slate-800/40",
      border: lowStockCount > 0 ? "border-amber-500/20" : "border-slate-800",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner with AI Quick Assistant hook */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-slate-900 border border-blue-500/20 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Executive Dashboard
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Store operations overview backed by live MySQL transactions.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>AI Intelligence Engine Active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`p-5 rounded-xl bg-slate-950/70 border ${card.border} backdrop-blur-sm shadow-sm flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">
                  {card.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Catalog & Inventory Quick Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-slate-950/70 border border-slate-800">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase text-slate-400 mb-4">
            Catalog Overview
          </h3>
          <div className="flex items-center justify-between py-3 border-b border-slate-800/80 text-sm">
            <span className="text-slate-400">Total Catalog Items</span>
            <span className="font-semibold text-white">
              {totalProducts} Products
            </span>
          </div>
          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-slate-400">Variant Inventory Status</span>
            <span className="font-semibold text-emerald-400">Synchronized</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase text-slate-400 mb-2">
              Next Action
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create product categories and establish your product hierarchy to
              enable storefront navigation and search indexing.
            </p>
          </div>
          <div className="mt-6">
            <a
              href="/admin/categories"
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              <span>Manage Categories</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
