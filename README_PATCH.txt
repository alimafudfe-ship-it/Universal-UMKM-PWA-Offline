Universal UMKM Pro v3.3.84 — Riwayat Pembelian Ringkas

Perubahan:
- Riwayat pembelian tidak ditampilkan otomatis pada halaman Bahan & Belanja.
- Tombol “Riwayat Pembelian” membuka tampilan khusus yang hanya menampilkan daftar riwayat dan filter tanggal.
- Tombol “Kembali ke Pembelian” mengembalikan formulir pembelian dan tabel stok.
- Perubahan hanya pada tampilan; data riwayat tidak dihapus dan membuka riwayat tidak menambah stok.
- Logika stok kasir dari versi sebelumnya dipertahankan.

Pemasangan:
1. Ekspor backup dari Profil & Backup terlebih dahulu.
2. Ganti app.js, index.html, dan sw.js di root repository.
3. Commit/push, tunggu GitHub Pages selesai.
4. Di desktop tekan Ctrl+Shift+R. Di HP tutup PWA, buka ulang, lalu bila perlu buka situs dari browser dan refresh.

Validasi lokal: pemeriksaan sintaks JavaScript dan integritas ZIP. Belum diuji langsung pada perangkat pengguna.
