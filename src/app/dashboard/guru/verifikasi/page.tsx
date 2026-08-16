"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Users,
  Clock,
  CheckSquare,
  ArrowLeft,
  MapPin,
  ExternalLink,
  Calendar,
  CalendarDays,
  Sparkles,
  Sun,
  Layers
} from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import {
  getStoredAuth
} from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { verifyAbsensiAction, getSignedMediaUrlAction } from "@/app/actions/absensiActions";
import { AuthSession, AbsensiRecord, JenisAbsensi, StatusAbsensi } from "@/lib/types";

const jenisSesiOptions = [
  { value: "all", label: "Semua Sesi (Gabung)" },
  { value: "kehadiran_kelas", label: "Kehadiran Kelas Pagi" },
  { value: "sholat_dzuhur", label: "Sholat Dzuhur Mushola" },
];

export default function GuruVerifikasiPage() {
  const searchParams = useSearchParams();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | StatusAbsensi>("pending");

  // Read initial session from URL query param if present
  const initialSesiParam = searchParams.get("sesi") as JenisAbsensi | "all" | null;
  const [jenisFilter, setJenisFilter] = useState<"all" | JenisAbsensi>(
    initialSesiParam === "kehadiran_kelas" || initialSesiParam === "sholat_dzuhur"
      ? initialSesiParam
      : "all"
  );

  // Date Filter (Default to Today in Local YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString("en-CA");
  const [dateFilter, setDateFilter] = useState<string>(todayStr);

  const [reviewingRecord, setReviewingRecord] = useState<AbsensiRecord | null>(null);
  const [signedPhotoUrl, setSignedPhotoUrl] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const refreshRecords = async () => {
    const { data: dbRecords } = await supabase
      .from('absensi_records')
      .select('*, siswa (*)')
      .order('waktu_absen', { ascending: false });

    if (dbRecords) {
      const mapped: AbsensiRecord[] = dbRecords.map((r: any) => ({
        id: r.id,
        siswaId: r.siswa_id,
        siswa: {
          id: r.siswa_id,
          nis: r.siswa?.nisn || '',
          nama: r.siswa?.nama || `Siswa #${r.siswa_id}`,
          nomorAbsen: r.siswa?.nomor_absen || 0,
          gender: (r.siswa?.gender || 'L') as 'L' | 'P',
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
  };

  useEffect(() => {
    setAuth(getStoredAuth());
    refreshRecords();

    // Supabase Realtime Subscription untuk antrean guru
    const channel = supabase
      .channel('realtime_guru_verifikasi')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'absensi_records',
        },
        () => {
          refreshRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenReview = async (record: AbsensiRecord) => {
    setReviewingRecord(record);
    if (record.fotoUrl) {
      if (record.fotoUrl.startsWith("data:") || record.fotoUrl.startsWith("http")) {
        setSignedPhotoUrl(record.fotoUrl);
      } else {
        const res = await getSignedMediaUrlAction('absensi-selfies', record.fotoUrl);
        setSignedPhotoUrl(res.success ? res.url : '');
      }
    } else {
      setSignedPhotoUrl('');
    }
  };

  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr || dateStr === "all") return "Semua Tanggal";
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      return `${days[date.getDay()]}, ${d} ${months[m - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  // 1. Filter by Date
  const dateFilteredRecords = records.filter((r) => {
    if (dateFilter !== "all" && r.tanggal !== dateFilter) return false;
    return true;
  });

  // Session counts per date (for the Sesi pills)
  const countAllSesi = dateFilteredRecords.length;
  const countKelasSesi = dateFilteredRecords.filter((r) => r.jenis === "kehadiran_kelas").length;
  const countSholatSesi = dateFilteredRecords.filter((r) => r.jenis === "sholat_dzuhur").length;

  // 2. Filter by Date AND Active Session (jenisFilter)
  const sessionAndDateFilteredRecords = dateFilteredRecords.filter((r) => {
    if (jenisFilter !== "all" && r.jenis !== jenisFilter) return false;
    return true;
  });

  // 3. Filter by Status on the active session
  const filteredRecords = sessionAndDateFilteredRecords.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  // Strict counts based on active date AND active session
  const pendingCount = sessionAndDateFilteredRecords.filter((r) => r.status === "pending").length;
  const verifiedCount = sessionAndDateFilteredRecords.filter((r) => r.status === "verified").length;
  const rejectedCount = sessionAndDateFilteredRecords.filter((r) => r.status === "rejected").length;
  const totalCount = sessionAndDateFilteredRecords.length;

  const handleApprove = async (recordId: number) => {
    const verifier = auth?.admin?.nama || auth?.user?.nama || "Wali Kelas";
    setIsProcessing(true);
    try {
      await verifyAbsensiAction({
        recordId,
        status: "verified",
        verifierName: verifier,
      });
      await refreshRecords();
      setReviewingRecord(null);
      setSignedPhotoUrl('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (recordId: number) => {
    const verifier = auth?.admin?.nama || auth?.user?.nama || "Wali Kelas";
    setIsProcessing(true);
    try {
      await verifyAbsensiAction({
        recordId,
        status: "rejected",
        verifierName: verifier,
        alasan: rejectReason || "Foto tidak jelas / tidak di lokasi absensi",
      });
      await refreshRecords();
      setReviewingRecord(null);
      setSignedPhotoUrl('');
      setIsRejecting(false);
      setRejectReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApprovePending = async () => {
    const pendingIds = sessionAndDateFilteredRecords
      .filter((r) => r.status === "pending")
      .map((r) => r.id);
    if (pendingIds.length === 0) return;
    const verifier = auth?.admin?.nama || auth?.user?.nama || "Wali Kelas";
    setIsProcessing(true);
    try {
      for (const id of pendingIds) {
        await verifyAbsensiAction({
          recordId: id,
          status: "verified",
          verifierName: verifier,
        });
      }
      await refreshRecords();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <Link href="/dashboard/guru" className="self-start">
          <Button variant="white" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Button>
        </Link>

        <Badge
          variant={jenisFilter === "sholat_dzuhur" ? "green" : jenisFilter === "kehadiran_kelas" ? "yellow" : "pink"}
          size="md"
          className="self-start sm:self-auto text-[11px] sm:text-xs font-black uppercase tracking-wider"
        >
          {jenisFilter === "all"
            ? "VERIFIKASI SEMUA SESI (KELAS & SHOLAT DZUHUR)"
            : jenisFilter === "kehadiran_kelas"
            ? "VERIFIKASI SESI 1 • KEHADIRAN KELAS PAGI"
            : "VERIFIKASI SESI 2 • SHOLAT DZUHUR BERJAMAAH"}
        </Badge>
      </div>

      {/* Sesi Selection Bar (Prominent Sesi Tabs) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#181818] text-white flex items-center justify-center brutal-border-2 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
              Pilihan Sesi Presensi
            </p>
            <p className="text-xs sm:text-sm font-black text-[#181818]">
              {jenisFilter === "all"
                ? "Semua Sesi Digabung"
                : jenisFilter === "kehadiran_kelas"
                ? "Sesi 1: Kehadiran Kelas Pagi"
                : "Sesi 2: Sholat Dzuhur Mushola"}
            </p>
          </div>
        </div>

        {/* Sesi Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setJenisFilter("all")}
            className={cn(
              "px-3.5 py-2 rounded-xl font-black text-xs transition-all border-2 flex items-center gap-1.5",
              jenisFilter === "all"
                ? "bg-[#3355FF] text-white border-[#181818] shadow-[2px_2px_0px_#181818]"
                : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semua Sesi ({countAllSesi})</span>
          </button>

          <button
            type="button"
            onClick={() => setJenisFilter("kehadiran_kelas")}
            className={cn(
              "px-3.5 py-2 rounded-xl font-black text-xs transition-all border-2 flex items-center gap-1.5",
              jenisFilter === "kehadiran_kelas"
                ? "bg-[#FF6FA5] text-[#181818] border-[#181818] shadow-[2px_2px_0px_#181818]"
                : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
            )}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Kelas Pagi ({countKelasSesi})</span>
          </button>

          <button
            type="button"
            onClick={() => setJenisFilter("sholat_dzuhur")}
            className={cn(
              "px-3.5 py-2 rounded-xl font-black text-xs transition-all border-2 flex items-center gap-1.5",
              jenisFilter === "sholat_dzuhur"
                ? "bg-[#6FCB6F] text-[#181818] border-[#181818] shadow-[2px_2px_0px_#181818]"
                : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
            )}
          >
            <AppIcon name="mosque" className="w-3.5 h-3.5" />
            <span>Sholat Dzuhur ({countSholatSesi})</span>
          </button>
        </div>
      </div>

      {/* Date Filter Toolbar (Default: Hari Ini) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#3355FF] text-white flex items-center justify-center brutal-border-2 shrink-0 shadow-[2px_2px_0px_#181818]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-black text-neutral-400 uppercase tracking-wider">
              Tanggal Presensi
            </p>
            <p className="text-xs sm:text-sm font-black text-[#181818] flex items-center gap-1.5">
              <span>{formatIndonesianDate(dateFilter)}</span>
              {dateFilter === todayStr && (
                <span className="px-1.5 py-0.5 bg-[#FFD400] text-[#181818] rounded text-[10px] font-black uppercase tracking-tight">
                  Hari Ini
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Date Filter Quick Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDateFilter(todayStr)}
            className={cn(
              "px-3 py-1.5 rounded-xl font-black text-xs transition-all border-2 flex items-center gap-1",
              dateFilter === todayStr
                ? "bg-[#FFD400] text-[#181818] border-[#181818] shadow-[2px_2px_0px_#181818]"
                : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hari Ini</span>
          </button>

          <button
            type="button"
            onClick={() => setDateFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl font-black text-xs transition-all border-2",
              dateFilter === "all"
                ? "bg-[#3355FF] text-white border-[#181818] shadow-[2px_2px_0px_#181818]"
                : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
            )}
          >
            Semua Tanggal
          </button>

          <DatePicker
            variant="compact"
            value={dateFilter}
            onChange={(val) => setDateFilter(val || "all")}
            allowAllOption={true}
            align="right"
            placeholder="Pilih Tanggal..."
          />
        </div>
      </div>

      {/* Summary Cards (Reflects Active Date & Active Sesi Filter) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        <div className="bg-white p-2 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1">
          <div>
            <p className="text-[8px] sm:text-xs font-black text-neutral-500 uppercase">Review</p>
            <p className="text-lg sm:text-3xl font-black font-fredoka text-amber-500 leading-tight">{pendingCount}</p>
          </div>
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
            <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-2 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1">
          <div>
            <p className="text-[8px] sm:text-xs font-black text-neutral-500 uppercase">Disetujui</p>
            <p className="text-lg sm:text-3xl font-black font-fredoka text-green-600 leading-tight">{verifiedCount}</p>
          </div>
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
            <CheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-2 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1">
          <div>
            <p className="text-[8px] sm:text-xs font-black text-neutral-500 uppercase">Ditolak</p>
            <p className="text-lg sm:text-3xl font-black font-fredoka text-red-500 leading-tight">{rejectedCount}</p>
          </div>
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-[#FF4D4D] text-white flex items-center justify-center brutal-border-2 shrink-0">
            <XCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-2 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1">
          <div>
            <p className="text-[8px] sm:text-xs font-black text-neutral-500 uppercase">Total</p>
            <p className="text-lg sm:text-3xl font-black font-fredoka text-[#3355FF] leading-tight">{totalCount}</p>
          </div>
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-[#3355FF] text-white flex items-center justify-center brutal-border-2 shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Status Filter Tabs & Batch Action */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4">
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-100 rounded-xl sm:rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
              statusFilter === "pending"
                ? "bg-[#FFD400] text-[#181818] brutal-border-2 brutal-shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <Clock className="w-3 h-3 hidden sm:block" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter("verified")}
            className={`py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
              statusFilter === "verified"
                ? "bg-[#6FCB6F] text-[#181818] brutal-border-2 brutal-shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <CheckCircle className="w-3 h-3 hidden sm:block" />
            <span>Sah ({verifiedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1 ${
              statusFilter === "rejected"
                ? "bg-[#FF4D4D] text-white brutal-border-2 brutal-shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <XCircle className="w-3 h-3 hidden sm:block" />
            <span>Tolak ({rejectedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={`py-2 px-1 sm:px-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center ${
              statusFilter === "all"
                ? "bg-[#3355FF] text-white brutal-border-2 brutal-shadow-sm"
                : "text-neutral-600 hover:text-black"
            }`}
          >
            <span>Semua ({totalCount})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          {pendingCount > 0 && statusFilter === "pending" && (
            <Button
              variant="green"
              size="sm"
              onClick={handleBatchApprovePending}
              className="gap-1.5 text-xs font-black"
            >
              <CheckSquare className="w-4 h-4 stroke-[2.5]" />
              <span>Setujui Semua Pending ({pendingCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.length === 0 ? (
          <div className="col-span-full bg-white p-8 sm:p-12 rounded-3xl brutal-border-thick text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto brutal-border-2">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm sm:text-base font-black text-neutral-700">
              {dateFilter === todayStr
                ? `Tidak ada antrean presensi ${
                    statusFilter === "pending"
                      ? "pending"
                      : statusFilter === "verified"
                      ? "sah"
                      : statusFilter === "rejected"
                      ? "ditolak"
                      : ""
                  } untuk ${
                    jenisFilter === "all"
                      ? "Semua Sesi"
                      : jenisFilter === "kehadiran_kelas"
                      ? "Sesi Kehadiran Kelas Pagi"
                      : "Sesi Sholat Dzuhur"
                  } hari ini (${formatIndonesianDate(todayStr)}).`
                : `Tidak ada data presensi pada tanggal ${formatIndonesianDate(
                    dateFilter
                  )} dengan filter yang dipilih.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {jenisFilter !== "all" && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setJenisFilter("all")}
                  className="gap-1.5 text-xs font-black"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Lihat Semua Sesi</span>
                </Button>
              )}
              {dateFilter !== "all" && (
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => setDateFilter("all")}
                  className="gap-1.5 text-xs font-black"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Lihat Semua Tanggal (Arsip)</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <Card
              key={rec.id}
              variant="white"
              shadow="md"
              className={cn(
                "p-4 space-y-3 flex flex-col justify-between transition-all",
                rec.status === "verified"
                  ? "border-green-400 bg-green-50/20"
                  : rec.status === "rejected"
                  ? "border-red-400 bg-red-50/20"
                  : "border-[#181818]"
              )}
            >
              <div className="space-y-3">
                {/* Header Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#3355FF] text-white rounded-lg text-xs font-black">
                      #{rec.siswa.nomorAbsen}
                    </span>
                    <h4 className="text-sm font-black text-[#181818] truncate max-w-[150px]">
                      {rec.siswa.nama}
                    </h4>
                  </div>
                  <Badge
                    variant={
                      rec.status === "verified"
                        ? "verified"
                        : rec.status === "pending"
                        ? "pending"
                        : "rejected"
                    }
                    size="sm"
                  >
                    {rec.status.toUpperCase()}
                  </Badge>
                </div>

                {/* Selfie Image (Square Ratio) */}
                <div
                  className="relative aspect-square w-full rounded-2xl overflow-hidden brutal-border-2 bg-neutral-100 group cursor-pointer"
                  onClick={() => handleOpenReview(rec)}
                >
                  <img
                    src={rec.fotoUrl.startsWith('data:') || rec.fotoUrl.startsWith('http') ? rec.fotoUrl : `https://ohllvcwdrxewzfbjhhsr.supabase.co/storage/v1/object/public/absensi-selfies/${rec.fotoUrl}`}
                    alt={`Selfie ${rec.siswa.nama}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black text-xs">
                    <Eye className="w-5 h-5" />
                    <span>Perbesar Bukti</span>
                  </div>

                  {/* Geolocation Tag Overlay */}
                  <div className="absolute bottom-2 left-2 right-2 bg-[#181818]/85 backdrop-blur-xs text-white p-1.5 rounded-xl text-[10px] font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#FFD400]" />
                      {new Date(rec.waktuAbsen).toLocaleTimeString("id-ID")} WIB
                    </span>
                    <span className="text-[#6FCB6F] font-black uppercase text-[9px]">
                      LIVE CAMERA SELFIE
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Sesi:</span>
                    <Badge
                      variant={rec.jenis === "kehadiran_kelas" ? "blue" : "green"}
                      size="sm"
                    >
                      {rec.jenis === "kehadiran_kelas" ? "KELAS PAGI" : "SHOLAT DZUHUR"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>NISN:</span>
                    <span className="font-mono font-bold text-[#181818]">{rec.siswa.nis}</span>
                  </div>

                  {/* Radius GPS status */}
                  <div className="flex items-center justify-between text-neutral-600">
                    <span>Radius Lokasi:</span>
                    <span
                      className={cn(
                        "font-black text-[10px] px-1.5 py-0.5 rounded border",
                        rec.lokasi?.isWithinRadius
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-red-100 text-red-800 border-red-300"
                      )}
                    >
                      {rec.lokasi?.isWithinRadius
                        ? "GPS VALID (SEKOLAH)"
                        : "DI LUAR RADIUS"}
                    </span>
                  </div>

                  {rec.status === "rejected" && rec.alasanPenolakan && (
                    <div className="p-2 bg-red-50 text-red-700 text-[10px] font-bold rounded-xl border border-red-200">
                      Alasan: {rec.alasanPenolakan}
                    </div>
                  )}

                  {rec.status === "verified" && rec.diverifikasiOleh && (
                    <div className="p-1.5 bg-green-50 text-green-800 text-[10px] font-bold rounded-xl border border-green-200">
                      Disetujui oleh: {rec.diverifikasiOleh}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Only shown if pending */}
              <div className="pt-2 border-t border-neutral-200">
                {rec.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="green"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleApprove(rec.id)}
                      className="gap-1 text-xs justify-center font-black"
                    >
                      <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Setujui</span>
                    </Button>
                    <Button
                      variant="pink"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => {
                        handleOpenReview(rec);
                        setIsRejecting(true);
                      }}
                      className="gap-1 text-xs justify-center font-black"
                    >
                      <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Tolak...</span>
                    </Button>
                  </div>
                ) : rec.status === "verified" ? (
                  <div className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-green-100 text-green-800 rounded-xl text-xs font-black border border-green-300">
                    <span className="w-2 h-2 rounded-full bg-green-600" />
                    <span>Presensi Sah (Terverifikasi)</span>
                  </div>
                ) : (
                  <div className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-red-100 text-red-800 rounded-xl text-xs font-black border border-red-300">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>Presensi Ditolak</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewingRecord && (
        <Modal
          isOpen={true}
          onClose={() => {
            setReviewingRecord(null);
            setSignedPhotoUrl('');
            setIsRejecting(false);
            setRejectReason("");
          }}
          title={`Verifikasi Bukti: ${reviewingRecord.siswa.nama}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Selfie and Location in 2 Columns on Tablet/Desktop, 1 Column on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Photo */}
              <div className="rounded-2xl overflow-hidden brutal-border-2 bg-black aspect-square max-h-[350px] flex items-center justify-center">
                {signedPhotoUrl ? (
                  <img
                    src={signedPhotoUrl}
                    alt={reviewingRecord.siswa.nama}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-xs font-bold text-neutral-400">Memuat foto selfie...</p>
                )}
              </div>

              {/* Info & Radius */}
              <div className="space-y-3 text-xs bg-neutral-50 p-4 rounded-2xl border-2 border-neutral-200 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="pb-2 border-b border-neutral-200">
                    <p className="text-neutral-500 font-bold">Nama Lengkap:</p>
                    <p className="text-sm font-black text-[#181818]">
                      {reviewingRecord.siswa.nama} (Absen #{reviewingRecord.siswa.nomorAbsen})
                    </p>
                  </div>

                  <div>
                    <p className="text-neutral-500 font-bold">Sesi Absensi:</p>
                    <p className="font-black text-[#181818]">
                      {reviewingRecord.jenis === "kehadiran_kelas"
                        ? "Presensi Kehadiran Kelas Pagi"
                        : "Presensi Sholat Dzuhur di Mushola"}
                    </p>
                  </div>

                  <div>
                    <p className="text-neutral-500 font-bold">Waktu Scan & Selfie:</p>
                    <p className="font-mono font-black text-[#181818]">
                      {reviewingRecord.tanggal}, {new Date(reviewingRecord.waktuAbsen).toLocaleTimeString("id-ID")} WIB
                    </p>
                  </div>

                  <div>
                    <p className="text-neutral-500 font-bold">Status Radius GPS:</p>
                    <p
                      className={cn(
                        "font-black text-xs mt-0.5",
                        reviewingRecord.lokasi?.isWithinRadius ? "text-green-700" : "text-red-600"
                      )}
                    >
                      {reviewingRecord.lokasi?.isWithinRadius
                        ? "✓ Koordinat Valid di Area Sekolah (Radius < 100m)"
                        : "⚠ Di Luar Radius Sekolah"}
                    </p>
                  </div>
                </div>

                {reviewingRecord.status !== "pending" && (
                  <div className="pt-2 border-t border-neutral-200">
                    <p className="text-neutral-500 font-bold">Status Saat Ini:</p>
                    <p
                      className={cn(
                        "font-black text-xs",
                        reviewingRecord.status === "verified" ? "text-green-700" : "text-red-600"
                      )}
                    >
                      {reviewingRecord.status === "verified"
                        ? `Sudah Disetujui (oleh ${reviewingRecord.diverifikasiOleh || "Pak Didin Sahrudin, S.Kom"})`
                        : `Sudah Ditolak (${reviewingRecord.alasanPenolakan || "-"})`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rejection Reason Form (Only if rejecting or pending) */}
            {reviewingRecord.status === "pending" && (
              <>
                {isRejecting && (
                  <div className="p-3 bg-red-50 rounded-2xl border-2 border-red-200 space-y-2 animate-in fade-in">
                    <label className="text-xs font-black text-red-800 uppercase">
                      Alasan Penolakan Presensi:
                    </label>
                    <Input
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Contoh: Foto gelap, bukan di mushola, atau foto bukan wajah siswa."
                      className="bg-white text-xs"
                    />
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t-2 border-neutral-200">
                  <Button
                    variant="white"
                    size="md"
                    onClick={() => {
                      setReviewingRecord(null);
                      setIsRejecting(false);
                      setRejectReason("");
                    }}
                    className="w-full sm:w-auto font-bold text-xs justify-center"
                  >
                    Tutup Preview
                  </Button>

                  {!isRejecting ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="pink"
                        size="md"
                        onClick={() => setIsRejecting(true)}
                        className="w-full sm:w-auto font-black text-xs justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Tolak Presensi...</span>
                      </Button>
                      <Button
                        variant="green"
                        size="md"
                        onClick={() => handleApprove(reviewingRecord.id)}
                        className="w-full sm:w-auto font-black text-xs justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Setujui Presensi Sah</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="white"
                        size="md"
                        onClick={() => setIsRejecting(false)}
                        className="w-full sm:w-auto font-bold text-xs justify-center"
                      >
                        Batal Tolak
                      </Button>
                      <Button
                        variant="pink"
                        size="md"
                        onClick={() => handleReject(reviewingRecord.id)}
                        className="w-full sm:w-auto font-black text-xs justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Konfirmasi Penolakan</span>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {reviewingRecord.status !== "pending" && (
              <div className="flex justify-end pt-3 border-t-2 border-neutral-200">
                <Button
                  variant="white"
                  size="md"
                  onClick={() => {
                    setReviewingRecord(null);
                    setIsRejecting(false);
                    setRejectReason("");
                  }}
                  className="w-full sm:w-auto font-bold text-xs justify-center"
                >
                  Tutup Preview
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
