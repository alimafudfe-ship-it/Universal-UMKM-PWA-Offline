Universal UMKM Pro v3.3.67 — Patch Perbaikan Tombol Proses Kerja

Isi ZIP: app.js, index.html, sw.js, README_PATCH.txt.

Perbaikan:
- Memperbaiki event klik tombol Proses Kerja agar membuka/menutup bagian Cara Pembuatan dengan aman.
- Memperbaiki referensi versi app.js di index.html yang sebelumnya masih menunjuk ke v3.3.65; sekarang v3.3.67 agar browser mengambil JavaScript terbaru.
- Menaikkan versi cache Service Worker ke v3.3.67 agar cache lama dibersihkan saat versi baru diaktifkan.
- Tidak mengubah data produk, komposisi, stok, pembelian, atau transaksi.

Cara memasang:
1. Backup repositori dan data usaha terlebih dahulu.
2. Ekstrak ZIP ini.
3. Ganti app.js, index.html, dan sw.js di repositori GitHub Pages dengan file dari ZIP.
4. Commit/publish perubahan, lalu tunggu GitHub Pages selesai memperbarui.
5. Buka aplikasi saat online dan refresh. Jika masih versi lama, tutup tab aplikasi lalu buka lagi; di Chrome dapat lakukan hard refresh (Ctrl+F5).
6. Masuk ke Komposisi Produk, pilih produk, lalu klik Proses Kerja. Bagian Cara Pembuatan seharusnya terbuka.

Pemeriksaan: node --check app.js dan sw.js, pemeriksaan struktur ZIP. Belum diuji langsung pada browser/HP pengguna.
