"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectQRDisplay() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/qr-display");
  }, [router]);

  return null;
}
