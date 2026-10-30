Universal UMKM Pro PWA Offline — v3.3.104

PERBAIKAN PENTING
Versi v3.3.103 sebelumnya menggabungkan app.js baru dengan index.html lama. Akibatnya sejumlah elemen antarmuka yang diperlukan JavaScript tidak tersedia dan inisialisasi bisa berhenti pada layar “Memuat katalog usaha…”. Versi ini menggunakan index.html yang sesuai dengan aplikasi v3.3.102+ dan style.css yang lebih lengkap.

Isi paket:
- index.html, style.css, app.js, sw.js
- master.json berisi 24 paket usaha, 788 item, 82 komposisi acuan, dan 5 sumber resmi
- ikon dan manifest PWA

Perbaikan katalog:
- Menampilkan bahan/stok secara default di Bahan & Belanja.
- Filter produk untuk menampilkan bahan komposisi produk terpilih.
- Produk jadi yang memiliki komposisi tidak diduplikasi sebagai bahan belanja.
- Panel sumber resmi disertakan untuk konteks resep dan keamanan pangan.

Catatan resep:
Komposisi adalah perkiraan awal yang dapat diedit, bukan formula resmi tervalidasi. Sumber resmi menjelaskan panduan keamanan, penanganan, pelabelan, dan masa simpan sesuai cakupannya; bukan berarti mengesahkan semua takaran resep di katalog.

PENTING SEBELUM PEMAKAIAN
1. Jika sudah punya data usaha, ekspor cadangan terlebih dahulu dari aplikasi yang lama.
2. Jangan hapus data browser/IndexedDB untuk mencoba versi ini.
3. Untuk penggunaan web, salin file di ZIP ke root repository GitHub Pages dan izinkan seluruh file selesai terunggah.
4. Setelah deploy, buka dengan HTTPS dan lakukan hard refresh. Jika PWA terpasang masih memakai versi lama, tutup aplikasi dan buka kembali setelah online agar service worker baru terpasang.

Pemeriksaan pada paket: sintaks JavaScript, kelengkapan ID HTML yang dipakai fungsi init, JSON master, referensi resep/sumber, dan integritas ZIP. Pengujian transaksi interaktif di perangkat pengguna belum dilakukan.


Versi 3.3.105 — Data Sumber: status validasi komposisi dibuat transparan. Lihat VALIDASI_DATA_SUMBER.txt dan validasi_data_sumber.json.


VERSI 3.3.108 — SIMPAN KOMPOSISI PER BAHAN + SISTEM SATUAN STOK UTAMA
- Setiap bahan dan barang memiliki field satuan stok utama (stockUnit); field unit lama tetap disinkronkan untuk kompatibilitas.
- Data lama dimigrasikan tanpa mengubah jumlah stok atau nilai biaya; satuan lama dijadikan satuan stok utama.
- Konversi baku: massa (mg/g/ons/kg), volume (ml/cc/cl/dl/l), panjang (mm/cm/m), jumlah (pcs/butir/buah, lusin, kodi, gross), serta takaran volume standar sdm/sdt.
- Konversi lintas kelompok (misalnya ml ke gram) diblokir. Kemasan seperti pack/dus/renteng/karung/rim tidak otomatis dikonversi ke pcs/gram; isi harus ditetapkan melalui input isi kemasan.
- Komposisi menampilkan hasil konversi pembelian ke satuan resep; konversi tidak dikenal akan memberi peringatan dan tidak dihitung otomatis.
- Tetap lakukan backup sebelum mengganti versi aplikasi.


PEMBARUAN v3.3.108
- Setiap baris bahan pada Komposisi memiliki tombol Simpan bahan sendiri.
- Menyimpan satu bahan hanya memperbarui bahan tersebut pada komposisi produk yang dipilih.
- Perubahan bahan lain tidak ikut tersimpan sampai tombol Simpan bahan pada barisnya ditekan.
- Tombol bawah kini menyimpan pengaturan resep (panduan proses, basis resep, dan ukuran), bukan menyimpan semua baris bahan sekaligus.
- Baris bahan yang sudah tersimpan ditandai Tersimpan; ketika diedit kembali status berubah menjadi Belum disimpan.
- HPP dihitung ulang setelah bahan berhasil disimpan.


Versi 3.3.108 menambahkan menu Produksi. Produksi mengurangi stok bahan berdasarkan komposisi yang tersimpan dan menambah stok produk jadi. Penjualan hanya mengurangi stok produk jadi. Produk dengan beberapa varian ukuran belum didukung pada menu Produksi versi ini.
