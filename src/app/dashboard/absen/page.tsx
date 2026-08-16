"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  getStoredAuth,
  getActiveQRSesi,
  submitAbsensi,
  loginSiswa
} from "@/lib/store";
import { AuthSession, Siswa, JenisAbsensi } from "@/lib/types";

export default function DashboardAbsenPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [scannedToken, setScannedToken] = useState<string>("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  // Refs for video & canvas
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);

    const activeKelas = getActiveQRSesi("kehadiran_kelas");
    if (activeKelas) {
      setScannedToken(activeKelas.token);
    }

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async (facingMode: "user" | "environment" = "user") => {
    stopCamera();
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setErrorMsg("Browser ini tidak mendukung akses kamera.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch((playErr: any) => {
              const isAbort = playErr?.name === "AbortError" || playErr?.message?.includes("interrupted");
              if (!isAbort) {
                console.warn("Video playback warning:", playErr);
              }
            });
          }
        };
        setIsCameraActive(true);
      }

      if (step === 1) {
        startQRScanning();
      }
    } catch (err: any) {
      const isAbort = err?.name === "AbortError" || err?.message?.includes("interrupted");
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
      streamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
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
          let extractedToken = code.data;
          if (code.data.includes("token=")) {
            extractedToken = code.data.split("token=")[1].split("&")[0];
          }
          setScannedToken(extractedToken);
          stopCamera();
          handleProceedToSelfie(extractedToken);
        }
      }
    }, 300);
  };

  const handleProceedToSelfie = (tokenToUse?: string) => {
    const token = tokenToUse || scannedToken;
    if (!token) {
      setErrorMsg("Mohon scan atau masukkan token QR terlebih dahulu.");
      return;
    }
    setErrorMsg("");
    setStep(2);
    setTimeout(() => {
      startCamera("user");
    }, 200);
  };

  const handleCaptureLivePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx && video.readyState >= 2) {
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
      ctx.fillRect(0, 420, 480, 60);

      ctx.fillStyle = "#FFD400";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`XI PPLG 1 • ${auth?.user.nama || "Siswa"}`, 16, 444);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "13px monospace";
      ctx.fillText(`${timestampStr} [LIVE SERVER TS]`, 16, 466);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    startCamera("user");
  };

  const handleSubmitAbsensi = () => {
    const studentId = auth && auth.role === "siswa" ? auth.user.id : 11;
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

    setTimeout(() => {
      const res = submitAbsensi(studentId, scannedToken, capturedPhoto);
      setIsSubmitting(false);

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
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Absen Card */}
      <Card variant="white" shadow="xl" borderWidth="thick" className="p-4 sm:p-8">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 sm:border-b-3 border-[#181818] mb-4 sm:mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FF6FA5] text-[#181818] font-black text-xs sm:text-sm flex items-center justify-center brutal-border-2 shrink-0">
              {step}
            </span>
            <h2 className="text-sm sm:text-2xl font-black font-fredoka text-[#181818] truncate">
              {step === 1 && "Langkah 1: Scan QR Code"}
              {step === 2 && "Langkah 2: Ambil Foto Selfie"}
              {step === 3 && "Absensi Berhasil Terkirim!"}
            </h2>
          </div>

          <Badge variant={step === 3 ? "verified" : "yellow"} size="sm" className="text-[10px] sm:text-xs shrink-0">
            {step === 1 ? "QR SCAN" : step === 2 ? "LIVE CAMERA" : "SUBMITTED"}
          </Badge>
        </div>

        {/* STEP 1: SCAN QR */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="relative w-full aspect-square max-w-sm mx-auto bg-[#181818] rounded-3xl brutal-border-thick overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {!isCameraActive && (
                <div className="p-6 text-center space-y-3 text-white">
                  <QrCode className="w-16 h-16 mx-auto text-[#FFD400]" />
                  <p className="text-xs sm:text-sm font-bold text-neutral-300">
                    Arahkan kamera ke QR Code di proyektor kelas.
                  </p>
                  <Button
                    variant="yellow"
                    size="md"
                    onClick={() => startCamera("environment")}
                    className="gap-2 text-xs"
                  >
                    <Camera className="w-4 h-4 stroke-[3]" />
                    <span>Aktifkan Scanner Kamera</span>
                  </Button>
                </div>
              )}

              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-4 border-[#FFD400] rounded-3xl relative animate-pulse" />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Input
                label="Atau Masukkan Kode Token Sesi:"
                placeholder="Contoh: KLAS-20260816-A1"
                value={scannedToken}
                onChange={(e) => setScannedToken(e.target.value.toUpperCase())}
                className="font-mono uppercase font-black tracking-widest text-center"
              />

              {errorMsg && (
                <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                onClick={() => handleProceedToSelfie()}
                className="w-full justify-center gap-2"
              >
                <span>Lanjut Ambil Foto Selfie Live</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: LIVE SELFIE */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-[#FFD400] p-3 rounded-2xl brutal-border-2 text-xs font-bold text-[#181818] flex items-center justify-between">
              <span>Token QR: <strong className="font-mono">{scannedToken}</strong></span>
              <span className="bg-white px-2 py-0.5 rounded-md">Wajib Kamera Langsung</span>
            </div>

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
                      <p className="text-xs font-bold">Kamera selfie belum aktif.</p>
                      <Button
                        variant="yellow"
                        size="sm"
                        onClick={() => startCamera("user")}
                      >
                        Buka Kamera Selfie
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

            <div className="space-y-3">
              {!capturedPhoto ? (
                <Button
                  variant="pink"
                  size="xl"
                  onClick={handleCaptureLivePhoto}
                  className="w-full justify-center gap-2"
                >
                  <Camera className="w-6 h-6 stroke-[3]" />
                  <span>Jepret Foto Wajah (Live)</span>
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="white"
                    size="lg"
                    onClick={handleRetakePhoto}
                    className="justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                    Foto Ulang
                  </Button>

                  <Button
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    onClick={handleSubmitAbsensi}
                    className="justify-center gap-2"
                  >
                    {isSubmitting ? "Mengirim Data..." : "Kirim Absensi"}
                  </Button>
                </div>
              )}

              <button
                onClick={() => {
                  stopCamera();
                  setStep(1);
                }}
                className="w-full text-center text-xs font-bold text-neutral-500 hover:text-black pt-2"
              >
                ◀ Kembali ke Langkah Scan QR
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="py-8 text-center space-y-6 animate-in zoom-in-95">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-thick brutal-shadow-lg animate-bounce">
              <CheckCircle2 className="w-12 h-12 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black font-fredoka text-[#181818]">
                Absensi Berhasil Terkirim!
              </h3>
              <p className="text-sm font-bold text-neutral-700 max-w-md mx-auto">
                Foto selfie live bertanggal server kamu telah tersimpan dengan status <strong>Pending</strong> menunggu verifikasi admin.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link href="/dashboard/riwayat">
                <Button variant="primary" size="lg" className="gap-2">
                  <History className="w-4 h-4 stroke-[2.5]" />
                  <span>Lihat Riwayat Saya</span>
                </Button>
              </Link>

              <Button
                variant="yellow"
                size="lg"
                onClick={() => {
                  setStep(1);
                  setCapturedPhoto(null);
                }}
              >
                Absen Sesi Lain
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
