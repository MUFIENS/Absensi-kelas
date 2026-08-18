"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, LogIn, Sparkles, ShieldAlert, LogOut } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getStoredAuth, logout } from "@/lib/store";
import { AuthSession } from "@/lib/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthSession | null>(() => {
    if (typeof window !== "undefined") {
      return getStoredAuth();
    }
    return null;
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !getStoredAuth();
    }
    return true;
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);
    setIsCheckingAuth(false);

    // If not logged in, auto redirect to /login
    if (!currentAuth) {
      const redirectTimer = setTimeout(() => {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }, 500);
      return () => clearTimeout(redirectTimer);
    }
  }, [pathname, router]);

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFD400] text-[#181818] font-black font-fredoka text-xl">
        <div className="p-8 bg-white rounded-3xl brutal-border-thick brutal-shadow-lg flex items-center gap-3 animate-pulse">
          <Lock className="w-6 h-6 text-[#3355FF]" />
          <span>Memeriksa Akses Login Dashboard...</span>
        </div>
      </div>
    );
  }

  // Not Logged In Protected Gate Fallback
  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3355FF] bg-comic-dots-light p-4">
        <Card variant="white" shadow="xl" borderWidth="thick" className="p-8 max-w-md w-full text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FF4D4D] text-white flex items-center justify-center brutal-border-thick brutal-shadow-lg">
            <Lock className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818]">
              Akses Dashboard Terkunci!
            </h2>
            <p className="text-xs sm:text-sm font-bold text-neutral-600">
              Kamu harus login terlebih dahulu dengan akun Siswa atau Pengurus Kelas XI PPLG 1 sebelum membuka halaman ini.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className="block">
              <Button variant="yellow" size="lg" className="w-full justify-center gap-2">
                <LogIn className="w-5 h-5 stroke-[2.5]" />
                <span>Masuk Sekarang</span>
              </Button>
            </Link>

            <Link href="/" className="block text-xs font-bold text-neutral-500 hover:text-black pt-2">
              ← Kembali ke Landing Page
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Role Access Guard Verification
  const isRekapRoute = pathname === "/dashboard/guru/rekap" || pathname.startsWith("/dashboard/rekap");
  const isGuruOnlyRoute = pathname.startsWith("/dashboard/guru") && !isRekapRoute;
  const isSekretarisRoute = pathname.startsWith("/dashboard/sekretaris");
  const isSiswaRoute = pathname.startsWith("/dashboard/siswa");
  const isManagementRoute =
    pathname.startsWith("/dashboard/verifikasi") ||
    pathname.startsWith("/dashboard/rekap") ||
    isRekapRoute;

  const hasAccess =
    (!isGuruOnlyRoute || auth.role === "wali_kelas") &&
    (!isSekretarisRoute || auth.role === "admin") &&
    (!isSiswaRoute || auth.role === "siswa") &&
    (!isManagementRoute || auth.role === "admin" || auth.role === "wali_kelas");

  if (!hasAccess) {
    const targetDashboard =
      auth.role === "siswa"
        ? "/dashboard/siswa"
        : auth.role === "admin"
        ? "/dashboard/sekretaris"
        : "/dashboard/guru";

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FF4D4D] bg-comic-dots-light p-4">
        <Card variant="white" shadow="xl" borderWidth="thick" className="p-8 max-w-md w-full text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-[#FF4D4D] text-white flex items-center justify-center brutal-border-thick brutal-shadow-lg">
            <ShieldAlert className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818]">
              Akses Tidak Diizinkan!
            </h2>
            <p className="text-xs sm:text-sm font-bold text-neutral-600">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="w-full justify-center gap-2 font-black"
            >
              <LogOut className="w-5 h-5 stroke-[2.5]" />
              <span>Keluar & Kembali ke Login</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen w-full max-w-full flex bg-[#F8F8F5] text-[#181818] antialiased lg:overflow-hidden">
      {/* Persistent / Responsive Dashboard Sidebar */}
      <DashboardSidebar
        auth={auth}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main App Content Body */}
      <div className="flex-1 flex flex-col min-h-screen lg:h-full min-w-0 w-full max-w-full lg:overflow-hidden">
        <DashboardHeader
          auth={auth}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main
          className="flex-1 p-3 sm:p-5 lg:p-8 lg:overflow-y-auto overflow-x-hidden w-full max-w-full pb-24 sm:pb-16 lg:pb-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
