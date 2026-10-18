# Checklist — Siapa Menjalankan Apa, dan Apa yang Masih Menggantung

## Pembagian kerja

| Pekerjaan | Claude | User |
|---|---|---|
| Baca kode, trace alur, review | ✅ | |
| Edit halaman / script / dummy data di `LAB/`, `PANELIS/` | ✅ (hook `check-mockup.mjs` otomatis) | review |
| Edit `LAB/assets/og-theme/` | ⛔ (deny di `settings.json`, terbukti menolak) | lewat `sync-theme.ps1` |
| Python dalam bentuk apa pun | ⛔ (deny di `settings.json`, belum diuji) | |
| Jalankan server preview, buka browser, cek console | ✅ | |
| Commit lokal | ✅ kalau diminta (atribusi tetap seperti riwayat repo: author Claude + `Co-Authored-By`) | |
| Push, merge ke `main`, PR | | ✅ |
| Porting ke `onegenesis-web` | ✅ di repo itu, dengan aturan repo itu (tanpa jejak AI) | review |

### Gerbang tiap perubahan

1. Skill `onegenesis-mockup` dipakai untuk halaman baru / diubah.
2. `node --check` lolos (hook; manual bila edit lewat Bash), halaman dibuka, console bersih,
   light + dark.
3. Alur / aturan domain berubah → `FLOW.md` (+ `FLOWCHART.md`) di commit yang sama; helper / store
   / key baru → `ARCHITECTURE.md`.
4. Jebakan baru → `LESSONS.md`.

## Selesai 2026-10-11

Dari review 2026-10-11, lalu diperbaiki di hari yang sama:

