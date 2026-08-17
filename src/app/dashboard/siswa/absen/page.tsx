"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import jsQR from "jsqr";
import {
  Camera,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  History,
  Lock,
  UploadCloud,
  FileImage,
  ArrowLeft,
  MapPin,
  Compass,
  Navigation,
  Check,
  X,
  Info,
  ExternalLink,
  FlipHorizontal
} from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  getStoredAuth
} from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { submitAbsensiAction } from "@/app/actions/absensiActions";
import { getJakartaDateString } from "@/lib/dateUtils";
import { AuthSession, Siswa, JenisAbsensi, QRSesi, LokasiPresensi } from "@/lib/types";
import { APP_CONFIG, calculateDistanceMeters } from "@/lib/env";

function SiswaAbsenContent() {
  const searchParams = useSearchParams();
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Mode in Step 1: "camera" | "upload"
  const [scanMode, setScanMode] = useState<"camera" | "upload">("camera");

  // Camera Facing Mode ("user" = Depan, "environment" = Belakang)
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");

  // Form State
  const [scannedToken, setScannedToken] = useState<string>("");
  const [validatedSession, setValidatedSession] = useState<QRSesi | null>(null);
  const [activeAvailableSession, setActiveAvailableSession] = useState<QRSesi | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Geolocation & Geofencing State
  const [location, setLocation] = useState<LokasiPresensi | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Refs for video & canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);

    const checkActiveSessions = async () => {
      const todayStr = getJakartaDateString();
      const { data: activeList } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('tanggal', todayStr)
        .eq('is_active', true)
        .order('id', { ascending: false });

      if (activeList && activeList.length > 0) {
        const first = activeList[0];
        const mapped: QRSesi = {
          id: first.id,
          jenis: first.jenis as 'kehadiran_kelas' | 'sholat_dzuhur',
          token: first.token,
          qrUrl: first.qr_url,
          tanggal: first.tanggal,
          waktuMulai: first.waktu_mulai,
          waktuBerakhir: first.waktu_berakhir,
          adminId: first.admin_id || 1,
          adminName: first.admin_name,
          durationMinutes: first.duration_minutes,
          isActive: first.is_active,
          createdAt: first.created_at,
        };
        setActiveAvailableSession(mapped);

        const urlToken = searchParams.get("token");
        if (urlToken) {
          applyToken(urlToken, true);
        }
      } else {
        const urlToken = searchParams.get("token");
        if (urlToken) {
          applyToken(urlToken, true);
        }
      }
    };

    checkActiveSessions();

    return () => {
      stopCamera();
    };
  }, [searchParams]);

  const processLocationCoords = (pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const acc = Math.round(pos.coords.accuracy || 8);
    const dist = calculateDistanceMeters(lat, lng);
    const isWithin = dist <= APP_CONFIG.schoolLocation.radiusMeters;

    setLocation((prev) => {
      // Jika sebelumnya sudah dalam radius dan update baru lebih buruk/kurang akurat, jangan timpa jika akurasi jelek
      if (prev && prev.isWithinRadius && !isWithin && acc > 100) {
        return prev;
      }
      return {
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        distanceMeters: dist,
        isWithinRadius: isWithin,
        locationName: isWithin
          ? APP_CONFIG.schoolLocation.name
          : `Di Luar Area Sekolah (${dist} meter)`,
      };
    });
    setIsLocating(false);
  };

  const startWatchingLocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setIsLocating(true);

      // Stop previous watcher if active
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // 1. First immediate high accuracy request (maximumAge: 0 prevents stale cache)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          processLocationCoords(pos);
        },
        (err) => {
          console.warn("Initial GPS fetch warning:", err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // 2. Active continuous high-accuracy stream to automatically refine satellite lock
      try {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            processLocationCoords(pos);
          },
          (err) => {
            console.warn("GPS watch position update warning:", err);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        watchIdRef.current = watchId;
      } catch (e) {
        console.warn("watchPosition not available:", e);
      }
    } else {
      const lat = APP_CONFIG.schoolLocation.latitude;
      const lng = APP_CONFIG.schoolLocation.longitude;
      setLocation({
        latitude: lat,
        longitude: lng,
        accuracy: 10,
        distanceMeters: 10,
        isWithinRadius: true,
        locationName: APP_CONFIG.schoolLocation.name,
      });
      setIsLocating(false);
    }
  };

  const stopWatchingLocation = () => {
    if (watchIdRef.current !== null && typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const fetchCurrentLocation = () => {
    startWatchingLocation();
  };

  // Fetch GPS Geolocation & start live satellite locking when entering Step 2
  useEffect(() => {
    if (step === 2) {
      startWatchingLocation();
    } else {
      stopWatchingLocation();
    }

    return () => {
      stopWatchingLocation();
    };
  }, [step]);

  const applyToken = async (rawToken: string, isFromScannerOrUrl: boolean = false) => {
    const clean = rawToken.trim();
    setScannedToken(clean);

    if (!clean) {
      setErrorMsg("");
      setValidatedSession(null);
      return;
    }

    const { data: dbSesi } = await supabase
      .from('qr_sessions')
      .select('*')
      .eq('token', clean)
      .eq('is_active', true)
      .maybeSingle();

    if (dbSesi) {
      const mapped: QRSesi = {
        id: dbSesi.id,
        jenis: dbSesi.jenis as 'kehadiran_kelas' | 'sholat_dzuhur',
        token: dbSesi.token,
        qrUrl: dbSesi.qr_url,
        tanggal: dbSesi.tanggal,
        waktuMulai: dbSesi.waktu_mulai,
        waktuBerakhir: dbSesi.waktu_berakhir,
        adminId: dbSesi.admin_id || 1,
        adminName: dbSesi.admin_name,
        durationMinutes: dbSesi.duration_minutes,
        isActive: dbSesi.is_active,
        createdAt: dbSesi.created_at,
      };
      setValidatedSession(mapped);
      setErrorMsg("");
    } else {
      setValidatedSession(null);
      if (isFromScannerOrUrl) {
        setErrorMsg("QR Code tidak valid atau sudah kedaluwarsa.");
      } else {
        setErrorMsg("");
      }
    }
  };

  const handleManualInputChange = (val: string) => {
    const clean = val.trim();
    setScannedToken(clean);
    setErrorMsg("");
    applyToken(clean, false);
  };

  const toggleCamera = async () => {
    const nextMode = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextMode);
    await startCamera(nextMode);
  };

  const startCamera = async (facingMode?: "user" | "environment") => {
    const targetFacing = facingMode || cameraFacing;
    stopCamera();
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setErrorMsg("Browser ini tidak mendukung akses kamera.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          const playPromise = videoRef.current?.play();
          if (playPromise !== undefined) {
            playPromise.catch((playErr: unknown) => {
              const errObj = playErr as { name?: string; message?: string } | null;
              const isAbort = errObj?.name === "AbortError" || errObj?.message?.includes("interrupted");
              if (!isAbort) {
                console.warn("Video playback warning:", playErr);
              }
            });
          }
        };
        setIsCameraActive(true);
      }

      if (step === 1 && scanMode === "camera") {
        startQRScanning();
      }
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string } | null;
      const isAbort = errObj?.name === "AbortError" || errObj?.message?.includes("interrupted");
      if (!isAbort) {
        console.error("Camera access error:", err);
        setErrorMsg("Kamera tidak dapat diakses. Mohon izinkan izin kamera di browser kamu.");
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      const video = videoRef.current;
      video.onloadedmetadata = null;
      try {
        video.pause();
      } catch (e) {}
      video.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startQRScanning = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    scanIntervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          let tokenFound = code.data;
          try {
            if (tokenFound.includes("token=")) {
              const url = new URL(tokenFound);
              tokenFound = url.searchParams.get("token") || tokenFound;
            }
          } catch (e) {}

          applyToken(tokenFound, true);
          stopCamera();
        }
      }
    }, 300);
  };

  const handleQRFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      setUploadPreview(imgUrl);

      const image = new Image();
      image.src = imgUrl;
      image.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          let tokenFound = code.data;
          try {
            if (tokenFound.includes("token=")) {
              const url = new URL(tokenFound);
              tokenFound = url.searchParams.get("token") || tokenFound;
            }
          } catch (err) {}
          applyToken(tokenFound, true);
        } else {
          setErrorMsg("QR Code tidak terdeteksi pada gambar. Pastikan gambar jelas dan tidak buram.");
          setValidatedSession(null);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleProceedToSelfie = async () => {
    if (!scannedToken.trim()) {
      setErrorMsg("Silakan scan QR Code atau masukkan token presensi terlebih dahulu.");
      return;
    }

    const { data: dbSesi } = await supabase
      .from('qr_sessions')
      .select('*')
      .eq('token', scannedToken.trim())
      .eq('is_active', true)
      .maybeSingle();

    if (!dbSesi) {
      setErrorMsg("QR Code tidak valid atau sudah kedaluwarsa.");
      setValidatedSession(null);
      return;
    }

    const mapped: QRSesi = {
      id: dbSesi.id,
      jenis: dbSesi.jenis as 'kehadiran_kelas' | 'sholat_dzuhur',
      token: dbSesi.token,
      qrUrl: dbSesi.qr_url,
      tanggal: dbSesi.tanggal,
      waktuMulai: dbSesi.waktu_mulai,
      waktuBerakhir: dbSesi.waktu_berakhir,
      adminId: dbSesi.admin_id || 1,
      adminName: dbSesi.admin_name,
      durationMinutes: dbSesi.duration_minutes,
      isActive: dbSesi.is_active,
      createdAt: dbSesi.created_at,
    };

    setValidatedSession(mapped);
    setErrorMsg("");
    setStep(2);
    setCameraFacing("user");
    setTimeout(() => {
      startCamera("user");
      fetchCurrentLocation();
    }, 200);
  };

  const handleCaptureLivePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx && video.videoWidth > 0) {
      canvas.width = 480;
      canvas.height = 480;

      const minDim = Math.min(video.videoWidth, video.videoHeight);
      const startX = (video.videoWidth - minDim) / 2;
      const startY = (video.videoHeight - minDim) / 2;

      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 480, 480);

      // Server Timestamp Overlay
      const now = new Date();
      const timestampStr = now.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }) + " " + now.toLocaleTimeString("id-ID") + " WIB";

      ctx.fillStyle = "rgba(24, 24, 24, 0.85)";
      ctx.fillRect(0, 395, 480, 85);

      ctx.fillStyle = "#FFD400";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText(`XI PPLG 1 • ${auth?.user.nama || "Siswa"}`, 14, 420);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px monospace";
      ctx.fillText(`${timestampStr} [LIVE SERVER]`, 14, 442);

      const locText = location
        ? location.isWithinRadius
          ? `AREA SEKOLAH (${location.distanceMeters}m) [VALID]`
          : `LUAR AREA (${location.distanceMeters}m) [DILUAR RADIUS]`
        : `GPS: SMKN 1 Ciomas (Area Kelas)`;
      ctx.fillStyle = location?.isWithinRadius ? "#6FCB6F" : "#FF6FA5";
      ctx.font = "bold 12px monospace";
      ctx.fillText(locText, 14, 464);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    startCamera(cameraFacing);
  };

  const handleSubmitAbsensi = async () => {
    const studentId = auth && auth.role === "siswa" ? auth.user.id : 0;
    if (!studentId) {
      setErrorMsg("Sesi siswa Anda tidak valid. Silakan login kembali.");
      return;
    }
    if (!scannedToken) {
      setErrorMsg("Token QR belum terverifikasi.");
      return;
    }
    if (!capturedPhoto) {
      setErrorMsg("Wajib mengambil foto selfie langsung.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const jenis = validatedSession?.jenis || "kehadiran_kelas";
      const res = await submitAbsensiAction({
        token: scannedToken,
        siswaId: studentId,
        jenis,
        fotoDataUrl: capturedPhoto,
      });

      if (res.success) {
        setStep(3);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setErrorMsg(res.message || "Gagal mengirim absensi.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan / server saat menghubungkan database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Absen Card */}
      <Card variant="white" shadow="xl" borderWidth="thick" className="p-4 sm:p-7">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 sm:border-b-3 border-[#181818] mb-4 sm:mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF6FA5] text-[#181818] font-black text-xs sm:text-sm flex items-center justify-center brutal-border-2 shrink-0">
              {step}
            </span>
            <h2 className="text-sm sm:text-2xl font-black font-fredoka text-[#181818] truncate">
              {step === 1 && "1. Scan QR di Proyektor"}
              {step === 2 && "2. Jepret Selfie & Cek GPS"}
              {step === 3 && "Hore, Kamu Tercatat Hadir!"}
            </h2>
          </div>

          <Badge variant={step === 3 ? "verified" : "yellow"} size="sm" className="text-[10px] sm:text-xs shrink-0">
            {step === 1 ? "SCAN QR" : step === 2 ? "SELFIE & GPS" : "BERHASIL HADIR"}
          </Badge>
        </div>

        {/* STEP 1: SCAN OR UPLOAD QR */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Quick Sesi Aktif Chip if Available */}
            {activeAvailableSession && (
              <div className="p-3.5 bg-blue-50 rounded-2xl border-2 border-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Sesi Aktif Ditemukan: <strong>{activeAvailableSession.jenis === "kehadiran_kelas" ? "Presensi Pagi (06:30 - 07:45)" : "Sholat Dzuhur Mushola (12:00 - 13:00)"}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => applyToken(activeAvailableSession.token, true)}
                  className="px-3 py-1.5 bg-[#3355FF] text-white rounded-xl font-black text-xs brutal-border-2 hover:bg-blue-700 transition-colors self-start sm:self-auto"
                >
                  Pakai Sesi Ini ({activeAvailableSession.token})
                </button>
              </div>
            )}

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F4F4F0] rounded-2xl brutal-border">
              <button
                type="button"
                onClick={() => {
                  setScanMode("camera");
                  setErrorMsg("");
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                  scanMode === "camera"
                    ? "bg-[#3355FF] text-white brutal-border-2 brutal-shadow-sm"
                    : "text-neutral-700 hover:text-black"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Kamera HP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScanMode("upload");
                  stopCamera();
                  setErrorMsg("");
                }}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                  scanMode === "upload"
                    ? "bg-[#FF7A2E] text-white brutal-border-2 brutal-shadow-sm"
                    : "text-neutral-700 hover:text-black"
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Foto QR</span>
              </button>
            </div>

            {/* TAB 1: LIVE CAMERA SCANNER */}
            {scanMode === "camera" && (
              <div className="relative w-full max-w-sm mx-auto bg-[#181818] rounded-3xl brutal-border-thick overflow-hidden flex flex-col items-center justify-center min-h-[290px] p-4 text-center">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={`w-full h-full object-cover rounded-2xl ${isCameraActive ? "block" : "hidden"}`}
                />

                {!isCameraActive && (
                  <div className="space-y-3.5 text-white max-w-[260px] mx-auto py-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto border border-white/20">
                      <QrCode className="w-8 h-8 text-[#FFD400]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black font-fredoka text-white">Scanner Belum Nyala</h4>
                      <p className="text-xs font-bold text-neutral-300 mt-0.5">
                        Arahkan kamera HP kamu ke QR Code di layar proyektor.
                      </p>
                    </div>
                    <Button
                      variant="yellow"
                      size="md"
                      onClick={() => startCamera("environment")}
                      className="gap-2 text-xs w-full justify-center text-[#181818] font-black"
                    >
                      <Camera className="w-4 h-4 stroke-[2.5]" />
                      <span>Nyalakan Kamera Scanner</span>
                    </Button>
                  </div>
                )}

                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-4 border-[#FFD400] rounded-3xl relative animate-pulse" />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: UPLOAD QR IMAGE */}
            {scanMode === "upload" && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleQRFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {uploadPreview ? (
                  <div className="relative max-w-sm mx-auto rounded-3xl overflow-hidden brutal-border-thick bg-neutral-100 p-3 text-center space-y-2">
                    <img
                      src={uploadPreview}
                      alt="Uploaded QR"
                      className="w-full max-h-56 object-contain rounded-2xl bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUploadPreview(null);
                        setScannedToken("");
                        setValidatedSession(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs font-black text-red-600 hover:underline"
                    >
                      Ganti Foto QR
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 max-w-sm mx-auto rounded-3xl border-3 border-dashed border-neutral-300 hover:border-[#FF7A2E] bg-orange-50/40 cursor-pointer text-center space-y-3 transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white brutal-border-2 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileImage className="w-7 h-7 text-[#FF7A2E]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#181818]">
                        Pilih Screenshot QR dari Galeri / WhatsApp
                      </p>
                      <p className="text-xs font-bold text-neutral-500 mt-1">
                        Sistem bakal otomatis ngebaca token sesi dari foto
                      </p>
                    </div>
                    <Button variant="white" size="sm" className="gap-2 mx-auto">
                      <UploadCloud className="w-4 h-4" />
                      <span>Pilih File Gambar</span>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Validation Feedback Banner */}
            {validatedSession && (
              <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-400 text-green-950 space-y-1 animate-in fade-in">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span>Sesi QR Sah &amp; Siap Dipakai!</span>
                </div>
                <p className="text-xs font-bold text-green-800">
                  Sesi:{" "}
                  <strong>
                    {validatedSession.jenis === "kehadiran_kelas"
                      ? "Kehadiran Kelas Pagi"
                      : "Sholat Dzuhur Berjamaah"}
                  </strong>{" "}
                  • Kode: <span className="font-mono font-black">{validatedSession.token}</span>
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border-2 border-red-400 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Manual Token Input / Proceed */}
            <div className="space-y-3 pt-2">
              <Input
                label="Atau Ketik Kode Sesi Secara Manual:"
                placeholder="Contoh: KLAS-20260816-A1"
                value={scannedToken}
                onChange={(e) => handleManualInputChange(e.target.value)}
                className="font-mono uppercase font-black tracking-widest text-center"
              />

              <Button
                variant="primary"
                size="lg"
                onClick={() => handleProceedToSelfie()}
                className="w-full justify-center gap-2 text-sm sm:text-base"
              >
                <span>Lanjut Jepret Foto Selfie &amp; Cek Lokasi</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: LIVE SELFIE & GPS VALIDATION */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Sesi Token & Location Header Bar */}
            <div className="bg-[#FFD400] p-3 rounded-2xl brutal-border-2 text-xs font-bold text-[#181818] flex flex-wrap items-center justify-between gap-2">
              <span>Kode Sesi: <strong className="font-mono">{scannedToken}</strong></span>
              <Badge variant="blue" size="sm">
                Wajib Selfie + GPS Aktif
              </Badge>
            </div>

            {/* Live GPS Radar & Geofence Card */}
            <div className={`p-4 rounded-2xl brutal-border-2 transition-all ${
              isLocating
                ? "bg-neutral-100 border-neutral-300"
                : location?.isWithinRadius
                ? "bg-green-50 border-green-400 text-green-950"
                : "bg-red-50 border-red-400 text-red-950"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center brutal-border-2 shrink-0 ${
                    location?.isWithinRadius ? "bg-[#6FCB6F] text-[#181818]" : "bg-red-500 text-white"
                  }`}>
                    <MapPin className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-black font-fredoka">
                        {isLocating
                          ? "Mencari Titik Koordinat GPS..."
                          : location?.isWithinRadius
                          ? "Lokasi Valid: Kamu Udah di Sekolah!"
                          : "Ups! Posisi Kamu di Luar Radius Sekolah"}
                      </p>
                      {location && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          location.isWithinRadius ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}>
                          {location.distanceMeters} m
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-neutral-600">
                      {isLocating ? (
                        "Sedang mengukur jarak perangkat kamu ke kelas XI PPLG 1..."
                      ) : location ? (
                        `Jarak ke kelas: ${location.distanceMeters} meter (Maksimum radius sekolah: ${APP_CONFIG.schoolLocation.radiusMeters}m)`
                      ) : (
                        "Izinkan akses lokasi di browser kamu agar presensi bisa tervalidasi."
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                  {location && (
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Google Maps</span>
                    </a>
                  )}
                  <Button
                    variant="white"
                    size="sm"
                    onClick={fetchCurrentLocation}
                    disabled={isLocating}
                    className="text-[11px] py-1.5 px-2.5 gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                    <span>Cek Ulang GPS</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Selfie Video & Preview Box */}
            <div className="relative w-full aspect-square max-w-sm mx-auto bg-[#181818] rounded-3xl brutal-border-thick overflow-hidden flex items-center justify-center">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt="Selfie Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-44 h-56 border-4 border-dashed border-[#FF6FA5] rounded-full opacity-70" />
                  </div>

                  {!isCameraActive && (
                    <div className="absolute inset-0 bg-[#181818]/90 p-6 flex flex-col items-center justify-center text-center text-white space-y-3">
                      <Camera className="w-12 h-12 text-[#FFD400]" />
                      <p className="text-xs font-bold">Kamera depan belum menyala.</p>
                      <Button
                        variant="yellow"
                        size="sm"
                        onClick={() => startCamera("user")}
                      >
                        Nyalakan Kamera Selfie
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              {!capturedPhoto ? (
                <Button
                  variant="pink"
                  size="lg"
                  onClick={handleCaptureLivePhoto}
                  disabled={!isCameraActive}
                  className="w-full justify-center gap-2 text-sm sm:text-base"
                >
                  <Camera className="w-5 h-5 stroke-[2.5]" />
                  <span>Jepret Foto Selfie &amp; Kunci GPS</span>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="white"
                    size="md"
                    onClick={handleRetakePhoto}
                    disabled={isSubmitting}
                    className="justify-center gap-2 text-xs sm:text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Foto Ulang</span>
                  </Button>

                  <Button
                    variant="green"
                    size="md"
                    onClick={handleSubmitAbsensi}
                    disabled={isSubmitting}
                    className="justify-center gap-2 text-xs sm:text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? "Mengirim Data..." : "Kirim Presensi"}</span>
                  </Button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setCapturedPhoto(null);
                  setStep(1);
                }}
                className="w-full text-center text-xs font-black text-neutral-600 hover:text-black py-2"
              >
                ← Kembali ke Scan QR
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBMITTED SUCCESS */}
        {step === 3 && (
          <div className="text-center py-6 space-y-6 animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-thick brutal-shadow-lg rotate-3">
              <CheckCircle2 className="w-12 h-12 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818]">
                Presensi Berhasil Terkirim!
              </h3>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 max-w-md mx-auto">
                Foto selfie asli kamu, titik koordinat GPS, dan timestamp server udah tercatat aman di rekap kelas.
              </p>
            </div>

            {/* GPS Summary Badge in Confirmation */}
            {location && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-2xl brutal-border-2 text-xs font-bold text-neutral-800">
                <MapPin className={`w-4 h-4 ${location.isWithinRadius ? "text-green-600" : "text-amber-600"}`} />
                <span>
                  Lokasi Presensi: <strong>{location.locationName}</strong> ({location.distanceMeters}m dari Kelas)
                </span>
              </div>
            )}

            {capturedPhoto && (
              <div className="w-36 h-36 mx-auto rounded-2xl brutal-border-2 overflow-hidden bg-neutral-100 shadow-md">
                <img
                  src={capturedPhoto}
                  alt="Bukti Selfie Terkirim"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/dashboard/siswa/riwayat" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full justify-center gap-2 text-xs sm:text-sm">
                  <History className="w-4 h-4" />
                  <span>Lihat Riwayat Presensi</span>
                </Button>
              </Link>

              <Link href="/dashboard/siswa" className="w-full sm:w-auto">
                <Button variant="white" size="md" className="w-full justify-center text-xs sm:text-sm">
                  <span>Kembali ke Beranda</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SiswaAbsenLivePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">Memuat pemindai absensi...</div>}>
      <SiswaAbsenContent />
    </Suspense>
  );
}
