"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectRiwayat() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/riwayat");
  }, [router]);

  return null;
}
