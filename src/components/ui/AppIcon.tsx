"use client";

import React from "react";
import { Icon, IconProps } from "@iconify/react";
import { cn } from "@/lib/utils";

export interface AppIconProps extends Omit<IconProps, "icon"> {
  name:
    | "mosque"
    | "mosque-solid"
    | "mosque-ph"
    | "school"
    | "school-building"
    | "teacher"
    | "student"
    | "secretary"
    | "camera"
    | "camera-selfie"
    | "qrcode"
    | "qr-scan"
    | "sun"
    | "clock"
    | "calendar"
    | "doctor"
    | "hospital"
    | "letter"
    | "trophy"
    | "check"
    | "pending"
    | "rejected"
    | "export-csv"
    | "print"
    | "shield"
    | "sparkles"
    | "logout"
    | "login"
    | "dashboard"
    | "history"
    | "users"
    | "eye"
    | "trash"
    | "plus"
    | "cross"
    | "info"
    | "warning"
    | "zap"
    | string;
  className?: string;
}

// Preset mapping to curated icons from Phosphor, Tabler, Heroicons, Hugeicons, MDI
const ICON_MAP: Record<string, string> = {
  // Mosque / Sholat (Tabler, Phosphor, MDI)
  mosque: "tabler:building-mosque",
  "mosque-solid": "mdi:mosque",
  "mosque-ph": "ph:mosque-bold",

  // Sekolah / Sesi Kelas
  school: "ph:chalkboard-teacher-bold",
  "school-building": "tabler:school",
  sun: "ph:sun-horizon-bold",

  // Role Personas
  teacher: "ph:chalkboard-teacher-bold",
  student: "ph:student-bold",
  secretary: "ph:clipboard-text-bold",

  // Camera & Presensi
  camera: "ph:camera-bold",
  "camera-selfie": "tabler:camera-selfie",
  qrcode: "ph:qr-code-bold",
  "qr-scan": "tabler:scan",

  // Waktu & Kalender
  clock: "ph:clock-bold",
  calendar: "ph:calendar-blank-bold",

  // Surat & Izin
  doctor: "tabler:stethoscope",
  hospital: "ph:first-aid-kit-bold",
  letter: "ph:envelope-open-bold",
  trophy: "ph:trophy-bold",

  // Status Presensi
  check: "ph:check-circle-bold",
  pending: "ph:hourglass-medium-bold",
  rejected: "ph:x-circle-bold",

  // Rekap & Tools
  "export-csv": "ph:file-csv-bold",
  print: "ph:printer-bold",
  table: "tabler:table-export",
  shield: "ph:shield-check-bold",
  sparkles: "ph:sparkle-bold",
  zap: "ph:lightning-bold",

  // Navigasi
  dashboard: "radix-icons:dashboard",
  history: "ph:clock-counter-clockwise-bold",
  users: "ph:users-three-bold",
  logout: "ph:sign-out-bold",
  login: "ph:sign-in-bold",
  eye: "ph:eye-bold",
  trash: "ph:trash-bold",
  plus: "ph:plus-bold",
  cross: "ph:x-bold",
  info: "ph:info-bold",
  warning: "ph:warning-circle-bold",
};

export function AppIcon({ name, className, ...props }: AppIconProps) {
  const iconIdentifier = ICON_MAP[name] || name;

  return (
    <Icon
      icon={iconIdentifier}
      className={cn("inline-block shrink-0", className)}
      {...props}
    />
  );
}
