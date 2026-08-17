"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowLeft,
  Calendar,
  Eye,
  Check,
  X,
  UploadCloud,
  Sparkles
} from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Dropdown } from "@/components/ui/Dropdown";
import { Dialog } from "@/components/ui/Dialog";
import {
  getStoredAuth
} from "@/lib/store";
import { supabase } from "@/lib/supabaseClient";
import { submitIzinAction, verifyIzinAction, getSignedMediaUrlAction } from "@/app/actions/absensiActions";
import { compressImage } from "@/lib/imageUtils";
import { Siswa, IzinRecord, KategoriIzin, AuthSession } from "@/lib/types";

export default function SekretarisIzinPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [izinList, setIzinList] = useState<IzinRecord[]>([]);
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);

  // Manual Input State
  const [selectedSiswaId, setSelectedSiswaId] = useState<string>("1");
  const [jenisIzin, setJenisIzin] = useState<KategoriIzin>("Sakit");
  const [keterangan, setKeterangan] = useState<string>("");
  const [suratFoto, setSuratFoto] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal Preview Surat
  const [selectedPreview, setSelectedPreview] = useState<IzinRecord | null>(null);
  const [signedSuratUrl, setSignedSuratUrl] = useState<string>("");
  const [rejectModalItem, setRejectModalItem] = useState<IzinRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    // 1. Fetch Siswa
    const { data: dbSiswa } = await supabase
      .from('siswa')
      .select('*')
      .order('nomor_absen', { ascending: true });

    if (dbSiswa && dbSiswa.length > 0) {
      const mappedSiswa: Siswa[] = dbSiswa.map((s: any) => ({
        id: s.id,
        nis: s.nisn,
        nama: s.nama,
        gender: s.gender as 'L' | 'P',
        nomorAbsen: s.nomor_absen,
        kelas: s.kelas,
      }));
      setSiswaList(mappedSiswa);
      if (!selectedSiswaId || selectedSiswaId === "1") {
        setSelectedSiswaId(String(mappedSiswa[0].id));
      }
    }

    // 2. Fetch Izin Records
    const { data: dbIzin } = await supabase
      .from('izin_records')
      .select('*, siswa (*)')
      .order('waktu_pengajuan', { ascending: false });

    if (dbIzin) {
      const mappedIzin: IzinRecord[] = dbIzin.map((r: any) => ({
        id: r.id,
        siswaId: r.siswa_id,
        siswa: {
          id: r.siswa_id,
          nis: r.siswa?.nisn || '',
          nama: r.siswa?.nama || `Siswa #${r.siswa_id}`,
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
      setIzinList(mappedIzin);
    }
  };

  useEffect(() => {
    setAuth(getStoredAuth());
    loadData();

    // Supabase Realtime Subscription untuk izin
    const channel = supabase
      .channel('realtime_sekretaris_izin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'izin_records',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOpenPreview = async (item: IzinRecord) => {
    setSelectedPreview(item);
    if (item.suratFotoUrl) {
      if (item.suratFotoUrl.startsWith('data:') || item.suratFotoUrl.startsWith('http')) {
        setSignedSuratUrl(item.suratFotoUrl);
      } else {
        const res = await getSignedMediaUrlAction('surat-izin', item.suratFotoUrl);
        setSignedSuratUrl(res.success ? res.url : '');
      }
    } else {
      setSignedSuratUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPG, PNG, atau scan dokumen).");
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file, 1024, 1024, 0.7);
      setSuratFoto(compressedDataUrl);
      setErrorMsg("");
    } catch {
      setErrorMsg("Gagal memproses file foto.");
    }
  };

  const handleAddIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    const siswaId = parseInt(selectedSiswaId);
    if (!siswaId) {
      setErrorMsg("Pilih siswa terlebih dahulu.");
      return;
    }

    if (!keterangan.trim()) {
      setErrorMsg("Harap isi alasan/keterangan izin.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await submitIzinAction({
        siswaId,
        jenis: jenisIzin,
        tanggal: new Date().toLocaleDateString("en-CA"),
        keterangan: keterangan.trim(),
        suratFotoDataUrl: suratFoto || undefined,
      });

      if (res.success && res.recordId) {
        // Auto-verify if entered by Sekretaris
        const verifier = auth?.admin?.nama || auth?.user?.nama || "Sekretaris Kelas";
        await verifyIzinAction({
          recordId: res.recordId,
          status: "verified",
          verifierName: verifier,
        });

        setKeterangan("");
        setSuratFoto(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMsg(`Catatan ${jenisIzin} berhasil dicatat & diverifikasi!`);
        setTimeout(() => setSuccessMsg(""), 3000);
        await loadData();
      } else {
        setErrorMsg(res.message || "Gagal mencatat izin.");
      }
    } catch {
      setErrorMsg("Terjadi kendala koneksi server saat mencatat izin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (id: number, status: "verified" | "rejected", reason?: string) => {
    const verifier = auth?.admin?.nama || auth?.user?.nama || "Sekretaris Kelas";
    await verifyIzinAction({
      recordId: id,
      status,
      verifierName: verifier,
      alasan: reason,
    });
    setSelectedPreview(null);
    setSignedSuratUrl('');
    setRejectModalItem(null);
    setRejectReason("");
    await loadData();
  };

  const pendingIzins = izinList.filter((i) => i.status === "pending");
  const processedIzins = izinList.filter((i) => i.status !== "pending");

  const siswaOptions = siswaList.map((s) => ({
    value: String(s.id),
    label: `#${s.nomorAbsen} - ${s.nama}`,
    subLabel: `NISN: ${s.nis} (${s.gender === "L" ? "L" : "P"})`
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <Link href="/dashboard/sekretaris" className="inline-block mb-2">
            <Button variant="white" size="sm" className="gap-1.5 text-xs">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-3xl font-black font-fredoka text-[#181818]">
            Verifikasi & Catatan Surat Izin
          </h1>
          <p className="text-xs sm:text-sm font-bold text-neutral-600">
            Periksa pengajuan surat dokter / izin dari siswa serta catat izin fisik di kelas.
          </p>
        </div>

        <Badge variant="pink" size="md" className="self-start sm:self-center gap-1.5 text-xs">
          <Sparkles className="w-4 h-4" />
          <span>{pendingIzins.length} Menunggu Verifikasi</span>
        </Badge>
      </div>

      {/* Grid: Pending Submissions & Manual Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left: Pending Submissions List (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 sm:p-6 rounded-[28px] brutal-border-thick brutal-shadow space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-200 pb-3">
              <h3 className="font-fredoka font-black text-base sm:text-lg text-[#181818] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#3355FF]" />
                Pengajuan Surat Masuk ({pendingIzins.length})
              </h3>
              <Badge variant="yellow" size="sm">
                Perlu Ditinjau
              </Badge>
            </div>

            {pendingIzins.length === 0 ? (
              <div className="p-6 sm:p-8 text-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300 text-xs font-bold text-neutral-500">
                Tidak ada surat pengajuan izin yang pending saat ini.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingIzins.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#3355FF] text-white font-black text-xs flex items-center justify-center brutal-border-2 shrink-0">
                          #{item.siswa.nomorAbsen}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-black text-[#181818] truncate max-w-[150px] sm:max-w-none">{item.siswa.nama}</p>
                          <p className="text-[10px] sm:text-[11px] font-bold text-neutral-600">
                            NISN: {item.siswa.nis} • {item.tanggal}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant={
                          item.jenis === "Sakit"
                            ? "pink"
                            : item.jenis === "Izin"
                            ? "yellow"
                            : "blue"
                        }
                        size="sm"
                        className="gap-1 text-[10px] sm:text-xs py-0.5 px-2"
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
                    </div>

                    <p className="text-xs font-bold text-neutral-800 bg-white p-2.5 rounded-xl border border-neutral-200">
                      &ldquo;{item.keterangan}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200">
                      <Button
                        variant="white"
                        size="sm"
                        onClick={() => handleOpenPreview(item)}
                        className="gap-1 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Dokumen</span>
                      </Button>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Button
                          variant="pink"
                          size="sm"
                          onClick={() => setRejectModalItem(item)}
                          className="gap-1 text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </Button>

                        <Button
                          variant="green"
                          size="sm"
                          onClick={() => handleVerify(item.id, "verified")}
                          className="gap-1 text-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processed History */}
          <div className="bg-white p-4 sm:p-6 rounded-[28px] brutal-border-thick brutal-shadow space-y-3">
            <h3 className="font-fredoka font-black text-sm sm:text-base text-[#181818] border-b border-neutral-200 pb-2">
              Riwayat Surat Terverifikasi ({processedIzins.length})
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {processedIzins.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 sm:p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-black text-[#181818] truncate">
                      {item.siswa.nama} ({item.jenis})
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-bold text-neutral-500 truncate">
                      {item.tanggal} • {item.keterangan}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant={item.status === "verified" ? "verified" : "rejected"}
                      size="sm"
                    >
                      {item.status === "verified" ? "Sah" : "Ditolak"}
                    </Badge>
                    {item.suratFotoUrl && (
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(item)}
                        className="p-1 hover:bg-neutral-200 rounded-lg text-[#3355FF]"
                        title="Lihat Surat"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Quick Add Izin Manually (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card variant="yellow" shadow="md" className="p-4 sm:p-6 space-y-4">
            <div className="border-b-2 border-[#181818] pb-3">
              <h3 className="font-fredoka font-black text-base sm:text-lg text-[#181818] flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Catat Izin Kelas Fisik
              </h3>
              <p className="text-xs font-bold text-neutral-700">
                Gunakan form ini jika siswa menitipkan surat fisik langsung di kelas.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-100 text-red-900 border-2 border-red-500 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-100 text-green-900 border-2 border-green-500 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddIzin} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-neutral-700 block">
                  Pilih Siswa:
                </label>
                <Dropdown
                  options={siswaOptions}
                  value={selectedSiswaId}
                  onChange={(val) => setSelectedSiswaId(String(val))}
                  placeholder="Pilih nama siswa..."
                  searchable
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-neutral-700 block">
                  Jenis Izin:
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {(["Sakit", "Izin", "Dispensasi"] as KategoriIzin[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setJenisIzin(k)}
                      className={`py-2 px-1 rounded-xl font-black text-[11px] sm:text-xs border-2 transition-all text-center truncate ${
                        jenisIzin === k
                          ? "bg-[#181818] text-[#FFD400] border-[#181818] shadow-[2px_2px_0px_#181818]"
                          : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-neutral-700 block">
                  Alasan / Keterangan:
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Sakit demam berobat ke klinik"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="bg-white text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-neutral-700 block">
                  Lampirkan Foto Surat (Opsional):
                </label>
                <div className="max-w-full overflow-hidden bg-white/70 p-2 rounded-2xl brutal-border-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="w-full text-[11px] sm:text-xs font-bold text-neutral-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-2 file:border-[#181818] file:bg-[#FF6FA5] file:font-black file:text-[11px] sm:file:text-xs file:text-[#181818] file:cursor-pointer cursor-pointer"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full justify-center gap-2 text-xs sm:text-sm font-black"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? "Menyimpan..." : "Simpan Keterangan Izin"}</span>
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Modal Preview Dokumen Surat (Responsive) */}
      <Modal
        isOpen={!!selectedPreview}
        onClose={() => {
          setSelectedPreview(null);
          setSignedSuratUrl('');
        }}
        title={`Dokumen ${selectedPreview?.jenis || "Surat"} - ${selectedPreview?.siswa.nama || ""}`}
        maxWidth="lg"
      >
        {selectedPreview && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="blue" size="md">
                {selectedPreview.siswa.nama} (#{selectedPreview.siswa.nomorAbsen})
              </Badge>
              <Badge variant="yellow" size="md">
                Kategori: {selectedPreview.jenis}
              </Badge>
            </div>

            <div className="p-3 bg-neutral-100 rounded-2xl brutal-border-2 max-h-[50vh] overflow-y-auto flex items-center justify-center">
              {signedSuratUrl ? (
                <img
                  src={signedSuratUrl}
                  alt="Foto Surat Bukti"
                  className="max-w-full max-h-full object-contain rounded-xl shadow-sm"
                />
              ) : (
                <p className="text-xs font-bold text-neutral-400 py-6">Memuat lampiran surat...</p>
              )}
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border-2 border-neutral-200 text-xs font-bold space-y-1">
              <p className="text-neutral-500">Alasan / Keterangan:</p>
              <p className="text-neutral-900 text-sm font-black">{selectedPreview.keterangan}</p>
            </div>

            {selectedPreview.status === "pending" && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="pink"
                  size="md"
                  onClick={() => {
                    setRejectModalItem(selectedPreview);
                    setSelectedPreview(null);
                  }}
                  className="w-1/2 justify-center"
                >
                  Tolak Surat
                </Button>
                <Button
                  variant="green"
                  size="md"
                  onClick={() => handleVerify(selectedPreview.id, "verified")}
                  className="w-1/2 justify-center"
                >
                  Setujui Sah
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Alasan Penolakan */}
      <Modal
        isOpen={!!rejectModalItem}
        onClose={() => setRejectModalItem(null)}
        title="Tolak Pengajuan Surat Izin"
        maxWidth="sm"
      >
        {rejectModalItem && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-neutral-700">
              Berikan catatan penolakan kepada <strong>{rejectModalItem.siswa.nama}</strong>:
            </p>
            <Input
              placeholder="Contoh: Foto surat blur / tidak bertandatangan dokter"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-white text-xs font-bold"
            />
            <div className="flex gap-2">
              <Button
                variant="white"
                size="sm"
                onClick={() => setRejectModalItem(null)}
                className="w-1/2 justify-center"
              >
                Batal
              </Button>
              <Button
                variant="pink"
                size="sm"
                onClick={() => handleVerify(rejectModalItem.id, "rejected", rejectReason)}
                className="w-1/2 justify-center"
              >
                Konfirmasi Tolak
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
