Universal UMKM Pro v3.3.87 — Alur Stok Sederhana

Isi ZIP: app.js, index.html, sw.js.

Perubahan utama:
- Mengganti label “Tambah Stok” menjadi “Barang Masuk” pada alur terkait.
- Mengganti “Penyesuaian Stok” menjadi “Koreksi Stok”. Pengguna memasukkan jumlah fisik akhir, bukan selisih.
- Menampilkan ringkasan stok aplikasi, stok fisik, dan selisih lalu meminta konfirmasi sebelum koreksi disimpan.
- Koreksi disimpan sebagai catatan riwayat dengan stok sebelum/sesudah, selisih, tanggal, dan alasan. Tipe data internal lama transactionType=adjustment dipertahankan agar kompatibel dengan riwayat lama.
- Riwayat stok menampilkan pembelian/barang masuk dan koreksi; membuka riwayat tidak mengubah stok.
- Tidak menghapus riwayat pembelian, barang masuk, penjualan, atau data usaha lama. Tidak melakukan migrasi stok massal pada versi ini.
- Cache service worker dinaikkan ke v3.3.87.

Pemasangan:
1. Buat backup data melalui Profil & Backup terlebih dahulu.
2. Ganti app.js, index.html, dan sw.js di root repositori dengan file dari ZIP.
3. Commit/publish, lalu buka aplikasi online agar versi baru dimuat.
4. Uji Barang Masuk pada satu item contoh, lalu uji Koreksi Stok dengan jumlah fisik berbeda. Periksa Riwayat Stok dan pastikan stok berubah tepat satu kali.

Validasi yang dilakukan: pemeriksaan sintaks JavaScript dan integritas ZIP. Belum diuji langsung di browser/HP atau terhadap data usaha pengguna.
