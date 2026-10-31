UNIVERSAL UMKM PRO v4.1.3 — PERBAIKAN KATALOG & RESET UJI COBA

BASIS
Dibuat dari Universal_UMKM_Pro_v4_1_2_Draft_Edit(1).zip. Master katalog tetap file master.json terpisah dari data lokal browser.

PERBAIKAN YANG DILAKUKAN
1. Mie Ayam dan Bakso: menambahkan bahan baku khusus mie ayam, topping ayam, bakso, kuah, sayuran, bumbu, pelengkap dan kemasan; menautkan komposisi draft ke bahan paket yang sama; menambahkan alur kerja. Teh botol kemasan diarsipkan dari produk racikan.
2. Nasi Goreng & Olahan Mi: nama paket disesuaikan dengan isi menu nasi goreng, mie, kwetiau, bihun dan minuman; menambahkan bahan yang sesuai, komposisi draft dan alur kerja.
3. Warung Seblak: menambahkan bahan untuk seblak, ceker/tulangan/suki, camilan pendamping dan minuman; menautkan resep draft serta alur kerja. Harga jual yang telah tercantum pada produk tambahan dipertahankan. Air mineral botol diperlakukan sebagai barang beli-jual, bukan resep produksi.
4. Teh, Susu & Minuman Kekinian: mengarsipkan bahan generik yang tidak cocok (misalnya tepung ketan, kelapa parut, telur dan minyak goreng) dan menggantinya dengan teh, gula, susu, cokelat, Thai tea, green tea, boba, cincau, es dan kemasan; komposisi draft ditautkan sesuai jenis minuman.
5. Semua resep baru tetap kuantitas 0 dan status referensi awal belum terverifikasi. Tidak ada takaran, harga bahan, atau HPP yang dikarang.

CATATAN AUDIT
Paket aktif lainnya tetap tersedia seperti pada ZIP sumber. Paket-paket tersebut belum dinyatakan lolos audit operasional menyeluruh; katalog usaha memerlukan pemeriksaan nyata per jenis usaha. File AUDIT_PERBAIKAN_V4_1_3.csv merinci jumlah item, bahan, resep dan alur aktif per paket.

CARA RESET DATA UJI COBA
1. Buka aplikasi v4.1.3 di perangkat/browser yang digunakan untuk uji coba.
2. Masuk menu Profil & Backup.
3. Pada bagian data lokal, tekan Hapus data lokal.
4. Baca konfirmasi RESET DATA UJI COBA, lalu setujui bila benar-benar ingin mulai dari awal.
5. Muat ulang aplikasi. Pilih kembali jenis usaha dan buat profil usaha baru.

APA YANG DIHAPUS
Daftar/profil usaha lokal, produk, transaksi, detail transaksi, bahan, riwayat pembelian bahan, resep yang disimpan pengguna, aset, pengeluaran, produksi, pengaturan dan slot lisensi lokal.

APA YANG TIDAK DIHAPUS
File master.json yang berisi katalog MASTER tidak dihapus oleh tombol reset. Setelah aplikasi dimuat ulang, katalog master dibaca kembali. Reset ini hanya berlaku pada perangkat/browser tempat tombol ditekan; perangkat lain tidak ikut ter-reset.

PENTING
Pengguna menyatakan aplikasi masih tahap uji coba dan belum ada transaksi. Meski demikian, reset tetap menghapus seluruh data lokal dan tidak dapat dibatalkan. Jangan hapus data situs/browser atau IndexedDB secara manual; gunakan tombol aplikasi agar semua store yang dikenal aplikasi dibersihkan dengan benar.

VALIDASI
File master.json diuji parse JSON; semua ID item/resep/workflow unik; seluruh resep aktif harus merujuk produk aktif dan bahan aktif dalam paket yang sama; sintaks app.js dan sw.js diperiksa dengan node --check; ZIP diuji integritasnya. Validasi ini bukan pengujian browser end-to-end.
