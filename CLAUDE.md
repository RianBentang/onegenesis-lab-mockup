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
  URLs, serve the folder with Node (no cache, so edits show up on reload):
  `npx --yes http-server C:/Users/Bentang/Projects/experiment/LAB/LAB -p 8765 -c-1 -s`
  and open `http://localhost:8765/<path>`. Stop the server when done.
- **Styling comes from the real app theme** in `LAB/assets/og-theme/onegenesis.css` (compiled
  from onegenesis-web). Don't edit that folder, don't add another Bootstrap copy, don't re-add the
  legacy `assets/css/bootstrap.css` / `assets/css/app.css` to a page.
- **Layout comes from `LAB/assets/og-shell.js`** (header, sidebar, footer, dark mode, mockup role
  switcher). Pages contain only their content. Add new pages to the `MENU` array in that file.
- Mockup-only page overrides go in `LAB/assets/lab.css`, and only when no theme class fits.
- Dummy data lives in `LAB/assets/dummy-*.js`; there is no backend.

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
│       ├── lab.css           ← small mockup-only overrides
│       ├── *-list.js, *-form.js, dummy-*.js   ← page scripts / dummy data
│       └── img/              ← Garudafood logo used by the printable certificate
└── docs/legacy-mockup/       ← original single-file design mockups; reference only, never link to them
```

All images live under `LAB/assets/` (`og-theme/brand/` for app logos, `img/` for mockup images).
Don't put images or scratch files in the repo root.
