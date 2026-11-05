"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function HeroSlider({
  latestProducts,
}: {
  latestProducts: any[];
}) {
  const [current, setCurrent] = useState(0);

  // Auto Scroll har 5 second baad
  useEffect(() => {
    if (!latestProducts || latestProducts.length === 0) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev === latestProducts.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [latestProducts]);

  // Agar database mein koi product nahi hai to kuch mat dikhao
  if (!latestProducts || latestProducts.length === 0) return null;

  const prevSlide = () => {
    setCurrent(current === 0 ? latestProducts.length - 1 : current - 1);
  };

  const nextSlide = () => {
    setCurrent(current === latestProducts.length - 1 ? 0 : current + 1);
  };

  return (
    <div className="relative w-full h-[60vh] sm:h-[80vh] overflow-hidden group">
      {/* Slider Images from Database */}
      <div
        className="flex transition-transform duration-1000 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {latestProducts.map((product) => {
          // Product ki pehli tasveer nikalne ka tareeqa
          const imageUrl = product.images?.[0]?.url || "/placeholder-image.jpg";

          return (
            <div key={product.id} className="min-w-full h-full relative">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {/* Text Overlay */}
              <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center text-center px-4">
                <span className="text-blue-400 font-black tracking-widest uppercase mb-3 px-3 py-1 bg-slate-900/50 rounded-full border border-blue-500/30">
                  {product.category?.name || "New Arrival"}
                </span>

                <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-wide uppercase drop-shadow-2xl mb-8 max-w-4xl line-clamp-2">
                  {product.name}
                </h2>

                {/* Dynamically Link to Product Page */}
                <Link
                  href={`/products/${product.slug}`}
                  className="px-8 py-3.5 bg-blue-600 text-white font-black uppercase tracking-wider text-sm rounded-full hover:bg-blue-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                >
                  View Product
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left Arrow Button */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 left-4 sm:left-8 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      {/* Right Arrow Button */}
      <button
        onClick={nextSlide}
        className="absolute top-1/2 right-4 sm:right-8 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Bottom Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {latestProducts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-300 rounded-full ${
              current === index
                ? "w-8 h-2.5 bg-white shadow-[0_0_10px_white]"
                : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
