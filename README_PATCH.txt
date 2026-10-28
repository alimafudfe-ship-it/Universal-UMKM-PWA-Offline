Universal UMKM Pro v3.3.98 — Resep Acuan Tersedia, Harga Bahan Kosong

Isi patch: app.js, index.html, sw.js, master.json.

Yang berubah:
- Katalog bahan tetap tersedia untuk paket usaha yang sesuai, tetapi seluruh harga beli acuan di master.json diset 0 agar pengguna memasukkan harga pemasok sendiri. Harga jual katalog tetap merupakan contoh.
- Komposisi resep acuan per produk tetap tersedia dari master.json. Ada 560 formula katalog lintas paket yang dapat disesuaikan; formula bukan semuanya hasil penelitian atau resep tervalidasi.
- Formula Martabak Manis diambil sebagai titik awal dari resep industri Interflour Indonesia dan dibedakan berdasarkan topping; status ditandai perlu uji dapur.
- Saat memperbarui profil yang belum ke masterDataVersion 6, harga referensi lama hanya direset jika masih ditandai referenceCost, stok bahan nol, dan tidak ada riwayat pembelian bahan terkait. Harga yang diubah pengguna atau memiliki riwayat pembelian tidak dihapus.
- Pembelian bahan dan komposisi resep tidak otomatis mengurangi stok bahan saat penjualan.

Sumber formula Martabak Manis: https://id.interflour.com/Resep/MartabakManis/
Referensi resep industri alternatif: https://santos-krimer.co.id/id/recipe/martabak-manis/
Referensi formula roti manis dan formulasi akademik: https://eprints.uny.ac.id/65094/6/6%20BAB%20IV.pdf ; https://journal.uny.ac.id/index.php/ptbb/article/view/49661

Pemasangan: backup data terlebih dahulu. Unggah/ganti keempat file ini di repositori PWA (termasuk master.json). Jangan hapus IndexedDB/browser data. Jika master.json tidak ikut diperbarui, resep acuan yang baru tidak akan masuk. Harga jual tetap perlu dicek dan disesuaikan. Semua resep harus diuji di dapur sebelum dipakai sebagai standar produksi.
