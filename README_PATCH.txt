Universal UMKM Pro v3.3.69 — Patch prinsip satu catatan stok

Isi patch: app.js, index.html, sw.js.

Perubahan utama:
- Bahan & Belanja dipertegas sebagai pusat pembelian, penambahan stok, penyesuaian stok, dan riwayat pembelian.
- Pembelian produk yang sudah terdaftar mengubah stok pada record produk yang sama; produk jual yang belum mengaktifkan stok tetap dapat dipilih pada jenis usaha toko barang jadi.
- Pada jenis usaha toko barang jadi (termasuk pakaian), menu Bahan & Belanja menampilkan produk dagangan, bukan daftar bahan baku.
- Produk dagangan baru pada jenis usaha toko barang jadi dibuat sebagai produk dan stok awalnya berasal dari transaksi pembelian yang disimpan.
- Pada jenis usaha produksi, bahan baku tetap dikelola sebagai bahan, dan produk yang stoknya dikelola tetap tersedia untuk pembelian.
- Tidak menghapus data transaksi, riwayat pembelian, produk, atau bahan yang sudah tersimpan. Catatan bahan lama yang memiliki nama sama dengan produk tidak dimigrasikan otomatis; buat/aktifkan produk yang sesuai terlebih dahulu untuk mencegah dua stok baru yang terpisah.

Pemasangan:
1. Cadangkan data aplikasi.
2. Ganti app.js, index.html, dan sw.js di repositori GitHub Pages.
3. Commit perubahan dan tunggu deploy selesai.
4. Buka aplikasi online, pilih jenis usaha, lalu uji pembelian kecil pada produk contoh.

Pemeriksaan lokal: node --check app.js dan sw.js serta integritas ZIP. Belum diuji langsung pada browser/HP pengguna.
