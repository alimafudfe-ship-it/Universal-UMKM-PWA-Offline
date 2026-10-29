PAKET DATA ACUAN FROZEN FOOD — Universal UMKM Pro
Versi paket: 1.0 | Tanggal: 29 Oktober 2026

ISI
- frozen_food_recipes.json : struktur data produk, bahan, takaran, metode, status dan sumber.
- resep_dan_sumber.md : ringkasan resep dan tautan sumber resmi.
- bahan_komposisi.csv : bahan per produk dalam format tabel untuk diperiksa/diolah.
- CATATAN_INTEGRASI.txt : cara menggunakan paket dan batasan.

PENTING TENTANG VALIDASI
Sumber Kementerian Pertanian dan BPOM adalah dasar rujukan, bukan berarti setiap formula di paket ini sudah divalidasi oleh kedua instansi. Nugget ayam merujuk bahan/proses umum dari sumber Kementan, tetapi takaran di JSON adalah formula kerja awal yang perlu diuji. Formula bakso ayam, cireng, pempek, dan risol mayo merupakan formula awal untuk uji produksi, bukan resep resmi Kementan/BPOM.

Sebelum dipakai untuk HPP:
1. Uji satu batch nyata.
2. Catat jumlah bahan yang benar-benar dipakai, hasil jadi bersih, jumlah pcs, dan berat per pcs.
3. Isi harga beli aktual; jangan gunakan harga contoh sebagai harga pasar.
4. Perbarui komposisi sesuai hasil uji, termasuk bahan yang benar-benar dipakai.
5. Catat susut, minyak terserap, bahan pelapis tersisa, dan biaya kemasan secara terpisah bila relevan.

Keamanan:
- Jaga rantai dingin; simpan produk beku pada -18°C atau lebih dingin sesuai panduan BPOM.
- Terapkan FIFO dan cek kondisi kemasan, label, izin edar, serta kedaluwarsa pada bahan/produk yang dibeli.
- Pisahkan bahan mentah dari pangan matang dan gunakan peralatan bersih.
- Jangan menetapkan masa simpan/kedaluwarsa hanya berdasarkan perkiraan. Perlu dasar uji yang sesuai.
- Periksa persyaratan izin edar dan label yang berlaku untuk kategori dan skala usaha. Jangan menganggap semua frozen food otomatis dapat memakai SPP-IRT.

Paket ini adalah data acuan untuk ditinjau, bukan aplikasi lengkap dan bukan patch siap pasang. JSON ini belum dihubungkan otomatis ke master.json atau katalog Frozen Food di PWA.
