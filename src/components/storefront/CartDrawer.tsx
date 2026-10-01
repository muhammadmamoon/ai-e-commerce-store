"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "../../store/useCartStore";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getSubtotal } =
    useCartStore();

  // Prevent hydration mismatch with persisted localStorage
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !isOpen) return null;

  const subtotal = getSubtotal();

  // 🔥 DYNAMIC SHIPPING LOGIC ADDED HERE 🔥
  // 🔥 DYNAMIC SHIPPING LOGIC (FLAT FEE PER ITEM) 🔥
  const estimatedShipping = items.reduce((totalFee, item: any) => {
    if (item.isFreeShipping) {
      return totalFee;
    }
    const fee = item.shippingFee ? Number(item.shippingFee) : 0;
    return totalFee + fee; // Ab yeh quantity se multiply nahi hoga
  }, 0);

  const total = subtotal + estimatedShipping;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Your Shopping Cart ({items.length})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">
                  Your cart is empty
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                  Explore our catalog and add your favorite items to get
                  started.
                </p>
                <button
                  onClick={closeCart}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="py-4 flex gap-4">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={closeCart}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 line-clamp-1"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Variant:{" "}
                      <span className="font-medium text-slate-700">
                        {item.variantName}
                      </span>
                    </p>
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      Rs {(item.price * item.quantity).toFixed(2)}
                    </p>

                    <div className="flex items-center justify-between mt-2.5">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="p-1.5 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">
                    Rs {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Estimated Shipping</span>
                  <span>
                    {estimatedShipping === 0 ? (
                      <span className="text-emerald-600 font-semibold">
                        FREE
                      </span>
                    ) : (
                      `Rs ${estimatedShipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span>Rs {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SSL Encrypted Checkout & Official Warranty</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
