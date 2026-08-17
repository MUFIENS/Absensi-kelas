/**
 * Security Utilities Module
 * Provides cryptographic hashing, constant-time comparison, input sanitization,
 * formula injection prevention, and anti-replay token validation.
 */

// 1. SHA-256 Hash with Salt using Web Crypto API
export async function hashPasswordWithSalt(password: string, salt: string = "smkn1_xi_pplg1_salt_2026"): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Synchronous fallback hash simulation for non-crypto environments
  let hash = 0;
  const str = password + salt;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "hash_" + Math.abs(hash).toString(16);
}

// 2. Timing-Safe Constant Time String Comparison (Anti-Timing Attacks)
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// 3. Input Sanitization (Anti-XSS, Stripping Control Characters & Null Bytes)
export function sanitizeInputText(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  // Remove null bytes and dangerous control characters
  const clean = input.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  
  // Strip HTML tags (<script> etc.) while keeping legitimate punctuation like apostrophes, periods, commas, slashes
  return clean.replace(/<[^>]*>?/gm, "").trim();
}

// 4. Excel / CSV Formula Injection (CWE-1236) Protection
export function sanitizeForSpreadsheet(cellContent: string): string {
  if (!cellContent || typeof cellContent !== "string") return "";
  
  const trimmed = cellContent.trim();
  // If the cell begins with dangerous formula triggers (=, +, -, @, \t, \r), prepend a single quote
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

// 5. Anti-Replay Token Registry (Persistent Storage Helper)
const CONSUMED_TOKENS_STORAGE_KEY = "absensi_consumed_tokens_registry";

interface ConsumedTokenEntry {
  token: string;
  siswaId: number;
  consumedAt: string;
}

function getConsumedTokens(): ConsumedTokenEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CONSUMED_TOKENS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function isTokenAlreadyConsumed(token: string, siswaId: number): boolean {
  const clean = token.trim().toUpperCase();
  const list = getConsumedTokens();
  return list.some((entry) => entry.token === clean && entry.siswaId === siswaId);
}

export function registerConsumedToken(token: string, siswaId: number): void {
  if (typeof window === "undefined") return;
  const clean = token.trim().toUpperCase();
  const list = getConsumedTokens();
  
  if (!list.some((entry) => entry.token === clean && entry.siswaId === siswaId)) {
    list.push({
      token: clean,
      siswaId,
      consumedAt: new Date().toISOString(),
    });
    try {
      localStorage.setItem(CONSUMED_TOKENS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Could not save consumed token registry:", e);
    }
  }
}
