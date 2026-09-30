"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Boxes,
  Search,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  PlusCircle,
  Download,
  SlidersHorizontal,
  Loader2,
  PackageCheck,
  DollarSign,
  X,
  Check,
  Image as ImageIcon,
} from "lucide-react";

export default function AdminInventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalSkus: 0,
    totalUnitsInStock: 0,
    totalReservedUnits: 0,
    totalSoldUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Stock Adjustment Modal State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<
    "ADD" | "SET" | "SUBTRACT"
  >("ADD");
  const [quantity, setQuantity] = useState<number>(10);
  const [lowStockAlert, setLowStockAlert] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/inventory", {
        params: {
          search: search || undefined,
          status: statusFilter,
        },
      });
      if (res.data.success) {
        setItems(res.data.data.items);
        setSummary(res.data.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter]);

  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setAdjustmentType("ADD");
    setQuantity(15);
    setLowStockAlert(item.lowStockAlert);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);

    try {
      await axios.put("/api/inventory", {
        variantId: selectedItem.id,
        adjustmentType,
        quantity,
        lowStockAlert,
      });
      setSelectedItem(null);
      await fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update inventory.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickRestock = async (item: any, addQty: number) => {
    try {
      await axios.put("/api/inventory", {
        variantId: item.id,
        adjustmentType: "ADD",
        quantity: addQty,
      });
      await fetchInventory();
    } catch (err) {
      alert("Quick restock failed.");
    }
  };

  const exportToCSV = () => {
    if (items.length === 0) return;
    const headers = [
      "SKU",
      "Product Name",
      "Variant",
      "Category",
      "Current Stock",
      "Reserved",
      "Sold",
      "Returned",
      "Low Stock Threshold",
      "Status",
      "Unit Price (Rs)",
      "Total Retail Value (Rs)",
    ];

    const rows = items.map((i) => [
      i.sku,
      `"${i.productName.replace(/"/g, '""')}"`,
      `"${i.variantName.replace(/"/g, '""')}"`,
      `"${i.categoryName}"`,
      i.currentStock,
      i.reservedStock,
      i.soldQuantity,
      i.returnedQuantity,
      i.lowStockAlert,
      i.stockStatus,
      i.price.toFixed(2),
      i.stockRetailValue.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-blue-500" />
            <span>Inventory & Stock Control Center</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor real-time SKU stock levels, reserved order quantities,
            low-stock alerts, and restock operations.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Export Inventory CSV</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Available Units in Stock</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.totalUnitsInStock.toLocaleString()} units
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {summary.totalSkus} active SKUs ({summary.totalReservedUnits}{" "}
            reserved)
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Retail Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            Rs
            {summary.totalInventoryValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.totalSoldUnits} units fulfilled to date
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-amber-500/20">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>Low-Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.lowStockCount} SKUs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            At or below minimum threshold
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-rose-500/20">
          <div className="flex items-center justify-between text-xs text-rose-400">
            <span>Out of Stock SKUs</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.outOfStockCount} SKUs
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Requires immediate replenishment
          </div>
        </div>
      </div>

      {/* Search & Status Filter Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchInventory();
          }}
          className="flex gap-2 flex-1 max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by SKU, product name, or variant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All SKUs" },
            { id: "LOW_STOCK", label: `Low Stock (${summary.lowStockCount})` },
            {
              id: "OUT_OF_STOCK",
              label: `Out of Stock (${summary.outOfStockCount})`,
            },
            { id: "HEALTHY", label: "Healthy Stock" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="text-sm">Loading real-time SKU inventory...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <PackageCheck className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">
              No matching inventory variants found
            </p>
            <p className="text-xs text-slate-500">
              Try switching the status tab or clearing your search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="py-3.5 px-4">Product & Variant</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4 text-center">Available</th>
                  <th className="py-3.5 px-4 text-center">Reserved</th>
                  <th className="py-3.5 px-4 text-center">Sold</th>
                  <th className="py-3.5 px-4 text-center">Alert Threshold</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">
                    Quick Restock / Adjust
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-900/40 transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {item.productName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {item.variantName} •{" "}
                            <span className="text-slate-500">
                              {item.categoryName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-blue-400">
                      {item.sku}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-base font-extrabold ${
                          item.stockStatus === "OUT_OF_STOCK"
                            ? "text-rose-400"
                            : item.stockStatus === "LOW_STOCK"
                              ? "text-amber-400"
                              : "text-white"
                        }`}
                      >
                        {item.currentStock}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs text-slate-300">
                      {item.reservedStock}
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-emerald-400">
                      {item.soldQuantity}
                    </td>

                    <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                      ≤ {item.lowStockAlert} units
                    </td>

                    <td className="py-3.5 px-4">
                      {item.stockStatus === "OUT_OF_STOCK" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" /> Out of Stock
                        </span>
                      )}
                      {item.stockStatus === "LOW_STOCK" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                        </span>
                      )}
                      {item.stockStatus === "HEALTHY" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickRestock(item, 10)}
                          title="Instant +10 Restock"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Adjust SKU Inventory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedItem.productName} — {selectedItem.variantName} (
                  {selectedItem.sku})
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Stock in MySQL:</span>
                <span className="text-base font-extrabold text-white">
                  {selectedItem.currentStock} units
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Operation Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ADD", label: "+ Add Stock" },
                    { id: "SUBTRACT", label: "- Deduct / Damaged" },
                    { id: "SET", label: "= Set Exact" },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setAdjustmentType(op.id as any)}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold border transition ${
                        adjustmentType === op.id
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Resulting Stock:{" "}
                  <strong className="text-emerald-400">
                    {adjustmentType === "ADD"
                      ? selectedItem.currentStock + quantity
                      : adjustmentType === "SUBTRACT"
                        ? Math.max(0, selectedItem.currentStock - quantity)
                        : quantity}{" "}
                    units
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Low-Stock Alert Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  value={lowStockAlert}
                  onChange={(e) =>
                    setLowStockAlert(
                      Math.max(0, parseInt(e.target.value, 10) || 0),
                    )
                  }
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
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
                  <span>Save Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
