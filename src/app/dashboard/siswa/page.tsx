"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getStoredAuth } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { getJakartaDateString } from "@/lib/dateUtils";
import { AuthSession, AbsensiRecord, IzinRecord, Siswa, JenisAbsensi, StatusAbsensi, KategoriIzin } from "@/lib/types";

export default function DashboardSiswaPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [izinList, setIzinList] = useState<IzinRecord[]>([]);

  const studentId = auth && auth.role === "siswa" ? auth.user.id : 0;

  const loadLiveSiswaData = async (sid?: number) => {
    const targetSid = sid || studentId;
    if (!targetSid) return;

    const [{ data: dbRecords }, { data: dbIzins }] = await Promise.all([
      supabase
        .from('absensi_records')
        .select('*')
        .eq('siswa_id', targetSid)
        .order('waktu_absen', { ascending: false }),
      supabase
        .from('izin_records')
        .select('*')
        .eq('siswa_id', targetSid)
        .order('waktu_pengajuan', { ascending: false })
    ]);

    if (dbRecords) {
      const mapped: AbsensiRecord[] = dbRecords.map((r: any) => ({
        id: r.id,
        siswaId: r.siswa_id,
        siswa: {
          id: r.siswa_id,
          nis: '',
          nama: auth?.user.nama || 'Siswa',
          nomorAbsen: (auth?.user as Siswa)?.nomorAbsen || 0,
          gender: (auth?.user as Siswa)?.gender || 'L',
        },
        qrSesiId: r.qr_sesi_id,
        jenis: r.jenis as JenisAbsensi,
        tanggal: r.tanggal,
        waktuAbsen: r.waktu_absen,
        status: r.status as StatusAbsensi,
        fotoUrl: r.foto_storage_path,
        timestampServer: r.created_at || r.waktu_absen,
        diverifikasiOleh: r.diverifikasi_oleh,
        waktuVerifikasi: r.waktu_verifikasi,
        alasanPenolakan: r.alasan_penolakan,
      }));
      setRecords(mapped);
    }

    if (dbIzins) {
      const mappedIzin: IzinRecord[] = dbIzins.map((i: any) => ({
        id: i.id,
        siswaId: i.siswa_id,
        siswa: {
          id: i.siswa_id,
          nis: '',
          nama: auth?.user.nama || 'Siswa',
          nomorAbsen: (auth?.user as Siswa)?.nomorAbsen || 0,
          gender: (auth?.user as Siswa)?.gender || 'L',
        },
        jenis: i.jenis as KategoriIzin,
        tanggal: i.tanggal,
        keterangan: i.keterangan,
        suratFotoUrl: i.surat_storage_path,
        status: i.status as StatusAbsensi,
        waktuPengajuan: i.waktu_pengajuan,
        diverifikasiOleh: i.diverifikasi_oleh,
        waktuVerifikasi: i.waktu_verifikasi,
        alasanPenolakan: i.alasan_penolakan,
      }));
      setIzinList(mappedIzin);
    }
  };

  useEffect(() => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);

    if (currentAuth && currentAuth.role === "siswa") {
      loadLiveSiswaData(currentAuth.user.id);
    }

    // Realtime channel
    const channel = supabase
      .channel('realtime_dashboard_siswa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absensi_records' }, () => {
        if (currentAuth && currentAuth.role === "siswa") {
          loadLiveSiswaData(currentAuth.user.id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'izin_records' }, () => {
        if (currentAuth && currentAuth.role === "siswa") {
          loadLiveSiswaData(currentAuth.user.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const today = getJakartaDateString();
  const todayKelasRecord = records.find((r) => r.jenis === "kehadiran_kelas" && r.tanggal === today);
  const todaySholatRecord = records.find((r) => r.jenis === "sholat_dzuhur" && r.tanggal === today);

  const hadirKelasCount = records.filter((r) => r.jenis === "kehadiran_kelas" && r.status === "verified").length;
  const hadirSholatCount = records.filter((r) => r.jenis === "sholat_dzuhur" && r.status === "verified").length;
  const sakitCount = izinList.filter((i) => i.jenis === "Sakit").length;
  const izinCount = izinList.filter((i) => i.jenis === "Izin" || i.jenis === "Dispensasi").length;
  const pendingCount = records.filter((r) => r.status === "pending").length + izinList.filter((i) => i.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Student Profile & Quick Presensi Banner */}
      <div className="bg-[#3355FF] text-white p-6 sm:p-8 rounded-[36px] brutal-border-thick brutal-shadow-lg relative overflow-hidden bg-comic-dots-light">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-[#FFD400] text-[#181818] px-3.5 py-1 rounded-xl brutal-border-2 font-black text-xs">
              <AppIcon name="student" className="w-4 h-4 text-[#3355FF]" />
              <span>PORTAL SISWA XI PPLG 1</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black font-fredoka leading-tight tracking-tight">
              Yo, {auth?.user.nama.split(" ")[0] || "Siswa"}! Udah di Kelas?
            </h2>

            {auth && auth.role === "siswa" && (
              <p className="text-xs sm:text-sm font-bold text-white/90">
                NISN: <strong className="font-mono text-[#FFD400]">{(auth.user as Siswa).nis}</strong> • Absen: <strong className="font-mono text-[#FFD400]">#{(auth.user as Siswa).nomorAbsen}</strong> • Kelas XI PPLG 1
              </p>
            )}
          </div>

          <Link href="/dashboard/siswa/absen">
            <Button variant="yellow" size="xl" className="gap-2.5 shadow-lg">
              <AppIcon name="camera-selfie" className="w-6 h-6" />
              <span>SCAN PRESENSI SEKARANG</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Today Status: 2 Cards (Kelas Pagi & Sholat Dzuhur) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sesi 1: Kehadiran Kelas */}
        <Card variant="white" shadow="lg" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-200">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2 brutal-shadow-sm">
                <AppIcon name="sun" className="w-7 h-7 text-[#181818]" />
              </div>
              <div>
                <h3 className="text-lg font-black font-fredoka text-[#181818]">
                  Presensi Kelas Pagi
                </h3>
                <span className="text-[11px] font-bold text-neutral-500">
                  Target: 06:30 – 07:45 WIB
                </span>
              </div>
            </div>
            <Badge variant={todayKelasRecord ? (todayKelasRecord.status === "verified" ? "verified" : "pending") : "yellow"} size="sm">
              {todayKelasRecord ? (todayKelasRecord.status === "verified" ? "HADIR VALID" : "MENUNGGU REVIEW") : "BELUM ABSEN"}
            </Badge>
          </div>

          {todayKelasRecord ? (
            <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-400 space-y-2">
              <div className="flex items-center gap-2 text-green-800 font-bold text-xs">
                <AppIcon name="check" className="w-4 h-4 text-green-600" />
                <span>Mantap! Presensi pagi kamu udah kecatat pukul {new Date(todayKelasRecord.waktuAbsen).toLocaleTimeString("id-ID")} WIB</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3">
              <p className="text-xs font-bold text-neutral-700">
                Kamu belum absen masuk kelas hari ini. Scan QR yang lagi nyala di proyektor depan yuk!
              </p>
              <Link href="/dashboard/siswa/absen" className="block">
                <Button variant="primary" size="sm" className="w-full justify-center gap-1.5 text-xs">
                  <AppIcon name="qr-scan" className="w-4 h-4" />
                  <span>Scan QR Kelas Pagi</span>
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Sesi 2: Sholat Dzuhur */}
        <Card variant="white" shadow="lg" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-neutral-200">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2 brutal-shadow-sm">
                <AppIcon name="mosque" className="w-7 h-7 text-[#181818]" />
              </div>
              <div>
                <h3 className="text-lg font-black font-fredoka text-[#181818]">
                  Sholat Dzuhur Berjamaah
                </h3>
                <span className="text-[11px] font-bold text-neutral-500">
                  Wajib: 12:00 – 13:00 WIB (Mushola)
                </span>
              </div>
            </div>
            <Badge variant={todaySholatRecord ? (todaySholatRecord.status === "verified" ? "verified" : "pending") : "green"} size="sm">
              {todaySholatRecord ? (todaySholatRecord.status === "verified" ? "SUDAH SHOLAT" : "MENUNGGU REVIEW") : "BELUM ABSEN"}
            </Badge>
          </div>

          {todaySholatRecord ? (
            <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-400 space-y-2">
              <div className="flex items-center gap-2 text-green-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Alhamdulillah! Presensi sholat kamu udah kecatat pukul {new Date(todaySholatRecord.waktuAbsen).toLocaleTimeString("id-ID")} WIB</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-300 space-y-3">
              <p className="text-xs font-bold text-neutral-700">
                Pas istirahat siang kedua, jangan lupa scan QR sholat di mushola sekolah ya!
              </p>
              <Link href="/dashboard/siswa/absen" className="block">
                <Button variant="green" size="sm" className="w-full justify-center gap-1.5 text-xs">
                  <AppIcon name="mosque" className="w-4 h-4" />
                  <span>Scan QR Sholat Dzuhur</span>
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl brutal-border-thick brutal-shadow flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-neutral-500 uppercase">Hadir Kelas</p>
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-[#FF6FA5]">{hadirKelasCount} Hari</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2">
            <AppIcon name="sun" className="w-6 h-6 text-[#181818]" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl brutal-border-thick brutal-shadow flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-neutral-500 uppercase">Sholat Dzuhur</p>
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-[#6FCB6F]">{hadirSholatCount} Hari</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2">
            <AppIcon name="mosque" className="w-6 h-6 text-[#181818]" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl brutal-border-thick brutal-shadow flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-neutral-500 uppercase">Surat Sakit</p>
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-red-500">{sakitCount} Hari</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center brutal-border-2 border-red-400">
            <AppIcon name="doctor" className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl brutal-border-thick brutal-shadow flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black text-neutral-500 uppercase">Izin / Dispen</p>
            <p className="text-2xl sm:text-3xl font-black font-fredoka text-blue-600">{izinCount} Hari</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center brutal-border-2 border-blue-400">
            <AppIcon name="export-csv" className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Shortcuts Grid: Pengajuan Izin & Riwayat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Izin Card */}
        <div className="bg-[#FFD400] p-5 sm:p-6 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#181818] text-[#FFD400] flex items-center justify-center brutal-border-2 shrink-0">
              <AppIcon name="doctor" className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black font-fredoka text-[#181818]">
                Lagi Berhalangan Hadir? Kirim Surat Izin
              </h4>
              <p className="text-xs font-bold text-[#181818]/80 mt-0.5">
                Jangan alpa ya! Upload surat dokter atau surat ortu biar dicatat resmi sama sekretaris &amp; Guru.
              </p>
            </div>
          </div>

          <Link href="/dashboard/siswa/izin" className="self-end w-full sm:w-auto">
            <Button variant="primary" size="sm" className="gap-2 w-full justify-center text-xs">
              <span>Isi Form Izin Online</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Recent History Shortcut */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
              <History className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-base font-black font-fredoka text-[#181818]">
                Cek Riwayat &amp; Bukti Selfie Kamu
              </h4>
              <p className="text-xs font-bold text-neutral-500 mt-0.5">
                Lihat status verifikasi, jam absen masuk kelas, dan foto selfie kamu setiap harinya.
              </p>
            </div>
          </div>

          <Link href="/dashboard/siswa/riwayat" className="self-end w-full sm:w-auto">
            <Button variant="pink" size="sm" className="gap-2 w-full justify-center text-xs">
              <span>Buka Rekam Jejak</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
