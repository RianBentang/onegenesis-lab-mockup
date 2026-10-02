# LAB — ONE-Genesis HTML Mockups

Mockup statis (HTML + CSS + JS) untuk modul baru ONE-Genesis, saat ini modul **Lab Management
(HOLABSYS)**. Tampilannya sama persis dengan aplikasi asli (`onegenesis-web`, React + Spk
component kit), jadi setiap blok bisa langsung dipindahkan ke komponen Spk tanpa desain ulang.

Tidak ada backend dan tidak ada build step. Semua data adalah dummy.

## Menjalankan

Buka file HTML langsung di browser, misalnya `LAB/index.html`.

Atau jalankan server lokal (butuh Node.js), supaya perubahan langsung terlihat saat reload:

```bash
npx --yes http-server LAB -p 8765 -c-1 -s
```

Lalu buka <http://localhost:8765/>.

## Halaman

| Menu | File |
|---|---|
| Home | `LAB/index.html`, `LAB/profile.html` |
| HOLABSYS — Internal | `LAB/HOLABSYS/internalList.html`, `internalForm.html`, `reviewAndSpkForm.html` |
| HOLABSYS — External | `LAB/HOLABSYS/externalList.html`, `externalForm.html` |
| HOLABSYS — Report | `LAB/HOLABSYS/reportList.html`, `reportForm.html` |
| HOLABSYS — ASLT and Sensory | `LAB/HOLABSYS/asltAndSensory.html`, `asltForm.html`, `sensoryForm.html` |
| HOLABSYS — Schedule | `LAB/HOLABSYS/schedule.html` (FullCalendar: bulan / minggu / hari per jam) |
| HOLABSYS — Excel | `LAB/HOLABSYS/excel.html` (FortuneSheet + fullscreen) |
| Master Data | `LAB/Master-Data/*.html` |

Di header ada pemilih role (BSU, MGU, HOL, …) untuk mensimulasikan tampilan tiap role.
Pilihan role, tema, dan data dummy yang diubah disimpan di `localStorage` browser.

## Struktur

```
.
├── README.md
├── CLAUDE.md                          aturan kerja untuk Claude Code
├── .claude/skills/onegenesis-mockup/  skill: markup referensi, class map, template halaman
├── docs/legacy-mockup/                mockup desain awal (satu file), hanya referensi
└── LAB/                               situs mockup
    ├── index.html, profile.html
    ├── HOLABSYS/                      halaman transaksi modul
    ├── Master-Data/                   halaman master data
    └── assets/
        ├── og-theme/                  tema asli onegenesis-web + font + logo (jangan diedit)
        ├── og-shell.js                header, sidebar, footer, MENU, role dummy, dark mode
        ├── lab.css                    override khusus mockup
        ├── dummy-*.js                 data dummy
        ├── *.js                       script per halaman
        └── img/                       gambar mockup (logo sertifikat)
```

## Menambah / mengubah halaman

1. Salin `.claude/skills/onegenesis-mockup/templates/list.html` atau `form.html` ke `LAB/<folder>/`.
2. Tambahkan halaman ke array `MENU` di `LAB/assets/og-shell.js`.
3. Pakai markup dari `.claude/skills/onegenesis-mockup/reference/markup.md`, dan beri komentar nama
   komponen Spk di tiap blok (misalnya `<!-- SpkTablePagination -->`).
4. Script halaman di `LAB/assets/<page>.js`, data dummy di `LAB/assets/dummy-*.js`.
5. Cek di light mode dan dark mode, pastikan console bersih.

Aturan singkat: hanya HTML/CSS/JS biasa (tanpa framework, tanpa `type="module"`, tanpa `fetch`
file lokal); warna dan komponen dari tema (`onegenesis.css`), bukan warna hard-coded; ikon Remix
Icon (`ri-*`). Detail lengkap ada di `CLAUDE.md` dan skill `onegenesis-mockup`.

Kalau pakai Claude Code, skill `onegenesis-mockup` otomatis tersedia setelah clone repo ini.

## Memperbarui tema

Tema di `LAB/assets/og-theme/` disalin dari build `onegenesis-web`. Setelah `npm run build` di
repo itu, jalankan:

```powershell
powershell -ExecutionPolicy Bypass -File LAB/assets/og-theme/sync-theme.ps1
```
