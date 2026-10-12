UNIVERSAL UMKM PRO — ASISTEN USAHA UNIVERSAL v2.2
PWA OFFLINE • DATABASE TERPISAH PER USAHA

ISI PAKET
- index.html: antarmuka responsif HP dan desktop
- app.js: logika aplikasi, IndexedDB, template, transaksi, backup/restore, produk, stok, resep/HPP
- style.css: tampilan
- master.json: 24 template usaha, 624 item awal, dan 65 workflow
- sw.js: cache offline versi 2.2
- manifest.webmanifest dan ikon aplikasi
- AUDIT_PERBAIKAN_v2.2.txt: catatan pembaruan dan batasan pengujian

PERUBAHAN v2.2 — FORM PRODUK
- Informasi Produk/Jasa memiliki tombol Simpan produk.
- Kelola stok memiliki tombol Simpan stok sendiri.
- Resep/Komposisi HPP memiliki tombol Simpan resep/HPP sendiri.
- Status “Ini bahan baku (tidak dijual langsung di kasir)” berada di bawah resep/HPP dan memiliki tombol simpan sendiri.
- Satuan takaran resep mendukung konversi g/ons/kg dan ml/liter, serta satuan yang sesuai dengan satuan dasar bahan.
- Data stok, resep, dan status bahan baku tidak ditimpa saat hanya menyimpan informasi dasar produk.

PERBAIKAN DASAR v2.1 YANG DIPERTAHANKAN
- Skema IndexedDB versi 2 dan indeks businessId pada produk, transaksi, serta detail transaksi.
- Migrasi data lama dan pembacaan data berdasarkan usaha aktif.
- Pembuatan usaha memvalidasi template; harga, HPP, dan stok awal template tetap 0.
- Backup mencakup data usaha dan pemulihan memperbarui status aplikasi.
- Perubahan Master tidak mengubah instance usaha yang sudah dibuat.

CARA MENJALANKAN
PWA memerlukan alamat HTTPS atau localhost untuk service worker. Jangan hanya membuka index.html melalui file manager jika ingin menguji mode offline.
1. Unggah seluruh isi folder ke hosting statis HTTPS atau jalankan server lokal.
2. Buka aplikasi melalui alamat HTTPS/localhost di Chrome.
3. Buat profil usaha, isi nama toko, lalu pilih template.
4. Pada Produk & Jasa, simpan informasi produk dahulu; setelah itu gunakan tombol simpan tersendiri untuk stok, resep/HPP, dan status bahan baku.
5. Buat backup berkala dari menu Profil & Backup.

CATATAN DAN BATASAN
- Pengujian end-to-end penuh di browser belum dilakukan untuk seluruh alur dan perangkat.
- Satuan khusus harus sesuai dengan satuan dasar bahan. Konversi berat dan volume tidak dicampur.
- Pemilih harga 1–24 jenis usaha masih antarmuka lokal. Pembayaran/verifikasi lisensi server belum terhubung.
- Sinkronisasi antarperangkat dan otorisasi server belum dibangun.
