import { Siswa, AdminUser, AbsensiRecord, QRSesi, IzinRecord } from './types';

// Master Data Siswa (0 Data - Siap untuk Database Backend)
export const SEED_SISWA: Siswa[] = [];

// Master Data Admin / Pengurus (0 Data - Siap untuk Database Backend)
export const SEED_ADMINS: AdminUser[] = [];

// Helper sample selfies
export const SAMPLE_SELFIE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%23FFD400'/><circle cx='150' cy='120' r='60' fill='%23181818'/><circle cx='135' cy='110' r='10' fill='%23FFFFFF'/><circle cx='165' cy='110' r='10' fill='%23FFFFFF'/><path d='M 130 145 Q 150 165 170 145' stroke='%23FFFFFF' stroke-width='6' fill='none' stroke-linecap='round'/><path d='M 70 260 Q 150 210 230 260' fill='%233355FF' stroke='%23181818' stroke-width='6'/><text x='150' y='285' font-family='sans-serif' font-weight='bold' font-size='14' text-anchor='middle' fill='%23181818'>LIVE CAMERA SELFIE</text></svg>";

// Sample Surat Dokter / Izin
export const SAMPLE_SURAT_IZIN = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='%23FFFFFF' stroke='%23181818' stroke-width='8'/><rect x='30' y='30' width='340' height='60' fill='%23FF6FA5'/><text x='200' y='68' font-family='sans-serif' font-weight='bold' font-size='18' text-anchor='middle' fill='%23181818'>SURAT KETERANGAN DOKTER</text><line x1='30' y1='110' x2='370' y2='110' stroke='%23181818' stroke-width='3'/><line x1='30' y1='140' x2='300' y2='140' stroke='%23AAAAAA' stroke-width='4'/><line x1='30' y1='170' x2='340' y2='170' stroke='%23AAAAAA' stroke-width='4'/><line x1='30' y1='200' x2='260' y2='200' stroke='%23AAAAAA' stroke-width='4'/><line x1='30' y1='230' x2='320' y2='230' stroke='%23AAAAAA' stroke-width='4'/><circle cx='300' cy='380' r='45' fill='none' stroke='%233355FF' stroke-width='4'/><text x='300' y='385' font-family='sans-serif' font-weight='bold' font-size='12' text-anchor='middle' fill='%233355FF'>KLINIK MEDIKA</text><text x='200' y='460' font-family='sans-serif' font-weight='bold' font-size='13' text-anchor='middle' fill='%23181818'>TERVERIFIKASI RESMI</text></svg>";

export const INITIAL_QR_SESSIONS: QRSesi[] = [];

export const INITIAL_ABSENSI_RECORDS: AbsensiRecord[] = [];

export const INITIAL_IZIN_RECORDS: IzinRecord[] = [];
