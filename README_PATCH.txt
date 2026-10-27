Universal UMKM Pro v3.3.86 — Perbaikan Stok Awal Produk

Isi ZIP: app.js, index.html, sw.js.

Perubahan utama:
- Komposisi/resep disimpan di dalam data produk sebagai snapshot nama bahan, takaran, satuan, dan biaya; tidak membuat atau memerlukan catatan Bahan & Belanja.
- HPP tetap dihitung otomatis dari harga dan takaran yang diisi pada resep.
- Penjualan tidak mengurangi stok bahan dari resep mandiri. Stok produk jadi berkurang jika stok produk diaktifkan.
- Data resep lama dikonversi menjadi resep mandiri saat aplikasi dibuka. Catatan stok bahan dan riwayat pembelian yang sudah ada tidak dihapus atau diubah.
- Mempertahankan perubahan v3.3.84 untuk menyembunyikan riwayat pembelian secara default.

Pemasangan:
1. Buat backup data usaha melalui Profil & Backup.
2. Ganti app.js, index.html, dan sw.js di root repositori dengan file dari ZIP.
3. Commit/publish, lalu buka aplikasi online sekali agar service worker mendapat versi baru.
4. Periksa Produk > Komposisi Produk & HPP, lalu uji penjualan dan pembelian.

Catatan: pemeriksaan sintaks/arsip dilakukan secara lokal; belum diuji langsung di perangkat HP atau browser produksi.


Perbaikan v3.3.86:
- Produk template dengan stok positif tetapi tanpa catatan pembelian, stok masuk/produksi, atau penyesuaian stok dikembalikan ke stok 0 satu kali.
- Produk yang memiliki riwayat stok berdasarkan ID atau nama tetap dipertahankan agar stok nyata tidak terhapus.
- Riwayat transaksi penjualan tidak dihapus.
