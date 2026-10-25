PATCH UNIVERSAL UMKM PRO v3.3.75 — WARUNG MAKAN & PECEL LELE LENGKAP

Isi ZIP: app.js, index.html, master.json, sw.js.

Yang diperbaiki:
- Menambah katalog menu Warung Makan & Pecel Lele agar pengguna tidak perlu memasukkan banyak menu dari awal.
- Menambah bahan baku yang dipakai menu.
- Memperbarui komposisi awal untuk menu masakan yang dibuat dari bahan. Minuman sederhana dan air mineral tidak dipaksa memakai resep.
- Harga jual, harga beli, dan stok awal template paket ini diset 0 agar pemilik mengisi sesuai harga dan kondisi usahanya. Takaran resep adalah acuan awal dan harus disesuaikan dengan resep nyata usaha.
- Migrasi katalog hanya menambahkan item yang belum ada dan memperbarui komposisi template yang belum diedit; tidak menghapus transaksi, stok, atau data usaha. Komposisi yang sudah diedit pengguna dipertahankan.
- Cache service worker dinaikkan agar file master dan aplikasi diperbarui.

CARA PASANG DI GITHUB PAGES:
1. Unduh ZIP dan ekstrak.
2. Buka repository Universal-UMKM-PWA-Offline.
3. Unggah/ganti tiga file di root repository: app.js, master.json, sw.js. Jangan hapus file lain.
4. Commit perubahan, tunggu GitHub Pages selesai menerbitkan.
5. Buka aplikasi saat online satu kali agar versi baru terunduh. Jika masih versi lama, tutup aplikasi lalu buka ulang atau refresh halaman.
6. Setelah pembaruan, data usaha lama tetap disimpan. Saat membuka aplikasi, migrasi akan menambahkan katalog ke usaha Warung Makan & Pecel Lele yang sudah ada tanpa menimpa stok, harga, transaksi, atau resep yang telah disesuaikan.

CATATAN:
- Rumus komposisi adalah resep awal, bukan klaim resep baku/tervalidasi. Uji takaran dan biaya nyata sebelum dipakai menghitung HPP produksi.
- Buat backup data sebelum pembaruan sebagai langkah kehati-hatian.
- Belum diuji pada perangkat HP pengguna; pemeriksaan dilakukan pada struktur JSON, referensi resep, dan sintaks JavaScript.
