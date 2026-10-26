Universal UMKM Pro v3.3.78 — Filter Stok Bahan Berdasarkan Produk

TUJUAN
Memudahkan pengguna melihat bahan yang diperlukan untuk produk tertentu tanpa memecah catatan pembelian atau stok.

PERUBAHAN
- Menambahkan pilihan "Filter bahan berdasarkan produk" pada bagian Stok Bahan & Barang.
- Jika pengguna memilih produk yang memiliki komposisi tersimpan, tabel stok hanya menampilkan bahan yang tercatat pada komposisi produk tersebut.
- Jika produk belum memiliki komposisi, aplikasi menampilkan penjelasan agar komposisi diatur terlebih dahulu.
- Pilihan "Semua bahan dan barang" menampilkan daftar stok lengkap seperti sebelumnya.
- Formulir Pembelian Baru dan Riwayat Pembelian tetap terpusat. Pembelian bahan yang sama tetap menambah satu catatan stok bersama, meskipun bahan digunakan oleh beberapa produk.
- Tidak mengubah data usaha, katalog master, rumus harga paket, atau skema database.

CARA MEMASANG
1. Cadangkan data aplikasi melalui menu Profil & Backup.
2. Salin app.js, index.html, dan sw.js ke root repositori Universal-UMKM-PWA-Offline, timpa file lama.
3. Commit/push perubahan dan tunggu GitHub Pages selesai diperbarui.
4. Buka aplikasi saat online sekali agar file terbaru terunduh. Jika masih terlihat versi lama, tutup PWA sepenuhnya lalu buka lagi.

CARA UJI
1. Buka Bahan & Belanja.
2. Di bagian Stok Bahan & Barang, pilih produk misalnya Pecel Lele.
3. Pastikan yang tampil hanya bahan yang dipakai dalam komposisi Pecel Lele.
4. Pilih produk lain dan pastikan daftar bahan berubah mengikuti komposisi produk itu.
5. Pilih "Semua bahan dan barang" untuk kembali melihat semua stok.
6. Lakukan pembelian salah satu bahan melalui formulir Pembelian Baru, lalu pastikan stok bahan yang sama bertambah satu kali.

VALIDASI DAN BATASAN
Sintaks JavaScript dan struktur ZIP diperiksa. Belum diuji langsung di browser atau HP pengguna. Uji menggunakan cadangan data terlebih dahulu sebelum dipakai untuk transaksi nyata.
