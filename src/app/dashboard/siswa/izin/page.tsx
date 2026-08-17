"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Camera,
  ArrowLeft,
  Sparkles,
  Info
} from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
import { getStoredAuth } from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { submitIzinAction, getSignedMediaUrlAction } from "@/app/actions/absensiActions";
import { getJakartaDateString } from "@/lib/dateUtils";
import { compressImage } from "@/lib/imageUtils";
import { AuthSession, IzinRecord, KategoriIzin } from "@/lib/types";

export default function SiswaIzinPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [izinList, setIzinList] = useState<IzinRecord[]>([]);

  // Form states
  const [kategori, setKategori] = useState<KategoriIzin>("Sakit");
  const [tanggal, setTanggal] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");
  const [suratFoto, setSuratFoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Modal preview surat
  const [selectedIzin, setSelectedIzin] = useState<IzinRecord | null>(null);
  const [signedPreviewUrl, setSignedPreviewUrl] = useState<string>("");

  // File input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const studentId = auth && auth.role === "siswa" ? auth.user.id : 0;

  const loadData = async (currentStudentId?: number) => {
    const sid = currentStudentId !== undefined ? currentStudentId : studentId;
    if (!sid) return;

    const { data: dbRecords } = await supabase
      .from('izin_records')
      .select('*, siswa (*)')
      .eq('siswa_id', sid)
      .order('waktu_pengajuan', { ascending: false });

    if (dbRecords) {
      const mapped: IzinRecord[] = dbRecords.map((r: any) => ({
        id: r.id,
        siswaId: r.siswa_id,
        siswa: {
          id: r.siswa_id,
          nis: r.siswa?.nisn || '',
          nama: r.siswa?.nama || auth?.user.nama || `Siswa #${r.siswa_id}`,
          nomorAbsen: r.siswa?.nomor_absen || 0,
          gender: (r.siswa?.gender || 'L') as 'L' | 'P',
        },
        jenis: r.jenis as KategoriIzin,
        tanggal: r.tanggal,
        keterangan: r.keterangan,
        suratFotoUrl: r.surat_storage_path,
        status: r.status as 'pending' | 'verified' | 'rejected',
        waktuPengajuan: r.waktu_pengajuan,
        diverifikasiOleh: r.diverifikasi_oleh,
        waktuVerifikasi: r.waktu_verifikasi,
        alasanPenolakan: r.alasan_penolakan,
      }));
      setIzinList(mapped);
    }
  };

  useEffect(() => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);
    setTanggal(getJakartaDateString());
    if (currentAuth && currentAuth.role === "siswa") {
      loadData(currentAuth.user.id);
    }

    // Realtime channel
    const channel = supabase
      .channel('realtime_siswa_izin_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'izin_records' }, () => {
        if (currentAuth && currentAuth.role === "siswa") {
          loadData(currentAuth.user.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenPreview = async (izin: IzinRecord) => {
    setSelectedIzin(izin);
    if (izin.suratFotoUrl) {
      if (izin.suratFotoUrl.startsWith("data:") || izin.suratFotoUrl.startsWith("http")) {
        setSignedPreviewUrl(izin.suratFotoUrl);
      } else {
        const res = await getSignedMediaUrlAction('surat-izin', izin.suratFotoUrl);
        setSignedPreviewUrl(res.success ? res.url : '');
      }
    } else {
      setSignedPreviewUrl('');
    }
  };

  const myIzinRecords = izinList;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPG, PNG, atau scan dokumen).");
      return;
    }

    try {
      // Auto compress large camera/gallery photo to ~100-200KB
      const compressedDataUrl = await compressImage(file, 1024, 1024, 0.7);
      setSuratFoto(compressedDataUrl);
      setErrorMsg("");
    } catch {
      setErrorMsg("Gagal memproses file foto.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!studentId) {
      setErrorMsg("Sesi siswa Anda tidak valid. Silakan login kembali.");
      return;
    }
    if (!tanggal) {
      setErrorMsg("Pilih tanggal izin/sakit.");
      return;
    }
    if (!keterangan.trim()) {
      setErrorMsg("Isi alasan atau keterangan izin secara jelas.");
      return;
    }
    if (!suratFoto) {
      setErrorMsg("Harap lampirkan foto surat dokter / surat orang tua / surat tugas sebagai bukti sah.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitIzinAction({
        siswaId: studentId,
        jenis: kategori,
        tanggal,
        keterangan: keterangan.trim(),
        suratFotoDataUrl: suratFoto,
      });

      if (res.success) {
        setSuccessMsg(`Pengajuan ${kategori} berhasil dikirim dan menunggu verifikasi Sekretaris/Wali Kelas.`);
        setKeterangan("");
        setSuratFoto(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        loadData();
      } else {
        setErrorMsg(res.message || "Gagal mengirim pengajuan izin.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan / server saat menghubungkan database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <Link href="/dashboard/siswa" className="inline-block mb-2">
            <Button variant="white" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-3xl font-black font-fredoka text-[#181818]">
            Pengajuan Izin &amp; Sakit Online
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-600">
            Lagi berhalangan hadir? Jangan alpa ya, kirim surat keterangan di sini biar resmi dicatat pengurus kelas.
          </p>
        </div>

        <Badge variant="yellow" size="md" className="self-start sm:self-center gap-1.5 text-xs">
          <Sparkles className="w-4 h-4" />
          <span>Formulir Siswa</span>
        </Badge>
      </div>

      {/* Grid: Form (Left) & Riwayat Pengajuan (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Form Submission (7 Cols) */}
        <div className="lg:col-span-7">
          <Card variant="white" shadow="lg" borderWidth="thick" className="p-4 sm:p-7 space-y-4 sm:space-y-5">
            <div className="border-b-2 border-neutral-200 pb-3 flex items-center justify-between">
              <span className="font-fredoka font-black text-base sm:text-lg text-[#181818] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3355FF]" />
                Form Izin Tidak Masuk
              </span>
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-neutral-500">
                Wajib Foto Surat
              </span>
            </div>

            {/* Notification Messages */}
            {successMsg && (
              <div className="p-4 bg-green-50 rounded-2xl border-2 border-green-500 text-green-900 font-bold text-xs sm:text-sm flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-green-950">Surat Berhasil Dikirim!</p>
                  <p>{successMsg}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 rounded-2xl border-2 border-red-500 text-red-900 font-bold text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-red-950">Ada yang Kurang Nih</p>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kategori Izin Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#181818] block">
                  1. Pilih Kategori Izin
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setKategori("Sakit")}
                    className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                      kategori === "Sakit"
                        ? "bg-[#FF6FA5] text-[#181818] brutal-border-2 brutal-shadow-sm scale-[1.02]"
                        : "bg-[#F4F4F0] text-neutral-700 hover:bg-neutral-200 border-2 border-neutral-300"
                    }`}
                  >
                    <AppIcon name="doctor" className="w-4 h-4" />
                    <span>Sakit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKategori("Izin")}
                    className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                      kategori === "Izin"
                        ? "bg-[#FFD400] text-[#181818] brutal-border-2 brutal-shadow-sm scale-[1.02]"
                        : "bg-[#F4F4F0] text-neutral-700 hover:bg-neutral-200 border-2 border-neutral-300"
                    }`}
                  >
                    <AppIcon name="letter" className="w-4 h-4" />
                    <span>Izin Acara</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKategori("Dispensasi")}
                    className={`py-3 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                      kategori === "Dispensasi"
                        ? "bg-[#3355FF] text-white brutal-border-2 brutal-shadow-sm scale-[1.02]"
                        : "bg-[#F4F4F0] text-neutral-700 hover:bg-neutral-200 border-2 border-neutral-300"
                    }`}
                  >
                    <AppIcon name="trophy" className="w-4 h-4" />
                    <span>Dispen</span>
                  </button>
                </div>
              </div>

              {/* Tanggal Berhalangan Custom Calendar */}
              <DatePicker
                label="2. Tanggal Berhalangan"
                value={tanggal}
                onChange={(newDate) => setTanggal(newDate)}
                placeholder="Pilih tanggal izin atau sakit..."
                required
              />

              {/* Alasan / Keterangan */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#181818] block">
                  3. Alasan / Keterangan Jelas
                </label>
                <textarea
                  rows={3}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder={
                    kategori === "Sakit"
                      ? "Contoh: Badan meriang dan flu berat, istirahat atas petunjuk dokter..."
                      : kategori === "Izin"
                      ? "Contoh: Menghadiri acara pernikahan saudara di luar kota bersama keluarga..."
                      : "Contoh: Mengikuti pertandingan LKS Web Technologies mewakili SMKN 1 Ciomas..."
                  }
                  className="w-full rounded-2xl p-3.5 bg-white brutal-border-2 font-bold text-xs sm:text-sm text-[#181818] placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-[#3355FF]"
                  required
                />
              </div>

              {/* Lampiran Foto Surat */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-[#181818] block">
                  4. Foto Surat Bukti (Surat Dokter / Ortu / Surat Tugas)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {suratFoto ? (
                  <div className="relative rounded-2xl overflow-hidden brutal-border-2 bg-neutral-100 p-2 group">
                    <img
                      src={suratFoto}
                      alt="Preview Surat"
                      className="w-full max-h-48 object-contain rounded-xl bg-white"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge variant="green" size="sm">
                        Foto Surat Siap Diunggah
                      </Badge>
                      <button
                        type="button"
                        onClick={() => {
                          setSuratFoto(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-xs font-black text-red-600 hover:text-red-800 underline"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-3 border-dashed border-neutral-300 hover:border-[#3355FF] bg-neutral-50 hover:bg-blue-50/50 cursor-pointer text-center space-y-2 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white brutal-border-2 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 text-[#3355FF]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-[#181818]">
                        Jepret / Unggah Foto Surat Bukti
                      </p>
                      <p className="text-[11px] font-bold text-neutral-500">
                        Format JPG, PNG, atau scan dokumen (Maks. 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="lg"
                type="submit"
                disabled={isSubmitting}
                className="w-full justify-center gap-2 mt-4 text-sm sm:text-base font-black"
              >
                <span>{isSubmitting ? "Mengirim Surat..." : "Kirim Pengajuan Izin"}</span>
              </Button>
            </form>
          </Card>
        </div>

        {/* Riwayat Pengajuan Siswa (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card variant="yellow" shadow="md" borderWidth="thick" className="p-4 sm:p-5">
            <h3 className="font-fredoka font-black text-base sm:text-lg text-[#181818] mb-1">
              Petunjuk Pengajuan Izin
            </h3>
            <ul className="text-xs font-bold text-[#181818] space-y-1.5 list-disc list-inside">
              <li>Surat sakit harus mencantumkan cap / tanda tangan dokter atau klinik.</li>
              <li>Surat izin wajib ditandatangani oleh orang tua / wali murid.</li>
              <li>Pengajuan akan diverifikasi oleh Sekretaris Kelas & Wali Kelas.</li>
              <li>Izin yang disetujui otomatis tercatat pada rekap presensi bulanan.</li>
            </ul>
          </Card>

          <div className="bg-white p-5 rounded-3xl brutal-border-thick brutal-shadow space-y-3">
            <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-2">
              <h3 className="font-fredoka font-black text-base text-[#181818]">
                Riwayat Pengajuan Saya ({myIzinRecords.length})
              </h3>
            </div>

            {myIzinRecords.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-neutral-500">
                Belum ada riwayat pengajuan izin/sakit.
              </div>
            ) : (
              <div className="space-y-3">
                {myIzinRecords.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 border-2 border-neutral-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          item.jenis === "Sakit"
                            ? "pink"
                            : item.jenis === "Izin"
                            ? "yellow"
                            : "blue"
                        }
                        size="sm"
                        className="gap-1"
                      >
                        <AppIcon
                          name={
                            item.jenis === "Sakit"
                              ? "doctor"
                              : item.jenis === "Izin"
                              ? "letter"
                              : "trophy"
                          }
                          className="w-3 h-3"
                        />
                        <span>{item.jenis}</span>
                      </Badge>

                      <Badge
                        variant={
                          item.status === "verified"
                            ? "verified"
                            : item.status === "pending"
                            ? "pending"
                            : "rejected"
                        }
                        size="sm"
                        className="gap-1"
                      >
                        <AppIcon
                          name={
                            item.status === "verified"
                              ? "check"
                              : item.status === "pending"
                              ? "pending"
                              : "rejected"
                          }
                          className="w-3 h-3"
                        />
                        <span>
                          {item.status === "verified"
                            ? "Disetujui"
                            : item.status === "pending"
                            ? "Menunggu"
                            : "Ditolak"}
                        </span>
                      </Badge>
                    </div>

                    <p className="text-xs font-bold text-neutral-800 line-clamp-2">
                      {item.keterangan}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500 pt-1 border-t border-neutral-200">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.tanggal}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="text-[#3355FF] hover:underline flex items-center gap-1 font-black"
                      >
                        <Eye className="w-3 h-3" />
                        Lihat Surat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Preview Surat (Responsive Mobile) */}
      <Modal
        isOpen={!!selectedIzin}
        onClose={() => {
          setSelectedIzin(null);
          setSignedPreviewUrl('');
        }}
        title={`Surat ${selectedIzin?.jenis || "Izin"} - ${selectedIzin?.siswa.nama || ""}`}
        maxWidth="lg"
      >
        {selectedIzin && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  selectedIzin.jenis === "Sakit"
                    ? "pink"
                    : selectedIzin.jenis === "Izin"
                    ? "yellow"
                    : "blue"
                }
                size="md"
                className="gap-1.5"
              >
                <AppIcon
                  name={
                    selectedIzin.jenis === "Sakit"
                      ? "doctor"
                      : selectedIzin.jenis === "Izin"
                      ? "letter"
                      : "trophy"
                  }
                  className="w-3.5 h-3.5"
                />
                <span>Kategori: {selectedIzin.jenis}</span>
              </Badge>

              <Badge
                variant={
                  selectedIzin.status === "verified"
                    ? "verified"
                    : selectedIzin.status === "pending"
                    ? "pending"
                    : "rejected"
                }
                size="md"
              >
                Status: {selectedIzin.status === "verified" ? "Disetujui" : selectedIzin.status === "pending" ? "Menunggu Verifikasi" : "Ditolak"}
              </Badge>
            </div>

            <div className="p-3 bg-neutral-100 rounded-2xl brutal-border-2 max-h-[55vh] overflow-y-auto flex items-center justify-center">
              {signedPreviewUrl ? (
                <img
                  src={signedPreviewUrl}
                  alt="Foto Dokumen Surat"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                />
              ) : (
                <p className="text-xs font-bold text-neutral-500 py-6">Memuat gambar surat dokter / keterangan...</p>
              )}
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border-2 border-neutral-200 text-xs font-bold space-y-1">
              <p className="text-neutral-500">Keterangan / Alasan:</p>
              <p className="text-neutral-900 text-sm font-black">{selectedIzin.keterangan}</p>
              {selectedIzin.diverifikasiOleh && (
                <p className="text-neutral-600 text-[11px] pt-1">
                  Diverifikasi oleh: {selectedIzin.diverifikasiOleh}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
