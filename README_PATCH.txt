Universal UMKM Pro v3.3.100 — Bahan terdaftar muncul di pilihan Komposisi

Patch lanjutan dari v3.3.99. Ganti app.js, index.html, dan sw.js.

Perbaikan:
- Daftar pilihan Nama Bahan pada Komposisi Produk & HPP sekarang menggabungkan bahan aktif yang sudah didaftarkan untuk usaha aktif dengan bahan dari resep yang tersimpan.
- Bahan baru seperti Sasa dapat dipilih pada kolom Nama Bahan saat mengedit komposisi produk.
- Menambahkan bahan ke komposisi tetap memerlukan pengguna mengisi takaran dan harga/satuan yang sesuai; pendaftaran bahan tidak otomatis menambahkan bahan ke resep.
- Penyaringan Bahan & Belanja tetap hanya menampilkan bahan yang dipakai pada resep produk yang dipilih; bahan tambahan yang belum dimasukkan ke resep tidak otomatis dianggap dibutuhkan oleh produk tersebut.
- Cache service worker diberi versi baru agar file aplikasi terbaru dapat diambil.

Catatan: periksa dan cadangkan data lokal sebelum menerapkan patch. Sintaks JavaScript diperiksa dengan node --check; belum diuji langsung di browser.
