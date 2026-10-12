UNIVERSAL UMKM PRO — ASISTEN USAHA UNIVERSAL v2.1
PWA OFFLINE • DATABASE TERPISAH PER USAHA

ISI PAKET
- index.html: antarmuka responsif HP dan desktop
- app.js: logika aplikasi, IndexedDB, template, transaksi, backup/restore
- style.css: tampilan
- master.json: 24 template usaha, 624 item awal, dan 65 workflow
- sw.js: cache offline
- manifest.webmanifest dan ikon aplikasi

PERBAIKAN STRUKTUR v2.1
- Skema IndexedDB dinaikkan ke versi 2 dan menambahkan indeks businessId pada produk, transaksi, dan detail transaksi.
- Migrasi data lama mempertahankan profil lama dan mengaitkan baris data lama yang belum memiliki businessId ke profil lama/pertama agar tidak hilang dari tampilan.
- Pembacaan data memakai businessId aktif sehingga data usaha tidak tercampur.
- Pembuatan usaha memvalidasi template dan memastikan template memiliki item sebelum membuat data usaha.
- Item bawaan diberi templateItemId untuk pelacakan sumber master. Harga jual, HPP, dan stok awal tetap 0.
- Backup tetap mencakup semua usaha; restore memvalidasi struktur, memuat ulang daftar usaha aktif, dan membersihkan keranjang sementara.
- Perubahan Master tidak mengubah data instance usaha yang telah dibuat.

CARA MENJALANKAN
PWA memerlukan alamat HTTPS atau localhost untuk service worker. Jangan hanya membuka index.html melalui file manager jika ingin menguji mode offline.
1. Unggah seluruh isi folder ke hosting statis HTTPS, atau jalankan server lokal.
2. Buka index.html melalui alamat HTTPS/localhost di Chrome.
3. Buat profil usaha, isi nama toko, lalu pilih template.
4. Isi harga jual, HPP, dan stok sesuai data usaha sendiri.
5. Buat backup berkala dari menu Profil & Backup. Simpan file backup di lokasi terpisah.

CATATAN LISENSI
Pemilih harga 1–24 jenis usaha masih berupa antarmuka lokal. Pembayaran dan verifikasi lisensi belum terhubung, sehingga nilai paket di perangkat belum dapat dianggap bukti pembayaran atau lisensi aman.

BATASAN FITUR
Versi ini adalah fondasi PWA offline. Sinkronisasi antarperangkat, otorisasi pengguna, pembayaran, dan penguncian lisensi server masih perlu dibangun terpisah.
