---
name: onegenesis-spk
description: Use when building or reviewing UI for ONE-Genesis (onegenesis-web, React + react-bootstrap, Xintra theme) or any page, mockup, or sibling app that must look like it — list pages, document/approval forms, master data, dashboards, modals, status badges, dropdowns, LOV pickers — or when porting plain HTML to the Spk reusable components (SpkForm, SpkTablePagination, SpkTableActions, SpkSelect2, SpkLovInput, SpkLovToggleInput, SpkAttachmentSlots, etc.).
---

# ONE-Genesis Spk UI

## Overview

onegenesis-web builds every screen from the **Spk reusable components**
(`src/@spk-reusable-components/`, import alias `@/@spk-reusable-components/...`) plus two shared
config modules (`@/config/AppPageBase`, `@/config/AppFormBase`), on the Xintra theme
(Bootstrap 5.3 + `*-transparent` / `*-light` variants, Remix icons, Poppins).
Core principle: **reuse the Spk component; when writing markup (HTML mockup, new pattern), write
exactly the classes the Spk component renders** so it ports 1:1.

**This skill is self-contained.** Everything needed is in this folder, including the compiled
theme (`assets/og-theme/`). Don't go looking for onegenesis-web on disk. If the current workspace
*is* onegenesis-web (or a sibling with the same `src/@spk-reusable-components/`), its source wins
over this skill when they disagree.

## Reference files

| File | Read when |
|---|---|
| `reference/components.md` | Writing React with the Spk kit: imports, props, list-page and document-form recipes |
| `reference/markup.md` | Writing plain HTML (mockups, prototypes, non-React apps) that must look like the app |
| `assets/og-theme/` | Static HTML: the real compiled theme (`onegenesis.css` + fonts + brand logos). Copy the whole folder next to the page |
| `assets/spk-select2.js` | Static HTML: makes every single `<select>` a SpkSelect2-style select2 |
| `assets/components/` | Skill-defined Spk components not (yet) in the onegenesis-web kit (`SpkLovToggleInput`) — copy into sibling apps; never import them inside onegenesis-web |

## Rules (React and HTML)

- **Reuse first.** List page = `Pageheader` + `SpkTablePagination` + `SpkTableActions`.
  Document page = `SpkForm` + `SpkFormSection` cards, buttons from `useAppFormBase`.
  Don't hand-roll tables, headers, pagination, row buttons or status cards.
- **Single-value dropdown = `SpkSelect2`**, never a bare `<select>` (only exception: the
  page-size selector built into `SpkTablePagination`). Multi = `SpkMultiSelect` (TomSelect).
  Master-data pick (material, vendor, user) = `SpkLovInput`; "registered (from LOV) or free
  text" field with a "Registered X?" switch = `SpkLovToggleInput`. Date = `SpkDatePicker`.
  Money = `SpkMoneyInput`.
- **Document attachments = `SpkAttachmentSlots`** (slots configured on the server per objectId).
  Plain table = `SpkTablescomponent`; card grid paging = `SpkPaginationNav` + `SpkPageSizeSelect`.
- Components marked "(unused)" in `reference/components.md` exist in the kit but no screen renders
  them — prefer the used alternative named there.
- **Theme only.** Use the bundled theme CSS; never re-create it with CDN Bootstrap + custom CSS.
  Variants: badges `bg-{v}-transparent`, soft buttons `btn-{v}-light`, icon buttons
  `btn btn-icon btn-sm btn-{v}-light`, cards `card custom-card`. No `*-subtle` / `*-emphasis`,
  no `shadow-sm` cards, no hex colors (use `rgb(var(--{v}-rgb))`).
- **Icons:** Remix (`ri-*-line`). Bootstrap Icons (`bi bi-*`) are also in the theme but only the
  toast uses them.
- **Feedback:** success/error after an action → toast (`ToastService.showSuccess/showError/showWarning`).
  Confirm before destructive or document actions → SweetAlert2 (React) / Bootstrap modal (HTML).
  Never `window.confirm` / `alert`.
- **Loading:** `SpkLoadingSkeleton`, not a lone spinner.

## Document status

Backend status strings are **Title Case with spaces**: `New`, `Draft`, `Confirm To Approve`,
`Partially Approved`, `Fully Approved`, `Confirmed`, `Return to Edit`, `Return to Analysis`,
`Hold`, `Rejected`, `Canceled`, `Disposition`, `Revised` (constants: `DocStatus` in
`@/config/AppPageBase`). Compare with `.toLowerCase().trim()`; never invent `CONFIRM_TO_APPROVE`.

