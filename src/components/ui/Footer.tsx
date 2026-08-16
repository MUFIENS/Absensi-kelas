import React from "react";
import Link from "next/link";
import {
  QrCode,
  Heart,
  Sparkles,
  Shield,
  CheckCircle,
  Lock,
  Camera,
  Clock,
  Play,
  School,
  GraduationCap,
  Zap,
  Target
} from "lucide-react";
import { PopCloud, PopStar } from "../illustrations/Clouds";

export function Footer() {
  return (
    <footer className="relative w-full bg-[#181818] text-white border-t-5 border-[#181818] pt-16 pb-12 overflow-hidden select-none">
      {/* Decorative stars */}
      <div className="absolute top-6 left-10 opacity-30">
        <PopStar fill="#FFD400" className="w-12 h-12" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <PopStar fill="#FF6FA5" className="w-16 h-16" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b-3 border-neutral-800">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm rotate-3">
                <QrCode className="w-7 h-7 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black font-fredoka text-white tracking-tight">
                ABSENSI<span className="text-[#FFD400]">QR</span> <span className="text-[#FF6FA5]">XI PPLG 1</span>
              </span>
            </div>
            <p className="text-neutral-400 font-medium text-sm max-w-md leading-relaxed">
              Sistem presensi kelas berbasis Dynamic QR Code & Live Camera Selfie Verification. Mengurangi kecurangan titip absen dan mengotomatiskan rekapitulasi kehadiran kelas & sholat Dzuhur 46 siswa.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-[#3355FF] text-white text-xs font-black px-3 py-1 rounded-full brutal-border-2 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Dynamic Token Expiry</span>
              </span>
              <span className="bg-[#6FCB6F] text-[#181818] text-xs font-black px-3 py-1 rounded-full brutal-border-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Live Camera Required</span>
              </span>
              <span className="bg-[#FF7A2E] text-white text-xs font-black px-3 py-1 rounded-full brutal-border-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Sholat Dzuhur 12:00-13:00</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-black font-fredoka uppercase text-[#FFD400] tracking-wider mb-4">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2.5 text-sm font-bold text-neutral-300">
              <li>
                <Link href="/" className="hover:text-[#FFD400] transition-colors flex items-center gap-1.5">
                  <Play className="w-3 h-3 fill-[#FFD400] text-[#FFD400]" />
                  <span>Beranda Utama</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#FFD400] transition-colors flex items-center gap-1.5">
                  <Play className="w-3 h-3 fill-[#FFD400] text-[#FFD400]" />
                  <span>Portal Login</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#FFD400] transition-colors flex items-center gap-1.5">
                  <Play className="w-3 h-3 fill-[#FFD400] text-[#FFD400]" />
                  <span>Dashboard Aplikasi</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Info Kelas */}
          <div>
            <h4 className="text-base font-black font-fredoka uppercase text-[#FF6FA5] tracking-wider mb-4">
              Identitas Kelas
            </h4>
            <div className="bg-neutral-900 p-4 rounded-2xl border-2 border-neutral-700 space-y-2 text-xs font-bold text-neutral-300">
              <p className="flex items-center gap-2">
                <School className="w-4 h-4 text-[#3355FF] shrink-0" />
                <span><span className="text-white font-extrabold">Sekolah:</span> SMKN 1 Ciomas (XI PPLG 1)</span>
              </p>
              <p className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#FF6FA5] shrink-0" />
                <span><span className="text-white font-extrabold">Wali Kelas:</span> Pak Didin Sahrudin, S.Kom</span>
              </p>
              <p className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFD400] shrink-0" />
                <span><span className="text-white font-extrabold">Sekretaris:</span> Dhara &amp; Rezqia</span>
              </p>
              <p className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#6FCB6F] shrink-0" />
                <span><span className="text-white font-extrabold">Status:</span> Live Production UI</span>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-neutral-400">
          <p>© 2026 XI PPLG 1. Dibuat dengan arsitektur Neo-Brutalism.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-extrabold">System Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
