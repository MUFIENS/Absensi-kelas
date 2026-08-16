import {
  QRSesi,
  AbsensiRecord,
  IzinRecord,
  KategoriIzin,
  JenisAbsensi,
  AuthSession,
  RekapItemSiswa,
  LokasiPresensi
} from './types';
import {
  SEED_SISWA,
  SEED_ADMINS,
  INITIAL_QR_SESSIONS,
  INITIAL_ABSENSI_RECORDS,
  INITIAL_IZIN_RECORDS,
  SAMPLE_SELFIE,
  SAMPLE_SURAT_IZIN
} from './seedData';
import { APP_CONFIG } from './env';
import {
  hashPasswordWithSalt,
  constantTimeCompare,
  sanitizeInputText,
  sanitizeForSpreadsheet,
  isTokenAlreadyConsumed,
  registerConsumedToken,
} from './security';
import { getHariEfektifBulan } from './calendarApi';
import { getJakartaDateString } from './dateUtils';

const STORAGE_KEYS = {
  AUTH: 'absensi_v6_auth_session',
  QR_SESSIONS: 'absensi_v6_qr_sessions',
  RECORDS: 'absensi_v6_records',
  IZIN: 'absensi_v6_izin_records',
};

// Helper safely accessing localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// ----------------------------------------------------
// AUTH STORE
// ----------------------------------------------------

export function getStoredAuth(): AuthSession | null {
  return getFromStorage<AuthSession | null>(STORAGE_KEYS.AUTH, null);
}

export function setStoredAuth(session: AuthSession | null): void {
  saveToStorage(STORAGE_KEYS.AUTH, session);
}

export function loginSiswa(
  namaOrIdentifier: string,
  nisn: string
): { success: boolean; session?: AuthSession; message?: string } {
  const cleanNama = namaOrIdentifier.trim().toLowerCase();
  const cleanNisn = nisn.trim();

  if (!cleanNama) {
    return { success: false, message: 'Mohon masukkan atau pilih Nama Siswa.' };
  }
  if (!cleanNisn) {
    return { success: false, message: 'Mohon masukkan 10 digit NISN Siswa.' };
  }

  // Match student by NISN or by Name
  const siswaByNisn = SEED_SISWA.find(s => s.nis === cleanNisn);
  const siswaByNama = SEED_SISWA.find(
    s => s.nama.toLowerCase().includes(cleanNama) || cleanNama.includes(s.nama.toLowerCase()) || String(s.nomorAbsen) === cleanNama
  );

  const targetSiswa = siswaByNisn || siswaByNama;

  if (!targetSiswa) {
    return { success: false, message: `Siswa "${namaOrIdentifier}" atau NISN "${nisn}" tidak terdaftar di data XI PPLG 1.` };
  }

  // Check matching between Name and NISN
  const isNameMatching =
    targetSiswa.nama.toLowerCase().includes(cleanNama) ||
    cleanNama.includes(targetSiswa.nama.toLowerCase()) ||
    String(targetSiswa.nomorAbsen) === cleanNama;

  const isNisnMatching = targetSiswa.nis === cleanNisn;

  if (!isNameMatching || !isNisnMatching) {
    return {
      success: false,
      message: `NISN "${cleanNisn}" tidak cocok dengan nama "${targetSiswa.nama}". Silakan periksa kembali NISN kamu.`
    };
  }

  const session: AuthSession = {
    token: `jwt_siswa_${targetSiswa.id}_${Date.now()}`,
    role: 'siswa',
    user: targetSiswa,
  };
  setStoredAuth(session);
  return { success: true, session };
}

export function loginAdmin(username: string, password: string): { success: boolean; session?: AuthSession; message?: string } {
  const admin = SEED_ADMINS.find(a => a.username.toLowerCase() === username.toLowerCase());
  if (!admin) {
    return { success: false, message: 'Username admin tidak terdaftar.' };
  }
  if (password !== 'admin123' && password !== 'wali123') {
    return { success: false, message: 'Password salah (Demo password: admin123 / wali123).' };
  }

  const session: AuthSession = {
    token: `jwt_admin_${admin.id}_${Date.now()}`,
    role: admin.role,
    user: admin,
  };
  setStoredAuth(session);
  return { success: true, session };
}

export function logout(): void {
  setStoredAuth(null);
}

// ----------------------------------------------------
// QR SESI STORE
// ----------------------------------------------------

export function getQRSessions(): QRSesi[] {
  return getFromStorage<QRSesi[]>(STORAGE_KEYS.QR_SESSIONS, INITIAL_QR_SESSIONS);
}

