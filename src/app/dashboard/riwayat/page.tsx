"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  History,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Camera,
  Eye,
  ArrowLeft,
  FileText,
  PlusCircle,
  MapPin,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { AppIcon } from "@/components/ui/AppIcon";
import { getStoredAuth, getAbsensiRecords, getIzinRecords } from "@/lib/store";
import { AuthSession, AbsensiRecord, IzinRecord, JenisAbsensi } from "@/lib/types";

type FilterTab = "all" | "kehadiran_kelas" | "sholat_dzuhur" | "sakit" | "izin";

export default function DashboardRiwayatPage() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [izinList, setIzinList] = useState<IzinRecord[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  // Modals
  const [selectedPhoto, setSelectedPhoto] = useState<AbsensiRecord | null>(null);
  const [selectedIzin, setSelectedIzin] = useState<IzinRecord | null>(null);

  useEffect(() => {
    setAuth(getStoredAuth());
    setAbsensiList(getAbsensiRecords());
    setIzinList(getIzinRecords());
  }, []);

  const studentId = auth && auth.role === "siswa" ? auth.user.id : 11;

  // Filter records by student ID
  const myAbsensi = absensiList.filter((r) => r.siswaId === studentId);
  const myIzin = izinList.filter((i) => i.siswaId === studentId);

  // Counts
  const hadirKelasCount = myAbsensi.filter((r) => r.jenis === "kehadiran_kelas" && r.status === "verified").length;
  const hadirSholatCount = myAbsensi.filter((r) => r.jenis === "sholat_dzuhur" && r.status === "verified").length;
  const sakitCount = myIzin.filter((i) => i.jenis === "Sakit").length;
  const izinCount = myIzin.filter((i) => i.jenis === "Izin" || i.jenis === "Dispensasi").length;
  const pendingCount = myAbsensi.filter((r) => r.status === "pending").length + myIzin.filter((i) => i.status === "pending").length;

  // Unified items for rendering
  interface UnifiedItem {
    id: string;
    type: "absensi" | "izin";
    date: string;
    timestamp: string;
    title: string;
    subtitle: string;
    categoryBadge: "kelas" | "sholat" | "sakit" | "izin" | "dispen";
    status: "verified" | "pending" | "rejected";
    photoUrl?: string;
    recordRef: AbsensiRecord | IzinRecord;
  }

  const unifiedList: UnifiedItem[] = [
    ...myAbsensi.map((a) => ({
      id: `abs-${a.id}`,
      type: "absensi" as const,
      date: a.tanggal,
      timestamp: a.waktuAbsen,
      title: a.jenis === "kehadiran_kelas" ? "Kehadiran Masuk Kelas" : "Sholat Dzuhur Berjamaah",
      subtitle: `${new Date(a.waktuAbsen).toLocaleTimeString("id-ID")} WIB • Sesi #${a.qrSesiId}`,
      categoryBadge: (a.jenis === "kehadiran_kelas" ? "kelas" : "sholat") as "kelas" | "sholat",
      status: a.status,
      photoUrl: a.fotoUrl,
      recordRef: a,
    })),
    ...myIzin.map((i) => ({
      id: `iz-${i.id}`,
      type: "izin" as const,
      date: i.tanggal,
      timestamp: i.waktuPengajuan,
      title: i.jenis === "Sakit" ? "Surat Keterangan Sakit (Dokter)" : i.jenis === "Dispensasi" ? "Surat Dispensasi Kegiatan" : "Surat Izin Orang Tua",
      subtitle: `Alasan: "${i.keterangan}"`,
      categoryBadge: (i.jenis === "Sakit" ? "sakit" : i.jenis === "Dispensasi" ? "dispen" : "izin") as "sakit" | "dispen" | "izin",
      status: i.status,
      photoUrl: i.suratFotoUrl,
      recordRef: i,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter items based on active tab
  const filteredItems = unifiedList.filter((item) => {
    if (filterTab === "all") return true;
    if (filterTab === "kehadiran_kelas") return item.type === "absensi" && item.categoryBadge === "kelas";
    if (filterTab === "sholat_dzuhur") return item.type === "absensi" && item.categoryBadge === "sholat";
    if (filterTab === "sakit") return item.type === "izin" && item.categoryBadge === "sakit";
    if (filterTab === "izin") return item.type === "izin" && (item.categoryBadge === "izin" || item.categoryBadge === "dispen");
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Stat 1: Hadir Kelas */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase">Hadir Kelas</p>
            <p className="text-xl sm:text-2xl font-black font-fredoka text-[#FF6FA5]">{hadirKelasCount} Hari</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FF6FA5] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
            <AppIcon name="sun" className="w-4 h-4 sm:w-5 sm:h-5 text-[#181818]" />
          </div>
        </div>

        {/* Stat 2: Sholat Dzuhur */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase">Sholat Dzuhur</p>
            <p className="text-xl sm:text-2xl font-black font-fredoka text-[#6FCB6F]">{hadirSholatCount} Hari</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#6FCB6F] text-[#181818] flex items-center justify-center brutal-border-2 shrink-0">
            <AppIcon name="mosque" className="w-4 h-4 sm:w-5 sm:h-5 text-[#181818]" />
          </div>
        </div>

        {/* Stat 3: Sakit (Dokter) */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase">Surat Sakit</p>
            <p className="text-xl sm:text-2xl font-black font-fredoka text-red-500">{sakitCount} Hari</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-red-100 text-red-600 flex items-center justify-center brutal-border-2 border-red-400 shrink-0">
            <AppIcon name="doctor" className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Stat 4: Izin & Dispen */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl brutal-border-2 sm:brutal-border-thick brutal-shadow-sm sm:brutal-shadow flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase">Izin / Dispen</p>
            <p className="text-xl sm:text-2xl font-black font-fredoka text-blue-600">{izinCount} Hari</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center brutal-border-2 border-blue-400 shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Filter Tabs (Horizontal scroll on mobile) */}
      <div className="bg-white p-1.5 sm:p-2 rounded-2xl brutal-border-2 brutal-shadow-sm flex items-center gap-1 sm:gap-2 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setFilterTab("all")}
          className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap shrink-0 ${
            filterTab === "all"
              ? "bg-[#3355FF] text-white brutal-border-2 brutal-shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          Semua ({unifiedList.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("kehadiran_kelas")}
          className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
            filterTab === "kehadiran_kelas"
              ? "bg-[#FF6FA5] text-[#181818] brutal-border-2 brutal-shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <AppIcon name="sun" className="w-3.5 h-3.5" />
          <span>Kelas ({myAbsensi.filter((r) => r.jenis === "kehadiran_kelas").length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("sholat_dzuhur")}
          className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
            filterTab === "sholat_dzuhur"
              ? "bg-[#6FCB6F] text-[#181818] brutal-border-2 brutal-shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <AppIcon name="mosque" className="w-3.5 h-3.5" />
          <span>Sholat ({myAbsensi.filter((r) => r.jenis === "sholat_dzuhur").length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("sakit")}
          className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
            filterTab === "sakit"
              ? "bg-red-500 text-white brutal-border-2 brutal-shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <AppIcon name="doctor" className="w-3.5 h-3.5" />
          <span>Sakit ({sakitCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab("izin")}
          className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
            filterTab === "izin"
              ? "bg-[#FFD400] text-[#181818] brutal-border-2 brutal-shadow-sm"
              : "text-neutral-700 hover:bg-neutral-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Izin ({izinCount})</span>
        </button>
      </div>

      {/* Unified Records List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl brutal-border-thick text-center space-y-3">
            <p className="text-base font-black text-neutral-600">Belum ada riwayat pada kategori ini.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              variant="white"
              shadow="md"
              borderWidth="normal"
              className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  onClick={() => {
                    if (item.type === "absensi") {
                      setSelectedPhoto(item.recordRef as AbsensiRecord);
                    } else {
                      setSelectedIzin(item.recordRef as IzinRecord);
                    }
                  }}
                  className="w-16 h-16 rounded-2xl bg-neutral-200 brutal-border-2 overflow-hidden shrink-0 cursor-pointer relative group"
                >
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-base text-[#181818] font-fredoka">
                      {item.title}
                    </span>

                    {item.categoryBadge === "kelas" && (
                      <Badge variant="pink" size="sm" className="gap-1">
                        <AppIcon name="sun" className="w-3 h-3" />
                        <span>Pagi</span>
                      </Badge>
                    )}
                    {item.categoryBadge === "sholat" && (
                      <Badge variant="green" size="sm" className="gap-1">
                        <AppIcon name="mosque" className="w-3 h-3" />
                        <span>Mushola</span>
                      </Badge>
                    )}
                    {item.categoryBadge === "sakit" && (
                      <Badge variant="rejected" size="sm" className="gap-1">
                        <AppIcon name="doctor" className="w-3 h-3" />
                        <span>Surat Sakit</span>
                      </Badge>
                    )}
                    {item.categoryBadge === "izin" && (
                      <Badge variant="yellow" size="sm" className="gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Izin</span>
                      </Badge>
                    )}
                    {item.categoryBadge === "dispen" && (
                      <Badge variant="blue" size="sm" className="gap-1">
                        <FileCheck className="w-3 h-3" />
                        <span>Dispensasi</span>
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs font-bold text-neutral-600 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {item.date}
                    </span>
                    <span>•</span>
                    <span>{item.subtitle}</span>
                  </p>

                  {/* Location Pill for Absensi */}
                  {item.type === "absensi" && (item.recordRef as AbsensiRecord).lokasi && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 rounded-md text-[10px] font-bold text-neutral-700 border border-neutral-300">
                      <MapPin className="w-3 h-3 text-green-600" />
                      <span>GPS: {(item.recordRef as AbsensiRecord).lokasi?.locationName}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {item.type === "absensi" && (item.recordRef as AbsensiRecord).alasanPenolakan && (
                    <p className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-300">
                      Catatan: {(item.recordRef as AbsensiRecord).alasanPenolakan}
                    </p>
                  )}
                  {item.type === "izin" && (item.recordRef as IzinRecord).alasanPenolakan && (
                    <p className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-300">
                      Catatan Penolakan: {(item.recordRef as IzinRecord).alasanPenolakan}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t-2 sm:border-t-0 border-neutral-100">
                <Badge
                  variant={
                    item.status === "verified"
                      ? "verified"
                      : item.status === "pending"
                      ? "pending"
                      : "rejected"
                  }
                  size="md"
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
                    className="w-3.5 h-3.5"
                  />
                  <span>
                    {item.status === "verified"
                      ? item.type === "izin" ? "Disetujui" : "Sah"
                      : item.status === "pending"
                      ? "Menunggu"
                      : "Ditolak"}
                  </span>
                </Badge>

                <Button
                  variant="yellow"
                  size="sm"
                  onClick={() => {
                    if (item.type === "absensi") {
                      setSelectedPhoto(item.recordRef as AbsensiRecord);
                    } else {
                      setSelectedIzin(item.recordRef as IzinRecord);
                    }
                  }}
                  className="text-xs gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{item.type === "absensi" ? "Bukti Selfie" : "Lihat Surat"}</span>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal 1: Selfie & GPS Photo Modal */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Bukti Presensi Selfie & Lokasi"
        maxWidth="md"
      >
        {selectedPhoto && (
          <div className="space-y-4">
            <div className="w-full max-h-[280px] sm:max-h-[320px] aspect-square rounded-2xl brutal-border-2 overflow-hidden bg-[#181818] mx-auto flex items-center justify-center">
              <img
                src={selectedPhoto.fotoUrl}
                alt="Foto Bukti Absen"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="bg-[#F8F8F5] p-4 rounded-2xl brutal-border-2 space-y-1.5 text-xs font-bold text-[#181818]">
              <p>Siswa: <strong>{selectedPhoto.siswa?.nama}</strong></p>
              <p>Sesi: <strong>{selectedPhoto.jenis === "kehadiran_kelas" ? "Kehadiran Kelas" : "Sholat Dzuhur"}</strong> (Sesi #{selectedPhoto.qrSesiId})</p>
              <p>Waktu Server: {new Date(selectedPhoto.timestampServer).toLocaleString("id-ID")} WIB</p>
              {selectedPhoto.lokasi && (
                <p className="flex items-center gap-1 text-green-800">
                  <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span>Lokasi: {selectedPhoto.lokasi.locationName} ({selectedPhoto.lokasi.distanceMeters}m dari sekolah)</span>
                </p>
              )}
              <p>Status Verifikasi: <strong className="uppercase">{selectedPhoto.status}</strong></p>
            </div>

            <Button variant="pink" size="md" onClick={() => setSelectedPhoto(null)} className="w-full justify-center">
              Tutup
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal 2: Surat Sakit / Izin Modal */}
      <Modal
        isOpen={!!selectedIzin}
        onClose={() => setSelectedIzin(null)}
        title="Lampiran Surat Keterangan"
        maxWidth="md"
      >
        {selectedIzin && (
          <div className="space-y-4">
            <div className="w-full rounded-2xl brutal-border-2 overflow-hidden bg-neutral-100 p-2">
              <img
                src={selectedIzin.suratFotoUrl}
                alt="Lampiran Surat Izin"
                className="w-full max-h-[350px] object-contain rounded-xl"
              />
            </div>

            <div className="bg-[#F8F8F5] p-4 rounded-2xl brutal-border-2 space-y-1.5 text-xs font-bold text-[#181818]">
              <p>Kategori: <strong className="text-[#3355FF]">{selectedIzin.jenis}</strong></p>
              <p>Tanggal Izin: <strong>{selectedIzin.tanggal}</strong></p>
              <p>Keterangan / Diagnosa: <em>"{selectedIzin.keterangan}"</em></p>
              <p>Status: <strong className="uppercase">{selectedIzin.status}</strong></p>
              {selectedIzin.alasanPenolakan && (
                <p className="text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
                  Catatan Penolakan: {selectedIzin.alasanPenolakan}
                </p>
              )}
            </div>

            <Button variant="yellow" size="md" onClick={() => setSelectedIzin(null)} className="w-full justify-center">
              Tutup
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
