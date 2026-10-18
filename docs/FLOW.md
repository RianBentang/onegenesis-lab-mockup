# Alur Aplikasi HOLABSYS

**Satu-satunya sumber aturan domain**: alur, status, approval, perilaku form, dan nilai yang
disimpan. `CLAUDE.md` hanya memuat aturan kerja dan merujuk ke sini. Cara kerja teknis ada di
`ARCHITECTURE.md`, diagramnya di `FLOWCHART.md`.

Ditulis 2026-10-11 dari kode, diperbarui 2026-10-13 (alur KAN / ISO/IEC 17025, §12). Fungsi yang disebut bisa di-grep. Kalau kode dan dokumen ini
berbeda, **kodenya yang benar**, lalu perbaiki dokumen ini. Alur berubah → perbarui dokumen ini di
perubahan yang sama.

## 1. Gambaran besar

```
 Master Data (Parameter Uji, FlexTab, Alat, Reagen, Kompetensi, Vendor, TTD, Invoice) — dibaca semua form
                                              │
 BSU membuat request ─► Approval chain ─► (workflow) ─► Confirmed ─► Excel ─► Report: CRL review ─► TCM approve ─► Closed ─► BSU download
 Internal / External /    per Tipe + Tujuan   Technical Review (SPK) / raw data + Draft →            Confirm to       sertifikat
 Sensory / ASLT           (Internal: level    Sample Delivery /        Push       Submit for Appr.   Approve → Final  (LHU / COA)
                          ADM = terima sampel) Schedule + PANELIS
                                                                          ▲                                         │
                                                                          └──── dokumen baru Re-test (RT-) / Revision (RV-) ◄──┘ hanya setelah terbit
```

| Jenis | Menu | Workflow setelah approval | Ke Excel / Report? |
|---|---|---|---|
| **Internal** | HOLABSYS › Internal | approval terakhir ADM = terima sampel → Technical Review (CRL) yang menerbitkan SPK; persetujuan pemohon bila Partially Accepted / Subcontract | ya |
| **External** | HOLABSYS › External | Sample Delivery (ADM: Confirm Delivery) | **tidak** — vendor menerbitkan COA sendiri |
| **Sensory** | HOLABSYS › ASLT and Sensory (tab Sensory) | Scheduling → Schedule → booth PANELIS | ya |
| **ASLT** | HOLABSYS › ASLT and Sensory (tab ASLT) | Scheduling → Schedule → booth PANELIS | ya |

## 2. Role dan aksi

Role mockup (`ROLES` di `og-shell.js`), dipilih lewat dropdown di header; script membacanya dengan
`currentRole()`.

| Kode | Role | Departemen |
|---|---|---|
| BSU | Basic User (pemohon) | Quality Assurance |
| MGU | Manager User | Quality Assurance |
| HOL | Head of Laboratory | Laboratory |
| HOR | Head of R&D | Research & Development |
| FRA | FRA Administrator | Regulatory Affairs |
| ADM | Lab Administrator | Laboratory |
| CRL | Lab Coordinator / Supervisor | Laboratory |
| ANL | Analyst | Laboratory |
| TCM | Technical Manager | Laboratory |

| Aksi | Role | Tempat di kode |
|---|---|---|
| Buat / edit / submit request (hanya saat New, Draft, Return to Edit) | BSU | `isBsuEditable()` `internal-form.js`, `isBSU` di `external-form.js`, `request-approval.js` |
| Approve / Return to Edit / Reject | role yang **sedang pending** di chain (`chain[approvalIdx]`) | `internal-form.js`, `external-form.js`, `request-approval.js` |
| **Approve & Receive Sample** (Internal, level ADM) | ADM, saat ia approver yang pending | mode `receipt` `internal-form.js` |
| Tab **Technical Review & SPK** (kaji ulang, Penunjukan Analis, label, Subcontract) — **Save & Issue SPK** | **CRL** saja, request yang sudah ada; terbuka sejak step `Technical Review` | `refreshTabs()` `internal-form.js`, `internal-review-tab.js` |
| **Agree** / **Decline** hasil Technical Review (Partially Accepted / Subcontract) | BSU, saat `customerConsent.status = 'Pending'` | `canConsent` `internal-form.js` |
| Confirm Delivery (External) | ADM, saat step `Sample Delivery` | `canDeliver` `external-form.js` |
| Tombol Schedule di form Sensory / ASLT | ADM, saat step `Scheduling` | `canSchedule` `request-approval.js` |
| Review hasil di report + **Submit for Approval** | CRL, report `Draft` (diblokir selama ada flag) | `report-form.js` |
| **Approve & Issue** / **Return to CRL** (wajib alasan) | TCM, report `Confirm to Approve` | `report-form.js` |
| Buat dokumen **Re-test** (RT-, Internal) | TCM, hanya setelah sertifikat terbit dan tanpa dokumen lain yang terbuka — tombol di form request / tab Report | `amendmentBlocker`, `createAmendment`, `amendment-form.js` |
| Buat dokumen **Revision** (RV-, Internal / Sensory / ASLT) | CRL atau TCM, aturan sama; koreksi lagi setelah Return to CRL | `createAmendment`, `resubmitRevision` |
| Report versi baru (Submit / Approve & Issue / Return) | CRL / TCM seperti biasa, di **tab Report dokumen RT- / RV-** | `ReportPanel.mount({ amendmentId })` |
| Melihat report Draft / Confirm to Approve | role Laboratory (HOL, ADM, CRL, TCM) — `isLabRole` | `report-form.js`, `report-list.js` |
| **Download Certificate** | semua role; role non-lab (pemohon) hanya melihat sertifikat yang sudah terbit | `docReportNoteHtml`, `report-form.js` |
| Invoice Lab Eksternal | ADM (tidak di-gate di mockup) | `invoice-form.js` |
| Isi hasil di Excel (+ Save Raw Data, versi 2) | **ANL** (Analyst); CRL juga bisa | `excel.js` |
| **Push Data** Excel → report | **CRL saja** (tombol disembunyikan untuk role lain; CRL yang me-review dan Submit report) | `canPush` `excel.js` |
| Halaman Schedule, Excel, Master Data | dibuka semua role di mockup | — |
| Quality Records: tambah / tutup NC, keluhan, hasil PT | role Laboratory (`isLabRole`); role lain hanya melihat | `quality-records.js` |

