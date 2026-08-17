"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchTodayDashboardOverviewAction } from "@/app/actions/absensiActions";
import { supabase } from "@/lib/supabaseClient";
import { getJakartaDateString } from "@/lib/dateUtils";
import { getStoredAuth, getAbsensiRecords } from "@/lib/store";
import { AuthSession, AbsensiRecord, QRSesi } from "@/lib/types";

export default function DashboardSekretarisPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [activeSesi, setActiveSesi] = useState<QRSesi | null>(null);

  const loadLiveSekretarisData = async () => {
    try {
      const res = await fetchTodayDashboardOverviewAction();
      if (res.success) {
        if (res.sesiKelas) {
          const s = res.sesiKelas;
          setActiveSesi({
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
          setActiveSesi(null);
        }

        const mappedRecords: AbsensiRecord[] = (res.records || []).map((r: any) => ({
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
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);

    loadLiveSekretarisData();

    // Supabase Realtime channel
    const channel = supabase
      .channel("dashboard_sekretaris_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "qr_sessions" }, () => {
        loadLiveSekretarisData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "absensi_records" }, () => {
        loadLiveSekretarisData();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "izin_records" }, () => {
        loadLiveSekretarisData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const today = getJakartaDateString();
  const todayKelasRecords = records.filter((r) => r.jenis === "kehadiran_kelas" && r.tanggal === today);
  const pendingRecords = records.filter((r) => r.status === "pending");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Sekretaris Welcome Banner */}
      <div className="bg-[#FF7A2E] text-white p-6 sm:p-8 rounded-[36px] brutal-border-thick brutal-shadow-lg relative overflow-hidden bg-comic-dots-light">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white text-[#181818] px-3.5 py-1 rounded-xl brutal-border-2 font-black text-xs">
              <Sparkles className="w-4 h-4 text-[#FF7A2E] stroke-[2.5]" />
              <span>RUANG KERJA SEKRETARIS KELAS</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black font-fredoka leading-tight tracking-tight">
              Semangat Pagi, {auth?.user.nama.split(" ")[0] || "Sekretaris"}!
            </h2>

            <p className="text-xs sm:text-sm font-bold text-white/95 max-w-xl">
              Yuk nyalakan proyektor QR kelas pagi (06:30–07:45 WIB), cek selfie teman sekelas, dan pastikan rekapitulasi 46 siswa selalu beres!
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/sekretaris/qr-kelas">
              <Button variant="yellow" size="lg" className="gap-2 font-black">
                <QrCode className="w-5 h-5 stroke-[2.5]" />
                <span>Buka Proyektor QR Kelas</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Hadir Pagi */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
              Hadir Pagi
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#3355FF] text-white flex items-center justify-center brutal-border-2 shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818] leading-none">
              {todayKelasRecords.length} <span className="text-xs sm:text-sm font-bold text-neutral-500">/ 46</span>
            </p>
            <p className="text-[10px] sm:text-[11px] font-extrabold text-green-600 mt-1 truncate">
              {Math.round((todayKelasRecords.length / 46) * 100)}% Siswa Sudah Absen
            </p>
          </div>
        </div>

        {/* Card 2: Antrian Foto Masuk */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
              Antrean Foto
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-amber-600 leading-none">
              {pendingRecords.length} <span className="text-xs sm:text-sm font-bold text-neutral-500">Selfie</span>
            </p>
            <Link
              href="/dashboard/sekretaris/verifikasi"
              className="w-full inline-flex items-center justify-center gap-1 py-1 px-2 bg-[#3355FF] text-white hover:bg-blue-600 text-[10px] sm:text-[11px] font-black rounded-lg brutal-border-2 shadow-[1.5px_1.5px_0px_#181818] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all whitespace-nowrap"
            >
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>Verifikasi Foto</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Card 3: Status Token QR */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
              Status Token
            </span>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${activeSesi ? "bg-[#6FCB6F] text-[#181818]" : "bg-neutral-200 text-neutral-500"} flex items-center justify-center brutal-border-2 shrink-0`}>
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            {activeSesi ? (
              <>
                <p className="text-xs sm:text-sm font-black text-[#181818] font-mono truncate">
                  {activeSesi.token}
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold text-green-600 mt-0.5 truncate">
                  Aktif • Siap di Proyektor
                </p>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm font-black text-neutral-400 font-mono">
                  BELUM AKTIF
                </p>
                <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 mt-0.5">
                  Sesi Belum Dibuat
                </p>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Total Siswa XI PPLG 1 */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black text-neutral-500 uppercase tracking-wider">
              Total Siswa
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818] leading-none">
              46 <span className="text-xs sm:text-sm font-bold text-neutral-500">Siswa</span>
            </p>
            <p className="text-[10px] sm:text-[11px] font-bold text-neutral-500 mt-1 truncate">
              Data Lengkap &amp; Sinkron
            </p>
          </div>
        </div>
      </div>

      {/* 4 Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="white" shadow="lg" className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#3355FF] text-white flex items-center justify-center brutal-border brutal-shadow-sm">
              <QrCode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black font-fredoka text-[#181818]">
                1. Layar Proyektor Kelas
              </h3>
              <p className="text-xs font-bold text-neutral-600 mt-1">
                Nyalakan QR Code sesi pagi di proyektor depan kelas. Dilengkapi timer otomatis anti-screenshot.
              </p>
            </div>
          </div>
          <Link href="/dashboard/sekretaris/qr-kelas" className="block pt-2">
            <Button variant="primary" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Buka Proyektor Pagi</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        <Card variant="white" shadow="lg" className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black font-fredoka text-[#181818]">
                2. Verifikasi Selfie ({pendingRecords.length})
              </h3>
              <p className="text-xs font-bold text-neutral-600 mt-1">
                Cek keaslian foto wajah dan radius GPS teman sekelas yang baru aja ngirim presensi.
              </p>
            </div>
          </div>
          <Link href="/dashboard/sekretaris/verifikasi" className="block pt-2">
            <Button variant="yellow" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Review Foto Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        <Card variant="white" shadow="lg" className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm">
              <FileText className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black font-fredoka text-[#181818]">
                3. Catat Surat Izin / Sakit
              </h3>
              <p className="text-xs font-bold text-neutral-600 mt-1">
                Input data siswa yang berhalangan hadir beserta lampiran foto surat dokter atau surat ortu.
              </p>
            </div>
          </div>
          <Link href="/dashboard/sekretaris/izin" className="block pt-2">
            <Button variant="green" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Input Izin / Sakit</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        <Card variant="white" shadow="lg" className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border brutal-shadow-sm">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black font-fredoka text-[#181818]">
                4. Rekapitulasi 46 Siswa
              </h3>
              <p className="text-xs font-bold text-neutral-600 mt-1">
                Hitung persentase kehadiran bulanan, rincian sakit/izin/alpa, dan export ke file Excel (.xls).
              </p>
            </div>
          </div>
          <Link href="/dashboard/guru/rekap" className="block pt-2">
            <Button variant="pink" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Buka Master Rekap</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
