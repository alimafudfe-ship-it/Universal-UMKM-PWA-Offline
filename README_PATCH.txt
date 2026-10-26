Universal UMKM Pro v3.3.82 — Tambah Stok dari Form Produk

Perbaikan: tombol Tambah Stok Produk kini tersedia langsung di dialog Edit Produk/Jasa, selain dari ruang kerja produk. Setelah stok disimpan, angka stok di form ikut diperbarui.

Pemasangan: backup data terlebih dahulu, lalu ganti app.js, index.html, dan sw.js pada root repository. Commit/push, tunggu GitHub Pages, lalu refresh keras (Ctrl+Shift+R) di desktop. Di HP, tutup aplikasi/PWA lalu buka ulang; jika masih versi lama, buka situs melalui browser dan refresh.

Validasi lokal: jalankan node --check app.js dan unzip -t pada ZIP. Belum diuji langsung pada perangkat pengguna.
