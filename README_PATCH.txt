Universal UMKM Pro v3.3.68 — Patch Proses Kerja Fleksibel

Perubahan:
- Tombol Proses Kerja membuka satu panel yang memuat panduan, daftar langkah bernomor, dan kotak edit langsung.
- Menghapus bagian/tombol terpisah “Edit cara pembuatan” dan label “Panduan awal — belum divalidasi”.
- Tekan Enter pada kotak proses kerja untuk membuat langkah baru dengan nomor berikutnya otomatis.
- Pratinjau bernomor diperbarui saat teks diubah.
- Perubahan cara pembuatan disimpan bersama tombol “Simpan komposisi & hitung HPP”.
- Data instruksi lama tetap dibaca; status lama tidak ditampilkan lagi.

Pemasangan:
1. Cadangkan repositori/file aplikasi terlebih dahulu.
2. Ganti app.js, index.html, dan sw.js dengan file dari ZIP ini.
3. Commit/publish ke GitHub Pages.
4. Buka aplikasi saat online agar versi/cache baru terambil.
5. Pilih produk di Komposisi Produk, klik Proses Kerja, edit langkah, lalu tekan Simpan komposisi & hitung HPP.

Pemeriksaan teknis: node --check app.js dan sw.js serta pemeriksaan integritas ZIP. Belum diuji pada perangkat/browser pengguna.
