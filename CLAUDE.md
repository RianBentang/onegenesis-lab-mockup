# LAB — ONE-Genesis HTML mockups

Static HTML/CSS/JS mockups of new ONE-Genesis modules (currently the Lab Management module,
"HOLABSYS"). They are later ported to the real app, `onegenesis-web` (React + Spk component kit),
at `C:\Users\Bentang\Projects\work\ONE-Genesis\onegenesis-web`.

**Before creating or editing any page under `LAB/`, use the `onegenesis-mockup` skill.** It holds
the page skeleton, the canonical markup for each Spk component, and the old-class → theme-class
map for migrating legacy pages.

## Hard rules

- **Plain HTML + CSS + JS only.** No Python, no build step, no frameworks, no npm packages in the
  pages. Classic `<script src>` files, no ES modules (`type="module"`) and no `fetch()` of local
  files, so every page also works when opened directly from disk (`file:///`).
- **Never use Python** for anything here: not `python -m http.server`, not `python -c` to edit
  files. Edit files with the Edit/Write tools.
- **Preview:** open the file directly in a browser, or when the browser tool refuses `file://`
  URLs, serve the repo root with Node (no cache, so edits show up on reload; the root, not
  `LAB/LAB`, so LAB and PANELIS share one origin and therefore one localStorage):
  `npx --yes http-server C:/Users/Bentang/Projects/experiment/LAB -p 8765 -c-1 -s`
  and open `http://localhost:8765/LAB/<path>` or `http://localhost:8765/PANELIS/`. Stop the
  server when done.
- **Styling comes from the real app theme** in `LAB/assets/og-theme/onegenesis.css` (compiled
  from onegenesis-web). Don't edit that folder, don't add another Bootstrap copy, don't re-add the
  legacy `assets/css/bootstrap.css` / `assets/css/app.css` to a page.
- **Layout comes from `LAB/assets/og-shell.js`** (header, sidebar, footer, dark mode, mockup role
  switcher). Pages contain only their content. Add new pages to the `MENU` array in that file.
- **Every single-value dropdown is `SpkSelect2`** (select2), never a native `<select>` dropdown —
  form fields, filters, modals, table cells, selects built in JS. Write a plain
  `<select class="form-select">` and load `LAB/assets/spk-select2.js` (after jQuery + select2);
  it initialises them. Multi-selects (`<select multiple>`) stay on TomSelect.
- Mockup-only page overrides go in `LAB/assets/lab.css`, and only when no theme class fits.
- Dummy data lives in `LAB/assets/dummy-*.js`; there is no backend.
- **External** requests: Draft → approval → Fully Approved with workflow "Waiting for Sample
  Delivery" → Lab Admin presses **Confirm Delivery** → Confirmed. That is the end: External never
  goes to Excel or Report (the vendor lab issues its own COA), and has no tabs besides Request List.
- **`PANELIS/`** is the separate panelist app (login → sensory booth). Panelists are not LAB users:
  its pages don't load `og-shell.js` (no sidebar/menu) but use the same theme, `lab.css`,
  `spk-select2.js` and dummy data from `../LAB/assets/`. Panel data (panelis, sessions, scores,
  statistics) lives in `LAB/assets/dummy-panel.js`, shared by both apps. Panel flow:
  **Schedule** (a Sensory / ASLT session with registered panelists: HRIS employees by NIK, or
  non-HRIS such as interns by NIK magang) → **booth** (login by NIK only, allowed while one of the
  person's sessions runs; the booth is fixed per tablet 1-5, the mockup uses `?booth=N`) →
  **ASLT & Sensory → Sesi Panelis** (list of sessions + who scored, no open/close) → **Excel**
  (Tarik Data: one sheet per panel test, one row per panelist × sample code, statistics block) →
  Push Data → **Report** Draft. HRIS is dummy (`LAB/assets/dummy-hris.js`).

## Layout

```
LAB/
├── CLAUDE.md                 ← this file
├── .claude/skills/onegenesis-mockup/   ← skill: markup reference, class map, templates
├── LAB/                      ← the mockup site (root = LAB/LAB)
│   ├── index.html, profile.html
│   ├── HOLABSYS/             ← module pages (list + form)
│   ├── Master-Data/          ← master data pages
│   └── assets/
│       ├── og-theme/         ← vendored onegenesis-web theme + fonts (do not edit)
│       ├── og-shell.js       ← app shell + MENU + dummy roles
│       ├── spk-select2.js    ← SpkSelect2: every single <select> becomes select2
│       ├── lab.css           ← small mockup-only overrides
│       ├── *-list.js, *-form.js, dummy-*.js   ← page scripts / dummy data
│       └── img/              ← Garudafood logo used by the printable certificate
├── PANELIS/                  ← panelist app: index.html (login) → booth.html (scoring)
│   └── assets/               ← panelis.js (theme + login helpers), login.js, booth.js
└── docs/legacy-mockup/       ← original single-file design mockups; reference only, never link to them
```

All images live under `LAB/assets/` (`og-theme/brand/` for app logos, `img/` for mockup images).
Don't put images or scratch files in the repo root.