export function createQRSesi(
  jenis: JenisAbsensi,
  adminId: number,
  adminName: string,
  durationMinutes: number = 45
): QRSesi {
  const sessions = getQRSessions();
  const now = new Date();
  const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // Generate unique token
  const prefix = jenis === 'kehadiran_kelas' ? 'KLAS' : 'SHLT';
  const token = `${prefix}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const newSession: QRSesi = {
    id: Date.now(),
    jenis,
    token,
    qrUrl: `https://absensi.xipplg1.sch.id/scan?token=${token}`,
    tanggal: now.toLocaleDateString("en-CA"),
    waktuMulai: now.toISOString(),
    waktuBerakhir: endTime.toISOString(),
    adminId,
    adminName,
    durationMinutes,
    isActive: true,
  };

  // Deactivate existing sessions of same type
  const updated = sessions.map(s => s.jenis === jenis ? { ...s, isActive: false } : s);
  updated.unshift(newSession);

  saveToStorage(STORAGE_KEYS.QR_SESSIONS, updated);
  return newSession;
}

export function closeQRSesi(sessionId: number): boolean {
  const sessions = getQRSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) return false;

  sessions[index] = {
    ...sessions[index],
    isActive: false,
    waktuBerakhir: new Date().toISOString(),
  };

  saveToStorage(STORAGE_KEYS.QR_SESSIONS, sessions);
  return true;
}

export function getActiveQRSesi(jenis: JenisAbsensi): QRSesi | null {
  const sessions = getQRSessions();
  const now = new Date();
  const active = sessions.find(s => {
    if (s.jenis !== jenis) return false;
    if (!s.isActive) return false;
    const start = new Date(s.waktuMulai);
    const end = new Date(s.waktuBerakhir);
    return now >= start && now <= end;
  });
  return active || null;
}

export function validateQRToken(token: string): { valid: boolean; session?: QRSesi; message?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, message: "Token QR tidak boleh kosong." };
  }

  const cleanToken = token.trim().toUpperCase();
  const sessions = getQRSessions();
  const now = new Date();

  // Strict check: must match a registered session
  const matched = sessions.find(s => s.token.trim().toUpperCase() === cleanToken);

  if (!matched) {
    return {
      valid: false,
      message: "QR Code Ditolak! QR Code ini bukan QR resmi sesi absensi kelas XI PPLG 1."
    };
  }

  const startTime = new Date(matched.waktuMulai);
  const endTime = new Date(matched.waktuBerakhir);

  if (!matched.isActive) {
    return {
      valid: false,
      session: matched,
      message: `QR Code Ditolak! Sesi ${matched.jenis === 'kehadiran_kelas' ? 'Kehadiran Kelas' : 'Sholat Dzuhur'} (${matched.token}) telah ditutup oleh Admin/Guru.`
    };
  }

  if (now < startTime) {
    return {
      valid: false,
      session: matched,
      message: `QR Code Belum Aktif! Sesi baru dimulai pada pukul ${startTime.toLocaleTimeString('id-ID')} WIB.`
    };
  }

  if (now > endTime) {
    return {
      valid: false,
      session: matched,
      message: `QR Code Kedaluwarsa! Sesi telah berakhir pada pukul ${endTime.toLocaleTimeString('id-ID')} WIB. Silakan hubungi Sekretaris/Guru untuk sesi baru.`
    };
  }

  return { valid: true, session: matched };
}

// ----------------------------------------------------
// ABSENSI RECORDS STORE
// ----------------------------------------------------

export function getAbsensiRecords(): AbsensiRecord[] {
  return getFromStorage<AbsensiRecord[]>(STORAGE_KEYS.RECORDS, INITIAL_ABSENSI_RECORDS);
}

