# 🎬 Cinema Booking API Documentation

**Base URL:** `http://localhost:5000/api`

**Auth:** Bearer Token via Header `Authorization: Bearer <token>` atau Cookie `token`

---

## Legend

| Simbol | Keterangan |
|--------|------------|
| 🔓 | Public — tidak perlu login |
| 🔐 | Protected — perlu login (JWT) |
| 👑 | Admin only |

---

## 1. Authentication

**Base:** `/api/auth`

### `POST /api/auth/register` 🔓
Daftar akun baru.

**Request Body:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### `POST /api/auth/login` 🔓
Login user. Rate-limited: **5x per 15 menit**.

**Request Body:**
```json
{
  "email": "budi@email.com",
  "password": "rahasia123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response `429` (rate limit):**
```json
{
  "message": "Terlalu banyak percobaan login, coba lagi setelah 15 menit"
}
```

---

### `GET /api/auth/me` 🔐
Ambil data user yang sedang login.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc...",
    "name": "Budi Santoso",
    "email": "budi@email.com",
    "role": "user"
  }
}
```

---

## 2. Locations

**Base:** `/api/locations`

### `GET /api/locations` 🔓
Ambil semua lokasi kota.

**Response `200`:**
```json
[
  { "_id": "64abc...", "city": "Jakarta", "province": "DKI Jakarta" }
]
```

---

### `GET /api/locations/:id` 🔓
Ambil detail lokasi berdasarkan ID.

---

### `POST /api/locations` 👑
Tambah lokasi baru.

**Request Body:**
```json
{
  "city": "Bandung",
  "province": "Jawa Barat"
}
```

---

### `PUT /api/locations/:id` 👑
Update data lokasi.

---

### `DELETE /api/locations/:id` 👑
Hapus lokasi.

---

## 3. Bioskop

**Base:** `/api/bioskop`

### `GET /api/bioskop` 🔓
Ambil semua data bioskop.

**Response `200`:**
```json
[
  {
    "_id": "64abc...",
    "name": "CGV Grand Indonesia",
    "address": "Jl. MH Thamrin No.1",
    "locationId": { "city": "Jakarta", "province": "DKI Jakarta" }
  }
]
```

---

### `GET /api/bioskop/:id` 🔓
Ambil detail bioskop berdasarkan ID.

---

### `POST /api/bioskop` 👑
Tambah bioskop baru.

**Request Body:**
```json
{
  "name": "CGV Grand Indonesia",
  "address": "Jl. MH Thamrin No.1",
  "locationId": "64locationId..."
}
```

---

### `PUT /api/bioskop/:id` 👑
Update data bioskop.

---

### `DELETE /api/bioskop/:id` 👑
Hapus bioskop.

---

## 4. Studio

**Base:** `/api/studios`

### `GET /api/studios` 🔓
Ambil semua studio.

**Response `200`:**
```json
[
  {
    "_id": "64abc...",
    "name": "Studio 1",
    "studioId": "STD-001",
    "totalSeats": 100,
    "rows": 10,
    "seatsPerRow": 10,
    "status": "active"
  }
]
```

---

### `GET /api/studios/:id` 🔓
Ambil detail studio berdasarkan ID.

---

### `POST /api/studios` 👑
Tambah studio baru.

**Request Body:**
```json
{
  "name": "Studio 1",
  "studioId": "STD-001",
  "totalSeats": 100,
  "rows": 10,
  "seatsPerRow": 10
}
```

---

### `PUT /api/studios/:id` 👑
Update data studio.

---

### `DELETE /api/studios/:id` 👑
Hapus studio.

---

## 5. Movies

**Base:** `/api/movies`

### `GET /api/movies` 🔓
Ambil semua film.

**Response `200`:**
```json
[
  {
    "_id": "64abc...",
    "title": "Avengers: Endgame",
    "genre": "Action",
    "duration": 181,
    "description": "...",
    "poster": "https://..."
  }
]
```

---

### `GET /api/movies/:id` 🔓
Ambil detail film berdasarkan ID.

---

### `POST /api/movies` 👑
Tambah film baru.

**Request Body:**
```json
{
  "title": "Avengers: Endgame",
  "genre": "Action",
  "duration": 181,
  "description": "After the devastating events...",
  "poster": "https://image.url/poster.jpg"
}
```

---

### `PUT /api/movies/:id` 👑
Update data film.

---

### `DELETE /api/movies/:id` 👑
Hapus film.

---

## 6. Showtime (Jadwal Tayang)

**Base:** `/api/showtimes`

