'use server';

import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { constantTimeCompare, sanitizeInputText, sanitizeForSpreadsheet } from '@/lib/security';
import { getHariEfektifBulan } from '@/lib/calendarApi';
import type { AbsensiRecord, IzinRecord, QRSesi, RekapItemSiswa, Siswa, AdminUser, AuthSession } from '@/lib/types';

// Helper: Ubah base64 data URL ke buffer untuk storage upload
function decodeBase64Image(dataUrl: string): { buffer: Buffer; contentType: string } {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      contentType: matches[1],
      buffer: Buffer.from(matches[2], 'base64'),
    };
  }
  // Fallback jika format raw base64
  return {
    contentType: 'image/jpeg',
    buffer: Buffer.from(dataUrl, 'base64'),
  };
}

// 1. Autentikasi Siswa
export async function authenticateSiswaAction(namaRaw: string, nisnRaw: string, pin?: string) {
  const cleanNama = sanitizeInputText(namaRaw).trim().toLowerCase();
  const cleanNisn = sanitizeInputText(nisnRaw).trim();

  if (!cleanNama || !cleanNisn) {
    return { success: false, message: 'Nama dan 10 digit NISN wajib diisi.' };
  }

  const supabase = getSupabaseServerClient();
  const { data: siswaList, error } = await supabase
    .from('siswa')
    .select('*');

  if (error || !siswaList || siswaList.length === 0) {
    return {
      success: false,
      message: 'Data siswa belum terdaftar di database. Hubungi wali kelas atau administrator.',
    };
  }

  // Cari siswa yang NISN-nya cocok
  const matchedStudent = siswaList.find(s => {
    const nisnMatch = s.nisn === cleanNisn;
    const dbNamaLower = s.nama.toLowerCase();
    const nameMatch = dbNamaLower.includes(cleanNama) || cleanNama.includes(dbNamaLower);
    return nisnMatch && nameMatch;
  });

  if (!matchedStudent) {
    return {
      success: false,
      message: 'Kombinasi Nama dan NISN tidak cocok dengan data kelas XI PPLG 1.',
    };
  }

  // Jika siswa memiliki PIN terdaftar dan PIN dikirim
  if (matchedStudent.pin_hash && pin) {
    if (!constantTimeCompare(matchedStudent.pin_hash, pin.trim())) {
      return { success: false, message: 'PIN siswa yang Anda masukkan salah.' };
    }
  }

  const session: AuthSession = {
    user: {
      id: matchedStudent.id,
      nis: matchedStudent.nisn,
      nama: matchedStudent.nama,
      nomorAbsen: matchedStudent.nomor_absen,
      gender: matchedStudent.gender as 'L' | 'P',
    },
    role: 'siswa',
    token: `token_siswa_${matchedStudent.id}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  return { success: true, session };
}

// 2. Autentikasi Admin & Wali Kelas
export async function authenticateAdminAction(usernameRaw: string, passwordRaw: string) {
  const cleanUser = sanitizeInputText(usernameRaw).trim().toLowerCase();
  const cleanPass = passwordRaw.trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, message: 'Username dan password wajib diisi.' };
  }

  const supabase = getSupabaseServerClient();
  const { data: adminList, error } = await supabase
    .from('admin_users')
    .select('*');

  if (error || !adminList || adminList.length === 0) {
    return {
      success: false,
      message: 'Akun admin belum terdaftar di database. Hubungi administrator.',
    };
  }

  const admin = adminList.find(a => a.username.toLowerCase() === cleanUser);
  if (!admin || !constantTimeCompare(admin.password_hash, cleanPass)) {
    return {
      success: false,
      message: 'Username atau password pengurus/wali kelas salah.',
    };
  }

  const adminUserObj = {
    id: admin.id,
    username: admin.username,
    nama: admin.nama,
    role: admin.role as 'admin' | 'wali_kelas',
  };

  const session: AuthSession = {
    user: adminUserObj,
    admin: adminUserObj,
    role: admin.role as 'admin' | 'wali_kelas',
    token: `token_admin_${admin.id}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  return { success: true, session };
}

// 3. Buat Sesi QR Baru
export async function createQRSesiAction(params: {
  jenis: 'kehadiran_kelas' | 'sholat_dzuhur';
  durationMinutes: number;
  adminId: number;
  adminName: string;
}) {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const startTime = now.toISOString();
  const endTime = new Date(now.getTime() + params.durationMinutes * 60000).toISOString();
  const prefix = params.jenis === 'kehadiran_kelas' ? 'KLAS' : 'SHLT';
  const dateCode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  const token = `${prefix}-${dateCode}-${randomCode}`;
  const qrUrl = `/dashboard/siswa/absen?token=${token}`;

  // Nonaktifkan sesi aktif sebelumnya untuk jenis yang sama hari ini
  await supabase
    .from('qr_sessions')
    .update({ is_active: false })
    .eq('tanggal', todayStr)
    .eq('jenis', params.jenis)
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('qr_sessions')
    .insert({
      jenis: params.jenis,
      token,
      qr_url: qrUrl,
      tanggal: todayStr,
      waktu_mulai: startTime,
      waktu_berakhir: endTime,
      admin_id: params.adminId,
      admin_name: sanitizeInputText(params.adminName),
      duration_minutes: params.durationMinutes,
      is_active: true,
    })
    .select()
    .single();

  if (error || !data) {
    return { success: false, message: `Gagal membuat sesi QR: ${error?.message || 'Unknown error'}` };
  }

  return { success: true, session: data };
}

// 4. Nonaktifkan Sesi QR
export async function deactivateQRSesiAction(sesiId: number) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('qr_sessions')
    .update({ is_active: false })
    .eq('id', sesiId);

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

// 5. Submit Presensi Siswa (Anti-Replay & Upload Selfie)
export async function submitAbsensiAction(params: {
  token: string;
  siswaId: number;
  jenis: 'kehadiran_kelas' | 'sholat_dzuhur';
  fotoDataUrl: string;
}) {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Validasi Token Sesi QR
  const { data: sesi, error: sesiErr } = await supabase
    .from('qr_sessions')
    .select('*')
    .eq('token', params.token)
    .eq('jenis', params.jenis)
    .eq('is_active', true)
    .single();

  if (sesiErr || !sesi) {
    return { success: false, message: 'QR Code tidak valid atau sesi telah dinonaktifkan.' };
  }

  // Cek rentang waktu sesi
  const waktuMulai = new Date(sesi.waktu_mulai);
  const waktuBerakhir = new Date(sesi.waktu_berakhir);
  if (now < waktuMulai) {
    return { success: false, message: 'Sesi absensi belum dimulai.' };
  }
  if (now > waktuBerakhir) {
    return { success: false, message: 'Sesi absensi telah berakhir / kedaluwarsa.' };
  }

  // 2. Cek Anti-Replay Token
  const { data: existingConsumed } = await supabase
    .from('consumed_qr_tokens')
    .select('id')
    .eq('token', params.token)
    .eq('siswa_id', params.siswaId)
    .maybeSingle();

  if (existingConsumed) {
    return { success: false, message: 'QR Code ini sudah pernah Anda gunakan untuk absensi!' };
  }

  // 3. Cek Absensi Ganda Hari Ini
  const { data: existingRecord } = await supabase
    .from('absensi_records')
    .select('id')
    .eq('siswa_id', params.siswaId)
    .eq('jenis', params.jenis)
    .eq('tanggal', todayStr)
    .maybeSingle();

  if (existingRecord) {
    return {
      success: false,
      message: `Anda sudah tercatat melakukan absensi ${params.jenis === 'kehadiran_kelas' ? 'Kelas Pagi' : 'Sholat Dzuhur'} hari ini!`,
    };
  }

  // 4. Upload Foto Selfie ke Private Storage
  const { buffer, contentType } = decodeBase64Image(params.fotoDataUrl);
  const storagePath = `selfies/${todayStr}/${params.siswaId}_${params.jenis}_${Date.now()}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from('absensi-selfies')
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadErr) {
    return { success: false, message: `Gagal mengunggah foto selfie: ${uploadErr.message}` };
  }

  // 5. Simpan Record Presensi & Catat Consumed Token
  const { data: record, error: insertErr } = await supabase
    .from('absensi_records')
    .insert({
      siswa_id: params.siswaId,
      qr_sesi_id: sesi.id,
      jenis: params.jenis,
      tanggal: todayStr,
      waktu_absen: now.toISOString(),
      status: 'pending',
      foto_storage_path: storagePath,
    })
    .select()
    .single();

  if (insertErr || !record) {
    return { success: false, message: `Gagal menyimpan presensi: ${insertErr?.message || 'DB error'}` };
  }

  // Simpan record consumed token
  await supabase
    .from('consumed_qr_tokens')
    .insert({
      token: params.token,
      siswa_id: params.siswaId,
      consumed_at: now.toISOString(),
    });

  return { success: true, record };
}

// 6. Verifikasi Presensi (Disetujui / Ditolak)
export async function verifyAbsensiAction(params: {
  recordId: number;
  status: 'verified' | 'rejected';
  verifierName: string;
  alasan?: string;
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('absensi_records')
    .update({
      status: params.status,
      diverifikasi_oleh: sanitizeInputText(params.verifierName),
      waktu_verifikasi: new Date().toISOString(),
      alasan_penolakan: params.alasan ? sanitizeInputText(params.alasan) : null,
    })
    .eq('id', params.recordId);

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

// 7. Submit Surat Izin / Sakit
export async function submitIzinAction(params: {
  siswaId: number;
  jenis: 'Sakit' | 'Izin' | 'Dispensasi';
  tanggal: string;
  keterangan: string;
  suratFotoDataUrl?: string;
}) {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  let storagePath = '';

  // Upload Foto Surat ke Private Storage jika dilampirkan
  if (params.suratFotoDataUrl) {
    const { buffer, contentType } = decodeBase64Image(params.suratFotoDataUrl);
    storagePath = `surat/${params.tanggal}/${params.siswaId}_${Date.now()}.jpg`;

    const { error: uploadErr } = await supabase.storage
      .from('surat-izin')
      .upload(storagePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadErr) {
      return { success: false, message: `Gagal mengunggah foto surat: ${uploadErr.message}` };
    }
  }

  const { data: izin, error: insertErr } = await supabase
    .from('izin_records')
    .insert({
      siswa_id: params.siswaId,
      jenis: params.jenis,
      tanggal: params.tanggal,
      keterangan: sanitizeForSpreadsheet(params.keterangan),
      surat_storage_path: storagePath,
      status: 'pending',
      waktu_pengajuan: now.toISOString(),
    })
    .select()
    .single();

  if (insertErr || !izin) {
    return { success: false, message: `Gagal menyimpan permohonan izin: ${insertErr?.message || 'DB error'}` };
  }

  return { success: true, izin, recordId: izin.id };
}

// 8. Verifikasi Izin (Disetujui / Ditolak)
export async function verifyIzinAction(params: {
  izinId?: number;
  recordId?: number;
  status: 'verified' | 'rejected';
  verifierName: string;
  alasan?: string;
}) {
  const targetId = params.izinId ?? params.recordId;
  if (!targetId) {
    return { success: false, message: 'ID izin tidak ditemukan.' };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('izin_records')
    .update({
      status: params.status,
      diverifikasi_oleh: sanitizeInputText(params.verifierName),
      waktu_verifikasi: new Date().toISOString(),
      alasan_penolakan: params.alasan ? sanitizeInputText(params.alasan) : null,
    })
    .eq('id', targetId);

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

// 9. Dapatkan Signed URL untuk Melihat Foto (15 Menit)
export async function getSignedMediaUrlAction(
  bucket: 'absensi-selfies' | 'surat-izin',
  storagePath: string
) {
  if (!storagePath) return { success: false, url: '' };

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 900); // 15 menit (900 detik)

  if (error || !data) {
    return { success: false, url: '' };
  }

  return { success: true, url: data.signedUrl };
}

// 10. Ambil Rekap Presensi Bulanan Lengkap
export async function fetchRekapKelasAction(bulan: number, tahun: number, customHariEfektif?: number) {
  const supabase = getSupabaseServerClient();
  try {
    // 1. Ambil daftar siswa
    const { data: siswaList } = await supabase
    .from('siswa')
    .select('*')
    .order('nomor_absen', { ascending: true });

  if (!siswaList || siswaList.length === 0) {
    return {
      success: true,
      rekap: [],
      hariEfektifInfo: getHariEfektifBulan(bulan, tahun),
    };
  }

  // 2. Ambil sesi QR bulan ini
  const padMonth = String(bulan).padStart(2, '0');
  const startDate = `${tahun}-${padMonth}-01`;
  const nextMonth = bulan === 12 ? 1 : bulan + 1;
  const nextYear = bulan === 12 ? tahun + 1 : tahun;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  const { data: sesiList } = await supabase
    .from('qr_sessions')
    .select('*')
    .gte('tanggal', startDate)
    .lt('tanggal', endDate);

  // 3. Ambil absensi records bulan ini
  const { data: absensiList } = await supabase
    .from('absensi_records')
    .select('*')
    .gte('tanggal', startDate)
    .lt('tanggal', endDate);

  // 4. Ambil izin records bulan ini
  const { data: izinList } = await supabase
    .from('izin_records')
    .select('*')
    .gte('tanggal', startDate)
    .lt('tanggal', endDate);

  const hariEfektifInfo = getHariEfektifBulan(bulan, tahun);
  const totalHariEfektif = customHariEfektif !== undefined && customHariEfektif > 0
    ? customHariEfektif
    : hariEfektifInfo.totalHariEfektif;

  // Tanggal unik yang memiliki presensi / izin masuk
  const tanggalAdaPresensiKelas = new Set(
    (absensiList || []).filter(r => r.jenis === 'kehadiran_kelas').map(r => r.tanggal)
  );
  const tanggalAdaIzin = new Set(
    (izinList || []).filter(r => r.status === 'verified').map(r => r.tanggal)
  );
  const tanggalAdaPresensiSholat = new Set(
    (absensiList || []).filter(r => r.jenis === 'sholat_dzuhur').map(r => r.tanggal)
  );

  // Hari berjalan kelas hanya dihitung jika ada sesi yang sah dan terdapat aktivitas presensi/izin
  const tanggalSesiKelas = new Set(
    (sesiList || [])
      .filter(s => s.jenis === 'kehadiran_kelas')
      .filter(s => tanggalAdaPresensiKelas.has(s.tanggal) || tanggalAdaIzin.has(s.tanggal))
      .map(s => s.tanggal)
  );

  // Hari berjalan sholat dzuhur hanya dihitung jika ada aktivitas presensi sholat
  const tanggalSesiSholat = new Set(
    (sesiList || [])
      .filter(s => s.jenis === 'sholat_dzuhur')
      .filter(s => tanggalAdaPresensiSholat.has(s.tanggal))
      .map(s => s.tanggal)
  );

  const sesiKelasBerjalan = tanggalSesiKelas.size;
  const sesiSholatBerjalan = tanggalSesiSholat.size;

  const rekap: RekapItemSiswa[] = siswaList.map(s => {
    const studentAbsensi = (absensiList || []).filter(r => r.siswa_id === s.id);
    const studentIzin = (izinList || []).filter(r => r.siswa_id === s.id);

    // Kehadiran kelas
    const kelasHadir = studentAbsensi.filter(
      r => r.jenis === 'kehadiran_kelas' && (r.status === 'verified' || r.status === 'pending')
    ).length;

    const kelasSakit = studentIzin.filter(
      r => r.jenis === 'Sakit' && r.status === 'verified'
    ).length;

    const kelasIzin = studentIzin.filter(
      r => (r.jenis === 'Izin' || r.jenis === 'Dispensasi') && r.status === 'verified'
    ).length;

    const kelasTerdata = kelasHadir + kelasSakit + kelasIzin;
    const kelasAlpa = sesiKelasBerjalan > 0 ? Math.max(0, sesiKelasBerjalan - kelasTerdata) : 0;
    const kelasPersentase = sesiKelasBerjalan > 0
      ? Math.min(100, Math.round(((kelasHadir + kelasSakit + kelasIzin) / sesiKelasBerjalan) * 100))
      : 0;

    // Sholat dzuhur
    const sholatHadir = studentAbsensi.filter(
      r => r.jenis === 'sholat_dzuhur' && (r.status === 'verified' || r.status === 'pending')
    ).length;

    const sholatAlpa = sesiSholatBerjalan > 0 ? Math.max(0, sesiSholatBerjalan - sholatHadir) : 0;
    const sholatPersentase = sesiSholatBerjalan > 0
      ? Math.min(100, Math.round((sholatHadir / sesiSholatBerjalan) * 100))
      : 0;

    return {
      siswa: {
        id: s.id,
        nis: s.nisn,
        nama: s.nama,
        nomorAbsen: s.nomor_absen,
        gender: s.gender as 'L' | 'P',
      },
      kehadiranKelas: {
        hadir: kelasHadir,
        sakit: kelasSakit,
        izin: kelasIzin,
        alpa: kelasAlpa,
        totalHari: totalHariEfektif,
        hariBerjalan: sesiKelasBerjalan,
        persentase: kelasPersentase,
      },
      sholatDzuhur: {
        hadir: sholatHadir,
        alpa: sholatAlpa,
        totalHari: totalHariEfektif,
        hariBerjalan: sesiSholatBerjalan,
        persentase: sholatPersentase,
      },
    };
  });

    return {
      success: true,
      rekap,
      hariEfektifInfo: {
        ...hariEfektifInfo,
        totalHariEfektif,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || 'Gagal menghitung rekapitulasi' };
  }
}

// 11. Backup Database Snapshot (Khusus Wali Kelas)
export async function exportDatabaseBackupAction() {
  const supabase = getSupabaseServerClient();
  try {
    const [{ data: siswa }, { data: qrSessions }, { data: absensiRecords }, { data: izinRecords }, { data: adminUsers }] = await Promise.all([
      supabase.from('siswa').select('*').order('nomor_absen', { ascending: true }),
      supabase.from('qr_sessions').select('*').order('created_at', { ascending: false }),
      supabase.from('absensi_records').select('*').order('created_at', { ascending: false }),
      supabase.from('izin_records').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_users').select('id, username, nama, role, created_at').order('id', { ascending: true }),
    ]);

    const backupPayload = {
      backupVersion: "1.0",
      aplikasi: "Absensi QR XI PPLG 1",
      sekolah: "SMKN 1 Ciomas",
      kelas: "XI PPLG 1",
      exportedAt: new Date().toISOString(),
      statistik: {
        totalSiswa: siswa?.length || 0,
        totalSesiQR: qrSessions?.length || 0,
        totalPresensi: absensiRecords?.length || 0,
        totalIzin: izinRecords?.length || 0,
      },
      data: {
        siswa: siswa || [],
        adminUsers: adminUsers || [],
        qrSessions: qrSessions || [],
        absensiRecords: absensiRecords || [],
        izinRecords: izinRecords || [],
      }
    };

    return { success: true, backup: backupPayload };
  } catch (err: any) {
    return { success: false, message: `Gagal membuat backup: ${err.message}` };
  }
}