export function submitAbsensi(
  siswaId: number,
  token: string,
  fotoDataUrl: string,
  lokasi?: LokasiPresensi
): { success: boolean; record?: AbsensiRecord; message?: string; code?: number } {
  const sessions = getQRSessions();
  const now = new Date();
  const serverTimestamp = now.toISOString();
  const today = now.toLocaleDateString("en-CA");

  // 1. Validasi Token QR Sesi
  const matchedSession = sessions.find(s => s.token.trim().toUpperCase() === token.trim().toUpperCase());
  if (!matchedSession) {
    return { success: false, message: 'QR Code tidak valid atau tidak dikenali.', code: 404 };
  }

  // 2. Cek apakah sesi masih berlaku
  const startTime = new Date(matchedSession.waktuMulai);
  const endTime = new Date(matchedSession.waktuBerakhir);
  if (!matchedSession.isActive || now < startTime || now > endTime) {
    return {
      success: false,
      message: `Sesi QR Code sudah kedaluwarsa atau telah ditutup pada ${new Date(matchedSession.waktuBerakhir).toLocaleTimeString('id-ID')} WIB.`,
      code: 410
    };
  }

  // 3. Validasi khusus sholat dzuhur (Mode simulasi aktif agar testing dapat dilakukan kapan saja)

  // 4. Anti-Replay Check (Single-use per student session)
  if (isTokenAlreadyConsumed(token, siswaId)) {
    return {
      success: false,
      message: 'Token QR ini sudah pernah Anda gunakan untuk presensi (Anti-Replay Protection).',
      code: 409,
    };
  }

  // 5. Cek double submit harian
  const records = getAbsensiRecords();
  const alreadySubmitted = records.some(
    r => r.siswaId === siswaId && r.jenis === matchedSession.jenis && r.tanggal === today
  );

  if (alreadySubmitted) {
    return {
      success: false,
      message: `Kamu sudah melakukan absensi ${matchedSession.jenis === 'kehadiran_kelas' ? 'kehadiran kelas' : 'sholat dzuhur'} untuk hari ini.`,
      code: 409,
    };
  }

  const siswa = SEED_SISWA.find(s => s.id === siswaId);
  if (!siswa) {
    return { success: false, message: 'Data siswa tidak valid.', code: 400 };
  }

  // 6. Create Record & Register Consumed Token
  const newRecord: AbsensiRecord = {
    id: Date.now(),
    siswaId: siswa.id,
    siswa,
    qrSesiId: matchedSession.id,
    jenis: matchedSession.jenis,
    tanggal: today,
    waktuAbsen: serverTimestamp,
    status: 'pending',
    fotoUrl: fotoDataUrl || SAMPLE_SELFIE,
    timestampServer: serverTimestamp,
    lokasi: lokasi || {
      latitude: APP_CONFIG.schoolLocation.latitude,
      longitude: APP_CONFIG.schoolLocation.longitude,
      accuracy: 5,
      distanceMeters: 15,
      isWithinRadius: true,
      locationName: APP_CONFIG.schoolLocation.name,
    },
  };

  records.unshift(newRecord);
  saveToStorage(STORAGE_KEYS.RECORDS, records);
  registerConsumedToken(token, siswaId);

  return { success: true, record: newRecord };
}

export function verifyAbsensi(
  recordId: number,
  status: 'verified' | 'rejected',
  diverifikasiOleh: string,
  alasanPenolakan?: string
): boolean {
  const records = getAbsensiRecords();
  const index = records.findIndex(r => r.id === recordId);
  if (index === -1) return false;

  const sanitizedAlasan = alasanPenolakan ? sanitizeInputText(alasanPenolakan) : undefined;

  records[index] = {
    ...records[index],
    status,
    diverifikasiOleh,
    waktuVerifikasi: new Date().toISOString(),
    alasanPenolakan: status === 'rejected' ? (sanitizedAlasan || 'Foto bukti tidak memenuhi syarat') : undefined,
  };

  saveToStorage(STORAGE_KEYS.RECORDS, records);
  return true;
}

export function batchVerifyAbsensi(
  recordIds: number[],
  status: 'verified' | 'rejected',
  diverifikasiOleh: string
): number {
  const records = getAbsensiRecords();
  let count = 0;
  const now = new Date().toISOString();

  const updated = records.map(r => {
    if (recordIds.includes(r.id)) {
      count++;
      return {
        ...r,
        status,
        diverifikasiOleh,
        waktuVerifikasi: now,
      };
    }
    return r;
  });

  saveToStorage(STORAGE_KEYS.RECORDS, updated);
  return count;
}

// ----------------------------------------------------
// IZIN & SAKIT STORE
// ----------------------------------------------------

export function getIzinRecords(): IzinRecord[] {
  return getFromStorage<IzinRecord[]>(STORAGE_KEYS.IZIN, INITIAL_IZIN_RECORDS);
}

