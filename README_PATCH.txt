Universal UMKM Pro v3.3.65 — Patch Cara Membuat / Proses Kerja

Isi ZIP ini adalah patch untuk mengganti file bernama sama pada repositori PWA yang sudah ada.

Perubahan:
- Menambahkan bagian Cara Membuat / Proses Kerja pada halaman Komposisi Produk.
- Setiap resep dengan komposisi yang sudah ada akan mendapat langkah kerja awal sesuai kelompok produk jika belum memiliki instruksi.
- Instruksi otomatis diberi status “Panduan awal — belum divalidasi”.
- Pengguna dapat mengedit langkah dan menandai “Sudah diuji di usaha saya — belum berarti validasi ahli”.
- Langkah kerja dan statusnya disimpan pada catatan resep produk; komposisi, stok, pembelian, dan transaksi lama tidak sengaja dihapus.
- Cache Service Worker dinaikkan ke v3.3.65.

Catatan: instruksi otomatis adalah kerangka proses umum yang harus diedit dan diuji, bukan resep teruji atau nasihat keselamatan pangan. Untuk resep makanan/minuman, tentukan suhu, waktu, dan standar kematangan berdasarkan uji produk dan peralatan nyata.

Cara memasang:
1. Backup data usaha dan salin cadangan repositori.
2. Ekstrak ZIP.
3. Ganti app.js, index.html, dan sw.js dengan file di patch ini. File lain tidak berubah.
4. Publish ke GitHub Pages. Buka aplikasi saat online agar cache diperbarui.
5. Buka Komposisi Produk, pilih produk yang punya komposisi, lalu periksa bagian Cara Membuat / Proses Kerja.
