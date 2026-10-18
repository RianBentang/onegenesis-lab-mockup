# Dua versi untuk proposal klien

| | Versi 1 — alur awal | Versi 2 — alur setelah review KAN |
|---|---|---|
| Folder | `versions/v1-before/` (beku, snapshot 2026-10-13 sebelum diskusi) | `LAB/` + `PANELIS/` (versi yang terus dikembangkan) |
| Buka | `http://localhost:8765/versions/v1-before/LAB/index.html` | `http://localhost:8765/LAB/index.html` |
| PANELIS | `…/versions/v1-before/PANELIS/` | `…/PANELIS/` |

Jalankan server dari root repo (lihat `docs/RUNBOOK.md`):
`npx --yes http-server C:/Users/Bentang/Projects/experiment/LAB -p 8765 -c-1 -s`

Versi 1 memakai tema dari `LAB/assets/og-theme/` (tidak diduplikasi) dan menyimpan datanya sendiri
di browser (semua key berawalan `v1:`, `version-v1.js`), jadi kedua versi bisa didemokan
berdampingan tanpa saling menimpa. Label kuning "Version 1" di pojok kiri bawah menandai versi 1.
Versi 1 tidak diubah lagi, kecuali tampilan yang memang harus sama di kedua versi: offcanvas
**Approval History** dan **Document History** memakai `spk-history.js` yang sama (salinan identik di
`versions/v1-before/LAB/assets/`), mengikuti SpkForm onegenesis-web. Ubah file itu di keduanya bersamaan.

## Beda alur (bahan presentasi)

| Topik | Versi 1 | Versi 2 |
|---|---|---|
| Approval Internal | chain → ADM approve → **SPK langsung terbit** | chain → ADM approve **sekaligus terima sampel** (kondisi, penyimpangan, masa simpan) → Fully Approved |
| Kaji ulang (Technical Review) | sesudah SPK terbit | **sebelum** SPK; simpan kaji ulang = SPK terbit |
| Parameter tidak bisa diuji / Subcontract | CRL ubah sendiri | pemohon diminta **Agree / Decline** dulu |
| Lab subcontract | daftar nama vendor | hanya vendor dengan akreditasi KAN masih berlaku |
| Potong stok reagen | saat kaji ulang disimpan | saat SPK terbit |
| Input hasil | Excel + bisa diedit di Report | hanya Excel (Save Raw Data + Push), Report hanya membaca |
| Re-test | hasil lama dihapus | hasil lama tetap tercatat; dialog cukup parameter + Reason |
| Riwayat dokumen | approval saja | **Document History** satu sumber: semua aksi + perubahan hasil |
| LHU | semua parameter PASS, logo KAN selalu | PASS/FAIL dari spesifikasi, ketidakpastian (MU), tanda di luar scope KAN, tgl terima / periode uji / tgl terbit, halaman x dari y |
| Mutu lab | — | menu **Quality Records**: pekerjaan tidak sesuai + CAPA, keluhan, uji profisiensi (z-score) |
| Dashboard | satu tampilan, tabel contoh statis | per role: KPI, pie status, antrean "perlu tindakan saya", pipeline |
| Report | halaman terpisah (menu Report) | **tab Report di form request**, tampil per akses; menu Report jadi antrean |
| Tampilan | Spk dasar | pola Spk penuh: tombol standar + konfirmasi, pill status, timeline, countercard |

**Ringkas untuk klien:** Versi 1 lebih sedikit langkah dan cepat dipakai. Versi 2 menambah langkah
yang diminta ISO/IEC 17025 (penerimaan sampel, kaji ulang sebelum SPK, persetujuan pemohon, rekaman
data mentah, pelaporan LHU) — penting bila lab diakreditasi / akan diaudit KAN.

## Skenario demo yang disarankan (sama di kedua versi)

1. BSU membuat request Internal Normal → Submit.
2. ADM approve (versi 2: isi kondisi sampel).
3. CRL Technical Review (versi 2: beri satu parameter "Not Testable" → BSU Agree).
4. Excel: isi hasil → Push → CRL Submit → TCM Approve & Issue → lihat LHU.
5. TCM Re-test satu parameter → lihat Document History (versi 2).
