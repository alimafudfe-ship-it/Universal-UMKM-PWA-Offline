Universal UMKM Pro v3.3.99 — Tambah Bahan Mandiri

Patch lanjutan dari v3.3.98. Ganti app.js, index.html, dan sw.js pada aplikasi yang sudah ada.

Perubahan:
- Pada paket usaha yang memakai komposisi, Bahan & Belanja tetap menunggu produk dipilih sebelum menampilkan bahan resep.
- Setelah produk dengan resep dipilih, tersedia bagian “Tambah bahan yang belum tersedia”.
- Pengguna dapat mendaftarkan bahan tambahan tanpa harus melakukan pembelian pada saat itu.
- Bahan baru dimulai dengan stok 0 dan harga Rp0; pembelian berikutnya dicatat lewat formulir Pembelian Bahan & Barang Dagangan.
- Mencegah pembuatan bahan aktif duplikat dengan nama yang sama agar catatan stok tidak terpecah.
- Toko retail tanpa resep tetap menampilkan barang dagangan seperti sebelumnya.

Penting:
- Backup data usaha terlebih dahulu.
- Jangan hapus data situs/IndexedDB.
- ZIP ini adalah patch, bukan paket aplikasi lengkap.
- Pemeriksaan integritas ZIP dan sintaks JavaScript dilakukan. Belum diuji langsung di browser.
