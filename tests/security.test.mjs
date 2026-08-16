import test from "node:test";
import assert from "node:assert/strict";

// Import security modules
import {
  constantTimeCompare,
  sanitizeInputText,
  sanitizeForSpreadsheet,
} from "../src/lib/security.ts";

import {
  RateLimiter,
  InMemoryRateLimitStore,
} from "../src/lib/rateLimit.ts";

test("Security: Constant Time String Comparison", () => {
  assert.equal(constantTimeCompare("secret123", "secret123"), true);
  assert.equal(constantTimeCompare("secret123", "secret124"), false);
  assert.equal(constantTimeCompare("secret", "secrets"), false);
  assert.equal(constantTimeCompare("", ""), true);
});

test("Security: Anti-XSS and Input Entity Sanitization", () => {
  const dirty = '<script>alert("hack")</script>';
  const cleaned = sanitizeInputText(dirty);
  assert.equal(cleaned.includes("<script>"), false);
  assert.equal(cleaned.includes("alert"), true);
  assert.equal(cleaned, '&lt;script&gt;alert(&quot;hack&quot;)&lt;&#x2F;script&gt;');
});

test("Security: Excel / CSV Formula Injection (CWE-1236) Protection", () => {
  // Test formula triggers
  assert.equal(sanitizeForSpreadsheet("=SUM(A1:A10)"), "'=SUM(A1:A10)");
  assert.equal(sanitizeForSpreadsheet("+12345"), "'+12345");
  assert.equal(sanitizeForSpreadsheet("-500"), "'-500");
  assert.equal(sanitizeForSpreadsheet("@SUM"), "'@SUM");
  // Test normal text
  assert.equal(sanitizeForSpreadsheet("Sakit demam tinggi"), "Sakit demam tinggi");
});

test("Security: Rate Limiter Composite Key Isolation (NAT / School WiFi Protection)", () => {
  const store = new InMemoryRateLimitStore();
  const limiter = new RateLimiter({ maxRequests: 3, windowMs: 60000 }, store);

  const sharedIp = "192.168.1.100";
  const studentA = "0095725690";
  const studentB = "0104082053";

  // Student A makes 3 failed attempts
  assert.equal(limiter.check(sharedIp, studentA).allowed, true);
  assert.equal(limiter.check(sharedIp, studentA).allowed, true);
  assert.equal(limiter.check(sharedIp, studentA).allowed, true);
  
  // 4th attempt for Student A is blocked
  const blockedA = limiter.check(sharedIp, studentA);
  assert.equal(blockedA.allowed, false);
  assert.ok(blockedA.retryAfterSeconds > 0);

  // Student B on the SAME IP must NOT be blocked!
  const allowedB = limiter.check(sharedIp, studentB);
  assert.equal(allowedB.allowed, true);
  assert.equal(allowedB.remaining, 2);
});

test("Security: Rate Limiter Reset on Successful Authentication", () => {
  const store = new InMemoryRateLimitStore();
  const limiter = new RateLimiter({ maxRequests: 2, windowMs: 60000 }, store);

  limiter.check("client1", "user1");
  limiter.check("client1", "user1");
  assert.equal(limiter.check("client1", "user1").allowed, false);

  // Reset
  limiter.reset("client1", "user1");
  assert.equal(limiter.check("client1", "user1").allowed, true);
});

test("Authentication: Student Matching by Nama and NISN (No PIN required)", () => {
  // Test student dataset matching logic
  const mockStudents = [
    { id: 1, nis: "0095725690", nama: "Abdad Farras Orlando", nomorAbsen: 1 },
    { id: 13, nis: "0104082053", nama: "Dhara Zahraina Mulya", nomorAbsen: 13 },
  ];

  function authenticateStudent(namaInput, nisnInput) {
    const cleanNama = namaInput.trim().toLowerCase();
    const cleanNisn = nisnInput.trim();
    if (!cleanNama || !cleanNisn) return { success: false, message: "Empty input" };

    const target = mockStudents.find((s) => s.nis === cleanNisn || s.nama.toLowerCase().includes(cleanNama));
    if (!target) return { success: false, message: "Not found" };

    const nameMatches = target.nama.toLowerCase().includes(cleanNama) || cleanNama.includes(target.nama.toLowerCase());
    const nisnMatches = target.nis === cleanNisn;
    if (!nameMatches || !nisnMatches) return { success: false, message: "Mismatch" };

    return { success: true, student: target };
  }

  // Exact Match
  assert.equal(authenticateStudent("Abdad Farras Orlando", "0095725690").success, true);
  // Partial Name Match
  assert.equal(authenticateStudent("Dhara", "0104082053").success, true);
  // Mismatch Name and NISN
  assert.equal(authenticateStudent("Abdad Farras", "0104082053").success, false);
  // Empty
  assert.equal(authenticateStudent("", "0095725690").success, false);
});

