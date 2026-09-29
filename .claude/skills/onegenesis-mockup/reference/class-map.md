# Legacy LAB class → ONE-Genesis theme class

For migrating pages that still use `assets/css/app.css` + `assets/css/bootstrap.css`.
Apply to the HTML **and** to strings/selectors in the page's JS. The counts show how many
files used each legacy class at the time of the migration (22 pages).

## Shell (delete, `og-shell.js` renders it)

| Legacy | Action |
|---|---|
| `<aside class="sidebar">` … `nav-group`, `nav-group-toggle`, `nav-group-items`, `sidebar-brand`, `sidebar-nav`, `sidebar-toggle` | Delete the whole `<aside>`. Menu lives in `og-shell.js` `MENU`. |
| `<header class="topbar">` … `topbar-icon-btn`, `topbar-user-btn`, `user-dropdown`, `user-dropdown-header`, `#roleSelect`, `#themeToggle`, `#fullscreenToggle` | Delete the whole `<header>`. Same ids are rendered by `og-shell.js`. |
| `<main class="app-main"><div class="app-content">` | `<div class="page"><div class="main-content app-content"><div class="container-fluid">` |
| `<script src="../assets/app.js">` | `<script src="../assets/og-shell.js">` |

## Page header

| Legacy | New |
|---|---|
| `nav > ol.breadcrumb` with `text-decoration-none` links | `ol.breadcrumb.mb-1` directly, plain `<a href="#!">` (see markup §2) |
| `h1.page-title` | `h1.page-title.fw-medium.fs-18.mb-0` |
| action buttons container `d-flex flex-wrap gap-2` | `div.btn-list.spk-page-header-actions-host > div.spk-page-header-actions-card` (keep the element id) |

## Buttons

| Legacy | New |
|---|---|
| `btn-submit` | `btn-success btn-wave` (document Submit/Approve is always success green) |
| `btn-save-draft` | `btn-warning btn-wave` (Save Draft — warning, matches the legacy `--og-warning` color) |
| `row-icon-btn primary` (edit) | `btn btn-icon btn-sm btn-info-light btn-wave` |
| `row-icon-btn` (view) | `btn btn-icon btn-sm btn-primary-light btn-wave` |
| `row-icon-btn danger` (delete) | `btn btn-icon btn-sm btn-danger-light btn-wave` |
| `<i class="ri-add-line"></i> Text` with `gap-1` | `<i class="ri-add-line me-1 align-middle"></i>Text` |

## Badges / colors

| Legacy | New |
|---|---|
| `badge-doc-draft` | `badge bg-secondary-transparent` |
| `bg-warning-subtle text-warning-emphasis` | `bg-warning-transparent` |
| `bg-info-subtle text-info-emphasis` | `bg-info-transparent` |
| `bg-success-subtle text-success-emphasis` | `bg-success-transparent` |
| `bg-danger-subtle text-danger-emphasis` | `bg-danger-transparent` |
| `bg-primary-subtle text-primary-emphasis` | `bg-primary-transparent` |
| `bg-secondary-subtle …` | `bg-secondary-transparent` |
| `text-secondary` (muted text) | `text-muted` |
| `link-strong text-decoration-none` | `text-primary fw-medium` |
| hard-coded colors (`#202947`, `#D4B64D`, `--gold`, `--og-*`) | theme utilities / `rgb(var(--primary-rgb))` |

## Tabs

| Legacy | New |
|---|---|
| `tabs-seg-row` + `tabs-seg` + `button.tab` (+ `.on`, `.tc` icon, `.n` count) | `card custom-card` > `ul.nav.nav-tabs.tab-style-2` > `a.nav-link` (+ `.active`), icon `me-1 align-middle`, count `badge bg-primary-transparent rounded-pill ms-1` (markup §5) |
| `.tabpane` / `.tabpane.on` | pane element with `data-pane="…"`, hidden with `d-none` |
| JS `classList.toggle('on', …)` on tabs/panes | `toggle('active', …)` on `.nav-link`, `toggle('d-none', …)` on panes |

## Tables / lists

| Legacy | New |
|---|---|
| `card custom-card` + `table table-hover mb-0 align-middle` | `SpkTablePagination` block: `card-header` with `card-title` + search, `card-body pt-0` > `table-responsive` > `table table-hover text-nowrap border mt-3 mb-0` (markup §3) |
| `th.w1` | `th style="width:1%"` |
| `i.sort-ic` (`ri-expand-up-down-line`) | remove (or `ri-expand-up-down-line text-muted fs-12 ms-1` if sorting is demonstrated) |
| `table-search` + `table-search-input` | `input.form-control.form-control-sm` in the card header |
| empty row `text-center text-secondary py-4` | `text-center text-muted p-4` |

## Forms / documents

| Legacy | New |
|---|---|
| `doc-info-bar` | `SpkForm` document status card (markup §8) |
| `approval-row` | `SpkApprovalTimeline` (markup §10) |
| `file-dropzone`, `file-list`, `file-list-item` | `SpkAttachmentArea` (markup §9 Attachment) |
| `form-label` / `form-control` / `form-select` | unchanged |
| `.avatar` (custom initials circle) | `avatar avatar-sm avatar-rounded bg-primary-transparent` |
| `.offcanvas-header`, `.offcanvas-empty-state` | Bootstrap offcanvas as-is; empty state `text-center text-muted p-4` |

## Keep in lab.css (no app equivalent — print layouts)

`printable-doc`, `cert-*` (certificate), `label-sheet`, `lbl-card` (label printing). Move their
rules from `assets/css/app.css` into `assets/lab.css` when migrating the page that uses them,
rewriting any hard-coded colors to theme variables.

## Found during the full migration (2026-09-29)

| Legacy | New |
|---|---|
| `doc-info-bar` / `-left` / `-right` / `-item` / `-label` / `-value` / `-sep`, `doc-approver-btn`, `doc-history-btn` | SpkForm status card classes (markup §8), one-to-one |
| `file-dropzone` + `file-list` (+ JS `file-list-item`, `dragover`) | SpkAttachmentArea box; dropzone = header row `#fileDropzone`; JS toggles `bg-primary-transparent` on drag |
| `approval-row` / `-label` / `-name` (JS) | `d-flex align-items-start gap-2 p-3 rounded mb-2 bg-primary-transparent` (approved) or `bg-light` (pending), avatar `avatar avatar-md avatar-rounded bg-primary-transparent text-primary` |
| KPI card `card h-100 > .text-muted.small + .fs-4.fw-semibold + .text-X.small` | SpkCountercard (markup §12), icon circle `bg-X-transparent`, hint as `text-muted fs-12` |
| `card` (plain) | `card custom-card` |
| `card-header > h2.h6` | `card-header > div.card-title` |
| `table-vcenter` | `align-middle` |
| `badge-soft-{c}` | `bg-{c}-transparent` |
| `matrix-cell-done/pending/reject` | `bg-success-transparent fw-semibold` / `bg-warning-transparent` / `bg-danger-transparent fw-bold` |
| `hedonic-btn` (+`.active`) | `btn btn-sm btn-outline-primary flex-fill` (+`active`) |
| `blind-code-badge` | `badge bg-dark-transparent font-monospace fs-13` |
| `badge-auth-tcm/crl/adm/bsu` | `bg-primary-transparent` / `bg-success-transparent` / `bg-secondary-transparent` / `bg-light text-muted` |
| per-page `<style>` blocks | theme classes; leftovers (`sig-preview-box`, `qr-card-preview`) live in `lab.css` |
| select2 `theme: 'bootstrap-5'` | drop the option (SpkSelect2 uses the default theme) |
