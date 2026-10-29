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
