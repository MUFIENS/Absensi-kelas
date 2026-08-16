"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectAbsen() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/absen");
  }, [router]);

  return null;
}
