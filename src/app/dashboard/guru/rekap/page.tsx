"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Calendar, Info, CheckCircle, AlertTriangle, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { Dialog, AlertDialog } from "@/components/ui/Dialog";
import { getStoredAuth } from "@/lib/store";
import { fetchRekapKelasAction } from "@/app/actions/absensiActions";
import { 
  getHariEfektifBulan, 
  fetchIndonesianHolidays, 
  HariEfektifResult,
  NAMA_BULAN_INDONESIA 
} from "@/lib/calendarApi";
import { AuthSession, RekapItemSiswa } from "@/lib/types";
import type ExcelJS from "exceljs";

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
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
  { value: "2028", label: "2028" },
];

import { supabase } from "@/lib/supabaseClient";

export default function GuruRekapPage() {
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
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "danger" | "success";
  }>({ isOpen: false, title: "", message: "", type: "info" });
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
      .channel('realtime_guru_rekap')
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

  const exportToExcel = async () => {
    if (rekapData.length === 0) {
      setAlertState({
        isOpen: true,
        title: "Memuat Data",
        message: "Data rekapitulasi sedang dimuat, silakan tunggu sebentar sebelum mengekspor.",
        type: "info",
      });
      return;
    }

    const namaBulan = NAMA_BULAN_INDONESIA[parseInt(selectedBulan)] || `Bulan ${selectedBulan}`;
    const totalEfektif = currentEffectiveDays;
    const dataToExport = filteredData.length > 0 ? filteredData : rekapData;

    const totalKelasHadir = dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.hadir, 0);
    const totalKelasSakit = dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.sakit, 0);
    const totalKelasIzin = dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.izin, 0);
    const totalKelasAlpa = dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.alpa, 0);
    const avgKelasPersen = Math.round(dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.persentase, 0) / (dataToExport.length || 1));

    const totalSholatHadir = dataToExport.reduce((acc, curr) => acc + curr.sholatDzuhur.hadir, 0);
    const totalSholatAlpa = dataToExport.reduce((acc, curr) => acc + curr.sholatDzuhur.alpa, 0);
    const avgSholatPersen = Math.round(dataToExport.reduce((acc, curr) => acc + curr.sholatDzuhur.persentase, 0) / (dataToExport.length || 1));

    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SMK Negeri 1 Ciomas";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(`Rekap Presensi ${namaBulan}`, {
      views: [{ showGridLines: true }]
    });

    worksheet.columns = [
      { key: 'no', width: 7 },
      { key: 'nisn', width: 22 },
      { key: 'nama', width: 38 },
      { key: 'gender', width: 8 },
      { key: 'hadirKelas', width: 13 },
      { key: 'sakitKelas', width: 13 },
      { key: 'izinKelas', width: 13 },
      { key: 'alpaKelas', width: 13 },
      { key: 'persenKelas', width: 22 },
      { key: 'hadirSholat', width: 13 },
      { key: 'alpaSholat', width: 13 },
      { key: 'persenSholat', width: 20 },
    ];

    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };

    const row1 = worksheet.addRow(["LAPORAN REKAPITULASI PRESENSI & SHOLAT DZUHUR SISWA"]);
    worksheet.mergeCells('A1:L1');
    row1.height = 32;
    row1.getCell(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF181818' } };
    row1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const row2 = worksheet.addRow([`SMK NEGERI 1 CIOMAS • KELAS XI PPLG 1 • Periode: ${namaBulan} ${selectedTahun} (${totalEfektif} Hari Efektif Sekolah)`]);
    worksheet.mergeCells('A2:L2');
    row2.height = 24;
    row2.getCell(1).font = { name: 'Calibri', size: 11, italic: true, color: { argb: 'FF4A5568' } };
    row2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.addRow([]);

    const row4 = worksheet.addRow([
      "IDENTITAS SISWA", "", "", "",
      `KEHADIRAN KELAS PAGI (${totalEfektif} HARI EFEKTIF)`, "", "", "", "",
      `SHOLAT DZUHUR BERJAMAAH (${totalEfektif} HARI EFEKTIF)`, "", ""
    ]);
    worksheet.mergeCells('A4:D4');
    worksheet.mergeCells('E4:I4');
    worksheet.mergeCells('J4:L4');
    row4.height = 28;

    for (let c = 1; c <= 12; c++) {
      const cell = row4.getCell(c);
      cell.border = borderStyle;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
      if (c >= 1 && c <= 4) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD400' } };
      else if (c >= 5 && c <= 9) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6FA5' } };
      else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6FCB6F' } };
    }

    const row5 = worksheet.addRow([
      "No", "NISN", "Nama Lengkap Siswa", "L/P",
      "Hadir (H)", "Sakit (S)", "Izin (I)", "Alpa (A)", "% Kehadiran",
      "Hadir (H)", "Alpa (A)", "% Sholat"
    ]);
    row5.height = 26;
    for (let c = 1; c <= 12; c++) {
      const cell = row5.getCell(c);
      cell.border = borderStyle;
      cell.alignment = { vertical: 'middle', horizontal: c === 3 ? 'left' : 'center' };
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    }

    dataToExport.forEach((item, idx) => {
      const dataRow = worksheet.addRow([
        item.siswa.nomorAbsen || (idx + 1),
        String(item.siswa.nis),
        item.siswa.nama,
        item.siswa.gender,
        item.kehadiranKelas.hadir,
        item.kehadiranKelas.sakit,
        item.kehadiranKelas.izin,
        item.kehadiranKelas.alpa,
        `${item.kehadiranKelas.persentase}%`,
        item.sholatDzuhur.hadir,
        item.sholatDzuhur.alpa,
        `${item.sholatDzuhur.persentase}%`
      ]);
      dataRow.height = 24;
      const isEven = idx % 2 === 0;
      const rowBgColor = isEven ? 'FFFFFFFF' : 'FFF8F9FA';
      for (let c = 1; c <= 12; c++) {
        const cell = dataRow.getCell(c);
        cell.border = borderStyle;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBgColor } };
        cell.alignment = { vertical: 'middle', horizontal: c === 3 ? 'left' : 'center' };
        if (c === 2) { cell.numFmt = '@'; cell.font = { name: 'Calibri', size: 11, bold: true }; }
        else if (c === 3) { cell.font = { name: 'Calibri', size: 11, bold: true }; }
        else if (c === 5 || c === 10) { cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF15803D' } }; }
        else if (c === 6) { cell.font = { name: 'Calibri', size: 11, color: { argb: 'FFB45309' } }; }
        else if (c === 7) { cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1D4ED8' } }; }
        else if (c === 8 || c === 11) { cell.font = { name: 'Calibri', size: 11, color: { argb: 'FFB91C1C' } }; }
        else { cell.font = { name: 'Calibri', size: 11 }; }
      }
    });

    const summaryRow = worksheet.addRow([
      "TOTAL / RATA-RATA KELAS", "", "", "",
      totalKelasHadir, totalKelasSakit, totalKelasIzin, totalKelasAlpa, `${avgKelasPersen}%`,
      totalSholatHadir, totalSholatAlpa, `${avgSholatPersen}%`
    ]);
    worksheet.mergeCells(`A${summaryRow.number}:D${summaryRow.number}`);
    summaryRow.height = 28;
    for (let c = 1; c <= 12; c++) {
      const cell = summaryRow.getCell(c);
      cell.border = borderStyle;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF08A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Presensi_XI_PPLG1_${namaBulan}_${selectedTahun}_${totalEfektif}Hari.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (rekapData.length === 0) {
      setAlertState({
        isOpen: true,
        title: "Memuat Data",
        message: "Data rekapitulasi sedang dimuat, silakan tunggu sebentar sebelum mengekspor.",
        type: "info",
      });
      return;
    }

    const namaBulan = NAMA_BULAN_INDONESIA[parseInt(selectedBulan)] || `Bulan ${selectedBulan}`;
    const totalEfektif = currentEffectiveDays;
    const dataToExport = filteredData.length > 0 ? filteredData : rekapData;

    const totalKelasHadir = dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.hadir, 0);
    const totalKelasSakit = dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.sakit, 0);
    const totalKelasIzin = dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.izin, 0);
    const totalKelasAlpa = dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.alpa, 0);
    const avgKelasPersen = Math.round(dataToExport.reduce((acc, curr) => acc + curr.kehadiranKelas.persentase, 0) / (dataToExport.length || 1));

    const totalSholatHadir = dataToExport.reduce((acc, curr) => acc + curr.sholatDzuhur.hadir, 0);
    const totalSholatAlpa = dataToExport.reduce((acc, curr) => acc + curr.sholatDzuhur.alpa, 0);
    const avgSholatPersen = Math.round(dataToExport.reduce((acc, curr) => acc + curr.sholatDzuhur.persentase, 0) / (dataToExport.length || 1));

    // Delimiter titik-koma (;) standar untuk Microsoft Excel & regional Indonesia
    const delimiter = ";";

    const escapeCell = (val: string | number) => {
      const str = String(val ?? "");
      if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    // Header Kolom Ringkas & Jelas agar tidak terpotong di kolom standar Excel
    const headerRow = [
      "No",
      "NISN",
      "Nama Lengkap",
      "L/P",
      "H (Kelas)",
      "S (Kelas)",
      "I (Kelas)",
      "A (Kelas)",
      "% Kelas",
      "H (Sholat)",
      "A (Sholat)",
      "% Sholat",
    ].map(escapeCell).join(delimiter);

    // Baris Data Siswa
    const dataRows = dataToExport.map((item, idx) => [
      escapeCell(item.siswa.nomorAbsen || (idx + 1)),
      escapeCell(`="${item.siswa.nis}"`), // Menampilkan 10 digit NISN utuh beserta angka 0 di Excel
      escapeCell(item.siswa.nama),
      escapeCell(item.siswa.gender),
      escapeCell(item.kehadiranKelas.hadir),
      escapeCell(item.kehadiranKelas.sakit),
      escapeCell(item.kehadiranKelas.izin),
      escapeCell(item.kehadiranKelas.alpa),
      escapeCell(`${item.kehadiranKelas.persentase}%`),
      escapeCell(item.sholatDzuhur.hadir),
      escapeCell(item.sholatDzuhur.alpa),
      escapeCell(`${item.sholatDzuhur.persentase}%`),
    ].join(delimiter));

    // Baris Total / Rata-rata
    const summaryRow = [
      escapeCell("TOTAL/RATA-RATA"),
      escapeCell("-"),
      escapeCell(`Total ${dataToExport.length} Siswa`),
      escapeCell("-"),
      escapeCell(totalKelasHadir),
      escapeCell(totalKelasSakit),
      escapeCell(totalKelasIzin),
      escapeCell(totalKelasAlpa),
      escapeCell(`${avgKelasPersen}%`),
      escapeCell(totalSholatHadir),
      escapeCell(totalSholatAlpa),
      escapeCell(`${avgSholatPersen}%`),
    ].join(delimiter);

    // Gabungkan konten CSV bersih dengan UTF-8 BOM (\uFEFF) untuk kompatibilitas sempurna
    const csvContent = "\uFEFF" + [
      headerRow,
      ...dataRows,
      summaryRow,
    ].join("\r\n");

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

  const backLink = auth?.role === "admin" ? "/dashboard/sekretaris" : "/dashboard/guru";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 overflow-hidden">
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

      {/* Student Detail Modal */}
      <Dialog 
        isOpen={!!selectedStudentDetail} 
        onClose={() => setSelectedStudentDetail(null)}
        title={`Rincian Kehadiran: ${selectedStudentDetail?.siswa.nama || ''}`}
      >
        {selectedStudentDetail && (
          <div className="space-y-4">
             <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-neutral-100 rounded-2xl brutal-border-2">
                  <p className="text-[10px] text-neutral-500 font-black uppercase">No Absen</p>
                  <p className="text-base font-black font-fredoka text-[#3355FF]">#{selectedStudentDetail.siswa.nomorAbsen}</p>
                </div>
                <div className="p-3 bg-neutral-100 rounded-2xl brutal-border-2">
                  <p className="text-[10px] text-neutral-500 font-black uppercase">NISN</p>
                  <p className="text-sm font-black font-mono">{selectedStudentDetail.siswa.nis}</p>
                </div>
                <div className="p-3 bg-neutral-100 rounded-2xl brutal-border-2">
                  <p className="text-[10px] text-neutral-500 font-black uppercase">Gender</p>
                  <p className="text-sm font-black">{selectedStudentDetail.siswa.gender === "L" ? "Laki-laki" : "Perempuan"}</p>
                </div>
             </div>

             <div className="p-4 bg-[#FFD1E3]/40 rounded-2xl brutal-border-2 space-y-2">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-black uppercase text-[#181818]">
                   Kehadiran Kelas Pagi ({currentEffectiveDays} Hari Efektif)
                 </span>
                 <Badge variant={selectedStudentDetail.kehadiranKelas.persentase >= 85 ? "verified" : "yellow"} size="sm">
                   {selectedStudentDetail.kehadiranKelas.persentase}% Hadir
                 </Badge>
               </div>
               <div className="grid grid-cols-4 gap-2 text-center text-xs">
                 <div className="p-2 bg-white rounded-xl border border-[#FF6FA5]">
                   <span className="text-[10px] block font-bold text-neutral-500">Hadir (H)</span>
                   <strong className="text-sm text-green-700">{selectedStudentDetail.kehadiranKelas.hadir}</strong>
                 </div>
                 <div className="p-2 bg-white rounded-xl border border-[#FF6FA5]">
                   <span className="text-[10px] block font-bold text-neutral-500">Sakit (S)</span>
                   <strong className="text-sm text-amber-700">{selectedStudentDetail.kehadiranKelas.sakit}</strong>
                 </div>
                 <div className="p-2 bg-white rounded-xl border border-[#FF6FA5]">
                   <span className="text-[10px] block font-bold text-neutral-500">Izin (I)</span>
                   <strong className="text-sm text-blue-700">{selectedStudentDetail.kehadiranKelas.izin}</strong>
                 </div>
                 <div className="p-2 bg-white rounded-xl border border-[#FF6FA5]">
                   <span className="text-[10px] block font-bold text-neutral-500">Alpa (A)</span>
                   <strong className="text-sm text-red-700">{selectedStudentDetail.kehadiranKelas.alpa}</strong>
                 </div>
               </div>
             </div>

             <div className="p-4 bg-[#D4F4D4]/40 rounded-2xl brutal-border-2 space-y-2">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-black uppercase text-[#181818]">
                   Sholat Dzuhur Berjamaah ({currentEffectiveDays} Hari Efektif)
                 </span>
                 <Badge variant={selectedStudentDetail.sholatDzuhur.persentase >= 85 ? "green" : "yellow"} size="sm">
                   {selectedStudentDetail.sholatDzuhur.persentase}% Sholat
                 </Badge>
               </div>
               <div className="grid grid-cols-2 gap-2 text-center text-xs">
                 <div className="p-2 bg-white rounded-xl border border-[#6FCB6F]">
                   <span className="text-[10px] block font-bold text-neutral-500">Hadir Mushola</span>
                   <strong className="text-sm text-green-700">{selectedStudentDetail.sholatDzuhur.hadir} Hari</strong>
                 </div>
                 <div className="p-2 bg-white rounded-xl border border-[#6FCB6F]">
                   <span className="text-[10px] block font-bold text-neutral-500">Alpa Sholat</span>
                   <strong className="text-sm text-red-700">{selectedStudentDetail.sholatDzuhur.alpa} Hari</strong>
                 </div>
               </div>
             </div>
          </div>
        )}
      </Dialog>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 print:hidden">
        <Link href={backLink} className="self-start">
          <Button variant="white" size="sm" className="gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Button>
        </Link>

        <Badge variant="blue" size="md" className="text-center self-start sm:self-auto text-[11px] sm:text-xs">
          MASTER REKAPITULASI 46 SISWA KELAS XI PPLG 1
        </Badge>
      </div>

      {/* Filter and Calendar Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow-lg space-y-3.5 print:hidden">
        {/* Top Row: Search Input & Date Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Cari nama atau NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs sm:text-sm font-bold"
            />
          </div>

          {/* Month & Year Selectors */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 shrink-0">
            <div className="w-full sm:w-40">
              <Dropdown
                options={bulanOptions}
                value={selectedBulan}
                onChange={(val) => setSelectedBulan(String(val))}
                size="md"
              />
            </div>

            <div className="w-full sm:w-28">
              <Dropdown
                options={tahunOptions}
                value={selectedTahun}
                onChange={(val) => setSelectedTahun(String(val))}
                size="md"
                align="right"
              />
            </div>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="border-t border-neutral-200" />

        {/* Bottom Row: Hari Efektif Info & Export Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Dynamic Effective Days Button */}
          <button
            type="button"
            onClick={() => setShowCalendarInfo(true)}
            className="w-full sm:w-auto px-4 py-2 bg-amber-50 hover:bg-[#FFD400] text-[#181818] rounded-xl sm:rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-black transition-all brutal-btn-press cursor-pointer"
            title="Klik untuk melihat rincian hari libur & hari efektif kalender sekolah"
          >
            <Calendar className="w-4 h-4 text-[#3355FF] shrink-0" />
            <span>{currentEffectiveDays} Hari Efektif</span>
            <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          </button>

          {/* Export Excel & CSV Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={exportToExcel}
              className="group px-4 py-2 bg-[#6FCB6F] hover:bg-[#5db85d] text-[#181818] rounded-xl sm:rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm font-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
              title="Unduh laporan berformat Excel (.xlsx) resmi lengkap dengan format warna dan tabel rapi"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white brutal-border-2 flex items-center justify-center text-emerald-800 shadow-[1px_1px_0px_#181818] shrink-0 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={exportToCSV}
              className="group px-4 py-2 bg-[#FFD400] hover:bg-[#eec600] text-[#181818] rounded-xl sm:rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm font-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"
              title="Unduh data mentah format CSV untuk diolah di Google Sheets / Excel"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white brutal-border-2 flex items-center justify-center text-[#3355FF] shadow-[1px_1px_0px_#181818] shrink-0 group-hover:scale-110 transition-transform">
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* 46 Students Master Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl brutal-border-thick brutal-shadow-xl overflow-hidden w-full max-w-full">
        <div className="sm:hidden px-3.5 py-2 bg-[#FFD400] text-[11px] font-black text-[#181818] border-b-2 border-[#181818] flex items-center justify-between print:hidden">
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
                    className={`hover:bg-amber-50/60 transition-colors cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                    }`}
                    title="Klik baris siswa untuk rincian presensi"
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

        <div className="p-3.5 sm:p-5 bg-neutral-50 border-t-2 sm:border-t-3 border-[#181818] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-bold text-neutral-700">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-black text-[#181818] text-xs sm:text-sm">
              Total 46 Siswa
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-600 text-[11px] sm:text-xs font-bold">
              Periode {hariEfektifInfo.namaBulan} {selectedTahun} ({hariEfektifInfo.totalHariEfektif} Hari Efektif)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-900 rounded-xl border-2 border-[#181818] shadow-[1px_1px_0px_#181818]">
              <span className="w-2 h-2 rounded-full bg-[#6FCB6F] border border-[#181818]" />
              <span>≥ 85% Sangat Baik</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-100 text-yellow-900 rounded-xl border-2 border-[#181818] shadow-[1px_1px_0px_#181818]">
              <span className="w-2 h-2 rounded-full bg-[#FFD400] border border-[#181818]" />
              <span>70–84% Cukup</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-900 rounded-xl border-2 border-[#181818] shadow-[1px_1px_0px_#181818]">
              <span className="w-2 h-2 rounded-full bg-red-500 border border-[#181818]" />
              <span>&lt; 70% Peringatan</span>
            </span>
          </div>
        </div>
      </div>

      {/* Modern Alert Dialog */}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
}
