"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Check if device is mobile / touch or on dashboard routes
    const isTouchDevice = typeof window !== "undefined" && (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.innerWidth < 1024
    );

    const isDashboard = pathname.startsWith("/dashboard");

    // NEVER hijack touch gestures on mobile devices or inside dashboard
    if (isTouchDevice || isDashboard) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    // Initialize Lenis smooth scroll for desktop landing page only
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 0,
    });
    lenisRef.current = lenis;

    if (typeof window !== "undefined") {
      (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    }

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Smooth anchor navigation handler
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Handle #id within current page
      if (href.startsWith("#") && href.length > 1) {
        const elem = document.querySelector(href);
        if (elem) {
          e.preventDefault();
          lenis.scrollTo(elem as HTMLElement, { offset: -80, duration: 1.1 });
        }
      }
      // Handle /#id when already on root "/"
      else if (href.startsWith("/#") && window.location.pathname === "/") {
        const hash = href.replace("/", "");
        const elem = document.querySelector(hash);
        if (elem) {
          e.preventDefault();
          lenis.scrollTo(elem as HTMLElement, { offset: -80, duration: 1.1 });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", handleAnchorClick);
      lenis.destroy();
      lenisRef.current = null;
      if (typeof window !== "undefined") {
        delete (window as unknown as { __lenis?: Lenis }).__lenis;
      }
    };
  }, [pathname]);

  return <>{children}</>;
}