## 3. Approval chain

Dihitung dari **Tipe** (Normal / Urgent) dan **Tujuan Analisa**. "MD/P5" = Tujuan
`MD Registration (BPOM)` atau `P5 Testing` (`isMdOrP5`). Level berurutan; hanya role di posisi
pending yang bisa menekan Approve.

| Jenis | Normal | Normal + MD/P5 | Urgent | Urgent + MD/P5 |
|---|---|---|---|---|
| Internal, Sensory, ASLT — `requestApprovalChain` (`dummy-requests.js`) | ADM | FRA → ADM | MGU → HOL → HOR → ADM | MGU → HOL → HOR → FRA → ADM |

Di Internal, approval **ADM (level terakhir) = Sample Receipt**: tombol **Approve & Receive Sample**
membuka modal terima sampel, dan menyimpannya = approve → Fully Approved.
| External — `externalApprovalChain` (`dummy-external-requests.js`) | HOL → ADM | FRA → HOL → ADM | sama dengan Urgent di atas | sama dengan Urgent di atas |

## 4. Status dokumen

Satu fungsi menurunkan badge dari field `step`: `getDocStatus()` (`dummy-requests.js`).

| `step` di record | Badge status | Badge workflow |
|---|---|---|
| (belum disimpan) | New | — |
| `Draft` | Draft — atau **Return to Edit** bila `returned: true` | — |
| `Approval`, `approvalIdx = 0` | Confirm To Approve | — |
| `Approval`, `approvalIdx > 0` | Partially Approved (hanya pada chain ≥ 2 level) | — |
| `Technical Review` (Internal) | Fully Approved | Waiting for Technical Review — atau **Waiting for Requester Approval** bila `consentPending` |
| `Sample Delivery` | Fully Approved | Waiting for Sample Delivery |
| `Scheduling` | Fully Approved | Waiting for Schedule |
| `Done` (Internal), `Running` (Sensory/ASLT), `Confirmed` (External) | Confirmed | — (Waiting for Requester Approval bila subcontract baru belum disetujui) |
| `reportStatus: 'Confirm to Approve'` | Confirmed | Waiting for Report Approval |
| dokumen RT- / RV- terbuka (`openAmendmentOf`) | **Closed** (sertifikatnya masih berlaku) | Re-test in Progress / Revision in Progress |
| data lama: `reportCycle` tanpa dokumen, atau re-test pra-terbit yang hasil barunya belum di-push (`openRetest`) | Confirmed | Re-test in Progress / Revision in Progress |
| apa pun dengan `reportStatus: 'Final'` | **Closed** (otomatis, juga Sensory / ASLT) | — |
| `Rejected` | Rejected | — |

**Return to Edit / Reject** meminta alasan, disimpan `returnReason` / `rejectReason` + `reasonBy` /
`reasonAt`; tiap form request menampilkannya di bawah status card (`docReasonNoteHtml`, juga di
Approval History).

**Nomor dokumen**: satu nomor urut yang **tidak pernah reset tiap bulan** (`nextFreeNo`,
`dummy-requests.js`): bagian yyyymm mengikuti bulan dibuat, nomor urutnya melanjutkan nomor tertinggi
deret itu dari bulan mana pun (REQ-202609-0033 → REQ-202610-0034), tidak pernah dipakai ulang. List
selalu menampilkan dokumen terbaru di atas (`newestFirst`): `REQ-yyyymm-NNNN` (Internal dan External berbagi deret ini),
`SN-yyyymm-NNNN`, `ASLT-yyyymm-NNN`, `SPK/LAB/yyyymm/NNNN`, `LHU/LAB/yyyymm/NNNN` (satu deret untuk
semua report), `RT-yyyymm-NNNN` (dokumen Re-test), `RV-yyyymm-NNNN` (dokumen Revision).

Status dokumen RT- / RV- (`getAmendmentStatus`): New → **Confirmed** + badge Waiting for Results
(Excel) / Waiting for CRL Review / Waiting for Report Approval / Returned to CRL → **Closed** saat
sertifikat barunya terbit.

## 5. Bagian form yang sama di semua request

- **Departemen Pemohon** (Internal & External) = departemen role yang login (disabled). Switch
  **On Behalf?** di bawahnya mengubahnya jadi SpkLovInput seperti "Registered Vendor?" di
  onegenesis-web (`MaterialDetailsSection.jsx`): pilih user HRIS di LOV, field menampilkan
  departemen user itu, NIK · nama di bawahnya (`small text-info`). `on-behalf.js`, disimpan
  `onBehalf` + `onBehalfUser`. Popup LOV memakai `spk-lov.js` (`SpkLov.open`, port `LovModal.jsx`).
