Universal UMKM Pro v3.3.79 — Ruang Kerja Terpadu per Produk

TUJUAN
Memudahkan pengguna mengelola produk dari satu titik. Setelah memilih produk, pengguna dapat langsung membuka bahan/belanja yang digunakan produk tersebut atau membuka komposisi/HPP untuk produk yang sama.

PERUBAHAN
- Menambahkan tombol “Kelola” pada setiap produk di menu Produk & Jasa.
- Halaman ruang kerja produk menampilkan harga jual, HPP, status komposisi, dan stok produk.
- Tombol “Bahan & Belanja” membuka daftar stok dengan filter ke bahan yang digunakan produk terpilih. Pembelian dan catatan stok tetap terpusat; bahan yang dipakai beberapa produk tidak digandakan.
- Tombol “Komposisi Produk & HPP” membuka komposisi dengan produk yang sama sudah dipilih.
- Tombol “Edit produk” tetap tersedia dari ruang kerja.
- Tombol “Daftar produk” kembali ke katalog produk.
- Memperbarui versi tampilan dan cache service worker agar file baru dapat dimuat.
- Tidak mengubah data lokal, skema database, daftar produk, harga paket, atau rumus HPP.

CARA MEMASANG
1. Cadangkan data aplikasi dari menu Profil & Backup sebelum mengganti file.
2. Buka repositori GitHub Pages Universal-UMKM-PWA-Offline.
3. Ganti file app.js, index.html, dan sw.js di root repositori menggunakan tiga file dari ZIP ini.
4. Commit perubahan dan tunggu GitHub Pages selesai diperbarui.
5. Buka aplikasi saat online agar file versi baru terunduh. Jika tampilan lama masih muncul, tutup PWA sepenuhnya lalu buka lagi.

CARA UJI
1. Buka Produk & Jasa, lalu tekan “Kelola” pada Pecel Lele.
2. Pastikan ringkasan harga jual, HPP, komposisi, dan stok tampil.
3. Tekan “Bahan & Belanja”; filter seharusnya otomatis memilih Pecel Lele dan menampilkan bahan komposisinya.
4. Kembali ke Produk & Jasa, tekan “Kelola” lagi, lalu tekan “Komposisi Produk & HPP”; Pecel Lele seharusnya sudah terpilih.
5. Kembali ke daftar produk dan pastikan fitur Edit dan Hapus masih ada.
6. Pastikan pembelian bahan yang sama tidak membuat catatan stok terpisah untuk setiap produk.

VALIDASI
- Pemeriksaan sintaks JavaScript dengan Node.js: lulus.
- Struktur ZIP dan keberadaan tiga file aplikasi: diperiksa.
- Belum diuji langsung pada browser/HP pengguna. Uji terlebih dahulu dengan backup dan jangan gunakan untuk transaksi nyata sebelum alur diuji.
