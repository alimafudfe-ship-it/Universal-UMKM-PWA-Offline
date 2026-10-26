Universal UMKM Pro v3.3.83 — Mode Stok Kasir

Perbaikan utama:
- Form Edit Produk/Jasa memiliki pilihan Mode stok.
- Barang jadi/barang dagangan: Kasir mengurangi stok produk saat transaksi berhasil disimpan, termasuk produk yang juga memiliki komposisi.
- Dibuat setelah pesanan: Kasir tidak mengurangi stok produk jadi; Kasir mengurangi bahan sesuai komposisi.
- Pemeriksaan stok pada tambah item dan ubah jumlah keranjang mengikuti mode stok.
- Untuk produk lama tanpa mode tersimpan: produk dengan komposisi dan stok 0 diasumsikan dibuat setelah pesanan; produk lain diasumsikan barang jadi. Silakan periksa Mode stok saat Edit Produk/Jasa.

Pemasangan:
1. Ekspor backup dari Profil & Backup terlebih dahulu.
2. Ganti app.js, index.html, dan sw.js di root repository.
3. Commit/push, tunggu GitHub Pages selesai.
4. Di desktop tekan Ctrl+Shift+R. Di HP tutup PWA, buka ulang, lalu bila perlu buka situs dari browser dan refresh.

Validasi lokal: node --check app.js dan unzip -t ZIP. Belum diuji langsung pada perangkat pengguna.
