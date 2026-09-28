"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Settings,
  Store,
  CreditCard,
  Sparkles,
  Globe,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    axios
      .get("/api/settings")
      .then((res) => {
        if (res.data.success) setFormData(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedToast(false);

    try {
      const res = await axios.put("/api/settings", formData);
      if (res.data.success) {
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3500);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-blue-500" />
            <span>Platform Configuration & Settings</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure general store identity, tax & shipping rules, payment
            gateways, and AI provider models.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedToast ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{savedToast ? "Settings Saved!" : "Save All Changes"}</span>
        </button>
      </div>

      {/* 1. General Store Identity */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
          <Store className="w-4 h-4" />
          <span>1. General Store Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Store Name
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) =>
                setFormData({ ...formData, storeName: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Customer Support Email
            </label>
            <input
              type="email"
              value={formData.supportEmail}
              onChange={(e) =>
                setFormData({ ...formData, supportEmail: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            >
              <option value="USD">USD ($)</option>
              <option value="PKR">PKR (Rs)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Timezone
            </label>
            <input
              type="text"
              value={formData.timezone}
              onChange={(e) =>
                setFormData({ ...formData, timezone: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Tax, Shipping & Payment Gateways */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span>2. Tax, Shipping & Payment Gateways</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.taxRatePercent}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  taxRatePercent: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Standard Shipping Fee ($)
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.standardShippingFee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  standardShippingFee: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Free Shipping Threshold ($)
            </label>
            <input
              type="number"
              value={formData.freeShippingThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  freeShippingThreshold: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enableCod}
              onChange={(e) =>
                setFormData({ ...formData, enableCod: e.target.checked })
              }
              className="rounded text-blue-600"
            />
            <span>Enable Cash on Delivery (COD)</span>
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enableStripe}
              onChange={(e) =>
                setFormData({ ...formData, enableStripe: e.target.checked })
              }
              className="rounded text-blue-600"
            />
            <span>Enable Online Card / Stripe Checkout</span>
          </label>
        </div>
      </div>

      {/* 3. AI Intelligence Configuration */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>3. AI Engine & Model Provider</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              AI Provider Abstraction
            </label>
            <select
              value={formData.aiProvider}
              onChange={(e) =>
                setFormData({ ...formData, aiProvider: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            >
              <option value="OPENAI">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="COMPATIBLE">
                Compatible LLM / Grounded Engine
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Default Model Name
            </label>
            <input
              type="text"
              value={formData.aiModel}
              onChange={(e) =>
                setFormData({ ...formData, aiModel: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono text-white"
            />
          </div>
        </div>
      </div>

      {/* 4. Storewide SEO & Social Metadata */}
      <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>4. Global SEO & Social Media</span>
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Default Meta Title
            </label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) =>
                setFormData({ ...formData, seoTitle: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Default Meta Description
            </label>
            <textarea
              rows={2}
              value={formData.seoDescription}
              onChange={(e) =>
                setFormData({ ...formData, seoDescription: e.target.value })
              }
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
