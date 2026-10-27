Universal UMKM Pro v3.3.90 — Perbaikan Pembulatan Total Kasir dan Kembalian

Berdasarkan v3.3.89.

Perbaikan:
- Perhitungan subtotal kasir membulatkan total setiap baris ke rupiah bulat agar total baris dan subtotal tidak berbeda akibat pecahan desimal/floating point.
- Pajak dihitung dengan rumus rupiah yang benar: subtotal × persentase / 100, lalu dibulatkan ke rupiah terdekat.
- Total nota dihitung dari subtotal, pajak, dan biaya tambahan yang semuanya dalam rupiah bulat.
- Kembalian dihitung dari uang diterima dikurangi total yang sama persis dengan yang ditampilkan dan disimpan pada nota.
- Subtotal per item yang disimpan pada detail transaksi menggunakan pembulatan yang sama seperti keranjang.
- Nomor versi app.js, index.html, query cache script, dan service worker dinaikkan ke 3.3.90 agar browser mengambil kode terbaru.

Contoh uji hitung:
- Total belanja Rp6.000, uang diterima Rp10.000 → kembalian Rp4.000.
- Total belanja Rp6.000, pajak 10% (Rp600), uang diterima Rp10.000 → total Rp6.600, kembalian Rp3.400.

Pemasangan:
1. Cadangkan data usaha sebelum mengganti file.
2. Ekstrak ZIP.
3. Ganti app.js, index.html, dan sw.js di root repositori GitHub dengan file dari ZIP.
4. Commit/publish dan tunggu GitHub Pages selesai diperbarui.
5. Buka ulang aplikasi dan uji transaksi Rp6.000 dengan uang diterima Rp10.000.

Validasi yang dilakukan: pemeriksaan sintaks JavaScript, pengecekan versi, pengujian rumus total/kembalian dengan contoh angka, dan integritas ZIP. Belum diuji langsung di browser pengguna.
