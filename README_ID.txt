UNIVERSAL UMKM PRO v3.0
PWA OFFLINE-FIRST • 24 PAKET USAHA • MASTER DATA LENGKAP

ISI PAKET
- index.html: antarmuka responsif HP dan desktop
- app.js: logika aplikasi, IndexedDB, paket usaha, transaksi, stok, resep/HPP, laporan, backup/restore
- style.css: tampilan
- master.json: 24 paket usaha, katalog produk/jasa/bahan/peralatan, harga referensi, 101 template komposisi awal
- sw.js: cache offline v3.0
- manifest.webmanifest dan ikon aplikasi
- AUDIT_PERBAIKAN_v3.0.txt: ringkasan perubahan dan batas pengujian

KONSEP v3.0
1. Penjual aplikasi menyiapkan master katalog produk/jasa, bahan, peralatan, harga referensi, dan komposisi yang relevan.
2. Saat pembeli memilih paket, aplikasi menyalin master ke data usaha pembeli dengan ID operasional baru.
3. Harga referensi bisa diedit. Harga referensi hanya estimasi dan harus disesuaikan dengan pemasok serta harga lokal.
4. Stok awal produk dan bahan selalu nol; aplikasi tidak membuat stok atau transaksi palsu.
5. Produk/jasa disimpan di products; bahan baku di materials; peralatan di assets; komposisi di recipes.
6. HPP bisa otomatis dari komposisi atau manual. HPP manual tidak ditimpa saat harga bahan berubah.
7. Data per usaha dipisahkan oleh businessId. Mengedit usaha tidak mengubah master atau usaha lain.
8. Laporan keuangan memiliki ringkasan, buku kas pemasukan/pengeluaran, dan riwayat.

CARA MENJALANKAN
PWA membutuhkan HTTPS atau localhost untuk service worker.
1. Cadangkan data lama melalui menu Profil & Backup jika sudah ada data penting.
2. Unggah seluruh isi folder Universal_UMKM_PWA_Offline ke hosting HTTPS atau jalankan server lokal.
3. Buka aplikasi melalui alamat HTTPS/localhost dan pastikan terhubung internet saat aset pertama kali dimuat.
4. Lakukan hard refresh (Ctrl+Shift+R) jika browser masih menampilkan versi lama.
5. Buat profil usaha dan pilih jenis usaha. Katalog, harga referensi, bahan, dan komposisi akan disalin ke data usaha baru. Pengguna lama dimigrasikan otomatis dengan menjaga data yang sudah diisi.
6. Periksa harga jual/HPP, koreksi harga bahan dan resep, lalu masukkan stok aktual.
7. Buat backup berkala.

PENTING
- Harga dan komposisi adalah titik awal referensi, bukan jaminan harga pasar atau resep baku.
- Data yang dibuat pada satu perangkat belum tersinkron otomatis ke perangkat lain.
- Pemilih paket 1–24 adalah batas lokal; pembayaran/verifikasi lisensi server belum terhubung.
- Pengujian browser end-to-end di semua perangkat belum dilakukan. Uji transaksi, stok, HPP, backup, dan laporan sebelum dipakai untuk pencatatan usaha nyata.


PEMBARUAN v3.0.3 — PEMBELIAN DAN RIWAYAT
- Tanggal pembelian wajib diisi.
- Simpan Pembelian menambah stok item yang dipilih dan membuat catatan riwayat.
- Riwayat bisa difilter berdasarkan tanggal dan tidak mengubah stok.
- Pembelian barang jual yang mengelola stok (contoh HVS A4/F4 dan toner pada paket fotokopi) juga tersedia dari menu Bahan & Belanja.
- Bahan baru dapat dibuat langsung di formulir pembelian; nama, kategori, dan satuan mengikuti jenis usaha.
- Form pembelian hanya memiliki Simpan Pembelian dan Batal; tidak ada tombol Simpan Bahan.
- Cadangkan data usaha sebelum mengganti file hosting.
