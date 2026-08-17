"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  RotateCcw,
  CalendarDays,
  X,
  ChevronDown
} from "lucide-react";

export interface DatePickerProps {
  value: string; // Format: YYYY-MM-DD or "all"
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string; // Format: YYYY-MM-DD
  maxDate?: string; // Format: YYYY-MM-DD
  className?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: "default" | "compact";
  allowAllOption?: boolean;
  align?: "left" | "right";
}

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const NAMA_HARI_SINGKAT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Pilih tanggal...",
  minDate,
  maxDate,
  className,
  required = false,
  disabled = false,
  variant = "default",
  allowAllOption = false,
  align = "left",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Today reference (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse current selected date or fallback to today
  const selectedDate = value && value !== "all" ? new Date(value + "T00:00:00") : null;

  // View state (Year and Month being browsed)
  const [viewYear, setViewYear] = useState<number>(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );

  // Mode for quick jumping (calendar, month-picker, year-picker)
  const [pickerMode, setPickerMode] = useState<"days" | "months" | "years">("days");

  // Synchronize view when value changes from outside
  useEffect(() => {
    if (value && value !== "all") {
      const d = new Date(value + "T00:00:00");
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setPickerMode("days");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setPickerMode("days");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Generate calendar days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Helper formatting for ISO string YYYY-MM-DD
  const formatISO = (year: number, month: number, day: number) => {
    const y = year.toString();
    const m = (month + 1).toString().padStart(2, "0");
    const d = day.toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Format readable Indonesian text
  const formatIndonesianDate = (isoString: string) => {
    if (!isoString) return "";
    if (isoString === "all") return "Semua Tanggal";
    const date = new Date(isoString + "T00:00:00");
    if (isNaN(date.getTime())) return isoString;

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = NAMA_BULAN[date.getMonth()];
    const yearNum = date.getFullYear();

    return `${dayName}, ${dayNum} ${monthName} ${yearNum}`;
  };

  const formatShortDate = (isoString: string) => {
    if (!isoString) return "";
    if (isoString === "all") return "Semua Tanggal";
    const date = new Date(isoString + "T00:00:00");
    if (isNaN(date.getTime())) return isoString;

    const dayNum = date.getDate();
    const monthName = NAMA_BULAN[date.getMonth()].slice(0, 3);
    const yearNum = date.getFullYear();

    return `${dayNum} ${monthName} ${yearNum}`;
  };

  // Preset Handlers (Keep popover open for review, confirm with Selesai)
  const handleSelectPresetOffset = (offsetDays: number) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offsetDays);
    const iso = formatISO(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    );
    onChange(iso);
    setViewYear(targetDate.getFullYear());
    setViewMonth(targetDate.getMonth());
  };

  const handleSelectDate = (dayNumber: number) => {
    const selectedISO = formatISO(viewYear, viewMonth, dayNumber);
    onChange(selectedISO);
  };

  const handleSelectAll = () => {
    onChange("all");
  };

  const handleClear = () => {
    onChange("");
  };

  // Years generation for year picker (-10 to +5 years)
  const currentYear = today.getFullYear();
  const yearsList = Array.from({ length: 16 }).map((_, i) => currentYear - 10 + i);

  return (
    <div ref={containerRef} className={cn("relative", variant === "default" ? "w-full space-y-1.5" : "inline-block", className)}>
      {label && variant === "default" && (
        <label className="text-xs font-black uppercase tracking-wider text-[#181818] flex items-center justify-between">
          <span>{label}</span>
          {value && value !== "all" && (
            <span className="text-[11px] font-extrabold text-[#3355FF] normal-case bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-[#3355FF]" />
              <span>{formatIndonesianDate(value)}</span>
            </span>
          )}
        </label>
      )}

      {/* Main Trigger Button (Default Full vs Compact Pill) */}
      {variant === "default" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "w-full flex items-center justify-between p-3.5 bg-white brutal-border-2 rounded-2xl font-bold text-xs sm:text-sm text-[#181818] transition-all text-left group",
            isOpen
              ? "ring-2 ring-[#3355FF] shadow-[4px_4px_0px_#3355FF] bg-blue-50/40"
              : "hover:bg-neutral-50 shadow-[3px_3px_0px_#181818] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
            disabled && "opacity-60 cursor-not-allowed bg-neutral-100"
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 brutal-border-2 transition-colors",
                value
                  ? "bg-[#FFD400] text-[#181818]"
                  : "bg-neutral-100 text-neutral-500"
              )}
            >
              <CalendarIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="truncate">
              {value ? (
                <span className="font-extrabold text-[#181818] text-sm">
                  {formatIndonesianDate(value)}
                </span>
              ) : (
                <span className="text-neutral-400 font-medium text-xs sm:text-sm">
                  {placeholder}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {value && value !== "all" && (
              <span className="hidden sm:inline-flex text-[10px] font-black uppercase px-2 py-0.5 bg-green-100 text-green-800 rounded-md border border-green-300">
                Terpilih
              </span>
            )}
            <div
              className={cn(
                "w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 transition-transform duration-200",
                isOpen && "rotate-180 bg-[#3355FF] text-white"
              )}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 bg-white brutal-border-2 rounded-xl text-xs font-black text-[#181818] transition-all",
            isOpen
              ? "bg-blue-50 border-[#3355FF] shadow-[2px_2px_0px_#3355FF]"
              : "hover:bg-neutral-50 shadow-[2px_2px_0px_#181818] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
            disabled && "opacity-60 cursor-not-allowed bg-neutral-100"
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5 text-[#3355FF]" />
          <span className="truncate max-w-[150px]">
            {value ? formatShortDate(value) : placeholder}
          </span>
          <ChevronDown className={cn("w-3 h-3 transition-transform text-neutral-500", isOpen && "rotate-180 text-[#3355FF]")} />
        </button>
      )}

      {/* Hidden input for HTML form submission compatibility */}
      <input
        type="hidden"
        value={value}
        required={required}
        name="tanggal_picker"
      />

      {/* Popover Custom Calendar */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-[#181818]/50 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
            onClick={() => {
              setIsOpen(false);
              setPickerMode("days");
            }}
          />

          <div
            data-lenis-prevent="true"
            className={cn(
              "z-50 bg-white rounded-3xl brutal-border-thick shadow-[6px_6px_0px_#181818] p-3.5 sm:p-4 animate-in fade-in zoom-in-95 duration-150 w-[calc(100vw-32px)] max-w-[340px] sm:w-[340px]",
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:top-auto sm:left-auto sm:translate-x-0 sm:translate-y-0 sm:absolute sm:mt-2",
              align === "right" ? "sm:right-0 sm:left-auto" : "sm:left-0 sm:right-auto"
            )}
          >
          {/* Quick Presets Bar */}
          <div className="mb-3 pb-2.5 border-b-2 border-neutral-100 flex items-center justify-between gap-1 text-[11px]">
            <span className="font-black text-neutral-400 text-[10px] uppercase tracking-wider">
              Pilihan Cepat:
            </span>
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {allowAllOption && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={cn(
                    "px-2 py-1 rounded-lg font-black text-[10px] transition-colors border",
                    value === "all"
                      ? "bg-[#3355FF] text-white border-[#181818]"
                      : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
                  )}
                >
                  Semua
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSelectPresetOffset(-1)}
                className="px-2 py-1 bg-neutral-50 hover:bg-neutral-200 text-neutral-800 rounded-lg font-black text-[10px] border border-neutral-300 transition-colors"
              >
                Kemarin
              </button>
              <button
                type="button"
                onClick={() => handleSelectPresetOffset(0)}
                className="px-2 py-1 bg-yellow-50 hover:bg-[#FFD400] text-[#181818] rounded-lg font-black text-[10px] border border-yellow-300 transition-colors"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleSelectPresetOffset(1)}
                className="px-2 py-1 bg-blue-50 hover:bg-[#3355FF] hover:text-white text-blue-800 rounded-lg font-black text-[10px] border border-blue-200 transition-colors"
              >
                Besok
              </button>
            </div>
          </div>

          {/* Month & Year Navigation Header with Mode Switcher */}
          <div className="flex items-center justify-between mb-3 bg-[#181818] text-white p-2 rounded-2xl">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors active:scale-95 shrink-0"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4 text-white stroke-[3]" />
            </button>

            {/* Clickable Month/Year to switch picker mode */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPickerMode(pickerMode === "months" ? "days" : "months")}
                className={cn(
                  "px-2 py-1 rounded-lg font-fredoka font-black text-sm tracking-wide transition-colors",
                  pickerMode === "months" ? "bg-[#3355FF] text-white" : "hover:bg-neutral-800 text-white"
                )}
              >
                {NAMA_BULAN[viewMonth]}
              </button>

              <button
                type="button"
                onClick={() => setPickerMode(pickerMode === "years" ? "days" : "years")}
                className={cn(
                  "px-2 py-1 rounded-lg font-fredoka font-black text-sm tracking-wide transition-colors",
                  pickerMode === "years" ? "bg-[#FFD400] text-[#181818]" : "hover:bg-neutral-800 text-[#FFD400]"
                )}
              >
                {viewYear}
              </button>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors active:scale-95 shrink-0"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4 text-white stroke-[3]" />
            </button>
          </div>

          {/* VIEW: MONTHS PICKER GRID */}
          {pickerMode === "months" && (
            <div className="grid grid-cols-3 gap-2 py-2">
              {NAMA_BULAN.map((mName, mIdx) => (
                <button
                  key={mName}
                  type="button"
                  onClick={() => {
                    setViewMonth(mIdx);
                    setPickerMode("days");
                  }}
                  className={cn(
                    "py-2 rounded-xl text-xs font-black border-2 transition-all",
                    viewMonth === mIdx
                      ? "bg-[#3355FF] text-white border-[#181818] shadow-[2px_2px_0px_#181818]"
                      : "bg-neutral-50 hover:bg-neutral-200 text-[#181818] border-neutral-200"
                  )}
                >
                  {mName.slice(0, 3)}
                </button>
              ))}
            </div>
          )}

          {/* VIEW: YEARS PICKER GRID */}
          {pickerMode === "years" && (
            <div className="grid grid-cols-4 gap-1.5 py-2 max-h-48 overflow-y-auto pr-1" data-lenis-prevent="true">
              {yearsList.map((yNum) => (
                <button
                  key={yNum}
                  type="button"
                  onClick={() => {
                    setViewYear(yNum);
                    setPickerMode("days");
                  }}
                  className={cn(
                    "py-1.5 rounded-xl text-xs font-black border-2 transition-all",
                    viewYear === yNum
                      ? "bg-[#FFD400] text-[#181818] border-[#181818] shadow-[2px_2px_0px_#181818]"
                      : "bg-neutral-50 hover:bg-neutral-200 text-[#181818] border-neutral-200"
                  )}
                >
                  {yNum}
                </button>
              ))}
            </div>
          )}

          {/* VIEW: NORMAL DAYS CALENDAR */}
          {pickerMode === "days" && (
            <>
              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {NAMA_HARI_SINGKAT.map((dayName, idx) => (
                  <div
                    key={dayName}
                    className={cn(
                      "text-[10px] font-black uppercase py-1 rounded-md",
                      idx === 0 ? "text-red-500 bg-red-50" : "text-neutral-500"
                    )}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Date Grid Cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Prev month empty/padded cells */}
                {Array.from({ length: firstDayIndex }).map((_, i) => {
                  const prevDateNum = daysInPrevMonth - firstDayIndex + i + 1;
                  return (
                    <div
                      key={`prev-${i}`}
                      className="h-8 flex items-center justify-center text-neutral-300 text-xs font-bold select-none opacity-40"
                    >
                      {prevDateNum}
                    </div>
                  );
                })}

                {/* Current month day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateObj = new Date(viewYear, viewMonth, dayNum);
                  const iso = formatISO(viewYear, viewMonth, dayNum);

                  const isSelected = value === iso;
                  const isToday =
                    today.getFullYear() === viewYear &&
                    today.getMonth() === viewMonth &&
                    today.getDate() === dayNum;
                  const isSunday = dateObj.getDay() === 0;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      type="button"
                      onClick={() => handleSelectDate(dayNum)}
                      className={cn(
                        "h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all relative",
                        isSelected
                          ? "bg-[#3355FF] text-white border-2 border-[#181818] shadow-[2px_2px_0px_#181818] scale-105 z-10"
                          : isToday
                          ? "bg-[#FFD400] text-[#181818] border-2 border-[#181818] hover:scale-105"
                          : "bg-neutral-50 hover:bg-neutral-200 text-[#181818] hover:scale-105",
                        isSunday && !isSelected && !isToday && "text-red-600 bg-red-50/50"
                      )}
                    >
                      <span>{dayNum}</span>
                      {isToday && !isSelected && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Footer Selected Preview Bar */}
          <div className="mt-3 pt-2.5 border-t-2 border-neutral-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", value ? "bg-[#3355FF]" : "bg-neutral-300")} />
              <span className="text-[11px] font-extrabold text-[#181818] truncate">
                {value ? formatIndonesianDate(value) : "Pilih tanggal di atas"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-1 text-neutral-500 hover:text-red-600 text-[11px] font-bold rounded-lg transition-colors"
                  title="Reset Tanggal"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setPickerMode("days");
                }}
                className="px-3.5 py-1.5 bg-[#3355FF] text-white hover:bg-blue-600 font-black rounded-xl text-xs brutal-border-2 shadow-[2px_2px_0px_#181818] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5 transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Selesai</span>
              </button>
            </div>
          </div>
        </div>
      </>
    )}
    </div>
  );
}
