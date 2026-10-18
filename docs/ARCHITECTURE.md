# Cara Kerja LAB Mockup

**Mulai dari sini.** Dokumen ini menjelaskan bagaimana mockup HOLABSYS tersusun: dari satu
halaman HTML sampai data dummy di `localStorage`, dan di mana tiap jenis logika tinggal. Alur
bisnis (status, approval, role) ada di `FLOW.md`, diagramnya di `FLOWCHART.md`.

Ditulis 2026-10-11 dari kode di branch `claude/keen-gauss-wb4znz`. Kalau kode dan dokumen ini
berbeda, **kodenya yang benar**, lalu perbaiki dokumen ini.

## 1. Apa ini

Mockup statis modul **Lab Management (HOLABSYS)** untuk ONE-Genesis. Tampilannya memakai tema
asli `onegenesis-web`, jadi tiap blok bisa dipindah 1:1 ke komponen Spk React. **Tidak ada
backend, tidak ada build step**: HTML + CSS + JS klasik, data dummy di `localStorage` browser.

Dua aplikasi dalam satu repo:

| App | Folder | Pengguna | Shell |
|---|---|---|---|
| **LAB** (HOLABSYS) | `LAB/` | karyawan (BSU, approver, lab) | `og-shell.js`: header, sidebar, role switcher |
| **PANELIS** | `PANELIS/` | panelis sensory di tablet booth | tanpa shell; login NIK → booth |

Keduanya memuat aset dan data dari `LAB/assets/`, jadi **harus satu origin** supaya berbagi
`localStorage` (lihat §5).

## 2. Lapis sebuah halaman

```
LAB/HOLABSYS/internalForm.html          markup konten saja (komentar <!-- SpkXxx --> per blok)
  │  <link>  og-theme/onegenesis.css    tema asli onegenesis-web (vendored, jangan diedit)
  │  <link>  lab.css                    override khusus mockup
  │  <script> CDN: bootstrap, jquery, select2, tom-select, flatpickr, (fullcalendar, react)
  │  <script> og-shell.js               header + sidebar + footer + MENU + ROLES + dark mode
  │  <script> spk-select2.js, spk-toast.js, spk-lov.js   port komponen Spk
  │  <script> dummy-*.js                data + helper domain (status, nomor, approval chain)
  └─ <script> internal-form.js          logika halaman (render, event, role gate)
```

- **Tidak ada ES module dan tidak ada `fetch()`** file lokal — semua `<script src>` klasik,
  fungsi berbagi lewat global. Urutan `<script>` di HTML = urutan dependensi.
- **Library dari CDN** (`cdn.jsdelivr.net`). Mockup butuh internet; offline, select2/TomSelect/
  FullCalendar tidak termuat.
- `og-shell.js` membaca lokasinya sendiri (`document.currentScript`) untuk menghitung `rootBase`,
  jadi link MENU benar dari folder mana pun.

## 3. Di mana logika tinggal

