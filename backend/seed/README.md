# Seed database

Gunakan hanya file seed kanonis berikut:

- `locations.json`
- `bioskops.json`
- `movies.json`
- `studio.json`
- `seat.json`
- `showtime.json`

Jalankan `npm run seed:check` untuk memvalidasi struktur, field wajib, dan seluruh relasi seed tanpa mengubah database. Setelah lolos, jalankan `npm run seed` dari folder `backend`. Perintah ini menghapus data lokasi, bioskop, film, studio, kursi, jadwal, booking, dan transaksi yang ada, kemudian mengimpor ulang data dalam urutan relasi yang benar.

File `showtimes.json` dan `seats.json` adalah data lama untuk contoh kecil. Jangan impor keduanya bersama seed kanonis karena ID studiunya tidak cocok dengan `studio.json`.
