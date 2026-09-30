"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "../../../store/useCartStore";
import { useSession } from "next-auth/react";
import axios from "axios";
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Tag,
  Check,
  ShoppingBag,
  LogIn,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, getSubtotal, clearCart } = useCartStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
    phone: "",
  });

  const [shippingMethod, setShippingMethod] = useState<"STANDARD" | "EXPRESS">(
    "STANDARD",
  );
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "CARD">("COD");

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountTotal: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [orderComplete, setOrderComplete] = useState<any | null>(null);

  useEffect(() => {
    if (session?.user?.name && !address.fullName) {
      setAddress((prev) => ({
        ...prev,
        fullName: session.user.name || "",
      }));
    }
  }, [session?.user?.name, address.fullName]);

  // =========================================================================
  // 🔥 DYNAMIC SHIPPING (FLAT FEE PER ITEM - FIXED) 🔥
  // =========================================================================
  const subtotal = getSubtotal();

  const dynamicStandardShipping = items.reduce((totalFee, item: any) => {
    if (item.isFreeShipping) {
      return totalFee;
    }
    const fee = item.shippingFee ? Number(item.shippingFee) : 0;
    return totalFee + fee; // Only add base fee once per product type
  }, 0);

  const discount = appliedCoupon ? appliedCoupon.discountTotal : 0;
  const shippingFee =
    shippingMethod === "EXPRESS"
      ? dynamicStandardShipping + 15.0
      : dynamicStandardShipping;

  // const estimatedTax = Math.max(0, subtotal - discount) * 0.05;
  const total = Math.max(0, subtotal - discount + shippingFee);
  // =========================================================================

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await axios.post("/api/coupons/validate", {
        code: couponCode.trim(),
        subtotal,
      });

      if (res.data.success) {
        setAppliedCoupon(res.data.data);
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || "Invalid coupon code.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddress: address,
        shippingMethod,
        paymentMethod,
        couponCode: appliedCoupon?.code || null,
      };

      const res = await axios.post("/api/orders", payload);

      if (res.data.success) {
        setOrderComplete(res.data.data);
        clearCart();
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to place order. Check inventory availability.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-md">
          <LogIn className="w-10 h-10 ml-2" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Login Required</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Please sign in to your account to securely complete your purchase
            and track your order.
          </p>
        </div>
        <button
          onClick={() => router.push("/login?callbackUrl=/checkout")}
          className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition w-full"
        >
          Login / Create Account
        </button>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">Order Confirmed!</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Thank you for your purchase. We have received your order{" "}
          <strong className="text-slate-900 font-mono">
            #{orderComplete.id.slice(0, 8)}
          </strong>{" "}
          and deducted the reserved stock.
        </p>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Paid/Due:</span>
            <span className="font-bold text-slate-900">
              Rs{Number(orderComplete.total).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Mode:</span>
            <span className="font-bold text-slate-900">
              {orderComplete.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Status:</span>
            <span className="font-bold text-emerald-600 uppercase">
              {orderComplete.status}
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push("/products")}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <button
          onClick={() => router.push("/products")}
          className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-black text-slate-900 mb-8">
        Secure Checkout
      </h1>

      {/* Checkout Progress Stepper */}
      <div className="flex items-center justify-between max-w-xl mx-auto mb-10 text-xs font-bold text-slate-500">
        {[
          { num: 1, label: "Address" },
          { num: 2, label: "Shipping" },
          { num: 3, label: "Payment" },
          { num: 4, label: "Review" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                step === s.num
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : step > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </span>
            <span className={step === s.num ? "text-slate-900" : ""}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Interactive Wizard Form */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          {/* STEP 1: Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                1. Delivery Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) =>
                      setAddress({ ...address, fullName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) =>
                      setAddress({ ...address, street: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    State / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) =>
                      setAddress({ ...address, state: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress({ ...address, postalCode: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) =>
                      setAddress({ ...address, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={
                    !address.fullName ||
                    !address.street ||
                    !address.city ||
                    !address.phone
                  }
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-40"
                >
                  <span>Continue to Shipping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping Method */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                2. Select Shipping Method
              </h2>
              <div className="space-y-3">
                <label
                  onClick={() => setShippingMethod("STANDARD")}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    shippingMethod === "STANDARD"
                      ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Standard Delivery
                      </h4>
                      <p className="text-xs text-slate-500">
                        Calculated based on items in your cart
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${dynamicStandardShipping === 0 ? "text-emerald-500" : "text-slate-900"}`}
                  >
                    {dynamicStandardShipping === 0
                      ? "FREE"
                      : `$${dynamicStandardShipping.toFixed(2)}`}
                  </span>
                </label>

                <label
                  onClick={() => setShippingMethod("EXPRESS")}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    shippingMethod === "EXPRESS"
                      ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Priority Express
                      </h4>
                      <p className="text-xs text-slate-500">
                        Rush processing & fast dispatch
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    Rs{(dynamicStandardShipping + 15.0).toFixed(2)}
                  </span>
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Method */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">
                3. Payment Preference
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between cursor-pointer ${
                    paymentMethod === "COD"
                      ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900">
                      Cash on Delivery
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Pay cash upon package arrival at your door.
                  </p>
                </label>

                <label
                  onClick={() => setPaymentMethod("CARD")}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between cursor-pointer ${
                    paymentMethod === "CARD"
                      ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-slate-900">
                      Debit / Credit Card
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Instant secure online payment processing.
                  </p>
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-slate-900">
                4. Review & Confirm Order
              </h2>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping to:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {address.fullName}, {address.street}, {address.city}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shipping Mode:</span>
                  <span className="font-semibold text-slate-900">
                    {shippingMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold text-slate-900">
                    {paymentMethod}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase">
                  Items In Order:
                </h4>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {items.map((i) => (
                    <div
                      key={i.variantId}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {i.productName}
                        </div>
                        <div className="text-slate-500">
                          {i.variantName} × {i.quantity}
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">
                        Rs{(i.price * i.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePlaceOrder}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Place Order • Rs{total.toFixed(2)}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Order Summary & Coupon Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Order Summary
            </h3>

            {/* 🔥 NEW: ITEM LIST IN RIGHT SIDEBAR 🔥 */}
            <div className="max-h-48 overflow-y-auto space-y-3 pb-4 border-b border-slate-100">
              {items.map((i) => (
                <div key={i.variantId} className="flex justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-slate-800 line-clamp-1">
                      {i.productName}
                    </p>
                    <p className="text-slate-500">
                      {i.variantName} × {i.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">
                    Rs{(i.price * i.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Application Box */}
            <div className="pt-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Coupon code"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition"
                >
                  {validatingCoupon ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
              {couponError && (
                <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>
              )}
              {appliedCoupon && (
                <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
                  Coupon &quot;{appliedCoupon.code}&quot; applied (-Rs
                  {appliedCoupon.discountTotal.toFixed(2)})
                </p>
              )}
            </div>

            {/* Line items calculation */}
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span
                  className={`font-semibold ${shippingFee === 0 ? "text-emerald-500" : "text-slate-900"}`}
                >
                  {shippingFee === 0 ? "FREE" : `$${shippingFee.toFixed(2)}`}
                </span>
              </div>
              {/* <div className="flex justify-between">
                <span>Estimated Tax (5%)</span>
                <span className="font-semibold text-slate-900">
                  ${estimatedTax.toFixed(2)}
                </span>
              </div> */}
              <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-100">
                <span>Total Amount</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Real-Time Inventory Lock & Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
