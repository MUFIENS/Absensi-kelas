"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getStoredAuth } from "@/lib/store";

export default function DashboardRootPage() {
  const router = useRouter();

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.replace("/login?redirect=/dashboard");
      return;
    }

    if (auth.role === "siswa") {
      router.replace("/dashboard/siswa");
    } else if (auth.role === "admin") {
      router.replace("/dashboard/sekretaris");
    } else if (auth.role === "wali_kelas") {
      router.replace("/dashboard/guru");
    } else {
      router.replace("/dashboard/siswa");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center p-12 text-center">
      <div className="bg-white p-6 rounded-3xl brutal-border-thick brutal-shadow-lg font-black font-fredoka text-lg flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#3355FF]" />
        <span>Mengarahkan ke Dashboard Role Kamu...</span>
      </div>
    </div>
  );
}
