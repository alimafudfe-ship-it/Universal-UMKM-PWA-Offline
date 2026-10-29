Universal UMKM Pro PWA Offline — v3.3.103
Perbaikan Bahan/Belanja, Komposisi, dan Sumber Resmi

ISI PAKET
- index.html, style.css, app.js, sw.js: aplikasi PWA
- master.json: katalog paket usaha, bahan baku, komposisi acuan, dan sumber resmi
- ikon dan manifest: aset instalasi PWA

PERUBAHAN UTAMA
1. Bahan/Belanja menampilkan bahan baku dan barang stok tanpa harus memilih produk terlebih dahulu.
2. Produk jadi yang memiliki komposisi tidak dimunculkan lagi sebagai barang pembelian/stok kedua. Saat produk dipilih pada filter Bahan/Belanja, daftar berubah menjadi bahan komposisi produk itu.
3. Katalog master kini memiliki 788 item template, 82 komposisi acuan untuk produk yang dibuat/diracik, dan 5 sumber resmi.
4. Komposisi template menyimpan metadata sumber dan status sebagai referensi awal yang dapat diedit.
5. Halaman Komposisi Produk & HPP menampilkan tautan sumber resmi Kementerian Pertanian dan BPOM beserta ruang lingkup penggunaannya.
6. Cache PWA diperbarui ke build v3.3.103.

CATATAN PENTING
- Takaran komposisi adalah takaran awal untuk membantu memulai pengisian, bukan formula resmi yang disahkan pemerintah. Uji dan sesuaikan resep, hasil jadi, dan biaya aktual usaha sebelum dipakai sebagai standar HPP.
- Sumber Kementerian Pertanian membahas pembuatan nugget ayam. Jangan menerapkannya sebagai resep semua produk atau pada nugget bermerek yang dibeli untuk dijual kembali.
- Sumber BPOM digunakan sesuai cakupannya: penanganan pangan beku, kategori/registrasi, pangan siap saji terkemas, dan penetapan masa simpan. Jangan menetapkan masa simpan/kedaluwarsa hanya berdasarkan perkiraan.
- Produk yang dibeli untuk dijual kembali (misalnya barang retail, air mineral kemasan, dan frozen food bermerek) tetap dikelola sebagai barang dagangan, bukan diberi resep buatan sendiri.
- Data transaksi, stok, pembelian, dan usaha pengguna berada di IndexedDB lokal; paket ini tidak membawa database transaksi pengguna. Tetap lakukan backup sebelum mengganti file aplikasi.

PEMASANGAN
- Untuk uji lokal, ekstrak seluruh isi folder ini ke folder PWA yang sama.
- Untuk GitHub Pages, unggah file-file paket ke repositori PWA yang digunakan, lalu tunggu deployment selesai.
- Setelah deployment, buka aplikasi dalam keadaan online sekali agar file baru terunduh; lalu muat ulang. Jika versi lama tetap muncul, tutup aplikasi PWA dan buka kembali setelah cache diperbarui.

PENGUJIAN YANG DILAKUKAN
- Pemeriksaan sintaks JavaScript dengan node --check app.js.
- Pemeriksaan JSON dan integritas referensi item/komposisi.
- Pemeriksaan integritas arsip ZIP.
- Pengujian interaksi browser dan uji fisik alur stok belum dilakukan di sesi ini; lakukan backup dan uji transaksi dummy sebelum digunakan untuk transaksi nyata.
