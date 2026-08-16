"use client";

import React from "react";
import Link from "next/link";
import {
  QrCode,
  Camera,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  LayoutDashboard,
  LogIn,
  Zap,
  MapPin
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge, SectionHeadingBadge } from "@/components/ui/Badge";
import { AppIcon } from "@/components/ui/AppIcon";
import { MascotVinyl } from "@/components/illustrations/MascotVinyl";
import { PopCloud } from "@/components/illustrations/Clouds";
import { RetroCRTMonitor } from "@/components/illustrations/RetroCRT";
import { HeroTopStickerBadge } from "@/components/illustrations/HeroDoodles";
import {
  ProjectorScreenIllustration,
  PhoneScannerIllustration,
  SelfieGPSIllustration,
  VerifiedCheckIllustration
} from "@/components/illustrations/StepDoodles";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Public Landing Page Navbar */}
      <Navbar />

      {/* =========================================================================
          SECTION 1: HERO SECTION (Brutal Blue: #3355FF - Clean & Balanced)
         ========================================================================= */}
      <section
        id="hero"
        className="relative w-full bg-[#3355FF] text-white border-b-5 border-[#181818] py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-comic-dots-light scroll-mt-20 sm:scroll-mt-24"
      >
        {/* Clean, Non-Colliding Ambient Background Clouds */}
        <div className="absolute top-6 left-8 opacity-35 hidden sm:block pointer-events-none">
          <PopCloud className="w-28 h-16" />
        </div>
        <div className="absolute top-8 right-12 opacity-35 hidden sm:block pointer-events-none">
          <PopCloud className="w-32 h-18" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
          {/* Left Column Text & CTA */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Clean Illustrated Top Sticker Badge */}
            <div>
              <HeroTopStickerBadge />
            </div>

            {/* Headline with Balanced High-Impact Contrast */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-fredoka leading-tight tracking-tight text-white drop-shadow-[4px_4px_0px_#181818]">
              ABSEN GAK PAKE RIBET! <br />
              <span className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2">
                <span className="bg-[#FFD400] text-[#181818] px-4 py-1 rounded-2xl brutal-border-thick brutal-shadow inline-block transform -rotate-1 hover:rotate-0 transition-transform">
                  SCAN &amp; JEPRET
                </span>
                <span className="text-[#FF6FA5] drop-shadow-[4px_4px_0px_#181818]">
                  ANTI TITIP
                </span>
              </span>
            </h1>

            {/* Tagline / Description */}
            <p className="text-sm sm:text-base md:text-lg font-bold text-white/95 max-w-2xl leading-relaxed drop-shadow-[1px_1px_0px_#181818] mx-auto lg:mx-0">
              Selamat tinggal kertas absen lecek dan drama titip absen. Cukup scan QR di proyektor kelas, jepret selfie ganteng/cantikmu, GPS langsung ngunci lokasi sekolah. Presensi pagi &amp; sholat dzuhur langsung beres hitungan detik!
            </p>

            {/* Action Buttons Group */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link href="/dashboard">
                <Button variant="yellow" size="xl" className="gap-3 group font-black">
                  <LayoutDashboard className="w-6 h-6 stroke-[3] group-hover:scale-110 transition-transform text-[#181818]" />
                  <span>Gass Absen Sekarang</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="pink" size="xl" className="gap-3 group font-black">
                  <LogIn className="w-6 h-6 stroke-[3] group-hover:rotate-12 transition-transform text-[#181818]" />
                  <span>Masuk Portal Kelas</span>
                </Button>
              </Link>
            </div>

            {/* Clean Quick Proof Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2 text-xs font-black">
              <span className="bg-white text-[#181818] px-3.5 py-1.5 rounded-xl brutal-border-2 brutal-shadow-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 stroke-[2.5]" />
                <span>46 Siswa Kompak</span>
              </span>
              <span className="bg-white text-[#181818] px-3.5 py-1.5 rounded-xl brutal-border-2 brutal-shadow-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                <span>GPS Radius Sekolah</span>
              </span>
              <span className="bg-white text-[#181818] px-3.5 py-1.5 rounded-xl brutal-border-2 brutal-shadow-sm flex items-center gap-1.5">
                <AppIcon name="mosque" className="w-4 h-4 text-emerald-700" />
                <span>Sholat Dzuhur Tepat Waktu</span>
              </span>
            </div>
          </div>

          {/* Right Column: Clean & Charming Mascot Vinyl Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative">
              {/* Single Clean Speech Bubble on Top */}
              <div className="absolute -top-8 -right-2 z-20 transform rotate-6 bg-white text-[#181818] px-4 py-2 rounded-2xl brutal-border-thick brutal-shadow font-black text-xs sm:text-sm font-fredoka flex items-center gap-1.5 animate-bounce">
                <Sparkles className="w-4 h-4 text-[#3355FF]" />
                <span>Halo XI PPLG 1!</span>
              </div>

              {/* Vinyl Robot Mascot */}
              <MascotVinyl className="w-72 h-72 sm:w-96 sm:h-96" pose="waving" />

              {/* Single Clean Bottom Tag */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-[#FF7A2E] text-white px-5 py-1.5 rounded-full brutal-border-thick brutal-shadow-sm font-black text-xs font-fredoka whitespace-nowrap flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 stroke-[3]" />
                <span>KAMERA LIVE + DETEKSI GPS ASLI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: INTRO & CRT RETRO MONITOR (Sun Yellow: #FFD400)
         ========================================================================= */}
      <section
        id="tentang"
        className="relative w-full bg-[#FFD400] text-[#181818] border-b-5 border-[#181818] py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-comic-dots scroll-mt-20 sm:scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Heading Badge */}
          <SectionHeadingBadge
            title="KENAPA HARUS APLIKASI INI?"
            subtitle="KEUNGGULAN PRESENSI DIGITAL KITA"
            badgeColor="bg-white"
          />

          <div className="text-center max-w-3xl mx-auto my-6 space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-fredoka leading-tight tracking-tight">
              Udah Bukan Zamannya Titip Absen Pake Kertas Lecek!
            </h2>
            <p className="text-base sm:text-lg font-bold text-neutral-800 leading-relaxed">
              Dibuat khusus buat kita anak XI PPLG 1. Gabungin <strong>QR Code Proyektor yang berubah terus</strong>, <strong>Live Selfie anti-galeri</strong>, dan <strong>GPS Sekolah</strong> biar rekap kelas kita selalu rapi tanpa drama.
            </p>
          </div>

          {/* Interactive CRT Simulation Monitor */}
          <RetroCRTMonitor />

          {/* 3 Pill Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-10">
            <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow text-center space-y-1">
              <span className="text-3xl sm:text-4xl font-black font-fredoka text-[#3355FF]">100% Real</span>
              <p className="text-xs sm:text-sm font-black text-[#181818] uppercase">Anti Nipu &amp; Anti Galeri</p>
              <p className="text-[11px] font-bold text-neutral-500">Wajib jepret langsung di sekolah, gak bisa comot foto lama!</p>
            </div>
            <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow text-center space-y-1">
              <span className="text-3xl sm:text-4xl font-black font-fredoka text-[#FF6FA5]">&lt; 3 Detik</span>
              <p className="text-xs sm:text-sm font-black text-[#181818] uppercase">Proses Super Kilat</p>
              <p className="text-[11px] font-bold text-neutral-500">Tinggal tap scanner, arahkan ke proyektor, beres seketika!</p>
            </div>
            <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow text-center space-y-1">
              <span className="text-3xl sm:text-4xl font-black font-fredoka text-[#6FCB6F]">1-Klik</span>
              <p className="text-xs sm:text-sm font-black text-[#181818] uppercase">Laporan Excel Otomatis</p>
              <p className="text-[11px] font-bold text-neutral-500">Guru/sekretaris tinggal download rekap bulanan tanpa pusing ngitung manual.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: FITUR UTAMA / ARCADE HIGHLIGHTS (Bubblegum Pink: #FF6FA5)
         ========================================================================= */}
      <section
        id="fitur"
        className="relative w-full bg-[#FF6FA5] text-[#181818] border-b-5 border-[#181818] py-16 md:py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20 sm:scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Heading Badge */}
          <SectionHeadingBadge
            title="FITUR PALING JAGOAN"
            subtitle="TEKNOLOGI KEREN KELAS KITA"
            badgeColor="bg-[#FFD400]"
          />

          <div className="text-center max-w-2xl mx-auto my-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-fredoka leading-tight tracking-tight text-[#181818]">
              Semua Fitur Keren Dirancang Buat XI PPLG 1
            </h2>
          </div>

          {/* 4 Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {/* Card 1 */}
            <Card variant="white" shadow="lg" className="hover:-translate-y-2 transition-transform space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#3355FF] text-white flex items-center justify-center brutal-border brutal-shadow-sm">
                <AppIcon name="qrcode" className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black font-fredoka text-[#181818]">
                1. QR Proyektor Dinamis
              </h3>
              <p className="text-sm font-bold text-neutral-700 leading-relaxed">
                Ditampilin di proyektor depan kelas. Ada limit waktunya, jadi kalo ada yang iseng screenshot bakal langsung hangus!
              </p>
              <Badge variant="blue" size="sm">Gak Bisa Di-Screenshot</Badge>
            </Card>

            {/* Card 2 */}
            <Card variant="white" shadow="lg" className="hover:-translate-y-2 transition-transform space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm">
                <AppIcon name="camera-selfie" className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black font-fredoka text-[#181818]">
                2. Selfie Asli + GPS Radius
              </h3>
              <p className="text-sm font-bold text-neutral-700 leading-relaxed">
                Bukan cuma scan, tapi wajib selfie senyum tipis di kelas. Radar GPS otomatis buktiin kamu beneran udah di sekolah.
              </p>
              <Badge variant="yellow" size="sm">Kamera Wajib Live</Badge>
            </Card>

            {/* Card 3 */}
            <Card variant="white" shadow="lg" className="hover:-translate-y-2 transition-transform space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm">
                <AppIcon name="mosque" className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black font-fredoka text-[#181818]">
                3. Presensi Sholat Dzuhur
              </h3>
              <p className="text-sm font-bold text-neutral-700 leading-relaxed">
                Pas istirahat siang, langsung scan QR di mushola sekolah (12.00–13.00 WIB). Ibadah tepat waktu bareng teman sekelas!
              </p>
              <Badge variant="green" size="sm">Mushola Sekolah</Badge>
            </Card>

            {/* Card 4 */}
            <Card variant="white" shadow="lg" className="hover:-translate-y-2 transition-transform space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FF7A2E] text-white flex items-center justify-center brutal-border brutal-shadow-sm">
                <AppIcon name="export-csv" className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black font-fredoka text-[#181818]">
                4. Rekap &amp; Export Excel
              </h3>
              <p className="text-sm font-bold text-neutral-700 leading-relaxed">
                Gak ada lagi drama sekretaris ngitung kertas lecek. Sekali klik, rekapitulasi 46 siswa langsung jadi file Excel (.xls) rapi!
              </p>
              <Badge variant="orange" size="sm">Otomatis 1-Klik</Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: TIMELINE / ALUR KERJA DENGAN ILUSTRASI VECTOR (Grass Green: #6FCB6F)
         ========================================================================= */}
      <section
        id="alur"
        className="relative w-full bg-[#6FCB6F] text-[#181818] border-b-5 border-[#181818] py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-comic-dots scroll-mt-20 sm:scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Heading Badge */}
          <SectionHeadingBadge
            title="CARA KERJA"
            subtitle="4 LANGKAH CEPAT BUAT ABSEN"
            badgeColor="bg-white"
          />

          <div className="text-center max-w-2xl mx-auto my-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-fredoka leading-tight tracking-tight text-[#181818]">
              Gini Cara Absen Harian Kamu
            </h2>
          </div>

          {/* 4 Comic Step Cards with Purposeful Vector Illustrations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 relative">
            {/* Step 1 Card */}
            <div className="bg-white p-6 rounded-3xl brutal-border-thick brutal-shadow-lg flex flex-col justify-between space-y-4 hover:-translate-y-2 transition-transform text-center relative group">
              <div className="space-y-3">
                {/* Step Illustration */}
                <div className="h-24 flex items-center justify-center">
                  <ProjectorScreenIllustration className="w-20 h-20 group-hover:scale-105 transition-transform" />
                </div>
                <div className="w-7 h-7 mx-auto rounded-full bg-[#3355FF] text-white font-black text-xs font-fredoka flex items-center justify-center brutal-border">
                  1
                </div>
                <h4 className="text-lg font-black font-fredoka text-[#181818]">
                  Tatap Proyektor
                </h4>
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  Sekretaris atau guru menampilkan QR Code aktif di layar depan kelas atau mushola.
                </p>
              </div>
              <div className="pt-2 border-t-2 border-neutral-100 text-[11px] font-black text-[#3355FF]">
                Layar Proyektor Kelas
              </div>
            </div>

            {/* Step 2 Card */}
            <div className="bg-white p-6 rounded-3xl brutal-border-thick brutal-shadow-lg flex flex-col justify-between space-y-4 hover:-translate-y-2 transition-transform text-center relative group">
              <div className="space-y-3">
                {/* Step Illustration */}
                <div className="h-24 flex items-center justify-center">
                  <PhoneScannerIllustration className="w-20 h-20 group-hover:scale-105 transition-transform" />
                </div>
                <div className="w-7 h-7 mx-auto rounded-full bg-[#FFD400] text-[#181818] font-black text-xs font-fredoka flex items-center justify-center brutal-border">
                  2
                </div>
                <h4 className="text-lg font-black font-fredoka text-[#181818]">
                  Buka Scanner HP
                </h4>
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  Buka scanner di HP kamu, arahkan kamera ke QR Code di layar proyektor.
                </p>
              </div>
              <div className="pt-2 border-t-2 border-neutral-100 text-[11px] font-black text-amber-700">
                Scan Cepat &lt; 1 Detik
              </div>
            </div>

            {/* Step 3 Card */}
            <div className="bg-white p-6 rounded-3xl brutal-border-thick brutal-shadow-lg flex flex-col justify-between space-y-4 hover:-translate-y-2 transition-transform text-center relative group">
              <div className="space-y-3">
                {/* Step Illustration */}
                <div className="h-24 flex items-center justify-center">
                  <SelfieGPSIllustration className="w-20 h-20 group-hover:scale-105 transition-transform" />
                </div>
                <div className="w-7 h-7 mx-auto rounded-full bg-[#FF6FA5] text-[#181818] font-black text-xs font-fredoka flex items-center justify-center brutal-border">
                  3
                </div>
                <h4 className="text-lg font-black font-fredoka text-[#181818]">
                  Jepret Selfie Live
                </h4>
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  Ambil selfie senyum terbaikmu di kelas. Radar GPS otomatis ngunci koordinat sekolah.
                </p>
              </div>
              <div className="pt-2 border-t-2 border-neutral-100 text-[11px] font-black text-pink-700">
                Watermark Timestamp GPS
              </div>
            </div>

            {/* Step 4 Card */}
            <div className="bg-white p-6 rounded-3xl brutal-border-thick brutal-shadow-lg flex flex-col justify-between space-y-4 hover:-translate-y-2 transition-transform text-center relative group">
              <div className="space-y-3">
                {/* Step Illustration */}
                <div className="h-24 flex items-center justify-center">
                  <VerifiedCheckIllustration className="w-20 h-20 group-hover:scale-105 transition-transform" />
                </div>
                <div className="w-7 h-7 mx-auto rounded-full bg-[#6FCB6F] text-[#181818] font-black text-xs font-fredoka flex items-center justify-center brutal-border">
                  4
                </div>
                <h4 className="text-lg font-black font-fredoka text-[#181818]">
                  Beres, Siap Belajar!
                </h4>
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  Nama kamu langsung centang hijau di daftar hadir dan otomatis masuk ke rekap kelas.
                </p>
              </div>
              <div className="pt-2 border-t-2 border-neutral-100 text-[11px] font-black text-green-700">
                Status Sah Terverifikasi ✓
              </div>
            </div>
          </div>

          {/* CTA Box Bottom */}
          <div className="mt-14 max-w-3xl mx-auto bg-white p-8 rounded-3xl brutal-border-thick brutal-shadow-xl text-center space-y-4">
            <h3 className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818]">
              Siap Absen &amp; Gas Belajar Hari Ini?
            </h3>
            <p className="text-sm font-bold text-neutral-600 max-w-xl mx-auto">
              Masuk ke akun kamu, scan QR kelas pagi, dan jadilah siswa teladan XI PPLG 1!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link href="/dashboard">
                <Button variant="primary" size="lg" className="gap-2 font-black">
                  <LayoutDashboard className="w-5 h-5 stroke-[2.5]" />
                  <span>Buka Dashboard Presensi</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="yellow" size="lg" className="font-black">
                  Masuk Portal Akun
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Public Footer */}
      <Footer />
    </div>
  );
}
