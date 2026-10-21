Universal UMKM Pro v3.3.73 — Produk Berkomposisi Tidak Masuk Bahan & Belanja

Patch ini melanjutkan file v3.3.72. Produk yang memiliki komposisi/resep tersimpan (recipe dengan baris bahan) tetap ada di Produk & Jasa dan Kasir, tetapi tidak lagi ditampilkan di daftar Bahan & Belanja atau pilihan pembelian. Bahan baku tetap tampil untuk usaha produksi. Produk yang dibeli untuk dijual kembali dan tidak memiliki resep tetap dapat dibeli sebagai barang dagangan.

Pemasangan: backup data lokal terlebih dahulu. Unggah dan timpa app.js, index.html, dan sw.js di root repositori GitHub Pages. master.json tidak diubah oleh patch ini. Setelah Pages selesai, buka aplikasi online lalu lakukan hard refresh (Ctrl+Shift+R) di desktop atau tutup penuh dan buka kembali PWA di HP.

Catatan: patch menyaring produk berdasarkan komposisi yang tersimpan pada database perangkat. Produk yang secara konsep dibuat sendiri tetapi belum memiliki komposisi tersimpan belum bisa dikenali sebagai produk resep. Uji daftar Bahan & Belanja, pilihan pembelian, Produk & Jasa, dan Kasir setelah pemasangan.