| Jenis logika | Tempat | Contoh |
|---|---|---|
| Menu, role dummy, tema | `og-shell.js` | `MENU`, `ROLES`, `findRole()`, `currentRole()`, event `holabsys:rolechange` |
| Store + seed data per entitas | `dummy-*.js` | `getRequests()`, `updateRequest()`, `SEED_REQUESTS` |
| Status dokumen + badge | `dummy-requests.js` | `getDocStatus()`, `DOC_STATUS`, `DOC_WORKFLOW`, `docStatusCardHtml()` |
| Nomor dokumen | `dummy-requests.js` | `nextFreeNo()`, `generateRequestNo()`, `generateSpkNo()`, `generateReportBaseNo()` |
| Approval chain | `dummy-requests.js`, `dummy-external-requests.js` | `requestApprovalChain(tipe, tujuan)` (Internal, Sensory, ASLT; ADM selalu terakhir, di Internal = Sample Receipt), `externalApprovalChain()`, `docApprovalChain(source, r)` |
| Siapa bertindak berikutnya + stepper form | `dummy-requests.js` | `nextActor(source, r)`, `docStepKey()`, `docProgressHtml()` — dipakai form request **dan** Dashboard |
| Sample Receipt, persetujuan pemohon, SPK (Internal) | `dummy-requests.js`, `internal-form.js`, `internal-review-tab.js` | `issueInternalSpk()`, `deductFirstRuns()`, `consentPending()`, `consentItemsFor()`, `retentionUntil()` |
| Document History (satu riwayat) | `dummy-requests.js`, `dummy-worksheet.js` | `spk-history.js` (sama persis di kedua versi proposal): `trackActivity()` / `mergeWithActivity()` dipanggil setiap store update → `record.activity`; render `requestApprovalHistoryHtml()` (offcanvas Approval History) dan `documentHistoryHtml()` (Document History) = markup SpkForm onegenesis-web; `resultLogWith()`, `saveWorksheetRawData()` → `record.resultLog`; `documentHistoryHtml()` dipakai offcanvas Document History semua form + Report |
| Vendor lab (satu master) | `dummy-requests.js` | `EXTERNAL_VENDORS`, `EXTERNAL_MASTER_LAB` (nama), `vendorByName()`, `vendorAccredited()` |
| Pernyataan kesesuaian LHU | `dummy-parameters.js` | `specConformity(spec, result)`, `DECISION_RULE_TEXT`, field `scope` / `mu` |
| Quality Records (NC, keluhan, PT) | `dummy-quality.js`, `quality-records.js` | `addQualityRecord()`, `ptZScore()`, `ptVerdict()` |
| Dashboard per role | `dashboard.js` | `DASH_KPI`, `DASH_ROLE_KPIS`, `dashAllRows()` |
| Approval UI Sensory/ASLT | `request-approval.js` | `setupRequestApproval(opts)` |
| Kaji ulang + label (CRL) | `internal-review-tab.js`, `sample-label.js` | tab "Technical Review & SPK" |
| Worksheet Excel ↔ Report | `dummy-worksheet.js`, `excel.js` | `pushWorksheetResults()`, `reportOpenForExcel()`, `getReportRows()` |
| Report lifecycle (Draft → Confirm to Approve → Final, Re-test, Revision, snapshot) | `dummy-requests.js`, `report-form.js` | `reportStatusOf()`, `reportStatusBadgeHtml()`, `lastIssuedReport()`, `reportRetestCount()`, `reportNoFor()`, `isLabRole()`, `docReportNoteHtml()` |
| Dokumen Re-test (RT-) / Revision (RV-), hanya setelah sertifikat terbit | `dummy-requests.js` (store + logika), `amendment-form.js` (halaman `amendmentForm.html`), `doc-journey.js` (sidebar Document Journey) | `AMENDMENT_TYPES`, `getAmendments()`, `amendmentsOf(refDocId)`, `openAmendmentOf(r)`, `amendmentBlocker()` / `canAmend()`, `createAmendment()`, `resubmitRevision()`, `closeAmendment()`, `applyRetest()`, `applyRevision()`, `getAmendmentStatus()`, `amendmentButtonsHtml()`, accordion list `amendmentToggleHtml()` / `amendmentChildRowsHtml()`, `DocJourney.render()`. Pengerjaan tetap di record request (`reportCycle.amendmentId`); `ReportPanel.mount({ amendmentId })` di tab Report dokumen. `retestCandidates()`, `openRetest()`, `retestLabelFor()` (label Excel `[Re-test RT-…]`) |
| Stok reagen + pemotongan otomatis | `dummy-reagents.js` (dipakai `reagen-stock.js`, `internal-review-tab.js`, `applyRetest`) | `getReagents()`, `REAGENT_USAGE`, `reagentCheck()`, `deductReagents()` |
| Panel (sesi, skor, statistik) | `dummy-panel.js`, `dummy-schedule.js` | `panelSessions()`, `panelStatusOf()`, `scheduleTestMode()` |
| Serving plan & blind code | `dummy-aslt-sensory-requests.js` | `panelNewBlindCodes()`, `panelServingPlan()` (Williams) |
| No. Reference (salin request lama) | `request-reference.js` | `RequestReference.setup()`, `requestTemplate()`, `REFERENCE_SKIP` |
| Master kecil (dropdown) | `dummy-flextab.js` | `flexTabOptions(id[, parent])` |
| Master parameter uji | `dummy-parameters.js` | `getLabParameters()`, `parameterPickerOptions()` |
| Komponen Spk | `spk-select2.js`, `spk-lov.js`, `spk-toast.js`, `spk-kit.js`, `on-behalf.js` | `SpkLov.open`, `ToastService`, `validateForm`; `spk-kit.js`: tombol dokumen `STANDARD_BUTTON_DEFS` (`spkDocButtonsHtml`, `spkButtonHtml`), konfirmasi Save Draft / Submit / Approve (`spkOnDocAction`, `SpkConfirm`), `spkCountercardHtml` (SpkCountercard). Status: `spkStatusPill` (list) + `docStatusCardHtml` (kartu) di `dummy-requests.js` |