export function submitIzinSiswa(
  siswaId: number,
  jenis: KategoriIzin,
  tanggal: string,
  keterangan: string,
  suratFotoUrl: string
): { success: boolean; record?: IzinRecord; message?: string } {
  if (!keterangan || !keterangan.trim()) {
    return { success: false, message: 'Keterangan atau alasan izin wajib diisi.' };
  }
  if (!tanggal || !tanggal.trim()) {
    return { success: false, message: 'Tanggal izin wajib ditentukan.' };
  }

  const siswa = SEED_SISWA.find(s => s.id === siswaId);
  if (!siswa) {
    return { success: false, message: 'Data siswa tidak ditemukan.' };
  }

  const izins = getIzinRecords();
  const now = new Date().toISOString();

  const newIzin: IzinRecord = {
    id: Date.now(),
    siswaId: siswa.id,
    siswa,
    jenis,
    tanggal: tanggal.trim(),
    keterangan: sanitizeInputText(keterangan),
    suratFotoUrl: suratFotoUrl || SAMPLE_SURAT_IZIN,
    status: 'pending',
    waktuPengajuan: now,
  };

  izins.unshift(newIzin);
  saveToStorage(STORAGE_KEYS.IZIN, izins);

  return { success: true, record: newIzin };
}

export function verifyIzinRecord(
  izinId: number,
  status: 'verified' | 'rejected',
  diverifikasiOleh: string,
  alasanPenolakan?: string
): boolean {
  const izins = getIzinRecords();
  const index = izins.findIndex(i => i.id === izinId);
  if (index === -1) return false;

  izins[index] = {
    ...izins[index],
    status,
    diverifikasiOleh,
    waktuVerifikasi: new Date().toISOString(),
    alasanPenolakan: status === 'rejected' ? (alasanPenolakan || 'Surat/alasan tidak memenuhi syarat') : undefined,
  };

  saveToStorage(STORAGE_KEYS.IZIN, izins);
  return true;
}

// ----------------------------------------------------
// REKAPITULASI KELAS (46 SISWA)
// ----------------------------------------------------

