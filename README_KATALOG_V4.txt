UNIVERSAL UMKM PRO v4.0.0 — KATALOG USAHA TERKELOMPOK
======================================================

ISI PAKET
- index.html, app.js, style.css, sw.js, manifest.webmanifest, ikon: aplikasi.
- master.json: katalog template v4.0.0 untuk 300 profil usaha.
- KATALOG_300_PENGELOMPOKAN.csv: semua 300 profil, kelompok utama, subkategori, jumlah item dan resep.
- KATALOG_MIGRASI_MAP.csv: pemetaan item lama ke nama katalog baru; menandai item aktif/nonaktif dan ID baru.
- KATALOG_300_PENGELOMPOKAN_DAN_MIGRASI.txt: aturan migrasi dan hasil pemeriksaan statis.
- QA_UJI_ALUR_KASIR_STOK_HPP_LABA.csv: skenario uji manual per kelompok usaha.

PERUBAHAN UTAMA
1. 300 profil dipetakan ke 11 kelompok usaha utama dan subkategori. Jus mangga/jambu/buah naga berada dalam kelompok jus/minuman, bukan kelompok usaha utama terpisah.
2. Katalog produk, bahan belanja, jasa, dan alat disesuaikan per profil usaha. Item lama yang tidak cocok disembunyikan dengan aktif=0, bukan dihapus.
3. ID paket, ID item lama, ID resep lama, dan ID alur kerja lama dipertahankan. Role item lama tidak berubah. Item tambahan memakai ID baru.
4. Komposisi draft menggunakan material_template_id yang sama dengan item bahan belanja aktif dalam paket yang sama.
5. Takaran resep diset 0 dengan sengaja. Ini mencegah HPP palsu dari angka tebakan. Aplikasi menolak produksi jika resep masih draft atau ada takaran nol.
6. Item produk fisik dan bahan baku mengaktifkan pencatatan stok. Jasa tidak diperlakukan sebagai barang jadi.
7. Katalog usaha ditampilkan berkelompok di halaman pemilihan usaha dan pencarian dapat memakai nama usaha, kelompok, atau subkategori.

PENTING: HPP DAN RESEP
Semua resep template masih DRAFT / BELUM TERVERIFIKASI. Takaran resep bukan formula produksi baku. Sebelum dipakai untuk keputusan harga/laba:
- buka Komposisi Produk;
- pilih produk;
- untuk setiap bahan, isi kuantitas, satuan resep, jumlah kemasan pembelian, satuan beli, dan harga beli aktual;
- klik Simpan bahan pada setiap baris;
- simpan pengaturan resep;
- lakukan batch uji, catat hasil jadi/susut, lalu cocokkan biaya dengan pembelian aktual.

MIGRASI DATA LAMA
- Jangan menghapus data lokal dan jangan menggunakan master.json sebagai file backup.
- Sebelum memperbarui profil yang sudah dipakai, ekspor/unduh backup dari menu Profil & Backup.
- Mengganti master.json tidak otomatis menimpa katalog yang sudah ada di IndexedDB. Ini disengaja agar histori transaksi tidak berubah tanpa persetujuan.
- KATALOG_MIGRASI_MAP.csv membantu membandingkan ID/nama lama dan baru. Perubahan pada profil lama harus dilakukan melalui migrasi eksplisit dengan pratinjau dan backup; jangan mengubah ID transaksi/detail.

STATUS VALIDASI
- JSON valid.
- Sintaks app.js dan sw.js lolos node --check.
- 300 ID paket tetap sama.
- Semua ID item lama tetap ada; role item lama tidak berubah.
- Semua ID resep lama tetap ada.
- Referensi resep aktif mengarah ke produk aktif dan bahan aktif dalam paket yang sama.
- Tidak ada duplikasi ID item/resep atau produk-resep aktif dalam paket yang sama pada pemeriksaan statis.
- BELUM dilakukan pengujian browser end-to-end atas kasir, stok, pembelian, produksi, HPP, dan laporan laba. Lakukan uji manual memakai matriks QA sebelum penggunaan produksi.
