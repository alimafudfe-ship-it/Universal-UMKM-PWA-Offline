UNIVERSAL UMKM PRO - PWA OFFLINE v1.2 (KATALOG JENIS USAHA)

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


PEMBARUAN v1.1: manifest menyertakan ikon PNG 192x192 dan 512x512 untuk membantu instalasi PWA di Android.
PEMBARUAN v1.2:
- Beranda setiap kali aplikasi dibuka menampilkan katalog 16 jenis usaha dari Master Paket.
- Statistik omzet dan jumlah produk tidak lagi menjadi halaman utama.
- Ada pencarian jenis usaha dan kartu katalog yang responsif untuk HP.
- Jika profil usaha sudah dibuat, beranda menampilkan tombol Masuk untuk melanjutkan usaha yang tersimpan.
- Versi ini tetap menyimpan satu usaha aktif per perangkat. Memilih jenis lain tidak menghapus/mengganti data yang sudah ada.
- Data lama di IndexedDB tidak dihapus oleh pembaruan tampilan ini.

PEMBARUAN: Unggah/replace seluruh isi folder paket ini ke root repository GitHub Pages. Tunggu deploy selesai, lalu buka PWA dan muat ulang. Service worker memakai cache baru v1.2 agar file tampilan diperbarui.


FITUR v1.3 — PAKET KULINER & HPP RESEP
- Katalog diperluas dari 16 menjadi 24 paket, termasuk Gorengan & Camilan, Warung Kopi & Minuman, Nasi Uduk & Sarapan, Warung Makan & Pecel Lele, Bakso/Mi Ayam/Soto, Jajanan Jalanan, Martabak/Roti Bakar, serta Jus Buah/Es Campur.
- Tiap paket kuliner menyediakan contoh barang jual dan bahan baku; harga, biaya beli/HPP, dan stok awal tetap nol.
- Pada form produk, centang “Ini bahan baku” untuk item bahan yang tidak muncul di kasir. Masukkan harga beli per satuan bahan (misalnya per kg atau liter).
- Untuk barang jadi, tambah bahan di bagian “Resep / Komposisi HPP”, masukkan takaran untuk menghasilkan 1 unit produk. HPP otomatis dihitung dari biaya bahan × takaran. Satuan takaran harus sama dengan satuan bahan.
- Ini adalah estimasi HPP bahan baku; biaya gas, tenaga kerja, susut, dan biaya lain perlu dimasukkan sebagai bahan/biaya tambahan bila ingin dihitung.
- Setelah mengganti file di GitHub, buka ulang PWA untuk memperbarui cache. Jangan uninstall aplikasi atau menghapus data lokal.


PEMBARUAN v1.4
- Tombol + dan - pada keranjang kasir diperbesar agar mudah ditekan di HP.
- Jumlah barang dapat diketik langsung pada kolom angka.
- Jumlah harus bilangan bulat minimal 1; validasi stok tetap berlaku.
- Cache service worker diperbarui ke v1.4.
