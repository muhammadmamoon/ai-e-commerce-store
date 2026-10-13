"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../../../components/storefront/ProductCard";

export default function ProductCarousel({ products }: { products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto Scroll Logic
  useEffect(() => {
    if (isHovered) return; // Agar mouse upar ho to scroll rok do

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        // Agar end par pohnch jaye to wapas shuru mein le aao
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          // Aagay scroll karo
          scrollRef.current.scrollBy({ left: 344, behavior: "smooth" }); // 344 is card width + gap
        }
      }
    }, 3000); // Har 3 second baad scroll hoga

    return () => clearInterval(interval);
  }, [isHovered]);

  // Manual Scroll Logic (Buttons)
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -344 : 344;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div
      className="relative group px-4 -mx-4 sm:mx-0 sm:px-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Button (Mouse hover par show hoga) */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 sm:-ml-6 z-10 w-12 h-12 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-50 hover:scale-110 transition-all duration-300"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x snap-mandatory hide-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="shrink-0 w-[280px] sm:w-[320px] snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Right Button (Mouse hover par show hoga) */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 sm:-mr-6 z-10 w-12 h-12 rounded-full bg-white text-slate-800 shadow-xl border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-50 hover:scale-110 transition-all duration-300"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* CSS to hide scrollbar for Chrome/Safari */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
