Universal UMKM Pro v3.3.96 — Komposisi Panduan dan Produksi

Patch ini berdasarkan v3.3.95. Ganti file app.js, index.html, dan sw.js pada salinan aplikasi yang sudah ada.

Perubahan utama:
- Bahan & Belanja mencatat pembelian dan persediaan bahan baku/barang dagangan. Pembelian menambah stok satu kali.
- Komposisi hanya menjadi panduan resep dan perhitungan HPP; penjualan di kasir tidak lagi mengurangi stok bahan atau memicu permintaan pembelian bahan.
- Penjualan tetap mengurangi stok produk jadi yang stoknya diaktifkan.
- Fungsi barang masuk produk yang sudah ada diperjelas menjadi Produksi / Tambah Stok Produk Jadi; jumlah hasil produksi ditambahkan ke stok dan dicatat dalam riwayat.
- Nama cache service worker diperbarui.

Sebelum mengganti file, buat backup data aplikasi. Jangan hapus data situs/IndexedDB. ZIP ini adalah patch file, bukan paket aplikasi lengkap.
Pemeriksaan: sintaks JavaScript dan integritas ZIP diperiksa. Belum dilakukan uji langsung di browser.
