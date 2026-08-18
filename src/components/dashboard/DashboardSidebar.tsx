"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppIcon } from "../ui/AppIcon";
import { Badge } from "../ui/Badge";
import { logout } from "@/lib/store";
import { AuthSession, Siswa } from "@/lib/types";

export function DashboardSidebar({
  auth,
  isOpen,
  onClose,
}: {
  auth: AuthSession | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getNavItems = () => {
    if (!auth) return [];

    if (auth.role === "siswa") {
      return [
        {
          href: "/dashboard/siswa",
          label: "Beranda Siswa",
          icon: "dashboard",
        },
        {
          href: "/dashboard/siswa/absen",
          label: "Ambil Absen Live",
          icon: "camera-selfie",
          badge: "Live",
        },
        {
          href: "/dashboard/siswa/izin",
          label: "Pengajuan Izin & Sakit",
          icon: "doctor",
          badge: "Form",
        },
        {
          href: "/dashboard/siswa/riwayat",
          label: "Riwayat Presensi",
          icon: "history",
        },
      ];
    }

    if (auth.role === "admin") {
      return [
        {
          href: "/dashboard/sekretaris",
          label: "Beranda Sekretaris",
          icon: "dashboard",
        },
        {
          href: "/dashboard/sekretaris/qr-kelas",
          label: "Proyektor QR Kelas",
          icon: "sun",
          badge: "Pagi",
        },
        {
          href: "/dashboard/sekretaris/verifikasi",
          label: "Verifikasi Foto Siswa",
          icon: "shield",
          badge: "Review",
        },
        {
          href: "/dashboard/sekretaris/izin",
          label: "Catatan Izin & Sakit",
          icon: "doctor",
        },
        {
          href: "/dashboard/guru/rekap",
          label: "Rekap 46 Siswa",
          icon: "export-csv",
        },
      ];
    }

    // Wali Kelas / Guru
    return [
      {
        href: "/dashboard/guru",
        label: "Beranda Wali Kelas",
        icon: "dashboard",
      },
      {
        href: "/dashboard/guru/qr-sholat",
        label: "Proyektor QR Sholat",
        icon: "mosque",
        badge: "Dzuhur",
      },
      {
        href: "/dashboard/guru/verifikasi",
        label: "Verifikasi Foto & Sholat",
        icon: "shield",
        badge: "Review",
      },
      {
        href: "/dashboard/guru/rekap",
        label: "Rekapitulasi 46 Siswa",
        icon: "export-csv",
        badge: "Laporan",
      },
    ];
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    if (!auth) return "Tamu";
    if (auth.role === "siswa") return "Siswa XI PPLG 1";
    if (auth.role === "admin") return "Sekretaris Kelas";
    return "Guru / Wali Kelas";
  };

  const getRoleThemeBg = () => {
    if (!auth) return "bg-[#FFD400]";
    if (auth.role === "siswa") return "bg-[#FFD400]";
    if (auth.role === "admin") return "bg-[#FF7A2E]";
    return "bg-[#FF6FA5]";
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[#181818]/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Shell */}
      <aside
        data-lenis-prevent="true"
        className={`fixed lg:static top-0 left-0 z-50 h-full w-72 max-w-[85vw] shrink-0 ${getRoleThemeBg()} border-r-4 border-[#181818] brutal-shadow flex flex-col justify-between p-4 sm:p-5 transition-transform duration-200 ease-in-out select-none overflow-y-auto overscroll-contain ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b-3 border-[#181818]">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-11 h-11 rounded-2xl bg-[#3355FF] text-white flex items-center justify-center brutal-border brutal-shadow-sm group-hover:rotate-6 transition-transform">
                <AppIcon name="qrcode" className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black font-fredoka text-[#181818] tracking-tight block leading-tight">
                  ABSENSI<span className="text-[#3355FF]">QR</span>
                </span>
                <span className="bg-white text-[#181818] text-[9px] font-black px-2 py-0.5 rounded-full brutal-border-2">
                  PANEL {auth?.role ? auth.role.toUpperCase() : "PORTAL"}
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 bg-white rounded-xl brutal-border-2 font-black flex items-center justify-center"
            >
              <AppIcon name="cross" className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          {auth && (
            <div className="p-3.5 bg-white rounded-2xl brutal-border-2 brutal-shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Role:
                </span>
                <Badge
                  variant={auth.role === "siswa" ? "blue" : auth.role === "admin" ? "orange" : "pink"}
                  size="sm"
                  className="text-[9px] py-0 px-2"
                >
                  {getRoleLabel()}
                </Badge>
              </div>
              <p className="text-sm font-black text-[#181818] truncate flex items-center gap-1.5">
                <AppIcon
                  name={auth.role === "siswa" ? "student" : auth.role === "admin" ? "secretary" : "teacher"}
                  className="w-4 h-4 text-[#3355FF]"
                />
                <span>{auth.user.nama}</span>
              </p>
              {auth.role === "siswa" && (
                <p className="text-[11px] font-bold text-neutral-600 font-mono">
                  NISN: {(auth.user as Siswa).nis} • Absen #{(auth.user as Siswa).nomorAbsen}
                </p>
              )}
            </div>
          )}

          {/* Dynamic Nav Menu */}
          <nav className="space-y-2.5 pt-2 pb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#181818]/70 px-1">
              NAVIGASI {auth?.role === "siswa" ? "SISWA" : auth?.role === "admin" ? "SEKRETARIS" : "WALI KELAS"}
            </p>

            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all brutal-btn-press ${
                    isActive
                      ? "bg-[#3355FF] text-white brutal-border brutal-shadow-sm translate-x-1"
                      : "bg-white text-[#181818] hover:bg-neutral-50 brutal-border-2"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AppIcon name={item.icon} className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        isActive
                          ? "bg-[#FFD400] text-[#181818]"
                          : "bg-neutral-200 text-[#181818]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="mt-4 pt-4 space-y-2 border-t-3 border-[#181818] shrink-0">
          <Link
            href="/"
            className="w-full py-2.5 px-3 bg-white text-[#181818] font-black text-xs rounded-xl brutal-border-2 flex items-center justify-center gap-1.5 hover:bg-neutral-50"
          >
            <AppIcon name="ph:house-bold" className="w-4 h-4" />
            <span>Landing Page</span>
          </Link>

          {auth && (
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-3 bg-[#FF4D4D] text-white font-black text-xs rounded-xl brutal-border-2 flex items-center justify-center gap-1.5 hover:bg-red-600 cursor-pointer"
            >
              <AppIcon name="logout" className="w-4 h-4" />
              <span>Keluar Akun ({auth.role})</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
