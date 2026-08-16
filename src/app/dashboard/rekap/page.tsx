"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  ArrowLeft,
  Calendar,
  Info,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Dialog } from "@/components/ui/Dialog";
import { getStoredAuth } from "@/lib/store";
import { fetchRekapKelasAction } from "@/app/actions/absensiActions";
import { 
  getHariEfektifBulan, 
  fetchIndonesianHolidays, 
  HariEfektifResult,
  NAMA_BULAN_INDONESIA 
} from "@/lib/calendarApi";
import { RekapItemSiswa, AuthSession } from "@/lib/types";

const bulanOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const tahunOptions = [
  { value: "2026", label: "2026/2027" },
  { value: "2025", label: "2025/2026" },
  { value: "2027", label: "2027/2028" },
];

import { supabase } from "@/lib/supabaseClient";

export default function DashboardRekapPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [rekapData, setRekapData] = useState<RekapItemSiswa[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const now = new Date();
  const [selectedBulan, setSelectedBulan] = useState<string>(() => String(new Date().getMonth() + 1));
  const [selectedTahun, setSelectedTahun] = useState<string>(() => String(new Date().getFullYear()));
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<RekapItemSiswa | null>(null);
  const [showCalendarInfo, setShowCalendarInfo] = useState<boolean>(false);
  const [customDaysMap, setCustomDaysMap] = useState<Record<string, number>>({});
  const [customInputDays, setCustomInputDays] = useState<string>("");
  const [hariEfektifInfo, setHariEfektifInfo] = useState<HariEfektifResult>(() =>
    getHariEfektifBulan(now.getMonth() + 1, now.getFullYear())
  );

  const monthKey = `${selectedBulan}-${selectedTahun}`;
  const isCustomActive = customDaysMap[monthKey] !== undefined;
  const currentEffectiveDays = isCustomActive ? customDaysMap[monthKey] : hariEfektifInfo.totalHariEfektif;

  const loadRekap = async () => {
    const bulanNum = parseInt(selectedBulan) || (new Date().getMonth() + 1);
    const tahunNum = parseInt(selectedTahun) || new Date().getFullYear();
    const currentKey = `${bulanNum}-${tahunNum}`;
    const customVal = customDaysMap[currentKey];

    try {
      const holidays = await fetchIndonesianHolidays(tahunNum);
      const info = getHariEfektifBulan(bulanNum, tahunNum, holidays);
      setHariEfektifInfo(info);
      const effective = customVal !== undefined ? customVal : info.totalHariEfektif;
      const res = await fetchRekapKelasAction(bulanNum, tahunNum, effective);
      if (res.success && res.rekap) {
        setRekapData(res.rekap);
      }
    } catch {
      const info = getHariEfektifBulan(bulanNum, tahunNum);
      setHariEfektifInfo(info);
      const effective = customVal !== undefined ? customVal : info.totalHariEfektif;
      const res = await fetchRekapKelasAction(bulanNum, tahunNum, effective);
      if (res.success && res.rekap) {
        setRekapData(res.rekap);
      }
    }
  };

  useEffect(() => {
    setAuth(getStoredAuth());
    loadRekap();

    // Supabase Realtime channel
    const channel = supabase
      .channel('realtime_shared_rekap')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absensi_records' }, () => {
        loadRekap();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'izin_records' }, () => {
        loadRekap();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBulan, selectedTahun, customDaysMap]);

  const handleApplyCustomDays = () => {
    const val = parseInt(customInputDays, 10);
    if (!isNaN(val) && val >= 1 && val <= 31) {
      setCustomDaysMap((prev) => ({ ...prev, [monthKey]: val }));
    }
  };

  const handleResetCustomDays = () => {
    setCustomDaysMap((prev) => {
      const copy = { ...prev };
      delete copy[monthKey];
      return copy;
    });
    setCustomInputDays("");
  };

  const filteredData = rekapData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.siswa.nama.toLowerCase().includes(term) ||
      item.siswa.nis.includes(term) ||
      item.siswa.nomorAbsen.toString().includes(term)
    );
  });

  const exportToExcel = () => {
    const namaBulan = NAMA_BULAN_INDONESIA[parseInt(selectedBulan)] || `Bulan ${selectedBulan}`;
    const totalEfektif = currentEffectiveDays;

    const tableRows = filteredData.map((item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8F9FA'}; height: 26px;">
        <td style="text-align: center; border: 1px solid #999;">${item.siswa.nomorAbsen}</td>
        <td style="mso-number-format:'\\@'; border: 1px solid #999;">${item.siswa.nis}</td>
        <td style="font-weight: bold; border: 1px solid #999;">${item.siswa.nama}</td>
        <td style="text-align: center; border: 1px solid #999;">${item.siswa.gender}</td>
        <td style="text-align: center; color: #15803d; font-weight: bold; border: 1px solid #999;">${item.kehadiranKelas.hadir}</td>
        <td style="text-align: center; color: #b45309; border: 1px solid #999;">${item.kehadiranKelas.sakit}</td>
        <td style="text-align: center; color: #1d4ed8; border: 1px solid #999;">${item.kehadiranKelas.izin}</td>
        <td style="text-align: center; color: #b91c1c; border: 1px solid #999;">${item.kehadiranKelas.alpa}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #999;">${item.kehadiranKelas.persentase}%</td>
        <td style="text-align: center; color: #15803d; font-weight: bold; border: 1px solid #999;">${item.sholatDzuhur.hadir}</td>
        <td style="text-align: center; color: #b91c1c; border: 1px solid #999;">${item.sholatDzuhur.alpa}</td>
        <td style="text-align: center; font-weight: bold; border: 1px solid #999;">${item.sholatDzuhur.persentase}%</td>
      </tr>
    `).join("");

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Rekap Presensi ${namaBulan}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          th, td { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="4" cellspacing="0" style="border-collapse:collapse; width:100%;">
          <tr>
            <td colspan="12" style="font-size: 16pt; font-weight: bold; text-align: center; height: 35px;">
              LAPORAN REKAPITULASI PRESENSI & SHOLAT DZUHUR SISWA
            </td>
          </tr>
          <tr>
            <td colspan="12" style="font-size: 12pt; text-align: center; height: 24px;">
              SMK NEGERI 1 CIOMAS &bull; KELAS XI PPLG 1 &bull; Periode: ${namaBulan} ${selectedTahun} (${totalEfektif} Hari Efektif Sekolah)
            </td>
          </tr>
          <tr><td colspan="12" style="height: 10px;"></td></tr>
          <thead>
            <tr style="height: 28px;">
              <th colspan="4" style="background-color: #FFD400; color: #000000; font-weight: bold; text-align: center; border: 1px solid #000;">IDENTITAS SISWA</th>
              <th colspan="5" style="background-color: #FF6FA5; color: #000000; font-weight: bold; text-align: center; border: 1px solid #000;">KEHADIRAN KELAS PAGI (${totalEfektif} HARI EFEKTIF)</th>
              <th colspan="3" style="background-color: #6FCB6F; color: #000000; font-weight: bold; text-align: center; border: 1px solid #000;">SHOLAT DZUHUR BERJAMAAH (${totalEfektif} HARI EFEKTIF)</th>
            </tr>
            <tr style="background-color: #E2E8F0; color: #000000; font-weight: bold; height: 28px;">
              <th style="border: 1px solid #000; width: 40px; text-align: center;">No</th>
              <th style="border: 1px solid #000; width: 110px;">NISN</th>
              <th style="border: 1px solid #000; width: 260px;">Nama Lengkap Siswa</th>
              <th style="border: 1px solid #000; width: 45px; text-align: center;">L/P</th>
              <th style="border: 1px solid #000; width: 55px; text-align: center;">H</th>
              <th style="border: 1px solid #000; width: 55px; text-align: center;">S</th>
              <th style="border: 1px solid #000; width: 55px; text-align: center;">I</th>
              <th style="border: 1px solid #000; width: 55px; text-align: center;">A</th>
              <th style="border: 1px solid #000; width: 75px; text-align: center;">% Hadir</th>
              <th style="border: 1px solid #000; width: 55px; text-align: center;">H</th>
              <th style="border: 1px solid #000; width: 55px; text-align: center;">A</th>
              <th style="border: 1px solid #000; width: 75px; text-align: center;">% Sholat</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Presensi_XI_PPLG1_${namaBulan}_${selectedTahun}_${totalEfektif}Hari.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const namaBulan = NAMA_BULAN_INDONESIA[parseInt(selectedBulan)] || selectedBulan;
    const totalEfektif = currentEffectiveDays;

    const headers = [
      "No",
      "NISN",
      "Nama Lengkap",
      "L/P",
      "Kelas Hadir (H)",
      "Kelas Sakit (S)",
      "Kelas Izin (I)",
      "Kelas Alpa (A)",
      "% Kehadiran Kelas",
      "Sholat Hadir (H)",
      "Sholat Alpa (A)",
      "% Sholat Dzuhur",
    ];

    const rows = rekapData.map((item, idx) => [
      idx + 1,
      `"${item.siswa.nis}"`,
      `"${item.siswa.nama}"`,
      item.siswa.gender,
      item.kehadiranKelas.hadir,
      item.kehadiranKelas.sakit,
      item.kehadiranKelas.izin,
      item.kehadiranKelas.alpa,
      `${item.kehadiranKelas.persentase}%`,
      item.sholatDzuhur.hadir,
      item.sholatDzuhur.alpa,
      `${item.sholatDzuhur.persentase}%`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Presensi_XI_PPLG1_${namaBulan}_${selectedTahun}_${totalEfektif}Hari.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Calendar Breakdown Dialog */}
      <Dialog
        isOpen={showCalendarInfo}
        onClose={() => setShowCalendarInfo(false)}
        title={`Rincian Kalender Pendidikan: ${hariEfektifInfo.namaBulan} ${hariEfektifInfo.tahun}`}
        description="Dihitung otomatis berdasarkan hari kerja sekolah (Senin - Jumat) dikurangi hari libur nasional resmi."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-3 bg-blue-50 rounded-2xl brutal-border-2">
              <p className="text-[10px] text-blue-700 font-black uppercase">Hari Efektif</p>
              <p className="text-xl font-black font-fredoka text-[#3355FF]">
                {currentEffectiveDays} Hari
              </p>
              {isCustomActive && (
                <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-black">
                  Disesuaikan
                </span>
              )}
            </div>
            <div className="p-3 bg-neutral-100 rounded-2xl brutal-border-2">
              <p className="text-[10px] text-neutral-600 font-black uppercase">Hari Kalender</p>
              <p className="text-xl font-black font-fredoka text-[#181818]">
                {hariEfektifInfo.totalHariKalender} Hari
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl brutal-border-2">
              <p className="text-[10px] text-amber-700 font-black uppercase">Akhir Pekan</p>
              <p className="text-xl font-black font-fredoka text-amber-800">
                {hariEfektifInfo.totalHariAkhirPekan} Hari
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-2xl brutal-border-2">
              <p className="text-[10px] text-red-700 font-black uppercase">Libur Nasional</p>
              <p className="text-xl font-black font-fredoka text-red-600">
                {hariEfektifInfo.totalHariLiburNasionalWeekday} Hari
              </p>
            </div>
          </div>

          {/* School Custom Override */}
          <div className="p-3.5 bg-blue-50/60 rounded-2xl brutal-border-2 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-[#181818]">
                  Penyesuaian Hari Efektif Khusus Sekolah:
                </p>
                <p className="text-[11px] font-bold text-neutral-600">
                  Gunakan jika ada agenda khusus seperti Libur Semester Ganjil, Classmeeting, atau Ujian Sekolah.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <input
                type="number"
                min={1}
                max={31}
                placeholder={String(currentEffectiveDays)}
                value={customInputDays}
                onChange={(e) => setCustomInputDays(e.target.value)}
                className="w-24 px-3 py-1.5 bg-white rounded-xl brutal-border-2 font-black text-center text-sm"
              />
              <span className="text-xs font-bold text-neutral-700">Hari</span>
              
              <Button
                variant="yellow"
                size="sm"
                className="text-xs"
                onClick={handleApplyCustomDays}
              >
                Terapkan
              </Button>
              {isCustomActive && (
                <Button
                  variant="white"
                  size="sm"
                  className="text-xs"
                  onClick={handleResetCustomDays}
                >
                  Kembalikan ke Otomatis ({hariEfektifInfo.totalHariEfektif} Hari)
                </Button>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-2xl brutal-border-2 space-y-2">
            <p className="text-xs font-black uppercase text-[#181818] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#3355FF]" />
              <span>Daftar Libur Nasional Bulan Ini:</span>
            </p>
            {hariEfektifInfo.liburNasionalBulanIni.length === 0 ? (
              <p className="text-xs font-bold text-neutral-500 italic">
                Tidak ada hari libur nasional di bulan ini. Seluruh hari kerja (Senin - Jumat) merupakan hari efektif sekolah.
              </p>
            ) : (
              <ul className="space-y-1 text-xs font-bold text-neutral-700">
                {hariEfektifInfo.liburNasionalBulanIni.map((libur, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2 bg-white rounded-xl border border-neutral-200">
                    <span className="font-black text-[#181818]">{libur.nama}</span>
                    <span className="font-mono text-red-600 font-black">{libur.tanggal} ({libur.hari})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="dark" size="sm" onClick={() => setShowCalendarInfo(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Dialog>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 print:hidden">
        <Link href="/dashboard/sekretaris" className="self-start">
          <Button variant="white" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Button>
        </Link>

        <Badge variant="blue" size="md" className="text-center self-start sm:self-auto text-[11px] sm:text-xs">
          MASTER REKAPITULASI 46 SISWA KELAS XI PPLG 1
        </Badge>
      </div>

      <div className="bg-white p-3.5 sm:p-6 rounded-3xl brutal-border-thick brutal-shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <div className="w-full sm:w-60">
            <Input
              placeholder="Cari nama atau NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto min-w-[240px]">
            <Dropdown
              options={bulanOptions}
              value={selectedBulan}
              onChange={(val) => setSelectedBulan(String(val))}
              size="md"
            />

            <Dropdown
              options={tahunOptions}
              value={selectedTahun}
              onChange={(val) => setSelectedTahun(String(val))}
              size="md"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          {/* Dynamic Effective Days Button */}
          <button
            type="button"
            onClick={() => setShowCalendarInfo(true)}
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-[#FFD400] text-[#181818] rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center justify-center gap-2 text-xs font-black transition-all brutal-btn-press"
            title="Klik untuk melihat rincian hari libur & hari efektif kalender sekolah"
          >
            <Calendar className="w-4 h-4 text-[#3355FF]" />
            <span>{currentEffectiveDays} Hari Efektif</span>
            <Info className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={exportToExcel}
            className="group px-4 py-2.5 bg-[#6FCB6F] hover:bg-[#5db85d] text-[#181818] rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm font-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
            title="Unduh laporan berformat Excel (.xls) lengkap dengan format tabel resmi"
          >
            <div className="w-6 h-6 rounded-lg bg-white brutal-border-2 flex items-center justify-center text-emerald-800 shadow-[1px_1px_0px_#181818] shrink-0 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Export Excel (.xls)</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={exportToCSV}
            className="group px-4 py-2.5 bg-[#FFD400] hover:bg-[#eec600] text-[#181818] rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm font-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
            title="Unduh data mentah format CSV untuk diolah di Google Sheets / Excel"
          >
            <div className="w-6 h-6 rounded-lg bg-white brutal-border-2 flex items-center justify-center text-[#3355FF] shadow-[1px_1px_0px_#181818] shrink-0 group-hover:scale-110 transition-transform">
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 46 Students Master Table */}
      <div className="bg-white rounded-3xl brutal-border-thick brutal-shadow-xl overflow-hidden">
        <div className="sm:hidden px-4 py-2 bg-[#FFD400] text-[11px] font-bold text-[#181818] border-b-2 border-[#181818] flex items-center justify-between">
          <span>Geser tabel ke samping untuk detail sholat</span>
          <span className="font-mono font-black">&lt;&gt;</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs sm:text-sm">
            <thead>
              {/* Group Category Row */}
              <tr className="border-b-2 border-[#181818] text-[10px] sm:text-[11px] font-black uppercase text-[#181818]">
                <th colSpan={4} className="p-2.5 text-center bg-[#FFD400] border-r-2 border-[#181818] whitespace-nowrap">
                  Identitas Siswa
                </th>
                <th colSpan={5} className="p-2.5 text-center bg-[#FF6FA5] border-r-2 border-[#181818] whitespace-nowrap">
                  Kehadiran Kelas Pagi ({currentEffectiveDays} Hari Efektif)
                </th>
                <th colSpan={3} className="p-2.5 text-center bg-[#6FCB6F] whitespace-nowrap">
                  Sholat Dzuhur Mushola ({currentEffectiveDays} Hari Efektif)
                </th>
              </tr>

              {/* Column Headers */}
              <tr className="bg-[#FFD400] border-b-4 border-[#181818] font-fredoka text-xs font-black tracking-wider text-[#181818]">
                <th className="p-3 border-r-2 border-[#181818] text-center w-12">No</th>
                <th className="p-3 border-r-2 border-[#181818] w-24">NISN</th>
                <th className="p-3 border-r-2 border-[#181818]">Nama Lengkap Siswa</th>
                <th className="p-3 border-r-2 border-[#181818] text-center w-12">L/P</th>
                
                {/* Kehadiran Kelas: H, S, I, A, % */}
                <th className="p-3 border-r-2 border-[#181818] text-center bg-[#FFD1E3] text-[#181818] w-14">
                  Hadir (H)
                </th>
                <th className="p-3 border-r-2 border-[#181818] text-center bg-[#FFD1E3] text-[#181818] w-14">
                  Sakit (S)
                </th>
                <th className="p-3 border-r-2 border-[#181818] text-center bg-[#FFD1E3] text-[#181818] w-14">
                  Izin (I)
                </th>
                <th className="p-3 border-r-2 border-[#181818] text-center bg-[#FFD1E3] text-[#181818] w-14">
                  Alpa (A)
                </th>
                <th className="p-3 border-r-2 border-[#181818] text-center bg-[#FF6FA5] text-[#181818] w-20">
                  % Kelas
                </th>

                {/* Sholat Dzuhur: H, A, % */}
                <th className="p-3 border-r-2 border-[#181818] text-center bg-[#D4F4D4] text-[#181818] w-14">
                  Hadir (H)
                </th>
                <th className="p-3 border-r-2 border-[#181818] text-center bg-[#D4F4D4] text-[#181818] w-14">
                  Alpa (A)
                </th>
                <th className="p-3 text-center bg-[#6FCB6F] text-[#181818] w-20">
                  % Sholat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200 font-bold">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-10 text-center bg-white text-neutral-500 font-bold">
                    <p className="text-base font-black text-[#181818]">Belum Ada Data Siswa Terdaftar (0 Siswa)</p>
                    <p className="text-xs text-neutral-500 mt-1">Data master siswa akan tersinkronisasi saat integrasi database backend.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr
                    key={item.siswa.id}
                    onClick={() => setSelectedStudentDetail(item)}
                    className={`hover:bg-amber-100/60 transition-colors cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                    }`}
                    title="Klik untuk melihat rincian presensi siswa"
                  >
                  <td className="p-3 text-center border-r-2 border-neutral-200 font-mono font-black">
                    {item.siswa.nomorAbsen}
                  </td>
                  <td className="p-3 border-r-2 border-neutral-200 font-mono text-neutral-600">
                    {item.siswa.nis}
                  </td>
                  <td className="p-3 border-r-2 border-neutral-200 font-black text-[#181818]">
                    {item.siswa.nama}
                  </td>
                  <td className="p-3 text-center border-r-2 border-neutral-200">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-black text-[10px] ${
                        item.siswa.gender === "L"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-pink-100 text-pink-700"
                      }`}
                    >
                      {item.siswa.gender}
                    </span>
                  </td>

                  {/* Kehadiran Kelas: H, S, I, A, % */}
                  <td className="p-3 text-center border-r-2 border-neutral-200 font-black text-green-700 bg-pink-50/20">
                    {item.kehadiranKelas.hadir}
                  </td>
                  <td className="p-3 text-center border-r-2 border-neutral-200 font-black text-amber-600 bg-pink-50/20">
                    {item.kehadiranKelas.sakit}
                  </td>
                  <td className="p-3 text-center border-r-2 border-neutral-200 font-black text-blue-600 bg-pink-50/20">
                    {item.kehadiranKelas.izin}
                  </td>
                  <td className="p-3 text-center border-r-2 border-neutral-200 font-bold text-red-600 bg-pink-50/20">
                    {item.kehadiranKelas.alpa}
                  </td>
                  <td className="p-3 text-center border-r-2 border-neutral-200 bg-pink-50/40">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-xl brutal-border-2 font-black text-xs ${
                        item.kehadiranKelas.persentase >= 85
                          ? "bg-[#6FCB6F] text-[#181818]"
                          : item.kehadiranKelas.persentase >= 70
                          ? "bg-[#FFD400] text-[#181818]"
                          : "bg-red-400 text-white"
                      }`}
                    >
                      {item.kehadiranKelas.persentase}%
                    </span>
                  </td>

                  {/* Sholat Dzuhur: H, A, % */}
                  <td className="p-3 text-center border-r-2 border-neutral-200 font-black text-green-700 bg-green-50/20">
                    {item.sholatDzuhur.hadir}
                  </td>
                  <td className="p-3 text-center border-r-2 border-neutral-200 font-bold text-red-600 bg-green-50/20">
                    {item.sholatDzuhur.alpa}
                  </td>
                  <td className="p-3 text-center bg-green-50/40">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-xl brutal-border-2 font-black text-xs ${
                        item.sholatDzuhur.persentase >= 85
                          ? "bg-[#6FCB6F] text-[#181818]"
                          : item.sholatDzuhur.persentase >= 70
                          ? "bg-[#FFD400] text-[#181818]"
                          : "bg-red-400 text-white"
                      }`}
                    >
                      {item.sholatDzuhur.persentase}%
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-neutral-100 border-t-3 border-[#181818] flex flex-col sm:flex-row items-center justify-between text-xs font-black text-neutral-700 gap-2">
          <span>Total: 46 Siswa Terdaftar di Kelas XI PPLG 1 • Periode {hariEfektifInfo.namaBulan} {selectedTahun} ({hariEfektifInfo.totalHariEfektif} Hari Efektif)</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#6FCB6F] inline-block brutal-border-2" /> ≥ 85%: Sangat Baik</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FFD400] inline-block brutal-border-2" /> 70–84%: Cukup</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block brutal-border-2" /> &lt; 70%: Peringatan</span>
          </div>
        </div>
      </div>

      {/* Student Detail Modal Dialog */}
      {selectedStudentDetail && (
        <Dialog
          isOpen={!!selectedStudentDetail}
          onClose={() => setSelectedStudentDetail(null)}
          title={`Rincian Presensi: ${selectedStudentDetail.siswa.nama}`}
          description={`No. Absen: ${selectedStudentDetail.siswa.nomorAbsen} • NISN: ${selectedStudentDetail.siswa.nis} • Kelas XI PPLG 1`}
          maxWidth="md"
        >
          <div className="space-y-4 pt-1">
            {/* Kehadiran Kelas Box */}
            <div className="p-4 rounded-2xl bg-pink-50 border-2 border-pink-300 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-[#181818]">Kehadiran Kelas Pagi</h4>
                  <p className="text-[11px] text-neutral-600 font-bold">
                    Target: {hariEfektifInfo.totalHariEfektif} Hari Efektif ({hariEfektifInfo.namaBulan} {selectedTahun})
                  </p>
                </div>
                <Badge
                  variant={selectedStudentDetail.kehadiranKelas.persentase >= 85 ? "verified" : "yellow"}
                  size="md"
                >
                  {selectedStudentDetail.kehadiranKelas.persentase}% Hadir
                </Badge>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-xl border border-pink-200">
                  <span className="text-[10px] font-bold text-neutral-500 block">Hadir (H)</span>
                  <span className="font-black text-green-700 text-sm">{selectedStudentDetail.kehadiranKelas.hadir}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-pink-200">
                  <span className="text-[10px] font-bold text-neutral-500 block">Sakit (S)</span>
                  <span className="font-black text-amber-600 text-sm">{selectedStudentDetail.kehadiranKelas.sakit}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-pink-200">
                  <span className="text-[10px] font-bold text-neutral-500 block">Izin (I)</span>
                  <span className="font-black text-blue-600 text-sm">{selectedStudentDetail.kehadiranKelas.izin}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-pink-200">
                  <span className="text-[10px] font-bold text-neutral-500 block">Alpa (A)</span>
                  <span className="font-black text-red-600 text-sm">{selectedStudentDetail.kehadiranKelas.alpa}</span>
                </div>
              </div>
            </div>

            {/* Sholat Dzuhur Box */}
            <div className="p-4 rounded-2xl bg-green-50 border-2 border-green-300 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-[#181818]">Sholat Dzuhur Berjamaah</h4>
                  <p className="text-[11px] text-neutral-600 font-bold">
                    Target: {hariEfektifInfo.totalHariEfektif} Hari Efektif ({hariEfektifInfo.namaBulan} {selectedTahun})
                  </p>
                </div>
                <Badge
                  variant={selectedStudentDetail.sholatDzuhur.persentase >= 85 ? "green" : "yellow"}
                  size="md"
                >
                  {selectedStudentDetail.sholatDzuhur.persentase}% Sholat
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-xl border border-green-200">
                  <span className="text-[10px] font-bold text-neutral-500 block">Hadir Mushola (H)</span>
                  <span className="font-black text-green-700 text-sm">{selectedStudentDetail.sholatDzuhur.hadir} Hari</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-green-200">
                  <span className="text-[10px] font-bold text-neutral-500 block">Alpa Sholat (A)</span>
                  <span className="font-black text-red-600 text-sm">{selectedStudentDetail.sholatDzuhur.alpa} Hari</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="dark" size="sm" onClick={() => setSelectedStudentDetail(null)}>
                Tutup Rincian
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
