/**
 * KALENDER PENDIDIKAN & KALKULASI HARI EFEKTIF SEKOLAH INDONESIA
 * Mengintegrasikan Public Holiday API (Nager.Date / Open Calendar) & Database Resmi Libur Nasional SKB 3 Menteri
 * Menghitung hari efektif sekolah (Senin - Jumat) dikurangi hari libur nasional & cuti bersama.
 */

export interface HariLiburNasional {
  tanggal: string; // YYYY-MM-DD
  nama: string;
  isCutiBersama?: boolean;
}

export interface HariEfektifResult {
  bulan: number; // 1 - 12
  tahun: number;
  namaBulan: string;
  totalHariKalender: number;
  totalHariAkhirPekan: number; // Total Sabtu & Minggu
  totalHariKerja: number; // Total Senin - Jumat
  totalHariLiburNasionalWeekday: number; // Libur nasional yang jatuh di Senin - Jumat
  totalHariEfektif: number; // totalHariKerja - totalHariLiburNasionalWeekday
  liburNasionalBulanIni: Array<{
    tanggal: string;
    nama: string;
    hari: string;
    isWeekday: boolean;
  }>;
  detailHari: Array<{
    tanggal: string;
    tanggalAngka: number;
    hari: string;
    dayOfWeek: number;
    isEfektif: boolean;
    keterangan: string;
  }>;
}

export const NAMA_BULAN_INDONESIA = [
  "",
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

export const NAMA_HARI_INDONESIA = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

// Database Kalender Libur Nasional & Cuti Bersama Resmi (SKB 3 Menteri)
export const HOLIDAYS_DATABASE: Record<number, HariLiburNasional[]> = {
  2025: [
    { tanggal: "2025-01-01", nama: "Tahun Baru 2025 Masehi" },
    { tanggal: "2025-01-27", nama: "Isra Miraj Nabi Muhammad SAW" },
    { tanggal: "2025-01-29", nama: "Tahun Baru Imlek 2576 Kongzili" },
    { tanggal: "2025-03-29", nama: "Hari Suci Nyepi (Tahun Baru Saka 1947)" },
    { tanggal: "2025-03-31", nama: "Hari Raya Idul Fitri 1446 H (Hari ke-1)" },
    { tanggal: "2025-04-01", nama: "Hari Raya Idul Fitri 1446 H (Hari ke-2)" },
    { tanggal: "2025-04-18", nama: "Wafat Yesus Kristus" },
    { tanggal: "2025-04-20", nama: "Hari Paskah" },
    { tanggal: "2025-05-01", nama: "Hari Buruh Internasional" },
    { tanggal: "2025-05-12", nama: "Hari Raya Waisak 2569 BE" },
    { tanggal: "2025-05-29", nama: "Kenaikan Yesus Kristus" },
    { tanggal: "2025-06-01", nama: "Hari Lahir Pancasila" },
    { tanggal: "2025-06-07", nama: "Hari Raya Idul Adha 1446 H" },
    { tanggal: "2025-06-27", nama: "Tahun Baru Islam 1447 H" },
    { tanggal: "2025-08-17", nama: "Hari Kemerdekaan RI Ke-80" },
    { tanggal: "2025-09-05", nama: "Maulid Nabi Muhammad SAW" },
    { tanggal: "2025-12-25", nama: "Hari Raya Natal" },
  ],
  2026: [
    { tanggal: "2026-01-01", nama: "Tahun Baru 2026 Masehi" },
    { tanggal: "2026-01-16", nama: "Isra Miraj Nabi Muhammad SAW" },
    { tanggal: "2026-02-17", nama: "Tahun Baru Imlek 2577 Kongzili" },
    { tanggal: "2026-03-20", nama: "Hari Raya Idul Fitri 1447 H (Hari ke-1)" },
    { tanggal: "2026-03-21", nama: "Hari Raya Idul Fitri 1447 H (Hari ke-2)" },
    { tanggal: "2026-03-22", nama: "Hari Suci Nyepi (Tahun Baru Saka 1948)" },
    { tanggal: "2026-04-03", nama: "Wafat Yesus Kristus (Jumat Agung)" },
    { tanggal: "2026-04-05", nama: "Hari Paskah" },
    { tanggal: "2026-05-01", nama: "Hari Buruh Internasional" },
    { tanggal: "2026-05-14", nama: "Kenaikan Yesus Kristus" },
    { tanggal: "2026-05-27", nama: "Hari Raya Idul Adha 1447 H" },
    { tanggal: "2026-05-31", nama: "Hari Raya Waisak 2570 BE" },
    { tanggal: "2026-06-01", nama: "Hari Lahir Pancasila" },
    { tanggal: "2026-06-16", nama: "Tahun Baru Islam 1448 H" },
    { tanggal: "2026-08-17", nama: "Hari Kemerdekaan RI Ke-81" },
    { tanggal: "2026-09-04", nama: "Maulid Nabi Muhammad SAW" },
    { tanggal: "2026-12-25", nama: "Hari Raya Natal" },
  ],
  2027: [
    { tanggal: "2027-01-01", nama: "Tahun Baru 2027 Masehi" },
    { tanggal: "2027-01-06", nama: "Isra Miraj Nabi Muhammad SAW" },
    { tanggal: "2027-02-06", nama: "Tahun Baru Imlek 2578 Kongzili" },
    { tanggal: "2027-03-09", nama: "Hari Raya Idul Fitri 1448 H" },
    { tanggal: "2027-03-10", nama: "Hari Raya Idul Fitri 1448 H" },
    { tanggal: "2027-03-26", nama: "Wafat Yesus Kristus" },
    { tanggal: "2027-05-01", nama: "Hari Buruh Internasional" },
    { tanggal: "2027-05-06", nama: "Kenaikan Yesus Kristus" },
    { tanggal: "2027-05-16", nama: "Hari Raya Idul Adha 1448 H" },
    { tanggal: "2027-05-20", nama: "Hari Raya Waisak 2571 BE" },
    { tanggal: "2027-06-01", nama: "Hari Lahir Pancasila" },
    { tanggal: "2027-06-06", nama: "Tahun Baru Islam 1449 H" },
    { tanggal: "2027-08-17", nama: "Hari Kemerdekaan RI Ke-82" },
    { tanggal: "2027-08-15", nama: "Maulid Nabi Muhammad SAW" },
    { tanggal: "2027-12-25", nama: "Hari Raya Natal" },
  ],
};

// In-Memory API Cache
const holidayCache: Map<number, HariLiburNasional[]> = new Map();

/**
 * Mengambil daftar hari libur nasional Indonesia (Tier 1: Online API, Tier 2: Built-in SKB 3 Menteri)
 */
export async function fetchIndonesianHolidays(year: number): Promise<HariLiburNasional[]> {
  if (holidayCache.has(year)) {
    return holidayCache.get(year)!;
  }

  const fallback = HOLIDAYS_DATABASE[year] || HOLIDAYS_DATABASE[2026];

  try {
    // Try Public Open Holidays API
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000), // 3 detik timeout
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Map API response
        const mapped: HariLiburNasional[] = data.map((item: { date: string; localName?: string; name: string }) => ({
          tanggal: item.date,
          nama: item.localName || item.name,
        }));

        // Merge with built-in SKB 3 Menteri for any missing local holiday (e.g. Idul Fitri Day 2, Cuti Bersama)
        const dateSet = new Set(mapped.map((m) => m.tanggal));
        for (const item of fallback) {
          if (!dateSet.has(item.tanggal)) {
            mapped.push(item);
          }
        }

        holidayCache.set(year, mapped);
        return mapped;
      }
    }
  } catch {
    // Gracefully use official built-in holidays database
  }

  holidayCache.set(year, fallback);
  return fallback;
}

