Universal UMKM Pro v3.3.64 — Patch Komposisi Bakery Terhubung

File patch:
- app.js: migrasi sinkronisasi produk, bahan/belanja, dan komposisi untuk paket Toko Kue / Bakery.
- master.json: formula acuan Roti Tawar Kupas Potong Pack Isi 10 Lembar diperbaiki dan memakai bahan yang tersedia di Bahan/Belanja.
- sw.js: versi cache dinaikkan agar perubahan PWA dikenali.

Yang dilakukan:
1. Melengkapi bahan bakery yang direferensikan resep agar ada di Bahan/Belanja.
2. Memastikan produk jual bakery dan komposisinya terhubung melalui ID template.
3. Membuat komposisi yang belum ada.
4. Memperbarui resep bawaan yang belum diedit pengguna; resep yang diedit pengguna dipertahankan dan hanya ditambah bahan yang benar-benar belum ada.
5. Tidak mengosongkan atau mengganti stok, harga jual yang sudah diubah pengguna, riwayat belanja, dan transaksi lama.
6. Formula Roti Tawar Kupas Potong Pack Isi 10 Lembar adalah formula awal untuk 1 pack, perlu diuji di dapur dan disesuaikan dengan hasil panggang/pemasok aktual.

Cara pakai: ekstrak ZIP, ganti file bernama sama di proyek/repository PWA, lalu publish ke GitHub Pages. Untuk menguji, buka kembali aplikasi saat online, masuk usaha Toko Kue / Bakery, cek Produk & Jasa, Bahan/Belanja, Komposisi Produk, lalu pastikan Roti Tawar Kupas Potong Pack Isi 10 Lembar memiliki resep yang memuat bahan dari daftar Bahan/Belanja.