### `GET /api/showtimes` 🔓
Ambil semua jadwal tayang. Mendukung search, filter, dan pagination.

**Query Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `search` | string | Cari berdasarkan judul film |
| `genre` | string | Filter berdasarkan genre |
| `location` | string | Filter berdasarkan kota |
| `bioskop` | string | Filter berdasarkan nama bioskop |
| `date` | string | Filter berdasarkan tanggal (ISO 8601) |
| `page` | number | Halaman (default: 1) |
| `limit` | number | Jumlah per halaman (default: 20) |

**Contoh:** `GET /api/showtimes?search=Avengers&location=Jakarta&date=2025-08-01`

**Response `200`:**
```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "totalItems": 5,
  "totalPages": 1,
  "data": [...]
}
```

---

### `GET /api/showtimes/movies/:movieId/showtimes` 🔓
Ambil semua jadwal tayang berdasarkan film tertentu.

---

### `GET /api/showtimes/showtimes/:id` 🔓
Ambil detail satu showtime.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc...",
    "movieId": { "title": "Avengers: Endgame" },
    "bioskopId": { "name": "CGV Grand Indonesia" },
    "studioId": { "name": "Studio 1", "totalSeats": 100 },
    "date": "2025-08-01T00:00:00.000Z",
    "startTime": "14:00",
    "price": 50000,
    "bookedSeats": [
      { "_id": "64abc...", "code": "A1" },
      { "_id": "64def...", "code": "A2" }
    ],
    "isActive": true
  }
}
```

---

### `GET /api/showtimes/showtimes/:id/seats` 🔓
Ambil daftar kursi yang sudah dipesan pada showtime tertentu.

**Response `200`:**
```json
{
  "success": true,
  "bookedSeats": [
    { "_id": "64abc...", "code": "A1" },
    { "_id": "64def...", "code": "A2" }
  ]
}
```

---

### `POST /api/showtimes/showtimes` 👑
Tambah jadwal tayang baru.

**Request Body:**
```json
{
  "movieId": "64movieId...",
  "bioskopId": "64bioskopId...",
  "studioId": "64studioId...",
  "date": "2025-08-01",
  "startTime": "14:00",
  "price": 50000
}
```

**Response `409`** (jadwal bentrok):
```json
{
  "success": false,
  "message": "Studio sudah memiliki jadwal pada waktu tersebut"
}
```

---

### `PUT /api/showtimes/showtimes/:id` 👑
Update data jadwal tayang.

---

### `DELETE /api/showtimes/showtimes/:id` 👑
Hapus jadwal tayang.

---

## 7. Seats (Kursi)

**Base:** `/api/seats`

### `GET /api/seats` 🔓
Ambil semua kursi (seluruh studio).

---

### `GET /api/seats/:id` 🔓
Ambil detail kursi berdasarkan ID.

---

### `GET /api/seats/studio/:studioId` 🔓
Ambil semua kursi berdasarkan studio (diurutkan by code A-Z).

**Response `200`:**
```json
[
  { "_id": "64abc...", "studioId": "64studioId...", "code": "A1" },
  { "_id": "64abc...", "studioId": "64studioId...", "code": "A2" }
]
```

---

### `POST /api/seats` 🔓
Tambah kursi manual (satu per satu).

**Request Body:**
```json
{
  "studioId": "64studioId...",
  "code": "A1"
}
```

---

### `POST /api/seats/generate` 🔓
Generate otomatis kursi A1–J10 (100 kursi) untuk satu studio.

**Request Body:**
```json
{
  "studioId": "64studioId..."
}
```

**Response `201`:**
```json
{
  "message": "Seats berhasil dibuat",
  "total": 100,
  "data": [...]
}
```

> ⚠️ Sudah ada unique index, jika dijalankan 2x kursi yang sama akan di-skip (tidak error).

---

### `PUT /api/seats/:id` 🔓
Update data kursi.

---

### `DELETE /api/seats/:id` 🔓
Hapus kursi.

---

## 8. Booking

**Base:** `/api/bookings`

### `GET /api/bookings` 🔓
Ambil semua booking.

---

### `GET /api/bookings/:id` 🔓
Ambil detail booking berdasarkan ID.

---

### `POST /api/bookings` 🔓
Buat booking baru sekaligus mengunci kursi pada showtime secara **atomic** (race condition-safe).

**Request Body:**
```json
{
  "userId": "64userId...",
  "movieId": "64movieId...",
  "showtimeId": "64showtimeId...",
  "seats": ["A1", "A2"]
}
```

> **Catatan:** `seats` dikirim sebagai **kode kursi** (misal `"A1"`), bukan ObjectId. Backend akan otomatis mencari ObjectId-nya dari Seat collection dan memvalidasi bahwa kursi tersebut benar-benar ada di studio yang bersangkutan.

**Response `201`:**
```json
{
  "success": true,
  "message": "Booking berhasil dibuat. Silakan lanjutkan ke pembayaran.",
  "data": {
    "_id": "64bookingId...",
    "userId": "64userId...",
    "movieId": "64movieId...",
    "showtimeId": "64showtimeId...",
    "seats": [
      { "_id": "64abc...", "code": "A1" },
      { "_id": "64def...", "code": "A2" }
    ],
    "totalPrice": 100000,
    "status": "pending"
  }
}
```

**Response `400`** (kursi tidak valid di studio):
```json
{
  "success": false,
  "message": "Kursi tidak valid untuk studio ini",
  "invalidSeats": ["Z99"]
}
```

**Response `409`** (kursi sudah dipesan):
```json
{
  "success": false,
  "message": "Salah satu atau lebih kursi sudah dipesan",
  "conflictSeats": ["A1"]
}
```

---

### `PUT /api/bookings/:id` 🔓
Update booking.

---

### `DELETE /api/bookings/:id` 🔓
Hapus booking.

---

## 9. Transactions (Pembayaran)

**Base:** `/api/transactions`

### `POST /api/transactions` 🔐
Buat transaksi baru dari booking yang sudah ada.

**Request Body:**
```json
{
  "bookingId": "64bookingId...",
  "amount": 100000,
  "paymentMethod": "QRIS"
}
```

> **`paymentMethod`** enum: `QRIS` | `E-wallet` | `Virtual Account` | `Credit Card`

**Response `201`:**
```json
{
  "success": true,
  "message": "Transaksi berhasil dibuat. Silakan lakukan simulasi pembayaran.",
  "data": {
    "_id": "64txId...",
    "bookingId": "64bookingId...",
    "userId": "64userId...",
    "amount": 100000,
    "paymentMethod": "QRIS",
    "status": "pending"
  }
}
```

---

### `GET /api/transactions/history` 🔐
Ambil riwayat transaksi user yang sedang login.

**Response `200`:**
```json
{
  "success": true,
  "count": 2,
  "data": [...]
}
```

---

### `GET /api/transactions/:id` 🔐
Ambil detail satu transaksi. User hanya bisa akses miliknya sendiri, admin bisa akses semua.

**Response `403`** (bukan miliknya):
```json
{ "message": "Tidak memiliki akses ke transaksi ini" }
```

---

### `GET /api/transactions/admin/all` 👑
Ambil semua transaksi (admin only).

---

### `PUT /api/transactions/admin/:id/status` 👑
Update status transaksi secara manual (simulasi payment gateway).

**Request Body:**
```json
{
  "status": "success"
}
```

> **`status`** enum: `pending` | `success` | `failed` | `expired` | `refunded`

**Efek samping otomatis:**

| Status | Booking | Kursi di Showtime |
|--------|---------|-------------------|
| `success` | → `confirmed` | Tetap terkunci |
| `failed` / `expired` / `refunded` | → `cancelled` | ✅ Dilepas kembali |

---

## 10. Admin Dashboard

**Base:** `/api/admin`

> Semua endpoint memerlukan login **admin** 👑

### `GET /api/admin/dashboard` 👑
Ambil statistik dashboard: total movie, studio, showtime, booking, dan user.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalMovie": 25,
    "totalStudio": 10,
    "totalShowtimes": 120,
    "totalBookings": 540,
    "totalUsers": 300
  }
}
```

---

### `GET /api/admin/booking` 👑
Ambil ringkasan/summary booking.

---

### `GET /api/admin/report` 👑
Ambil laporan transaksi dan pendapatan.

---

## Error Response Format

Semua error mengikuti format:
```json
{
  "success": false,
  "message": "Pesan error di sini",
  "error": "Detail teknis (opsional)"
}
```

| HTTP Code | Keterangan |
|-----------|------------|
| `400` | Bad Request — input tidak valid |
| `401` | Unauthorized — belum login |
| `403` | Forbidden — tidak punya akses |
| `404` | Not Found — data tidak ditemukan |
| `409` | Conflict — data bentrok (kursi sudah dipesan, jadwal duplikat) |
| `429` | Too Many Requests — rate limit tercapai |
| `500` | Internal Server Error |
