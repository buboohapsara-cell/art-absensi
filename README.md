# Absensi ART

Sistem absensi web untuk 1 orang ART (Asisten Rumah Tangga) yang bisa dipantau majikan: checkin/checkout dengan pilih lokasi (Sekolah/Rumah), dashboard harian, dan laporan mingguan (termasuk hitung jam lembur).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Salin `.env.example` ke `.env`, isi `DATABASE_URL` (Postgres) dan `SESSION_SECRET`.
3. Buat tabel + seed 2 user awal (ART & majikan):
   ```bash
   npm run init-db
   ```
   Kalau `ART_PASSWORD`/`MAJIKAN_PASSWORD` tidak di-set, script akan generate password acak dan mencetaknya sekali di terminal — **catat & segera ganti setelah login pertama** (belum ada halaman ganti password, bisa diupdate langsung lewat kolom `password_hash` di DB atau tambahkan fitur ganti password jika dibutuhkan).

   Override username/password seed lewat env var sebelum run: `ART_USERNAME`, `ART_PASSWORD`, `MAJIKAN_USERNAME`, `MAJIKAN_PASSWORD`.
4. Jalankan:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000/login`.

## Alur Pemakaian

1. **Majikan** login → buka `/lokasi` untuk daftarkan titik lokasi (misal "Sekolah Clarissa", "Rumah Golden") — titik di peta dipakai sebagai referensi, nama ini yang akan muncul sebagai pilihan ART saat absen. Lalu `/pengaturan/jam-kerja` untuk set jam pulang normal (dipakai hitung lembur).
2. **ART** login → halaman `/absen`, pilih lokasi (radio button), lalu tekan tombol Checkin saat mulai kerja / Checkout saat pulang. Tidak pakai GPS — ART tinggal pilih dari daftar lokasi yang sudah di-set majikan.
3. **Majikan** pantau di `/dashboard` (tabel harian) dan `/laporan/mingguan` (rekap total jam kerja & lembur per minggu, periode Senin–Minggu).

## Catatan

- Lokasi absen dipilih manual oleh ART dari daftar yang di-set majikan (bukan GPS otomatis) — lebih simpel dan tidak gagal karena sinyal lokasi.
- Deploy ke Vercel: `vercel.json` sudah disiapkan. Set `DATABASE_URL` dan `SESSION_SECRET` di environment variables Vercel.
