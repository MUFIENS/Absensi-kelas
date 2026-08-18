"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Navigation,
  Calendar,
  CalendarDays,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { DatePicker } from "@/components/ui/DatePicker";
import { cn } from "@/lib/utils";
import { getStoredAuth } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { verifyAbsensiAction, getSignedMediaUrlAction, getSignedMediaUrlsBatchAction } from "@/app/actions/absensiActions";
import { getJakartaDateString } from "@/lib/dateUtils";
import { AuthSession, AbsensiRecord, StatusAbsensi, JenisAbsensi } from "@/lib/types";

export default function SekretarisVerifikasiPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | StatusAbsensi>("pending");

  // Date Filter (Default to Today in Local YYYY-MM-DD in Asia/Jakarta)
  const todayStr = getJakartaDateString();
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
      const paths = dbRecords.map((r: any) => r.foto_storage_path).filter(Boolean);
      const signedMap = await getSignedMediaUrlsBatchAction('absensi-selfies', paths);

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
        fotoUrl: signedMap[r.foto_storage_path] || r.foto_storage_path,
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

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('realtime_sekretaris_verifikasi')
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

  // Sekretaris focuses on Kehadiran Kelas and respects date filter
  const kelasRecords = records.filter((r) => {
    if (r.jenis !== "kehadiran_kelas") return false;
    if (dateFilter !== "all" && r.tanggal !== dateFilter) return false;
    return true;
  });

  const filteredRecords = kelasRecords.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = kelasRecords.filter((r) => r.status === "pending").length;
  const verifiedCount = kelasRecords.filter((r) => r.status === "verified").length;
  const rejectedCount = kelasRecords.filter((r) => r.status === "rejected").length;

  const handleApprove = async (recordId: number) => {
    const verifier = auth?.user.nama || "Sekretaris Kelas";
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
    const verifier = auth?.user.nama || "Sekretaris Kelas";
    setIsProcessing(true);
    try {
      await verifyAbsensiAction({
        recordId,
        status: "rejected",
        verifierName: verifier,
        alasan: rejectReason || "Foto tidak jelas / tidak di kelas",
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
    const pendingIds = kelasRecords.filter((r) => r.status === "pending").map((r) => r.id);
    if (pendingIds.length === 0) return;
    const verifier = auth?.user.nama || "Sekretaris Kelas";
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
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 overflow-hidden">
      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <Link href="/dashboard/sekretaris" className="self-start">
          <Button variant="white" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Button>
        </Link>

        <Badge variant="orange" size="md" className="self-start sm:self-auto text-[11px] sm:text-xs">
          VERIFIKASI FOTO KEHADIRAN KELAS PAGI
        </Badge>
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

      {/* Summary Cards (Compact 3-Columns on all screens) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1 sm:gap-2">
          <div>
            <p className="text-[9px] sm:text-xs font-black text-neutral-500 uppercase">Review</p>
            <p className="text-xl sm:text-3xl font-black font-fredoka text-amber-500 leading-tight">{pendingCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FFD400] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1 sm:gap-2">
          <div>
            <p className="text-[9px] sm:text-xs font-black text-neutral-500 uppercase">Disetujui</p>
            <p className="text-xl sm:text-3xl font-black font-fredoka text-green-600 leading-tight">{verifiedCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
            <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1 sm:gap-2">
          <div>
            <p className="text-[9px] sm:text-xs font-black text-neutral-500 uppercase">Ditolak</p>
            <p className="text-xl sm:text-3xl font-black font-fredoka text-red-500 leading-tight">{rejectedCount}</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FF4D4D] text-white flex items-center justify-center brutal-border-2 shrink-0">
            <XCircle className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Batch Button Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs (3 equal columns on mobile) */}
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              statusFilter === "pending"
                ? "bg-[#FFD400] text-[#181818] brutal-border-2 brutal-shadow-sm scale-[1.02]"
                : "bg-white text-neutral-600 hover:text-black brutal-border-2 border-neutral-300 hover:border-[#181818] shadow-[1.5px_1.5px_0px_#181818]"
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Pending ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("verified")}
            className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              statusFilter === "verified"
                ? "bg-[#6FCB6F] text-[#181818] brutal-border-2 brutal-shadow-sm scale-[1.02]"
                : "bg-white text-neutral-600 hover:text-black brutal-border-2 border-neutral-300 hover:border-[#181818] shadow-[1.5px_1.5px_0px_#181818]"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Sah ({verifiedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`py-2 sm:py-2.5 px-2 sm:px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
              statusFilter === "rejected"
                ? "bg-[#FF4D4D] text-white brutal-border-2 brutal-shadow-sm scale-[1.02]"
                : "bg-white text-neutral-600 hover:text-black brutal-border-2 border-neutral-300 hover:border-[#181818] shadow-[1.5px_1.5px_0px_#181818]"
            }`}
          >
            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Tolak ({rejectedCount})</span>
          </button>
        </div>

        {pendingCount > 0 && statusFilter === "pending" && (
          <Button
            variant="green"
            size="md"
            onClick={handleBatchApprovePending}
            className="w-full sm:w-auto justify-center gap-2 text-xs font-black py-2.5"
          >
            <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            <span>Setujui Semua ({pendingCount})</span>
          </Button>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.length === 0 ? (
          <div className="col-span-full bg-white p-8 sm:p-12 rounded-3xl brutal-border-thick text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto brutal-border-2">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm sm:text-base font-black text-neutral-700">
              {dateFilter === todayStr
                ? `Tidak ada antrean presensi ${statusFilter === "pending" ? "pending" : statusFilter === "verified" ? "sah" : "ditolak"} untuk hari ini (${formatIndonesianDate(todayStr)}).`
                : `Tidak ada data presensi pada tanggal ${formatIndonesianDate(dateFilter)} dengan status ${statusFilter}.`}
            </p>
            {dateFilter !== "all" && (
              <Button
                variant="white"
                size="sm"
                onClick={() => setDateFilter("all")}
                className="gap-1.5 text-xs inline-flex"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Lihat Semua Tanggal (Arsip)</span>
              </Button>
            )}
          </div>
        ) : (
          filteredRecords.map((rec) => (
            <Card
              key={rec.id}
              variant="white"
              shadow="lg"
              borderWidth="normal"
              className="flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-transform"
            >
              <div className="flex items-center justify-between pb-2 border-b-2 border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-[#3355FF] text-white font-black text-xs flex items-center justify-center brutal-border-2">
                    #{rec.siswa.nomorAbsen}
                  </span>
                  <span className="font-black text-sm text-[#181818] truncate max-w-[150px]">
                    {rec.siswa.nama}
                  </span>
                </div>
                <Badge
                  variant={rec.status === "verified" ? "verified" : rec.status === "pending" ? "pending" : "rejected"}
                  size="sm"
                >
                  {rec.status}
                </Badge>
              </div>

              {/* Photo Frame */}
              <div
                onClick={() => handleOpenReview(rec)}
                className="relative w-full aspect-square rounded-2xl brutal-border-2 overflow-hidden bg-neutral-900 cursor-pointer group"
              >
                <img
                  src={rec.fotoUrl.startsWith("data:") || rec.fotoUrl.startsWith("http") ? rec.fotoUrl : "/placeholder-selfie.png"}
                  alt={rec.siswa.nama}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-black text-xs gap-1.5">
                  <Eye className="w-5 h-5" /> Klik Perbesar & Review
                </div>
                <div className="absolute top-2 left-2 bg-[#181818]/90 text-[#FFD400] text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(rec.timestampServer).toLocaleTimeString("id-ID")} WIB</span>
                </div>
              </div>

              {/* GPS Location Pill */}
              {rec.lokasi && (
                <div className={`flex items-center justify-between text-[11px] font-bold p-2 rounded-xl border-2 ${
                  rec.lokasi.isWithinRadius
                    ? "bg-green-50 text-green-950 border-green-300"
                    : "bg-red-50 text-red-950 border-red-400"
                }`}>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
                    <span className="truncate">{rec.lokasi.locationName || `${rec.lokasi.distanceMeters}m dari sekolah`}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${rec.lokasi.latitude},${rec.lokasi.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-black underline flex items-center gap-0.5 hover:text-blue-600 shrink-0 ml-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Maps <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}

              <div className="space-y-1 text-xs font-bold text-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">NISN:</span>
                  <span className="font-mono">{rec.siswa.nis}</span>
                </div>
                {rec.alasanPenolakan && (
                  <div className="p-2 bg-red-50 border border-red-300 text-red-600 rounded-lg text-[11px]">
                    Alasan: {rec.alasanPenolakan}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t-2 border-neutral-100">
                {rec.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="green"
                      size="sm"
                      onClick={() => handleApprove(rec.id)}
                      className="gap-1 text-xs justify-center"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Setujui
                    </Button>

                    <Button
                      variant="pink"
                      size="sm"
                      onClick={() => {
                        handleOpenReview(rec);
                        setIsRejecting(true);
                      }}
                      className="gap-1 text-xs justify-center"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Tolak...
                    </Button>
                  </div>
                ) : rec.status === "verified" ? (
                  <div className="w-full py-2 px-3 bg-green-50 border-2 border-green-500 rounded-xl text-green-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#181818]">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span>Presensi Sah (Terverifikasi)</span>
                  </div>
                ) : (
                  <div className="w-full py-2 px-3 bg-red-50 border-2 border-red-500 rounded-xl text-red-900 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#181818]">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Presensi Ditolak</span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewingRecord}
        onClose={() => {
          setReviewingRecord(null);
          setSignedPhotoUrl("");
          setIsRejecting(false);
          setRejectReason("");
        }}
        title={`Review Foto: ${reviewingRecord?.siswa.nama}`}
        maxWidth="2xl"
      >
        {reviewingRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full aspect-square rounded-2xl brutal-border-2 overflow-hidden bg-[#181818] flex items-center justify-center max-h-[350px]">
                <img
                  src={signedPhotoUrl || (reviewingRecord.fotoUrl && (reviewingRecord.fotoUrl.startsWith("data:") || reviewingRecord.fotoUrl.startsWith("http")) ? reviewingRecord.fotoUrl : "/placeholder-selfie.png")}
                  alt="Foto Selfie Full Review"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="bg-neutral-50 p-4 rounded-2xl border-2 border-neutral-200 space-y-2 text-xs font-bold text-[#181818] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="pb-2 border-b border-neutral-200">
                    <p className="text-neutral-500">Siswa:</p>
                    <p className="text-sm font-black text-[#181818]">
                      {reviewingRecord.siswa.nama} (Absen #{reviewingRecord.siswa.nomorAbsen})
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Waktu Kirim:</p>
                    <p className="font-mono font-black">{new Date(reviewingRecord.timestampServer).toLocaleString("id-ID")} WIB</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Status Saat Ini:</p>
                    <p className="uppercase font-black">{reviewingRecord.status}</p>
                  </div>
                  {reviewingRecord.alasanPenolakan && (
                    <div className="p-2 bg-red-50 text-red-700 rounded-xl border border-red-200">
                      <strong>Alasan Penolakan:</strong> {reviewingRecord.alasanPenolakan}
                    </div>
                  )}
                  {reviewingRecord.lokasi && (
                    <div className="pt-2 border-t border-neutral-200 space-y-1">
                      <p>
                        <strong>Lokasi GPS:</strong> {reviewingRecord.lokasi.locationName || "Area Sekolah"} (Jarak: {reviewingRecord.lokasi.distanceMeters}m)
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${reviewingRecord.lokasi.latitude},${reviewingRecord.lokasi.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 bg-[#181818] text-[#FFD400] rounded-lg font-black text-[10px] inline-flex items-center gap-1 hover:bg-neutral-800"
                      >
                        <span>Buka Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {reviewingRecord.status === "pending" ? (
              isRejecting ? (
                <div className="space-y-3 bg-red-50 p-4 rounded-2xl border-2 border-red-400">
                  <Input
                    label="Masukkan Alasan Penolakan:"
                    placeholder="Contoh: Wajah tidak jelas / Foto bukan di ruang kelas"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="white"
                      size="md"
                      onClick={() => setIsRejecting(false)}
                      className="justify-center"
                    >
                      Batal
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      onClick={() => handleReject(reviewingRecord.id)}
                      className="justify-center"
                    >
                      Konfirmasi Tolak
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="green"
                    size="lg"
                    onClick={() => handleApprove(reviewingRecord.id)}
                    className="justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                    <span>Setujui (Sah)</span>
                  </Button>

                  <Button
                    variant="pink"
                    size="lg"
                    onClick={() => setIsRejecting(true)}
                    className="justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5 stroke-[2.5]" />
                    <span>Tolak Presensi</span>
                  </Button>
                </div>
              )
            ) : reviewingRecord.status === "verified" ? (
              <div className="space-y-3 pt-2">
                <div className="w-full py-3 px-4 bg-green-100 border-2 border-green-500 rounded-2xl text-green-900 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[3px_3px_0px_#181818]">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <span>Presensi Ini Sudah Sah (Terverifikasi)</span>
                </div>
                <Button
                  variant="white"
                  size="md"
                  onClick={() => setReviewingRecord(null)}
                  className="w-full justify-center"
                >
                  Tutup Preview
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="w-full py-3 px-4 bg-red-100 border-2 border-red-500 rounded-2xl text-red-900 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[3px_3px_0px_#181818]">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>Presensi Ini Telah Ditolak</span>
                </div>
                <Button
                  variant="white"
                  size="md"
                  onClick={() => setReviewingRecord(null)}
                  className="w-full justify-center"
                >
                  Tutup Preview
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
