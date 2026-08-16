"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Step 1 Illustration: Projector Screen Beaming QR Code
export function ProjectorScreenIllustration({
  className = "w-20 h-20",
}: {
  className?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[3px_3px_0px_#181818]", className)}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Screen Stand */}
        <line x1="50" y1="75" x2="50" y2="92" stroke="#181818" strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="92" x2="70" y2="92" stroke="#181818" strokeWidth="5" strokeLinecap="round" />

        {/* Projector Screen Canvas */}
        <rect x="12" y="16" width="76" height="58" rx="8" fill="#FFFFFF" stroke="#181818" strokeWidth="4" />
        <rect x="16" y="20" width="68" height="50" rx="4" fill="#3355FF" />

        {/* Projected QR Matrix on Screen */}
        <rect x="34" y="28" width="32" height="34" rx="4" fill="#FFFFFF" />
        <rect x="38" y="32" width="8" height="8" fill="#181818" />
        <rect x="54" y="32" width="8" height="8" fill="#181818" />
        <rect x="38" y="48" width="8" height="8" fill="#181818" />
        <rect x="54" y="48" width="8" height="8" fill="#FFD400" />
        <circle cx="50" cy="45" r="3" fill="#181818" />

        {/* Top Roll Bar */}
        <rect x="8" y="12" width="84" height="6" rx="3" fill="#FFD400" stroke="#181818" strokeWidth="3" />
      </svg>
    </div>
  );
}

// Step 2 Illustration: Smartphone Scanner Targeting QR
export function PhoneScannerIllustration({
  className = "w-20 h-20",
}: {
  className?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[3px_3px_0px_#181818]", className)}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Phone Body */}
        <rect x="22" y="10" width="56" height="80" rx="14" fill="#FFD400" stroke="#181818" strokeWidth="4" />
        <rect x="28" y="18" width="44" height="64" rx="8" fill="#181818" />

        {/* Scanner Viewfinder Box */}
        <rect x="34" y="28" width="32" height="32" rx="4" stroke="#4ADE80" strokeWidth="2.5" strokeDasharray="6 3" />
        
        {/* QR Code inside Phone */}
        <rect x="42" y="36" width="16" height="16" fill="#FFFFFF" rx="2" />
        <rect x="44" y="38" width="4" height="4" fill="#3355FF" />
        <rect x="52" y="38" width="4" height="4" fill="#3355FF" />
        <rect x="44" y="46" width="4" height="4" fill="#3355FF" />

        {/* Red/Green Laser Line */}
        <line x1="32" y1="44" x2="68" y2="44" stroke="#FF4D4D" strokeWidth="2.5" strokeLinecap="round" />

        {/* Home Indicator */}
        <line x1="42" y1="76" x2="58" y2="76" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Step 3 Illustration: Live Selfie with GPS Radar Badge
export function SelfieGPSIllustration({
  className = "w-20 h-20",
}: {
  className?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[3px_3px_0px_#181818]", className)}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Polaroid Card */}
        <rect x="14" y="12" width="72" height="76" rx="10" fill="#FFFFFF" stroke="#181818" strokeWidth="4" />
        {/* Photo Viewport */}
        <rect x="20" y="18" width="60" height="50" rx="6" fill="#FF6FA5" />

        {/* Person Silhouette Head & Body */}
        <circle cx="50" cy="36" r="12" fill="#FFD400" stroke="#181818" strokeWidth="3" />
        <path d="M 32 64 C 32 50 40 48 50 48 C 60 48 68 50 68 64 Z" fill="#3355FF" stroke="#181818" strokeWidth="3" />

        {/* Camera Flash Star */}
        <path d="M 68 20 L 72 26 L 78 28 L 72 30 L 68 36 L 64 30 L 58 28 L 64 26 Z" fill="#FFFFFF" />

        {/* Bottom Location Indicator Bar */}
        <rect x="24" y="74" width="34" height="6" rx="3" fill="#6FCB6F" />
        <circle cx="68" cy="77" r="3" fill="#FF4D4D" />
      </svg>
    </div>
  );
}

// Step 4 Illustration: Verified Certificate & Checkmark
export function VerifiedCheckIllustration({
  className = "w-20 h-20",
}: {
  className?: string;
}) {
  return (
    <div className={cn("inline-block select-none drop-shadow-[3px_3px_0px_#181818]", className)}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Certificate / Sheet */}
        <rect x="18" y="14" width="64" height="72" rx="8" fill="#FFFFFF" stroke="#181818" strokeWidth="4" />

        {/* Lines of text on Sheet */}
        <line x1="28" y1="28" x2="52" y2="28" stroke="#181818" strokeWidth="4" strokeLinecap="round" />
        <line x1="28" y1="38" x2="62" y2="38" stroke="#E5E5E5" strokeWidth="3" strokeLinecap="round" />
        <line x1="28" y1="46" x2="58" y2="46" stroke="#E5E5E5" strokeWidth="3" strokeLinecap="round" />

        {/* Big Green Verified Seal */}
        <circle cx="58" cy="62" r="18" fill="#6FCB6F" stroke="#181818" strokeWidth="3.5" />
        <path d="M 49 62 L 55 68 L 68 55" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Gold Ribbon on Seal */}
        <polygon points="52,78 48,90 58,85 68,90 64,78" fill="#FFD400" stroke="#181818" strokeWidth="2.5" />
      </svg>
    </div>
  );
}
