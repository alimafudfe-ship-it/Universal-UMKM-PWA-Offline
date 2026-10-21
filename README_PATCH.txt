Universal UMKM Pro v3.3.71 — Patch duplikasi Bahan & Belanja

Isi patch: app.js, index.html, sw.js, master.json.

Perbaikan:
- Melanjutkan migrasi v3.3.70 untuk menggabungkan bahan aktif bernama sama dengan satuan yang kompatibel dan merapikan baris komposisi ganda.
- Menambahkan penyaringan cadangan pada daftar Bahan & Belanja dan pilihan pembelian agar record dengan jenis, nama, dan satuan stok yang sama tidak ditampilkan berulang.
- Pilihan pembelian tetap mengarah ke satu record bahan/produk; stok duplikat yang kompatibel dirapikan oleh migrasi data, bukan sekadar disembunyikan.
- Riwayat pembelian tidak dihapus karena setiap baris merupakan transaksi historis.
- Versi halaman dan cache service worker dinaikkan ke v3.3.71 agar perangkat mengambil file terbaru.

Cara memasang:
1. Buat backup data dari menu Profil & Backup.
2. Ekstrak ZIP ini dan unggah/commit semua file di dalamnya ke root repositori GitHub Pages, menimpa file lama.
3. Buka aplikasi saat online lalu tekan Ctrl+Shift+R. Di HP, tutup aplikasi/PWA sepenuhnya, buka kembali saat online, dan tunggu pemuatan selesai.
4. Periksa Bahan & Belanja, pilihan bahan pada formulir pembelian, dan komposisi Gorengan & Camilan.

Catatan pengujian: pemeriksaan sintaks dan integritas ZIP dilakukan secara lokal. Belum diuji melalui transaksi langsung pada perangkat pengguna.
