"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Clock, Sparkles, UserCheck, Shield, Bell, QrCode } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { AuthSession } from "@/lib/types";

export function DashboardHeader({
  auth,
  onToggleSidebar,
}: {
  auth: AuthSession | null;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard Overview";
      case "/dashboard/absen":
        return "Presensi Live Camera";
      case "/dashboard/riwayat":
        return "Riwayat Kehadiran Siswa";
      case "/dashboard/qr-display":
        return "Layar Proyektor QR Dinamis";
      case "/dashboard/verifikasi":
        return "Dashboard Verifikasi Admin";
      case "/dashboard/rekap":
        return "Rekapitulasi 46 Siswa";
      default:
        return "Dashboard XI PPLG 1";
    }
  };

  return (
    <header className="shrink-0 z-30 w-full bg-white border-b-4 border-[#181818] px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between brutal-shadow-sm select-none gap-2">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 bg-[#FFD400] text-[#181818] rounded-xl brutal-border-2 shrink-0 active:scale-95 transition-transform"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-black font-fredoka text-[#181818] tracking-tight truncate">
            {getPageTitle()}
          </h1>
          <span className="text-[10px] sm:text-xs font-bold text-neutral-500 hidden sm:block">
            Sistem Absensi Digital • Kelas XI PPLG 1
          </span>
        </div>
      </div>

      {/* Right: Clock & User Info */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 bg-[#F4F4F0] px-3 py-1.5 rounded-xl brutal-border-2 font-mono font-black text-xs text-[#181818]">
          <Clock className="w-3.5 h-3.5 text-[#3355FF]" />
          <span suppressHydrationWarning>{currentTime || "07:00:00 WIB"}</span>
        </div>

        {auth ? (
          <div className="flex items-center gap-1.5">
            <Badge
              variant={auth.role === "siswa" ? "blue" : auth.role === "wali_kelas" ? "pink" : "orange"}
              size="sm"
              className="text-[11px] sm:text-xs py-0.5 px-2 font-black"
            >
              {auth.role === "siswa" ? `Siswa: ${auth.user.nama.split(" ")[0]}` : auth.user.nama.split(" ")[0]}
            </Badge>
          </div>
        ) : (
          <Link href="/login">
            <Button variant="yellow" size="sm" className="text-xs">
              Login
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
