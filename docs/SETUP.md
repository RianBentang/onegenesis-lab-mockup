# Setup dari Nol

Memasang LAB mockup di mesin baru. Cara kerja sistemnya ada di `ARCHITECTURE.md`, kerja
sehari-hari di `RUNBOOK.md`.

## 0. Prasyarat

- Browser modern (Chrome / Edge). Internet — library (bootstrap, jquery, select2, tom-select,
  flatpickr, fullcalendar, react untuk Excel) dimuat dari `cdn.jsdelivr.net`.
- **Node.js** — hanya untuk server preview (`npx http-server`) dan hook Claude (`node --check`).
- Git.
- Opsional: clone `ONE-Genesis` di `C:\Users\Bentang\Projects\work\ONE-Genesis` — dibutuhkan
  untuk sinkron tema (`onegenesis-web/dist`) dan sebagai referensi porting.

**Tidak dipakai:** Python, npm install, build step. Jangan ditambahkan.

## 1. Clone

```
experiment/LAB/
├── CLAUDE.md, README.md
├── .claude/        settings.json, hooks/, skills/onegenesis-mockup/
├── docs/           dokumen ini
├── LAB/            situs mockup HOLABSYS
└── PANELIS/        app booth panelis
```

`.claude/settings.local.json` per mesin (gitignored); isinya cukup `additionalDirectories` ke
folder ONE-Genesis kalau Claude perlu membaca `onegenesis-web`.

## 2. Buka

Paling cepat: buka `LAB/index.html` langsung dari disk.

Untuk LAB + PANELIS berbagi data (Schedule → booth), serve **root repo**:

```bash
npx --yes http-server C:/Users/Bentang/Projects/experiment/LAB -p 8765 -c-1 -s
```

lalu buka <http://localhost:8765/LAB/index.html> dan <http://localhost:8765/PANELIS/?booth=1>.

## 3. Cek pertama

1. Halaman terbuka dengan sidebar, header, dan dropdown role. Console bersih (F12).
2. Ganti role di header (BSU → ADM) — tombol di form berubah.
3. HOLABSYS › Internal menampilkan request dummy dengan badge status.
4. Toggle dark mode — tidak ada warna hard-coded yang rusak.
5. PANELIS: aktifkan **Test Mode** di Schedule, lalu login booth dengan NIK dari
   `LAB/assets/dummy-hris.js`.

Kalau data terlihat aneh / lama: reset data dummy (`RUNBOOK.md` §3).
