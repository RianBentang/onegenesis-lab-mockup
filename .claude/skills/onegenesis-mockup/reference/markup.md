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
    <title>Page | HOLABSYS</title>
    <link rel="icon" href="../assets/og-theme/brand/favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" /> <!-- always: every dropdown is SpkSelect2 -->
    <link href="../assets/og-theme/onegenesis.css" rel="stylesheet" />
    <link href="../assets/lab.css" rel="stylesheet" />
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
    <script src="../assets/spk-select2.js"></script>   <!-- SpkSelect2: auto-inits every single <select> -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="../assets/og-shell.js"></script>
    <script src="../assets/<page>.js"></script>
  </body>
</html>
```

`og-shell.js` inserts the header, sidebar and footer into `.page` and sets the `<html>`
attributes (`data-nav-layout="vertical" data-vertical-style="overlay" data-toggled="icon-overlay-close"
data-menu-styles="dark" data-theme-mode / data-bs-theme ...`). Don't hand-write these.

## 2. Page header — `Pageheader` (components/shared/page-header)

```html
<div class="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
  <div>
    <ol class="breadcrumb mb-1">
      <li class="breadcrumb-item"><a href="#!">HOLABSYS</a></li>          <!-- title -->
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
          <li class="page-item disabled"><a class="page-link" href="#!">Previous</a></li>
          <li class="page-item active"><a class="page-link" href="#!">1</a></li>
          <li class="page-item"><a class="page-link" href="#!">2</a></li>
          <li class="page-item"><a class="page-link" href="#!">Next</a></li>
        </ul>
      </div>
    </div>
  </div>
</div>
```

Empty state row: `<tr><td colspan="N" class="text-center text-muted p-4">No data found.</td></tr>`.
Loading row: `<td colspan="N" class="text-center p-4"><button class="btn btn-primary-light" disabled>Loading...</button></td>`.
Document number link in a cell: `<a href="form.html?docId=…" class="text-primary fw-medium">REQ-…</a>`.

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

Switch panes by toggling `active` on `.nav-link` and `d-none` on the pane element
(see `assets/internal-form.js`: Form Internal / Kaji Ulang & SPK tabs — sample labels live under Kaji
Ulang & SPK once the SPK is issued — shown to the Lab
Administrator only — other roles get the form without a tab bar).

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

## 7. Status badge — `SpkForm` `getBadgeClass`

Always `badge bg-{color}-transparent`. Document statuses used across ONE-Genesis:

| Status | Class |
|---|---|
| Draft / New | `badge bg-secondary-transparent` |
| Confirm to Approve / Waiting | `badge bg-info-transparent` |
| Partially Approved | `badge bg-primary2-transparent` |
| Fully Approved | `badge bg-primary1-transparent` |
| Confirmed / Done / Active | `badge bg-success-transparent` |
| Return to Edit / Return to Analysis / Hold | `badge bg-warning-transparent` |
| Rejected / Canceled | `badge bg-danger-transparent` |
| Disposition | `badge bg-info-transparent` |
| Revised | `badge bg-primary2-transparent` |

Icons used next to the status in the document status card: Draft `ri-draft-line`,
Confirm to Approve `ri-time-line`. For other statuses pick a matching `ri-*-line` icon.

Doc status flow: New → (Draft) → Confirm to Approve → Fully Approved → Confirmed. With an approval
chain of 2+ levels: Confirm to Approve → Partially Approved → Fully Approved. An approver can send
it to Return to Edit or Rejected. Between Fully Approved and Confirmed the document runs its
**workflow** (Internal: Kaji Ulang & SPK, then Labeling); the pending step shows as a workflow
badge after a `|` separator: `badge bg-warning-transparent` + `ri-time-line`, text "Waiting for …".
When the last step is done (label handed to the analyst) the status becomes Confirmed.

```html
<span class="badge bg-primary1-transparent d-inline-flex align-items-center gap-1 py-2 px-3 fs-11 lh-1 rounded-1"><i class="ri-checkbox-circle-line"></i> Fully Approved</span>
<span class="d-none d-sm-inline-block text-muted opacity-50 fs-10 user-select-none lh-1">|</span>
<span class="badge bg-warning-transparent d-inline-flex align-items-center gap-1 py-2 px-3 fs-11 lh-1 rounded-1"><i class="ri-time-line"></i> Waiting for Kaji Ulang &amp; SPK</span>
```

Helpers: `getDocStatus` / `docStatusBadgesHtml` / `docStatusCardHtml` in `assets/dummy-requests.js`.

In lists: `<span class="badge bg-warning-transparent">Menunggu Head of Laboratory</span>`.
Pill counter: add `rounded-pill`.

## 8. Document / form page — `SpkForm` (reusable-forms/spk-form)

`SpkForm` = `Pageheader` with the action buttons in the header, then the document status card,
then the page's sections (`children`).

```html
<!-- SpkForm: Pageheader with buttons -->
<div class="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
  <div>
    <ol class="breadcrumb mb-1">
      <li class="breadcrumb-item"><a href="#!">HOLABSYS</a></li>
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

