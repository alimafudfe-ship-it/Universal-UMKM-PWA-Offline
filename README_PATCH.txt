Universal UMKM Pro v3.3.70 — Patch perapian bahan dan komposisi ganda

Isi patch: app.js, index.html, sw.js, master.json.

Perbaikan:
- Menyatukan bahan aktif yang memiliki nama sama (beda kapitalisasi/spasi) dan satuan yang bisa dikonversi, agar tidak tampil sebagai bahan ganda. Stok dikonversi lalu dijumlahkan ke satu bahan utama; bahan duplikat dinonaktifkan, bukan dihapus permanen.
- Mengalihkan relasi komposisi ke bahan utama dan menggabungkan baris komposisi berulang yang merujuk bahan sama dengan satuan yang kompatibel. Jika biaya per satuan tersedia, biaya total dijaga saat baris digabung.
- Saat komposisi baru disimpan, baris bahan berulang yang kompatibel juga digabung.
- Pada paket Gorengan & Camilan, label “Bumbu & Garam” diubah menjadi “Bumbu Racik (opsional)” agar tidak tampak sama dengan bahan “Garam”; bahan template lama di perangkat juga ikut diganti namanya.
- Versi halaman, script, dan cache service worker diseragamkan ke v3.3.70.

Penting:
- Sebelum memasang, unduh backup data aplikasi.
- Migrasi hanya menggabungkan bahan aktif dengan nama sama dan satuan kompatibel. Riwayat pembelian lama dipertahankan; baris bahan duplikat dinonaktifkan, tidak dihapus.
- Setelah commit ke GitHub Pages, buka aplikasi online dan tekan Ctrl+Shift+R. Data lokal akan diperiksa dan dirapikan saat aplikasi mulai.

Pemeriksaan lokal: jalankan node --check pada app.js dan sw.js, lalu unzip -t pada ZIP. Belum diuji dengan transaksi langsung di browser pengguna.
