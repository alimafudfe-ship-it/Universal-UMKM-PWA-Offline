Universal UMKM Pro v3.3.80 — Menu Utama Ringkas & Ruang Kerja Produk

TUJUAN
Menghilangkan menu Bahan & Belanja dan Komposisi Produk dari navigasi utama. Pengguna masuk melalui Produk/Jasa, memilih produk, lalu membuka bahan/belanja atau komposisi dari ruang kerja produk.

PERUBAHAN
- Menu utama kini berisi 7 item: Jenis Usaha, Panduan Usaha, Produk/Jasa, Investasi & Peralatan, Kasir, Laporan, Profil & Backup.
- Menu Bahan & Belanja tetap tersedia sebagai halaman internal yang dibuka dari ruang kerja produk; tidak dihapus dan data stok/pembelian tidak dihapus.
- Menu Komposisi Produk & HPP tetap tersedia sebagai halaman internal dari ruang kerja produk; data resep dan HPP tidak dihapus.
- Ditambahkan tombol kembali ke Produk/Jasa pada halaman Bahan & Belanja dan Komposisi Produk. Jika sebelumnya memilih produk tertentu, ruang kerja produk itu tetap dipertahankan.
- Stok bahan tetap terpusat; bahan bersama tidak dibuat ganda untuk setiap produk.
- Memperbarui nomor versi dan cache service worker agar file terbaru dimuat.
- Tidak mengubah skema database, data lokal, produk, harga paket, atau perhitungan HPP.

PEMASANGAN
1. Backup data dari Profil & Backup.
2. Ganti app.js, index.html, dan sw.js di root repositori GitHub Pages dengan file dari ZIP ini.
3. Commit perubahan, tunggu GitHub Pages diperbarui, lalu buka aplikasi saat online.
4. Jika PWA masih menampilkan versi lama, tutup aplikasi sepenuhnya lalu buka kembali.

UJI YANG DISARANKAN
1. Pastikan navigasi utama hanya menampilkan 7 menu yang disebut di atas.
2. Buka Produk/Jasa > Kelola > Pecel Lele > Bahan & Belanja; pastikan filter bahan mengikuti Pecel Lele.
3. Tekan Kembali ke Produk/Jasa; pastikan ruang kerja Pecel Lele masih terbuka.
4. Buka Komposisi Produk & HPP; pastikan Pecel Lele terpilih. Kembali lagi dan pastikan ruang kerja tetap terbuka.
5. Cek riwayat pembelian, stok, komposisi, dan HPP tidak hilang.

VALIDASI
Pemeriksaan sintaks JavaScript dan struktur ZIP dilakukan. Belum diuji langsung di browser/HP pengguna. Backup dan uji sebelum dipakai untuk transaksi nyata.
