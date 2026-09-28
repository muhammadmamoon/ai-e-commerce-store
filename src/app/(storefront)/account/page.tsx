"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useCartStore } from "../../../store/useCartStore";
import {
  Package,
  Heart,
  User,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingCart,
  Trash2,
  MapPin,
  Loader2,
  ArrowRight,
  Save,
} from "lucide-react";

const TRACKING_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function CustomerAccountPage() {
  const addItem = useCartStore((state) => state.addItem);

  const [activeTab, setActiveTab] = useState<"orders" | "wishlist" | "profile">(
    "orders",
  );
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);

  // Profile Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchAccountData = async () => {
    setLoading(true);
    try {
      const [accRes, wishRes] = await Promise.all([
        axios.get("/api/account"),
        axios.get("/api/wishlist"),
      ]);

      if (accRes.data.success) {
        const { profile: p, addresses, orders: o } = accRes.data.data;
        setProfile(p);
        setOrders(o);
        setName(p.name || "");
        setPhone(p.phone || "");
        if (addresses?.[0]) {
          setAddress({
            street: addresses[0].street || "",
            city: addresses[0].city || "",
            state: addresses[0].state || "",
            postalCode: addresses[0].postalCode || "",
            country: addresses[0].country || "United States",
          });
        }
      }

      if (wishRes.data.success) {
        setWishlist(wishRes.data.data);
      }
    } catch (err) {
      console.error("Error loading account:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const handleMoveToCart = async (item: any) => {
    if (!item.defaultVariant || item.totalStock <= 0) return;

    addItem({
      productId: item.productId,
      productSlug: item.slug,
      productName: item.name,
      variantId: item.defaultVariant.id,
      variantName: item.defaultVariant.name,
      sku: item.defaultVariant.sku,
      price: item.defaultVariant.price,
      quantity: 1,
      maxStock: item.defaultVariant.stock,
      image: item.image,
    });

    await axios.delete(`/api/wishlist?productId=${item.productId}`);
    setWishlist((prev) => prev.filter((w) => w.productId !== item.productId));
  };

  const handleRemoveWishlist = async (productId: string) => {
    try {
      await axios.delete(`/api/wishlist?productId=${productId}`);
      setWishlist((prev) => prev.filter((w) => w.productId !== productId));
    } catch (err) {
      alert("Failed to remove item.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setSaveSuccess(false);
    try {
      const res = await axios.put("/api/account", {
        name,
        phone,
        address,
      });
      if (res.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm text-slate-500">
          Loading your account dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Customer Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">
            Welcome back, {profile?.name || "Shopper"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">{profile?.email}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block">Total Orders</span>
            <span className="text-lg font-black text-white">
              {orders.length}
            </span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-xs text-slate-400 block">Wishlisted</span>
            <span className="text-lg font-black text-rose-400">
              {wishlist.length}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "orders"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders & Live Tracking ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("wishlist")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "wishlist"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Wishlist ({wishlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === "profile"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Shipping Address</span>
        </button>
      </div>

      {/* TAB 1: ORDERS & TRACKING */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="bg-white p-14 rounded-3xl border border-slate-200 text-center space-y-4">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">
                No orders placed yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you place an order, you can track its live fulfillment
                stage from warehouse packing to doorstep delivery right here.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                <span>Start Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const currentStepIndex = TRACKING_STEPS.indexOf(order.status);
              const isCancelled = [
                "CANCELLED",
                "RETURNED",
                "REFUNDED",
              ].includes(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs"
                >
                  {/* Order Top Bar */}
                  <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6 text-xs">
                      <div>
                        <span className="text-slate-400 block">
                          Order Reference
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          #{order.id.slice(0, 8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Placed On</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">
                          Total Amount
                        </span>
                        <span className="font-extrabold text-blue-600">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Payment</span>
                        <span className="font-semibold text-slate-800">
                          {order.paymentMethod} (
                          {order.isPaid ? "Paid" : "Pay on Delivery"})
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-700"
                          : isCancelled
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Visual Live Order Tracking Pipeline */}
                  <div className="p-6 border-b border-slate-100">
                    {isCancelled ? (
                      <div className="flex items-center gap-2 text-rose-600 text-xs font-bold">
                        <XCircle className="w-4 h-4" />
                        <span>
                          This order was marked as {order.status} and any
                          reserved stock has been restored.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span>Live Shipment Progress</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
                          {TRACKING_STEPS.map((stepName, idx) => {
                            const completed = idx <= currentStepIndex;
                            return (
                              <div
                                key={stepName}
                                className={`p-2.5 rounded-xl border text-center transition ${
                                  completed
                                    ? "bg-blue-50/70 border-blue-500 text-blue-700"
                                    : "bg-slate-50 border-slate-200 text-slate-400"
                                }`}
                              >
                                <div className="flex items-center justify-center mb-1">
                                  {completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-slate-300" />
                                  )}
                                </div>
                                <span className="text-[10px] font-bold block">
                                  {stepName.replace(/_/g, " ")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Line Items */}
                  <div className="p-5 divide-y divide-slate-100">
                    {order.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.variant?.product?.images?.[0]?.url ||
                              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
                            }
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200"
                          />
                          <div>
                            <Link
                              href={`/products/${item.variant?.product?.slug || ""}`}
                              className="text-sm font-bold text-slate-900 hover:text-blue-600"
                            >
                              {item.variant?.product?.name || "Product"}
                            </Link>
                            <p className="text-xs text-slate-500">
                              Variant: {item.variant?.name} × {item.quantity}
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-bold text-slate-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: WISHLIST */}
      {activeTab === "wishlist" && (
        <div>
          {wishlist.length === 0 ? (
            <div className="bg-white p-14 rounded-3xl border border-slate-200 text-center space-y-4">
              <Heart className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">
                Your wishlist is empty
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Save products to your wishlist to track their stock availability
                and move them to your cart anytime.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.wishlistItemId}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      className="block aspect-square bg-slate-100 overflow-hidden relative"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.totalStock > 0
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {item.totalStock > 0
                          ? `${item.totalStock} in stock`
                          : "Out of Stock"}
                      </span>
                    </Link>

                    <div className="p-4">
                      <span className="text-[11px] font-bold uppercase text-blue-600">
                        {item.categoryName}
                      </span>
                      <Link href={`/products/${item.slug}`}>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5 hover:text-blue-600">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-base font-extrabold text-slate-900 mt-2">
                        ${item.basePrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={item.totalStock <= 0}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Move to Cart</span>
                    </button>
                    <button
                      onClick={() => handleRemoveWishlist(item.productId)}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE & SHIPPING ADDRESS */}
      {activeTab === "profile" && (
        <form
          onSubmit={handleSaveProfile}
          className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Personal Details & Default Address
              </h2>
              <p className="text-xs text-slate-500">
                Keep your contact info updated for faster checkout.
              </p>
            </div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0199"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="pt-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Default Shipping Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) =>
                    setAddress({ ...address, street: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) =>
                    setAddress({ ...address, postalCode: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={address.country}
                  onChange={(e) =>
                    setAddress({ ...address, country: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