<!-- SpkSelect2 — single dropdown. Plain <select>; assets/spk-select2.js turns it into select2. -->
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

- Markup is a plain `<select class="form-select">` (or `form-select-sm`). `assets/spk-select2.js`
  (loaded on every page after jQuery + select2) initialises all of them, including selects added
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
  (`plugins: ['remove_button']`), as in `internal-form.js` "Pilih Parameter Uji".
- `data-native` opts a select out. Don't use it for app UI.

Dropdown with an attached "view detail" eye button — one joined field, like the app's password
input (e.g. Alamat Pelanggan / Alamat Pabrik → address modal from `assets/address-detail.js` +
`dummy-sites.js`; stays clickable when the form is locked). `lab.css` makes select2 fit the
`input-group`:

```html
<label class="form-label">Alamat Pelanggan <span class="text-danger">*</span></label>
<div class="input-group flex-nowrap">
  <select id="alamatPelanggan" class="form-select" required></select>
  <button type="button" class="btn btn-light" data-address-for="alamatPelanggan" title="Lihat detail alamat"><i class="ri-eye-line align-middle"></i></button>
</div>
```

Compact SpkSelect2 (table cells, e.g. Metode Acuan Uji): add `spk-select2-sm` →
`<select class="form-select form-select-sm spk-select2-sm">` (31px, same as `form-select-sm`).

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

### Attachment — `SpkAttachmentArea`

```html
<div class="border rounded-1 p-2">
  <div class="d-flex align-items-center justify-content-between mb-2">
    <span class="fw-bold fs-12">Certificate of Analysis <span class="text-danger">*</span></span>
    <button type="button" class="btn btn-primary btn-sm fs-10 py-1"><i class="bi bi-plus-lg me-1"></i>Add</button>
  </div>
  <div class="d-flex flex-column gap-2" style="max-height: 220px; overflow-y: auto">
    <div class="d-flex align-items-center justify-content-between bg-light rounded-1 px-2 py-1">
      <span class="fs-12 text-truncate" title="coa.pdf">coa.pdf</span>
      <div class="d-flex gap-1 flex-shrink-0">
        <button type="button" class="btn btn-success btn-sm fs-10 py-0 px-2">View</button>
        <button type="button" class="btn btn-danger btn-sm fs-10 py-0 px-2">Delete</button>
      </div>
    </div>
  </div>
</div>
```

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
- Toast (after-action success/info — the app uses toasts, not SweetAlert popups for success):
  a Bootstrap `.toast` in `<div class="toast-container position-fixed top-0 start-50 translate-middle-x p-3" style="z-index:1060">`,
  header text `<span><i class="ri-checkbox-circle-line me-2"></i>Saved</span>`.
- Confirmation before destructive actions: a modal (§11), not `window.confirm`.
- Muted helper text: `text-muted fs-12`. Headings inside cards: `h6.fw-semibold`.

## 14. Calendar — FullCalendar 6 (port: `@fullcalendar/react`)

Reference: `HOLABSYS/schedule.html` + `assets/schedule.js`. The theme already styles `.fc-*`.
Load `fullcalendar@6.1.20/index.global.min.js` + `@fullcalendar/core@6.1.20/locales/id.global.min.js`.

- Event colors: `classNames: ['bg-{variant}-transparent']` and
  `borderColor: 'rgb(var(--{variant}-rgb))'` — never hex colors.
- Month → day drill-down: `navLinks: true` and `dateClick` → `calendar.changeView('timeGridDay', date)`.
- Day/week view: `expandRows: true`, `slotEventOverlap: false`, `allDaySlot: false`, 24h labels.
- Wheel scrolling over the calendar scrolls its inner `.fc-scroller` (theme sets `overflow: scroll`).

## 15. Spreadsheet — FortuneSheet (port: `@fortune-sheet/react` `<Workbook />`)

Reference: `HOLABSYS/excel.html` + `assets/excel.js`. Load React 18 UMD, ReactDOM 18 UMD, then
`@fortune-sheet/react@1.0.4/dist/index.umd.min.js` (+ `index.umd.min.css`); the global is `window.react.Workbook`.

- The UMD build needs the `crypto.randomFillSync` shim at the top of `excel.js`.
- The host needs an explicit height (`.sheet-host` in `lab.css`); a `ResizeObserver` on the host
  dispatches `window` `resize`, the only event FortuneSheet re-measures on.
- Fullscreen: `card.requestFullscreen()` on the card, styled by `.sheet-card:fullscreen` in `lab.css`.
  Chrome refuses fullscreen for automated (browser-tool) clicks ("not granted"), so test it by hand.
- FortuneSheet has no dark theme; the grid stays light in dark mode.
