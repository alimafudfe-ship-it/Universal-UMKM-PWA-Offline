Universal UMKM Pro v3.3.72 — Perbaikan pilihan duplikat Bahan & Belanja (Gorengan & Camilan)

Perubahan utama:
- Penyaringan daftar stok dan pilihan pembelian sekarang menganggap nama sama dengan satuan yang kompatibel sebagai satu pilihan, meskipun data lama tersimpan sebagai record bahan dan produk berbeda.
- Tidak menggabungkan otomatis satuan yang tidak kompatibel, untuk menghindari stok salah (contoh kg dan butir).
- Cache service worker dan versi halaman dinaikkan agar perangkat meminta file terbaru.
- Riwayat pembelian lama tidak dihapus.

Pemasangan:
1. Backup data lewat Profil & Backup.
2. Ekstrak ZIP dan unggah/commit app.js, index.html, sw.js, dan master.json ke root repositori GitHub Pages, timpa file lama.
3. Tunggu deployment GitHub Pages selesai. Di desktop buka situs lalu Ctrl+Shift+R. Di HP tutup PWA sepenuhnya, buka ulang saat online dan tunggu sampai selesai memuat.
4. Buka paket Gorengan & Camilan, periksa Bahan & Belanja serta pilihan pembelian.

Catatan: Patch memperbaiki tampilan/pilihan yang dobel untuk nama dan satuan kompatibel. Belum diuji dengan database lokal pengguna secara langsung. Setelah pemasangan, pastikan satu bahan hanya muncul sekali dan stok/HPP tetap benar.
