"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  User,
  Shield,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Lock,
  Clock
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AppIcon } from "@/components/ui/AppIcon";
import { getStoredAuth, setStoredAuth, logout } from "@/lib/store";
import { loginRateLimiter } from "@/lib/rateLimit";
import { authenticateSiswaAction, authenticateAdminAction } from "@/app/actions/absensiActions";
import { AuthSession } from "@/lib/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [existingAuth, setExistingAuth] = useState<AuthSession | null>(null);
  const [roleTab, setRoleTab] = useState<"siswa" | "sekretaris" | "guru">("siswa");
  const [isLoading, setIsLoading] = useState(false);

  // Siswa Form (Nama + NISN)
  const [namaSiswa, setNamaSiswa] = useState("");
  const [nisn, setNisn] = useState("");
  const [siswaError, setSiswaError] = useState("");

  // Sekretaris Form
  const [sekretarisUser, setSekretarisUser] = useState("");
  const [sekretarisPass, setSekretarisPass] = useState("");
  const [sekretarisError, setSekretarisError] = useState("");

  // Guru Form
  const [guruUser, setGuruUser] = useState("");
  const [guruPass, setGuruPass] = useState("");
  const [guruError, setGuruError] = useState("");

  useEffect(() => {
    setExistingAuth(getStoredAuth());
  }, []);

  const handleSiswaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSiswaError("");
    if (!namaSiswa.trim()) {
      setSiswaError("Mohon masukkan Nama Siswa.");
      return;
    }
    if (!nisn.trim()) {
      setSiswaError("Mohon masukkan 10 digit NISN Siswa.");
      return;
    }

    const cleanNisn = nisn.trim();
    const limitCheck = loginRateLimiter.check("client", cleanNisn);
    if (!limitCheck.allowed) {
      setSiswaError(`Terlalu banyak percobaan gagal! Mohon tunggu ${limitCheck.retryAfterSeconds} detik lagi demi keamanan.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authenticateSiswaAction(namaSiswa.trim(), cleanNisn);
      if (res.success && res.session) {
        loginRateLimiter.reset("client", cleanNisn);
        setStoredAuth(res.session);
        router.push(redirectParam || "/dashboard/siswa");
      } else {
        setSiswaError(res.message || "Gagal login siswa.");
      }
    } catch {
      setSiswaError("Terjadi kesalahan jaringan / server saat menghubungkan database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSekretarisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSekretarisError("");
    if (!sekretarisUser) {
      setSekretarisError("Mohon masukkan username sekretaris.");
      return;
    }

    const cleanUser = sekretarisUser.trim();
    const limitCheck = loginRateLimiter.check("client", cleanUser);
    if (!limitCheck.allowed) {
      setSekretarisError(`Terlalu banyak percobaan gagal! Mohon tunggu ${limitCheck.retryAfterSeconds} detik lagi demi keamanan.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authenticateAdminAction(cleanUser, sekretarisPass.trim());
      if (res.success && res.session) {
        loginRateLimiter.reset("client", cleanUser);
        setStoredAuth(res.session);
        router.push(redirectParam || "/dashboard/sekretaris");
      } else {
        setSekretarisError(res.message || "Gagal login sekretaris.");
      }
    } catch {
      setSekretarisError("Terjadi kesalahan jaringan / server saat menghubungkan database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuruSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuruError("");
    if (!guruUser) {
      setGuruError("Mohon masukkan username guru / wali kelas.");
      return;
    }

    const cleanUser = guruUser.trim();
    const limitCheck = loginRateLimiter.check("client", cleanUser);
    if (!limitCheck.allowed) {
      setGuruError(`Terlalu banyak percobaan gagal! Mohon tunggu ${limitCheck.retryAfterSeconds} detik lagi demi keamanan.`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authenticateAdminAction(cleanUser, guruPass.trim());
      if (res.success && res.session) {
        loginRateLimiter.reset("client", cleanUser);
        setStoredAuth(res.session);
        router.push(redirectParam || "/dashboard/guru");
      } else {
        setGuruError(res.message || "Gagal login guru/wali kelas.");
      }
    } catch {
      setGuruError("Terjadi kesalahan jaringan / server saat menghubungkan database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAndSwitch = () => {
    logout();
    setExistingAuth(null);
  };

  const getDashboardLinkForRole = (auth: AuthSession) => {
    if (auth.role === "siswa") return "/dashboard/siswa";
    if (auth.role === "admin") return "/dashboard/sekretaris";
    if (auth.role === "wali_kelas") return "/dashboard/guru";
    return "/dashboard";
  };

  return (
    <div className="w-full max-w-xl relative">
      {/* Back to Home link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm mb-3 sm:mb-4 bg-[#181818] px-3 sm:px-3.5 py-1.5 rounded-xl brutal-border-2 brutal-shadow-sm hover:bg-neutral-800 transition-all select-none"
      >
        <ArrowLeft className="w-4 h-4 stroke-[3]" />
        Kembali ke Landing Page
      </Link>

      {/* Sesi Aktif Prompt */}
      {existingAuth && (
        <div className="mb-4 bg-[#FFD400] p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#181818]/70 block">
              Sesi Aktif Terdeteksi:
            </span>
            <p className="text-sm sm:text-base font-black text-[#181818]">{existingAuth.user.nama}</p>
            <Badge variant="pink" size="sm" className="mt-1 text-[10px] sm:text-xs">
              Role: {existingAuth.role === "siswa" ? "Siswa" : existingAuth.role === "admin" ? "Sekretaris Kelas" : "Wali Kelas / Guru"}
            </Badge>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:flex-col gap-2 w-full sm:w-auto shrink-0">
            <Link href={redirectParam || getDashboardLinkForRole(existingAuth)} className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="gap-1.5 text-xs w-full justify-center">
                <span>Buka Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={handleLogoutAndSwitch}
              className="text-[11px] font-black text-red-600 underline text-right hover:text-red-800 shrink-0"
            >
              Ganti Akun
            </button>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <Card variant="white" shadow="xl" borderWidth="thick" className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="text-center pb-4 sm:pb-5 border-b-2 sm:border-b-3 border-[#181818]">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl sm:rounded-3xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm rotate-2 mb-2.5 sm:mb-3">
            <QrCode className="w-7 h-7 sm:w-9 sm:h-9 stroke-[2.5]" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-fredoka text-[#181818] tracking-tight">
            MASUK PORTAL KELAS
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-600 mt-1">
            Mau absen atau pantau kelas sebagai siapa hari ini?
          </p>
        </div>

        {/* 3 Role Tabs */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-[#F4F4F0] rounded-2xl brutal-border my-4 sm:my-6">
          <button
            type="button"
            onClick={() => {
              setRoleTab("siswa");
              setSiswaError("");
            }}
            className={`py-2 sm:py-2.5 px-1 sm:px-2 text-[11px] sm:text-xs md:text-sm font-black rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 ${
              roleTab === "siswa"
                ? "bg-[#3355FF] text-white brutal-border-2 brutal-shadow-sm"
                : "text-neutral-700 hover:text-black"
            }`}
          >
            <AppIcon name="student" className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full">Aku Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab("sekretaris");
              setSekretarisError("");
            }}
            className={`py-2 sm:py-2.5 px-1 sm:px-2 text-[11px] sm:text-xs md:text-sm font-black rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              roleTab === "sekretaris"
                ? "bg-[#FF7A2E] text-white brutal-border-2 brutal-shadow-sm"
                : "text-neutral-700 hover:text-black"
            }`}
          >
            <AppIcon name="secretary" className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full">Sekretaris</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab("guru");
              setGuruError("");
            }}
            className={`py-2 sm:py-2.5 px-1 sm:px-2 text-[11px] sm:text-xs md:text-sm font-black rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              roleTab === "guru"
                ? "bg-[#FF6FA5] text-[#181818] brutal-border-2 brutal-shadow-sm"
                : "text-neutral-700 hover:text-black"
            }`}
          >
            <AppIcon name="teacher" className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full">Wali Kelas</span>
          </button>
        </div>

        {/* TAB 1: FORM SISWA (NAMA + NISN) */}
        {roleTab === "siswa" && (
          <form onSubmit={handleSiswaSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 border-2 border-[#3355FF] rounded-2xl text-xs font-bold text-[#181818] flex items-start gap-2.5 leading-snug">
              <User className="w-4 h-4 text-[#3355FF] shrink-0 mt-0.5" />
              <span>Hai Siswa XI PPLG 1! Cukup masukkan Nama Lengkap &amp; 10 digit NISN kamu buat masuk (tanpa perlu PIN).</span>
            </div>

            <Input
              label="Nama Lengkap Siswa"
              placeholder="Masukkan nama lengkap siswa..."
              value={namaSiswa}
              onChange={(e) => setNamaSiswa(e.target.value)}
              helperText="Ketik Nama Lengkap sesuai yang terdaftar di kelas XI PPLG 1."
            />

            <Input
              label="Nomor Induk Siswa Nasional (NISN)"
              placeholder="Masukkan 10 digit NISN..."
              value={nisn}
              onChange={(e) => setNisn(e.target.value)}
              helperText="10 Digit NISN resmi yang ada di kartu pelajar / rapor."
            />

            {siswaError && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{siswaError}</span>
              </div>
            )}

            <Button variant="primary" size="lg" type="submit" disabled={isLoading} className="w-full justify-center mt-2 text-xs sm:text-sm font-black">
              <span>{isLoading ? "Menghubungkan Database..." : "Gass Masuk Dashboard Siswa"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* TAB 2: FORM SEKRETARIS */}
        {roleTab === "sekretaris" && (
          <form onSubmit={handleSekretarisSubmit} className="space-y-4">
            <div className="p-3 bg-orange-50 border-2 border-[#FF7A2E] rounded-2xl text-xs font-bold text-[#181818] flex items-start gap-2.5 leading-snug">
              <Shield className="w-4 h-4 text-[#FF7A2E] shrink-0 mt-0.5" />
              <span>Akses Pengurus: Buka proyektor QR kelas pagi, catat surat izin, &amp; verifikasi foto teman.</span>
            </div>

            <Input
              label="Username Sekretaris"
              placeholder="Masukkan username sekretaris..."
              value={sekretarisUser}
              onChange={(e) => setSekretarisUser(e.target.value)}
            />

            <Input
              label="Password Pengurus"
              type="password"
              placeholder="Masukkan password..."
              value={sekretarisPass}
              onChange={(e) => setSekretarisPass(e.target.value)}
            />

            {sekretarisError && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sekretarisError}</span>
              </div>
            )}

            <Button variant="orange" size="lg" type="submit" disabled={isLoading} className="w-full justify-center mt-2 text-xs sm:text-sm font-black">
              <span>{isLoading ? "Memverifikasi..." : "Buka Proyektor & Monitor Kelas"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {/* TAB 3: FORM GURU / WALI KELAS */}
        {roleTab === "guru" && (
          <form onSubmit={handleGuruSubmit} className="space-y-4">
            <div className="p-3 bg-pink-50 border-2 border-[#FF6FA5] rounded-2xl text-xs font-bold text-[#181818] flex items-start gap-2.5 leading-snug">
              <GraduationCap className="w-4 h-4 text-[#FF6FA5] shrink-0 mt-0.5" />
              <span>Akses Wali Kelas: Buka QR sholat dzuhur, pantau 46 siswa, &amp; download laporan Excel raport.</span>
            </div>

            <Input
              label="Username Wali Kelas"
              placeholder="Masukkan username wali kelas..."
              value={guruUser}
              onChange={(e) => setGuruUser(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password..."
              value={guruPass}
              onChange={(e) => setGuruPass(e.target.value)}
            />

            {guruError && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{guruError}</span>
              </div>
            )}

            <Button variant="pink" size="lg" type="submit" disabled={isLoading} className="w-full justify-center mt-2 text-xs sm:text-sm font-black">
              <span>{isLoading ? "Memverifikasi..." : "Masuk Ruang Wali Kelas"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#3355FF] bg-comic-dots-light">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-3 py-6 sm:p-6 md:p-10">
        <Suspense fallback={<div className="text-white font-black">Memuat Portal Login...</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