Two badge styles exist — use the right one:

| Status | **List / table pill** (`renderDocStatusBadge`) | **SpkForm status card** (built in) | Icon |
|---|---|---|---|
| New | secondary | secondary | `ri-sparkling-line` |
| Draft | secondary | secondary | `ri-draft-line` |
| Confirm To Approve | info | info | `ri-time-line` |
| Partially Approved | primary2 | primary2 | `ri-loader-2-line` |
| Fully Approved | **primary2** | **primary1** | `ri-checkbox-circle-line` |
| Confirmed | success | success | `ri-checkbox-circle-line` |
| Return to Edit | warning | warning | `ri-edit-line` |
| Return to Analysis | warning | warning | `ri-flask-line` |
| Hold | warning | warning | `ri-pause-circle-line` |
| Rejected | danger | danger | `ri-close-circle-line` |
| Canceled | danger | danger | `ri-forbid-line` |
| Disposition | primary | info | `ri-git-branch-line` |
| Revised | primary | primary2 | `ri-refresh-line` |

List pill class: `badge bg-{v}-transparent text-{v} rounded-pill fw-semibold px-2 py-1` + `<i class="{icon} me-1">`.

## Document buttons (`STANDARD_BUTTON_DEFS`)

| Button | Color | Icon | Confirmation |
|---|---|---|---|
| Back | `btn-light` | `ri-arrow-go-back-line` | none |
| Save Draft | `btn-warning` | `ri-save-2-line` | "Are you sure want to save this document as draft?" |
| Submit | `btn-success` | `ri-send-plane-fill` | "Are you sure want to submit this document or Check your Attachment?" |
| Approve | `btn-success` | `ri-thumb-up-line` | "Approve this document?" |
| Reject | `btn-danger` | `ri-close-circle-line` | reason prompt (required textarea) |
| Return to Edit | `btn-warning` | `ri-file-edit-line` | reason prompt (required textarea) |
| Cancel | `btn-danger` | `ri-close-circle-line` | "Are you sure want to cancel this document?" |
| Print | `btn-secondary` | `ri-printer-line` | none |

Which buttons show (Back always first):
- New / Draft + editable: Save Draft, Submit.
- Confirm To Approve / Partially Approved / Disposition, and only when the current user is a
  pending approver: Return to Edit, Reject, Approve.
- Return to Edit / Revised + editable: Submit, Cancel.
- Confirmed, Rejected, Canceled: Back only.

Row actions (`SpkTableActions`): view `primary-light ri-eye-line`, edit `info-light ri-edit-line`,
copy/duplicate `warning-light ri-file-copy-line`, delete `danger-light ri-delete-bin-line`,
download `success-light ri-download-line`. No built-in approve type; pass
`{ variant: 'success-light', icon: 'ri-thumb-up-line', title: 'Approve' }`.

## Common mistakes

| Mistake | Fix |
|---|---|
| Native `<select>` for a field or filter | `SpkSelect2` (React) / `<select class="form-select">` + `spk-select2.js` (HTML) |
| CDN Bootstrap + hand-written "Xintra-like" CSS | Bundled `assets/og-theme/onegenesis.css` |
| `CONFIRM_TO_APPROVE` style statuses | Title Case backend strings, compared lowercase |
| `badge bg-success` / `bg-success-subtle` | `badge bg-success-transparent` (+ pill class in lists) |
| Hand-built document buttons | `useAppFormBase().initDocumentButton` + `setCallbackDocButton` |
| `useFormBase` hook | Legacy, unused by pages; use `useAppFormBase` from `@/config/AppFormBase` |
| `Pageheader` props camelCase | Lowercase `currentpage`, `activepage` (but `SpkForm`: `currentPage`, `activePage`) |
| Guessing a Spk prop | Use `reference/components.md`; prop casing is inconsistent (`Buttonvariant`, `Customclass`, `onClickfunc`) |
| `SpkAttachmentArea` for document files | `SpkAttachmentSlots` (the one every screen uses) |
| "Registered?" as a checkbox, a Yes/No select, or the switch above the input | `SpkLovToggleInput` layout: label → LOV or text input → `form-switch` below |
| `import SpkLovToggleInput` inside onegenesis-web | Not in its kit: write the expanded `SpkLovInput` / `<input>` + `Form.Check type="switch"` form |
