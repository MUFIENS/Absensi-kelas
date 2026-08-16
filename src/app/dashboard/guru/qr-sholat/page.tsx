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
  PlayCircle,
  Download
} from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { getStoredAuth } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { createQRSesiAction, deactivateQRSesiAction } from "@/app/actions/absensiActions";
import { getJakartaDateString } from "@/lib/dateUtils";
import { QRSesi, AbsensiRecord, AuthSession } from "@/lib/types";
import { APP_CONFIG } from "@/lib/env";

export default function GuruQRSholatPage() {
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
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

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

    const todayStr = getJakartaDateString();

    // Ambil sesi aktif hari ini dari Supabase
    const { data: dbSession } = await supabase
      .from('qr_sessions')
      .select('*')
      .eq('jenis', 'sholat_dzuhur')
      .eq('tanggal', todayStr)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbSession) {
      const mappedSession: QRSesi = {
        id: dbSession.id,
        jenis: 'sholat_dzuhur',
        token: dbSession.token,
        qrUrl: dbSession.qr_url,
        tanggal: dbSession.tanggal,
        waktuMulai: dbSession.waktu_mulai,
        waktuBerakhir: dbSession.waktu_berakhir,
        adminId: dbSession.admin_id || 2,
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
      .eq('jenis', 'sholat_dzuhur')
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
        jenis: r.jenis as 'sholat_dzuhur',
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
      .channel('realtime_absensi_sholat')
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
        jenis: 'sholat_dzuhur',
        durationMinutes,
        adminId: auth?.admin?.id || 2,
        adminName: auth?.admin?.nama || 'Wali Kelas',
      });
      if (res.success && res.session) {
        const s = res.session;
        const mappedSession: QRSesi = {
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
        };
        setActiveSession(mappedSession);
        const calc = calculateTimeRemaining(mappedSession);
        setIsExpired(calc.expired);
        setTimeLeftStr(calc.text);
        setIsCreateModalOpen(false);
      } else {
        alert(res.message || "Gagal membuat sesi QR sholat.");
      }
    } catch {
      alert("Terjadi kendala koneksi server saat membuat sesi QR sholat.");
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

      // Draw background (Green theme for Sholat)
      ctx.fillStyle = "#6FCB6F";
      ctx.fillRect(0, 0, 600, 720);

      // Draw border
      ctx.strokeStyle = "#181818";
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, 588, 708);

      // Header text
      ctx.fillStyle = "#181818";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ABSENSI SHOLAT XI PPLG 1", 300, 52);

      ctx.font = "bold 16px sans-serif";
      ctx.fillText("MUSHOLA / MASJID SEKOLAH", 300, 80);

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
        ctx.fillStyle = "#6FCB6F";
        ctx.font = "bold 22px monospace";
        ctx.fillText(activeSession.token, 300, 608);

        // Expiry footer
        ctx.fillStyle = "#181818";
        ctx.font = "bold 14px sans-serif";
        const expStr = new Date(activeSession.waktuBerakhir).toLocaleTimeString("id-ID");
        ctx.fillText(`Berlaku s.d ${expStr} WIB (${APP_CONFIG.sholatTimeRange.label})`, 300, 660);

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
    const svgEl = document.querySelector("#qr-sholat-box svg") as SVGElement;
    if (!svgEl) return;

    try {
      const { blob, url } = await generateQRPngBlob(svgEl);
      const fileName = `QR_Sholat_XI_PPLG_1_${activeSession.token}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "QR Presensi Sholat Dzuhur XI PPLG 1",
          text: `Assalamu'alaikum siswa XI PPLG 1! Berikut gambar QR Presensi Sholat Dzuhur Berjamaah di Mushola. Sesi berlaku s.d ${new Date(activeSession.waktuBerakhir).toLocaleTimeString("id-ID")} WIB (Token: ${activeSession.token}).`,
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
    const svgEl = document.querySelector("#qr-sholat-box svg") as SVGElement;
    if (!svgEl) return;

    try {
      const { url } = await generateQRPngBlob(svgEl);
      const fileName = `QR_Sholat_XI_PPLG_1_${activeSession.token}.png`;
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
  const todaySholatRecords = records.filter(
    (r) => r.jenis === "sholat_dzuhur" && r.tanggal === today
  );
  const pendingCount = todaySholatRecords.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/guru">
            <Button variant="white" size="sm" className="gap-1.5 text-xs mb-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818]">
            Layar Proyektor QR Sholat Dzuhur
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-600">
            Tampilkan QR Code di proyektor mushola untuk presensi sholat berjamaah siswa XI PPLG 1.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="green"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 text-xs sm:text-sm font-black"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{activeSession ? "Ganti / Buka Sesi Baru" : "Buka Sesi Sholat Baru"}</span>
          </Button>

          <Badge variant="green" size="md" className="gap-1.5 hidden sm:flex">
            <AppIcon name="mosque" className="w-4 h-4" />
            <span>MUSHOLA SEKOLAH</span>
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-[#FFD400] p-4 rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center gap-3 text-xs sm:text-sm font-bold text-[#181818]">
        <AppIcon name="mosque" className="w-6 h-6 text-[#181818] shrink-0" />
        <span>
          <strong>Layar Proyektor Mushola:</strong> QR Code ini berlaku khusus saat istirahat siang ({APP_CONFIG.sholatTimeRange.label} WIB). Siswa wajib foto selfie live dan terdeteksi di radius mushola.
        </span>
      </div>

      {/* Main Grid: Big QR + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (7 Cols): Big Mosque QR Projector */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-7 rounded-[28px] sm:rounded-[36px] brutal-border-thick brutal-shadow-xl flex flex-col items-center text-center space-y-4 sm:space-y-5">
          {/* Header Badges & Sesi Status */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="green" size="md" className="gap-1.5">
              <AppIcon name="mosque" className="w-4 h-4" />
              <span>MUSHOLA XI PPLG 1</span>
            </Badge>

            {!isLoaded ? (
              <Badge variant="yellow" size="md">
                Memeriksa Status Sesi...
              </Badge>
            ) : !activeSession ? (
              <Badge variant="yellow" size="md" className="gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>SESI BELUM DIBUKA</span>
              </Badge>
            ) : isExpired ? (
              <Badge variant="rejected" size="md" className="gap-1.5 animate-pulse">
                <Lock className="w-3.5 h-3.5" />
                <span>WAKTU SESI HABIS (EXPIRED)</span>
              </Badge>
            ) : (
              <Badge variant="yellow" size="md" className="gap-1.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>SISA WAKTU: {timeLeftStr}</span>
              </Badge>
            )}
          </div>

          {/* Sesi Belum Dimulai State */}
          {!activeSession ? (
            <div className="p-8 sm:p-10 bg-[#6FCB6F] rounded-3xl brutal-border-thick brutal-shadow-lg max-w-md w-full space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white brutal-border-2 mx-auto flex items-center justify-center rotate-2">
                <AppIcon name="mosque" className="w-10 h-10 text-[#181818]" />
              </div>
              <div>
                <h3 className="text-xl font-black font-fredoka text-[#181818]">
                  Sesi QR Sholat Belum Dimulai
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#181818]/80 mt-1">
                  Pilih durasi aktif lalu klik tombol di bawah untuk menampilkan QR Code pada proyektor mushola.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[11px] font-black uppercase text-[#181818]/70">
                  Pilih Durasi Waktu Sholat:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[15, 30, 45, 60, 90, 120].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDuration(d)}
                      className={`py-2 rounded-xl text-xs font-black transition-all ${
                        selectedDuration === d
                          ? "bg-[#181818] text-[#6FCB6F] brutal-border-2"
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
                className="w-full justify-center gap-2 text-sm sm:text-base mt-2 font-black"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Mulai &amp; Tampilkan QR Sholat ({selectedDuration} Menit)</span>
              </Button>
            </div>
          ) : (
            /* QR Box Container with Expired Overlay */
            <div id="qr-sholat-box" className="relative p-5 sm:p-6 bg-[#6FCB6F] rounded-3xl brutal-border-thick brutal-shadow-lg max-w-xs sm:max-w-sm w-full">
              <div className={`bg-white p-3.5 sm:p-4 rounded-2xl brutal-border-2 transition-all ${
                isExpired ? "opacity-25 blur-xs pointer-events-none" : ""
              }`}>
                <QRCodeSVG
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/dashboard/siswa/absen?token=${activeSession.token}`
                      : activeSession.token
                  }
                  size={200}
                  level="H"
                  includeMargin={true}
                  className="mx-auto max-w-full h-auto"
                />
              </div>

              {/* Token Display */}
              <div className="mt-3 bg-[#181818] text-[#6FCB6F] px-4 py-2 rounded-xl font-mono font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2">
                <span>{activeSession.token}</span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  title="Salin Token"
                  className="text-white hover:text-[#6FCB6F]"
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
                      QR Code sholat dzuhur ini telah berakhir.
                    </p>
                  </div>
                  <Button
                    variant="green"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-1.5 text-xs text-[#181818]"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Buka Sesi Sholat Baru</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Share PNG, Download PNG, Copy Link, Close */}
          {activeSession && (
            <div className="space-y-3 w-full pt-1">
              <p className="text-xs font-bold text-neutral-600 max-w-md mx-auto">
                Berakhir pukul <strong>{new Date(activeSession.waktuBerakhir).toLocaleTimeString("id-ID")} WIB</strong> ({APP_CONFIG.sholatTimeRange.label}). Siswa wajib selfie di area mushola.
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
                    <Download className="w-3.5 h-3.5" />
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

        {/* Right (5 Cols): Live Sholat Feed */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-8 rounded-[36px] brutal-border-thick brutal-shadow-xl flex flex-col justify-between space-y-4">
          <div className="pb-3 border-b-3 border-[#181818] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppIcon name="mosque" className="w-6 h-6 text-[#181818]" />
              <h3 className="text-lg font-black font-fredoka text-[#181818]">
                Siswa di Mushola
              </h3>
            </div>
            <span className="text-xs font-black bg-[#6FCB6F] px-2.5 py-1 rounded-xl brutal-border-2 text-[#181818]">
              {todaySholatRecords.length} / 46 Siswa
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-black text-neutral-700">
              <span>Progress Sholat Berjamaah</span>
              <span>{Math.round((todaySholatRecords.length / 46) * 100)}%</span>
            </div>
            <div className="w-full h-3.5 bg-neutral-200 rounded-full brutal-border-2 overflow-hidden">
              <div
                className="h-full bg-[#6FCB6F] transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((todaySholatRecords.length / 46) * 100))}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
            {todaySholatRecords.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300 space-y-1">
                <p className="text-xs font-bold text-neutral-500">Belum ada siswa yang scan sesi sholat dzuhur.</p>
              </div>
            ) : (
              todaySholatRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-[#F8F8F5] rounded-2xl brutal-border-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#6FCB6F] text-[#181818] font-black text-xs flex items-center justify-center brutal-border-2">
                      #{rec.siswa.nomorAbsen}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#181818]">{rec.siswa.nama}</p>
                      <p className="text-[10px] font-bold text-neutral-500 font-mono">
                        {new Date(rec.waktuAbsen).toLocaleTimeString("id-ID")} WIB
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={rec.status === "verified" ? "verified" : rec.status === "pending" ? "pending" : "rejected"}
                    size="sm"
                  >
                    {rec.status}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t-2 border-neutral-200">
            <Link
              href="/dashboard/guru/verifikasi"
              className="w-full py-2.5 bg-[#FFD400] text-[#181818] font-black text-xs rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center justify-center gap-2 hover:bg-yellow-400"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Verifikasi Selfie Sholat ({pendingCount} Pending)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Tutup Sesi Sholat */}
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        onClose={() => setIsCloseConfirmOpen(false)}
        onConfirm={handleCloseSession}
        title="Tutup Sesi QR Sholat?"
        message="Apakah Anda yakin ingin menutup sesi QR Sholat Dzuhur sekarang?"
        subMessage="Setelah ditutup, siswa tidak dapat melakukan scan sholat dzuhur lagi sampai sesi baru dibuka."
        confirmText="Ya, Tutup Sesi"
        cancelText="Batal"
        type="warning"
        confirmVariant="pink"
      />

      {/* Modal: Buat Sesi Baru Sholat (Responsive Mobile) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buka Sesi QR Sholat Baru"
        maxWidth="md"
      >
        <div className="space-y-5">
          <p className="text-xs sm:text-sm font-bold text-neutral-700">
            Tentukan durasi masa aktif sesi QR Sholat Dzuhur di mushola sekolah.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#181818] block">
              Pilih Durasi Sesi:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 45, 60, 90, 120].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSelectedDuration(dur)}
                  className={`py-3 rounded-2xl font-black text-xs sm:text-sm transition-all ${
                    selectedDuration === dur
                      ? "bg-[#6FCB6F] text-[#181818] brutal-border-2 brutal-shadow-sm"
                      : "bg-[#F4F4F0] text-neutral-700 hover:bg-neutral-200 border-2 border-neutral-300"
                  }`}
                >
                  {dur} Menit
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-2xl border-2 border-green-200 text-xs font-bold text-green-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600 shrink-0" />
            <span>
              Sesi sholat akan berakhir pada:{" "}
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
              variant="green"
              size="md"
              onClick={() => handleCreateNewSession(selectedDuration)}
              className="w-1/2 justify-center"
            >
              Aktifkan Sesi Sholat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
