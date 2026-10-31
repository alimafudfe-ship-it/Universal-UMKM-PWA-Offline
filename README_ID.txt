Universal UMKM Pro PWA Offline — v3.3.121
Basis perbaikan: ZIP v3.3.119 Es Teh Manis Sesuai Judul.

RINGKASAN AUDIT KATALOG
- 300 pilihan jenis usaha dipertahankan.
- 6.510 item katalog dipertahankan.
- 783 komposisi/resep acuan dipertahankan.
- Semua 300 paket kini memiliki tahapan alur kerja. Tahapan tambahan untuk paket yang sebelumnya kosong disesuaikan dengan kelompok usaha (perdagangan, jasa, produksi, kuliner/minuman, serta budidaya/pertanian). Status alur dapat disesuaikan oleh pemilik usaha dan bukan SOP teknis yang tervalidasi.

PERBAIKAN STRUKTURAL
1. Memperbaiki tiga ID item yang bertabrakan antara paket Es Teh Manis Gerobak Mangkal (paket 41) dan Usaha Bakwan Sayur (paket 42). ID tiga produk paket 42 dibuat unik dan referensi resepnya diperbarui.
2. Pencarian produk dan bahan dari template resep pada proses migrasi dibatasi berdasarkan paket_id. Ini mencegah produk/bahan dari paket lain tertukar ketika ID template sama atau data lama bermasalah.
3. Cache service worker diperbarui agar perangkat mengambil file versi 3.3.121.
4. Semua ID item, paket, resep, dan alur kerja diperiksa ulang agar unik.
5. Seluruh 783 resep diperiksa: produk dan semua bahan harus berasal dari paket yang sama. Tidak ditemukan lagi referensi silang atau ID yang tidak ditemukan.

ATURAN PENGELOLAAN
- Produk/Jasa adalah barang atau jasa yang benar-benar dijual.
- Bahan & Belanja adalah bahan baku/barang pendukung atau stok dagangan sesuai karakter usaha.
- Produk jadi yang dibuat sendiri dan memiliki komposisi tidak boleh diduplikasi sebagai bahan baku.
- Barang dagangan siap jual kembali tidak dipaksa memiliki resep.
- HPP komposisi mengikuti takaran dan satuan bahan; harga dan stok aktual tetap harus diisi sesuai kondisi usaha.

CATATAN VALIDASI
Komposisi bawaan yang berstatus belum terverifikasi tetap merupakan referensi awal yang dapat diedit, bukan resep resmi atau formula tervalidasi. Pemilik usaha perlu menguji hasil, hasil jadi, dan biaya aktual sebelum memakai HPP sebagai dasar harga jual. Alur kerja tambahan adalah tahapan status operasional yang dapat diedit, bukan instruksi teknis produksi.

MENJAGA DATA
Perubahan master katalog tidak menghapus data toko, produk, stok, transaksi, pembelian, komposisi buatan pengguna, atau riwayat yang sudah tersimpan. Sebelum deploy, tetap ekspor cadangan dari aplikasi yang sedang digunakan.

PEMERIKSAAN TEKNIS
- node --check app.js: lulus.
- JSON master: valid.
- ID global: unik untuk 6.510 item, 300 paket, 783 resep, dan 1.456 tahapan alur.
- Referensi resep: 0 referensi produk/bahan lintas paket atau tidak ditemukan.
- Paket tanpa alur kerja: 0.
- Integritas ZIP: diperiksa setelah pengemasan.

Pengujian browser/perangkat nyata dan validasi resep oleh praktisi pangan belum dilakukan. Jangan menganggap pemeriksaan statis ini sebagai pengujian lapangan.


Perubahan v3.3.121: audit alur kasir–stok–HPP–laporan laba; bahan yang dipakai komposisi tetap tersedia di Belanja pada usaha retail; pilihan pembelian dicek terhadap nama yang diketik; laporan memiliki fallback HPP dari detail transaksi; buku kas mencatat pembelian stok tanpa mengurangi laba dua kali. Lihat AUDIT_ALUR_KASIR_STOK_HPP_LABA.txt.
