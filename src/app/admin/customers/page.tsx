"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  Search,
  Crown,
  UserCheck,
  UserPlus,
  DollarSign,
  Eye,
  Shield,
  Loader2,
  X,
  Mail,
  Phone,
  ShoppingBag,
} from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalUsers: 0,
    vipCount: 0,
    returningCount: 0,
    newCustomerCount: 0,
    totalCustomerLifetimeValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/customers", {
        params: {
          search: search || undefined,
          segment: segmentFilter,
        },
      });
      if (res.data.success) {
        setCustomers(res.data.data.customers);
        setSummary(res.data.data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [segmentFilter]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(true);
    try {
      const res = await axios.put("/api/customers", {
        userId,
        role: newRole,
      });
      if (res.data.success) {
        if (selectedCustomer?.id === userId) {
          setSelectedCustomer({ ...selectedCustomer, role: newRole });
        }
        await fetchCustomers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Could not update role.");
    } finally {
      setUpdatingRole(false);
    }
  };

  const getSegmentBadge = (segment: string) => {
    switch (segment) {
      case "VIP":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "FREQUENT":
        return "bg-purple-500/15 text-purple-400 border-purple-500/30";
      case "RETURNING":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "STAFF":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-500" />
            <span>Customer Intelligence & Access Control</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Analyze customer lifetime value (LTV), behavioral segments, order
            history, and role permissions.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Registered Accounts</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.totalUsers}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-amber-500/20">
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span>High-Value VIPs ($1,500+)</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.vipCount}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Returning & Frequent Buyers</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {summary.returningCount}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cumulative Customer Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            $
            {summary.totalCustomerLifetimeValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      {/* Search & Segment Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCustomers();
          }}
          className="flex gap-2 flex-1 max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
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
            { id: "ALL", label: "All Users" },
            { id: "VIP", label: "VIP High-Value" },
            { id: "RETURNING", label: "Returning" },
            { id: "NEW", label: "New Signups" },
            { id: "STAFF", label: "Admins & Staff" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSegmentFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                segmentFilter === tab.id
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            <span className="text-sm">Loading customer profiles...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <UserPlus className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">
              No matching customers found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Segment</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4">Total Spend (LTV)</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getSegmentBadge(
                          c.segment,
                        )}`}
                      >
                        {c.segment}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={c.role}
                        disabled={updatingRole}
                        onChange={(e) => handleRoleChange(c.id, e.target.value)}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-slate-200">
                      {c.totalOrders}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      ${c.totalSpent.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile & Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedCustomer.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${getSegmentBadge(
                      selectedCustomer.segment,
                    )}`}
                  >
                    {selectedCustomer.segment}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customer ID: {selectedCustomer.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" /> Email
                </span>
                <p className="font-semibold text-white truncate">
                  {selectedCustomer.email}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone
                </span>
                <p className="font-semibold text-white">
                  {selectedCustomer.phone}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-400" /> Access Role
                </span>
                <p className="font-semibold text-white font-mono">
                  {selectedCustomer.role}
                </p>
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  Recent Orders ({selectedCustomer.totalOrders} total)
                </span>
              </h4>

              {selectedCustomer.recentOrders?.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-500">
                  This user has not placed any orders yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden text-xs">
                  {selectedCustomer.recentOrders.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="p-3 bg-slate-900/50 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono text-blue-400 font-semibold">
                          #{ord.id.slice(0, 8)}
                        </span>
                        <span className="text-slate-500 ml-2">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {ord.status}
                        </span>
                        <span className="font-bold text-emerald-400">
                          ${ord.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
