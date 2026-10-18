# ROADMAP — LAB Mockup

Penanda posisi: apa yang sudah jalan, apa yang setengah jadi, apa berikutnya. **Update tiap kali
satu halaman / alur lolos verifikasi** (console bersih + alur diklik), bukan saat kodenya ditulis.

## Posisi sekarang (per 2026-10-11)

- Remote `origin` = `git@github.com:RianBentang/onegenesis-lab-mockup.git`. Branch kerja
  `claude/keen-gauss-wb4znz`, commit terakhir `5d49f57` (2026-10-07). Riwayat mulai `init`
  2026-09-29, 34 commit.
- **Working tree belum di-commit** (`git status --short -uall`, 2026-10-11): 62 berkas berubah,
  4 dihapus (`Master-Data/masterSku.html`, `metodeScope.html`, `assets/master-sku.js`,
  `assets/metode-scope.js` — fungsinya pindah ke FlexTab dan master Parameter Uji), 35 berkas baru
  (Parameter Uji, FlexTab form, Invoice, `spk-lov.js`, `spk-toast.js`, `on-behalf.js`,
  `dashboard.js`, `docs/excel/`, dokumen `docs/*.md`, `.claude/settings.json`, hook, `dummy-reagents.js`, `retest.js`).

## Modul

| Area | Halaman | Status |
|---|---|---|
| Shell, role switcher, dark mode | `og-shell.js` | jalan |
| Dashboard, Profile | `index.html`, `profile.html` | jalan |
| Internal | list + form + Technical Review & SPK + label | jalan (load bersih) |
| External | list + form + Confirm Delivery + invoice | jalan (load bersih) |
| ASLT & Sensory | list (2 tab) + 2 form | jalan (load bersih) |
| Schedule | kalender, slot Sensory, ASLT bebas, Test Mode | jalan (load bersih) |
| Excel | FortuneSheet, tab Internal / Sensory & ASLT, pull/push | jalan (load bersih) |
| Report | list + form, CRL review → TCM approve, Re-test (potong reagen), Revision, history + snapshot, download pemohon | jalan, alur diklik 2026-10-11 |
| Master Data | 9 menu (Parameter, TTD, Kompetensi, Alat, Reagen, Lingkungan, Vendor, Invoice, FlexTab) | jalan (load bersih) |
| PANELIS | login NIK + booth | jalan (load bersih) |

"Load bersih" = halaman dibuka tanpa error console pada review 2026-10-11. Alur yang sudah diklik
ulang: Internal approve → SPK → Confirmed, kaji ulang + potong reagen, dan seluruh alur report
(review, approve, return, re-test, revisi, download). Sisanya di `CHECKLIST.md` › Menggantung.

Konsistensi (2026-10-11): helper bersama untuk nomor dokumen, approval chain, dan role; aturan
domain satu sumber di `docs/FLOW.md`.

Review KAN (2026-10-13): alur Internal Sample Receipt → Technical Review → SPK + persetujuan
pemohon, audit trail hasil, LHU sesuai 7.8, vendor terakreditasi, Quality Records, dashboard per
role. Detail di `FLOW.md` §12–13 dan `CHECKLIST.md`.

Proposal klien (2026-10-14): dua versi untuk dibandingkan — versi 1 (alur awal, beku) di
`versions/v1-before/`, versi 2 = `LAB/` + `PANELIS/`. Perbandingan dan skenario demo di
`versions/README.md`.

## Berikutnya

1. Commit working tree saat ini (per area, bukan satu commit raksasa).
2. Item di `CHECKLIST.md` › Menggantung.
3. Porting ke `onegenesis-web` modul per modul — catat di sini modul yang sudah dipindah.
