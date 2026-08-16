"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectRekap() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/rekap");
  }, [router]);

  return null;
}
