// Konfigurasi Environment & Demo Flag
// Catatan: IS_DEMO_MODE mengaktifkan quick switcher & mock data untuk fase preview.
// Pada fase produksi, variabel ini akan bernilai false.

export const IS_DEMO_MODE = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO === 'true';

export const APP_CONFIG = {
  appName: 'Absensi QR XI PPLG 1',
  classRoom: 'XI PPLG 1',
  schoolName: 'SMKN 1 Ciomas',
  version: '1.0.0 (Fase 1 - Frontend Preview)',
  isBackendConnected: false,
  sholatTimeRange: {
    startHour: 12,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
    label: '12.00 – 13.00 WIB (Istirahat Kedua)',
  },
  // Konfigurasi Lokasi GPS & Geofencing Sekolah SMK Negeri 1 Ciomas
  schoolLocation: {
    name: 'SMK Negeri 1 Ciomas (Jl. Raya Laladon, Bogor)',
    latitude: -6.5858633,
    longitude: 106.7587903,
    radiusMeters: 150, // Radius toleransi (150 meter)
    googleMapsUrl: 'https://maps.app.goo.gl/PDAUuMrRwtdeFdKq9',
  },
};

/**
 * Menghitung jarak presisi antara dua koordinat GPS (dalam meter) menggunakan Haversine Formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number = APP_CONFIG.schoolLocation.latitude,
  lon2: number = APP_CONFIG.schoolLocation.longitude
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

