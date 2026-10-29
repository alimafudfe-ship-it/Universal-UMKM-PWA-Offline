Universal UMKM Pro v3.3.102 — Perbaikan filter Bahan & Belanja dari Produk

Patch lanjutan untuk memperbaiki urutan pemilihan produk. Sebelumnya, nilai filter diatur sebelum opsi produk selesai dirender sehingga pilihan bisa kosong dan bahan tidak tampil.

Perubahan:
- Dari ruang kerja produk, buka Bahan & Belanja.
- Tunggu daftar pilihan produk dirender terlebih dahulu, lalu set filter ke produk yang sedang dipilih dan render ulang daftar bahan.
- Komposisi Produk & HPP, Tambah Produk, dan Koreksi Stok tidak diubah.
- Tidak mengubah stok, pembelian, atau data resep.

File patch: app.js dan sw.js.
Uji: node --check app.js dan integritas ZIP. Pengujian browser langsung belum dilakukan. Cadangkan data sebelum memasang.
