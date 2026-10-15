UNIVERSAL UMKM PRO v3.1.3
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


PEMBARUAN v3.0.5 — KOMPOSISI SESUAI JENIS USAHA
- Menu Komposisi Produk mengikuti pengaturan di Profil & Backup.
- Pilihan: Otomatis sesuai jenis usaha, Aktifkan, atau Sembunyikan.
- Mode otomatis menampilkan komposisi untuk jenis usaha makanan/minuman/kue/produksi yang dikenali. Jenis usaha lain dapat mengaktifkannya sendiri.
- Menyembunyikan menu tidak menghapus resep/komposisi tersimpan. Tidak ada migrasi database atau penghapusan data produk, pembelian, stok, transaksi, maupun riwayat.

PEMBARUAN v3.0.6 — KOMPOSISI BISA DIKETIK
- Nama produk/paket bisa diketik langsung; produk baru dibuat ketika komposisi disimpan.
- Nama bahan bisa diketik; bahan yang sudah ada digunakan kembali, bahan baru dibuat saat disimpan.
- Kolom komposisi: bahan/produk, jumlah & satuan, harga per satuan.
- Satuan butir untuk telur dapat dipakai; stok bahan baru tetap nol.
- Database dan riwayat lama tidak dihapus.


PEMBARUAN v3.0.8 — STANDAR PERMANEN DATA AMAN
- Pembaruan aplikasi tidak boleh menghapus atau membuat ulang usaha pengguna secara otomatis.
- Usaha tersimpan tetap dibuka melalui daftar USAHA TERSIMPAN; memilih jenis usaha yang sudah dibuat membuka usaha tersebut, bukan membuat duplikat.
- Jenis usaha baru yang tersedia di master dapat dipilih untuk membuat usaha baru, tanpa mengubah data usaha yang sudah ada.
- Data produk, harga, stok, bahan, komposisi, pembelian, penjualan, pengeluaran, aset, dan riwayat wajib dipertahankan.
- Perubahan database harus menggunakan migrasi yang mempertahankan data; jangan menaikkan DB_VERSION dengan menghapus object store atau memanggil clear() pada saat pembaruan.
- Perubahan master hanya boleh menambahkan item yang belum ada dan tidak boleh menimpa nilai yang telah diedit pengguna. Jika migrasi tidak aman atau gagal, hentikan migrasi dan tampilkan pesan; jangan melanjutkan dengan penghapusan data.
- Setiap rilis wajib diuji dengan data contoh: buka usaha lama, buat usaha baru, pastikan data usaha terpisah, cek stok/pembelian/riwayat, ekspor dan impor cadangan.
- Jangan menghapus data lokal saat memasang versi baru. Ekspor cadangan sebelum mengganti file hosting.
- Versi ini tidak mengubah struktur database IndexedDB (DB_VERSION tetap 4); perubahan ini memperbarui label versi, cache service worker, dan dokumentasi standar rilis.


PEMBARUAN v3.0.9 — KODE TRANSAKSI PER TOKO
- Kode transaksi baru memakai dua karakter awal nama toko dan nomor urut 7 digit, contoh AZ-0000001.
- Penjualan, pembelian, dan pengeluaran memakai satu urutan nomor per toko. Nomor dapat bertambah melewati 9.999.999 dengan menambah digit otomatis.
- Penghitung disimpan bersama profil usaha dan dialokasikan secara atomik dalam transaksi database agar nomor tidak dipakai ulang ketika transaksi tersimpan.
- Kode transaksi lama tidak diubah; ID internal penjualan dan hubungan rincian transaksi tetap dipertahankan. Migrasi menghitung nomor berikutnya dari kode yang sudah ada tanpa menghapus data.
- Awalan kode yang sudah dibuat tidak berubah saat nama toko diedit. Setiap toko memiliki penghitung terpisah. Saat restore cadangan dengan ID usaha sama, penghitung yang lebih tinggi pada perangkat tidak diturunkan.


PEMBARUAN v3.1.3 — WIZARD PANDUAN MEMULAI USAHA
- Usaha baru langsung membuka Panduan Usaha bertahap setelah profil dan katalog awal berhasil dibuat.
- Panduan meliputi profil, produk/jasa, harga dan modal, bahan/perlengkapan, stok awal, komposisi/resep jika relevan, kasir, dan laporan.
- Langkah komposisi disesuaikan dengan jenis usaha dan dapat dilewati bila tidak diperlukan.
- Tombol panduan membuka fitur aplikasi terkait; pengguna menandai langkah selesai sendiri setelah memeriksa data.
- Progres panduan disimpan di properti setupWizard pada profil usaha dalam store settings yang sudah ada. Tidak ada object store baru, tidak ada perubahan DB_VERSION, dan tidak ada penghapusan data usaha.
- Progres terpisah per profil usaha. Mengulang panduan hanya mereset status panduan, tidak mengubah produk, harga, stok, bahan, resep, transaksi, pembelian, aset, atau pengeluaran.
- Pengguna usaha lama dapat membuka Panduan Usaha dari navigasi; progres awalnya kosong dan tidak memengaruhi data lama.


PEMBARUAN v3.1.3 — PANDUAN KHUSUS PER JENIS USAHA
- Menu Panduan Usaha tetap tersedia dari navigasi di setiap profil usaha; panduan tidak memaksa pengguna ketika membuka aplikasi.
- Setiap panduan menampilkan tepat 8 langkah: profil, pengaturan usaha, produk/jasa, harga/modal, bahan dan stok, fokus khusus usaha, transaksi, serta laporan.
- Langkah fokus menyesuaikan 24 paket, termasuk kuliner, katering, depot air, frozen food, konter HP, laundry, makanan online, percetakan/fotokopi, pet shop, salon, kosmetik, bakery, pakaian, retail, sembako/grosir, serta berbagai jenis makanan/minuman.
- Progres disimpan pada profil usaha yang sudah ada; ID langkah lama yang masih dipakai dipertahankan. Data progres lama yang tidak lagi ditampilkan tidak dihapus dari profil.
- Tidak ada perubahan skema database, DB_VERSION tetap 4, dan tidak ada operasi penghapusan/penulisan ulang produk atau transaksi saat panduan dibuka.
- Cache service worker dinaikkan untuk memastikan file baru dapat dimuat.


Versi v3.1.5: formulir pembelian menggunakan harga beli per satuan dan total otomatis; data lokal tidak direset. Lihat PERBAIKAN_PEMBELIAN_v3.1.5.txt.


VERSI TERBARU: v3.3.19
Perubahan: menu jadi seperti Jus Alpukat, Jus Mangga, Jus Jambu, dan Es Campur tidak ditampilkan sebagai bahan/opsi belanja pada jenis usaha Jus Buah & Es Campur. Data lama tidak dihapus; riwayat tetap disimpan. Lihat PERBAIKAN_BAHAN_JUS_v3.3.19.txt dan CHECKLIST_RILIS_v3.3.19.txt.
