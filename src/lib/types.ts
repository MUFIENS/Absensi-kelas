export type UserRole = 'siswa' | 'admin' | 'wali_kelas';

export type JenisAbsensi = 'kehadiran_kelas' | 'sholat_dzuhur';

export type StatusAbsensi = 'pending' | 'verified' | 'rejected';

export type KategoriIzin = 'Sakit' | 'Izin' | 'Dispensasi';

export interface Siswa {
  id: number;
  nis: string;
  nama: string;
  nomorAbsen: number;
  gender: 'L' | 'P';
}

export interface AdminUser {
  id: number;
  username: string;
  nama: string;
  role: 'admin' | 'wali_kelas';
}

export interface QRSesi {
  id: number;
  jenis: JenisAbsensi;
  token: string;
  qrUrl: string;
  tanggal: string; // YYYY-MM-DD
  waktuMulai: string; // ISO string
  waktuBerakhir: string; // ISO string
  adminId: number;
  adminName: string;
  durationMinutes?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface FotoBukti {
  id: number;
  absensiId: number;
  urlFoto: string;
  timestampServer: string; // ISO string
}

export interface LokasiPresensi {
  latitude: number;
  longitude: number;
  accuracy?: number; // Akurasi GPS dalam meter
  distanceMeters: number; // Jarak dari titik sekolah (meter)
  isWithinRadius: boolean; // Apakah dalam radius sekolah
  locationName?: string;
}

export interface AbsensiRecord {
  id: number;
  siswaId: number;
  siswa: Siswa;
  qrSesiId: number;
  jenis: JenisAbsensi;
  tanggal: string; // YYYY-MM-DD
  waktuAbsen: string; // ISO string
  status: StatusAbsensi;
  fotoUrl: string;
  timestampServer: string;
  lokasi?: LokasiPresensi;
  diverifikasiOleh?: string;
  waktuVerifikasi?: string;
  alasanPenolakan?: string;
}

export interface IzinRecord {
  id: number;
  siswaId: number;
  siswa: Siswa;
  jenis: KategoriIzin;
  tanggal: string; // YYYY-MM-DD
  keterangan: string;
  suratFotoUrl: string;
  status: StatusAbsensi;
  waktuPengajuan: string; // ISO string
  diverifikasiOleh?: string;
  waktuVerifikasi?: string;
  alasanPenolakan?: string;
}

export interface RekapItemSiswa {
  siswa: Siswa;
  kehadiranKelas: {
    hadir: number;
    alpa: number;
    izin: number;
    sakit: number;
    totalHari: number;
    hariBerjalan?: number;
    persentase: number;
  };
  sholatDzuhur: {
    hadir: number;
    alpa: number;
    totalHari: number;
    hariBerjalan?: number;
    persentase: number;
  };
}

export interface AuthSession {
  token: string;
  role: UserRole;
  user: Siswa | AdminUser;
  admin?: AdminUser;
  expiresAt?: string;
}
