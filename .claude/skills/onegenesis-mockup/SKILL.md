---
name: onegenesis-mockup
description: Use when creating, editing, or migrating any HTML mockup page in the LAB project (ONE-Genesis module mockups such as HOLABSYS / Lab Management). Gives the exact ONE-Genesis (onegenesis-web, Xintra + Spk) page skeleton, component markup, status badges, and the legacy-class migration map, so mockups look identical to the real app and port 1:1 to Spk React components.
---

# ONE-Genesis mockup pages

The mockups must look exactly like the real ONE-Genesis app and use the same markup the React
Spk components render, so each block can be ported to its Spk component without redesign.

## Files

| File | Purpose |
|---|---|
| `LAB/assets/og-theme/onegenesis.css` | The real app theme (Bootstrap 5.3 + Xintra + Spk styles), compiled from onegenesis-web. Read-only. |
| `LAB/assets/og-shell.js` | Injects header, sidebar, footer; sets the `<html>` theme attributes; dark mode; mockup role switcher (`ROLES`, `findRole`, `applyRole`, event `holabsys:rolechange`, `localStorage.holabsysRole`). Edit its `MENU` array to add pages. |
| `LAB/assets/spk-select2.js` | `SpkSelect2` for the mockups: auto-initialises every single `<select>` as select2 and keeps it in sync with page code. Loaded on every page after jQuery + select2. |
| `LAB/assets/lab.css` | Mockup-only overrides. Last resort. |
| `PANELIS/` + `LAB/assets/dummy-panel.js` | Panelist app (login → booth, no LAB shell; `PANELIS/assets/panelis.js` sets the theme attributes) and the shared panel data: panel sessions (every Sensory / ASLT Schedule session; Sensory fixed slots, ASLT free time with max 5 panelists; no panelist registration), scores, statistics, report rows. Excel pulls the scores per panelist and Push Data puts the statistics in Report. |
| `reference/markup.md` (this skill) | Canonical HTML for each Spk component and pattern. |
| `reference/class-map.md` (this skill) | Legacy `app.css` class → theme class, for migrating old pages. |
| `templates/list.html`, `templates/form.html` (this skill) | Starting points for a new list page and a new document/form page. |
| `LAB/LAB/HOLABSYS/internalList.html` + `assets/internal-list.js` | Reference list page (one SpkTablePagination list + status filter + search). |
| `LAB/LAB/HOLABSYS/internalForm.html` + `assets/internal-form.js` | Reference document form (SpkForm status card, sections, select2, attachment area, approval offcanvas; Lab Administrator tab Kaji Ulang & SPK with the sample labels via `internal-review-tab.js` + `sample-label.js`). |
| `LAB/LAB/Master-Data/equipmentCalibration.html` | Reference master-data page (page header, SpkCountercard row, filter + table card, modal). |

All pages in `LAB/LAB` already use this setup. Page groups: `HOLABSYS/` (module transactions),
`Master-Data/` (breadcrumb "Master Data"), root `index.html` / `profile.html` (breadcrumb "Home").
Every page starts with the Pageheader (breadcrumb + title).

## Workflow: new page

1. Copy `templates/list.html` or `templates/form.html` into `LAB/LAB/<folder>/`. Fix the relative
   `../assets/` paths if the folder depth differs.
2. Add the page to `MENU` in `og-shell.js` (use `also: [...]` so form pages keep their list menu
   item active).
3. Build the content only from patterns in `reference/markup.md`. Mark each block with a comment
   naming its Spk component, e.g. `<!-- SpkTablePagination -->`, `<!-- SpkFormSection: Sample -->`.
4. Put behavior in a page script `assets/<page>.js` (classic script, `DOMContentLoaded`), dummy
   data in `assets/dummy-*.js`.
5. Preview (see "Preview") in light **and** dark mode, check the console for errors.

## Workflow: migrate a legacy page

All current pages are migrated and the pre-migration backup has been deleted (it is gone from the
repo too). Use this when an old mockup from another folder is brought in. A legacy page links
`assets/css/bootstrap.css` + `assets/css/app.css`, has its own
`<aside class="sidebar">` / `<header class="topbar">` / `<main class="app-main">`, and loads
`assets/app.js`.

1. `<head>`: replace the legacy CSS links (bootstrap.css, remixicon CDN, select2-bootstrap-5-theme,
   app.css) with the head block from `templates/list.html`. Keep select2 base CSS only if the page
   uses select2.
