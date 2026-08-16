"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  QrCode,
  ShieldCheck,
  FileSpreadsheet,
  Users,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  PlayCircle,
  PowerOff,
  Sun,
  Timer,
  Download
} from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { exportDatabaseBackupAction } from "@/app/actions/absensiActions";
import {
  getStoredAuth,
  getAbsensiRecords,
  getRekapKelas,
  getActiveQRSesi,
  getIzinRecords
} from "@/lib/store";
import { AuthSession, AbsensiRecord, RekapItemSiswa, QRSesi } from "@/lib/types";

export default function GuruDashboardPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [rekap, setRekap] = useState<RekapItemSiswa[]>([]);
  const [sesiKelas, setSesiKelas] = useState<QRSesi | null>(null);
  const [sesiSholat, setSesiSholat] = useState<QRSesi | null>(null);

  // Local ISO Date string (YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    setAuth(getStoredAuth());
    setRecords(getAbsensiRecords());
    setRekap(getRekapKelas());
    setSesiKelas(getActiveQRSesi("kehadiran_kelas"));
    setSesiSholat(getActiveQRSesi("sholat_dzuhur"));
  }, []);

  // Filter records by today and session types
  const todayKelasRecords = records.filter(
    (r) => r.jenis === "kehadiran_kelas" && r.tanggal === todayStr
  );
  const todaySholatRecords = records.filter(
    (r) => r.jenis === "sholat_dzuhur" && r.tanggal === todayStr
  );

  // Breakdown of verified (sah) vs pending per session
  const hadirKelasVerified = todayKelasRecords.filter((r) => r.status === "verified").length;
  const hadirKelasPending = todayKelasRecords.filter((r) => r.status === "pending").length;

  const hadirSholatVerified = todaySholatRecords.filter((r) => r.status === "verified").length;
  const hadirSholatPending = todaySholatRecords.filter((r) => r.status === "pending").length;

  const totalPendingToday = records.filter((r) => r.status === "pending").length;

  // Siswa needing attention (attendance rate < 80%)
  const lowAttendanceStudents = rekap.filter(
    (r) => r.kehadiranKelas.persentase < 80 || r.sholatDzuhur.persentase < 80
  );

  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Helper format time
  const formatTimeOnly = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
  };

  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await exportDatabaseBackupAction();
      if (res.success && res.backup) {
        const jsonStr = JSON.stringify(res.backup, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Backup_Database_XI_PPLG1_${new Date().toLocaleDateString("en-CA")}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert(res.message || "Gagal membuat file backup database.");
      }
    } catch {
      alert("Terjadi kendala koneksi saat mengekspor database.");
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Wali Kelas Welcome Banner */}
      <div className="bg-[#FF6FA5] text-[#181818] p-6 sm:p-8 rounded-[36px] brutal-border-thick brutal-shadow-lg relative overflow-hidden bg-comic-dots">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#FFD400] text-[#181818] px-3.5 py-1 rounded-xl brutal-border-2 font-black text-xs">
              <AppIcon name="teacher" className="w-4 h-4 text-[#3355FF]" />
              <span>RUANG WALI KELAS XI PPLG 1</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black font-fredoka leading-tight tracking-tight">
              Selamat Datang, {auth?.user.nama || "Pak Didin S.Kom"}!
            </h2>

            <p className="text-xs sm:text-sm font-bold text-neutral-800 max-w-xl">
              Pantau kedisiplinan 46 siswa XI PPLG 1, kelola sesi QR Sholat Dzuhur di mushola, serta verifikasi keaslian foto presensi secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="white"
              size="lg"
              disabled={isBackingUp}
              onClick={handleDownloadBackup}
              className="gap-2 shadow-lg font-black text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 text-[#3355FF]" />
              <span>{isBackingUp ? "Mengekspor Backup..." : "Cadangkan Database"}</span>
            </Button>

            <Link href="/dashboard/guru/qr-sholat">
              <Button variant="green" size="lg" className="gap-2 shadow-lg font-black text-xs sm:text-sm">
                <AppIcon name="mosque" className="w-5 h-5" />
                <span>{sesiSholat ? "Buka Layar QR Sholat (Aktif)" : "Buka Layar QR Sholat"}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2 Sesi Presensi Overview Cards (Status Sesi Kelas & Status Sesi Sholat) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sesi 1: Presensi Kelas Pagi */}
        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2 shadow-[2px_2px_0px_#181818]">
                <Sun className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                  SESI 1 • PAGI HARI
                </span>
                <h3 className="text-base font-black font-fredoka text-[#181818]">
                  Kehadiran Kelas Pagi
                </h3>
              </div>
            </div>

            {sesiKelas ? (
              <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-300 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span>QR Aktif</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 border border-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
                Sesi Tertutup
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-3 rounded-2xl border-2 border-neutral-200">
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase">Presensi Sah</p>
              <p className="text-2xl font-black font-fredoka text-green-600">
                {hadirKelasVerified} <span className="text-xs font-bold text-neutral-400">/ 46</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase">Menunggu Review</p>
              <p className="text-2xl font-black font-fredoka text-amber-600">
                {hadirKelasPending} <span className="text-xs font-bold text-neutral-400">Selfie</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 pt-1">
            <span className="truncate">
              Token: <span className="font-mono font-black text-[#181818]">{sesiKelas ? sesiKelas.token : "Belum Dibuka"}</span>
            </span>
            <Link
              href="/dashboard/guru/verifikasi"
              className="text-[#3355FF] font-black hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Verifikasi Kelas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Sesi 2: Presensi Sholat Dzuhur */}
        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2 shadow-[2px_2px_0px_#181818]">
                <AppIcon name="mosque" className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block">
                  SESI 2 • SIANG HARI (12:00–13:00)
                </span>
                <h3 className="text-base font-black font-fredoka text-[#181818]">
                  Sholat Dzuhur Berjamaah
                </h3>
              </div>
            </div>

            {sesiSholat ? (
              <span className="px-2.5 py-1 bg-green-100 text-green-800 border border-green-300 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span>QR Aktif</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 border border-neutral-300 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
                Belum Dibuka
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-3 rounded-2xl border-2 border-neutral-200">
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase">Presensi Sah</p>
              <p className="text-2xl font-black font-fredoka text-green-600">
                {hadirSholatVerified} <span className="text-xs font-bold text-neutral-400">/ 46</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase">Menunggu Review</p>
              <p className="text-2xl font-black font-fredoka text-amber-600">
                {hadirSholatPending} <span className="text-xs font-bold text-neutral-400">Selfie</span>
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 pt-1">
            <span className="truncate">
              Token: <span className="font-mono font-black text-[#181818]">{sesiSholat ? sesiSholat.token : "SHLT-OFFLINE"}</span>
            </span>
            <Link
              href="/dashboard/guru/qr-sholat"
              className="text-green-700 font-black hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>{sesiSholat ? "Kelola Layar QR" : "Mulai Sesi QR"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hadir Kelas */}
        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-500 uppercase">Kehadiran Kelas</span>
            <div className="w-9 h-9 rounded-xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2">
              <Sun className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black font-fredoka text-[#181818]">
              {hadirKelasVerified} <span className="text-sm font-bold text-neutral-500">/ 46</span>
            </p>
            <p className="text-[11px] font-bold text-green-600 mt-1">
              {Math.round((hadirKelasVerified / 46) * 100)}% Terverifikasi Sah
            </p>
          </div>
        </div>

        {/* Total Hadir Sholat */}
        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-500 uppercase">Hadir di Mushola</span>
            <div className="w-9 h-9 rounded-xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2">
              <AppIcon name="mosque" className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black font-fredoka text-[#181818]">
              {hadirSholatVerified} <span className="text-sm font-bold text-neutral-500">/ 46</span>
            </p>
            <p className="text-[11px] font-bold text-green-600 mt-1">
              {Math.round((hadirSholatVerified / 46) * 100)}% Jamaah Dzuhur
            </p>
          </div>
        </div>

        {/* Antrian Selfie Masuk */}
        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-500 uppercase">Antrian Foto Masuk</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border-2">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-3xl font-black font-fredoka text-amber-600">
              {totalPendingToday} <span className="text-sm font-bold text-neutral-500">Selfie</span>
            </p>
            <Link
              href="/dashboard/guru/verifikasi"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3355FF] text-white hover:bg-blue-600 text-[11px] font-black rounded-xl brutal-border-2 shadow-[2px_2px_0px_#181818] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group/btn"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Cek Keaslian Foto</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Siswa Perlu Perhatian */}
        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-500 uppercase">Perlu Perhatian</span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center brutal-border-2 border-red-300">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black font-fredoka text-red-500">
              {lowAttendanceStudents.length} <span className="text-sm font-bold text-neutral-500">Siswa</span>
            </p>
            <Link
              href="/dashboard/guru/rekap"
              className="text-[11px] font-bold text-neutral-500 hover:text-[#3355FF] hover:underline mt-1 block"
            >
              Kehadiran &lt; 80% • Cek Rekap →
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Main Action Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feature 1: QR Sholat */}
        <Card variant="white" shadow="lg" className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm">
            <AppIcon name="mosque" className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black font-fredoka text-[#181818]">
              1. Layar Proyektor QR Sholat
            </h3>
            <p className="text-xs font-bold text-neutral-600 mt-1">
              Tampilkan QR Code dinamis sholat dzuhur di mushola sekolah pada jam istirahat siang (12:00–13:00 WIB).
            </p>
          </div>
          <Link href="/dashboard/guru/qr-sholat" className="block pt-2">
            <Button variant="green" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>{sesiSholat ? "Buka Layar QR (Sedang Aktif)" : "Buka Layar QR Sholat"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        {/* Feature 2: Verifikasi Bukti Selfie */}
        <Card variant="white" shadow="lg" className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-black font-fredoka text-[#181818]">
              2. Validasi &amp; Verifikasi Bukti ({totalPendingToday})
            </h3>
            <p className="text-xs font-bold text-neutral-600 mt-1">
              Review keaslian foto selfie wajah dan verifikasi radius presensi siswa yang masuk hari ini.
            </p>
          </div>
          <Link href="/dashboard/guru/verifikasi" className="block pt-2">
            <Button variant="yellow" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Review Selfie Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        {/* Feature 3: Master Rekapitulasi */}
        <Card variant="white" shadow="lg" className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#3355FF] text-white flex items-center justify-center brutal-border brutal-shadow-sm">
            <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-black font-fredoka text-[#181818]">
              3. Master Rekapitulasi 46 Siswa
            </h3>
            <p className="text-xs font-bold text-neutral-600 mt-1">
              Pantau persentase hadir, sakit, izin, dan alpa dengan opsi download file Excel resmi 1-klik.
            </p>
          </div>
          <Link href="/dashboard/guru/rekap" className="block pt-2">
            <Button variant="primary" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Buka Master Rekap</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
