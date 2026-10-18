# Canonical markup (what onegenesis-web renders)

Every snippet below is taken from the onegenesis-web source (`src/components/shared/*`,
`src/@spk-reusable-components/*`, real pages under `src/pages/`). Copy the classes exactly.
The comment above each snippet is the React component it maps to when ported.

## 1. Page skeleton

```html
<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page | Module</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" /> <!-- always: every dropdown is SpkSelect2 -->
    <link rel="icon" href="og-theme/brand/favicon.ico" />
    <link href="og-theme/onegenesis.css" rel="stylesheet" /> <!-- this skill's assets/og-theme, see below -->
  </head>
  <body>
    <div class="page">
      <div class="main-content app-content">
        <div class="container-fluid">
          <!-- page content -->
        </div>
      </div>
    </div>
    <!-- modals / offcanvas here, outside .page -->
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
    <script src="spk-select2.js"></script>   <!-- SpkSelect2: auto-inits every single <select> (copy from this skill's assets/) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="<page>.js"></script>
  </body>
</html>
```

- **Theme CSS:** copy this skill's whole `assets/og-theme/` folder next to the page (the
  compiled onegenesis-web theme: Bootstrap 5.3 + Xintra + Spk styles, Remix / Bootstrap Icons
  fonts, brand logos in `og-theme/brand/`; font URLs are relative, so it works from `file:///`
  and offline) and link `og-theme/onegenesis.css`. Never substitute CDN Bootstrap + hand-written
  CSS, don't add another Bootstrap or Remix copy, don't edit the theme; page-specific overrides
  go in a separate small stylesheet.
- **`<html>` attributes** the theme expects (the app shell sets them):
  `data-nav-layout="vertical" data-vertical-style="overlay" data-toggled="icon-overlay-close"
  data-menu-styles="dark" data-page-style="regular" data-width="fullwidth"
  data-menu-position="fixed" data-header-position="fixed"` and for light/dark
  `data-theme-mode`, `data-bs-theme`, `data-header-styles` = `light` | `dark`.
- Header / sidebar / footer markup is the app shell, not page content; if a static prototype needs
  it, build it once in a shared script and keep pages content-only.
- Classic `<script src>` only (no ES modules, no `fetch()` of local files) when pages must open
  from `file:///`.

## 2. Page header — `Pageheader` (components/shared/page-header)

```html
<div class="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
  <div>
    <ol class="breadcrumb mb-1">
      <li class="breadcrumb-item"><a href="#!">Module</a></li>            <!-- title -->
      <li class="breadcrumb-item"><a href="#!">Internal</a></li>          <!-- subtitle, optional -->
      <li class="breadcrumb-item active" aria-current="page">Request</li> <!-- currentpage -->
    </ol>
    <h1 class="page-title fw-medium fs-18 mb-0">Internal</h1>            <!-- activepage -->
  </div>
  <div class="btn-list spk-page-header-actions-host">
    <div class="spk-page-header-actions-card">
      <!-- header action buttons (see §6) -->
    </div>
  </div>
</div>
```

## 3. List page — `SpkTablePagination` (reusable-tables/tables-pagination)

```html
<div class="card custom-card">
  <div class="card-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
    <div class="card-title">Master User</div>
    <div class="d-flex flex-wrap gap-2 align-items-center">
      <button type="button" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center">
        <i class="ri-add-line me-1 align-middle"></i>Create User
      </button>
      <div class="position-relative" style="min-width: 260px">
        <input type="text" class="form-control form-control-sm w-100" placeholder="Search..." />
      </div>
    </div>
  </div>
  <div class="card-body pt-0">
    <div class="table-responsive">
      <table class="table table-hover text-nowrap border mt-3 mb-0">
        <thead>
          <tr>
            <th style="width: 1%">Action</th>
            <th>User ID</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><!-- SpkTableActions, §4 --></td>
            <td>10002088</td>
            <td>Marsya Valentina</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div class="card-footer border-top-0">
    <div class="d-flex align-items-center flex-wrap overflow-auto">
      <div class="ms-auto">
        <ul class="pagination mb-0 overflow-auto">
          <li class="page-item disabled"><a class="page-link" href="#!">Prev</a></li>
          <li class="page-item active"><a class="page-link" href="#!">1</a></li>
          <li class="page-item"><a class="page-link" href="#!">2</a></li>
          <li class="page-item"><a class="page-link" href="#!">Next</a></li>
        </ul>
      </div>
    </div>
  </div>
</div>
```

