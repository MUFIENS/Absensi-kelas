# 🚀 Panduan Deployment & Konfigurasi Production: Absensi QR XI PPLG 1

Dokumen ini berisi panduan lengkap langkah demi langkah untuk melakukan deployment aplikasi **Sistem Absensi Kelas XI PPLG 1 SMKN 1 Ciomas** ke platform hosting production (Vercel) agar dapat diakses dari smartphone seluruh siswa dan guru.

---

## 📌 1. Variabel Lingkungan (*Environment Variables*)

Sebelum melakukan deploy, pastikan 3 variabel lingkungan berikut telah disalin dan dimasukkan ke dalam pengaturan **Environment Variables** di dashboard hosting (misal: Vercel / Netlify):

| Variable Name | Keterangan | Aksesibilitas |
| :--- | :--- | :---: |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Endpoint Supabase Project (`https://ohllvcwdrxewzfbjhhsr.supabase.co`) | Public Client & Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key (Read-Only) | Public Client & Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Secret Key (Bypass RLS) | **HANYA Server-Side** |

---

## 🌐 2. Langkah-Langkah Deploy ke Vercel (Rekomendasi)

1. **Push Repository ke GitHub / GitLab**:
   - Pastikan seluruh kode project terbaru sudah di-commit dan di-push ke branch `main`.
2. **Buka [Vercel Dashboard](https://vercel.com)**:
   - Klik tombol **"Add New..."** $\rightarrow$ **"Project"**.
   - Pilih repository `Absensi-kelas`.
3. **Konfigurasi Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
4. **Masukkan Environment Variables**:
   - Buka bagian **"Environment Variables"**, lalu tambahkan:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
5. **Deploy**:
   - Klik tombol **"Deploy"**. Vercel akan meng-compile aplikasi dan memberikan URL HTTPS resmi (contoh: `https://absensi-xi-pplg1.vercel.app`).

---

## 📱 3. Fitur PWA (Install di HP Siswa & Guru)

Aplikasi ini sudah dilengkapi dengan **Progressive Web App (PWA)**:
1. Buka URL production melalui browser smartphone (**Google Chrome** di Android atau **Safari** di iOS).
2. **Android (Chrome)**:
   - Ketuk menu titik tiga (⋮) di kanan atas $\rightarrow$ Pilih **"Tambahkan ke Layar Utama" / "Install Aplikasi"**.
3. **iOS (Safari)**:
   - Ketuk ikon Share ($\uparrow$) di bilah bawah $\rightarrow$ Pilih **"Add to Home Screen"**.
4. Aplikasi akan terpasang di layar utama HP dengan ikon logo neo-brutalis resmi dan berjalan dalam mode layar penuh (*standalone app*).

---

## 🛡️ 4. Checklist Keamanan & Izin Kamera

- [x] **HTTPS Mandatory**: Akses kamera live selfie di smartphone otomatis aktif karena hosting Vercel berjalan pada HTTPS aman.
- [x] **Private Storage**: Seluruh foto selfie presensi dan surat keterangan dokter disimpan di bucket Supabase private dan hanya dapat diakses melalui link berdurasi 15 menit (*Signed URL*).
- [x] **Anti-Replay QR**: Token QR sesi kehadiran dikonsumsi satu kali per siswa untuk mencegah kecurangan scan ulang.
