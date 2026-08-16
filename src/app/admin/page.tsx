"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectAdmin() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/verifikasi");
  }, [router]);

  return null;
}
