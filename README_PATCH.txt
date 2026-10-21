Universal UMKM Pro v3.3.66 — Patch Tampilan Cara Pembuatan Profesional

Isi ZIP hanya file yang berubah: app.js, index.html, sw.js, README_PATCH.txt.

Perubahan:
- Bagian “Proses Kerja” kini berupa tombol yang dapat diklik untuk membuka/menutup panduan.
- Setelah diklik, muncul “Cara Pembuatan” dengan langkah bernomor otomatis 1, 2, 3, dan seterusnya.
- Nomor tidak perlu diketik pengguna; jika teks lama sudah bernomor, nomor lama dibersihkan pada tampilan agar tidak ganda.
- Pengguna dapat membuka “Edit cara pembuatan” untuk mengubah langkah. Satu baris teks menjadi satu langkah.
- Label status panduan tampil jelas: “Panduan awal — belum divalidasi” atau “Sudah diuji di usaha saya”; status kedua bukan validasi ahli.
- Perubahan ini hanya memperbaiki tampilan dan penyuntingan proses kerja; tidak mengubah resep, stok, pembelian, atau transaksi.
- Cache Service Worker dinaikkan ke v3.3.66.

Cara memasang:
1. Backup data usaha dan repositori terlebih dahulu.
2. Ekstrak ZIP.
3. Ganti app.js, index.html, dan sw.js di repositori aplikasi. File lain tidak berubah.
4. Publish ke GitHub Pages, lalu buka aplikasi saat online.
5. Masuk ke Komposisi Produk, pilih produk, klik “Proses Kerja”, lalu lihat “Cara Pembuatan”.

Pemeriksaan: sintaks JavaScript, sintaks JSON master (jika ada), dan struktur ZIP diperiksa. Belum diuji langsung di HP pengguna.
