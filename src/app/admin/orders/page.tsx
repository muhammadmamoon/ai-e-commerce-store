"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  ClipboardList,
  Search,
  Eye,
  Printer,
  Loader2,
  X,
  Package,
  MapPin,
  Phone,
  User,
  CheckCircle2,
} from "lucide-react";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
];

interface ParsedAddress {
  fullName?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  raw?: string;
}

/**
 * Safely parses the JSON shippingAddress string into clean structured fields
 */
function parseShippingAddress(shippingAddress: any): ParsedAddress {
  if (!shippingAddress) return {};
  if (typeof shippingAddress === "object") return shippingAddress;
  try {
    const parsed = JSON.parse(shippingAddress);
    return typeof parsed === "object" && parsed !== null
      ? parsed
      : { raw: String(shippingAddress) };
  } catch {
    return { raw: String(shippingAddress) };
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/orders", {
        params: { status: statusFilter !== "ALL" ? statusFilter : undefined },
      });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    setStatusToast(null);

    try {
      const res = await axios.put(`/api/orders/${selectedOrder.id}`, {
        status: newStatus,
        isPaid: newStatus === "DELIVERED" ? true : selectedOrder.isPaid,
      });

      if (res.data.success) {
        setSelectedOrder((prev: any) => ({
          ...prev,
          status: newStatus,
          isPaid: newStatus === "DELIVERED" ? true : prev.isPaid,
        }));
        setStatusToast(`Status updated to ${newStatus}`);
        await fetchOrders();
        setTimeout(() => setStatusToast(null), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PROCESSING":
      case "CONFIRMED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "CANCELLED":
      case "REFUNDED":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.email?.toLowerCase().includes(q)
    );
  });

  const addr = selectedOrder
    ? parseShippingAddress(selectedOrder.shippingAddress)
    : {};

  return (
    <div className="space-y-6">
      {/* Global Print Stylesheet so only the Invoice Modal prints cleanly */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-order-invoice,
          #printable-order-invoice * {
            visibility: visible;
          }
          #printable-order-invoice {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            background: #090d16 !important;
            color: #ffffff !important;
            box-shadow: none !important;
            border: 1px solid #1e293b !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-6 h-6 text-blue-500" />
            <span>Order Management & Fulfillment</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track customer orders, update delivery pipeline statuses, and print
            invoices.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            {ORDER_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl no-print">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="text-sm">Loading order records...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              No orders found
            </p>
            <p className="text-xs text-slate-500">
              Orders placed by customers will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-900/40 transition"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-400">
                      #{order.id.slice(0, 8)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {order.user?.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.user?.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-white">
                      Rs{Number(order.total).toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            order.isPaid
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {order.isPaid ? "PAID" : "UNPAID"}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {order.paymentMethod}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setStatusToast(null);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Status Manager Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div
            id="printable-order-invoice"
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 my-8"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg font-bold text-white">
                    Order #{selectedOrder.id}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                      selectedOrder.status,
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Action Buttons (Hidden when printing) */}
              <div className="flex items-center gap-2 no-print print:hidden">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Pipeline Controller — HIDDEN IN PRINT VIEW */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 no-print print:hidden">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase text-slate-400">
                  Update Fulfillment Status
                </label>
                {statusToast && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {statusToast}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((st) => (
                  <button
                    key={st}
                    disabled={updatingStatus || selectedOrder.status === st}
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      selectedOrder.status === st
                        ? "bg-blue-600 text-white shadow"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    } disabled:opacity-50`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Purchased Items
              </h4>
              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden">
                {selectedOrder.items?.map((it: any) => (
                  <div
                    key={it.id}
                    className="p-3.5 bg-slate-900/50 flex items-center justify-between text-xs gap-4"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        {it.variant?.product?.name || "Product"}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {it.variant?.name} (SKU: {it.variant?.sku}) ×{" "}
                        {it.quantity}
                      </div>
                    </div>
                    <div className="font-bold text-white text-sm shrink-0">
                      Rs{(Number(it.price) * it.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer & Shipping + Financials Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Formatted Customer & Shipping Card (No JSON overflow) */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 break-words overflow-hidden">
                <h5 className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2">
                  Customer & Shipping
                </h5>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                    <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      {addr.fullName || selectedOrder.user?.name || "Customer"}
                    </span>
                  </div>
                  {selectedOrder.user?.email && (
                    <p className="text-slate-400 pl-5 break-all">
                      {selectedOrder.user.email}
                    </p>
                  )}
                </div>

                {addr.raw ? (
                  <p className="text-slate-300 leading-relaxed break-words">
                    {addr.raw}
                  </p>
                ) : (
                  <div className="space-y-1.5 pt-1 border-t border-slate-800/70 text-slate-300">
                    {addr.street && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 break-words">
                          <p className="font-medium text-slate-200">
                            {addr.street}
                          </p>
                          <p className="text-slate-400">
                            {[addr.city, addr.state, addr.postalCode]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          {addr.country && (
                            <p className="text-slate-400">{addr.country}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {addr.phone && (
                      <div className="flex items-center gap-1.5 text-slate-300 pt-1">
                        <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{addr.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Financials Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-2">
                <div className="space-y-2">
                  <h5 className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2">
                    Financials
                  </h5>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Method:</span>
                    <span className="font-mono text-slate-200">
                      {selectedOrder.paymentMethod} (
                      {selectedOrder.isPaid ? "PAID" : "UNPAID"})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Discount:</span>
                    <span>-Rs{Number(selectedOrder.discount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping Fee:</span>
                    <span>
                      Rs{Number(selectedOrder.shippingFee).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax:</span>
                    <span>Rs{Number(selectedOrder.tax).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-white font-bold text-base pt-3 border-t border-slate-800">
                  <span>Total:</span>
                  <span className="text-emerald-400">
                    Rs{Number(selectedOrder.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
