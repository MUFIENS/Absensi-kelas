"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRiwayatPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/siswa/riwayat");
  }, [router]);

  return null;
}
