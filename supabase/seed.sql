-- ==============================================================================
-- SKRIP SEEDING MASTER DATA KELAS XI PPLG 1 SMKN 1 CIOMAS
-- Catatan: Eksekusi skrip ini di SQL Editor Supabase untuk menginput 46 siswa asli & 2 akun pengurus.
-- ==============================================================================

-- 1. Ingestion 46 Siswa Asli Kelas XI PPLG 1
INSERT INTO public.siswa (nisn, nama, nomor_absen, gender) VALUES
('0095725690', 'Abdad Farras Orlando', 1, 'L'),
('0101502194', 'Achmad Khadaffi Putra Arsalan', 2, 'L'),
('0103985189', 'Akbar Aldyon Hidayat', 3, 'L'),
('0109799631', 'Aldentra Supranatantra', 4, 'L'),
('0092979021', 'Amelia Nurcahyani', 5, 'P'),
('0103067830', 'Angeliska Putri Setiabudi', 6, 'P'),
('0107222780', 'Ardilla Oktariani Putri', 7, 'P'),
('0107339783', 'Attariq Maulana Malik', 8, 'L'),
('3104051074', 'Ba''san Ibrahim Syadidan', 9, 'L'),
('0105792446', 'Calvin Michael Ariesta Saputra', 10, 'L'),
('0106210943', 'Dahlia Najlaa Tsuraya', 11, 'P'),
('0104977769', 'Davina Rahma Agustin', 12, 'P'),
('0104082053', 'Dhara Zahraina Mulya', 13, 'P'),
('0103093261', 'Dzakia Salsabila', 14, 'P'),
('0102419653', 'Fardan Ramadhan Saputra', 15, 'L'),
('0093364420', 'Galuh Setyaningsih', 16, 'P'),
('0105221891', 'Habib Tegar Ramadhan', 17, 'L'),
('0097923118', 'Indah Sri Utami', 18, 'P'),
('0107640563', 'Karim Abdul Jabbar', 19, 'L'),
('0102136478', 'Kinar Khansa Makaila', 20, 'P'),
('0104031192', 'M Haekal Zarkasih', 21, 'L'),
('0105237115', 'Maulana Abian Farizi', 22, 'L'),
('0107119877', 'Muhamad Fachri', 23, 'L'),
('0108080552', 'Muhamad Rizky Maulana', 24, 'L'),
('0108723617', 'Muhammad Arsyavin Fajriwan', 25, 'L'),
('0107686674', 'Muhammad Devara Hermawan', 26, 'L'),
('0106524559', 'Muhammad Imam Maliq Al Kahfi', 27, 'L'),
('3095438748', 'Muhammad Nur Riky', 28, 'L'),
('0093978492', 'Muhammad Rizki Maulana', 29, 'L'),
('0109713315', 'Namira Alifatunnisa', 30, 'P'),
('0109115019', 'Novia Aulia Putri', 31, 'P'),
('0109647298', 'Nurizky Maudy', 32, 'P'),
('0099960187', 'Putra Raden Al Aziz', 33, 'L'),
('0103529952', 'Rafiqi Althaf Ramadhan', 34, 'L'),
('0094770229', 'Rahma Oktaviani Gunawan', 35, 'P'),
('0103228229', 'Rakhman Tauhid', 36, 'L'),
('0095545066', 'Rasyid Ridho Alfaraby', 37, 'L'),
('0103783212', 'Revan Riswadi', 38, 'L'),
('0093295171', 'Rezqia Aninda Afiahtusyifa', 39, 'P'),
('0102375936', 'Rubilio', 40, 'L'),
('0103472850', 'Septiani Ananda', 41, 'P'),
('0104876144', 'Siti Nur Fadilah', 42, 'P'),
('0109446064', 'Siti Salwatun Tafriziyah', 43, 'P'),
('0091695349', 'Syakila Ramadani', 44, 'P'),
('0101791063', 'Tisya Putri Viana', 45, 'P'),
('0097690365', 'Umu Toyyibah Nurussalwa', 46, 'P')
ON CONFLICT (nisn) DO UPDATE SET 
  nama = EXCLUDED.nama,
  nomor_absen = EXCLUDED.nomor_absen,
  gender = EXCLUDED.gender;

-- 2. Ingestion 2 Akun Pengurus & Wali Kelas
INSERT INTO public.admin_users (username, nama, password_hash, role) VALUES
('sekretaris_xi_pplg1', 'Sekretaris Kelas', 'Sekretaris#9Xk$2026!PPLG1', 'admin'),
('walikelas_xi_pplg1', 'Didin Sahrudin, S.Kom', 'WaliKelas#Didin$2026!Ciomas', 'wali_kelas')
ON CONFLICT (username) DO UPDATE SET 
  nama = EXCLUDED.nama,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;
