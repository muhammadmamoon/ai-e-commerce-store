"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  MessageSquare,
  Star,
  Sparkles,
  CheckCircle2,
  EyeOff,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalReviews: 0,
    avgRating: 0,
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // AI Sentiment State
  const [aiInsights, setAiInsights] = useState<any | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [revRes, prodRes] = await Promise.all([
        axios.get("/api/reviews", {
          params: {
            productId: selectedProductId || undefined,
            status: statusFilter,
          },
        }),
        axios.get("/api/products?limit=50"),
      ]);

      if (revRes.data.success) {
        setReviews(revRes.data.data.reviews);
        setSummary(revRes.data.data.summary);
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedProductId, statusFilter]);

  const handleRunAiSentiment = async () => {
    setAnalyzingAi(true);
    try {
      const res = await axios.post("/api/reviews", {
        productId: selectedProductId || undefined,
      });
      if (res.data.success) {
        setAiInsights(res.data.data);
      }
    } catch (err) {
      alert("Failed to run AI review analysis.");
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleToggleApprove = async (rev: any) => {
    try {
      await axios.put("/api/reviews", {
        reviewId: rev.id,
        isApproved: !rev.isApproved,
      });
      await fetchReviews();
    } catch (err) {
      alert("Failed to update review status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer review permanently?")) return;
    try {
      await axios.delete(`/api/reviews?id=${id}`);
      await fetchReviews();
    } catch (err) {
      alert("Failed to delete review.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            <span>Customer Reviews & AI Sentiment Insights</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Moderate buyer ratings and extract positive features or common
            complaints with AI.
          </p>
        </div>

        <button
          onClick={handleRunAiSentiment}
          disabled={analyzingAi}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
        >
          {analyzingAi ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Generate AI Review Insights</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-xs text-slate-400">Average Store Rating</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold text-white">
              {summary.avgRating}
            </span>
            <Star className="w-5 h-5 text-amber-400 fill-current" />
            <span className="text-xs text-slate-500">
              ({summary.totalReviews} reviews)
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-emerald-500/20">
          <span className="text-xs text-emerald-400">
            Positive Sentiment (4-5 ★)
          </span>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.positiveCount}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-amber-500/20">
          <span className="text-xs text-amber-400">
            Neutral Sentiment (3 ★)
          </span>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.neutralCount}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-rose-500/20">
          <span className="text-xs text-rose-400">
            Negative Sentiment (1-2 ★)
          </span>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.negativeCount}
          </div>
        </div>
      </div>

      {/* AI Review Insights Panel */}
      {aiInsights && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-950 border border-blue-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span>AI Review Sentiment Summary</span>
            </h2>
            <span className="text-[11px] text-blue-300 font-mono">
              Grounded in {summary.totalReviews} verified reviews
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase">
                <ThumbsUp className="w-4 h-4" />
                <span>Praised Features (Positive)</span>
              </div>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                {aiInsights.positiveFeatures?.map((f: string, i: number) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/20 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 uppercase">
                <ThumbsDown className="w-4 h-4" />
                <span>Common Complaints / Friction</span>
              </div>
              <ul className="space-y-1 text-slate-300 list-disc list-inside">
                {aiInsights.negativeComplaints?.map((c: string, i: number) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
            <strong className="text-white">AI Suggested Action: </strong>
            {aiInsights.actionableRecommendation}
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
        >
          <option value="">All Products (Storewide)</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          {[
            { id: "ALL", label: "All Reviews" },
            { id: "APPROVED", label: "Published" },
            { id: "HIDDEN", label: "Hidden / Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="text-sm">Loading customer reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No reviews match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="py-3.5 px-4">Product & Reviewer</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Customer Comment</th>
                  <th className="py-3.5 px-4">AI Sentiment</th>
                  <th className="py-3.5 px-4 text-center">Visibility</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {r.product?.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        by {r.user?.name}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: r.rating }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="w-3.5 h-3.5 fill-current"
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-md">
                      &ldquo;{r.comment}&rdquo;
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.sentiment === "POSITIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : r.sentiment === "NEUTRAL"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        }`}
                      >
                        {r.sentiment}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleApprove(r)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                          r.isApproved
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {r.isApproved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Hidden
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
