# LAB — Pelajaran

Catatan yang **tidak kelihatan dari kode**: jebakan, hal yang gagal tanpa error, dan konfigurasi
yang diam-diam basi. Tambah entri baru di bawah, jangan menulis ulang yang lama — kalau ternyata
salah, coret dan beri koreksi bertanggal.

## Pelajaran

### 1. Seed dummy hanya ditulis sekali (2026-10-11)
`dummy-*.js` menulis `SEED_*` ke `localStorage` hanya bila key belum ada. Mengubah seed tidak
terlihat di browser yang sudah pernah membuka halaman, tanpa error.
**Pelajaran:** setelah mengubah seed, naikkan versi key (`.vN.en`) atau reset key
(`RUNBOOK.md` §3). Itu juga sebabnya key berakhiran `.en`: data Indonesia lama tidak dibaca.

### 2. Serve root repo, bukan `LAB/` (2026-10-11)
LAB dan PANELIS berbagi data lewat `localStorage`, yang per origin. Serve dari `LAB/` membuat
PANELIS tak terjangkau; membuka satu app via `file://` dan yang lain via `http://` memisahkan
storage — booth tidak melihat sesi Schedule, tanpa error. README sempat memuat perintah
`http-server LAB` yang salah (diperbaiki 2026-10-11).

### 3. Port 8765 bisa sudah dipakai sesi lain (2026-10-11)
`npx http-server ... -p 8765` gagal `EADDRINUSE` kalau server dari sesi Claude / terminal lain
masih jalan. Server itu biasanya melayani root yang sama dan bisa langsung dipakai; jangan
mematikan proses yang bukan milik Anda.

### 4. Role mockup tersimpan global (2026-10-11)
`holabsysRole` ada di `localStorage`, jadi mengganti role di satu tab (atau lewat skrip tes)
mengubah role di semua tab origin itu. Setelah tes otomatis, kembalikan role semula.

### 5. Nomor dokumen Internal / External / SPK / LHU acak 10–99 (2026-10-11)
`generateDocNo` (`internal-form.js`, `external-form.js`), `generateSpkNo` (`dummy-requests.js`),
dan `reportGenerateNo` (`report-form.js`) memakai `Math.random()` dua digit. `addRequest` tidak
mengecek duplikat, jadi dua request baru di bulan yang sama bisa bernomor sama dan
`getRequestById` / `updateRequest` mengenai record yang salah. Sensory dan ASLT sudah memakai
"nomor bebas berikutnya" (`generateSensoryDocNo`, `generateAsltDocNo`).
**Diperbaiki 2026-10-11:** semua nomor lewat `nextFreeNo()` di `dummy-requests.js`; Internal dan
External berbagi deret REQ- (`internalForm.html` kini memuat `dummy-external-requests.js`).
**Pelajaran:** jangan memanggil helper yang membaca store dari dalam getter store itu sendiri —
migrasi di `getRequests()` sempat memanggil `generateSpkNo()` → `getRequests()` (rekursi tak hingga
yang ditelan `try/catch` lalu diam-diam jatuh ke seed). Migrasi kini menghitung dari list yang
sedang diparse. Rename massal dengan `sed` juga mengganti nama **definisi** lokal
(`function generateDocNo()` → `function generateRequestNo()`), yang lalu menimpa helper global;
setelah rename, grep definisinya.

### 6. Mockup butuh internet (2026-10-11)
Library dimuat dari CDN. Offline, select2 / TomSelect / FullCalendar / FortuneSheet tidak ada dan
halaman rusak sebagian — bukan bug kode.

### 7. Tab Technical Review hanya untuk CRL (2026-10-11)
Kode (`refreshTabs()` di `internal-form.js`) menampilkan tab kaji ulang hanya untuk CRL, tapi
beberapa teks lama menyebut "Lab Admin (ADM)" yang mengisi kaji ulang (komentar di
`internal-form.js`, sebagian bullet `CLAUDE.md`, README lama). Pegangan: **CRL**.
**Diperbaiki 2026-10-11:** komentar kode, skill, README, dan docs memakai CRL dan nama tab di UI,
"Technical Review & SPK". Aturan domain kini hanya ditulis di `docs/FLOW.md`, supaya tidak ada
salinan kedua yang bisa basi.