Extra filters (React: `toolCustoms`) go in the same header toolbar, before the search box; size a
dropdown with a wrapper because select2 is always 100% wide:

```html
<div class="d-flex flex-wrap gap-2 align-items-center">
  <div style="width: 180px;">
    <select class="form-select form-select-sm" id="filterStatus" required>
      <option value="">All Status</option><option>Confirm To Approve</option><option>Fully Approved</option>
    </select>
  </div>
  <div class="position-relative" style="min-width: 260px">
    <input type="text" class="form-control form-control-sm w-100" placeholder="Search..." />
  </div>
</div>
```

Empty state row: `<tr><td colspan="N" class="text-center text-muted p-4">No data found.</td></tr>`.
Loading row: `<td colspan="N" class="text-center p-4"><button class="btn btn-primary-light" disabled>Loading...</button></td>`.
Document number link in a cell: `<a href="form.html?docId=…" class="text-primary fw-medium">REQ-…</a>`.

### Card grid pagination — `SpkPaginationNav` + `SpkPageSizeSelect` (reusable-tables/spk-pagination-nav)

Lists shown as cards (Material/Product Monitoring) use the same page bar outside a table, plus the
"Show N Entries" selector in the card header (a native select here, like the table's own):

```html
<div class="d-flex align-items-center gap-2">
  <label>Show</label>
  <div class="select-year">
    <select class="form-select form-select-sm" style="width: 65px; cursor: pointer">
      <option>10</option><option>50</option><option>100</option><option>120</option>
    </select>
  </div>
  <span>Entries</span>
</div>

<!-- below the cards -->
<div class="d-flex align-items-center flex-wrap overflow-auto mt-4 pt-3 border-top">
  <div class="ms-auto">
    <ul class="pagination mb-0 overflow-auto">
      <li class="page-item disabled"><a role="button" class="page-link">Prev</a></li>
      <li class="page-item active"><a role="button" class="page-link">1</a></li>
      <li class="page-item"><a role="button" class="page-link">2</a></li>
      <li class="page-item"><a role="button" class="page-link">...</a></li>
      <li class="page-item"><a role="button" class="page-link">9</a></li>
      <li class="page-item"><a role="button" class="page-link">Next</a></li>
    </ul>
  </div>
</div>
```
Numbering: first and last page always shown, current ±2 around it, `...` for the gaps (clicking
it expands the hidden pages).

## 4. Row actions — `SpkTableActions` (reusable-tables/spk-table-actions)

Icon buttons, one per action, in a `d-flex gap-1` wrapper:

```html
<div class="d-flex gap-1">
  <a href="#!" class="btn btn-icon btn-sm btn-primary-light btn-wave" title="View"><i class="ri-eye-line"></i></a>
  <a href="#!" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Edit"><i class="ri-edit-line"></i></a>
  <a href="#!" class="btn btn-icon btn-sm btn-warning-light btn-wave" title="Copy"><i class="ri-file-copy-line"></i></a>
  <a href="#!" class="btn btn-icon btn-sm btn-danger-light btn-wave" title="Delete"><i class="ri-delete-bin-line"></i></a>
</div>
```

| type | variant | icon |
|---|---|---|
| view | `primary-light` | `ri-eye-line` |
| edit | `info-light` | `ri-edit-line` |
| copy / revise | `warning-light` | `ri-file-copy-line` |
| delete | `danger-light` | `ri-delete-bin-line` |
| download | `success-light` | `ri-download-line` |
| approve (custom, no built-in type) | `success-light` | `ri-thumb-up-line` |
## 5. Tabs — react-bootstrap `Nav` with `nav-tabs tab-style-2`

```html
<div class="card custom-card mb-3 overflow-hidden">
  <div class="card-body p-0">
    <div class="border-bottom">
      <ul class="nav nav-tabs tab-style-2 mb-0 d-flex flex-nowrap" role="tablist">
        <li class="nav-item" role="presentation">
          <a class="nav-link active" href="#!" role="tab" data-tab="a">
            <i class="ri-file-list-3-line me-1 align-middle"></i>Request List
            <span class="badge bg-primary-transparent rounded-pill ms-1">2</span>
          </a>
        </li>
        <li class="nav-item" role="presentation">
          <a class="nav-link" href="#!" role="tab" data-tab="b">Review</a>
        </li>
      </ul>
    </div>
  </div>
</div>
```

Switch panes by toggling `active` on `.nav-link` and `d-none` on the pane element.

## 6. Buttons — `SpkButton` (`btn-wave` + variant)

| Use | Classes |
|---|---|
| Primary action (Create, Save) | `btn btn-primary btn-sm btn-wave d-inline-flex align-items-center` |
| Secondary / neutral (Cancel, Back) | `btn btn-light btn-sm btn-wave` |
| Approve / confirm | `btn btn-success btn-sm btn-wave` |
| Reject / delete | `btn btn-danger btn-sm btn-wave` |
| Return to edit / warning | `btn btn-warning btn-sm btn-wave` |
| Soft (inside cards) | `btn btn-{variant}-light btn-sm btn-wave` |
| Icon only | `btn btn-icon btn-sm btn-{variant}-light btn-wave` |

Icon + text: `<i class="ri-save-line me-1"></i><span>Save</span>`.
Loading state: `<span class="me-2">Loading</span><span class="loading d-inline-flex align-items-center"><i class="ri-loader-2-fill fs-16"></i></span>` and `disabled`.

## 7. Status badge

Variants and icons per status: SKILL.md "Document status" table. Two shapes:

```html
<!-- In a list / table cell — renderDocStatusBadge (AppPageBase) -->
<span class="badge bg-info-transparent text-info rounded-pill fw-semibold px-2 py-1"><i class="ri-time-line me-1"></i>Confirm To Approve</span>
<span class="badge bg-primary2-transparent text-primary2 rounded-pill fw-semibold px-2 py-1"><i class="ri-checkbox-circle-line me-1"></i>Fully Approved</span>

<!-- In the SpkForm document status card — see §8 -->
<span class="badge bg-primary1-transparent d-inline-flex align-items-center gap-1 py-2 px-3 fs-11 lh-1 rounded-1"><i class="ri-checkbox-circle-line fs-13"></i>Fully Approved</span>
```

Plain label/counter badge: `badge bg-{v}-transparent` (+ `rounded-pill` for a counter).

## 8. Document / form page — `SpkForm` (reusable-forms/spk-form)

`SpkForm` = `Pageheader` with the action buttons in the header, then the document status card,
then the page's sections (`children`).

```html
<!-- SpkForm: Pageheader with buttons -->
<div class="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
  <div>
    <ol class="breadcrumb mb-1">
      <li class="breadcrumb-item"><a href="#!">Module</a></li>
      <li class="breadcrumb-item active" aria-current="page">Create Request</li>
    </ol>
    <h1 class="page-title fw-medium fs-18 mb-0">Internal Request</h1>
  </div>
  <div class="btn-list spk-page-header-actions-host">
    <div class="spk-page-header-actions-card">
      <div class="d-flex flex-wrap gap-2 justify-content-start justify-content-sm-end w-100 w-sm-auto">
        <button type="button" class="btn btn-light btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-arrow-left-line me-1"></i><span>Back</span></button>
        <button type="button" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-save-line me-1"></i><span>Save</span></button>
        <button type="button" class="btn btn-success btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-send-plane-line me-1"></i><span>Submit</span></button>
      </div>
    </div>
  </div>
</div>

<!-- SpkForm: document status card (isDocumentPage) -->
<div class="card custom-card d-flex flex-row align-items-center justify-content-between flex-wrap gap-2 p-2 mb-3">
  <div class="d-flex align-items-center flex-wrap gap-2">
    <span class="badge bg-secondary-transparent d-inline-flex align-items-center gap-1 py-2 px-3 fs-11 lh-1 rounded-1">
      <i class="ri-draft-line fs-13"></i>Draft
    </span>
    <span class="d-none d-sm-inline-block text-muted opacity-50 fs-10 user-select-none lh-1">|</span>
    <span class="d-flex flex-column gap-1 lh-1">
      <span class="text-uppercase text-muted fs-10">Document No.</span>
      <span class="fs-13 text-heading text-nowrap">REQ-202609-0018</span>
    </span>
    <span class="d-none d-sm-inline-block text-muted opacity-50 fs-10 user-select-none lh-1">|</span>
    <span class="d-flex flex-column gap-1 lh-1">
      <span class="text-uppercase text-muted fs-10">Document Date</span>
      <span class="fs-13 text-heading text-nowrap">18 Sep 2026</span>
    </span>
  </div>
  <div class="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap justify-content-end">
    <button type="button" class="btn btn-sm btn-light text-muted fw-semibold d-inline-flex align-items-center gap-1"><i class="ri-shield-check-line"></i>Approval</button>
    <button type="button" class="btn btn-sm btn-light text-muted fw-semibold d-inline-flex align-items-center gap-1"><i class="ri-history-line"></i><span class="d-none d-sm-inline">Document</span> History</button>
  </div>
</div>
```

### Section — `SpkFormSection` (reusable-forms/spk-formsection)

```html
<div class="card custom-card">
  <div class="card-body">
    <div class="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
      <div>
        <h6 class="fw-semibold mb-0">Sample Information <span class="text-muted fw-normal fs-12 ms-2">(Optional)</span></h6>
        <p class="text-muted fs-12 mb-0 mt-1">Short helper text for the section.</p>
      </div>
      <div class="d-flex align-items-center gap-2"><!-- section actions --></div>
    </div>
    <div class="row gy-3">
      <!-- fields, §9 -->
    </div>
  </div>
</div>
```

Simple section heading used inside a plain card (real pages): `<h6 class="fw-semibold mb-3"><i class="ri-information-line me-1 text-primary"></i> Config Information</h6>`.

## 9. Form fields

```html
<div class="col-md-6">
  <label class="form-label" for="sampleName">Sample Name <span class="text-danger">*</span></label>
  <input type="text" class="form-control" id="sampleName" />
</div>

<!-- SpkSelect2 — single dropdown. Plain <select>; spk-select2.js turns it into select2. -->
<div class="col-md-6">
  <label class="form-label" for="type">Type</label>
  <select class="form-select" id="type"><option value="">-- Pilih --</option><option>Normal</option><option>Urgent</option></select>
</div>

<!-- validation (after submit) -->
<input type="text" class="form-control is-invalid" />
<div class="invalid-feedback">Sample name is required.</div>

<!-- read-only value -->
<input type="text" class="form-control" value="QA" readonly disabled />

<div class="col-12">
  <label class="form-label">Remarks</label>
  <textarea class="form-control" rows="3"></textarea>
</div>

<div class="form-check form-switch">
  <input class="form-check-input" type="checkbox" role="switch" id="active" checked />
  <label class="form-check-label" for="active">Active</label>
</div>
```

Compact variant (filters, table cells): `form-control-sm` / `form-select-sm`.

### Dropdown — `SpkSelect2`

**Every single-value dropdown is SpkSelect2** — form fields, filters, modal fields, selects
inside table cells, selects built in JS strings. Never leave a native `<select>` dropdown.

- Markup is a plain `<select class="form-select">` (or `form-select-sm`). `spk-select2.js`
  (copy from this skill's `assets/`, load after jQuery + select2) initialises all of them, including selects added
  to the DOM later, with the SpkSelect2 options: width 100%,
  placeholder = first `<option value="">`, `allowClear` when not `required`, `dropdownParent` =
  the enclosing modal/offcanvas.
- The theme forces `.select2-container { width: 100% !important }`, so size a dropdown with a
  wrapper, never on the `<select>`: `<div style="width: 160px;"><select class="form-select form-select-sm">…</select></div>`
  (list filters).
- Page scripts need no init code. Only call `spkSelect2(el, { … })` for non-default options.
- Page scripts can keep using `el.value = …`, `addEventListener('change', …)`, replacing
  `<option>`s, `form.reset()` and `el.disabled` — the helper keeps select2 in sync.
- **Multi-selects (`<select multiple>`) are not SpkSelect2**: they stay on TomSelect
  (`plugins: ['remove_button']`).
- `data-native` opts a select out. Don't use it for app UI.

### Date — `SpkDatepicker`

```html
<label class="form-label">Target Date</label>
<div class="input-group">
  <span class="input-group-text text-muted"><i class="ri-calendar-line"></i></span>
  <input type="date" class="form-control" />
</div>
```

### LOV (list-of-values popup) — `SpkLovInput`

Use for any field picked from master data (material, vendor, user, SKU):

```html
<label class="form-label">Material</label>
<div class="input-group">
  <input type="text" class="form-control" placeholder="Material code" />
  <button type="button" class="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#lovMaterial"><i class="ri-search-line"></i></button>
</div>
<input type="text" class="form-control mt-1" placeholder="Material name" readonly disabled />
```

The popup is a modal (§11) containing an `SpkTablePagination`-style table with a search box.

### LOV or free text — `SpkLovToggleInput` (skill-defined, see components.md)

"Registered Producer? / Origin? / Vendor?" fields. Switch ON: the LOV input (text locked,
`btn-primary` search button). Switch OFF: a plain `form-control`. The switch is **below** the
input; the picked id (optional) shows between them.

```html
<div class="col-xl-3">
  <label class="form-label">Producer <span class="text-danger">*</span></label>
  <!-- switch ON -->
  <div class="input-group">
    <input type="text" class="form-control" value="PT Sumber Rasa" disabled />
    <button type="button" class="btn btn-primary" title="Search"><i class="ri-search-line"></i></button>
  </div>
  <div class="small text-info mt-1">PRD-000123</div>
  <!-- switch OFF: <input type="text" class="form-control" /> instead of the input-group -->
  <div class="form-check form-switch form-label">
    <input class="form-check-input" type="checkbox" id="registered-producer-switch" checked />
    <label class="form-check-label" for="registered-producer-switch">Registered Producer?</label>
  </div>
</div>
```
Toggling clears the value (and its id). In a read-only form disable the input, the button and
the switch.

### Attachment — `SpkAttachmentSlots` (one `SpkFileUpload` row per slot)

Each document attachment slot is one compact row; place rows in the grid
(`col-xl-6 col-lg-6 col-md-12` by default, `col-12` for a single certificate slot).
Colors below are copied from `spk-fileupload.jsx` (it uses inline hex for these buttons).

```html
<div class="row gy-3">
  <!-- empty slot -->
  <div class="col-xl-6 col-lg-6 col-md-12">
    <div class="rounded-1 p-1 d-flex flex-nowrap align-items-center justify-content-between position-relative border border-dashed border-2"
         style="border-style: dashed; cursor: pointer; background-color: var(--custom-white); color: var(--bs-heading-color)">
      <div class="pe-3 flex-grow-1" style="min-width: 0">
        <p class="fw-bold mb-0 fs-12 text-truncate" style="color: var(--bs-heading-color)">Certificate of Analysis<span class="text-danger ms-1">*</span></p>
        <p class="mb-0 small fs-10 text-truncate text-muted">PDF, JPG, PNG (Max. 10MB)</p>
      </div>
      <div class="d-flex align-items-center gap-2 flex-shrink-0">
        <button type="button" class="btn btn-primary px-3 py-1.5 fs-10 rounded-2 fw-semibold shadow-sm" style="background-color: #5356ff; border-color: #5356ff">Upload</button>
      </div>
    </div>
  </div>
  <!-- uploaded slot -->
  <div class="col-xl-6 col-lg-6 col-md-12">
    <div class="rounded-1 p-1 d-flex flex-nowrap align-items-center justify-content-between position-relative bg-success-light border border-success text-success-emphasis"
         style="border-style: solid">
      <div class="pe-2 flex-shrink-0"><i class="bi bi-file-earmark-pdf-fill text-danger fs-18"></i></div>
      <div class="pe-3 flex-grow-1" style="min-width: 0">
        <p class="fw-bold mb-0 fs-12 text-truncate" style="color: var(--bs-heading-color)">Halal Certificate<span class="text-danger ms-1">*</span></p>
        <p class="mb-0 small fs-10 text-truncate text-secondary fw-medium" title="halal-cert.pdf">halal-cert.pdf</p>
      </div>
      <div class="d-flex align-items-center gap-2 flex-shrink-0">
        <button type="button" class="btn btn-success px-3 py-1.5 fs-10 rounded-2 fw-semibold text-white shadow-sm" style="background-color: #00b074; border-color: #00b074">View File</button>
        <button type="button" class="btn btn-danger px-2 py-1.5 rounded-2 d-flex align-items-center justify-content-center shadow-sm border-0" style="background-color: #ffebee; color: #ff4d4f" title="Delete File"><i class="bi bi-trash fs-10"></i></button>
      </div>
    </div>
  </div>
</div>
```
- Description line: `{EXTS} (Max. {N}MB)`, plus ` (Multi-file)` for multi-file rows; after
  upload it shows the file name (or `3 files (a.pdf, b.pdf...)`).
- File icon by extension: pdf `bi-file-earmark-pdf-fill text-danger`, doc/docx
  `bi-file-earmark-word-fill text-primary`, xls/xlsx/csv `bi-file-earmark-excel-fill text-success`,
  image `bi-file-earmark-image-fill text-info` (or a 32×32 `rounded-1 border` thumbnail),
  other `bi-file-earmark-fill text-secondary`.
- Read-only: no Upload / Delete buttons, View File stays.
- Slot with "add row" allowed: below the rows,
  `<div class="col-12 text-end mt-1 mb-2"><button class="btn btn-outline-primary btn-sm py-1 px-3 fs-11 rounded-1"><i class="ri-add-line me-1"></i> Add Another Document (Supporting Docs)</button></div>`.

## 10. Approval history — `SpkApprovalTimeline`

```html
<ul class="tl list-unstyled mb-0">
  <li class="tl-item">
    <span class="tl-dot bg-success"></span>
    <div class="tl-content">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-1">
        <span class="badge bg-success-transparent">Approved</span>
        <span class="fs-11 text-muted">18 Sep 2026 09:12</span>
      </div>
      <div class="fs-12 fw-medium mt-1">Ratna Sari · Head of Laboratory</div>
      <div class="tl-note fs-12 text-muted mt-1">OK, lanjut.</div>
    </div>
  </li>
</ul>
```

## 11. Modal

```html
<div class="modal fade" id="exampleModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h6 class="modal-title fw-semibold">Title</h6>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">…</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-sm btn-light" data-bs-dismiss="modal">Cancel</button>
        <button type="button" class="btn btn-sm btn-primary">Confirm</button>
      </div>
    </div>
  </div>
</div>
```

## 12. Dashboard / summary cards — `SpkCountercard` (reusable-dashboards/spk-countercard)

```html
<div class="card custom-card h-100">
  <div class="card-body pb-2">
    <div class="d-flex align-items-start gap-3">
      <div class="d-flex align-items-center justify-content-center flex-shrink-0 bg-primary-transparent" style="width:48px;height:48px;border-radius:50%">
        <i class="ri-flask-line text-primary" style="font-size:1.3rem"></i>
      </div>
      <div>
        <p class="text-muted mb-1 fw-semibold fs-10 text-uppercase">Pending Requests</p>
        <div class="d-flex align-items-baseline gap-2">
          <h4 class="fw-bold mb-0" style="font-size:1.6rem;line-height:1">12</h4>
          <span class="text-muted fs-12">+3 this week</span>
        </div>
      </div>
    </div>
  </div>
  <hr class="my-0 mx-3" />
  <div class="card-footer bg-transparent border-0 pt-2 pb-3 px-3">
    <a href="#!" class="text-muted fs-11 text-decoration-none">View all <span class="ms-1">→</span></a>
  </div>
</div>
```

Put counter cards in `row` > `col-xl-3 col-md-6` columns.

## 13. Feedback

- Alert: `<div class="alert alert-warning" role="alert">…</div>` (also `alert-primary`, `-success`, `-danger`, `-info`).
- Toast — `AppToast` / `ToastService` (after-action feedback; not a SweetAlert success popup).
  Solid colored; success auto-hides after 15 s, info 5 s, error/warning stay until closed:

  ```html
  <div class="toast-container position-fixed top-0 start-50 translate-middle-x p-3" style="z-index:1060">
    <div class="toast bg-success text-fixed-white colored-toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="15000">
      <div class="toast-header bg-success text-fixed-white border-bottom-0">
        <strong class="me-auto"><span><i class="bi bi-check-circle me-2"></i>Success!</span></strong>
      </div>
      <div class="d-flex">
        <div class="toast-body w-100">REQ-2026-0001 has been approved.</div>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  </div>
  ```

  | Type | Color | Title | Icon |
  |---|---|---|---|
  | success | `bg-success` | Success! | `bi bi-check-circle` |
  | error | `bg-danger` | Error! | `bi bi-exclamation-triangle` |
  | warning | `bg-warning` | Warning! | `bi bi-exclamation-triangle` |
  | info | `bg-primary` | Info! | `bi bi-info-circle` |

  (The header keeps `border-bottom-0` except for info.)
- Confirmation before destructive / document actions: in React the app uses SweetAlert2
  (`icon: 'question'`, "Approve this document?"; Reject/Return to Edit ask for a required reason
  textarea). In static HTML use a Bootstrap modal (§11) with the same wording, never `window.confirm`.
- Muted helper text: `text-muted fs-12`. Headings inside cards: `h6.fw-semibold`.

## 14. Calendar — FullCalendar 6 (port: `@fullcalendar/react`)

The theme already styles `.fc-*`. Static HTML: `fullcalendar@6/index.global.min.js`
(+ `@fullcalendar/core@6/locales/id.global.min.js`).

- Event colors: `classNames: ['bg-{variant}-transparent']` and
  `borderColor: 'rgb(var(--{variant}-rgb))'` — never hex colors.
- Month → day drill-down: `navLinks: true` and `dateClick` → `calendar.changeView('timeGridDay', date)`.
- Day/week view: `expandRows: true`, `slotEventOverlap: false`, `allDaySlot: false`, 24h labels.
