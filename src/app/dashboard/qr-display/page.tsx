"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Clock,
  Users,
  RefreshCw,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  School
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getStoredAuth } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { createQRSesiAction, deactivateQRSesiAction } from "@/app/actions/absensiActions";
import { getJakartaDateString } from "@/lib/dateUtils";
import { JenisAbsensi, QRSesi, AbsensiRecord, AuthSession } from "@/lib/types";
import { APP_CONFIG } from "@/lib/env";

export default function DashboardQRDisplayPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [jenis, setJenis] = useState<JenisAbsensi>("kehadiran_kelas");
  const [activeSession, setActiveSession] = useState<QRSesi | null>(null);
  const [records, setRecords] = useState<AbsensiRecord[]>([]);

  const loadData = async () => {
    const todayStr = getJakartaDateString();
    const [{ data: dbSession }, { data: dbRecords }] = await Promise.all([
      supabase
        .from('qr_sessions')
        .select('*')
        .eq('jenis', jenis)
        .eq('tanggal', todayStr)
        .eq('is_active', true)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('absensi_records')
        .select('*, siswa (*)')
        .eq('tanggal', todayStr)
        .eq('jenis', jenis)
    ]);

    if (dbSession) {
      setActiveSession({
        id: dbSession.id,
        jenis: dbSession.jenis as JenisAbsensi,
        token: dbSession.token,
        qrUrl: dbSession.qr_url,
        tanggal: dbSession.tanggal,
        waktuMulai: dbSession.waktu_mulai,
        waktuBerakhir: dbSession.waktu_berakhir,
        adminId: dbSession.admin_id || 1,
        adminName: dbSession.admin_name,
        durationMinutes: dbSession.duration_minutes,
        isActive: dbSession.is_active,
        createdAt: dbSession.created_at,
      });
    } else {
      setActiveSession(null);
    }

    if (dbRecords) {
      setRecords(dbRecords.map((r: any) => ({
        id: r.id,
        siswaId: r.siswa_id,
        siswa: {
          id: r.siswa_id,
          nis: r.siswa?.nisn || '',
          nama: r.siswa?.nama || `Siswa #${r.siswa_id}`,
          nomorAbsen: r.siswa?.nomor_absen || 0,
          gender: (r.siswa?.gender || 'L') as 'L' | 'P',
        },
        qrSesiId: r.qr_sesi_id,
        jenis: r.jenis,
        tanggal: r.tanggal,
        waktuAbsen: r.waktu_absen,
        status: r.status,
        fotoUrl: r.foto_storage_path,
        timestampServer: r.created_at || r.waktu_absen,
      })));
    }
  };

  useEffect(() => {
    setAuth(getStoredAuth());
    loadData();

    const channel = supabase
      .channel('realtime_qr_display_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qr_sessions' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absensi_records' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jenis]);

  const handleStartSession = async (duration: number = jenis === "kehadiran_kelas" ? 45 : 60) => {
    const res = await createQRSesiAction({
      jenis,
      durationMinutes: duration,
      adminId: auth?.admin?.id || auth?.user.id || 1,
      adminName: auth?.admin?.nama || auth?.user.nama || "Admin",
    });
    if (res.success && res.session) {
      loadData();
    }
  };

  const today = getJakartaDateString();
  const todayRecords = records.filter(
    (r) => r.jenis === jenis && r.tanggal === today
  );
  const pendingCount = todayRecords.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Mode Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setJenis("kehadiran_kelas")}
          className={`p-4 rounded-3xl brutal-border-thick brutal-shadow transition-all flex items-center justify-between text-left ${
            jenis === "kehadiran_kelas"
              ? "bg-[#FF6FA5] text-[#181818] scale-[1.02]"
              : "bg-white text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">
              Sesi Pagi (06.30–07.45)
            </span>
            <span className="text-lg sm:text-xl font-black font-fredoka">
              Kehadiran Masuk Kelas
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center brutal-border-2">
            <School className="w-6 h-6 text-[#181818]" />
          </div>
        </button>

        <button
          onClick={() => setJenis("sholat_dzuhur")}
          className={`p-4 rounded-3xl brutal-border-thick brutal-shadow transition-all flex items-center justify-between text-left ${
            jenis === "sholat_dzuhur"
              ? "bg-[#6FCB6F] text-[#181818] scale-[1.02]"
              : "bg-white text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">
              Sesi Siang (12.00–13.00)
            </span>
            <span className="text-lg sm:text-xl font-black font-fredoka">
              Kehadiran Sholat Dzuhur
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center brutal-border-2">
            <Clock className="w-6 h-6 text-[#181818]" />
          </div>
        </button>
      </div>

      {/* Sholat Notification */}
      {jenis === "sholat_dzuhur" && (
        <div className="bg-[#FFD400] p-4 rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center gap-3 text-xs sm:text-sm font-bold text-[#181818]">
          <AlertCircle className="w-5 h-5 text-[#181818] shrink-0" />
          <span>
            <strong>Jadwal Sholat Dzuhur:</strong> QR dibagikan di mushola/masjid sekolah pada jam istirahat kedua ({APP_CONFIG.sholatTimeRange.label}) wajib untuk seluruh 46 siswa.
          </span>
        </div>
      )}

      {/* Main Grid: Big QR + Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-[36px] brutal-border-thick brutal-shadow-xl flex flex-col items-center justify-between text-center space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant={jenis === "kehadiran_kelas" ? "pink" : "green"} size="lg">
              {jenis === "kehadiran_kelas" ? "SESI KEHADIRAN KELAS" : "SESI SHOLAT DZUHUR"}
            </Badge>
            <Badge variant="yellow" size="md">
              TOKEN DINAMIS AKTIF
            </Badge>
          </div>

          {!activeSession ? (
            <div className="p-8 bg-[#FFD400] rounded-3xl brutal-border-thick brutal-shadow-lg max-w-sm w-full space-y-4 text-center">
              <QrCode className="w-16 h-16 mx-auto text-[#181818]" />
              <div>
                <h4 className="text-xl font-black font-fredoka text-[#181818]">Sesi Belum Aktif</h4>
                <p className="text-xs font-bold text-[#181818]/80 mt-1">
                  Mulai sesi baru untuk memproyeksikan QR Code presensi.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleStartSession(jenis === "kehadiran_kelas" ? 45 : 60)}
                className="w-full justify-center gap-2"
              >
                <span>Buka Sesi QR ({jenis === "kehadiran_kelas" ? "45 Menit" : "60 Menit"})</span>
              </Button>
            </div>
          ) : (
            <>
              <div className="p-6 sm:p-8 bg-[#FFD400] rounded-3xl brutal-border-thick brutal-shadow-lg relative">
                <div className="bg-white p-4 sm:p-6 rounded-2xl brutal-border-2">
                  <QRCodeSVG
                    value={activeSession.qrUrl || `https://absensi.xipplg1.sch.id/scan?token=${activeSession.token}`}
                    size={230}
                    level="H"
                    includeMargin={true}
                    className="mx-auto max-w-full h-auto"
                  />
                </div>
                <div className="mt-3 bg-[#181818] text-[#FFD400] px-4 py-1.5 rounded-xl font-mono font-black text-sm tracking-widest uppercase">
                  {activeSession.token}
                </div>
              </div>

              <div className="space-y-3 w-full">
                <p className="text-xs sm:text-sm font-bold text-neutral-600">
                  Arahkan layar proyektor ini ke depan kelas agar siswa dapat melakukan scan live camera.
                </p>
                <Button
                  variant="yellow"
                  size="md"
                  onClick={() => handleStartSession(jenis === "kehadiran_kelas" ? 45 : 60)}
                  className="gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                  <span>Generate Ulang Token</span>
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Live Attendee List */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-[36px] brutal-border-thick brutal-shadow-xl flex flex-col justify-between space-y-4">
          <div className="pb-4 border-b-3 border-[#181818] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[#3355FF] stroke-[2.5]" />
              <h3 className="text-lg font-black font-fredoka text-[#181818]">
                Siswa Terabsen
              </h3>
            </div>
            <span className="text-xs font-black bg-[#FF6FA5] px-2.5 py-1 rounded-xl brutal-border-2">
              {todayRecords.length} / 46 Siswa
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-black text-neutral-700">
              <span>Progress Kehadiran</span>
              <span>{Math.round((todayRecords.length / 46) * 100)}%</span>
            </div>
            <div className="w-full h-3.5 bg-neutral-200 rounded-full brutal-border-2 overflow-hidden">
              <div
                className="h-full bg-[#6FCB6F] transition-all duration-500"
                style={{ width: `${(todayRecords.length / 46) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1">
            {todayRecords.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300 space-y-1">
                <p className="text-xs font-bold text-neutral-500">Belum ada siswa yang scan sesi ini.</p>
              </div>
            ) : (
              todayRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-[#F8F8F5] rounded-2xl brutal-border-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#3355FF] text-white font-black text-xs flex items-center justify-center brutal-border-2">
                      #{rec.siswa.nomorAbsen}
                    </div>
                    <div>
                      <p className="text-xs font-black text-[#181818]">{rec.siswa.nama}</p>
                      <p className="text-[10px] font-bold text-neutral-500 font-mono">
                        {new Date(rec.waktuAbsen).toLocaleTimeString("id-ID")} WIB
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={rec.status === "verified" ? "verified" : rec.status === "pending" ? "pending" : "rejected"}
                    size="sm"
                  >
                    {rec.status}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t-2 border-neutral-200">
            <a
              href="/dashboard/verifikasi"
              className="w-full py-2.5 bg-[#FFD400] text-[#181818] font-black text-xs rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center justify-center gap-2 hover:bg-yellow-400"
            >
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
              Verifikasi Foto ({pendingCount} Pending)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
