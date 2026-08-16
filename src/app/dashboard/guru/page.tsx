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
import { exportDatabaseBackupAction, fetchRekapKelasAction, fetchTodayDashboardOverviewAction } from "@/app/actions/absensiActions";
import { supabase } from "@/lib/supabaseClient";
import { getJakartaDateString } from "@/lib/dateUtils";
import {
  getStoredAuth,
  getAbsensiRecords,
  getRekapKelas,
  getActiveQRSesi,
} from "@/lib/store";
import { AuthSession, AbsensiRecord, RekapItemSiswa, QRSesi } from "@/lib/types";

export default function GuruDashboardPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [rekap, setRekap] = useState<RekapItemSiswa[]>([]);
  const [sesiKelas, setSesiKelas] = useState<QRSesi | null>(null);
  const [sesiSholat, setSesiSholat] = useState<QRSesi | null>(null);

  // Local ISO Date string in Asia/Jakarta (WIB)
  const todayStr = getJakartaDateString();

  const loadLiveDashboardData = async () => {
    const now = new Date();
    try {
      const [overviewRes, rekapRes] = await Promise.all([
        fetchTodayDashboardOverviewAction(),
        fetchRekapKelasAction(now.getMonth() + 1, now.getFullYear()),
      ]);

      if (overviewRes.success) {
        if (overviewRes.sesiKelas) {
          const s = overviewRes.sesiKelas;
          setSesiKelas({
            id: s.id,
            jenis: 'kehadiran_kelas',
            token: s.token,
            qrUrl: s.qr_url,
            tanggal: s.tanggal,
            waktuMulai: s.waktu_mulai,
            waktuBerakhir: s.waktu_berakhir,
            adminId: s.admin_id || 1,
            adminName: s.admin_name,
            durationMinutes: s.duration_minutes,
            isActive: s.is_active,
            createdAt: s.created_at,
          });
        } else {
          setSesiKelas(null);
        }

        if (overviewRes.sesiSholat) {
          const s = overviewRes.sesiSholat;
          setSesiSholat({
            id: s.id,
            jenis: 'sholat_dzuhur',
            token: s.token,
            qrUrl: s.qr_url,
            tanggal: s.tanggal,
            waktuMulai: s.waktu_mulai,
            waktuBerakhir: s.waktu_berakhir,
            adminId: s.admin_id || 2,
            adminName: s.admin_name,
            durationMinutes: s.duration_minutes,
            isActive: s.is_active,
            createdAt: s.created_at,
          });
        } else {
          setSesiSholat(null);
        }

        const mappedRecords: AbsensiRecord[] = (overviewRes.records || []).map((r: any) => ({
          id: r.id,
          siswaId: r.siswa_id,
          siswa: {
            id: r.siswa_id,
            nama: "Siswa XI PPLG 1",
            nis: "",
            nomorAbsen: 0,
            gender: "L",
          },
          qrSesiId: r.qr_sesi_id,
          jenis: r.jenis,
          tanggal: r.tanggal,
          waktuAbsen: r.waktu_absen,
          status: r.status,
          diverifikasiOleh: r.diverifikasi_oleh,
          waktuVerifikasi: r.waktu_verifikasi,
          alasanPenolakan: r.alasan_penolakan,
          fotoUrl: r.foto_storage_path,
          timestampServer: r.created_at || r.waktu_absen,
        }));
        setRecords(mappedRecords);
      }

      if (rekapRes.success && rekapRes.rekap) {
        setRekap(rekapRes.rekap);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);

    loadLiveDashboardData();

    // Supabase Realtime listener on qr_sessions, absensi_records, and izin_records
    const channel = supabase
      .channel("dashboard_guru_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "qr_sessions" }, () => {
        loadLiveDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "absensi_records" }, () => {
        loadLiveDashboardData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "izin_records" }, () => {
        loadLiveDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  // Siswa needing attention (attendance rate < 80% ONLY if attendance sessions have actually run)
  const lowAttendanceStudents = rekap.filter(
    (r) =>
      ((r.kehadiranKelas.hariBerjalan ?? 0) > 0 && r.kehadiranKelas.persentase < 80) ||
      ((r.sholatDzuhur.hariBerjalan ?? 0) > 0 && r.sholatDzuhur.persentase < 80)
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

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
            {/* Backup Database Button */}
            <button
              type="button"
              disabled={isBackingUp}
              onClick={handleDownloadBackup}
              className="group relative flex items-center justify-center sm:justify-start gap-3 px-4 sm:px-5 py-3 bg-white hover:bg-neutral-50 text-[#181818] rounded-2xl brutal-border-2 brutal-shadow font-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-60 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#3355FF] text-white brutal-border-2 flex items-center justify-center shadow-[1.5px_1.5px_0px_#181818] shrink-0 group-hover:scale-105 transition-transform">
                <Download className={`w-4 h-4 text-white stroke-[2.5] ${isBackingUp ? "animate-bounce" : ""}`} />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-neutral-500 font-extrabold uppercase block tracking-wider leading-none mb-1">
                  Keamanan Data
                </span>
                <span className="text-xs sm:text-sm font-black font-fredoka text-[#181818] block leading-tight">
                  {isBackingUp ? "Mengekspor JSON..." : "Cadangkan Database"}
                </span>
              </div>
            </button>

            {/* Ekspor Rekap Button */}
            <Link href="/dashboard/guru/rekap" className="block">
              <button
                type="button"
                className="w-full group relative flex items-center justify-center sm:justify-start gap-3 px-4 sm:px-5 py-3 bg-[#FFD400] hover:bg-[#ffe033] text-[#181818] rounded-2xl brutal-border-2 brutal-shadow font-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white text-[#181818] brutal-border-2 flex items-center justify-center shadow-[1.5px_1.5px_0px_#181818] shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-neutral-800 font-extrabold uppercase block tracking-wider leading-none mb-1">
                    Laporan
                  </span>
                  <span className="text-xs sm:text-sm font-black font-fredoka text-[#181818] block leading-tight">
                    Ekspor Rekap
                  </span>
                </div>
              </button>
            </Link>

            {/* QR Sholat Button */}
            <Link href="/dashboard/guru/qr-sholat" className="block">
              <button
                type="button"
                className="w-full group relative flex items-center justify-center sm:justify-start gap-3 px-4 sm:px-5 py-3 bg-[#6FCB6F] hover:bg-[#5db85d] text-[#181818] rounded-2xl brutal-border-2 brutal-shadow font-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white text-[#181818] brutal-border-2 flex items-center justify-center shadow-[1.5px_1.5px_0px_#181818] shrink-0 group-hover:scale-105 transition-transform">
                  <AppIcon name="mosque" className="w-5 h-5 text-green-700" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-neutral-800 font-extrabold uppercase block tracking-wider leading-none mb-1">
                    Sesi Mushola
                  </span>
                  <span className="text-xs sm:text-sm font-black font-fredoka text-[#181818] block leading-tight">
                    {sesiSholat ? "QR Sholat (Aktif)" : "Layar QR Sholat"}
                  </span>
                </div>
              </button>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Hadir Kelas */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
              Hadir Kelas
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818] leading-none">
              {hadirKelasVerified} <span className="text-xs sm:text-sm font-bold text-neutral-500">/ 46</span>
            </p>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 font-extrabold text-[10px] sm:text-[11px] rounded-lg brutal-border-2 border-green-300 w-full justify-between">
              <span>Status</span>
              <span>{Math.round((hadirKelasVerified / 46) * 100)}% Sah</span>
            </div>
          </div>
        </div>

        {/* Total Hadir Sholat */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
              Hadir Sholat
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
              <AppIcon name="mosque" className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818] leading-none">
              {hadirSholatVerified} <span className="text-xs sm:text-sm font-bold text-neutral-500">/ 46</span>
            </p>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] sm:text-[11px] rounded-lg brutal-border-2 border-emerald-300 w-full justify-between">
              <span>Mushola</span>
              <span>{Math.round((hadirSholatVerified / 46) * 100)}% Jamaah</span>
            </div>
          </div>
        </div>

        {/* Antrian Selfie Masuk */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
              Antrian Selfie
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-amber-600 leading-none">
              {totalPendingToday} <span className="text-xs sm:text-sm font-bold text-neutral-500">Selfie</span>
            </p>
            <Link
              href="/dashboard/guru/verifikasi"
              className="inline-flex items-center justify-between px-2.5 py-1 bg-[#3355FF] text-white hover:bg-blue-600 text-[10px] sm:text-[11px] font-black rounded-lg brutal-border-2 shadow-[1.5px_1.5px_0px_#181818] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group/btn w-full"
            >
              <span>Verifikasi</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform shrink-0" />
            </Link>
          </div>
        </div>

        {/* Siswa Perlu Perhatian */}
        <div className="bg-white p-3.5 sm:p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
              Perlu Perhatian
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center brutal-border-2 border-red-300 shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-red-500 leading-none">
              {lowAttendanceStudents.length} <span className="text-xs sm:text-sm font-bold text-neutral-500">Siswa</span>
            </p>
            <Link
              href="/dashboard/guru/rekap"
              className="inline-flex items-center justify-between px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] sm:text-[11px] font-black rounded-lg brutal-border-2 border-red-300 transition-all group/btn w-full"
            >
              <span className="truncate">Presensi &lt; 80%</span>
              <span className="flex items-center gap-1 shrink-0 font-bold">
                Cek <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </span>
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
