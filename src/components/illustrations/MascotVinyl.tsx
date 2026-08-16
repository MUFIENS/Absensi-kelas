"use client";

import React from "react";
import { motion } from "framer-motion";

export function MascotVinyl({
  className = "w-72 h-72 sm:w-88 sm:h-88",
  pose = "waving",
  animated = true,
}: {
  className?: string;
  pose?: "waving" | "scanning" | "celebrating";
  animated?: boolean;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* 1. Floor Shadow (Subtle pulsing on ground) */}
      <motion.div
        animate={
          animated
            ? {
                scaleX: [1, 0.85, 1],
                scaleY: [1, 0.85, 1],
                opacity: [0.35, 0.2, 0.35],
              }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-2 w-52 h-6 bg-[#181818] rounded-full blur-[1px] pointer-events-none"
      />

      {/* 2. Unified Mascot Body (Ultra Smooth Bob & Cute Tilt) */}
      <motion.div
        animate={
          animated
            ? {
                y: [0, -10, 0],
                rotate: [-1.5, 1.5, -1.5],
              }
            : {}
        }
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-full h-full relative"
      >
        <svg
          viewBox="0 0 360 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[6px_6px_0px_#181818]"
        >
          {/* ================= ANTENNA ================= */}
          <g>
            <rect
              x="173"
              y="18"
              width="14"
              height="30"
              rx="6"
              fill="#FF7A2E"
              stroke="#181818"
              strokeWidth="5"
            />
            {/* Pulsing Light Bulb */}
            <circle
              cx="180"
              cy="16"
              r="15"
              fill="#FFD400"
              stroke="#181818"
              strokeWidth="5"
            />
            <circle cx="175" cy="12" r="4.5" fill="#FFFFFF" />
          </g>

          {/* ================= ROBOT CRT HEAD ================= */}
          {/* Outer Head (Bright Sun Yellow) */}
          <rect
            x="60"
            y="42"
            width="240"
            height="180"
            rx="46"
            fill="#FFD400"
            stroke="#181818"
            strokeWidth="7"
          />

          {/* Glossy Plastic Reflection Bar */}
          <path
            d="M 95 62 Q 180 50 265 62"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.9"
          />

          {/* Inner Screen Bezel (Ink Black Frame) */}
          <rect
            x="85"
            y="72"
            width="190"
            height="130"
            rx="28"
            fill="#181818"
          />

          {/* Screen Glass (Brutal Blue) */}
          <rect
            x="93"
            y="80"
            width="174"
            height="114"
            rx="22"
            fill="#3355FF"
          />

          {/* CRT Screen Glare */}
          <path
            d="M 105 92 L 155 92 L 120 182 L 98 182 Z"
            fill="#FFFFFF"
            opacity="0.15"
          />

          {/* ================= EYES & FACE ================= */}
          {/* Left Eye */}
          <g>
            <ellipse cx="140" cy="132" rx="20" ry="26" fill="#FFFFFF" stroke="#181818" strokeWidth="4" />
            <ellipse cx="143" cy="132" rx="12" ry="17" fill="#181818" />
            {/* Sparkle highlights */}
            <circle cx="147" cy="124" r="5.5" fill="#FFFFFF" />
            <circle cx="137" cy="139" r="2.5" fill="#FFFFFF" />
          </g>

          {/* Right Eye */}
          <g>
            <ellipse cx="220" cy="132" rx="20" ry="26" fill="#FFFFFF" stroke="#181818" strokeWidth="4" />
            <ellipse cx="223" cy="132" rx="12" ry="17" fill="#181818" />
            {/* Sparkle highlights */}
            <circle cx="227" cy="124" r="5.5" fill="#FFFFFF" />
            <circle cx="217" cy="139" r="2.5" fill="#FFFFFF" />
          </g>

          {/* Pink Cheeks */}
          <ellipse cx="115" cy="160" rx="11" ry="6.5" fill="#FF6FA5" />
          <ellipse cx="245" cy="160" rx="11" ry="6.5" fill="#FF6FA5" />

          {/* Happy Open Smile */}
          <path
            d="M 165 152 Q 180 172 195 152 Z"
            fill="#FF6FA5"
            stroke="#181818"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 172 152 Q 180 160 188 152"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* ================= NECK CONNECTOR ================= */}
          <rect
            x="158"
            y="218"
            width="44"
            height="18"
            rx="5"
            fill="#181818"
          />

          {/* ================= BODY TORSO ================= */}
          {/* Main Body (Bubblegum Pink) */}
          <rect
            x="95"
            y="232"
            width="170"
            height="86"
            rx="30"
            fill="#FF6FA5"
            stroke="#181818"
            strokeWidth="7"
          />

          {/* Chest QR Scanner Screen */}
          <rect
            x="155"
            y="248"
            width="50"
            height="50"
            rx="12"
            fill="#FFFFFF"
            stroke="#181818"
            strokeWidth="4.5"
          />
          {/* QR Pixel Grid Patterns */}
          <rect x="163" y="256" width="10" height="10" fill="#3355FF" />
          <rect x="187" y="256" width="10" height="10" fill="#3355FF" />
          <rect x="163" y="280" width="10" height="10" fill="#3355FF" />
          <rect x="187" y="280" width="10" height="10" fill="#FF7A2E" />
          <rect x="175" y="268" width="10" height="10" fill="#6FCB6F" />

          {/* ================= FEET ================= */}
          {/* Left Foot */}
          <rect
            x="118"
            y="312"
            width="44"
            height="26"
            rx="13"
            fill="#3355FF"
            stroke="#181818"
            strokeWidth="6"
          />
          {/* Right Foot */}
          <rect
            x="198"
            y="312"
            width="44"
            height="26"
            rx="13"
            fill="#3355FF"
            stroke="#181818"
            strokeWidth="6"
          />

          {/* ================= HANDS / GLOVES ================= */}
          {/* Left Hand: Cute Welcoming Wave (Resting naturally on shoulder) */}
          <g>
            <path
              d="M 98 252 C 70 242 46 215 56 188 C 62 172 82 176 84 195 C 86 212 95 235 106 250"
              fill="#FFD400"
              stroke="#181818"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* White Glove */}
            <circle cx="58" cy="184" r="18" fill="#FFFFFF" stroke="#181818" strokeWidth="5.5" />
            <circle cx="48" cy="176" r="6.5" fill="#FFFFFF" stroke="#181818" strokeWidth="4" />
            <path d="M 52 192 C 58 196 66 194 70 188" stroke="#181818" strokeWidth="3.5" strokeLinecap="round" />
          </g>

          {/* Right Hand: Thumbs Up / Welcoming Side Glove */}
          <g>
            <path
              d="M 262 252 C 290 258 316 276 312 300 C 306 314 288 308 282 292 C 276 278 268 266 256 254"
              fill="#FFD400"
              stroke="#181818"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* White Glove */}
            <circle cx="312" cy="302" r="18" fill="#FFFFFF" stroke="#181818" strokeWidth="5.5" />
            <circle cx="320" cy="292" r="6.5" fill="#FFFFFF" stroke="#181818" strokeWidth="4" />
            <path d="M 302 308 C 308 312 316 310 320 304" stroke="#181818" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
