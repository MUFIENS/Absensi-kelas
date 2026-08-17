# 🚀 Panduan Deployment & Operasional Production: Absensi QR XI PPLG 1

Dokumen ini adalah panduan lengkap dan resmi untuk melakukan deployment aplikasi **Sistem Absensi Digital Kelas XI PPLG 1 SMKN 1 Ciomas** ke lingkungan **Production (Vercel / Cloud Hosting)** serta konfigurasi database Supabase.

---

## 📋 1. Kredensial & Akun Akses Default

Aplikasi mendukung 3 jenis peran pengguna:

| Peran | Metode Login | Identifikasi / Sandi | Deskripsi Hak Akses |
| :--- | :--- | :--- | :--- |
| **Siswa (46 Siswa)** | Nama Lengkap & NISN | Terdaftar di Database (46 Siswa) | Scan QR kehadiran pagi & sholat dzuhur, ajukan izin/sakit, lihat riwayat |
| **Sekretaris Kelas** | Kata Sandi Khusus | `Sekretaris#9Xk$2026!PPLG1` | Buka sesi QR Kelas Pagi, proyektor layar penuh, verifikasi presensi pagi, kelola izin |
| **Guru / Wali Kelas** | Kata Sandi Khusus | `WaliKelas#Didin$2026!Ciomas` | Buka sesi QR Sholat Dzuhur, verifikasi sholat, rekapitulasi 46 siswa, ekspor Excel/CSV |

---

## ⚙️ 2. Variabel Lingkungan (*Environment Variables*)

Tambahkan variabel lingkungan berikut pada pengaturan **Project Settings $\rightarrow$ Environment Variables** di platform hosting Anda (Vercel / Netlify / VPS):

```env
# Supabase Cloud Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# School Location & Geofencing (SMKN 1 Ciomas)
NEXT_PUBLIC_SCHOOL_LATITUDE=-6.5858633
NEXT_PUBLIC_SCHOOL_LONGITUDE=106.7587903
NEXT_PUBLIC_SCHOOL_RADIUS_METERS=150
```

> [!IMPORTANT]
> - `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dapat diakses oleh client browser.
> - `SUPABASE_SERVICE_ROLE_KEY` bersifat **RAHASIA** dan hanya dieksekusi di server Next.js (Server Actions) untuk verifikasi data yang aman dari manipulasi.

---

## 🗄️ 3. Konfigurasi Database Supabase & Media Storage

Pastikan konfigurasi di dashboard [Supabase](https://supabase.com) telah disiapkan:

1. **Storage Bucket**:
   - Masuk ke menu **Storage** $\rightarrow$ Buat Bucket baru bernama `absensi-media`.
   - Set visibilitas bucket menjadi **Private** (Aplikasi menggunakan *Batch Signed URLs* berdurasi 1 jam untuk keamanan foto).
2. **Realtime Replication**:
   - Masuk ke **Database** $\rightarrow$ **Replication**.
   - Aktifkan realtime pada tabel: `absensi_records`, `izin_records`, dan `qr_sesi`.
3. **Database Schema & 46 Siswa**:
   - Jalankan script SQL yang tersedia di folder `supabase/` untuk memastikan skema tabel `siswa`, `qr_sesi`, `absensi_records`, `izin_records`, dan `consumed_qr_tokens` terpasang rapi.

---

## 🌐 4. Langkah-Langkah Deploy ke Vercel (Rekomendasi)

1. **Push ke GitHub / GitLab / Bitbucket**:
   ```bash
   git add .
   git commit -m "feat: production ready absensi xi pplg 1"
   git push origin main
   ```
2. **Import Project di Vercel**:
   - Buka [vercel.com](https://vercel.com) dan login.
   - Klik **"Add New..."** $\rightarrow$ **"Project"**.
   - Pilih repository project ini.
3. **Konfigurasi Project**:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `next build` (Otomatis)
   - **Output Directory**: `.next` (Otomatis)
   - **Node.js Version**: `20.x` atau `22.x`
4. **Isi Environment Variables**:
   - Masukkan seluruh nilai dari bagian 2 di atas.
5. **Klik "Deploy"**:
   - Vercel akan otomatis melakukan kompilasi Turbopack, type-checking, dan mengaktifkan URL HTTPS produksi (misal: `https://absensi-xi-pplg1.vercel.app`).

---

## 📱 5. PWA Installation (Smartphone Siswa & Guru)

Aplikasi telah dilengkapi service worker & manifest PWA:
- **Android (Chrome)**: Ketuk ikon menu `⋮` $\rightarrow$ pilih **"Install Aplikasi"** atau **"Tambahkan ke Layar Utama"**.
- **iOS (Safari)**: Ketuk ikon Share `↑` $\rightarrow$ pilih **"Add to Home Screen"**.
- Aplikasi dapat dibuka layaknya aplikasi native Android/iOS tanpa bilah alamat browser (*Standalone App Mode*).

---

## 🔍 6. Checklist Verifikasi Akhir Pasca-Deploy (*Go-Live Checklist*)

- [ ] Halaman `/` dan `/login` terbuka dengan cepat dan sertifikat SSL aktif (`https://`).
- [ ] Login Siswa berhasil menggunakan Nama & NISN siswa kelas XI PPLG 1.
- [ ] Login Sekretaris berhasil dengan sandi `Sekretaris#9Xk$2026!PPLG1`.
- [ ] Login Guru / Wali Kelas berhasil dengan sandi `WaliKelas#Didin$2026!Ciomas`.
- [ ] Izin Kamera dan Geofencing GPS dapat diakses saat melakukan presensi di smartphone.
- [ ] Ekspor Excel (`.xlsx`) dan CSV pada halaman Rekapitulasi mengunduh data 46 siswa dengan format rapi.
