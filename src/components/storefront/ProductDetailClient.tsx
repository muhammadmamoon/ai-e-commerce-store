"use client";

import { useState } from "react";
import { useCartStore } from "../../store/useCartStore";
import {
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Truck,
  Flame,
} from "lucide-react";

export default function ProductDetailClient({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem);

  const primaryImg =
    product.images?.find((i: any) => i.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800";

  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants?.[0] || null,
  );
  const [activeImage, setActiveImage] = useState<string>(primaryImg);
  const [quantity, setQuantity] = useState<number>(1);

  const stock = selectedVariant ? Number(selectedVariant.stock) : 0;
  const price = selectedVariant
    ? Number(selectedVariant.price)
    : Number(product.basePrice);

  const handleAddToCart = () => {
    if (!selectedVariant || stock <= 0) return;
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      sku: selectedVariant.sku,
      price,
      quantity,
      maxStock: stock,
      image: activeImage,
      shippingFee: product.shippingFee,
      isFreeShipping: product.isFreeShipping,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
      {/* Left: Image Gallery */}
      <div className="space-y-4">
        <div className="aspect-square rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden">
          <img
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {product.images?.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {product.images.map((img: any, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img.url)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                  activeImage === img.url
                    ? "border-blue-600"
                    : "border-slate-200"
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Variant Selector & Add to Cart */}
      <div className="flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {product.category?.name}
            </span>
            {product.isHot && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                <Flame className="w-3 h-3 fill-current" /> Hot Item
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900">
              Rs {price.toFixed(2)}
            </span>
            {selectedVariant && (
              <span className="text-xs font-mono text-slate-400">
                SKU: {selectedVariant.sku}
              </span>
            )}
          </div>

          {product.shortDesc && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.shortDesc}
            </p>
          )}

          {product.variants?.length > 0 && (
            <div className="pt-4 space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Configuration / Variant:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.variants.map((v: any) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const outOfStock = Number(v.stock) <= 0;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(v);
                        setQuantity(1);
                      }}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20"
                          : "border-slate-200 hover:border-slate-300"
                      } ${outOfStock ? "opacity-50" : ""}`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {v.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Rs {Number(v.price).toFixed(2)}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          outOfStock
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {outOfStock ? "Sold Out" : `${v.stock} in stock`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2">
            {stock > 0 ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>In Stock & Ready to Ship ({stock} available)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Currently Out of Stock for this Variant</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 py-2.5 text-sm font-bold text-slate-700"
              >
                -
              </button>
              <span className="px-4 text-sm font-bold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                disabled={quantity >= stock}
                className="px-3.5 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-30"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={stock <= 0}
              className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-40"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart — Rs {(price * quantity).toFixed(2)}</span>
            </button>
          </div>

          {/* <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Free delivery over $150</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>1-Year Official Warranty</span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