### Satu sumber per data

Jangan menambah daftar kedua untuk data yang sudah punya sumber:

- **Status** hanya dari `getDocStatus()`, **chain** hanya dari dua fungsi chain di atas, **nomor**
  hanya dari `nextFreeNo()`, **role** hanya dari `currentRole()`, **status report** hanya dari
  `reportStatusOf()`, **stok reagen** hanya dari `dummy-reagents.js` (cek kaji ulang membaca stok
  live, pemotongan lewat `deductReagents()`), **siapa bertindak** hanya dari `nextActor()`, **vendor**
  hanya dari `EXTERNAL_VENDORS`, **hasil uji** hanya dari Excel (report tidak mengedit nilai).
- **Parameter Uji** hanya dari master Master Data › Test Parameters (`Master-Data/parameter.html`,
  tab Internal / External, + `parameterForm.html`; hapus diblokir selama dipakai request). Data di
  `dummy-parameters.js` (`getLabParameters()`). Tiap baris punya `jenis` (Internal / External);
  baris Internal punya `lab` (Physicochemical / Microbiology / Sensory / ASLT) dan dikelompokkan per
  lab, baris External tanpa lab. Cari satu dengan `labParameter(jenis, value)`. Form Internal memilih
  dari `parameterPickerOptions('Internal')` (TomSelect, optgroup "Physicochemical Lab" /
  "Microbiology Lab", seperti dropdown Pull Data di Excel). Form External memakai
  `parameterPickerOptions(['Internal', 'External'])` (INTERNAL per lab, lalu EXTERNAL satu grup) dan
  menyimpan `Jenis:value` (`paramKey`). Kaji ulang, label, Excel, dan Report membaca master yang
  sama.
- **Dropdown kecil = FlexTab** (Master Data › Flex Tab, port `Core/GEN/FlexTab` onegenesis-web:
  ID + Description + Parent ID per item, `dummy-flextab.js`): Kategori Pangan, Jenis Kemasan, Suhu,
  Nama SKU (anak dari Brand), Sensory Attributes / Just-About-Right, daftar kemasan & kategori ASLT,
  Uji Kebocoran. Form mengisinya dengan `flexTabOptions(id[, parentDescription])` (value =
  Description). Jangan hardcode daftar seperti itu di form; tambahkan FlexTab.
- Master dengan kolom lebih banyak (Site, Parameter Uji, Alat, Reagen, Kompetensi, Vendor, Tanda
  Tangan) punya halaman sendiri.
- Alamat dari `siteOptions()` (`dummy-sites.js`), HRIS dari `dummy-hris.js`.

## 4. Pola store `localStorage`

Semua `dummy-*.js` memakai pola yang sama:

```js
function getRequests() {
  var raw = localStorage.getItem(KEY);
  if (!raw) { localStorage.setItem(KEY, JSON.stringify(SEED)); raw = ... }   // seed sekali
  return JSON.parse(raw).map(migrasiRingan);
}
function updateRequest(id, patch) { /* cari by id, Object.assign, saveRequests */ }
```

Baca selalu dibungkus `try/catch` dan jatuh ke seed; simpan (`save*`) tidak menelan error, supaya
data yang gagal tersimpan kelihatan di console. Pengecualian: preferensi shell (`storageSet` untuk
role / tema) dan penulisan seed awal.

Karena pola di atas, **seed hanya ditulis kalau key belum ada**. Mengubah `SEED_*` tidak terlihat di browser
yang sudah punya data — naikkan versi key (`.v3.en` → `.v4.en`) atau hapus key-nya.

