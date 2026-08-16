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
import { Badge } from "@/components/ui/Badge";
import {
  getStoredAuth,
  getAbsensiRecords,
  getActiveQRSesi
} from "@/lib/store";
import { AuthSession, AbsensiRecord } from "@/lib/types";

export default function DashboardSekretarisPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);

  useEffect(() => {
    setAuth(getStoredAuth());
    setRecords(getAbsensiRecords());
  }, []);

  const today = new Date().toLocaleDateString("en-CA");
  const todayKelasRecords = records.filter((r) => r.jenis === "kehadiran_kelas" && r.tanggal === today);
  const pendingRecords = records.filter((r) => r.status === "pending");
  const activeSesi = getActiveQRSesi("kehadiran_kelas");

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-500 uppercase">Hadir Pagi Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-[#3355FF] text-white flex items-center justify-center brutal-border-2">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black font-fredoka text-[#181818]">
              {todayKelasRecords.length} <span className="text-sm font-bold text-neutral-500">/ 46</span>
            </p>
            <p className="text-[11px] font-bold text-green-600 mt-1">
              {Math.round((todayKelasRecords.length / 46) * 100)}% Siswa Sudah Absen
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-500 uppercase">Antrian Foto Masuk</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border-2">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-3xl font-black font-fredoka text-amber-600">
              {pendingRecords.length} <span className="text-sm font-bold text-neutral-500">Selfie</span>
            </p>
            <Link
              href="/dashboard/sekretaris/verifikasi"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3355FF] text-white hover:bg-blue-600 text-[11px] font-black rounded-xl brutal-border-2 shadow-[2px_2px_0px_#181818] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group/btn"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Cek Keaslian Foto</span>
              <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-500 uppercase">Status Token QR</span>
            <div className="w-9 h-9 rounded-xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2">
              <QrCode className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm font-black text-[#181818] font-mono">
              {activeSesi ? activeSesi.token : "KLAS-AKTIF"}
            </p>
            <p className="text-[11px] font-bold text-green-600 mt-1">
              Siap di Proyektor
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-neutral-500 uppercase">Total Siswa XI PPLG 1</span>
            <div className="w-9 h-9 rounded-xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-black font-fredoka text-[#181818]">
              46 <span className="text-sm font-bold text-neutral-500">Siswa</span>
            </p>
            <p className="text-[11px] font-bold text-neutral-500 mt-1">
              Data Lengkap & Sinkron
            </p>
          </div>
        </div>
      </div>

      {/* 3 Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="white" shadow="lg" className="space-y-4">
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
          <Link href="/dashboard/sekretaris/qr-kelas" className="block pt-2">
            <Button variant="primary" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Buka Proyektor Pagi</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        <Card variant="white" shadow="lg" className="space-y-4">
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
          <Link href="/dashboard/sekretaris/verifikasi" className="block pt-2">
            <Button variant="yellow" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Review Foto Masuk</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>

        <Card variant="white" shadow="lg" className="space-y-4">
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
          <Link href="/dashboard/sekretaris/izin" className="block pt-2">
            <Button variant="green" size="md" className="w-full justify-center gap-2 text-xs font-black">
              <span>Input Izin / Sakit</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
