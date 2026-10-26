Universal UMKM Pro PWA Offline - Patch v3.3.81
Fokus: perbaikan penambahan stok produk dari ruang kerja produk.

Perubahan:
- Ruang kerja setiap produk kini memiliki tombol "Tambah Stok Produk".
- Jumlah yang dimasukkan adalah JUMLAH TAMBAHAN, bukan stok akhir.
- Stok produk bertambah, pengelolaan stok otomatis aktif, dan riwayat stok masuk disimpan.
- Tombol "Penyesuaian Stok" tetap tersedia untuk menyamakan stok aplikasi dengan hasil hitung fisik.
- Riwayat menampilkan stok sebelum/sesudah serta alasan stok masuk.
- Menu utama terpadu per produk dari v3.3.80 tetap dipertahankan.

Cara memasang:
1. Buat backup data di aplikasi sebelum mengganti file.
2. Ekstrak ZIP ini.
3. Ganti app.js, index.html, dan sw.js di root repository GitHub Pages.
4. Commit perubahan dan tunggu GitHub Pages selesai memperbarui.
5. Buka aplikasi, lakukan refresh penuh; jika versi lama masih muncul, tutup aplikasi/PWA lalu buka kembali agar cache service worker diperbarui.
6. Buka Produk/Jasa > pilih produk > tombol Tambah Stok Produk. Masukkan jumlah yang MASUK, misalnya 10, lalu keterangan.

Validasi yang dilakukan pada paket ini:
- `node --check app.js` lulus.
- Integritas ZIP diperiksa dengan `unzip -t`.
- Belum diuji langsung pada browser/HP pengguna.
