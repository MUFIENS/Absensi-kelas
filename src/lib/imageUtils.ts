/**
 * UTILITY KOMPRESI FOTO & MANAJEMEN MEMORI CLIENT-SIDE (SMKN 1 CIOMAS)
 * 
 * Mengoptimalkan foto selfie presensi dan lampiran surat izin:
 * - Menjaga ketajaman teks/wajah dengan interpolation 'high'
 * - Adaptive multi-step compression untuk menjaga file < 200 KB
 * - Pencegahan memory leak pada mobile browser (Object URL & Canvas cleanup)
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeBytes?: number; // Target ukuran maksimal (default 250KB)
  mimeType?: "image/jpeg" | "image/webp";
}

/**
 * Menghitung estimasi ukuran biner dari string Data URL Base64
 */
export function getApproximateBase64SizeBytes(base64String: string): number {
  if (!base64String) return 0;
  const commaIndex = base64String.indexOf(",");
  const base64Data = commaIndex !== -1 ? base64String.slice(commaIndex + 1) : base64String;
  const padding = (base64Data.endsWith("==") ? 2 : base64Data.endsWith("=") ? 1 : 0);
  return Math.max(0, Math.floor((base64Data.length * 3) / 4 - padding));
}

/**
 * Format ukuran biner ke format human-readable (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Kompresi gambar adaptif dari File, Blob, atau DataURL Base64
 */
export async function compressImage(
  fileOrDataUrl: File | Blob | string,
  optionsOrMaxWidth: CompressionOptions | number = {},
  maxHeightParam?: number,
  qualityParam?: number
): Promise<string> {
  let maxWidth = 1024;
  let maxHeight = 1024;
  let quality = 0.72;
  let maxSizeBytes = 250 * 1024; // 250 KB target
  let mimeType: "image/jpeg" | "image/webp" = "image/jpeg";

  if (typeof optionsOrMaxWidth === "number") {
    maxWidth = optionsOrMaxWidth;
    if (maxHeightParam !== undefined) maxHeight = maxHeightParam;
    if (qualityParam !== undefined) quality = qualityParam;
  } else if (typeof optionsOrMaxWidth === "object") {
    if (optionsOrMaxWidth.maxWidth !== undefined) maxWidth = optionsOrMaxWidth.maxWidth;
    if (optionsOrMaxWidth.maxHeight !== undefined) maxHeight = optionsOrMaxWidth.maxHeight;
    if (optionsOrMaxWidth.quality !== undefined) quality = optionsOrMaxWidth.quality;
    if (optionsOrMaxWidth.maxSizeBytes !== undefined) maxSizeBytes = optionsOrMaxWidth.maxSizeBytes;
    if (optionsOrMaxWidth.mimeType !== undefined) mimeType = optionsOrMaxWidth.mimeType;
  }

  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null;
    const img = new Image();

    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
        objectUrl = null;
      }
    };

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width === 0 || height === 0) {
          cleanup();
          resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
          return;
        }

        // Kalkulasi resolusi proporsional aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx) {
          cleanup();
          resolve(typeof fileOrDataUrl === "string" ? fileOrDataUrl : "");
          return;
        }

        // Kualitas rendering tajam & anti-alias
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Background putih solid (mencegah background hitam jika file PNG transparan)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Adaptive compression pass 1
        let currentQuality = quality;
        let resultDataUrl = canvas.toDataURL(mimeType, currentQuality);
        let size = getApproximateBase64SizeBytes(resultDataUrl);

        // Multi-step reduction jika file masih melebihi target maxSizeBytes
        let attempts = 0;
        while (size > maxSizeBytes && currentQuality > 0.4 && attempts < 3) {
          attempts++;
          currentQuality = Math.max(0.4, currentQuality - 0.12);
          resultDataUrl = canvas.toDataURL(mimeType, currentQuality);
          size = getApproximateBase64SizeBytes(resultDataUrl);
        }

        // Memory cleanup canvas
        canvas.width = 0;
        canvas.height = 0;

        cleanup();
        resolve(resultDataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = (err) => {
      cleanup();
      reject(err);
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      try {
        objectUrl = URL.createObjectURL(fileOrDataUrl);
        img.src = objectUrl;
      } catch {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            img.src = e.target.result as string;
          }
        };
        reader.onerror = (readErr) => {
          cleanup();
          reject(readErr);
        };
        reader.readAsDataURL(fileOrDataUrl);
      }
    }
  });
}
