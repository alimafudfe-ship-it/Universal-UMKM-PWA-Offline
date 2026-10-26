Universal UMKM Pro v3.3.77 — Patch alur bahan per produk

TUJUAN
Memperjelas cara mengisi bahan dan komposisi satu produk pada satu waktu, misalnya Pecel Lele.

ISI PATCH
- app.js: menampilkan nama produk aktif di bagian komposisi.
- index.html: panduan pengisian bahan per produk; memperjelas bahwa takaran diisi untuk satu produk/porsi; memperbarui petunjuk stok resep.
- sw.js: versi cache baru agar browser mengambil file terbaru.
- Katalog master dan data bisnis tidak diubah pada patch ini.
- Harga paket tidak diubah.

CARA MEMASANG
1. Cadangkan data dari menu Profil & Backup sebelum mengganti file.
2. Salin app.js, index.html, dan sw.js ke root repositori Universal-UMKM-PWA-Offline, timpa file lama.
3. Commit/push perubahan dan tunggu GitHub Pages selesai diperbarui.
4. Buka aplikasi saat online sekali agar file baru terunduh. Jika masih tampak versi lama, tutup aplikasi/PWA sepenuhnya lalu buka lagi.
5. Uji menu Komposisi Produk: pilih Pecel Lele, isi bahan per satu porsi, simpan; kemudian pilih produk lain dan pastikan komposisinya terpisah.
6. Uji penjualan satu porsi dan periksa apakah stok bahan yang digunakan berkurang sesuai resep.

CATATAN
Patch ini memperjelas antarmuka dan petunjuk; sistem komposisi per productId dan pengurangan stok bahan pada kasir sudah ada pada basis v3.3.76. Pemeriksaan yang dilakukan: validasi sintaks JavaScript, referensi elemen UI, dan integritas ZIP. Belum diuji di browser/ponsel pengguna. Uji dengan salinan data/backup sebelum dipakai untuk transaksi nyata.
