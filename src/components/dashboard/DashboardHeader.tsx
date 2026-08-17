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
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }) + " WIB"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
      case "/dashboard/siswa":
        return "Beranda Siswa";
      case "/dashboard/sekretaris":
        return "Beranda Sekretaris";
      case "/dashboard/guru":
        return "Beranda Wali Kelas";
      case "/dashboard/absen":
      case "/dashboard/siswa/absen":
        return "Presensi Live";
      case "/dashboard/riwayat":
      case "/dashboard/siswa/riwayat":
        return "Riwayat Presensi";
      case "/dashboard/qr-display":
      case "/dashboard/sekretaris/qr-kelas":
        return "Proyektor QR Kelas";
      case "/dashboard/guru/qr-sholat":
        return "Proyektor QR Sholat";
      case "/dashboard/verifikasi":
      case "/dashboard/sekretaris/verifikasi":
      case "/dashboard/guru/verifikasi":
        return "Verifikasi Foto";
      case "/dashboard/sekretaris/izin":
      case "/dashboard/siswa/izin":
        return "Kelola Izin & Sakit";
      case "/dashboard/rekap":
      case "/dashboard/guru/rekap":
        return "Rekap 46 Siswa";
      default:
        return "XI PPLG 1";
    }
  };

  return (
    <header className="shrink-0 z-30 w-full bg-white border-b-4 border-[#181818] px-2.5 sm:px-6 lg:px-8 py-2 sm:py-3.5 flex items-center justify-between brutal-shadow-sm select-none gap-2">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 sm:p-2 bg-[#FFD400] text-[#181818] rounded-xl brutal-border-2 shrink-0 active:scale-95 transition-transform cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg lg:text-xl font-black font-fredoka text-[#181818] tracking-tight truncate leading-tight">
            {getPageTitle()}
          </h1>
          <span className="text-[10px] sm:text-xs font-bold text-neutral-500 hidden sm:block leading-none mt-0.5">
            Sistem Absensi Digital • Kelas XI PPLG 1
          </span>
        </div>
      </div>

      {/* Right: Clock & User Info */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 bg-[#F4F4F0] px-3 py-1.5 rounded-xl brutal-border-2 font-mono font-black text-xs text-[#181818]">
          <Clock className="w-3.5 h-3.5 text-[#3355FF]" />
          <span suppressHydrationWarning>{mounted ? currentTime : "--:--:-- WIB"}</span>
        </div>

        {auth ? (
          <div className="flex items-center gap-1">
            <Badge
              variant={auth.role === "siswa" ? "blue" : auth.role === "wali_kelas" ? "pink" : "orange"}
              size="sm"
              className="text-[10px] sm:text-xs py-0.5 px-2 font-black uppercase shrink-0"
            >
              {auth.role === "siswa" ? auth.user.nama.split(" ")[0] : auth.role === "admin" ? "Sekretaris" : "Wali Kelas"}
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
