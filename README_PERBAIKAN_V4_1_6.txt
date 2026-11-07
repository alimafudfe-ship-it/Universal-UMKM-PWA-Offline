UNIVERSAL UMKM PRO v4.1.6
PERBAIKAN KATALOG JENIS USAHA DAN PRODUK

Perubahan katalog:
1. Gorengan: 14 produk sesuai daftar permintaan (Tahu Bakso Goreng hanya satu kali).
2. Warung Makan dan Warteg: 28 produk sesuai daftar permintaan.
3. Bumbu, Sambal & Olahan Kering: dinonaktifkan dari katalog aktif.
4. Warung Lauk, Ayam & Masakan: dinonaktifkan dari katalog aktif.

Bahan & Belanja, komposisi/HPP, dan alur kerja:
- Template bahan disusun terpisah dari produk jadi.
- Resep produk yang memerlukan proses produksi ditandai sebagai referensi awal.
- Takaran resep bernilai nol/draf dan bukan HPP final; isi takaran serta hasil produksi berdasarkan praktik usaha nyata.
- Minuman sederhana, kerupuk, dan air mineral tidak dipaksakan memiliki resep.

Migrasi:
- Versi migrasi masterDataVersion dinaikkan ke 8 agar profil usaha yang sebelumnya
  memakai versi katalog lama memuat perubahan katalog terbaru.
- Migrasi menambahkan template yang belum ada dan mengarsipkan template master lama
  yang sudah tidak aktif; tidak menghapus riwayat transaksi/pembelian.

PENTING UNTUK MEMPERBARUI GITHUB PAGES:
1. Ekstrak ZIP ini.
2. Unggah/ganti SELURUH isi ZIP ke root repositori GitHub Pages
   Universal-UMKM-PWA-Offline (bukan mengunggah file ZIP-nya saja).
3. Commit perubahan dan tunggu GitHub Pages selesai deploy.
4. Buka ulang alamat PWA. Service worker v4.1.6 memakai cache baru dan
   akan mengganti cache aplikasi lama saat aktif.

Pemeriksaan yang dilakukan: struktur JSON, sintaks JavaScript, daftar produk,
referensi resep/bahan, dan integritas ZIP. Belum dilakukan uji langsung pada
perangkat/browser pengguna.
