"use client";

import React, { useState } from "react";
import { QrCode, Camera, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

export function RetroCRTMonitor() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="relative max-w-2xl mx-auto my-8 select-none">
      {/* Outer Monitor Frame (Chunky Blue / Black Retro Arcade CRT) */}
      <div className="bg-[#3355FF] p-5 sm:p-7 rounded-[40px] brutal-border-thick brutal-shadow-xl relative overflow-hidden">
        {/* Decorative Screw Rivets */}
        <div className="absolute top-4 left-5 w-4 h-4 rounded-full bg-[#181818] flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-white rotate-45" />
        </div>
        <div className="absolute top-4 right-5 w-4 h-4 rounded-full bg-[#181818] flex items-center justify-center">
          <div className="w-2.5 h-0.5 bg-white rotate-45" />
        </div>

        {/* Top Monitor Header Label */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b-3 border-[#181818]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 brutal-border-2 animate-pulse" />
            <span className="text-xs sm:text-sm font-black font-fredoka text-white tracking-widest uppercase">
              SMART-CRT // XI-PPLG-1 // LIVE SIMULATION
            </span>
          </div>
          <Badge variant="yellow" size="sm">
            PROTOTYPE V1.0
          </Badge>
        </div>

        {/* Inner CRT Screen */}
        <div className="bg-[#121629] text-[#70FF94] p-5 sm:p-7 rounded-3xl brutal-border font-mono relative overflow-hidden min-h-[300px] flex flex-col justify-between crt-scanlines">
          {/* Top Status */}
          <div className="flex items-center justify-between text-xs font-bold border-b border-[#70FF94]/30 pb-2">
            <span>MODE: {activeStep === 1 ? "QR_SESSION_SCAN" : activeStep === 2 ? "LIVE_SELFIE_LOCK" : "ADMIN_VERIFY_FLOW"}</span>
            <span className="text-[#FFD400]">STEP {activeStep} / 3</span>
          </div>

          {/* Interactive Step Content */}
          <div className="py-6 my-auto text-center">
            {activeStep === 1 && (
              <div className="space-y-3 animate-in fade-in">
                <div className="inline-flex p-3 bg-white text-[#181818] rounded-2xl brutal-border brutal-shadow-sm">
                  <QrCode className="w-20 h-20 sm:w-24 sm:h-24" />
                </div>
                <h4 className="text-base sm:text-lg font-black text-white font-fredoka">
                  Langkah 1: Scan Dynamic QR Code
                </h4>
                <p className="text-xs sm:text-sm text-[#70FF94]/80 max-w-md mx-auto">
                  QR berganti otomatis tiap hari dan memiliki batas waktu expired. Siswa wajib berada di lokasi saat QR aktif.
                </p>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-3 animate-in fade-in">
                <div className="relative inline-flex p-2 bg-[#FF6FA5] rounded-2xl brutal-border brutal-shadow-sm">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#181818] rounded-xl flex items-center justify-center text-white">
                    <Camera className="w-10 h-10 text-[#FFD400]" />
                  </div>
                  <span className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full brutal-border-2">
                    NO GALLERY
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-white font-fredoka">
                  Langkah 2: Ambil Foto Selfie Langsung
                </h4>
                <p className="text-xs sm:text-sm text-[#70FF94]/80 max-w-md mx-auto">
                  Kamera dipaksa live capture (tidak bisa pilih dari galeri HP) + Server-side Timestamp otomatis terpatri.
                </p>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-3 animate-in fade-in">
                <div className="inline-flex p-3 bg-[#6FCB6F] text-[#181818] rounded-2xl brutal-border brutal-shadow-sm">
                  <ShieldCheck className="w-20 h-20 sm:w-24 sm:h-24 stroke-[2.5]" />
                </div>
                <h4 className="text-base sm:text-lg font-black text-white font-fredoka">
                  Langkah 3: Verifikasi Admin & Rekap Otomatis
                </h4>
                <p className="text-xs sm:text-sm text-[#70FF94]/80 max-w-md mx-auto">
                  Admin/Sekretaris memeriksa foto bukti sebelum status berubah menjadi <strong>Verified</strong> dan masuk ke rekap 46 siswa.
                </p>
              </div>
            )}
          </div>

          {/* Screen Bottom Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-[#70FF94]/30 text-xs">
            <span className="text-neutral-400 font-sans font-bold">Tekan tombol arcade di bawah:</span>
            <span className="text-[#FF6FA5] font-black animate-pulse">● SIGNAL ONLINE</span>
          </div>
        </div>

        {/* Bottom Arcade Buttons Bar */}
        <div className="mt-4 flex items-center justify-between pt-2">
          {/* Arrow Step Switchers */}
          <div className="flex items-center gap-2">
            <Button
              variant="yellow"
              size="sm"
              onClick={() => setActiveStep(activeStep === 1 ? 3 : (activeStep - 1 as 1 | 2 | 3))}
              className="px-3"
            >
              ◀ PREV
            </Button>
            <Button
              variant="yellow"
              size="sm"
              onClick={() => setActiveStep(activeStep === 3 ? 1 : (activeStep + 1 as 1 | 2 | 3))}
              className="px-3"
            >
              NEXT ▶
            </Button>
          </div>

          {/* Step Badges */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setActiveStep(step as 1 | 2 | 3)}
                className={`w-9 h-9 rounded-xl font-black text-sm transition-all brutal-btn-press brutal-border-2 ${
                  activeStep === step
                    ? "bg-[#FF6FA5] text-[#181818] brutal-shadow-sm scale-110"
                    : "bg-white text-[#181818] opacity-80 hover:opacity-100"
                }`}
              >
                {step}
              </button>
            ))}
          </div>

          {/* Big Red "GO" Arcade Button */}
          <button
            onClick={() => setActiveStep(activeStep === 3 ? 1 : (activeStep + 1 as 1 | 2 | 3))}
            className="w-12 h-12 rounded-full bg-[#FF7A2E] text-white font-black font-fredoka text-sm flex items-center justify-center brutal-border-thick brutal-shadow brutal-btn-press hover:bg-orange-600"
          >
            GO!
          </button>
        </div>
      </div>
    </div>
  );
}