- [x] Nomor dokumen bisa bentrok → semua nomor lewat `nextFreeNo()` (`LESSONS.md` #5).
- [x] Chain Internal terduplikasi → `requestApprovalChain()` untuk Internal / Sensory / ASLT,
      `externalApprovalChain()` untuk External.
- [x] Pembacaan role beragam → `currentRole()` (og-shell.js) di semua script.
- [x] Simpan store tidak seragam → baca selalu `try/catch` ke seed, simpan tidak menelan error
      (`ARCHITECTURE.md` §4).
- [x] Teks "ADM / Lab Admin" untuk kaji ulang → CRL / Technical Review & SPK di kode, skill, docs.
- [x] Aturan domain dobel → hanya di `docs/FLOW.md`; CLAUDE.md berisi aturan kerja.
- [x] Atribusi git: dibiarkan seperti riwayat repo (keputusan user).

Diverifikasi: `node --check` semua JS, console bersih di halaman yang disentuh, nomor baru
(REQ-/SPK/LHU/SN-/ASLT-) dicek di browser, dan satu alur Internal diklik (ADM approve → SPK +
Sample No. → Confirmed; record uji dihapus lagi).

## Selesai 2026-10-11 (alur report dari lab)

- [x] Report: CRL review → Submit for Approval → TCM Approve & Issue / Return to CRL (`FLOW.md` §6a).
- [x] Pemohon download sertifikat (form request + Report list khusus sertifikat terbit).
- [x] Re-test dipindah ke form Report (TCM, kapan saja, Requested By + Channel), memotong stok
      reagen; pemotongan pertama di Technical Review, sekali per parameter.
- [x] Revision setelah Final lewat TCM approval; sertifikat lama tetap berlaku sampai versi baru
      terbit (snapshot di `reportHistory`).

Diverifikasi di browser (data dikembalikan sesudahnya): kaji ulang disimpan 2× → potong 1× (Pb Not
Testable tidak dipotong); push → CRL submit → TCM return → CRL submit → TCM approve
(`LHU/LAB/202610/0001`, Closed); BSU hanya melihat sertifikat terbit + Download; Re-test dari Final
→ stok cawan 44→42, log tertulis, kembali ke Excel, terbit `-RT1`; versi lama (v=0) tetap
menampilkan Moisture 3.2; Revision → Confirm to Approve → `-RT1-R1`; Return pada revisi → CRL
melihat Edit Revision; report Sensory CRL submit → TCM approve → `LHU/LAB/202610/0002`.

## Selesai 2026-10-11 (re-test sebelum ada report)

- [x] Re-test jadi aksi milik request: TCM bisa dari form Internal (sejak SPK) dan form Report,
      satu dialog `retest.js`; efek mengikuti posisi dokumen (Testing / Report / Issued).

Diverifikasi: sebelum kaji ulang → semua parameter terkunci, tombol Start mati + alasan; setelah
kaji ulang, re-test dari form Internal tanpa report → stok 44→42, log, badge "Re-test in
Progress", Excel `[Re-test 1]`, tidak ada report; push hasil baru → badge hilang; re-test saat
report Draft → tetap Draft; 2 re-test pra-terbit → terbit `LHU/LAB/202610/0001` (tanpa -RT);
re-test sesudah terbit → siklus Re-test 1, sertifikat lama + snapshot tetap.

## Selesai 2026-10-13 (review KAN / ISO/IEC 17025 + dashboard)

- [x] Internal: ADM keluar dari chain; Sample Receipt (kondisi, deviasi, retensi) → Technical
      Review yang menerbitkan SPK; persetujuan pemohon untuk Partially Accepted / Subcontract.
- [x] Pemotongan reagen run pertama pindah ke saat SPK terbit (bukan saat kaji ulang disimpan).
- [x] Re-test tidak lagi menghapus hasil tanpa jejak: `resultLog` append-only + Save Raw Data di
      Excel; report tidak lagi mengedit hasil (hanya sertifikat Subcontract).
- [x] LHU: PASS/FAIL dari spesifikasi (sebelumnya selalu PASS), MU, scope KAN `**` + logo hanya
      bila ada hasil dalam scope, tgl terima / kondisi / periode uji / tgl terbit, pernyataan wajib,
      halaman x dari y saat print.
- [x] Vendor: satu master `EXTERNAL_VENDORS` dengan masa berlaku akreditasi KAN.
- [x] Quality Records (NC & CAPA, keluhan, PT); re-test dan PT jelek membuat record otomatis.
- [x] `Draft Report` dihapus (sama dengan `Done` + `reportStatus`).
- [x] Dashboard satu struktur untuk semua role (banner, 4 KPI per role, pie, action queue,
      pipeline); stepper progres di semua form request.

Diverifikasi di browser: REQ-202610-0003 ADM Receive → CRL Save & Issue SPK (TPC Not Testable →
Pending) → BSU Agree → SPK + Sample No. + 2 potongan reagen → raw data + push → CRL submit → TCM
approve `LHU/LAB/202610/0001` (PASS, MU, tgl terima) → Re-test → audit trail 4 entri + Complaint
QR otomatis; dashboard BSU / CRL / ADM / TCM / MGU / HOL, dark mode, form Sensory / External,
vendor, parameter form; lewat UI juga: BSU submit Normal → langsung Sample Receipt, ADM Reject
Sample, BSU Decline → CRL melihat catatan. Console bersih, `node --check` semua JS. Data uji
dikembalikan (REQ-202610-0003/0004 ke seed, potongan reagen dibalik, Quality Records di-reset).

## Selesai 2026-10-18 (Re-test / Revision jadi dokumen baru)

- [x] Re-test (RT-, TCM, Internal) dan Revision (RV-, CRL / TCM, Internal / Sensory / ASLT) = dokumen
      baru `amendmentForm.html`, hanya setelah sertifikat terbit; re-test pra-terbit + `retest.js` dihapus.
- [x] Accordion dokumen di list Internal dan ASLT and Sensory; sidebar Document Journey di form Internal
      dan form dokumen.

Diklik 2026-10-18: REQ-202609-0015 Final → RT-202610-0001 (FFA) → push → CRL submit → TCM approve
`-RT1`, RT Closed; RV-202610-0001 → Return to CRL → koreksi → approve `-RT1-R1`; BSU melihat banner +
accordion, tanpa tombol; dokumen kedua diblokir selama satu masih terbuka; dark mode + sidebar diciutkan.

## Selesai 2026-10-18 (Re-test dua arah + terima sampel cukup Reason)

- [x] Re-test bisa diajukan BSU atau TCM; pihak lawan approve, lalu ADM Approve & Receive Sample.
- [x] Modal terima sampel (Internal + Re-test) = satu field Reason; kondisi Good / Deviation dihapus.

Diklik 2026-10-18: BSU ajukan RT (protein) → TCM approve → ADM terima (Reason) → protein kembali ke
Excel, reagen dipotong, NC dibuat → TCM approve report → RT Closed; TCM ajukan RT → BSU Reject →
siklus ditutup; Return to Edit → hanya pembuat bisa submit ulang.

## Menggantung

- [ ] **Document Journey di form Sensory / ASLT**: halaman itu belum dibungkus layout dua kolom;
      dokumen RV- mereka tetap tampil di accordion list dan di sidebar form dokumennya.

- [ ] **Konfirmasi ke lab (aturan domain berubah):**
      reagen dipotong saat SPK; persetujuan pemohon wajib untuk Partial / Subcontract; masa simpan
      sampel 30 hari; nilai MU di master masih contoh.
- [ ] External / Sensory / ASLT masih memakai ADM sebagai approver terakhir (redundan dengan
      Confirm Delivery / Schedule oleh ADM). Putuskan dengan lab apakah disamakan dengan Internal.
- [ ] Nilai `step` `Done` / `Running` / `Confirmed` tetap berbeda per jenis (badge sama dari
      `getDocStatus`); disatukan saat porting bila backend mengizinkan.
- [x] 2026-10-13: semua pola bersama mengikuti skill onegenesis-spk (tombol `STANDARD_BUTTON_DEFS` + konfirmasi, pill status, SpkApprovalTimeline, SpkCountercard, SpkTableActions di Master Data, ikon toast Bootstrap Icons); header tabel list ke Inggris.
- [x] 2026-10-13: dialog Re-test = parameter + Reason, Revision = field koreksi + Reason (Requested By, Channel, FlexTab `LAB_REQUEST_CHANNEL` dihapus); re-test selalu membuat Nonconforming Work.
- [x] 2026-10-13: Document History jadi satu sumber riwayat (`record.activity` ditulis store + `resultLog`), dipakai semua form dan Report; kartu Result Audit Trail di Report dihapus.
- [x] 2026-10-14: ADM kembali jadi approver terakhir Internal; approval ADM = Sample Receipt (Approve & Receive Sample) → Fully Approved · Waiting for Technical Review. Step `Sample Receipt` dihapus (data lama dimigrasi ke Approval menunggu ADM).
- [x] 2026-10-14: offcanvas Approval History + Document History di kedua versi = port SpkForm onegenesis-web (`spk-history.js`, salinan identik di v1); v1 kini juga mencatat `record.activity`.
- [x] 2026-10-14: list Internal (kedua versi; versi 1 hanya hijau / kosong karena tanpa Save Raw Data): kolom Analysis Purpose → Progress per parameter (`analysisProgressHtml`).
- [x] 2026-10-14 (kedua versi): role ANL (Analyst) mengisi Excel; Push Data hanya CRL. Versi 2: `nextActor` testing → ANL, lalu CRL "Push results" setelah semua parameter punya raw data / hasil; dashboard ANL.
- [x] 2026-10-14 (versi 2): report pindah ke tab Report di form Internal / Sensory / ASLT, tampil per akses (`reportTabVisible`); `reportForm.html` dihapus, menu Report = antrean.
- [x] 2026-10-14 (versi 2): perubahan Technical Review setelah SPK = amandemen: Reason for Change wajib + tercatat di Document History, reagen dikembalikan bila belum diuji, LHU mencantumkan parameter "Not tested".
- [x] 2026-10-14 (kedua versi): nomor dokumen satu deret tanpa reset bulanan; semua list (Internal, External, ASLT & Sensory, Report, Invoice) terbaru di atas. Versi 2: seed REQ-202610-0003/0004 → 0034/0035, key `holabsysRequests.v3.en`.
- [x] 2026-10-14 (versi 2): No. Reference (salin request lama sebagai template) di keempat form; Urgent Reason pindah ke baris sendiri col-12.
- [ ] Excel Sensory / ASLT belum punya Save Raw Data (skor panel sudah tersimpan dari booth).

- [ ] **Uji alur end-to-end** untuk External (Confirm Delivery) dan Sensory / ASLT dari Schedule →
      booth → Excel (bagian report-nya sudah dites).
- [ ] **Re-test Sensory / ASLT** sengaja belum ada (ulang panel = sesi Schedule baru). Putuskan
      dengan lab bila dibutuhkan.
- [ ] **Permintaan Re-test / Revision dari pemohon di dalam aplikasi** (tombol "Request Re-test"
      untuk BSU) belum ada; sekarang lab mencatat permintaan WA di modal. Tanyakan ke lab apakah
      perlu.
- [ ] **Download sertifikat** memakai dialog print browser (Save as PDF); di aplikasi asli diganti
      PDF dari backend.
- [ ] **Working tree besar belum di-commit** (lihat `ROADMAP.md`).