// Import Calendar Module
import { getHariEfektifBulan } from "../src/lib/calendarApi.ts";

test("Calendar: Dynamic Effective School Days Calculation (Indonesian School Weekdays - Holidays)", () => {
  // Agustus 2026: 31 days, 21 weekdays (Mon-Fri) - 1 holiday (17 Ags: HUT RI) = 20 hari efektif
  const agustus = getHariEfektifBulan(8, 2026);
  assert.equal(agustus.totalHariKalender, 31);
  assert.equal(agustus.totalHariKerja, 21);
  assert.equal(agustus.totalHariLiburNasionalWeekday, 1);
  assert.equal(agustus.totalHariEfektif, 20);
  assert.equal(agustus.liburNasionalBulanIni.some((l) => l.nama.includes("Hari Kemerdekaan")), true);

  // Oktober 2026: 31 days, 22 weekdays (Mon-Fri) - 0 holidays = 22 hari efektif (as requested by user)
  const oktober = getHariEfektifBulan(10, 2026);
  assert.equal(oktober.totalHariKalender, 31);
  assert.equal(oktober.totalHariKerja, 22);
  assert.equal(oktober.totalHariLiburNasionalWeekday, 0);
  assert.equal(oktober.totalHariEfektif, 22);

  // Desember 2026: 31 days, 23 weekdays (Mon-Fri) - 1 holiday (25 Des / Natal) = 22 hari efektif
  const desember = getHariEfektifBulan(12, 2026);
  assert.equal(desember.totalHariKalender, 31);
  assert.equal(desember.totalHariKerja, 23);
  assert.equal(desember.totalHariLiburNasionalWeekday, 1);
  assert.equal(desember.totalHariEfektif, 22);
});

test("Rekapitulasi: Monthly Date Filtering & Future Month Zero-Leakage Algorithm", () => {
  // Mock records from August 2026
  const mockRecords = [
    { id: 101, siswaId: 1, jenis: "kehadiran_kelas", tanggal: "2026-08-16", status: "verified" },
    { id: 102, siswaId: 2, jenis: "sholat_dzuhur", tanggal: "2026-08-16", status: "verified" },
  ];
  const mockIzins = [
    { id: 201, siswaId: 4, jenis: "Sakit", tanggal: "2026-08-16", status: "verified" },
  ];
  const mockStudents = [
    { id: 1, nama: "Abdad Farras Orlando" },
    { id: 2, nama: "Achmad Khadaffi" },
    { id: 4, nama: "Aldentra" },
  ];

  function calculateMonthlyRekap(bulan, tahun) {
    const monthRecords = mockRecords.filter((r) => {
      const [y, m] = r.tanggal.split("-").map(Number);
      return y === tahun && m === bulan && r.status === "verified";
    });
    const monthIzins = mockIzins.filter((i) => {
      const [y, m] = i.tanggal.split("-").map(Number);
      return y === tahun && m === bulan && i.status === "verified";
    });

    const activeDates = new Set([
      ...monthRecords.map((r) => r.tanggal),
      ...monthIzins.map((i) => i.tanggal),
    ]);
    const sesiBerjalan = activeDates.size;

    return mockStudents.map((s) => {
      const hadir = monthRecords.filter((r) => r.siswaId === s.id && r.jenis === "kehadiran_kelas").length;
      const sakit = monthIzins.filter((i) => i.siswaId === s.id && i.jenis === "Sakit").length;
      const izin = monthIzins.filter((i) => i.siswaId === s.id && i.jenis === "Izin").length;
      
      const alpa = sesiBerjalan > 0 ? Math.max(0, sesiBerjalan - (hadir + sakit + izin)) : 0;
      const persentase = sesiBerjalan > 0 ? Math.round(((hadir + sakit + izin) / sesiBerjalan) * 100) : 0;

      return { siswa: s, hadir, sakit, izin, alpa, persentase, sesiBerjalan };
    });
  }

  // 1. Agustus 2026 (1 session held)
  const rekapAgs = calculateMonthlyRekap(8, 2026);
  assert.equal(rekapAgs[0].hadir, 1);
  assert.equal(rekapAgs[0].alpa, 0);
  assert.equal(rekapAgs[0].persentase, 100);

  // 2. November 2026 (0 session held: must be 0 Hadir, 0 Alpa, 0% with 0 leakage)
  const rekapNov = calculateMonthlyRekap(11, 2026);
  assert.equal(rekapNov[0].hadir, 0);
  assert.equal(rekapNov[0].alpa, 0);
  assert.equal(rekapNov[0].persentase, 0);
  assert.equal(rekapNov[0].sesiBerjalan, 0);
});