/**
 * Menghitung rincian hari kalender, akhir pekan, libur nasional, dan total hari efektif sekolah secara sinkron
 */
export function getHariEfektifBulan(
  bulan: number,
  tahun: number,
  customHolidays?: HariLiburNasional[]
): HariEfektifResult {
  const targetYear = tahun || 2026;
  const targetMonth = Math.max(1, Math.min(12, bulan || 8));
  const namaBulan = NAMA_BULAN_INDONESIA[targetMonth];

  // Ambil daftar libur untuk tahun target
  const holidays = customHolidays || holidayCache.get(targetYear) || HOLIDAYS_DATABASE[targetYear] || HOLIDAYS_DATABASE[2026];

  // Hitung jumlah hari dalam bulan tersebut
  const totalHariKalender = new Date(targetYear, targetMonth, 0).getDate();

  let totalHariAkhirPekan = 0;
  let totalHariKerja = 0;
  let totalHariLiburNasionalWeekday = 0;

  const liburNasionalBulanIni: HariEfektifResult["liburNasionalBulanIni"] = [];
  const detailHari: HariEfektifResult["detailHari"] = [];

  for (let d = 1; d <= totalHariKalender; d++) {
    const dateObj = new Date(targetYear, targetMonth - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Minggu, 6 = Sabtu
    const dateStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const hariNama = NAMA_HARI_INDONESIA[dayOfWeek];

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const holiday = holidays.find((h) => h.tanggal === dateStr);

    if (isWeekend) {
      totalHariAkhirPekan++;
      detailHari.push({
        tanggal: dateStr,
        tanggalAngka: d,
        hari: hariNama,
        dayOfWeek,
        isEfektif: false,
        keterangan: holiday ? `${holiday.nama} (Akhir Pekan)` : `Libur Akhir Pekan (${hariNama})`,
      });

      if (holiday) {
        liburNasionalBulanIni.push({
          tanggal: dateStr,
          nama: holiday.nama,
          hari: hariNama,
          isWeekday: false,
        });
      }
    } else {
      totalHariKerja++;
      if (holiday) {
        totalHariLiburNasionalWeekday++;
        detailHari.push({
          tanggal: dateStr,
          tanggalAngka: d,
          hari: hariNama,
          dayOfWeek,
          isEfektif: false,
          keterangan: `Libur Nasional: ${holiday.nama}`,
        });

        liburNasionalBulanIni.push({
          tanggal: dateStr,
          nama: holiday.nama,
          hari: hariNama,
          isWeekday: true,
        });
      } else {
        detailHari.push({
          tanggal: dateStr,
          tanggalAngka: d,
          hari: hariNama,
          dayOfWeek,
          isEfektif: true,
          keterangan: "Hari Efektif Sekolah",
        });
      }
    }
  }

  const totalHariEfektif = Math.max(1, totalHariKerja - totalHariLiburNasionalWeekday);

  return {
    bulan: targetMonth,
    tahun: targetYear,
    namaBulan,
    totalHariKalender,
    totalHariAkhirPekan,
    totalHariKerja,
    totalHariLiburNasionalWeekday,
    totalHariEfektif,
    liburNasionalBulanIni,
    detailHari,
  };
}
