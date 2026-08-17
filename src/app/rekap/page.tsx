"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectRekapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(`/dashboard/guru/rekap${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return null;
}

export default function RedirectRekap() {
  return (
    <Suspense fallback={null}>
      <RedirectRekapContent />
    </Suspense>
  );
}
