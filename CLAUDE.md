# LAB — ONE-Genesis HTML mockups

Static HTML/CSS/JS mockups of new ONE-Genesis modules (currently the Lab Management module,
"HOLABSYS"). They are later ported to the real app, `onegenesis-web` (React + Spk component kit),
at `C:\Users\Bentang\Projects\work\ONE-Genesis\onegenesis-web`.

**Before creating or editing any page under `LAB/`, use the `onegenesis-mockup` skill.** It holds
the page skeleton, the canonical markup for each Spk component, and the old-class → theme-class
map for migrating legacy pages.

## Read first

- **`docs/FLOW.md`** — **the only source of domain rules**: flow per request type, approval chains,
  `step` → status badge, role × action matrix, form behaviour, Schedule / PANELIS, Excel ↔ Report,
  invoices, stored values. **Read the section for a module before touching its page.**
- **`docs/ARCHITECTURE.md`** — how a page is built (shell, page script, `dummy-*` stores, every
  localStorage key, the one-source-per-data rules for Parameter Uji / FlexTab, porting map).
- **`docs/LESSONS.md`** — traps already hit (seed only written once, serve the repo root, …).
- `docs/FLOWCHART.md` (Mermaid diagrams of FLOW.md), `docs/SETUP.md` (fresh machine),
  `docs/RUNBOOK.md` (preview, reset data, theme sync, before commit), `docs/CHECKLIST.md` (who does
  what + open items), `docs/ROADMAP.md` (current position).

**Project knowledge goes into `docs/`, not into this file and not into memory**, so it is
versioned, readable by the team and written once: changed flow / domain rule → `FLOW.md` (+
`FLOWCHART.md`), new store / key / shared helper → `ARCHITECTURE.md`, new trap → `LESSONS.md`, open
work → `CHECKLIST.md`, module position → `ROADMAP.md`. Update the doc in the same change as the code.

Claude hooks (`.claude/settings.json`): every Write/Edit of a `.js` / `.html` under `LAB/` or
`PANELIS/` runs `.claude/hooks/check-mockup.mjs` (`node --check`, no ES modules, no `fetch()`).
Python and edits to `LAB/assets/og-theme/` are denied. Edits made through Bash (`sed`) bypass the
hook — run `node --check` yourself afterwards.

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
  server when done (if port 8765 is already taken, another session's server is serving the same
  root — use it, don't kill it).
- **Styling comes from the real app theme** in `LAB/assets/og-theme/onegenesis.css` (compiled
  from onegenesis-web). Don't edit that folder, don't add another Bootstrap copy, don't re-add the
  legacy `assets/css/bootstrap.css` / `assets/css/app.css` to a page.
- **Layout comes from `LAB/assets/og-shell.js`** (header, sidebar, footer, dark mode, mockup role
  switcher). Pages contain only their content. Add new pages to the `MENU` array in that file.
  Read the mockup role with `currentRole()`, never from localStorage directly.
- **Every single-value dropdown is `SpkSelect2`** (select2), never a native `<select>` dropdown —
  form fields, filters, modals, table cells, selects built in JS. Write a plain
  `<select class="form-select">` and load `LAB/assets/spk-select2.js` (after jQuery + select2);
  it initialises them. Multi-selects (`<select multiple>`) stay on TomSelect.
- Mockup-only page overrides go in `LAB/assets/lab.css`, and only when no theme class fits.
- **All UI text is English** (LAB and PANELIS): labels, buttons, toasts, placeholders, dropdown
  options and the values stored on documents (the fixed values are listed in `docs/FLOW.md` §11).
  Code identifiers (field names like `estSelesai`, ids, FlexTab IDs like `LAB_KATEGORI_PANGAN`)
  stay as they are. Dates use `en-GB`. The localStorage keys end in `.en` (bumped when the data was
  translated, so old Indonesian demo data is not read). Docs in `docs/` are written in Indonesian.
- **One source per data** (details in `docs/ARCHITECTURE.md` §3): dummy data lives in
  `LAB/assets/dummy-*.js` (no backend); statuses come from `getDocStatus()`, approval chains from
  `requestApprovalChain()` / `externalApprovalChain()`, document numbers from `nextFreeNo()`,
  Parameter Uji from the Test Parameters master, small dropdown lists from FlexTab. Never add a
  second list or a local copy of these.

## Layout

```
LAB/
├── CLAUDE.md                 ← this file (working rules only)
├── README.md
├── .claude/
│   ├── settings.json         ← deny Python / og-theme edits, PostToolUse hook
│   ├── hooks/check-mockup.mjs
│   └── skills/onegenesis-mockup/   ← skill: markup reference, class map, templates
├── docs/                     ← FLOW (domain), ARCHITECTURE, FLOWCHART, SETUP, RUNBOOK, LESSONS, CHECKLIST, ROADMAP
│   ├── excel/                ← reference spreadsheets from the lab (input for the Excel page)
│   └── legacy-mockup/        ← original single-file design mockups; reference only, never link to them
├── LAB/                      ← the mockup site (root = LAB/LAB)
│   ├── index.html, profile.html
│   ├── HOLABSYS/             ← module pages (list + form)
│   ├── Master-Data/          ← master data pages
│   └── assets/
│       ├── og-theme/         ← vendored onegenesis-web theme + fonts (do not edit)
│       ├── og-shell.js       ← app shell + MENU + dummy roles + currentRole()
│       ├── spk-select2.js    ← SpkSelect2: every single <select> becomes select2
│       ├── spk-toast.js      ← ToastService (success / warning toasts) + validateForm
│       ├── spk-lov.js        ← SpkLov.open (port of LovModal.jsx)
│       ├── lab.css           ← small mockup-only overrides
│       ├── *-list.js, *-form.js, dummy-*.js   ← page scripts / dummy data
│       └── img/              ← Garudafood logo (printable certificate), dashboard banner (from onegenesis-web public/assets)
├── versions/v1-before/       ← frozen proposal copy: flow before the KAN review (versions/README.md); only shared UI (spk-history.js) changes, in both copies
└── PANELIS/                  ← panelist app: index.html (login) → booth.html (scoring)
    └── assets/               ← panelis.js (theme + login helpers), login.js, booth.js
```

All images live under `LAB/assets/` (`og-theme/brand/` for app logos, `img/` for mockup images).
Don't put images or scratch files in the repo root.