- **No. Reference** (section 1, keempat form, versi 2): SpkLovInput untuk memilih request lama dengan
  jenis yang sama; isinya disalin ke form sebagai template (`requestTemplate`, `request-reference.js`).
  Hanya pemohon saat New / Draft / Return to Edit. Yang **tidak** disalin: nomor, tanggal, status,
  approval, pekerjaan lab, hasil, report, pemohon / departemen, Batch Code, Production Date. Form
  dibuka ulang dengan `?ref=<id>` (tetap `?docId=` bila draft sudah tersimpan); nomor referensi
  disimpan di `record.refNo`.
- **Urgent Reason** muncul di baris sendiri selebar penuh (col-12) di bawah field section 1, hanya
  saat Request Type = Urgent.
- **Alamat** (keempat form) tampil "Company - Kota" lewat `siteOptions()` (`dummy-sites.js`,
  value = site); tombol mata menampilkan detail.
- Internal & External **tidak** punya field Laboratorium dan tabel parameter di form. Kode Batch,
  Nama SKU, Tanggal Produksi opsional.
- Parameter dipilih dari master Parameter Uji, dropdown kecil dari FlexTab (`ARCHITECTURE.md` §3).

## 6. Internal

1. **BSU** mengisi form → **Save Draft** (`Draft`) atau **Submit** (`Approval`) → **Confirm To Approve**.
2. Approver menurut chain (`requestApprovalChain`); chain ≥ 2 level → **Partially Approved** setelah
   level pertama. Belum ada SPK.
3. **Level terakhir = ADM = Sample Receipt** (ISO/IEC 17025 cl. 7.4): tombol **Approve & Receive
   Sample** membuka modal Received At (otomatis), **Sample Condition** (FlexTab
   `LAB_SAMPLE_CONDITION`: Good / Deviation; Deviation wajib keterangan, dicetak di LHU), Retained
   Until = terima + `SAMPLE_RETENTION_DAYS` (30 hari). **Approve** di modal = approval terakhir:
   `record.receipt`, `step: 'Technical Review'` → **Fully Approved · Waiting for Technical Review**.
   Sampel yang tidak layak → **Reject** (atau Return to Edit) + alasan, seperti approver lain.