export function getRekapKelas(bulan?: number, tahun?: number, customHariEfektif?: number): RekapItemSiswa[] {
  const records = getAbsensiRecords();
  const izins = getIzinRecords();
  const qrSessions = getQRSessions();
  
  const targetBulan = bulan || 8;
  const targetTahun = tahun || 2026;
  const hariEfektifInfo = getHariEfektifBulan(targetBulan, targetTahun);
  const totalHariKelas = customHariEfektif || hariEfektifInfo.totalHariEfektif;
  const totalHariSholat = totalHariKelas;

  // Filter records specifically for target month and year
  const monthRecords = records.filter(r => {
    if (!r.tanggal) return false;
    const parts = r.tanggal.split('-');
    if (parts.length < 2) return false;
    const recYear = parseInt(parts[0], 10);
    const recMonth = parseInt(parts[1], 10);
    return recYear === targetTahun && recMonth === targetBulan;
  });

  const monthIzins = izins.filter(i => {
    if (!i.tanggal) return false;
    const parts = i.tanggal.split('-');
    if (parts.length < 2) return false;
    const izinYear = parseInt(parts[0], 10);
    const izinMonth = parseInt(parts[1], 10);
    return izinYear === targetTahun && izinMonth === targetBulan && i.status === 'verified';
  });

  const monthQRSessions = qrSessions.filter(q => {
    if (!q.tanggal) return false;
    const parts = q.tanggal.split('-');
    if (parts.length < 2) return false;
    const qYear = parseInt(parts[0], 10);
    const qMonth = parseInt(parts[1], 10);
    return qYear === targetTahun && qMonth === targetBulan;
  });

  // Calculate distinct dates where class / prayer sessions took place with actual recorded activity
  const activeClassDates = new Set<string>();
  monthRecords.filter(r => r.jenis === 'kehadiran_kelas').forEach(r => activeClassDates.add(r.tanggal));
  monthIzins.forEach(i => activeClassDates.add(i.tanggal));

  const activeSholatDates = new Set<string>();
  monthRecords.filter(r => r.jenis === 'sholat_dzuhur').forEach(r => activeSholatDates.add(r.tanggal));

  const now = new Date();
  const todayStr = getJakartaDateString(now);

  const hariEfektifDates = new Set(
    hariEfektifInfo.detailHari.filter(d => d.isEfektif).map(d => d.tanggal)
  );

  const activeTodayTypes = new Set(
    monthQRSessions
      .filter(q => q.tanggal === todayStr && q.isActive)
      .map(q => q.jenis)
  );

  const isSessionClosed = (q: QRSesi) => {
    if (q.tanggal < todayStr) return true;
    if (q.tanggal > todayStr) return false;
    if (activeTodayTypes.has(q.jenis)) return false;
    if (!q.isActive) return true;
    if (q.waktuBerakhir && now > new Date(q.waktuBerakhir)) return true;
    return false;
  };

  // Sesi yang sudah selesai (sah untuk penetapan alpa)
  const completedClassDates = new Set<string>();
  monthQRSessions.filter(q => q.jenis === 'kehadiran_kelas' && isSessionClosed(q) && hariEfektifDates.has(q.tanggal)).forEach(q => {
    if (activeClassDates.has(q.tanggal)) completedClassDates.add(q.tanggal);
  });

  const completedSholatDates = new Set<string>();
  monthQRSessions.filter(q => q.jenis === 'sholat_dzuhur' && isSessionClosed(q) && hariEfektifDates.has(q.tanggal)).forEach(q => {
    if (activeSholatDates.has(q.tanggal)) completedSholatDates.add(q.tanggal);
  });

  const sesiKelasBerjalan = activeClassDates.size;
  const sesiSholatBerjalan = activeSholatDates.size;
  const sesiKelasSelesai = completedClassDates.size;
  const sesiSholatSelesai = completedSholatDates.size;

  return SEED_SISWA.map(siswa => {
    const studentRecords = monthRecords.filter(r => r.siswaId === siswa.id);
    const studentIzins = monthIzins.filter(i => i.siswaId === siswa.id);

    // Kehadiran Kelas (Semua sesi)
    const hadirKelas = new Set(
      studentRecords.filter(r => r.jenis === 'kehadiran_kelas' && (r.status === 'verified' || r.status === 'pending')).map(r => r.tanggal)
    ).size;
    const sakitKelas = new Set(
      studentIzins.filter(i => i.jenis === 'Sakit').map(i => i.tanggal)
    ).size;
    const izinKelas = new Set(
      studentIzins.filter(i => i.jenis === 'Izin' || i.jenis === 'Dispensasi').map(i => i.tanggal)
    ).size;

    // Presensi pada sesi yang SUDAH SELESAI
    const pastHadirKelas = new Set(
      studentRecords.filter(r => r.jenis === 'kehadiran_kelas' && (r.status === 'verified' || r.status === 'pending') && completedClassDates.has(r.tanggal)).map(r => r.tanggal)
    ).size;
    const pastSakitKelas = new Set(
      studentIzins.filter(i => i.jenis === 'Sakit' && completedClassDates.has(i.tanggal)).map(i => i.tanggal)
    ).size;
    const pastIzinKelas = new Set(
      studentIzins.filter(i => (i.jenis === 'Izin' || i.jenis === 'Dispensasi') && completedClassDates.has(i.tanggal)).map(i => i.tanggal)
    ).size;

    // Alpa hanya dihitung dari sesi yang sudah selesai
    let alpaKelas = 0;
    let persentaseKelas = 100;
    if (sesiKelasSelesai > 0) {
      alpaKelas = Math.max(0, sesiKelasSelesai - (pastHadirKelas + pastSakitKelas + pastIzinKelas));
      persentaseKelas = Math.min(100, Math.round(((hadirKelas + sakitKelas + izinKelas) / sesiKelasSelesai) * 100));
    } else if (sesiKelasBerjalan > 0) {
      persentaseKelas = Math.min(100, Math.round(((hadirKelas + sakitKelas + izinKelas) / sesiKelasBerjalan) * 100));
    }

    // Sholat Dzuhur
    const hadirSholat = new Set(
      studentRecords.filter(r => r.jenis === 'sholat_dzuhur' && (r.status === 'verified' || r.status === 'pending')).map(r => r.tanggal)
    ).size;

    const pastHadirSholat = new Set(
      studentRecords.filter(r => r.jenis === 'sholat_dzuhur' && (r.status === 'verified' || r.status === 'pending') && completedSholatDates.has(r.tanggal)).map(r => r.tanggal)
    ).size;

    let alpaSholat = 0;
    let persentaseSholat = 100;
    if (sesiSholatSelesai > 0) {
      alpaSholat = Math.max(0, sesiSholatSelesai - pastHadirSholat);
      persentaseSholat = Math.min(100, Math.round((hadirSholat / sesiSholatSelesai) * 100));
    } else if (sesiSholatBerjalan > 0) {
      persentaseSholat = Math.min(100, Math.round((hadirSholat / sesiSholatBerjalan) * 100));
    }

    return {
      siswa,
      kehadiranKelas: {
        hadir: hadirKelas,
        alpa: alpaKelas,
        izin: izinKelas,
        sakit: sakitKelas,
        totalHari: totalHariKelas,
        hariBerjalan: sesiKelasBerjalan,
        persentase: persentaseKelas,
      },
      sholatDzuhur: {
        hadir: hadirSholat,
        alpa: alpaSholat,
        totalHari: totalHariSholat,
        hariBerjalan: sesiSholatBerjalan,
        persentase: persentaseSholat,
      },
    };
  });
}
