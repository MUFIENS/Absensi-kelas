"use client";

import React from "react";
import { User, Zap, Sparkles, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Illustrated Top Sticker Badge with Student Vector Avatars & Live Protocol
export function HeroTopStickerBadge({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-2.5 bg-[#FFD400] text-[#181818] p-1.5 sm:p-2 pr-4 rounded-2xl brutal-border-thick brutal-shadow-lg font-fredoka font-black transform -rotate-2 hover:rotate-0 transition-transform select-none cursor-pointer group",
        className
      )}
    >
      {/* 3 Overlapping Student Vector Avatar Badges (Pure SVG / Lucide Icons) */}
      <div className="flex items-center -space-x-2 bg-white px-2.5 py-1 rounded-xl brutal-border-2 brutal-shadow-sm">
        <div className="w-6 h-6 rounded-full bg-[#3355FF] text-white flex items-center justify-center brutal-border">
          <User className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div className="w-6 h-6 rounded-full bg-[#FF6FA5] text-white flex items-center justify-center brutal-border">
          <User className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <div className="w-6 h-6 rounded-full bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border">
          <User className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <span className="text-[11px] font-black text-[#181818] pl-2 font-mono">
          46/46
        </span>
      </div>

      {/* Text Label */}
      <span className="text-xs sm:text-sm font-black text-[#181818] tracking-tight uppercase group-hover:scale-105 transition-transform">
        OFFICIAL APP XI PPLG 1 • SMKN 1 CIOMAS
      </span>
    </div>
  );
}

// 2. Camera Selfie Pop Doodle
export function CameraDoodle({
  className = "w-16 h-16",
}: {
  className?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[4px_4px_0px_#181818]", className)}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Flash Beam */}
        <polygon points="60,5 50,25 70,25" fill="#FFD400" stroke="#181818" strokeWidth="4" />
        <circle cx="60" cy="8" r="4" fill="#FF4D4D" stroke="#181818" strokeWidth="2" />

        {/* Camera Body */}
        <rect x="15" y="30" width="90" height="75" rx="18" fill="#FF6FA5" stroke="#181818" strokeWidth="6" />
        <rect x="40" y="20" width="40" height="15" rx="6" fill="#FFD400" stroke="#181818" strokeWidth="5" />

        {/* Big Lens */}
        <circle cx="60" cy="68" r="26" fill="#3355FF" stroke="#181818" strokeWidth="6" />
        <circle cx="60" cy="68" r="18" fill="#181818" />
        <circle cx="53" cy="61" r="6" fill="#FFFFFF" />
        <circle cx="67" cy="74" r="2.5" fill="#FFFFFF" />

        {/* Viewfinder & Flash */}
        <rect x="25" y="42" width="14" height="10" rx="3" fill="#FFFFFF" stroke="#181818" strokeWidth="3" />
        <circle cx="92" cy="48" r="6" fill="#FFD400" stroke="#181818" strokeWidth="3" />
      </svg>
    </div>
  );
}

// 3. QR Laser Scanner Doodle
export function QRScanDoodle({
  className = "w-16 h-16",
}: {
  className?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[4px_4px_0px_#181818]", className)}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Card Background */}
        <rect x="12" y="12" width="96" height="96" rx="20" fill="#FFFFFF" stroke="#181818" strokeWidth="6" />
        {/* Corner Targets */}
        <rect x="24" y="24" width="24" height="24" rx="5" fill="#3355FF" stroke="#181818" strokeWidth="4" />
        <rect x="30" y="30" width="12" height="12" fill="#FFFFFF" />
        <rect x="72" y="24" width="24" height="24" rx="5" fill="#3355FF" stroke="#181818" strokeWidth="4" />
        <rect x="78" y="30" width="12" height="12" fill="#FFFFFF" />
        <rect x="24" y="72" width="24" height="24" rx="5" fill="#3355FF" stroke="#181818" strokeWidth="4" />
        <rect x="30" y="78" width="12" height="12" fill="#FFFFFF" />
        {/* Center Matrix Bits */}
        <rect x="56" y="56" width="10" height="10" fill="#181818" />
        <rect x="72" y="60" width="8" height="18" fill="#181818" />
        <rect x="56" y="76" width="18" height="8" fill="#181818" />
        <rect x="80" y="80" width="12" height="12" fill="#181818" />
        {/* Green Laser Line */}
        <line x1="16" y1="60" x2="104" y2="60" stroke="#4ADE80" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// 4. GPS Satellite / Pin Doodle
export function GPSRadarDoodle({
  className = "w-16 h-16",
}: {
  className?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[4px_4px_0px_#181818]", className)}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Waves */}
        <path d="M 30 50 A 35 35 0 0 1 90 50" stroke="#FFD400" strokeWidth="5" strokeLinecap="round" strokeDasharray="6 6" />
        <path d="M 20 40 A 50 50 0 0 1 100 40" stroke="#FF6FA5" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 6" />

        {/* Pin Body */}
        <path
          d="M 60 110 C 60 110 92 75 92 48 C 92 30 78 16 60 16 C 42 16 28 30 28 48 C 28 75 60 110 60 110 Z"
          fill="#FF4D4D"
          stroke="#181818"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Pin Center Eye */}
        <circle cx="60" cy="48" r="16" fill="#FFFFFF" stroke="#181818" strokeWidth="5" />
        <circle cx="60" cy="48" r="8" fill="#3355FF" />
      </svg>
    </div>
  );
}

// 5. Comic Pop Burst Pill with Pure Lucide Icon (Zero Emojis)
export function ComicBurstPill({
  text = "KLIK! SAH",
  color = "#6FCB6F",
  textColor = "#181818",
  className = "",
}: {
  text?: string;
  color?: string;
  textColor?: string;
  className?: string;
}) {
  return (
    <div
      style={{ backgroundColor: color, color: textColor }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl brutal-border-thick brutal-shadow font-fredoka font-black text-xs uppercase select-none animate-bounce",
        className
      )}
    >
      <Zap className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
      <span>{text}</span>
    </div>
  );
}
