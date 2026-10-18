function extToOptions(list) {
  return list.map(function (v) { return { value: v, text: v }; });
}

function extFillSelect(selectEl, options, placeholder) {
  var opt = document.createElement('option');
  opt.value = '';
  opt.textContent = placeholder || '-- Select --';
  selectEl.appendChild(opt);
  options.forEach(function (o) {
    var el = document.createElement('option');
    el.value = o.value;
    el.textContent = o.text;
    selectEl.appendChild(el);
  });
}

function extInitSelect2(id, placeholder) {
  var el = document.getElementById(id);
  if (el && window.spkSelect2) window.spkSelect2(el, placeholder ? { placeholder: placeholder } : {});
}

function extFormatDateID(date) {
  var d = String(date.getDate()).padStart(2, '0');
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var y = date.getFullYear();
  return d + '-' + m + '-' + y;
}

document.addEventListener('DOMContentLoaded', function () {
  /* Load an existing record if opened as externalForm.html?docId=... */
  var urlParams = new URLSearchParams(window.location.search);
  var existingId = urlParams.get('docId');
  var existingRecord = existingId ? getExternalRequestById(existingId) : null;

  /* Invoice Lab Eksternal linked to this request (read-only; managed in Master Data → Invoice) */
  var invoiceHtml = existingRecord ? requestInvoicesHtml('External', existingRecord.id) : '';
  document.getElementById('invoiceCardBody').innerHTML = invoiceHtml;
  document.getElementById('invoiceCard').classList.toggle('d-none', !invoiceHtml);

  /* Document info bar */
  var docNoEl = document.getElementById('docNoValue');
  var docDateEl = document.getElementById('docDateValue');
  var docNo = existingRecord ? existingRecord.id : generateRequestNo();
  if (docNoEl) docNoEl.textContent = docNo;
  ['docNoValueApproval', 'docNoValueHistory'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = docNo;
  });
  if (docDateEl) docDateEl.textContent = existingRecord ? existingRecord.tanggal : extFormatDateID(new Date());

  /* Master dropdowns */
  extFillSelect(document.getElementById('alamatPelanggan'), siteOptions());
  extFillSelect(document.getElementById('alamatPabrik'), siteOptions());
  extFillSelect(document.getElementById('laboratoriumTujuan'), extToOptions(EXTERNAL_MASTER_LAB));
  extFillSelect(document.getElementById('tujuanAnalisa'), extToOptions(EXTERNAL_MASTER_TUJUAN));
  extFillSelect(document.getElementById('kategoriPangan'), extToOptions(flexTabOptions('LAB_KATEGORI_PANGAN')));
  extFillSelect(document.getElementById('jenisKemasan'), extToOptions(flexTabOptions('LAB_JENIS_KEMASAN')));

  ['alamatPelanggan', 'alamatPabrik', 'laboratoriumTujuan', 'tujuanAnalisa', 'kategoriPangan', 'jenisKemasan', 'tipePengajuan']
    .forEach(function (id) { extInitSelect2(id); });

  /* Departemen Pemohon = the logged-in role's department; On Behalf unlocks it (on-behalf.js) */
  var onBehalf = OnBehalfField(existingRecord);

  /* Prefill from an existing record (opened via ?docId=) */
  if (existingRecord && window.jQuery) {
    window.jQuery('#tipePengajuan').val(existingRecord.tipe).trigger('change');
    window.jQuery('#alamatPelanggan').val(existingRecord.alamatPelanggan || '').trigger('change');
    window.jQuery('#alamatPabrik').val(existingRecord.alamatPabrik || '').trigger('change');
    window.jQuery('#laboratoriumTujuan').val(existingRecord.lab).trigger('change');
    window.jQuery('#tujuanAnalisa').val(existingRecord.tujuan).trigger('change');
    window.jQuery('#kategoriPangan').val(existingRecord.kategoriPangan).trigger('change');
    window.jQuery('#jenisKemasan').val(existingRecord.kemasan).trigger('change');

    var namaSampelEl = document.getElementById('namaSampel');
    var kodeBatchEl = document.getElementById('kodeBatch');
    var catatanEl = document.getElementById('catatanTambahan');
    if (namaSampelEl) namaSampelEl.value = existingRecord.sampel || '';
    if (kodeBatchEl) kodeBatchEl.value = existingRecord.batch || '';
    if (catatanEl) catatanEl.value = existingRecord.catatanTambahan || '';
  }

  /* Tanggal Produksi — Flatpickr (SpkDatePicker) */
  var tanggalProduksiFp = null;
  if (window.flatpickr) {
    tanggalProduksiFp = window.flatpickr('#tanggalProduksi', {
      dateFormat: 'd-m-Y',
      maxDate: 'today',
      altInput: false
    });
    if (existingRecord && existingRecord.prod) tanggalProduksiFp.setDate(existingRecord.prod, true, 'd-m-Y');
  }

  /* Tipe Pengajuan → toggle Alasan Urgent */
  var tipeSelect = document.getElementById('tipePengajuan');
  var wrapUrgent = document.getElementById('wrapAlasanUrgent');
  var alasanUrgent = document.getElementById('alasanUrgent');
  function toggleUrgent() {
    var isUrgent = tipeSelect.value === 'Urgent';
    wrapUrgent.style.display = isUrgent ? '' : 'none';
    alasanUrgent.required = isUrgent;
    if (!isUrgent) alasanUrgent.value = '';
  }
  if (tipeSelect) {
    toggleUrgent();
    window.jQuery ? window.jQuery(tipeSelect).on('change', toggleUrgent) : tipeSelect.addEventListener('change', toggleUrgent);
  }

  /* Pilih Parameter — TomSelect multi-select (no auto-fill table/suhu in this form) */
  var paramEl = document.getElementById('parameterUji');
  var paramCountBadge = document.getElementById('paramCountBadge');
  var ts = null;

  if (paramEl && window.TomSelect) {
    /* Big groups Internal / External (the request can mix both), each grouped per lab, from the
       parameter master; values are "Jenis:value" */
    ts = new window.TomSelect(paramEl, Object.assign(parameterPickerOptions(['Internal', 'External']), {
      plugins: ['remove_button'],
      persist: false,
      placeholder: 'Search & select test parameters...',
      onChange: function (values) {
        var arr = Array.isArray(values) ? values : (values ? [values] : []);
        paramCountBadge.textContent = arr.length + ' Parameters Selected';
      }
    }));
    if (existingRecord && existingRecord.params && existingRecord.params.length) {
      ts.setValue(externalRequestParamKeys(existingRecord.params), true);
      paramCountBadge.textContent = existingRecord.params.length + ' Parameters Selected';
    }
  }

  /* File upload — dropzone + list */
  var dropzone = document.getElementById('fileDropzone');
  var fileInput = document.getElementById('fileInput');
  var fileList = document.getElementById('fileList');
  var files = [];

  function iconFor(name) {
    var ext = name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'ri-file-pdf-2-line';
    if (['doc', 'docx'].indexOf(ext) !== -1) return 'ri-file-word-2-line';
    if (['png', 'jpg', 'jpeg'].indexOf(ext) !== -1) return 'ri-image-2-line';
    return 'ri-file-line';
  }

  function renderFileList() {
    fileList.innerHTML = files.map(function (f, idx) {
      return '<div class="d-flex align-items-center justify-content-between gap-2 bg-light rounded-1 px-2 py-1">' +
        '<span class="fs-12 text-truncate" title="' + f.name + '"><i class="' + iconFor(f.name) + ' me-1"></i>' + f.name + '</span>' +
        '<div class="d-flex align-items-center gap-2 flex-shrink-0">' +
        '<span class="text-muted fs-11">' + (f.size / 1024 / 1024).toFixed(2) + ' MB</span>' +
        '<button type="button" class="btn btn-danger btn-sm fs-10 py-0 px-2 file-remove" data-idx="' + idx + '">Delete</button>' +
        '</div></div>';
    }).join('');

    fileList.querySelectorAll('.file-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        files.splice(Number(btn.dataset.idx), 1);
        renderFileList();
      });
    });
  }

  function addFiles(fileArr) {
    Array.from(fileArr).forEach(function (f) {
      if (f.size > 10 * 1024 * 1024) {
        ToastService.showWarning('File "' + f.name + '" exceeds the 10MB limit.');
        return;
      }
      files.push(f);
    });
    renderFileList();
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function (e) { addFiles(e.target.files); fileInput.value = ''; });

    ['dragenter', 'dragover'].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.add('bg-primary-transparent');
      });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) {
        e.preventDefault(); e.stopPropagation();
        dropzone.classList.remove('bg-primary-transparent');
      });
    });
    dropzone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
  }

  /* =====================================================================
     Role-based approval simulation (chain: externalApprovalChain, dummy-external-requests.js)
     ===================================================================== */

  /* ---------- Reason modal (Reject / Return to Edit) ---------- */
  var reasonModalEl = document.getElementById('reasonModal');
  var reasonModal = (window.bootstrap && reasonModalEl) ? new window.bootstrap.Modal(reasonModalEl) : null;
  var reasonModalTitle = document.getElementById('reasonModalTitle');
  var reasonModalTextarea = document.getElementById('reasonModalTextarea');
  var reasonModalError = document.getElementById('reasonModalError');
  var pendingReasonAction = null;

  function openReasonModal(action) {
    pendingReasonAction = action;
    reasonModalTitle.textContent = action === 'reject' ? 'Reject Reason' : 'Return to Edit Reason';
    reasonModalTextarea.value = '';
    reasonModalError.style.display = 'none';
    if (reasonModal) reasonModal.show();
  }

  var reasonModalConfirm = document.getElementById('reasonModalConfirm');
  if (reasonModalConfirm) {
    reasonModalConfirm.addEventListener('click', function () {
      var reason = reasonModalTextarea.value.trim();
      if (!reason) {
        reasonModalError.style.display = 'block';
        return;
      }
      var actionLabel = pendingReasonAction === 'reject' ? 'Rejected' : 'Returned for Editing';
      var docNoVal = docNoEl ? docNoEl.textContent : '';
      updateExternalRequest(docNoVal, pendingReasonAction === 'reject'
        ? { step: 'Rejected', rejectReason: reason, reasonBy: currentRole().label, reasonAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }
        : { step: 'Draft', approvalIdx: 0, returned: true, returnReason: reason, reasonBy: currentRole().label, reasonAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) });
      if (reasonModal) reasonModal.hide();
      ToastService.showSuccess('Document ' + actionLabel + ': "' + reason + '"');
      window.location.href = 'externalList.html';
    });
  }

  /* ---------- Field lock (only BSU can edit) ---------- */
  function setFormLocked(locked) {
    document.querySelectorAll('#externalForm input, #externalForm select, #externalForm textarea').forEach(function (el) {
      el.disabled = locked;
    });

    if (window.jQuery) {
      window.jQuery('#externalForm select').each(function () {
        if (window.jQuery(this).data('select2')) window.jQuery(this).prop('disabled', locked).trigger('change.select2');
      });
    }

    if (ts) { locked ? ts.disable() : ts.enable(); }

    if (tanggalProduksiFp) {
      tanggalProduksiFp.set('clickOpens', !locked);
      document.getElementById('tanggalProduksi').disabled = locked;
    }

    var dz = document.getElementById('fileDropzone');
    if (dz) dz.classList.toggle('disabled', locked);

    onBehalf.setLocked(locked);
  }

  /* ---------- Header action buttons ---------- */
  var formActionButtons = document.getElementById('formActionButtons');
  var BACK_BTN_HTML =
    '<a href="externalList.html" class="btn btn-sm bg-white d-inline-flex align-items-center gap-1">' +
    '<i class="ri-arrow-left-line"></i> Back</a>';

  function renderActionButtons(mode) {
    if (mode === 'bsu') {
      formActionButtons.innerHTML = BACK_BTN_HTML +
        '<button type="button" data-action="save-draft" class="btn btn-sm btn-warning btn-wave d-inline-flex align-items-center gap-1 text-white"><i class="ri-save-3-line"></i> Save Draft</button>' +
        '<button type="button" data-action="submit" class="btn btn-sm btn-success btn-wave d-inline-flex align-items-center gap-1"><i class="ri-send-plane-fill"></i> Submit</button>';
    } else if (mode === 'approver') {
      formActionButtons.innerHTML = BACK_BTN_HTML +
        '<button type="button" data-action="return" class="btn btn-sm btn-warning d-inline-flex align-items-center gap-1 text-white"><i class="ri-arrow-go-back-line"></i> Return to Edit</button>' +
        '<button type="button" data-action="reject" class="btn btn-sm btn-danger d-inline-flex align-items-center gap-1"><i class="ri-close-circle-line"></i> Reject</button>' +
        '<button type="button" data-action="approve" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-checkbox-circle-line"></i> Approve</button>';
    } else if (mode === 'delivery') {
      formActionButtons.innerHTML = BACK_BTN_HTML +
        '<button type="button" data-action="confirm-delivery" class="btn btn-sm btn-success btn-wave d-inline-flex align-items-center gap-1"><i class="ri-truck-line"></i> Confirm Delivery</button>';
    } else {
      formActionButtons.innerHTML = BACK_BTN_HTML;
    }
  }

  function collectFormValues() {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    return {
      id: docNoEl ? docNoEl.textContent : generateRequestNo(),
      tanggal: docDateEl ? docDateEl.textContent : extFormatDateID(new Date()),
      tipe: val('tipePengajuan'),
      tujuan: val('tujuanAnalisa'),
      alamatPelanggan: val('alamatPelanggan'),
      alamatPabrik: val('alamatPabrik'),
      lab: val('laboratoriumTujuan'),
      sampel: val('namaSampel'),
      batch: val('kodeBatch'),
      prod: val('tanggalProduksi'),
      kategoriPangan: val('kategoriPangan'),
      kemasan: val('jenisKemasan'),
      params: ts ? ts.getValue() : [],
      pemohon: currentRole().name,
      departemen: val('departemenPemohon'),
      onBehalf: onBehalf.isOn(),
      onBehalfUser: onBehalf.user(),
      catatanTambahan: val('catatanTambahan'),
      step: 'Draft',
      approvalIdx: 0
    };
  }

  if (formActionButtons) {
    formActionButtons.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var docNoVal = docNoEl ? docNoEl.textContent : '';

      if (action === 'save-draft') {
        updateExternalRequest(docNoVal, collectFormValues());
        ToastService.showSuccess('Request draft "' + docNoVal + '" saved.');
      } else if (action === 'submit') {
        var form = document.getElementById('externalForm');
        if (!validateForm(form)) return;
        if (onBehalf.isOn() && !onBehalf.user()) {
          ToastService.showWarning('On Behalf is on: select the requesting user first.');
          return;
        }
        var record = collectFormValues();
        record.step = 'Approval';
        record.approvalIdx = 0;
        record.returned = false;
        updateExternalRequest(docNoVal, record);
        ToastService.showSuccess('Request "' + docNoVal + '" submitted for approval.');
        window.location.href = 'externalList.html';
      } else if (action === 'confirm-delivery') {
        var adm = currentRole();
        var now = new Date();
        var pad = function (n) { return String(n).padStart(2, '0'); };
        updateExternalRequest(docNoVal, {
          step: 'Confirmed',
          deliveredBy: adm.name,
          deliveredAt: extFormatDateID(now) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes())
        });
        ToastService.showSuccess('Sample of "' + docNoVal + '" sent to ' + (document.getElementById('laboratoriumTujuan').value || 'the destination lab') + '. Document Confirmed.');
        refreshFormState();
      } else if (action === 'return') {
        openReasonModal('return');
      } else if (action === 'reject') {
        openReasonModal('reject');
      } else if (action === 'approve') {
        var role = currentRole();
        var tipe = tipeSelect ? tipeSelect.value : 'Normal';
        var tujuanVal = document.getElementById('tujuanAnalisa').value;
        var chain = externalApprovalChain(tipe, tujuanVal);
        var idx = chain.indexOf(role.code);
        var pending = (getExternalRequestById(docNoVal) || {}).approvalIdx || 0;
        if (idx !== pending) {
          ToastService.showWarning('It is not yet the turn of ' + role.label + '. Waiting for approval by ' + findRole(chain[pending]).label + '.');
          refreshFormState();
          return;
        }
        var isLast = idx === chain.length - 1;
        if (isLast) {
          updateExternalRequest(docNoVal, { step: 'Sample Delivery', approvalIdx: chain.length });
          ToastService.showSuccess('Approved by ' + role.name + ' (' + role.label + '). Fully Approved, waiting for Sample Delivery.');
          refreshFormState();
        } else {
          updateExternalRequest(docNoVal, { approvalIdx: idx + 1 });
          ToastService.showSuccess('Approved by ' + role.name + ' (' + role.label + ').');
          refreshFormState();
        }
      }
    });
  }

  /* ---------- Master refresh — runs on role change / tipe change / tujuan change ---------- */
  function refreshFormState() {
    var role = currentRole();
    var tipe = tipeSelect ? tipeSelect.value : 'Normal';
    var tujuanEl = document.getElementById('tujuanAnalisa');
    var tujuan = tujuanEl ? tujuanEl.value : '';

    var isBSU = role.code === 'BSU';
    var chain = externalApprovalChain(tipe, tujuan);
    var idx = chain.indexOf(role.code);

    var record = getExternalRequestById(docNoEl ? docNoEl.textContent : '');
    var step = record ? record.step : null;
    /* Approved levels so far: none before submit, all once past approval */
    var approvedCount = step === 'Approval' ? (record.approvalIdx || 0)
      : (step && step !== 'Draft') ? chain.length : 0;
    /* Only the role at the pending level may approve — no skipping earlier levels */
    var isAuthorized = !isBSU && step === 'Approval' && idx === approvedCount;

    /* BSU edits only a new / draft document; after Fully Approved the Lab Admin runs Sample Delivery */
    var editable = isBSU && (!step || step === 'Draft');
    var canDeliver = role.code === 'ADM' && step === 'Sample Delivery';
    setFormLocked(!editable);
    renderActionButtons(editable ? 'bsu' : (isAuthorized ? 'approver' : (canDeliver ? 'delivery' : 'back-only')));

    var statusEl = document.getElementById('docStatusBadges');
    if (statusEl) statusEl.innerHTML = docStatusCardHtml(record || {});
    document.getElementById('docReasonNote').innerHTML = docReasonNoteHtml(record);

    var lastApproverEl = document.getElementById('lastApproverValue');
    if (lastApproverEl) {
      lastApproverEl.textContent = approvedCount
        ? findRole(chain[approvedCount - 1]).label
        : '–';
    }

    /* Approval History + Document History offcanvases of onegenesis-web SpkForm (spk-history.js) */
    document.getElementById('approvalOffcanvasBody').innerHTML = requestApprovalHistoryHtml(chain, approvedCount, record);
    document.getElementById('historyOffcanvasBody').innerHTML = documentHistoryHtml(record);
  }

  document.addEventListener('holabsys:rolechange', refreshFormState);
  if (tipeSelect) window.jQuery ? window.jQuery(tipeSelect).on('change', refreshFormState) : tipeSelect.addEventListener('change', refreshFormState);
  var tujuanSelectEl = document.getElementById('tujuanAnalisa');
  if (tujuanSelectEl) window.jQuery ? window.jQuery(tujuanSelectEl).on('change', refreshFormState) : tujuanSelectEl.addEventListener('change', refreshFormState);

  refreshFormState();
});
