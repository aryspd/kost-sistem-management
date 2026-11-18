# 🏠 Kost Manager — Sistem Pembayaran & Manajemen Keuangan Kost

Sistem berbasis web modern untuk mengelola kost secara menyeluruh:
1. **Tagihan Otomatis Berdasarkan Tanggal Masuk**: Setiap penghuni memiliki siklus jatuh tempo bulanan sendiri sesuai tanggal masuknya (misal masuk tanggal 15 → jatuh tempo setiap tanggal 15).
2. **Manajemen Keuangan Lengkap**: Pencatatan pemasukan sewa otomatis, pencatatan pengeluaran operasional (Listrik, Air, WiFi, Perbaikan, Gaji, Kebersihan), buku kas bulanan dengan saldo berjalan, dan grafik laba/rugi.
3. **Notifikasi WhatsApp**: Kirim pengingat tagihan & kwitansi pembayaran langsung ke WhatsApp penghuni (mendukung mode **1-Klik `wa.me` gratis** maupun **Otomatis penuh via Fonnte API** beserta lampiran PDF).
4. **Kwitansi / Nota Resmi (Web & PDF)**: Setiap pembayaran lunas menghasilkan nomor kwitansi unik, halaman verifikasi publik, dan file PDF siap cetak/unduh lengkap dengan nominal *terbilang* dan cap **LUNAS**.
5. **Visualisasi Alur Sistem**: Halaman khusus yang menjelaskan alur kerja sistem secara visual dan interaktif.

---

## 🚀 Cara Menjalankan

```bash
cd D:\Projek\kost-sistem-management

# 1. Install dependencies (jika belum)
npm install

# 2. Setup database SQLite & isi data contoh
npm run setup

# 3. Jalankan server development
npm run dev
```

Buka **http://localhost:3000** di browser:
- **Username**: `admin`
- **Password**: `admin123`

*(Konfigurasi nama kost, nomor rekening, password admin, dan token WhatsApp dapat diubah di file `.env`)*
