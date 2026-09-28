"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login")
    ) {
      return;
    }

    // Prevent React StrictMode double-counting the same page navigation
    if (lastTrackedPath.current === pathname) {
      return;
    }
    lastTrackedPath.current = pathname;

    try {
      let visitorId = localStorage.getItem("ai_store_visitor_id");
      if (!visitorId) {
        visitorId =
          "v_" +
          Math.random().toString(36).substring(2, 11) +
          "_" +
          Date.now().toString(36);
        localStorage.setItem("ai_store_visitor_id", visitorId);
      }

      const isMobile = window.innerWidth < 768;

      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_VISIT",
          visitorId,
          pathname,
          isMobile,
        }),
      }).catch(() => {});
    } catch {
      // Ignore localStorage errors in restricted mode
    }
  }, [pathname]);

  return null;
}
