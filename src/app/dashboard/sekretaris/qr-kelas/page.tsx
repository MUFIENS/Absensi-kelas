"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Clock,
  Users,
  RefreshCw,
  Maximize2,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Lock,
  PowerOff,
  PlusCircle,
  PlayCircle
} from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import {
  getStoredAuth
} from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { createQRSesiAction, deactivateQRSesiAction } from "@/app/actions/absensiActions";
import { QRSesi, AbsensiRecord, AuthSession } from "@/lib/types";

export default function SekretarisQRKelasPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [activeSession, setActiveSession] = useState<QRSesi | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Timer & Expiry State
  const [timeLeftStr, setTimeLeftStr] = useState<string>("00:00");
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // New Session & Close Session Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<number>(45);

  const calculateTimeRemaining = (session: QRSesi | null) => {
    if (!session || !session.isActive) {
      return { expired: true, text: "00:00 (Sesi Ditutup)" };
    }
    const now = Date.now();
    const end = new Date(session.waktuBerakhir).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { expired: true, text: "00:00 (EXPIRED)" };
    }
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours > 0) {
      return {
        expired: false,
        text: `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      };
    }
    return {
      expired: false,
      text: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    };
  };

  const loadData = async () => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);

    const todayStr = new Date().toISOString().split('T')[0];

    // Ambil sesi aktif hari ini dari Supabase
    const { data: dbSession } = await supabase
      .from('qr_sessions')
      .select('*')
      .eq('jenis', 'kehadiran_kelas')
      .eq('tanggal', todayStr)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbSession) {
      const mappedSession: QRSesi = {
        id: dbSession.id,
        jenis: 'kehadiran_kelas',
        token: dbSession.token,
        qrUrl: dbSession.qr_url,
        tanggal: dbSession.tanggal,
        waktuMulai: dbSession.waktu_mulai,
        waktuBerakhir: dbSession.waktu_berakhir,
        adminId: dbSession.admin_id || 1,
        adminName: dbSession.admin_name,
        durationMinutes: dbSession.duration_minutes,
        isActive: dbSession.is_active,
        createdAt: dbSession.created_at,
      };
      setActiveSession(mappedSession);
      const calc = calculateTimeRemaining(mappedSession);
      setIsExpired(calc.expired);
      setTimeLeftStr(calc.text);
    } else {
      setActiveSession(null);
      setIsExpired(false);
      setTimeLeftStr("00:00");
    }

    // Ambil riwayat absensi hari ini beserta info siswa
    const { data: dbRecords } = await supabase
      .from('absensi_records')
      .select('*, siswa (*)')
      .eq('tanggal', todayStr)
      .eq('jenis', 'kehadiran_kelas')
      .order('waktu_absen', { ascending: false });

    if (dbRecords) {
      const mappedRecords: AbsensiRecord[] = dbRecords.map((r: any) => ({
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
        jenis: r.jenis as 'kehadiran_kelas',
        tanggal: r.tanggal,
        waktuAbsen: r.waktu_absen,
        status: r.status as 'pending' | 'verified' | 'rejected',
        fotoUrl: r.foto_storage_path,
        timestampServer: r.created_at || r.waktu_absen,
        diverifikasiOleh: r.diverifikasi_oleh,
        waktuVerifikasi: r.waktu_verifikasi,
        alasanPenolakan: r.alasan_penolakan,
      }));
      setRecords(mappedRecords);
    }

    setIsLoaded(true);
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime Subscription untuk live update
    const channel = supabase
      .channel('realtime_absensi_kelas')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'absensi_records',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Live Timer Countdown Loop
  useEffect(() => {
    if (!activeSession || !activeSession.isActive) return;

    const initialCalc = calculateTimeRemaining(activeSession);
    setIsExpired(initialCalc.expired);
    setTimeLeftStr(initialCalc.text);

    const interval = setInterval(() => {
      const calc = calculateTimeRemaining(activeSession);
      setIsExpired(calc.expired);
      setTimeLeftStr(calc.text);
      if (calc.expired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const handleCreateNewSession = async (durationMinutes: number) => {
    setIsLoading(true);
    try {
      const res = await createQRSesiAction({
        jenis: 'kehadiran_kelas',
        durationMinutes,
        adminId: auth?.admin?.id || 1,
        adminName: auth?.admin?.nama || 'Sekretaris Kelas',
      });
      if (res.success && res.session) {
        const s = res.session;
        const mappedSession: QRSesi = {
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
        };
        setActiveSession(mappedSession);
        const calc = calculateTimeRemaining(mappedSession);
        setIsExpired(calc.expired);
        setTimeLeftStr(calc.text);
        setIsCreateModalOpen(false);
      } else {
        alert(res.message || "Gagal membuat sesi QR.");
      }
    } catch {
      alert("Terjadi kendala koneksi server saat membuat sesi QR.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    setIsLoading(true);
    try {
      await deactivateQRSesiAction(activeSession.id);
      setActiveSession((prev) => (prev ? { ...prev, isActive: false } : null));
      setIsExpired(true);
      setTimeLeftStr("00:00 (Sesi Ditutup)");
    } finally {
      setIsLoading(false);
    }
  };

  const generateQRPngBlob = async (qrSvgElement: SVGElement): Promise<{ blob: Blob; url: string }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 720;
      const ctx = canvas.getContext("2d");
      if (!ctx || !activeSession) return reject("Gagal membuat canvas");

      // Draw background
      ctx.fillStyle = "#FFD400";
      ctx.fillRect(0, 0, 600, 720);

      // Draw border
      ctx.strokeStyle = "#181818";
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, 588, 708);

      // Header text
      ctx.fillStyle = "#181818";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ABSENSI DIGITAL XI PPLG 1", 300, 52);

      ctx.font = "bold 16px sans-serif";
      ctx.fillText("SESI KEHADIRAN KELAS PAGI", 300, 80);

      // Draw white card for QR
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(75, 105, 450, 450);
      ctx.strokeRect(75, 105, 450, 450);

      // Serialize SVG
      const svgData = new XMLSerializer().serializeToString(qrSvgElement);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const DOMURL = window.URL || window.webkitURL || window;
      const svgUrl = DOMURL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 95, 125, 410, 410);
        DOMURL.revokeObjectURL(svgUrl);

        // Token banner
        ctx.fillStyle = "#181818";
        ctx.fillRect(75, 575, 450, 50);
        ctx.fillStyle = "#FFD400";
        ctx.font = "bold 22px monospace";
        ctx.fillText(activeSession.token, 300, 608);

        // Expiry footer
        ctx.fillStyle = "#181818";
        ctx.font = "bold 14px sans-serif";
        const expStr = new Date(activeSession.waktuBerakhir).toLocaleTimeString("id-ID");
        ctx.fillText(`Berlaku s.d ${expStr} WIB • SMK Negeri XI PPLG 1`, 300, 660);

        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = DOMURL.createObjectURL(blob);
            resolve({ blob, url: pngUrl });
          } else {
            reject("Gagal render PNG");
          }
        }, "image/png");
      };
      img.src = svgUrl;
    });
  };

  const handleShareQRPNG = async () => {
    if (!activeSession) return;
    const svgEl = document.querySelector("#qr-kelas-box svg") as SVGElement;
    if (!svgEl) return;

    try {
      const { blob, url } = await generateQRPngBlob(svgEl);
      const fileName = `QR_Kelas_XI_PPLG_1_${activeSession.token}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "QR Presensi Kelas XI PPLG 1",
          text: `Halo teman-teman XI PPLG 1! Berikut file gambar QR Presensi Kehadiran Kelas Pagi. Sesi berlaku s.d ${new Date(activeSession.waktuBerakhir).toLocaleTimeString("id-ID")} WIB (Token: ${activeSession.token}).`,
        });
      } else {
        // Fallback: download PNG file & copy link
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const shareUrl = `${window.location.origin}/dashboard/siswa/absen?token=${activeSession.token}`;
        navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.error("Error sharing QR PNG:", err);
    }
  };

  const handleDownloadPNG = async () => {
    if (!activeSession) return;
    const svgEl = document.querySelector("#qr-kelas-box svg") as SVGElement;
    if (!svgEl) return;

    try {
      const { url } = await generateQRPngBlob(svgEl);
      const fileName = `QR_Kelas_XI_PPLG_1_${activeSession.token}.png`;
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download PNG error:", err);
    }
  };

  const handleCopyLink = () => {
    if (!activeSession) return;
    const shareUrl = `${window.location.origin}/dashboard/siswa/absen?token=${activeSession.token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyToken = () => {
    if (!activeSession) return;
    navigator.clipboard.writeText(activeSession.token);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const today = new Date().toLocaleDateString("en-CA");
  const todayRecords = records.filter(
    (r) => r.jenis === "kehadiran_kelas" && r.tanggal === today
  );
  const pendingCount = todayRecords.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <Link href="/dashboard/sekretaris" className="inline-block mb-2">
            <Button variant="white" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-3xl font-black font-fredoka text-[#181818]">
            Proyektor QR Kelas Pagi
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-600">
            Kelola sesi aktif, batasan waktu kedaluwarsa, dan bagikan QR presensi kelas XI PPLG 1.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 text-xs sm:text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{activeSession ? "Ganti Sesi" : "Buka Sesi QR"}</span>
          </Button>

          <Badge variant="pink" size="md" className="gap-1.5 hidden sm:flex text-xs">
            <AppIcon name="sun" className="w-4 h-4" />
            <span>SESI PAGI</span>
          </Badge>
        </div>
      </div>

      {/* Main Grid: Big QR Screen + Live Attendee Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left (7 Cols): The Big QR Projector Card */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-7 rounded-[28px] sm:rounded-[36px] brutal-border-thick brutal-shadow-xl flex flex-col items-center text-center space-y-4 sm:space-y-5">
          {/* Header Badges & Sesi Status */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="blue" size="md">
              PROYEKTOR KELAS XI PPLG 1
            </Badge>

            {!isLoaded ? (
              <Badge variant="yellow" size="md">
                Memeriksa Status Sesi...
              </Badge>
            ) : !activeSession ? (
              <Badge variant="yellow" size="md" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>BELUM ADA SESI AKTIF</span>
              </Badge>
            ) : isExpired ? (
              <Badge variant="rejected" size="md" className="gap-1.5 animate-pulse">
                <Lock className="w-3.5 h-3.5" />
                <span>SESI EXPIRED / DITUTUP</span>
              </Badge>
            ) : (
              <Badge variant="green" size="md" className="gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>SISA WAKTU: {timeLeftStr}</span>
              </Badge>
            )}
          </div>

          {/* Sesi Belum Dimulai State */}
          {!activeSession ? (
            <div className="p-8 sm:p-10 bg-[#FFD400] rounded-3xl brutal-border-thick brutal-shadow-lg max-w-md w-full space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white brutal-border-2 mx-auto flex items-center justify-center rotate-2">
                <QrCode className="w-10 h-10 text-[#181818]" />
              </div>
              <div>
                <h3 className="text-xl font-black font-fredoka text-[#181818]">
                  Sesi QR Kelas Belum Dibuka
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#181818]/80 mt-1">
                  Pilih durasi masa aktif di bawah ini untuk menampilkan QR Code pada layar proyektor kelas.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-black uppercase text-[#181818]/70">
                  Pilih Durasi Sesi:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDuration(d)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        selectedDuration === d
                          ? "bg-[#181818] text-[#FFD400] brutal-border-2"
                          : "bg-white text-[#181818] border-2 border-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      {d} Menit
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() => handleCreateNewSession(selectedDuration)}
                className="w-full justify-center gap-2 text-sm sm:text-base mt-2"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Mulai & Buka Sesi ({selectedDuration} Menit)</span>
              </Button>
            </div>
          ) : (
            /* QR Box Container with Expired Overlay */
            <div id="qr-kelas-box" className="relative p-5 sm:p-6 bg-[#FFD400] rounded-3xl brutal-border-thick brutal-shadow-lg max-w-xs sm:max-w-sm w-full">
              <div className={`bg-white p-3.5 sm:p-4 rounded-2xl brutal-border-2 transition-all ${
                isExpired ? "opacity-25 blur-xs pointer-events-none" : ""
              }`}>
                <QRCodeSVG
                  value={
                    activeSession.qrUrl ||
                    `https://absensi.xipplg1.sch.id/scan?token=${activeSession.token}`
                  }
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="mx-auto max-w-full h-auto"
                />
              </div>

              {/* Token Display */}
              <div className="mt-3 bg-[#181818] text-[#FFD400] px-4 py-2 rounded-xl font-mono font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2">
                <span>{activeSession.token}</span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  title="Salin Token"
                  className="text-white hover:text-[#FFD400]"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Expired Overlay */}
              {isExpired && (
                <div className="absolute inset-0 bg-[#181818]/90 rounded-3xl flex flex-col items-center justify-center p-6 text-white text-center space-y-3 z-10 animate-in fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center brutal-border-2">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black font-fredoka text-[#FF6FA5]">
                      SESI KEDALUWARSA
                    </h4>
                    <p className="text-xs font-bold text-neutral-300">
                      QR Code ini tidak dapat digunakan lagi untuk absen.
                    </p>
                  </div>
                  <Button
                    variant="yellow"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-1.5 text-xs text-[#181818]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Buka Sesi Baru</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Share PNG, Download PNG, Copy Link, Close */}
          {activeSession && (
            <div className="space-y-3 w-full pt-1">
              <p className="text-xs font-bold text-neutral-600 max-w-md mx-auto">
                Berakhir pukul <strong>{new Date(activeSession.waktuBerakhir).toLocaleTimeString("id-ID")} WIB</strong>. Siswa wajib scan & live selfie di kelas.
              </p>

              <div className="flex flex-col gap-2 max-w-md mx-auto w-full">
                <Button
                  variant="green"
                  size="md"
                  onClick={handleShareQRPNG}
                  className="w-full justify-center gap-2 text-xs sm:text-sm font-black"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedLink ? "File / Link Terkirim!" : "Bagikan Gambar QR (PNG)"}</span>
                </Button>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
                  <Button
                    variant="white"
                    size="sm"
                    onClick={handleDownloadPNG}
                    className="justify-center gap-1.5 text-xs font-bold"
                  >
                    <AppIcon name="export-csv" className="w-3.5 h-3.5" />
                    <span>Unduh PNG</span>
                  </Button>

                  <Button
                    variant="white"
                    size="sm"
                    onClick={handleCopyLink}
                    className="justify-center gap-1.5 text-xs font-bold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </Button>

                  {!isExpired ? (
                    <Button
                      variant="pink"
                      size="sm"
                      onClick={() => setIsCloseConfirmOpen(true)}
                      className="justify-center gap-1.5 text-xs font-black col-span-2 sm:col-span-1"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Tutup Sesi</span>
                    </Button>
                  ) : (
                    <Button
                      variant="yellow"
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="justify-center gap-1.5 text-xs font-black col-span-2 sm:col-span-1 text-[#181818]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Buka Baru</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right (5 Cols): Live Attendee Feed */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-8 rounded-[36px] brutal-border-thick brutal-shadow-xl flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b-3 border-[#181818] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[#3355FF] stroke-[2.5]" />
              <h3 className="text-lg font-black font-fredoka text-[#181818]">
                Siswa Masuk Kelas
              </h3>
            </div>
            <span className="text-xs font-black bg-[#FF6FA5] px-2.5 py-1 rounded-xl brutal-border-2">
              {todayRecords.length} / 46 Siswa
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-black text-neutral-700">
              <span>Progress Kehadiran Kelas</span>
              <span>{Math.round((todayRecords.length / 46) * 100)}%</span>
            </div>
            <div className="w-full h-3.5 bg-neutral-200 rounded-full brutal-border-2 overflow-hidden">
              <div
                className="h-full bg-[#6FCB6F] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((todayRecords.length / 46) * 100))}%` }}
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[380px] space-y-2 pr-1">
            {todayRecords.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 font-bold text-sm">
                Belum ada siswa yang melakukan scan presensi kelas.
              </div>
            ) : (
              todayRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F4F4F0] border-2 border-[#181818] hover:bg-amber-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-[#FFD400] text-[#181818] brutal-border-2 flex items-center justify-center font-mono font-black text-xs">
                      #{rec.siswa.nomorAbsen}
                    </span>
                    <div>
                      <p className="font-black text-xs sm:text-sm text-[#181818] line-clamp-1">{rec.siswa.nama}</p>
                      <p className="text-[10px] font-bold text-neutral-500">
                        NISN: {rec.siswa.nis} • {new Date(rec.waktuAbsen).toLocaleTimeString("id-ID")} WIB
                      </p>
                    </div>
                  </div>
                  <Badge variant="green" size="sm" className="shrink-0 text-[10px]">
                    Hadir Kelas
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Tutup Sesi */}
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={handleCloseSession}
        title="Tutup Sesi Presensi Kelas?"
        message="Apakah Anda yakin ingin menutup sesi QR Code Kehadiran Kelas sekarang?"
        subMessage="Setelah ditutup, siswa tidak dapat melakukan scan presensi kelas lagi sampai sesi baru dibuka."
        confirmText="Ya, Tutup Sesi"
        cancelText="Batal"
        type="warning"
        confirmVariant="pink"
      />

      {/* Modal: Buat Sesi Baru dengan Pilihan Durasi (Responsive Mobile) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buka Sesi QR Kelas Baru"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs sm:text-sm font-bold text-neutral-600">
            Pilih durasi aktif untuk sesi QR Code Kehadiran Kelas XI PPLG 1:
          </p>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-[#181818]">
              Pilih Durasi Sesi
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[15, 30, 45, 60, 90, 120].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSelectedDuration(dur)}
                  className={`py-3 rounded-2xl font-black text-xs sm:text-sm transition-all ${
                    selectedDuration === dur
                      ? "bg-[#FFD400] text-[#181818] brutal-border-2 brutal-shadow-sm"
                      : "bg-[#F4F4F0] text-neutral-700 hover:bg-neutral-200 border-2 border-neutral-300"
                  }`}
                >
                  {dur} Menit
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-2xl border-2 border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Sesi akan berakhir pada:{" "}
              <strong>
                {new Date(Date.now() + selectedDuration * 60 * 1000).toLocaleTimeString("id-ID")} WIB
              </strong>
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="white"
              size="md"
              onClick={() => setIsCreateModalOpen(false)}
              className="w-1/2 justify-center"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleCreateNewSession(selectedDuration)}
              className="w-1/2 justify-center"
            >
              Aktifkan Sesi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
