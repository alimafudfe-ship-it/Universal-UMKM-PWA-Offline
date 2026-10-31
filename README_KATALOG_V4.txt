UNIVERSAL UMKM PRO v4.0.1 — AUDIT KATALOG DIKOREKSI
==========================================================

Paket ini memperbaiki klasifikasi katalog setelah ditemukan contoh fatal: Es Doger Keliling menampilkan lilin aromaterapi/lilin jar. Akar masalahnya ialah klasifikasi berdasarkan jenis kanal jual (keliling/gerobak) dan template katalog generik, bukan produk inti.

FILE UTAMA
- master.json: 300 profil, katalog aktif hasil koreksi, dan item lama yang dipertahankan nonaktif.
- app.js / index.html / sw.js / style.css: aplikasi dan migrasi katalog versi 4.0.1.
- AUDIT_MENDALAM_KATALOG_V4_0_1.txt: ringkasan audit dan batas validasi.
- AUDIT_KATALOG_300_V4_0_1.csv: hasil audit tiap profil.
- KATALOG_300_PENGELOMPOKAN.csv: kelompok, produk/bahan/alat/resep aktif tiap profil.
- KATALOG_MIGRASI_V4_0_1.csv: ID lama dipertahankan nonaktif, item baru memakai ID baru.
- QA_UJI_ALUR_KASIR_STOK_HPP_LABA.csv: daftar uji per 300 profil.

PENTING: Semua item lama tidak dihapus, tetapi dinonaktifkan di master agar ID historis tetap ada. Item aktif baru menggunakan ID baru. Pada profil lokal yang sudah ada, migrasi mengarsipkan produk/bahan master lama yang tidak cocok (active=false; forSale=false untuk produk), mempertahankan ID dan catatan transaksi, lalu menambahkan katalog aktif baru. Lakukan backup sebelum upgrade.

RESEP: Semua resep yang baru dibuat berstatus draft dan kuantitas 0 karena takaran tidak boleh direkayasa. Lengkapi takaran, satuan, hasil jadi, susut, dan harga beli aktual sebelum produksi/HPP dinyatakan benar.

VALIDASI: JSON valid, sintaks app.js dan sw.js valid, ID unik, semua resep aktif terhubung ke produk dan bahan aktif dalam paket yang sama, dan uji khusus Es Doger memastikan tidak ada lilin aromaterapi pada katalog aktif. Belum ada pengujian browser end-to-end; jalankan QA manual sebelum dipakai pada transaksi nyata.