| Key | Isi | Berkas |
|---|---|---|
| `holabsysRequests.v3.en` | request Internal (v3: nomor seed satu deret; versi 1 tetap `v2`) | `dummy-requests.js` |
| `holabsysSampleSeq.en` | counter Sample No. 5 digit | `dummy-requests.js` |
| `holabsysExternalRequests.en` | request External | `dummy-external-requests.js` |
| `holabsysSensoryRequests.v4.en` | request Sensory | `dummy-aslt-sensory-requests.js` |
| `holabsysAsltRequests.v2.en` | request ASLT | `dummy-aslt-sensory-requests.js` |
| `holabsysSchedules.v3.en` | sesi Schedule | `dummy-schedule.js` |
| `holabsysScheduleTestMode` | saklar Test Mode | `dummy-schedule.js` |
| `holabsysPanelScores.v6.en` | skor panelis | `dummy-panel.js` |
| `holabsysPanelist.v3.en` | login panelis aktif | `dummy-panel.js` |
| `holabsysParameters.en` | master Parameter Uji | `dummy-parameters.js` |
| `holabsysFlexTabs.v3.en` | master FlexTab | `dummy-flextab.js` |
| `holabsysInvoices.en` | invoice lab eksternal | `dummy-invoices.js` |
| `holabsysFlexTabsSeeded.en` | ID FlexTab seed yang sudah pernah dibagikan (FlexTab seed baru ditambahkan sekali) | `dummy-flextab.js` |
| `holabsysQuality.en`, `holabsysProficiency.en` | Quality Records + hasil PT | `dummy-quality.js` |
| `holabsysAmendments.en` | dokumen Re-test (RT-) / Revision (RV-); tanpa seed | `dummy-requests.js` |
| `holabsysJourneyCollapsed` | sidebar Document Journey diciutkan (kenyamanan per viewer) | `doc-journey.js` |
| `holabsys_reagen_data.en`, `holabsys_reagen_logs.en` | stok reagen + log pemakaian | `dummy-reagents.js` |
| `holabsysRole` | role mockup aktif | `og-shell.js` |
| `ogTheme` | light / dark | `og-shell.js` |
| `ogToast` | toast yang menyeberang navigasi | `spk-toast.js` |

Akhiran `.en` = data sudah diterjemahkan ke Inggris; data Indonesia lama tidak dibaca lagi.

## 5. Origin dan berbagi data

- Dibuka sebagai `file:///`: tiap browser memperlakukan origin `file` sendiri-sendiri; Chrome
  berbagi satu storage untuk semua file lokal, browser lain belum tentu.
- Diserve: **serve root repo** (bukan `LAB/`), supaya `/LAB/...` dan `/PANELIS/...` satu origin
  `http://localhost:8765` dan satu `localStorage`. Kalau di-serve dari `LAB/`, PANELIS tidak
  terjangkau dan booth tidak melihat sesi Schedule.

## 6. Role mockup

Role dipilih di header (dropdown, hanya ada di mockup) dan disimpan di `holabsysRole`. Halaman
membaca `currentRole()` saat render atau mendengar event `holabsys:rolechange`. PANELIS tidak punya
role. Daftar role dan siapa boleh menekan apa: `FLOW.md` §2.

## 7. Jalur porting ke onegenesis-web

| Mockup | onegenesis-web |
|---|---|
| `<!-- SpkForm -->`, `<!-- SpkTablePagination -->`, … | komponen Spk dengan nama yang sama |
| `<select class="form-select">` + `spk-select2.js` | `SpkSelect2` |
| `SpkLov.open(...)` (`spk-lov.js`) | `LovModal.jsx` / `SpkLovInput` |
| FlexTab (`dummy-flextab.js`) | `Core/GEN/FlexTab` |
| `dummy-*.js` store | `api/services/*Service.js` + `hooks/use*.js` + SP AVO_* |
| `getDocStatus()` + approval chain | AvoLib approval matrix + saga (lihat `ONE-Genesis/docs/ARCHITECTURE.md`) |

Markup referensi dan class map ada di skill `onegenesis-mockup`
(`.claude/skills/onegenesis-mockup/`).
