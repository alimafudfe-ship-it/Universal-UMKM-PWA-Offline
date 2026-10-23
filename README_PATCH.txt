Universal UMKM Pro v3.3.74 — Petunjuk Penyesuaian Komposisi

Patch ini melanjutkan v3.3.73 dan memperjelas petunjuk di halaman Komposisi Produk & HPP. Pesan menjelaskan bahwa resep acuan bukan aturan baku: pengguna boleh menambah bahan, mengurangi atau menambah takaran, dan menghapus bahan yang tidak digunakan. Pesan juga mengingatkan bahwa perubahan komposisi memengaruhi HPP.

File yang perlu ditimpa di root repositori GitHub Pages:
- index.html
- sw.js

app.js dan master.json tidak diubah oleh patch ini.

Pemasangan:
1. Backup data lokal aplikasi terlebih dahulu. Jangan hapus data situs/browser.
2. Ekstrak ZIP.
3. Unggah dan timpa index.html dan sw.js di root repositori GitHub Pages.
4. Tunggu GitHub Pages selesai memperbarui situs.
5. Di PC, buka aplikasi dan tekan Ctrl+Shift+R. Di HP, tutup penuh lalu buka kembali PWA.
6. Buka Komposisi Produk & HPP dan pastikan petunjuk "Komposisi acuan — boleh disesuaikan" tampil.

Catatan: ZIP ini hanya mengubah teks petunjuk dan cache version service worker; tidak mengubah data komposisi atau perhitungan HPP. Pemeriksaan yang dilakukan: struktur ZIP dan keberadaan teks target. Belum diuji langsung pada perangkat pengguna.
