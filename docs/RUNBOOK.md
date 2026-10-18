# Runbook — Jalankan Apa, Kapan

Operasional sehari-hari LAB mockup. Pemasangan dari nol ada di `SETUP.md`.

## Ringkasan

| Situasi | Yang dijalankan | Rinciannya |
|---|---|---|
| Lihat / tes halaman | buka file, atau serve root repo | §1 |
| Tambah / ubah halaman | skill `onegenesis-mockup` + `MENU` di `og-shell.js` | §2 |
| Data dummy aneh, seed baru tidak muncul | hapus key / naikkan versi key | §3 |
| Tema onegenesis-web berubah | `sync-theme.ps1` | §4 |
| Halaman siap dipindah ke React | jalur porting | §5 |
| Sebelum commit | cek | §6 |

## 1. Preview

```bash
npx --yes http-server C:/Users/Bentang/Projects/experiment/LAB -p 8765 -c-1 -s
```

- `-c-1` = tanpa cache, edit langsung terlihat saat reload. Serve **root repo**, bukan `LAB/`.
- Port 8765 sudah dipakai (`EADDRINUSE`)? Biasanya server dari sesi lain masih jalan dan sudah
  melayani root yang sama — pakai saja, atau cek `netstat -ano | findstr :8765`.
- Hentikan server yang Anda jalankan sendiri setelah selesai.

## 2. Tambah / ubah halaman

1. Pakai skill `onegenesis-mockup` (template `list.html` / `form.html`, markup Spk, class map).
2. Daftarkan di `MENU` (`LAB/assets/og-shell.js`); form ikut ke `also: [...]` milik list-nya.
3. Script halaman → `LAB/assets/<page>.js`; data → `LAB/assets/dummy-*.js` (pola store, lihat
   `ARCHITECTURE.md` §4).
4. Dropdown tunggal = `<select class="form-select">` + `spk-select2.js`; multi = TomSelect.
   Daftar pendek = FlexTab, parameter = master Parameter Uji.
5. Teks UI bahasa Inggris, tanggal `en-GB`; role lewat `currentRole()`; status, chain, dan nomor
   dokumen dari helper bersama (`ARCHITECTURE.md` §3), jangan salinan lokal.
6. Cek light + dark mode, console bersih.

## 3. Reset data dummy

Seed hanya ditulis bila key belum ada. Di console browser (origin yang sama dengan halaman):

```js
// satu entitas
localStorage.removeItem('holabsysRequests.v2.en'); location.reload();
// semua data mockup (role & tema ikut terhapus)
Object.keys(localStorage).filter(k => /^holabsys|^og/.test(k)).forEach(k => localStorage.removeItem(k)); location.reload();
```

Mengubah struktur / isi `SEED_*` yang harus terlihat oleh semua orang → **naikkan versi key**
(`holabsysSchedules.v3.en` → `.v4.en`) di `dummy-*.js` dan di tabel `ARCHITECTURE.md` §4.

## 4. Sinkron tema

```powershell
# di onegenesis-web: npm run build  (bila style berubah)
powershell -ExecutionPolicy Bypass -File LAB/assets/og-theme/sync-theme.ps1
```

Membaca `onegenesis-web/dist/assets/index-*.css`, menyalin font/gambar yang dirujuk, dan
membuat path relatif. Jangan mengedit `og-theme/` manual.

## 5. Porting ke onegenesis-web

Peta komponen: `ARCHITECTURE.md` §7. Alur bisnis yang harus dibawa (status, chain, role):
`FLOW.md`. Di `onegenesis-web` ikuti aturan repo itu (`ONE-Genesis/CLAUDE.md`,
`.claude/rules/react-page-pattern.md`, `spk-design-system.md`).

## 6. Sebelum commit

- Hook Claude sudah menjalankan `node --check` tiap edit JS; untuk semua berkas:
  `for f in LAB/assets/*.js PANELIS/assets/*.js; do node --check "$f"; done`
- Buka halaman yang disentuh, console bersih, light + dark.
- Halaman baru ada di `MENU`; key `localStorage` baru tercatat di `ARCHITECTURE.md`.
- Alur / aturan domain berubah → perbarui `FLOW.md` (+ `FLOWCHART.md`); helper / store / key baru
  → `ARCHITECTURE.md`. CLAUDE.md tidak memuat aturan domain.
- Edit lewat Bash (`sed`) tidak memicu hook — jalankan `node --check` sendiri.
