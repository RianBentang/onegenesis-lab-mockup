# Spk components — React API (onegenesis-web)

Import base: `@/@spk-reusable-components/<group>/<file>` (no extension needed).
Other app paths: services `@/api/services/<Module>/<name>Service` (default export object), `Swal` from `sweetalert2`, routing `react-router-dom` v7.
Prop names below are copied from source; casing is inconsistent between components — copy exactly.
"(unused)" = exists in the kit but no onegenesis-web screen renders it; prefer the used alternative.
"(skill-only)" = defined by this skill, not in the onegenesis-web kit (see the component's section).

## Index

| Component | Import | Purpose |
|---|---|---|
| `Pageheader` | `@/components/shared/page-header/pageheader` | Breadcrumb + title (list pages) |
| `SpkTablePagination` | `reusable-tables/tables-pagination` | Card + toolbar (create, search, sort, page size) + table + pagination |
| `SpkTableActions` | `reusable-tables/spk-table-actions` | Row icon buttons |
| `SpkTablescomponent` | `reusable-tables/tables-component` | Plain table (no pagination): detail grids, history, modals |
| `SpkTablesComponentInteractive` | `reusable-tables/tables-component-interactive` | Plain table + drag/reorder, add/remove and sticky columns (matrix views) |
| `SpkPaginationNav`, `SpkPageSizeSelect` | `reusable-tables/spk-pagination-nav` | Stand-alone page bar + "Show N Entries" for card grids |
| `SpkForm` | `reusable-forms/spk-form` | Document page: header + action buttons + status card + approval/history offcanvas |
| `SpkFormSection` | `reusable-forms/spk-formsection` | Section card inside a form |
| `SpkButton` | `reusable-uielements/spk-button` | Button (adds `btn-wave`) |
| `SpkBadge` | `reusable-uielements/spk-badge` | Badge |
| `SpkUrgencyBadge` | `reusable-uielements/spk-urgency-badge` | "Baru / Nh menunggu / Overdue Nd" from a timestamp (unused) |
| `SpkSelect2` | `reusable-uielements/spk-select2` | Single dropdown |
| `SpkMultiSelect` | `reusable-uielements/spk-multiselect` | Multi dropdown (TomSelect chips) |
| `SpkLovInput` | `reusable-uielements/spk-lovinput` | Input + search button → LOV modal |
| `SpkLovToggleInput` | `reusable-uielements/spk-lovtoggleinput` (skill-only) | "Registered X?" switch: LOV when on, free text when off |
| `SpkDatePicker` | `reusable-uielements/spk-datepicker` | Flatpickr date |
| `SpkMoneyInput` | `reusable-uielements/spk-moneyinput` | Currency input (unused) |
| `SpkMaskedInput` | `reusable-uielements/spk-maskedinput` | Masked input (Cleave) (unused) |
| `SpkTextAndSelect` | `reusable-uielements/spk-textandselect` | Text input + attached small select (e.g. value + unit) |
| `SpkAttachmentSlots` | `reusable-attachment/SpkAttachmentSlots.jsx` | **Document attachments**: slots configured per objectId on the server |
| `SpkAttachmentArea` | `reusable-uielements/spk-attachment-area` | Local slot list (unused — use `SpkAttachmentSlots`) |
| `SpkFileUpload` | `reusable-uielements/spk-fileupload` | One upload row (what each attachment slot renders) |
| `SpkApprovalTimeline` | `reusable-uielements/spk-approval-timeline` | Approval history list |
| `SpkLoadingSkeleton` | `reusable-uielements/spk-loadingskeleton` | Shimmer placeholder |
| `SpkCounterCard` | `reusable-dashboards/spk-countercard` | KPI card (unused) |
| `Spkapexcharts` | `reusable-plugins/spk-apexcharts` | ApexCharts wrapper (dashboard widgets) |
| `SpkDonutChart`, `SpkTrendChart` | `reusable-dashboards/*` | Charts (unused — dashboards use `Spkapexcharts`) |
| `SpkAlert`, `SpkDropdown`, `SpkTooltips` | `reusable-uielements/*` | Thin react-bootstrap wrappers (see Small wrappers) |
| `SpkToast` | `reusable-uielements/spk-toast` | Rendered by `AppToast`; pages call `ToastService` |
| `SpkPopovers`, `SpkProgress` | `reusable-uielements/*` | Thin wrappers (unused by screens) |

## List page recipe

```jsx
import Pageheader from '@/components/shared/page-header/pageheader'
import SpkTablePagination from '@/@spk-reusable-components/reusable-tables/tables-pagination'
import SpkTableActions from '@/@spk-reusable-components/reusable-tables/spk-table-actions'

const HEADERS = ['Action', 'User ID', 'Name']   // or objects: { title, sortField, sortable }

<Pageheader title="Master Data" subtitle="" currentpage="Master User" activepage="Master Data" />
<SpkTablePagination
  title="Master User"
  buttonTitle="Create User" buttonColor="primary" buttonOnClick={() => navigate('/MasterUserForm')}
  headers={HEADERS}
  itemsCount={totalCount} totalPages={totalPages} pages={[10, 50, 100, 120]}
  isLoading={isLoading}
  onInitialize={load} onChangedSearchText={load} onChangedSort={load}
  onChangedPageSize={load} onPreviousPage={load} onNextPage={load} onGotoPage={load}
>
  <tbody>
    {rows.map((r) => (
      <tr key={r.id}>
        <td><SpkTableActions actions={[
          { type: 'edit', onClick: () => edit(r) },
          { type: 'delete', onClick: () => remove(r) },
        ]} /></td>
        <td>{r.id}</td><td>{r.name}</td>
        <td>{renderDocStatusBadge(r.szDocStatus)}</td>   {/* from '@/config/AppPageBase' */}
      </tr>
    ))}
  </tbody>
</SpkTablePagination>
```

- Every callback receives the pagination object (`{ pageNumber, pageSize, searchText, sorts }`,
  `sorts` like `['szDocId DESC']`); pass the same loader to all of them. Services conventionally
  return `{ items, totalCount }`; `totalPages = Math.ceil(totalCount / pag.pageSize)`.
- Status column: `renderDocStatusBadge(status)` (or `getDocStatusBadgeConfig(status)` →
  `{ label, variant, badgeClass, icon }`) from `@/config/AppPageBase`. Lookup is lowercase
  Title-Case text (`'confirm to approve'`), so pass the backend string as-is.
- Long text cells: `truncateText(text, 50)` from `@/config/AppPageBase`.
- Delete confirm:
  ```js
  Swal.fire({ title: 'Delete Master User?', html: `Delete <b>${row.id}</b>?`, icon: 'warning',
    showCancelButton: true, confirmButtonText: 'Yes, Delete it!', cancelButtonText: 'Cancel',
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
  }).then(async (r) => { if (!r.isConfirmed) return; await svc.remove(row.id);
    ToastService.showSuccess('Deleted!'); load(lastPag) })
  ```
- A column is sortable only when its header object declares `sortField` (or `field`/`sortKey`).
- Other props: `isHiddenSearch`, `isHiddenSort`, `isHidden` (hide create button), `showCheckbox`,
  `searchPlaceholder`, `toolCustoms` / `toolFooterCustoms` (extra toolbar nodes),
  `listButtonCustom`, `isButtonEventShow` + `buttonEventTitle/Icon/Click`.

### SpkTableActions

`actions=[{ type, onClick, title?, variant?, icon?, disabled?, hidden?, content? }]`, or
shorthand `onView / onEdit / onDuplicate / onDelete`. Types: `view, edit, duplicate, copy,
delete, preview, download, expand, collapse`. Single button: named export `SpkTableActionButton`.

### SpkTablescomponent (plain table)

```jsx
<SpkTablescomponent
  tableClass="table table-sm table-borderless fs-11 mb-0" headerClass="border-bottom"
  header={[{ title: 'Date & Time' }, { title: 'Action' }, { title: 'By', headerClassname: 'text-center' }]}
>
  <tr><td>20 May 2025 09:15</td><td>Submit</td><td className="text-center">Andi</td></tr>
</SpkTablescomponent>
```
Renders a bare react-bootstrap `<Table>` (no `table-responsive` wrapper; add your own div if needed); children go inside `<tbody>` (pass a `<tbody>` yourself or `Bodytag={false}` to skip it).
Header item: `{ title, headerClassname, style, sortable, onSort, sortDirection: 'asc'|'desc', onClick }`.
Other props: `tBodyClass`, `footchildren` + `footerClass`, `headerContent`, `showCheckbox` +
`checked` + `onChange` + `Customcheckclass`, `isHeaderSticky`.

### SpkTablesComponentInteractive (matrix table)

Same props as `SpkTablescomponent` plus `isAbleToDragAndDrop`, `isAbleToAddAndRemove`,
`isAbleToSticky` (all default `true`), `onColumnsChange(columns)`. Header items need a unique
`id`. Children are a **render function** receiving the columns currently shown:

```jsx
<SpkTablesComponentInteractive tableClass="table text-nowrap border mt-3" isHeaderSticky
  header={[{ id: 'no', title: 'No', headerClassname: 'text-center' }, { id: 'code', title: 'Material Code' }]}
  onColumnsChange={setColumns}>
  {({ displayColumns }) => rows.map((r) => (
    <tr key={r.code}>
      {displayColumns.map((col) => col.isGhost
        ? <td key="__ghost_col__" className="ghost-column-cell text-muted text-center">-</td>
        : <td key={col.id}>{r[col.id]}</td>)}
    </tr>
  ))}
</SpkTablesComponentInteractive>
```
Empty/loading row: one `<td colSpan={displayColumns.length} className="text-center p-4">`.

### SpkPaginationNav / SpkPageSizeSelect (card grids)

For lists that are not a `SpkTablePagination` (card grids that own their page state). Same
markup and numbering as the table pagination.

```jsx
import SpkPaginationNav, { SpkPageSizeSelect } from '@/@spk-reusable-components/reusable-tables/spk-pagination-nav'

<SpkPageSizeSelect value={limit} onChange={setLimit} />          {/* pages={[10, 50, 100, 120]} */}
<SpkPaginationNav page={page} totalPages={totalPages} onPageChange={setPage} />   {/* 1-based */}
```

## Document form recipe

```jsx
import SpkForm from '@/@spk-reusable-components/reusable-forms/spk-form'
import SpkFormSection from '@/@spk-reusable-components/reusable-forms/spk-formsection'
import { useAppFormBase } from '@/config/AppFormBase'
import { DocStatus, DocButtonType, ColorButton } from '@/config/AppPageBase'
import useUserSession from '@/hooks/Shared/useUserSession'

const { buttons, resetAllButtons, initDocumentButton, setCallbackDocButton, addButtonCustom } = useAppFormBase()
const { isPendingApproverForMe, isCreator } = useUserSession(approvalListData, historyData)

useEffect(() => {
  resetAllButtons()
  initDocumentButton(
    { szDocStatus: doc?.szDocStatus || DocStatus.NEW },          // object, not a bare string
    { isDraftEditable, isPendingApproverForMe, isSubmitting, isProcessingApproval,
      canManage, confirmValidate: validateSubmit },             // validateSubmit: () => boolean, shows its own toast
  )
  setCallbackDocButton(DocButtonType.BACK, () => navigate(-1))
  setCallbackDocButton(DocButtonType.DRAFT, handleSaveDraft)
  setCallbackDocButton(DocButtonType.CONFIRM, handleSubmit)
  setCallbackDocButton(DocButtonType.APPROVE, handleApprove)
  setCallbackDocButton(DocButtonType.REJECT, (reason) => handleReject(reason))
  setCallbackDocButton(DocButtonType.RETURN_TO_EDIT, (reason) => handleReturn(reason))
  // optional extra: addButtonCustom(onClick, 'Download', '', ColorButton.SUCCESS, 'ri-file-download-line', disabled)
}, [doc?.szDocStatus, isDraftEditable, isPendingApproverForMe, isSubmitting, isProcessingApproval, canManage])

<SpkForm
  title="ONE-Reg" subtitle="Halal Registration"
  currentPage="Halal Registration Form" activePage="Halal Registration Form"
  isDocumentPage
  docStatusData={{ szDocStatus: 'Draft', szDocId: 'REQ-2026-0001', dtmDocDate: '2026-10-05' }}
  historyData={history}            // [{ szAction | szActionParts, szUserName, szUserID, dtmDate }]
  approvalListData={approvals}     // [{ szStatus, szUserName, szUserId, szGroupId, iOrder, dtmDate, szReason }]
  buttons={buttons}
  onButtonClick={(btn) => btn.onClick()}
>
  <SpkFormSection title="Sample Information" subtitle="Helper text" optional actions={<SpkButton …/>}>
    <div className="row gy-3">{/* fields */}</div>
  </SpkFormSection>
</SpkForm>
```

- `useAppFormBase` builds the status-driven buttons (see SKILL.md "Document buttons"), runs the
  SweetAlert confirm / required reason prompt itself, then calls the registered callback.
  REJECT / RETURN_TO_EDIT callbacks get `reason`. Busy state: pass `isSubmitting` /
  `isProcessingApproval` in the context (button shows `busyText`, gets disabled).
- Approve/Reject only appear when `isPendingApproverForMe` is true; Save Draft/Submit only with
  `isDraftEditable` (usually "current user is the creator").
- Non-document forms (master data): `resetAllButtons()` then `addButtonBack(onBack)` +
  `addButtonCustom(handleSave, 'Save', 'Are you sure want to save?', ColorButton.PRIMARY, 'ri-save-line')`.
- Without `isDocumentPage`, `SpkForm` is just a page header + children (use while loading or
  unauthorized, with `SpkLoadingSkeleton variant="card"`).
- Optional SpkForm props: `referenceNo`, `createdByName`, `lastApproverName`, `onDocIdClick`,
  `buttonsInHeader={false}` (sticky footer buttons).
- Legacy: `useFormBase` (`@/hooks/Shared/useFormBase`) and `@/api/constants/docStatus` use
  UPPERCASE statuses and are not used by any page. Don't use them.

## Fields

```jsx
<div className="col-md-6">
  <label className="form-label">Type <span className="text-danger">*</span></label>
  <SpkSelect2 options={[{ value: 'N', text: 'Normal' }]} value={v} onChange={(val) => setV(val)}
              placeholder="-- Select --" allowClear={false} searchable disabled={ro} />
</div>
```

| Component | Value / onChange | Notable props |
|---|---|---|
| `SpkSelect2` | `value: string\|null`, `onChange(value)` | `options [{value,text}]`, `placeholder`, `allowClear` (default false), `searchable`, `disabled`, `cssClass` |
| `SpkMultiSelect` | `selectedValues: string[]`, `onChange(values)` | `options [{value,text}]`, `placeholder`. **No `disabled` prop**: in read-only mode render the values as `badge bg-primary-transparent` chips instead |
| `SpkDatePicker` | `value`, `onChange(Date\|null)` | `options` (flatpickr), `showCalendarIcon`, `disabled` |
| `SpkMoneyInput` | `value: number`, `onChange(number)` (parsed) | `positiveOnly`, `placeholder="Rp. 0,00"` |
| `SpkMaskedInput` | `value`, `onChange` | `mask` |
| `SpkTextAndSelect` | `value`/`onChange` + `selectValue`/`onSelectChange` | `options`, `selectWidth`, `textType` |
| `SpkLovInput` | `value`, `onChange(event)` | see below |

**SpkLovInput** — self-contained mode: `objectId` + `lovId` (+ `lovWhere`, `title`), result in
`onSelect(row, meta)` (`row[meta.idColumn]` = picked id, `row[meta.descColumn]` = its description). Delegate mode: `onLovClick`.
Description box: `descValue`, `showDescInline`, `hideId`. Partial disabling: `inputDisabled`,
`lovButtonDisabled`. Extra button: `showLoadButton` + `onLoadClick`.

```jsx
<SpkLovInput value={form.parentId} onChange={(e) => set('parentId', e.target.value)}
  objectId="AVO.GEN.FlexTab" lovId="DefaultLov" title="Select Parent"
  onSelect={(row, meta) => set('parentId', row[meta.idColumn])} lovButtonVariant="primary" />
```

**SpkLovToggleInput** (skill-only) — the "Registered Producer? / Origin? / Vendor?" field from
Inquiry of Material, New Material Registration and Material Monitoring. Switch ON = value must
come from the LOV (input locked, `primary` search button); OFF = free text. The switch sits
**below** the input. Source: `assets/components/SpkLovToggleInput.jsx`.
- Sibling app / new React project: copy that file to
  `src/@spk-reusable-components/reusable-uielements/spk-lovtoggleinput.jsx`.
- **Inside onegenesis-web the file does not exist** — write the expanded form instead
  (`SpkLovInput inputDisabled` / `<input className="form-control">` + `Form.Check type="switch"`
  with `className="form-label"`), as in `InquiryMaterialDetailsSection.jsx`.

```jsx
<SpkLovToggleInput className="col-xl-3" label="Origin" required
  switchId="registered-origin-switch" switchLabel="Registered Origin?"
  isRegistered={isRegisteredOrigin}
  onRegisteredChange={(on) => { setIsRegisteredOrigin(on); setOrigin(''); setOriginId('') }}
  value={origin} onChange={(v) => setOrigin(v.toUpperCase())}
  objectId={LOV_OBJECT_ID_MATERIAL} lovId={LOV_ID_ORIGIN} title="Select Origin"
  onSelect={(row, meta) => { setOrigin(row[meta.descColumn]); setOriginId(row[meta.idColumn]) }}
  idValue={originId} disabled={isFieldDisabled} />
```
Props: `label`, `required`, `className` (wrapper col; none = no wrapper), `isRegistered`,
`onRegisteredChange(checked)`, `switchId` (unique), `switchLabel`, `value`, `onChange(string)`
(free-text mode), `placeholder`, `maxLength`, `objectId`, `lovId`, `lovWhere`, `title`,
`onSelect(row, meta)`, `idValue` (shown below as `small text-info mt-1`), `disabled`.
Toggling always clears the value **and** its id — the caller does it in `onRegisteredChange`.

Validation: `className="form-control is-invalid"` + `<div className="invalid-feedback">…</div>`.
Read-only: `readOnly disabled`. Grid: `row gy-3` + `col-md-*`.

## Attachments

Use **`SpkAttachmentSlots`** (`@/@spk-reusable-components/reusable-attachment/SpkAttachmentSlots.jsx`).
Slots, labels, mandatory flags, allowed extensions and max size come from the server
(`attachmentService.getSlots(objectId, docId || 'draft')`); the component renders one
`SpkFileUpload` row per slot row and handles upload, delete, view and multi-file modals itself.

```jsx
<SpkAttachmentSlots
  objectId="AVO.REG.HalalRegistration" docId={docId}          // null = new document
  filterSlotCode="HALAL_CERT" colClass="col-12" readOnly={!isDraftEditable}
  stagedFiles={stagedFiles} onStagedFilesChange={setStagedFiles} // files kept until Save Draft
  onSlotsLoaded={setSlots}                                       // check mandatory rows before Submit
  onUploadSuccess={refresh} onDeleteSuccess={refresh}
/>
```
Other props: `filterSeqs` (show only some rows), `detailActivityId`, `showMandatory`
(default `true`), `fallbackDocId` (empty rows show another document's files read-only,
"Replace" uploads to `docId`), `onSlotFileChange({ slotCode, seq, label, file, files, action })`
with `action` `'upload'|'delete'` (caller manages the file instead). Default `colClass` =
`col-xl-6 col-lg-6 col-md-12`. Staged map key = `{slotCode}_{seq}`, e.g. `HALAL_CERT_1`.

`SpkFileUpload` alone (one row, no server slots): `title`, `description`, `file`, `fileName`,
`onUpload(file|files)`, `onView`, `onDelete`, `multiple`, `accept`, `maxSizeMB`, `readOnly`,
`uploadProgress`, `previewUrl`, `replaceOnly`, `onUploadClick`.

`SpkAttachmentArea` exists in the kit but no screen uses it — don't pick it for new work.

## Small wrappers

- `SpkButton`: `Buttonvariant="primary-light"`, `Size="sm"`, `Customclass`, `onClickfunc`,
  `Disabled`, `Buttontype`. Icon + text: `<i className="ri-save-line me-1" /><span>Save</span>`.
- `SpkBadge`: `variant="success-transparent"`, `Customclass`, `Pill`.
- `SpkCounterCard`: `card={{ title, count, percentage, linkLabel, linkHref, onLinkClick }}`,
  `icon="ri-flask-line"`, `iconBgClass="bg-primary-transparent"`, `iconColor="text-primary"`.
  Layout: `Row` > `Col xl={3} md={6}`.
- `SpkUrgencyBadge waitingSince={date} warningHours={24} dangerHours={72}` (unused by screens).
- `SpkAlert variant="info" CustomClass="mb-3"` + children (`<i className="ri-loader-4-line me-1" />text`);
  also `Dismiss`, `Closebutton`, `show`, `Id`. Inline page notices (processing / failed action).
- `SpkDropdown Togglevariant="outline-light" Customtoggleclass="border text-dark" Toggletext="Actions"`
  with `<Dropdown.Item>` children (react-bootstrap); also `Menuclass`, `Align`, `autoClose`, `Size`.
- `SpkTooltips placement="top" title="Text"` wrapping one element; also `tooltipClass`, `id`.
- `Spkapexcharts chartOptions={...} chartSeries={[...]} type="line" height={80} width="100%"`
  (react-apexcharts underneath).
- `SpkLoadingSkeleton variant="card"|"block"|"dashboard" height rows className`.
- Toast: `ToastService.showSuccess/showError/showWarning/showInfo(msg)` (default import from
  `@/hooks/Shared/useToast`). The app-level `AppToast` renders it; pages never render toasts.
- Session: `useUserSession(approvalListData, historyData)` (`@/hooks/Shared/useUserSession`) →
  `userId`, `userName`, `isPendingApproverForMe` (boolean), `isCreator(docUserId, docUserName)` (function).
- Security: `const { canRead, canManage, isLoading } = useAuthorize(SECURITY_OBJECT)` (`@/hooks/Core/SYS/useAuthorize`);
  no `canRead` → `SpkForm` with `<div className="alert alert-danger mt-4">You are not authorized…</div>`.
