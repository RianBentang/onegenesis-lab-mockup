/* ---------- Master Data › Form Invoice Lab Eksternal ----------
   ?no=<No. Invoice> edits an invoice, no param creates one. Pengajuan Terkait are picked through a
   LOV (SpkLovInput) over invoiceCandidates(): requests of the chosen vendor first, any can be picked. */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var editNo = params.get('no');
  var existing = editNo ? getInvoiceByNo(editNo) : null;
  var form = document.getElementById('invoiceForm');
  var vendorEl = document.getElementById('invVendor');
  var statusEl = document.getElementById('invStatus');
  var linked = existing ? (existing.requests || []).slice() : [];
  var fileName = existing ? existing.file || '' : '';

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  /* Dropdowns (SpkSelect2 via spk-select2.js) */
  vendorEl.innerHTML = '<option value="">-- Select Vendor --</option>' +
    EXTERNAL_MASTER_LAB.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');
  statusEl.innerHTML = INVOICE_STATUS.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');

  var tanggalFp = window.flatpickr('#invTanggal', { dateFormat: 'd-m-Y' });
  var jatuhTempoFp = window.flatpickr('#invJatuhTempo', { dateFormat: 'd-m-Y' });

  if (existing) {
    document.getElementById('invoicePageTitle').textContent = 'Invoice ' + existing.no;
    document.getElementById('invNo').value = existing.no;
    vendorEl.value = existing.vendor;
    statusEl.value = existing.status;
    tanggalFp.setDate(existing.tanggal, true, 'd-m-Y');
    if (existing.jatuhTempo) jatuhTempoFp.setDate(existing.jatuhTempo, true, 'd-m-Y');
    document.getElementById('invNominal').value = existing.nominal;
    document.getElementById('invCatatan').value = existing.catatan || '';
  }

  /* ---------- File (SpkAttachmentArea, one file, name only) ---------- */
  var fileInput = document.getElementById('invFileInput');
  function renderFile() {
    document.getElementById('invFileList').innerHTML = fileName
      ? '<div class="d-flex align-items-center justify-content-between bg-light rounded-1 px-2 py-1">' +
          '<span class="fs-12 text-truncate" title="' + esc(fileName) + '"><i class="ri-attachment-2 me-1"></i>' + esc(fileName) + '</span>' +
          '<button type="button" class="btn btn-danger btn-sm fs-10 py-0 px-2" id="btnRemoveInvoiceFile">Delete</button>' +
        '</div>'
      : '<span class="fs-12 text-muted">No file yet.</span>';
  }
  document.getElementById('btnAddInvoiceFile').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    if (fileInput.files[0]) fileName = fileInput.files[0].name;
    fileInput.value = '';
    renderFile();
  });
  document.getElementById('invFileList').addEventListener('click', function (e) {
    if (!e.target.closest('#btnRemoveInvoiceFile')) return;
    fileName = '';
    renderFile();
  });

  /* ---------- Pengajuan Terkait ---------- */
  function candidate(q) {
    return invoiceCandidates().filter(function (c) { return c.jenis === q.jenis && c.id === q.id; })[0] ||
      { jenis: q.jenis, id: q.id, sampel: '-', vendors: [] };
  }
  function isLinked(c) {
    return linked.some(function (q) { return q.jenis === c.jenis && q.id === c.id; });
  }
  function jenisBadge(jenis) {
    return '<span class="badge ' + (jenis === 'External' ? 'bg-info-transparent' : 'bg-primary-transparent') + '">' + jenis + '</span>';
  }
  function requestHref(c) {
    return '../HOLABSYS/' + (c.jenis === 'External' ? 'externalForm.html' : 'internalForm.html') + '?docId=' + encodeURIComponent(c.id);
  }

  function renderLinked() {
    document.getElementById('linkedBody').innerHTML = linked.map(function (q, i) {
      var c = candidate(q);
      return '<tr>' +
        '<td><button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" title="Remove" data-unlink="' + i + '"><i class="ri-delete-bin-line"></i></button></td>' +
        '<td><a href="' + requestHref(c) + '" class="text-primary fw-medium font-monospace">' + esc(c.id) + '</a></td>' +
        '<td>' + jenisBadge(c.jenis) + '</td>' +
        '<td>' + esc(c.sampel) + '</td>' +
        '<td>' + esc(c.vendors.join(', ') || '-') + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">No requests yet. Click "Search Request No.".</td></tr>';
  }

  document.getElementById('linkedBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-unlink]');
    if (!btn) return;
    linked.splice(+btn.dataset.unlink, 1);
    renderLinked();
    renderLov();
  });

  /* ---------- LOV modal ---------- */
  var lovModal = new bootstrap.Modal(document.getElementById('lovRequestModal'));
  var lovSearch = document.getElementById('lovSearch');

  function renderLov() {
    var q = lovSearch.value.trim().toLowerCase();
    var vendor = vendorEl.value;
    var list = invoiceCandidates().filter(function (c) {
      return !q || [c.id, c.sampel, c.jenis].concat(c.vendors).some(function (f) { return String(f).toLowerCase().indexOf(q) !== -1; });
    });
    /* Same vendor first */
    list.sort(function (a, b) {
      return (b.vendors.indexOf(vendor) !== -1) - (a.vendors.indexOf(vendor) !== -1) || (a.id < b.id ? 1 : -1);
    });
    document.getElementById('lovBody').innerHTML = list.map(function (c) {
      var picked = isLinked(c);
      return '<tr>' +
        '<td>' + (picked
          ? '<span class="badge bg-success-transparent">Selected</span>'
          : '<button type="button" class="btn btn-sm btn-primary-light btn-wave" data-pick="' + c.jenis + '|' + esc(c.id) + '">Select</button>') + '</td>' +
        '<td class="font-monospace">' + esc(c.id) + '</td>' +
        '<td>' + jenisBadge(c.jenis) + '</td>' +
        '<td>' + esc(c.sampel) + '</td>' +
        '<td>' + esc(c.vendors.join(', ') || '-') +
          (vendor && c.vendors.indexOf(vendor) !== -1 ? ' <span class="badge bg-success-transparent ms-1">Same vendor</span>' : '') + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="5" class="text-center text-muted py-4">No requests.</td></tr>';
  }

  document.getElementById('btnOpenLov').addEventListener('click', function () {
    lovSearch.value = '';
    renderLov();
    lovModal.show();
  });
  lovSearch.addEventListener('input', renderLov);

  document.getElementById('lovBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-pick]');
    if (!btn) return;
    var parts = btn.dataset.pick.split('|');
    var q = { jenis: parts[0], id: parts[1] };
    var others = invoicesForRequest(q.jenis, q.id).filter(function (inv) { return !existing || inv.no !== existing.no; });
    if (others.length) ToastService.showWarning(q.id + ' is already on invoice ' + others.map(function (inv) { return inv.no; }).join(', ') + '. Added anyway.');
    linked.push(q);
    renderLinked();
    renderLov();
  });

  /* ---------- Save ---------- */
  document.getElementById('btnSaveInvoice').addEventListener('click', function () {
    if (!validateForm(form)) return;
    var no = document.getElementById('invNo').value.trim();
    if (getInvoiceByNo(no) && (!existing || existing.no !== no)) {
      ToastService.showWarning('No. Invoice "' + no + '" is already registered.');
      return;
    }
    if (!linked.length) {
      ToastService.showWarning('Add at least one related request.');
      return;
    }
    saveInvoice({
      no: no,
      vendor: vendorEl.value,
      tanggal: document.getElementById('invTanggal').value,
      jatuhTempo: document.getElementById('invJatuhTempo').value,
      nominal: Number(document.getElementById('invNominal').value) || 0,
      status: statusEl.value,
      catatan: document.getElementById('invCatatan').value.trim(),
      file: fileName,
      requests: linked
    }, existing ? existing.no : null);
    ToastService.showSuccess('Invoice "' + no + '" saved with ' + linked.length + ' request(s).');
    setTimeout(function () { window.location.href = 'invoice.html'; }, 600);
  });

  renderFile();
  renderLinked();
});
