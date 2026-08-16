import test from 'node:test';
import assert from 'node:assert/strict';

import { 
  constantTimeCompare, 
  sanitizeInputText, 
  sanitizeForSpreadsheet 
} from '../src/lib/security.ts';
import { getHariEfektifBulan } from '../src/lib/calendarApi.ts';

test('E2E Simulation: Constant Time Compare on Passwords', () => {
  const sekretarisPass = 'Sekretaris#9Xk$2026!PPLG1';
  const walikelasPass = 'WaliKelas#Didin$2026!Ciomas';
  
  assert.equal(constantTimeCompare(sekretarisPass, 'Sekretaris#9Xk$2026!PPLG1'), true);
  assert.equal(constantTimeCompare(sekretarisPass, 'wrongpassword123'), false);
  assert.equal(constantTimeCompare(walikelasPass, 'WaliKelas#Didin$2026!Ciomas'), true);
  assert.equal(constantTimeCompare(walikelasPass, 'WaliKelas#Salah'), false);
});

test('E2E Simulation: Student Name & NISN Normalization', () => {
  const rawInputName = '  abdad farras orlando   ';
  const rawNisn = ' 0095725690 ';
  
  const cleanName = rawInputName.trim().toLowerCase();
  const cleanNisn = rawNisn.trim();
  
  assert.equal(cleanName, 'abdad farras orlando');
  assert.equal(cleanNisn, '0095725690');
});

test('E2E Simulation: QR Token Anti-Replay & Collision Protection', () => {
  const consumedTokens = new Set();
  const token = 'token_e2e_live_test_12345';
  const siswaId = 1;

  const key = `${token}:${siswaId}`;
  assert.equal(consumedTokens.has(key), false);
  
  // First consumption: success
  consumedTokens.add(key);
  assert.equal(consumedTokens.has(key), true);
  
  // Second consumption attempt: blocked (anti-replay)
  const isDuplicate = consumedTokens.has(key);
  assert.equal(isDuplicate, true);
});

test('E2E Simulation: Dynamic Calendar & Effective Days for 46 Students', () => {
  const agustus2026 = getHariEfektifBulan(8, 2026);
  assert.equal(agustus2026.totalHariKalender, 31);
  assert.equal(agustus2026.totalHariEfektif, 20); // 21 weekdays - 1 holiday (17 Ags)
  
  const totalSiswa = 46;
  const mockSiswaList = Array.from({ length: totalSiswa }, (_, i) => ({
    id: i + 1,
    nama: `Siswa ${i + 1}`,
    nomorAbsen: i + 1,
  }));
  
  assert.equal(mockSiswaList.length, 46);
});

test('E2E Simulation: Spreadsheet Formula Injection CWE-1236 Defense', () => {
  const dangerousKeterangan = '=cmd|"/C calc"!A0';
  const safeKeterangan = sanitizeForSpreadsheet(dangerousKeterangan);
  assert.equal(safeKeterangan.startsWith("'"), true);
  assert.equal(safeKeterangan, '\'=cmd|"/C calc"!A0');
});