### 8. Report form memegang `record` di closure (2026-10-11)
`report-form.js` membaca record sekali saat halaman dimuat. Push dari Excel terjadi di halaman lain,
jadi di pemakaian nyata report selalu dibuka ulang dan segar. Skrip uji yang memanggil
`pushWorksheetResults()` di tab yang sama lalu menekan Submit akan melihat flag lama ("No result
yet") dan Submit diblokir — muat ulang halaman setelah mengubah data dari luar. Begitu juga mengganti
role saat tes: pakai dropdown header (`#roleSelect`), bukan `applyRole()` langsung, karena select2
bisa mengembalikan nilai lama. Modal Bootstrap juga mengabaikan `hide()` selama animasi `show` masih
berjalan; klik secepat skrip bisa meninggalkan modal terbuka, klik manusia tidak.

### 9. Sertifikat lama harus dirender dari snapshot (2026-10-11)
Sertifikat dirender dari field record yang hidup. Begitu Re-test / Revision mengubah hasil atau
nama sampel, versi yang sudah terbit akan ikut berubah di bawah nomor lamanya kalau dirender dari
record. Karena itu tiap Approve & Issue menyimpan snapshot di `reportHistory`, dan report lama
(seed / sebelum perubahan ini) diberi entri snapshot dulu (`ensureHistory`) sebelum siklus baru.

### 10. Input Excel yang belum di-push tidak tersimpan (2026-10-11, diperbaiki 2026-10-13)
**Sudah diperbaiki:** tombol Save Raw Data menyimpan `rawData` + `resultLog`; `retestCandidates`
juga membaca `rawData`. Catatan lama di bawah tetap untuk konteks.
`excel.js` hanya mengisi sheet dari `record.results` (hasil yang sudah di-push); nilai yang diketik
analis tapi belum di-push hilang saat halaman dimuat ulang. Jadi sistem tidak bisa tahu "parameter
ini sudah mulai diuji" dari Excel. Patokan yang dipakai: reagen sudah dipotong saat Technical Review
(`record.reagentDeducted`) atau hasil sudah di-push. Itu yang menentukan parameter mana yang boleh
di-re-test sebelum report ada (`retestCandidates`).

### 11. Field / step baru tidak sampai ke browser yang sudah punya data (2026-10-13)
Seed hanya ditulis sekali (#1), jadi perubahan alur harus membawa migrasi saat baca, bukan hanya seed
baru: `getRequests()` memindahkan `Draft Report` → `Done` dan request `Approval` yang levelnya sudah
tidak ada (ADM keluar dari chain Internal) → `Sample Receipt`; `getLabParameters()` mengisi `mu` dari
seed; `getFlexTabs()` menambahkan FlexTab seed baru sekali (`holabsysFlexTabsSeeded.en`, supaya
FlexTab yang dihapus user tidak kembali). Seed request baru (REQ-202610-0003 / 0004) tidak muncul
di browser lama — buat request baru atau reset data (`RUNBOOK.md`).

### 12. `alert-*-transparent` tidak ada di tema (2026-10-13)
`badge bg-*-transparent` ada, tapi `alert-*-transparent` tidak: catatan status (sampel diterima,
persetujuan pemohon, re-test, sertifikat) tampil tanpa kotak. `alert alert-warning` dsb. di tema
onegenesis sudah versi lembut (latar 10%), jadi pakai itu. Cek kelas baru di `onegenesis.css` dulu.

### 13. PowerShell 5.1 merusak UTF-8 saat edit file (2026-10-14)
`Get-Content` tanpa `-Encoding UTF8` membaca file sebagai ANSI, lalu `Set-Content -Encoding utf8`
menulisnya kembali sebagai UTF-8 + BOM: semua karakter non-ASCII (→, —, ✅) jadi rusak ("â†’").
Edit docs dengan tool Edit / Write atau Node, bukan PowerShell.