4. **CRL** › tab **Technical Review & SPK** (cl. 7.1) — terbuka sejak `Technical Review`, bisa
   diubah sampai **Closed**:
   - Tabel kaji ulang per parameter, dicek terhadap data Internal Document & Master Control:
     Metode (metode parameter itu sendiri), kompetensi analis, stok reagen, status alat, lingkungan
     uji. Semua kolom setelah Parameter adalah SpkSelect2: kelima cek, Efektif Waktu Analisa | **Max
     Lead Time** (default 20 hari) | Actual Time, dan Result baris (Testable / Subcontract / Not
     Testable, mengikuti cek; ikon status hijau / merah). Disimpan `kajiUlang[param]`.
   - Dari tabel itu: Result keseluruhan (Fully Accepted / Partially Accepted / Rejected), catatan,
     **Penunjukan Analis** (TomSelect multi, default = matriks analis parameter yang testable),
     dan Est. Tanggal Selesai Uji = hari ini + lead time terpanjang (juga tampil read-only di form
     Internal; kosong sampai SPK terbit).
   - Partially Accepted menyimpan `paramsDiterima`; label, Excel, dan Report hanya memakai itu.
   - **Subcontract**: Result baris Subcontract + Subcontract Lab. Pilihan vendor hanya yang
     akreditasi KAN-nya masih berlaku (`subcontractVendorOptions`, `vendorAccredited`, master
     `EXTERNAL_VENDORS`, cl. 6.6). Parameter tetap diterima (`paramSubkontrak(record, code)`).
   - Tombol **Save & Issue SPK** (sebelum SPK) / **Save Technical Review** (sesudahnya):
     - Rejected → `Rejected` (alasan = catatan).
     - Ada item yang perlu pemohon (`consentItemsFor`: parameter tidak diterima, Subcontract yang
       belum pernah disetujui) → `customerConsent = { status: 'Pending', items, … }`, step tetap.
       Badge **Waiting for Requester Approval**. **BSU** melihat daftarnya di form dan menekan
       **Agree** (→ `consentedCodes` + SPK terbit bila belum) atau **Decline** + alasan
       (`status: 'Declined'`, kembali ke CRL untuk mengubah review lalu simpan lagi).
     - Tidak ada item → **SPK terbit** (`issueInternalSpk`): nomor SPK + `spkAt`, **Sample No.**
       5 digit per lab (`assignSampleNos`), **pemotongan reagen run pertama** per parameter yang
       diuji lab sendiri (`deductFirstRuns`, sekali per parameter, `record.reagentDeducted`;
       Subcontract / Not Testable tidak dipotong), `step: 'Done'` → **Confirmed**.
   - **Perubahan setelah SPK** (mis. alat kadar air rusak di tengah pengujian; ISO/IEC 17025 cl. 7.1.6
     / 7.1.8): CRL mengubah Result baris jadi **Subcontract** (vendor terakreditasi) atau **Not
     Testable**, isi **Reason for Change** (wajib bila ada baris yang berubah) → Save.
     - Perubahan tercatat di Document History ("Technical Review Changed: Moisture: Testable →
       Subcontract (SIG) — alasan", `record.reviewChanges`).
     - Pemohon diminta Agree / Decline lagi (step tidak berubah); report tidak bisa di-Submit
       sampai pemohon setuju (flag di report Draft).
     - Parameter yang keluar dari uji internal dan **belum diuji** (belum ada raw data / hasil)
       mendapat kembali reagen run pertamanya (`returnReagents`, log "Auto-return"); yang sudah
       diuji tidak dikembalikan.
     - Subcontract: hasil diketik dari sertifikat vendor, LHU memberi tanda `*` + nama lab +
       No. sertifikat. Not Testable: parameter **tetap tercantum** di LHU sebagai "Not tested" dengan
       tanda `***` dan catatan kaji ulang sebagai alasan.
   - Cetak label langsung setelah SPK terbit (`sample-label.js`).
5. **Excel › tab Internal**: satu sheet per parameter untuk semua request `Done` yang report-nya
   belum ada atau masih Draft (`reportOpenForExcel`); 2 baris (duplo) per Sample No.: Result | AVG
   | RPD < 10% | Inference (Precise / Repeat) | Method | Unit | Push.
   - **Save Raw Data** (cl. 7.5.1): semua nilai yang sudah diketik disimpan saat itu juga
     (`saveWorksheetRawData` → `record.rawData[code] = { values, at, by }`), tanpa push. Pull Data
     berikutnya mengisi sheet dari hasil push, lalu dari `rawData`.
   - **Push Data**: hanya sampel yang kolom Push-nya terisi, ke report Draft request-nya
     (`pushWorksheetResults` → `reportStatus: 'Draft'`, `firstPushAt` / `pushedAt`).
   - Baris Subcontract ditandai `[Subcontract: vendor]`, hasilnya diketik dari sertifikat vendor.
   - Setiap simpan / push yang mengubah nilai ditulis ke **`record.resultLog`** (`resultLogWith`).
6. **Report Draft** (tab **Report** di form request) bagian "Data Hasil Uji (dari Excel)": **hasil hanya dari
   Excel** (satu sumber). Aksi: baris Subcontract → modal **sertifikat vendor** (No. + file,
   `subkontrakCert`, tercatat "Certificate attached" di Document History); baris lab sendiri → link ke
   Excel. Per parameter Diuji Oleh, metode, Ulangan, Hasil, sertifikat, flag (Belum ada hasil,
   Sertifikat belum dilampirkan, Pemohon belum menyetujui subcontract). Riwayatnya ada di
   **Document History** (§14).
7. **Report** — alur di §6a, lalu pemohon men-download sertifikat dari form request-nya.

**List Internal — kolom Progress** (menggantikan Analysis Purpose): bar bertumpuk, satu segmen per
parameter yang diterima (`analysisProgressHtml`, `dummy-requests.js`): hijau = hasil sudah di-push,
kuning = raw data sudah disimpan (sedang dianalisa), kosong = belum mulai; teks "n/m parameters ·
k in analysis", nama + status per segmen di tooltip. Sebelum SPK: "Waiting for SPK". Re-test
mengosongkan hasil, jadi segmennya kembali kosong.

## 6a. Report, Re-test, dan Revision (Internal, Sensory, ASLT)

**Satu jalur untuk setiap versi sertifikat.** Versi pertama, hasil re-test, dan revisi semuanya
lewat langkah yang sama, jadi orang lab cukup hafal satu pola: *CRL review → TCM approve → terbit*.
Versi pertama dikerjakan di tab **Report** form request; Re-test dan Revision adalah **dokumen baru**
(di bawah) yang punya tab Report sendiri untuk versi barunya. Kartu "workflow" di atas report
menunjukkan langkah aktif dan siapa yang harus bertindak.

| `reportStatus` | Siapa | Aksi |
|---|---|---|
| `Draft` | CRL | Cek hasil dari Excel (Internal: tabel Data Hasil Uji + sertifikat Subcontract; semua flag harus selesai) → **Submit for Approval** |
| `Confirm to Approve` | TCM | **Approve & Issue** → `Final`, atau **Return to CRL** + alasan → `Draft` (catatan tampil di kartu workflow; field `reportReturnReason` / `reportReturnedBy` / `reportReturnedAt`, terpisah dari Return to Edit request) |
| `Final` | — | Nomor LHU terbit, request **Closed**, pemohon bisa **Download Certificate** (form request-nya, atau Report list yang untuk non-lab hanya berisi sertifikat terbit). Download = dialog print browser → Save as PDF |

### Dokumen Re-test (RT-) dan Revision (RV-) — hanya setelah sertifikat terbit

Polanya seperti rantai LSPD → SUPD → PSPD di New Material Registration onegenesis-web
(`szRefDocId`): Re-test atau Revision atas sertifikat yang sudah terbit adalah **dokumen sendiri**
(`amendmentForm.html`) dengan nomor, status, dan Document History sendiri, yang merujuk ke
request-nya (`refDocId`). **Tidak ada re-test sebelum sertifikat terbit** (dialog re-test lama dan
tombolnya di form Internal sudah dihapus): sebelum terbit, hasil yang salah diperbaiki di Excel /
Return to CRL; metode atau alat yang salah adalah perubahan Technical Review (CRL).

| | Re-test | Revision |
|---|---|---|
| Nomor | `RT-yyyymm-NNNN` | `RV-yyyymm-NNNN` |
| Siapa membuat | TCM | CRL atau TCM |
| Jenis request | Internal | Internal, Sensory, ASLT |
| Isi form | parameter yang **sudah punya run pertama** (`retestCandidates`: reagen dipotong saat SPK, raw data, atau hasil di-push) + Reason | Sample Name, Customer Address, Packaging (hasil uji tidak berubah) + Reason; perubahannya dibandingkan dengan sertifikat yang diganti |
| Efek Submit | hasil + raw data parameter dikosongkan dan diarsipkan di `resultLog` ("Superseded by Re-test n"), **stok reagen dipotong satu run lagi** (kecuali Subcontract), **Quality Record** Nonconforming Work (`QR-…`), report request kembali `Draft`, Excel menandai baris `[Re-test RT-…]` | field request diubah, report request langsung `Confirm to Approve` |
| Nomor LHU baru | `<base>-RT<n>` | `<base>[-RT<n>]-R<m>` |

Aturan (`amendmentBlocker` / `canAmend`, dicek di tombol **dan** di store `createAmendment`):
hanya bila request punya sertifikat terbit (`reportStatus: 'Final'`) dan **tidak ada dokumen RT- /
RV- lain yang masih terbuka**. Tidak ada approval chain: TCM menyetujui sertifikat barunya.

Alur dokumen:
1. Tombol merah **Re-test** / **Revision** di header form request atau tab Report-nya (hanya role
   yang boleh, `amendmentButtonsHtml`) membuka form baru (`?ref=<request>&src=…&type=retest|revision`).
2. **Submit** (`createAmendment`) → dokumen **Confirmed**; request membawa siklusnya
   (`reportCycle = { type, no, amendmentId, … }`) tapi **tetap Closed** dengan badge "Re-test in
   Progress" / "Revision in Progress", karena sertifikatnya masih berlaku.
3. Pengerjaan tetap di data request: Analyst isi Excel, CRL Push. Report versi baru dikerjakan di
   **tab Report dokumen RT- / RV-** (`ReportPanel.mount({ amendmentId })`, data tetap milik
   request); tab Report request sendiri hanya menampilkan sertifikat yang masih berlaku + link ke
   dokumen terbuka. Badge workflow dokumen: Waiting for Results (Excel) → Waiting for CRL Review →
   Waiting for Report Approval; Revision yang dikembalikan TCM: **Returned to CRL**, CRL / TCM
   mengoreksi di form dokumen lalu Submit lagi (`resubmitRevision`).
4. TCM **Approve & Issue** → LHU baru terbit, sertifikat lama ditandai **Superseded**, dokumen
   **Closed** (`closeAmendment`), siklus request ditutup.

**Pemohon diberi tahu, tidak menyetujui**: BSU melihat dokumennya di accordion list, catatan merah
di form request ("Re-test RT-… in progress · … stays the valid certificate"), Document History
request, dan bisa membuka dokumennya read-only; tab Report dokumen baru muncul untuknya setelah
sertifikat baru terbit.

**Tampilan**:
- **List Internal / ASLT and Sensory**: request yang punya dokumen mendapat tombol expand + badge
  "n Document(s)"; dibuka, tiap dokumen tampil sebagai baris anak (indent, ikon
  `ri-corner-down-right-line`) seperti list New Material Registration. Search nomor RT- / RV-
  membuka accordion request-nya.
- **Document Journey** (sidebar kiri form Internal dan form dokumen, port `DevelopmentJourneySidebar`):
  kartu Request → RT- → RV- … dengan status; dokumen yang dibuka biru, Closed hijau, terbuka ungu;
  jenis yang boleh dibuat role ini tampil "Not Yet" dan bisa diklik untuk membuat. Bisa diciutkan.
  Muncul begitu request punya sertifikat atau dokumen. Form Sensory / ASLT belum punya sidebar ini
  (`CHECKLIST.md`).

Catatan: *Repeat* di kolom Inference Excel (RPD ≥ 10%) adalah pengulangan duplo oleh analis dalam
run yang sama, bukan re-test TCM, dan tidak memotong stok. Sensory / ASLT tidak punya re-test:
mengulang panel berarti sesi Schedule baru.

**Sertifikat lama tetap berlaku sampai versi baru disetujui.** Setiap terbit menyimpan snapshot
(sampel, alamat, kemasan, hasil, statistik panel) di `record.reportHistory` (entri menyimpan
`amendmentId`); kartu Report History (lab) punya tombol download per versi, versi lama ditandai
*Superseded*, dan LHU baru mencatat "replaces …".

Data lama: siklus `reportCycle` tanpa `amendmentId` (dibuat sebelum dokumen ini ada) tetap
diselesaikan di tab Report request seperti dulu; tidak ada migrasi.

## 7. External

Catatan: alur External / Sensory / ASLT tetap memakai ADM sebagai approver terakhir (mereka tidak
punya Technical Review). Lihat `CHECKLIST.md` bila lab ingin menyamakannya.

1. BSU mengisi form. Parameter boleh campur Internal + External
   (`parameterPickerOptions(['Internal', 'External'])`), disimpan `Jenis:value` (`paramKey`; nilai
   lama tanpa jenis dibaca sebagai External lewat `externalRequestParamKeys`).
2. Approval `externalApprovalChain` (Normal selalu lewat HOL).
3. Approval terakhir → `step: 'Sample Delivery'` → **Fully Approved · Waiting for Sample Delivery**.
4. **ADM** menekan **Confirm Delivery** → `step: 'Confirmed'`. **Selesai**: External tidak ke Excel
   / Report (vendor menerbitkan COA sendiri) dan tidak punya tab selain Request List.
5. Tagihan vendor → **Invoice Lab Eksternal** (§10).

## 8. Sensory dan ASLT

**Daftar**: satu halaman `asltAndSensory.html` seperti list Internal / External — tab Sensory dan
ASLT, satu kartu Request List (filter status + search, badge status), satu tombol create di header
yang mengikuti tab aktif (`?tab=aslt` membuka tab ASLT). Kedua form memakai `request-approval.js`
(`setupRequestApproval`): chain, Return to Edit / Reject, badge status sama dengan Internal.

**Form Sensory, bagian Parameter Uji**:
- Tipe uji `MASTER_PARAMETER_SN`: Internal Rating, Ranking, Triangle (Discrimination), Quality
  Monitoring.
- Jenis Sampel = baris teks bebas (tambah baris) dengan Manufacturing Date (`tglPembuatan`) +
  Exp. Date.
- Attributes dan JAR = **satu daftar per request** (baris SpkSelect2 dari FlexTab, tambah baris;
  JAR boleh teks bebas). Booth menanyakan daftar yang sama untuk setiap cup buta, jadi sampel tidak
  bisa dibedakan.
- Triangle: tanpa atribut / ketepatan, tepat 2 sampel, 3 cup (panelis memilih cup yang berbeda).
  Ranking: minimal 2 sampel, tanpa ketepatan.

**Alur**:
1. Submit → chain `requestApprovalChain`.
2. Approval terakhir membuat **blind code** unik lintas semua request Sensory / ASLT
   (`panelNewBlindCodes`) → `step: 'Scheduling'` → **Fully Approved · Waiting for Schedule**.
3. **Schedule** (§9) → sesi disimpan → `markPanelRequestScheduled` → `step: 'Running'` →
   **Confirmed**; baru setelah itu Excel bisa menarik. Sesi terakhir dihapus (belum ada report) →
   kembali `Scheduling`.
4. **Booth PANELIS** (§9) mengumpulkan skor.
5. **Excel › tab Sensory & ASLT**: Pull Data per transaksi — satu sheet per tes panel, satu baris
   per panelis × kode sampel, blok statistik; tampil Serving Order, Serving Pattern + Odd Berbeda.
   Push Data → report Draft.
6. **Report** → CRL review → TCM approve → **Closed** (§6a); tanpa Re-test.

**Excel ↔ Report Draft (semua jenis)**: transaksi tetap ada di Pull Data selama report-nya Draft;
pull ulang mengisi nilai yang sudah di-push dan Push boleh diulang (juga sebagian).

## 9. Schedule dan PANELIS

**Schedule** (`schedule.html`, kalender ala Google Calendar). Hanya Sensory dan ASLT yang punya
jadwal (satu tab masing-masing).
- Kolom kiri "Waiting for Schedule": drag request ke kalender. Klik waktu kosong → popover
  quick-create. Klik sesi → panel samping (offcanvas tanpa backdrop) untuk menambah / menghapus
  request di tempat. Modal penuh "Create / Manage Schedule" hanya untuk semua sesi satu request.
- **Sensory**: slot tetap Session 1 10:00–12:00, Session 2 13:00–15:00, Session 3 15:00–17:00. Satu
  slot boleh banyak request tapi satu jenis saja — Triangle atau Non-Triangle
  (`sensorySessionKind`, `schedule.js` menolak campuran) — dan diwarnai menurut jenis itu; satu
  kotak kalender per sesi.
- **ASLT**: jam bebas, bisa di-drag.
- Panel samping menampilkan tabel Serving plan lab.
- **Test Mode** (saklar khusus mockup, seperti role switcher): `scheduleTestMode()` di
  `dummy-schedule.js`, disimpan di `localStorage` (dibagi dengan PANELIS). Selama aktif semua sesi
  dianggap berjalan (`panelStatusOf`) sehingga booth bisa dites di luar jam sesi; booth / login
  menampilkan badge "Test Mode". Skor seed selalu memakai jam asli.

**PANELIS** (`PANELIS/`): app terpisah untuk panelis — bukan user LAB, tanpa `og-shell.js`
(tanpa sidebar / menu), tapi memakai tema, `lab.css`, `spk-select2.js`, dan data dummy dari
`../LAB/assets/`. Data panel (panelis, sesi, skor, statistik) di `dummy-panel.js`, dipakai kedua app.
- Panelis **tidak pernah didaftarkan**: siapa pun login dengan NIK selama sesi berjalan. NIK di luar
  HRIS (mis. magang) mengisi nama dan dinilai sebagai non-HRIS. HRIS dummy di `dummy-hris.js`.
- Booth tetap per tablet 1–5; mockup memakai `?booth=N`. Sesi ASLT maksimal 5 skor.
- **Serving plan** per panelis dari urutan ia mulai di sesi (`panelServingPlan`): rating /
  ranking / QM / ASLT memakai desain Williams; cup triangle punya kode posisi tetap yang isinya
  berotasi ABB BAB BBA BAA ABA AAB, jadi cup ganjil berbeda per panelis. Rencana disimpan di tiap
  skor (`entry.plan`) dan statistik triangle memeriksa tiap jawaban terhadap cup ganjilnya sendiri.

## 10. Master Data

| Menu | Berkas | Dipakai oleh |
|---|---|---|
| Test Parameters | `parameter.html` + `parameterForm.html` | semua form request, kaji ulang, label, Excel, Report. Hapus diblokir selama dipakai request. **Scope** (KAN, menggantikan halaman Metode & Scope lama), **Spec** (PASS/FAIL LHU), **MU** (ketidakpastian, k=2) |
| Signature & QR | `digitalSignature.html` | tanda tangan LHU |
| Competency Matrix | `analisCompetency.html` | cek kompetensi di kaji ulang, Penunjukan Analis |
| Equipment & Calibration | `equipmentCalibration.html` | cek status alat di kaji ulang |
| Reagents & Stock | `reagenStock.html` | cek stok reagen di kaji ulang |
| Lab Environment Log | `accommodationLog.html` | cek lingkungan uji di kaji ulang |
| External Lab Vendors | `externalVendor.html` (data: `EXTERNAL_VENDORS`, `dummy-requests.js`) | Subcontract Lab (hanya akreditasi KAN berlaku, `kanValidUntil`), External request, invoice |
| External Lab Invoices | `invoice.html` + `invoiceForm.html` | bagian Invoice di form External / Internal |
| Flex Tab | `flexTab.html` + `flexTabForm.html` | dropdown kecil (lihat `ARCHITECTURE.md` §3) |

**Invoice Lab Eksternal** (`dummy-invoices.js`): vendor menagih dengan caranya sendiri, jadi ADM
mencatat tiap invoice (No., vendor, tanggal, jatuh tempo, nominal, status bayar, catatan, file) dan
menautkan request yang dicakup lewat LOV "Cari No. Pengajuan" atas `invoiceCandidates()`: semua
request External + request Internal yang punya parameter Subcontract, vendor yang sama di atas,
tanpa aturan keras. Unpaid yang lewat jatuh tempo tampil Overdue. Form External / Internal
menampilkan invoice-nya read-only di "5. Invoice Lab Eksternal" (`requestInvoicesHtml`),
disembunyikan bila tidak ada.

## 11. Nilai tersimpan

Semua teks UI dan nilai yang disimpan berbahasa Inggris. Nilai baku:

| Field | Nilai |
|---|---|
| Hasil Technical Review | Fully Accepted / Partially Accepted / Rejected |
| Result baris kaji ulang | Testable / Subcontract / Not Testable |
| Status bayar invoice | Unpaid / Paid / Overdue |
| Lab | Physicochemical / Microbiology (Parameter Uji juga Sensory / ASLT) |
| `step` workflow | `Draft`, `Approval`, `Technical Review`, `Sample Delivery`, `Scheduling`, `Running`, `Done`, `Confirmed`, `Rejected` (`Draft Report` lama → `Done`; `Sample Receipt` lama → `Approval` menunggu ADM) |
| Kondisi sampel diterima | Good / Deviation (FlexTab `LAB_SAMPLE_CONDITION`) |
| `customerConsent.status` | Pending / Agreed / Declined |
| Quality Record | type Nonconforming Work / Complaint, status Open / Closed; PT verdict Satisfactory / Questionable / Unsatisfactory |
| `resultLog.action` | Raw data recorded / Pushed / Certificate attached / Superseded by Re-test n |
| `reportStatus` | `Draft` / `Confirm to Approve` / `Final` |
| `reportCycle.type` | `Re-test` / `Revision` |
| Status sesi panel | Scheduled / Ongoing / Done |

Identifier kode (nama field seperti `estSelesai`, id, ID FlexTab seperti `LAB_KATEGORI_PANGAN`)
tetap apa adanya. Tanggal memakai `en-GB`.

## 12. KAN / ISO/IEC 17025 — di mana tiap klausul dipenuhi

Lab terakreditasi KAN memakai SNI ISO/IEC 17025:2017. Peta klausul → fitur mockup:

| Klausul | Fitur | Tempat |
|---|---|---|
| 6.2 Personel | Competency Matrix, Penunjukan Analis | `analisCompetency.html`, Technical Review |
| 6.3 / 6.4 Fasilitas, peralatan | cek Lingkungan + Alat di kaji ulang | Technical Review |
| 6.6 Penyedia eksternal | Subcontract Lab hanya vendor dengan akreditasi KAN berlaku | `EXTERNAL_VENDORS`, `vendorAccredited` |
| 7.1 Kaji ulang permintaan | Technical Review **sebelum** SPK; Partially Accepted / Subcontract → persetujuan pemohon | `issueInternalSpk`, `customerConsent` |
| 7.4 Penanganan sampel | Sample Receipt (= approval ADM): waktu terima, kondisi, penyimpangan, masa simpan; Sample No. unik + label | `record.receipt`, `sampleNos` |
| 7.5 Rekaman teknis | Save Raw Data, Document History append-only (nilai lama tidak pernah hilang) | `rawData`, `resultLog`, `activity` |
| 7.6 Ketidakpastian | MU per parameter di master, kolom Uncertainty (k=2) di LHU | `dummy-parameters.js` `mu` |
| 7.7 Validitas hasil | duplo + RPD di Excel; Proficiency Testing (z-score) | Excel, Quality Records › PT |
| 7.8 Pelaporan | LHU: tgl terima, kondisi, periode uji, tgl terbit, metode, MU, pernyataan "hanya berlaku untuk sampel yang diuji", halaman x dari y (print), Subcontract `*`, di luar scope `**` (logo KAN hanya bila ada hasil dalam scope), aturan keputusan PASS/FAIL (`specConformity`, `DECISION_RULE_TEXT`) | `report-form.js` |
| 7.8.8 Amandemen | dokumen Revision / Re-test (RV- / RT-) → nomor baru "replaces …", versi lama Superseded + snapshot | §6a |
| 7.9 / 7.10 / 8.7 Keluhan, pekerjaan tidak sesuai, tindakan korektif | Quality Records; Re-test & PT jelek otomatis membuat Nonconforming Work | `qualityRecords.html`, `dummy-quality.js` |

**Quality Records** (HOLABSYS › Quality Records, `dummy-quality.js`): tab Nonconforming Work &
CAPA, Complaints, Proficiency Testing. Record ditutup hanya dengan Root Cause + Corrective Action
(role lab). Hasil PT: z = (hasil − nilai acuan) / σpt; |z| ≤ 2 Satisfactory, < 3 Questionable,
selain itu Unsatisfactory → otomatis Nonconforming Work.

## 13. Dashboard

Satu struktur untuk semua role (`index.html`, `dashboard.js`); isinya mengikuti role:

1. **Banner** — nama, role, jumlah item yang menunggu role ini.
2. **4 tile KPI** — daftar per role di `DASH_ROLE_KPIS` (mis. ADM: Samples to Receive, Deliveries
   to Confirm, Panels to Schedule, Overdue Invoices; TCM: Reports to Approve, Open Re-tests, Open
   Nonconformities, PT to Follow Up). Tile tidak mengulang irisan pie.
3. **Pie Request Status** (Waiting / In Progress / Done / Over Deadline) — BSU hanya request
   miliknya (`pemohon`), role lain semua request. Klik irisan / legenda → modal detail.
4. **My Action Queue** — request yang `nextActor()` (`dummy-requests.js`) = role ini; aturan yang
   sama dipakai stepper form (`docProgressHtml`), jadi dashboard dan form tidak pernah berbeda.
5. **Request Pipeline** — jumlah per tahap (Approval, Lab Intake, Technical Review, Testing,
   Report Review, Completed); tahap yang berisi item untuk role ini disorot.

## 14. Document History — satu sumber riwayat

Tombol **Document History** di form Internal, External, Sensory, ASLT, dan Report membuka riwayat
yang sama (`documentHistoryHtml`, `spk-history.js`), dengan markup offcanvas SpkForm onegenesis-web (`ul.tl`, titik berikon, judul aksi + badge status, user · waktu):

- **`record.activity`** — ditulis otomatis oleh store (`updateRequest`, `updateExternalRequest`,
  `updateSensoryRequest`, `updateAsltRequest` → `mergeWithActivity` / `trackActivity`), jadi tidak
  ada halaman yang mencatat sendiri: Saved as Draft, Submitted, Approved (per level), Returned to Edit,
  Rejected, Sample Received, Sent to Requester / Requester Agreed / Declined, SPK Issued, Delivery
  Confirmed, Scheduled, Report Submitted / Returned, Revision Submitted, Certificate Issued, Re-test n.
  Dokumen RT- / RV- punya `activity` sendiri (Submitted, Resubmitted, Certificate Issued — ditulis
  `updateAmendment`); offcanvas-nya menambahkan event report request sejak dokumen dibuka dan
  perubahan hasil parameter yang di-re-test.
  Siapa + kapan + catatan (alasan). Append-only.
- **`record.resultLog`** — perubahan hasil (Raw data recorded, Pushed, Certificate attached,
  Superseded by Re-test n); **hanya untuk role lab**, pemohon tidak melihat nilai mentah.

Record lama tanpa `activity` dibangun ulang sekali dari field yang ada (`legacyActivity`).
Offcanvas **Approval History** (tombol Last Approver) juga port SpkForm: baris Creator lalu tiap level approver (avatar inisial, Approver · Level n, badge Approved / RTE / Rejected / Pending, tanggal, chip alasan); kartu Report History
(versi sertifikat + download) tetap di form Report.

## 15. Report di dalam form request (tab, per akses)

Halaman Report terpisah dihapus; report (LHU) tampil sebagai **tab Report** di form Internal,
Sensory, dan ASLT (`ReportPanel.mount`, `report-form.js`). Report tetap record sendiri (nomor LHU,
`reportStatus`, versi `reportHistory`; ISO/IEC 17025 cl. 7.8) — hanya layarnya yang disatukan.

| Tab | Siapa yang melihat |
|---|---|
| Form (Internal / Sensory / ASLT Form) | semua role |
| Technical Review & SPK (Internal) | CRL |
| Report | role lab (HOL, ADM, CRL, ANL, TCM) begitu report ada; role lain (pemohon, approver) hanya setelah sertifikat terbit — melihat & download sertifikat terbit saja (`reportTabVisible`) |

Tab bar disembunyikan bila hanya satu tab. Saat tab Report aktif, tombol header milik report
(Submit for Approval, Return to CRL, Approve & Issue, Re-test / Revision = buat dokumen baru, Print / Download); kembali ke
tab Form, tombol form muncul lagi. Menu **Report** tetap ada sebagai antrean (CRL / TCM), setiap
baris membuka `<form>.html?docId=…&tab=report` (`REPORT_FORM_PAGE`); `&view=issued[&v=n]`
menampilkan versi terbit.
