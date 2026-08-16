-- ==============================================================================
-- SKEMA BASIS DATA POSTGRESQL SUPABASE — ABSENSI KELAS XI PPLG 1 SMKN 1 CIOMAS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Siswa
CREATE TABLE IF NOT EXISTS public.siswa (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nisn VARCHAR(10) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    nomor_absen INTEGER NOT NULL,
    gender VARCHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    pin_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabel Admin & Pengurus
CREATE TABLE IF NOT EXISTS public.admin_users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'wali_kelas')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabel Sesi QR
CREATE TABLE IF NOT EXISTS public.qr_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    jenis VARCHAR(30) NOT NULL CHECK (jenis IN ('kehadiran_kelas', 'sholat_dzuhur')),
    token VARCHAR(100) UNIQUE NOT NULL,
    qr_url TEXT NOT NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu_mulai TIMESTAMPTZ NOT NULL,
    waktu_berakhir TIMESTAMPTZ NOT NULL,
    admin_id BIGINT REFERENCES public.admin_users(id) ON DELETE SET NULL,
    admin_name VARCHAR(255) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabel Riwayat Absensi
CREATE TABLE IF NOT EXISTS public.absensi_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    siswa_id BIGINT NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    qr_sesi_id BIGINT REFERENCES public.qr_sessions(id) ON DELETE SET NULL,
    jenis VARCHAR(30) NOT NULL CHECK (jenis IN ('kehadiran_kelas', 'sholat_dzuhur')),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    waktu_absen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    foto_storage_path TEXT NOT NULL,
    diverifikasi_oleh VARCHAR(255),
    waktu_verifikasi TIMESTAMPTZ,
    alasan_penolakan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_absensi_siswa_jenis_tanggal UNIQUE (siswa_id, jenis, tanggal)
);

-- 5. Tabel Permohonan Izin / Sakit
CREATE TABLE IF NOT EXISTS public.izin_records (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    siswa_id BIGINT NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('Sakit', 'Izin', 'Dispensasi')),
    tanggal DATE NOT NULL,
    keterangan TEXT NOT NULL,
    surat_storage_path TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    waktu_pengajuan TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    diverifikasi_oleh VARCHAR(255),
    waktu_verifikasi TIMESTAMPTZ,
    alasan_penolakan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabel Token QR yang Sudah Dikonsumsi (Anti-Replay Protection)
CREATE TABLE IF NOT EXISTS public.consumed_qr_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token VARCHAR(100) NOT NULL,
    siswa_id BIGINT NOT NULL REFERENCES public.siswa(id) ON DELETE CASCADE,
    consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_consumed_token_siswa UNIQUE (token, siswa_id)
);

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_absensi_tanggal_jenis ON public.absensi_records (tanggal, jenis);
CREATE INDEX IF NOT EXISTS idx_absensi_siswa_id ON public.absensi_records (siswa_id);
CREATE INDEX IF NOT EXISTS idx_izin_tanggal ON public.izin_records (tanggal);
CREATE INDEX IF NOT EXISTS idx_qr_sessions_active ON public.qr_sessions (is_active, tanggal);

-- Row Level Security (RLS)
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absensi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.izin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumed_qr_tokens ENABLE ROW LEVEL SECURITY;

-- Read policies for Anon / Client (SELECT only)
DROP POLICY IF EXISTS "Allow public select on siswa" ON public.siswa;
CREATE POLICY "Allow public select on siswa" ON public.siswa FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select on qr_sessions" ON public.qr_sessions;
CREATE POLICY "Allow public select on qr_sessions" ON public.qr_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select on absensi_records" ON public.absensi_records;
CREATE POLICY "Allow public select on absensi_records" ON public.absensi_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select on izin_records" ON public.izin_records;
CREATE POLICY "Allow public select on izin_records" ON public.izin_records FOR SELECT USING (true);

-- Catatan Keamanan: Tabel admin_users TIDAK memiliki policy public SELECT
-- Akses baca/tulis hanya boleh dilakukan melalui Server Actions (SUPABASE_SERVICE_ROLE_KEY)

-- Private Storage Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('absensi-selfies', 'absensi-selfies', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('surat-izin', 'surat-izin', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.qr_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.absensi_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.izin_records;
