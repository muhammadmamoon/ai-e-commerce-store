"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  TicketPercent,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Check,
  Calendar,
} from "lucide-react";

interface CouponFormState {
  id?: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  amount: number;
  minPurchase: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  isActive: boolean;
}

const todayStr = new Date().toISOString().slice(0, 10);
const nextMonthDate = new Date();
nextMonthDate.setDate(nextMonthDate.getDate() + 30);
const nextMonthStr = nextMonthDate.toISOString().slice(0, 10);

const initialCouponForm: CouponFormState = {
  code: "",
  discountType: "PERCENTAGE",
  amount: 15,
  minPurchase: 100,
  startDate: todayStr,
  endDate: nextMonthStr,
  usageLimit: 100,
  isActive: true,
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CouponFormState>(initialCouponForm);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/coupons");
      if (res.data.success) {
        setCoupons(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreateModal = () => {
    setFormData(initialCouponForm);
    setIsEditing(false);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: any) => {
    setFormData({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType as "PERCENTAGE" | "FIXED",
      amount: Number(coupon.amount),
      minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : 0,
      startDate: new Date(coupon.startDate).toISOString().slice(0, 10),
      endDate: new Date(coupon.endDate).toISOString().slice(0, 10),
      usageLimit: coupon.usageLimit ? Number(coupon.usageLimit) : 0,
      isActive: Boolean(coupon.isActive),
    });
    setIsEditing(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (coupon: any) => {
    try {
      await axios.put(`/api/coupons/${coupon.id}`, {
        isActive: !coupon.isActive,
      });
      await fetchCoupons();
    } catch (err) {
      alert("Failed to update coupon status.");
    }
  };

  const handleDelete = async (coupon: any) => {
    if (!confirm(`Delete coupon "${coupon.code}" permanently?`)) return;
    try {
      await axios.delete(`/api/coupons/${coupon.id}`);
      await fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete coupon.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        ...formData,
        minPurchase: formData.minPurchase > 0 ? formData.minPurchase : null,
        usageLimit: formData.usageLimit > 0 ? formData.usageLimit : null,
      };

      if (isEditing && formData.id) {
        await axios.put(`/api/coupons/${formData.id}`, payload);
      } else {
        await axios.post("/api/coupons", payload);
      }

      setIsModalOpen(false);
      await fetchCoupons();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to save coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TicketPercent className="w-6 h-6 text-blue-500" />
            <span>Promotional Coupons & Discount Engine</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create percentage or fixed-amount discount codes, minimum order
            rules, and expiration windows.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-lg shadow-blue-600/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="text-sm">Loading promotional coupons...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <TicketPercent className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              No promotional coupons created yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="py-3.5 px-4">Promo Code</th>
                  <th className="py-3.5 px-4">Discount Value</th>
                  <th className="py-3.5 px-4">Min. Order</th>
                  <th className="py-3.5 px-4">Validity Period</th>
                  <th className="py-3.5 px-4 text-center">Usage Limit</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {coupons.map((coupon) => {
                  const isExpired = new Date(coupon.endDate) < new Date();
                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-slate-900/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 font-mono font-bold text-xs text-blue-400">
                          {coupon.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {coupon.discountType === "PERCENTAGE"
                          ? `${coupon.amount}% OFF`
                          : `$${coupon.amount.toFixed(2)} OFF`}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-300">
                        {coupon.minPurchase
                          ? `$${coupon.minPurchase.toFixed(2)}`
                          : "No minimum"}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>
                            {new Date(coupon.startDate).toLocaleDateString()} →{" "}
                            {new Date(coupon.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        {isExpired && (
                          <span className="text-[10px] text-rose-400 font-semibold">
                            Expired
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center text-xs text-slate-300">
                        {coupon.usageLimit
                          ? `${coupon.usageLimit} uses`
                          : "Unlimited"}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                            coupon.isActive && !isExpired
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {coupon.isActive && !isExpired ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Edit Coupon"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {isEditing
                  ? `Edit Coupon: ${formData.code}`
                  : "Create Promotional Coupon"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="SUMMER20"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-mono uppercase text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as "PERCENTAGE" | "FIXED",
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Dollar Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Discount Amount (
                    {formData.discountType === "PERCENTAGE" ? "%" : "$"}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Min. Order Subtotal ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minPurchase: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Usage Limit (0 for Unlimited)
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      usageLimit: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="couponActiveCheck"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                />
                <label
                  htmlFor="couponActiveCheck"
                  className="text-sm text-slate-300"
                >
                  Coupon active and redeemable at checkout
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isEditing ? "Update Coupon" : "Create Coupon"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
