# Cinema Booking

Aplikasi pemesanan tiket bioskop dengan frontend React/Vite dan backend Express/MongoDB.

## Prasyarat

- Node.js 18 atau yang lebih baru
- MongoDB lokal atau MongoDB Atlas
- MongoDB Compass (opsional, untuk mengimpor data awal)

## Menjalankan backend

1. Buka terminal di folder `backend`.
2. Salin `.env.example` menjadi `.env`, lalu isi konfigurasi database dan JWT.

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/cinema_booking
   JWT_SECRET=ganti_dengan_rahasia_yang_kuat
   CORS_ORIGIN=http://localhost:5173
   ```

3. Pasang dependency dan jalankan server.

   ```bash
   npm install
   npm run dev
   ```

Backend tersedia di `http://localhost:5000` dan API memakai prefix `/api`.

## Menjalankan frontend

1. Buka terminal lain di folder `frontend/fe-cinemabooking`.
2. Pasang dependency dan jalankan Vite.

   ```bash
   npm install
   npm run dev
   ```

3. Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.

Untuk membuat build produksi:

```bash
npm run build
```

## Data awal MongoDB Compass

Data contoh berada di `backend/seed/`. Import setiap berkas sebagai **JSON** ke koleksi dengan nama yang sama, dalam urutan berikut agar referensi ObjectId-nya valid:

1. `locations.json` → `locations`
2. `bioskops.json` → `bioskops`
3. `studios.json` → `studios`
4. `seats.json` → `seats`
5. `movies.json` → `movies`
6. `showtimes.json` → `showtimes`

Di MongoDB Compass, pilih database `cinema_booking`, buka atau buat koleksi tujuan, lalu pilih **Add Data → Import File**. Berkas seed menggunakan MongoDB Extended JSON, sehingga nilai `{"$oid": "..."}` akan diimpor sebagai ObjectId.

Seed tidak menyertakan data `users`, `bookings`, maupun `transactions`.
