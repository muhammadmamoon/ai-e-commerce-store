"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Flame,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  ShoppingBag,
  PackageCheck,
  Loader2,
  CheckCircle2,
  Users,
  Eye,
  Smartphone,
  Monitor,
  MousePointerClick,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<any | null>(null);
  const [traffic, setTraffic] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingHot, setSyncingHot] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const fetchAnalytics = async (periodDays: number) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/analytics?days=${periodDays}`);
      if (res.data.success) {
        setData(res.data.data);
        setTraffic(res.data.data.traffic || null);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  const handleSyncHotProducts = async () => {
    setSyncingHot(true);
    setSyncSuccess(false);
    try {
      await axios.post("/api/analytics", { action: "SYNC_HOT" });
      setSyncSuccess(true);
      await fetchAnalytics(days);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (err) {
      alert("Failed to sync hot scores.");
    } finally {
      setSyncingHot(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-sm">
          Calculating real-time visitors, revenue, Hot Scores, and Demand
          Forecasts...
        </span>
      </div>
    );
  }

  const {
    summary,
    dailyRevenue,
    categoryAnalytics,
    hotProducts,
    demandForecasts,
  } = data;

  return (
    <div className="space-y-8">
      {/* Top Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <span>Visitor Traffic, Sales Analytics & Demand Forecasting</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily unique visitors, page views, conversion rates, revenue
            charts, and AI stock depletion.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {[
            { label: "Last 7 Days", val: 7 },
            { label: "Last 30 Days", val: 30 },
            { label: "Last 90 Days", val: 90 },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => setDays(opt.val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                days === opt.val
                  ? "bg-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Visitor & Traffic KPI Row */}
      {traffic && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-gradient-to-br from-blue-950/60 to-slate-950 border border-blue-500/30">
            <div className="flex items-center justify-between text-xs text-blue-300">
              <span>Today&apos;s Live Visitors</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {traffic.today.uniqueVisitors} Unique Users
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {traffic.today.pageViews} total page views today
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Visitors ({days} Days)</span>
              <Eye className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {traffic.periodSummary.totalUniqueVisitors.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Avg ~{traffic.periodSummary.avgDailyVisitors} visitors / day
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Page Views ({days}d)</span>
              <MousePointerClick className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">
              {traffic.periodSummary.totalPageViews.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Order conversion rate: {traffic.periodSummary.conversionRate}%
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Device Breakdown</span>
              <div className="flex items-center gap-1 text-amber-400">
                <Smartphone className="w-3.5 h-3.5" />
                <Monitor className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-bold text-white mt-2">
              {traffic.periodSummary.mobileSharePercent}% Mobile /{" "}
              {traffic.periodSummary.desktopSharePercent}% Desktop
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2 flex">
              <div
                style={{
                  width: `${traffic.periodSummary.mobileSharePercent}%`,
                }}
                className="bg-blue-500 h-full"
              />
              <div
                style={{
                  width: `${traffic.periodSummary.desktopSharePercent}%`,
                }}
                className="bg-emerald-500 h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Daily Website Visitors & Page Views Chart + Top Pages */}
      {traffic && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Daily Website Visitors & Page Views
              </h2>
              <p className="text-xs text-slate-400">
                Day-by-day breakdown of unique users vs. total pages viewed
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={traffic.dailyTraffic}>
                  <defs>
                    <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#8b5cf6"
                        stopOpacity={0.45}
                      />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090d16",
                      borderColor: "#1e293b",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Total Page Views"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#pvGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueVisitors"
                    name="Unique Visitors"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#visGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Visited Storefront Pages */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Most Visited Pages
              </h2>
              <p className="text-xs text-slate-400">
                Top storefront routes ranked by customer traffic
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {traffic.topPages.map((pg: any, idx: number) => (
                <div
                  key={pg.path}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-slate-200 truncate">
                      {pg.path}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400 shrink-0 ml-2">
                    {pg.views.toLocaleString()} views
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sales Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Period Revenue ({days}d)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            $
            {summary.totalRevenue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Orders ({days}d)</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.totalOrders}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Units Sold ({days}d)</span>
            <PackageCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.totalUnitsSold}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Order Value</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            ${summary.averageOrderValue.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Revenue Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Daily Revenue Trajectory ($)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#090d16",
                    borderColor: "#1e293b",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Revenue BarChart */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Revenue by Category
          </h2>
          {categoryAnalytics.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-500">
              No category revenue data for this period yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryAnalytics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#090d16",
                      borderColor: "#1e293b",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Hot Product Detection Engine Section */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500 fill-current" />
              <span>Intelligent Hot Product Detection Engine</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Scored 0–100 based on 7-day sales velocity, 30-day volume,
              wishlist activity, and ratings.
            </p>
          </div>

          <button
            onClick={handleSyncHotProducts}
            disabled={syncingHot}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition disabled:opacity-50"
          >
            {syncingHot ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : syncSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>
              {syncSuccess
                ? "Synced to Storefront!"
                : "Sync Hot Scores to Database"}
            </span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Hot Score</th>
                <th className="py-3.5 px-4">30d Sold</th>
                <th className="py-3.5 px-4">30d Revenue</th>
                <th className="py-3.5 px-4">Classification Reasons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {hotProducts.map((hp: any) => (
                <tr key={hp.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{hp.name}</div>
                    <div className="text-xs text-slate-500">
                      {hp.categoryName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        hp.hotScore >= 50
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {hp.hotScore >= 50 && (
                        <Flame className="w-3.5 h-3.5 fill-current" />
                      )}
                      {hp.hotScore} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    {hp.unitsSold30d} units
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-400">
                    ${hp.revenue30d.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {hp.reasons.map((r: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Demand Forecasting & Depletion Table */}
      <div className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>AI Demand Forecasting & Stock Depletion Estimates</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Forecasts are statistical estimates calculated from weighted 7-day
            and 30-day sales velocity.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Avg Daily Sales</th>
                <th className="py-3.5 px-4">Est. Days Remaining</th>
                <th className="py-3.5 px-4">Forecast (7d / 30d)</th>
                <th className="py-3.5 px-4">AI Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {demandForecasts.map((df: any) => (
                <tr key={df.productId} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">
                      {df.productName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate max-w-[160px]">
                      {df.skuList}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    {df.currentStock} units
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {df.avgDailySales} / day
                  </td>
                  <td className="py-3.5 px-4">
                    {df.estimatedDaysRemaining !== null ? (
                      <span
                        className={`font-bold ${
                          df.estimatedDaysRemaining <= 7
                            ? "text-rose-400"
                            : df.estimatedDaysRemaining <= 14
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }`}
                      >
                        ~{df.estimatedDaysRemaining} days
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">
                        N/A (0 velocity)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-300">
                    Next 7d: <strong>{df.forecastNext7Days}u</strong> • Next
                    30d: <strong>{df.forecastNext30Days}u</strong>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-300 max-w-md">
                    {df.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
