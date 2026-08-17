"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  QrCode,
  LayoutDashboard,
  LogIn,
  Menu,
  X,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { getStoredAuth } from "@/lib/store";
import { AuthSession } from "@/lib/types";

export function Navbar() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = getStoredAuth();
    setAuth(current);
  }, [pathname]);

  const publicLinks = [
    { href: "/#hero", label: "Beranda" },
    { href: "/#tentang", label: "Tentang" },
    { href: "/#fitur", label: "Fitur Unggulan" },
    { href: "/#alur", label: "Alur Absensi" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFD400] border-b-4 border-[#181818] brutal-shadow select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Public Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-[#3355FF] text-white flex items-center justify-center brutal-border brutal-shadow-sm group-hover:rotate-6 transition-transform">
              <QrCode className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-fredoka text-[#181818] tracking-tight">
                  ABSENSI<span className="text-[#3355FF]">QR</span>
                </span>
                <span className="bg-[#FF6FA5] text-[#181818] text-[10px] font-black px-2 py-0.5 rounded-full brutal-border-2">
                  XI PPLG 1
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-[#181818]/80 tracking-wider uppercase">
                SMKN 1 Ciomas
              </span>
            </div>
          </Link>

          {/* Public Section Anchor Links */}
          <nav className="hidden md:flex items-center gap-2">
            {publicLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold text-[#181818] hover:bg-white/80 transition-all brutal-btn-press"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action: Go To Dashboard / Login */}
          <div className="hidden sm:flex items-center gap-3">
            {mounted && auth ? (
              <Link href="/dashboard">
                <Button variant="primary" size="md" className="gap-2 text-xs sm:text-sm">
                  <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
                  <span>Buka Dashboard ({auth.role})</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="white" size="md" className="gap-1.5 text-xs sm:text-sm">
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Masuk</span>
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="primary" size="md" className="gap-2 text-xs sm:text-sm">
                    <LayoutDashboard className="w-4 h-4 stroke-[2.5]" />
                    <span>Dashboard App</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="white"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-11 w-11"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 stroke-[3] text-[#181818]" />
              ) : (
                <Menu className="w-6 h-6 stroke-[3] text-[#181818]" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFD400] border-t-4 border-[#181818] p-4 sm:p-6 space-y-4 animate-in slide-in-from-top-3 duration-150">
          <div className="space-y-2">
            {publicLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 bg-white rounded-2xl brutal-border-2 font-black text-sm text-[#181818] text-center"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full"
            >
              <Button variant="primary" size="lg" className="w-full justify-center gap-2">
                <LayoutDashboard className="w-5 h-5 stroke-[2.5]" />
                <span>Buka Dashboard Aplikasi</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
