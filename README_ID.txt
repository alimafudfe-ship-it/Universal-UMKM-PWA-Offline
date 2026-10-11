UNIVERSAL UMKM PRO - PWA OFFLINE v1.0 (PROTOTIPE AWAL)

ISI PAKET
- index.html       Antarmuka HP
- style.css        Tampilan responsif
- app.js           Logika aplikasi dan database IndexedDB
- sw.js            Cache offline (service worker)
- manifest.webmanifest Metadata pemasangan ke layar utama
- master.json      Salinan katalog Master Paket Usaha dari database yang ditemukan

CARA MENJALANKAN
PWA memerlukan alamat HTTPS atau localhost untuk service worker. Jangan hanya membuka index.html lewat file manager jika ingin menguji offline.

1. Unggah seluruh isi folder ini ke hosting statis yang menyediakan HTTPS (mis. GitHub Pages atau Netlify).
2. Buka alamat HTTPS di Chrome Android ketika internet aktif.
3. Tunggu halaman selesai dimuat, lalu gunakan menu Chrome > Tambahkan ke layar utama / Install app.
4. Buka aplikasi sekali. Setelah service worker selesai memasang cache, aktifkan mode pesawat dan uji buka ulang.
5. Buat profil usaha, lalu lengkapi harga, HPP dan stok di menu Produk.
6. Lakukan transaksi uji. Buka Laporan dan buat Ekspor cadangan.

PENTING
- Ini prototipe PWA offline tahap pertama, belum setara seluruh fungsi desktop v6.1.
- Data disimpan di IndexedDB pada browser/perangkat itu saja; tidak ada sinkronisasi.
- Hapus data situs/browser dapat menghapus database. Gunakan Ekspor cadangan berkala.
- Master Paket Usaha menyediakan nama item, tetapi harga, HPP dan stok awal sengaja diset 0.
- Fitur nota memakai dialog cetak browser; hasil printer Bluetooth/USB berbeda menurut perangkat dan browser.
- Uji offline baru valid setelah aplikasi pertama kali dibuka melalui HTTPS dan cache selesai dibuat.
