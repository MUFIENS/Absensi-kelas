/**
 * Utility untuk menangani tanggal dan waktu presensi sekolah dalam zona waktu Indonesia (WIB - Asia/Jakarta).
 * Sangat penting untuk mencegah bug timezone saat aplikasi di-deploy ke server cloud (seperti Vercel yang default UTC).
 */

export function getJakartaDateString(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

export function getJakartaTimeString(date: Date = new Date()): string {
  return date.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) + ' WIB';
}
