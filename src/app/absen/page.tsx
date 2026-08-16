"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectAbsenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(`/dashboard/siswa/absen${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return null;
}

export default function RedirectAbsen() {
  return (
    <Suspense fallback={null}>
      <RedirectAbsenContent />
    </Suspense>
  );
}
