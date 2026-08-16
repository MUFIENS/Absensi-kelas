export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      absensi_records: {
        Row: {
          alasan_penolakan: string | null;
          created_at: string;
          diverifikasi_oleh: string | null;
          foto_storage_path: string;
          id: number;
          jenis: string;
          qr_sesi_id: number | null;
          siswa_id: number;
          status: string;
          tanggal: string;
          waktu_absen: string;
          waktu_verifikasi: string | null;
        };
        Insert: {
          alasan_penolakan?: string | null;
          created_at?: string;
          diverifikasi_oleh?: string | null;
          foto_storage_path: string;
          id?: never;
          jenis: string;
          qr_sesi_id?: number | null;
          siswa_id: number;
          status?: string;
          tanggal?: string;
          waktu_absen?: string;
          waktu_verifikasi?: string | null;
        };
        Update: {
          alasan_penolakan?: string | null;
          created_at?: string;
          diverifikasi_oleh?: string | null;
          foto_storage_path?: string;
          id?: never;
          jenis?: string;
          qr_sesi_id?: number | null;
          siswa_id?: number;
          status?: string;
          tanggal?: string;
          waktu_absen?: string;
          waktu_verifikasi?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "absensi_records_qr_sesi_id_fkey";
            columns: ["qr_sesi_id"];
            isOneToOne: false;
            referencedRelation: "qr_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "absensi_records_siswa_id_fkey";
            columns: ["siswa_id"];
            isOneToOne: false;
            referencedRelation: "siswa";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_users: {
        Row: {
          created_at: string;
          id: number;
          nama: string;
          password_hash: string;
          role: string;
          username: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          nama: string;
          password_hash: string;
          role: string;
          username: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          nama?: string;
          password_hash?: string;
          role?: string;
          username?: string;
        };
        Relationships: [];
      };
      consumed_qr_tokens: {
        Row: {
          consumed_at: string;
          id: number;
          siswa_id: number;
          token: string;
        };
        Insert: {
          consumed_at?: string;
          id?: never;
          siswa_id: number;
          token: string;
        };
        Update: {
          consumed_at?: string;
          id?: never;
          siswa_id?: number;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consumed_qr_tokens_siswa_id_fkey";
            columns: ["siswa_id"];
            isOneToOne: false;
            referencedRelation: "siswa";
            referencedColumns: ["id"];
          }
        ];
      };
      izin_records: {
        Row: {
          alasan_penolakan: string | null;
          created_at: string;
          diverifikasi_oleh: string | null;
          id: number;
          jenis: string;
          keterangan: string;
          siswa_id: number;
          status: string;
          surat_storage_path: string;
          tanggal: string;
          waktu_pengajuan: string;
          waktu_verifikasi: string | null;
        };
        Insert: {
          alasan_penolakan?: string | null;
          created_at?: string;
          diverifikasi_oleh?: string | null;
          id?: never;
          jenis: string;
          keterangan: string;
          siswa_id: number;
          status?: string;
          surat_storage_path: string;
          tanggal: string;
          waktu_pengajuan?: string;
          waktu_verifikasi?: string | null;
        };
        Update: {
          alasan_penolakan?: string | null;
          created_at?: string;
          diverifikasi_oleh?: string | null;
          id?: never;
          jenis?: string;
          keterangan?: string;
          siswa_id?: number;
          status?: string;
          surat_storage_path?: string;
          tanggal?: string;
          waktu_pengajuan?: string;
          waktu_verifikasi?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "izin_records_siswa_id_fkey";
            columns: ["siswa_id"];
            isOneToOne: false;
            referencedRelation: "siswa";
            referencedColumns: ["id"];
          }
        ];
      };
      qr_sessions: {
        Row: {
          admin_id: number | null;
          admin_name: string;
          created_at: string;
          duration_minutes: number;
          id: number;
          is_active: boolean;
          jenis: string;
          qr_url: string;
          tanggal: string;
          token: string;
          waktu_berakhir: string;
          waktu_mulai: string;
        };
        Insert: {
          admin_id?: number | null;
          admin_name: string;
          created_at?: string;
          duration_minutes?: number;
          id?: never;
          is_active?: boolean;
          jenis: string;
          qr_url: string;
          tanggal?: string;
          token: string;
          waktu_berakhir: string;
          waktu_mulai: string;
        };
        Update: {
          admin_id?: number | null;
          admin_name?: string;
          created_at?: string;
          duration_minutes?: number;
          id?: never;
          is_active?: boolean;
          jenis?: string;
          qr_url?: string;
          tanggal?: string;
          token?: string;
          waktu_berakhir?: string;
          waktu_mulai?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_sessions_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          }
        ];
      };
      siswa: {
        Row: {
          created_at: string;
          gender: string;
          id: number;
          nama: string;
          nisn: string;
          nomor_absen: number;
          pin_hash: string | null;
        };
        Insert: {
          created_at?: string;
          gender: string;
          id?: never;
          nama: string;
          nisn: string;
          nomor_absen: number;
          pin_hash?: string | null;
        };
        Update: {
          created_at?: string;
          gender?: string;
          id?: never;
          nama?: string;
          nisn?: string;
          nomor_absen?: number;
          pin_hash?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