2. `<body>`: delete the legacy `<aside class="sidebar">…</aside>` and `<header class="topbar">…</header>`.
   Replace `<main class="app-main"><div class="app-content">…</div></main>` with
   `<div class="page"><div class="main-content app-content"><div class="container-fluid">…</div></div></div>`.
   Modals / offcanvas stay outside `.page`.
3. Scripts: replace `../assets/app.js` with `../assets/og-shell.js` (keep it **before** the page
   scripts). jQuery / select2 / bootstrap bundle CDN scripts stay.
4. Rewrite classes in the HTML **and** in the page's JS (`innerHTML` strings, `classList` calls)
   using `reference/class-map.md`. Grep the JS for every legacy class before calling it done.
5. Role-dependent UI must read the initial role with `findRole(localStorage.getItem('holabsysRole'))`
   on startup and re-render on `holabsys:rolechange`; the first event can fire before the page
   script attaches its listener.
6. Keep ids, `data-*` hooks, page logic and dummy data unchanged. When a JS selector depended on
   a legacy class (e.g. `.tabs-seg .tab.on`), switch it to the new markup (`.nav-link.active`,
   `d-none`) as `internal-form.js` does for its tabs.
7. Preview and compare against `HOLABSYS/internalList.html`.

## Rules

- **Dropdowns: every single-value dropdown is `SpkSelect2`, no exceptions** (form fields, list
  filters, modal fields, table-cell selects, selects built in JS). Write a plain
  `<select class="form-select">`; `assets/spk-select2.js` (on every page, after jQuery + select2)
  initialises it. A native-looking dropdown in a screenshot is a bug. Multi-selects
  (`<select multiple>`) are the exception: they stay on TomSelect. See `reference/markup.md` §9
  "Dropdown — SpkSelect2".
- select2 options follow `SpkSelect2` — `{ width: '100%', placeholder, allowClear }`, no `theme`
  option (the app styles the default select2 theme; `bootstrap-5` is unstyled here). Use
  `spkSelect2(el, { … })` only when a select needs non-default options.
- Theme classes first. The React app uses: `card custom-card`, `card-header` + `card-title`,
  `btn btn-{variant} btn-sm btn-wave`, light buttons `btn-{variant}-light`, icon buttons
  `btn btn-icon btn-sm btn-{variant}-light`, badges `badge bg-{variant}-transparent`,
  `form-label` + `form-control` / `form-select`, `is-invalid` + `invalid-feedback`, grid
  `row gy-3` + `col-md-*`, icons Remix (`ri-*`).
- Don't use Bootstrap `*-subtle` / `*-emphasis` color utilities, `shadow-sm` cards, or custom
  colors; the theme's `*-transparent` / `*-light` variants are what the app uses.
- Primary color comes from the theme (`--primary-rgb: 92, 103, 247`). Never hard-code colors.
  If you need one, use `rgb(var(--primary-rgb))` or a theme utility.
- Icons: Remix Icon only (`ri-*-line`), the font is bundled in the theme.
- No inline `<style>` blocks in pages. Page-specific rules go in `lab.css` with a comment saying
  why no theme class fits.
- If a pattern isn't in `reference/markup.md`, read the Spk component source in
  `C:\Users\Bentang\Projects\work\ONE-Genesis\onegenesis-web\src\@spk-reusable-components\` (it is
  in this session's additional directories) and copy the classes it renders. Then add the new
  pattern to `reference/markup.md`.
- Printable documents (certificate, label sheet) are print layouts, not app UI; they may keep
  dedicated rules in `lab.css`.

## Preview

Plain files, no Python. Open directly (`file:///C:/Users/Bentang/Projects/experiment/LAB/LAB/...`)
or, when the browser tool rejects `file://`, serve the repo root (LAB and PANELIS must share one
origin, so the panel scores written in the booth show up in LAB):

```
npx --yes http-server C:/Users/Bentang/Projects/experiment/LAB -p 8765 -c-1 -s
```

(run in the background, open `http://localhost:8765/LAB/HOLABSYS/<page>.html` or
`http://localhost:8765/PANELIS/`, stop it afterwards).
Check: sidebar hover expands, menu item active, dark mode toggle, no console errors, icons render
(no empty squares = fonts loaded).

## Updating the theme

When onegenesis-web styles change, refresh the vendored theme (reads onegenesis-web only, after
someone has run `npm run build` there — never run the build from here):

```
powershell -ExecutionPolicy Bypass -File C:/Users/Bentang/Projects/experiment/LAB/LAB/assets/og-theme/sync-theme.ps1
```
