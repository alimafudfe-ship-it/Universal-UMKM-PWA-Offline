UNIVERSAL UMKM PRO v3.3.76 — AUDIT KATALOG 25 JENIS USAHA

Isi patch: app.js, index.html, master.json, sw.js.

Tujuan:
- Memperluas katalog produk/jasa pada semua 25 jenis usaha.
- Menambah bahan baku/pendukung yang sesuai dengan katalog masing-masing.
- Menambah resep acuan untuk produk makanan yang dibuat dari bahan, bukan untuk barang dagangan siap jual/minuman sederhana.
- Menjalankan migrasi master versi 5: katalog yang belum ada ditambahkan ke profil usaha yang tersimpan tanpa menimpa baris produk/bahan yang sudah ada.

PENTING:
- Harga dan takaran resep adalah referensi awal, bukan harga pasar yang dijamin dan bukan resep tervalidasi. Pemilik usaha harus menyesuaikan harga beli, harga jual, satuan, dan takaran aktual.
- Backup data aplikasi sebelum mengganti file.
- Upload ke folder utama GitHub Pages, lalu tunggu deploy dan buka aplikasi online agar master baru terunduh.
- Uji kasir, HPP, dan pengurangan stok sebelum dipakai untuk transaksi nyata.
- Tidak mengubah aturan harga paket.


CATATAN PERHITUNGAN: Resep baru ditandai formula_awal_perlu_uji_dapur. Satuan baris resep diselaraskan dengan satuan stok bahan agar tidak gagal saat kasir; pemilik usaha wajib memeriksa takaran dan HPP sebelum digunakan. Produk dengan komposisi mengonsumsi bahan, bukan stok produk jadi, untuk menghindari stok ganda.
