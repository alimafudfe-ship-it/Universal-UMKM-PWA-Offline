Universal UMKM Pro v3.3.89 — Perbaikan HPP Bertambah Saat Refresh

Berdasarkan v3.3.88.

Perbaikan:
- Memperbaiki migrasi kelengkapan resep: nama bahan yang sudah tersimpan di format resep mandiri kini ikut diperiksa, sehingga bahan template tidak ditambahkan ulang setiap aplikasi dibuka. Ini mencegah HPP bertambah berulang setelah refresh.
- Menyamakan nomor versi aplikasi, HTML, dan cache service worker ke v3.3.89.
- Filter “Bahan berdasarkan produk” kini membaca komposisi resep mandiri (format nama, takaran, satuan, dan harga bahan) yang digunakan sejak v3.3.85.
- Jika nama bahan resep sudah ada sebagai catatan stok Bahan/Belanja aktif, baris menampilkan catatan stok tersebut.
- Jika bahan resep belum didaftarkan sebagai catatan stok, bahan tetap ditampilkan sebagai “Bahan resep (mandiri)” beserta takaran resep, dan diberi keterangan bahwa stoknya belum dikelola.
- Baris resep mandiri yang belum didaftarkan sebagai stok tidak memiliki tombol edit, barang masuk, koreksi, atau hapus sehingga tidak membuat perubahan stok yang keliru.
- Teks bantuan menjelaskan bahwa resep mandiri digunakan untuk HPP; untuk mengelola pembelian/stok bahan, bahan harus didaftarkan di Bahan/Belanja.
- Tidak mengubah atau menghapus resep, stok, riwayat pembelian, riwayat penjualan, atau data usaha yang sudah ada.
- Cache service worker dinaikkan ke v3.3.89.

Pemasangan:
1. Buat backup data usaha terlebih dahulu.
2. Ekstrak ZIP.
3. Ganti app.js, index.html, dan sw.js di root repositori GitHub dengan file di ZIP.
4. Commit/publish dan tunggu GitHub Pages selesai.
5. Buka ulang aplikasi, pilih Bahan/Belanja, lalu pilih produk Bakwan pada filter. Bahan komposisi resep seharusnya tampil meskipun belum terdaftar sebagai stok.

Validasi: pemeriksaan sintaks JavaScript, konsistensi versi, dan integritas ZIP. Belum diuji langsung di browser/HP dengan database pengguna.
