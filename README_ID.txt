UNIVERSAL UMKM PRO — ASISTEN USAHA UNIVERSAL v2.2
PWA OFFLINE • DATABASE TERPISAH PER USAHA

ISI PAKET
- index.html: antarmuka responsif HP dan desktop
- app.js: logika aplikasi, IndexedDB, template, transaksi, backup/restore, produk, stok, resep/HPP
- style.css: tampilan
- master.json: 24 template usaha, 624 item awal, dan 65 workflow
- sw.js: cache offline versi 2.2
- manifest.webmanifest dan ikon aplikasi
- AUDIT_PERBAIKAN_v2.2.txt: catatan pembaruan dan batasan pengujian

PERUBAHAN v2.2 — FORM PRODUK
- Informasi Produk/Jasa memiliki tombol Simpan produk.
- Kelola stok memiliki tombol Simpan stok sendiri.
- Resep/Komposisi HPP memiliki tombol Simpan resep/HPP sendiri.
- Status “Ini bahan baku (tidak dijual langsung di kasir)” berada di bawah resep/HPP dan memiliki tombol simpan sendiri.
- Satuan takaran resep mendukung konversi g/ons/kg dan ml/liter, serta satuan yang sesuai dengan satuan dasar bahan.
- Data stok, resep, dan status bahan baku tidak ditimpa saat hanya menyimpan informasi dasar produk.

PERBAIKAN DASAR v2.1 YANG DIPERTAHANKAN
- Skema IndexedDB versi 2 dan indeks businessId pada produk, transaksi, serta detail transaksi.
- Migrasi data lama dan pembacaan data berdasarkan usaha aktif.
- Pembuatan usaha memvalidasi template; harga, HPP, dan stok awal template tetap 0.
- Backup mencakup data usaha dan pemulihan memperbarui status aplikasi.
- Perubahan Master tidak mengubah instance usaha yang sudah dibuat.

CARA MENJALANKAN
PWA memerlukan alamat HTTPS atau localhost untuk service worker. Jangan hanya membuka index.html melalui file manager jika ingin menguji mode offline.
1. Unggah seluruh isi folder ke hosting statis HTTPS atau jalankan server lokal.
2. Buka aplikasi melalui alamat HTTPS/localhost di Chrome.
3. Buat profil usaha, isi nama toko, lalu pilih template.
4. Pada Produk & Jasa, simpan informasi produk dahulu; setelah itu gunakan tombol simpan tersendiri untuk stok, resep/HPP, dan status bahan baku.
5. Buat backup berkala dari menu Profil & Backup.

CATATAN DAN BATASAN
- Pengujian end-to-end penuh di browser belum dilakukan untuk seluruh alur dan perangkat.
- Satuan khusus harus sesuai dengan satuan dasar bahan. Konversi berat dan volume tidak dicampur.
- Pemilih harga 1–24 jenis usaha masih antarmuka lokal. Pembayaran/verifikasi lisensi server belum terhubung.
- Sinkronisasi antarperangkat dan otorisasi server belum dibangun.


VERSI 2.3 — PEMISAHAN DATA OPERASIONAL
- Produk/Jasa menyimpan data jual dan stok produk terpisah; tidak lagi memuat formulir bahan dan komposisi.
- Bahan & Belanja menggunakan tabel bahan baku sendiri, dengan riwayat pembelian dan harga rata-rata tertimbang.
- Komposisi Produk menghubungkan productId ke materialId, memvalidasi satuan sejenis, dan menghitung HPP bahan per unit.
- Investasi & Peralatan menyimpan aset secara terpisah; penyusutan hanya estimasi dan tidak otomatis masuk HPP.
- Database v3 menambahkan materials, materialPurchases, recipes, assets; semua data memiliki businessId dan ikut backup/restore.
- Data bahan/komposisi dari versi lama dimigrasikan saat pembaruan pertama; catatan bahan lama disembunyikan dari menu Produk, tetapi tidak langsung dihapus.
- Catatan: stok bahan belum dikurangi otomatis ketika penjualan terjadi. Untuk menghindari stok keliru, konsumsi bahan perlu ditentukan melalui proses produksi/batch pada pengembangan berikutnya.


VERSI 2.4 — PEMBARUAN BAHAN & BELANJA
- Daftar bahan disajikan sebagai tabel pada desktop dan kartu ringkas pada layar HP.
- Pengguna dapat menambah, mencari, mengedit, mencatat pembelian, dan menonaktifkan bahan.
- Tabel menampilkan kategori, satuan, stok, harga rata-rata, nilai persediaan, dan status stok.
- Nama bahan aktif yang sama dicegah agar tidak tercatat ganda.
- Satuan bahan yang sudah dipakai dalam riwayat belanja atau komposisi tidak bisa diubah, untuk mencegah salah hitung HPP.
- Nonaktifkan bahan tidak menghapus riwayat pembelian. Data tetap dibatasi per usaha dan tersimpan offline.
- Pemeriksaan teknis dilakukan dengan pemeriksaan sintaks JavaScript, validasi master, dan integritas ZIP. Pengujian interaksi browser/perangkat nyata tetap perlu dilakukan.
