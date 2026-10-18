/* ---------- Master data (dummy) ---------- */

/* Sensory and ASLT have their own request forms */

var MASTER_TUJUAN = [
  'Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'MD Registration (BPOM)', 'P5 Testing'
];

/* Nama SKU, Kategori Pangan, Jenis Kemasan and Suhu Penyimpanan come from FlexTab (dummy-flextab.js) */

function toOptions(list) {
  return list.map(function (v) { return { value: v, text: v }; });
}

function fillSelect(selectEl, options, placeholder) {
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

function initSelect2(id, placeholder) {
  var el = document.getElementById(id);
  if (el && window.spkSelect2) window.spkSelect2(el, placeholder ? { placeholder: placeholder } : {});
}

function formatDateID(date) {
  var d = String(date.getDate()).padStart(2, '0');
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var y = date.getFullYear();
  return d + '-' + m + '-' + y;
}

document.addEventListener('DOMContentLoaded', function () {
  /* Load an existing record if opened as internalForm.html?docId=... */
  var urlParams = new URLSearchParams(window.location.search);
  var existingId = urlParams.get('docId');
  var existingRecord = (existingId && typeof getRequestById === 'function') ? getRequestById(existingId) : null;

  /* Invoice Lab Eksternal linked to this request (read-only; managed in Master Data → Invoice) */
  var invoiceHtml = existingRecord ? requestInvoicesHtml('Internal', existingRecord.id) : '';
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
  if (docDateEl) docDateEl.textContent = existingRecord ? existingRecord.tanggal : formatDateID(new Date());

  /* Master dropdowns */
  fillSelect(document.getElementById('alamatPelanggan'), siteOptions());
  fillSelect(document.getElementById('alamatPabrik'), siteOptions());
  fillSelect(document.getElementById('tujuanAnalisa'), toOptions(MASTER_TUJUAN));
  fillSelect(document.getElementById('namaSku'), toOptions(flexTabOptions('LAB_SKU')));
  fillSelect(document.getElementById('kategoriPangan'), toOptions(flexTabOptions('LAB_KATEGORI_PANGAN')));
  fillSelect(document.getElementById('jenisKemasan'), toOptions(flexTabOptions('LAB_JENIS_KEMASAN')));
  fillSelect(document.getElementById('suhuPenyimpanan'), toOptions(flexTabOptions('LAB_SUHU_PENYIMPANAN')));

  ['alamatPelanggan', 'alamatPabrik', 'tujuanAnalisa', 'namaSku', 'kategoriPangan', 'jenisKemasan', 'idGenesis', 'suhuPenyimpanan', 'tipePengajuan']
    .forEach(function (id) { initSelect2(id); });

  /* Departemen Pemohon = the logged-in role's department; On Behalf unlocks it (on-behalf.js) */
  var onBehalf = OnBehalfField(existingRecord);

  /* Prefill from an existing record (opened via ?docId=) */
  if (existingRecord && window.jQuery) {
    window.jQuery('#tipePengajuan').val(existingRecord.tipe).trigger('change');
    window.jQuery('#alamatPelanggan').val(existingRecord.alamatPelanggan || '').trigger('change');
    window.jQuery('#alamatPabrik').val(existingRecord.alamatPabrik || '').trigger('change');
    window.jQuery('#tujuanAnalisa').val(existingRecord.tujuan).trigger('change');
    window.jQuery('#namaSku').val(existingRecord.sku).trigger('change');
    window.jQuery('#kategoriPangan').val(existingRecord.kategoriPangan).trigger('change');
    window.jQuery('#jenisKemasan').val(existingRecord.kemasan).trigger('change');
    window.jQuery('#suhuPenyimpanan').val(existingRecord.suhu).trigger('change');

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

  /* Pilih Parameter — TomSelect multi-select, auto-fills suhu */
  var paramEl = document.getElementById('parameterUji');
  var paramCountBadge = document.getElementById('paramCountBadge');
  var suhuAutoNote = document.getElementById('suhuAutoNote');

  function onParamsChange(selectedValues) {
    var rows = requestParameters('Internal').filter(function (p) { return selectedValues.indexOf(p.value) !== -1; });
    paramCountBadge.textContent = rows.length + ' Parameters Selected';

    /* Auto Suhu Penyimpanan — from the parameter with the longest lead time */
    if (rows.length && window.jQuery) {
      var longest = rows.reduce(function (a, b) { return b.leadTime > a.leadTime ? b : a; });
      window.jQuery('#suhuPenyimpanan').val(longest.suhu).trigger('change');
      suhuAutoNote.innerHTML = '<i class="ri-magic-line"></i> Automatic from the parameter with the longest lead time: <strong>' + longest.text + '</strong> (' + longest.leadTime + ' days)';
    } else {
      suhuAutoNote.textContent = '';
    }
    updateEstInfo(selectedValues);
  }

  /* Est. Tanggal Selesai Uji (read-only): empty until the doc is Confirmed. The last approval stores
     approval date + Max Lead Time of the Kaji Ulang table (default 20 hari); the Lab Coordinator (CRL) can
     change it in the kaji ulang. Confirmed docs saved without a date get the estimate shown. */
  function updateEstInfo(params) {
    var estEl = document.getElementById('estSelesaiInfo');
    var noteEl = document.getElementById('estSelesaiNote');
    var r = currentRecord();
    if (!r || !r.spk) {
      estEl.value = '';
      noteEl.textContent = '';
      return;
    }
    var s = kajiUlangSuggestion(kajiUlangRows({ params: params, kajiUlang: r.kajiUlang }));
    estEl.value = r.estSelesai || (s.days ? s.est : '');
    noteEl.innerHTML = r.hasilKajiUlang
      ? '<i class="ri-shield-check-line"></i> Set by the Lab Coordinator (CRL) during technical review'
      : '<i class="ri-magic-line"></i> Estimated at Confirmed: max lead time ' + s.days + ' days';
  }

  if (paramEl && window.TomSelect) {
    /* Grouped per lab (Lab Fisika Kimia / Lab Mikrobiologi) from the parameter master */
    var ts = new window.TomSelect(paramEl, Object.assign(parameterPickerOptions('Internal'), {
      plugins: ['remove_button'],
      persist: false,
      placeholder: 'Search & select test parameters...',
      onChange: function (values) {
        onParamsChange(Array.isArray(values) ? values : (values ? [values] : []));
      }
    }));
    if (existingRecord && existingRecord.params && existingRecord.params.length) {
      ts.setValue(existingRecord.params, true);
      onParamsChange(existingRecord.params);
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
     Role-based approval simulation (chain: requestApprovalChain, dummy-requests.js)
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
      var docNo = docNoEl ? docNoEl.textContent : '';
      updateRequest(docNo, pendingReasonAction === 'reject'
        ? { step: 'Rejected', rejectReason: reason, reasonBy: currentRole().label, reasonAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }
        : { step: 'Draft', approvalIdx: 0, returned: true, returnReason: reason, reasonBy: currentRole().label, reasonAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) });
      if (reasonModal) reasonModal.hide();
      ToastService.showSuccess('Document ' + actionLabel + ': "' + reason + '"');
      window.location.href = 'internalList.html';
    });
  }

  /* ---------- Field lock (only BSU can edit) ---------- */
  function setFormLocked(locked) {
    document.querySelectorAll('#internalForm input, #internalForm select, #internalForm textarea').forEach(function (el) {
      el.disabled = locked;
    });

    if (window.jQuery) {
      window.jQuery('#internalForm select').each(function () {
        if (window.jQuery(this).data('select2')) window.jQuery(this).prop('disabled', locked).trigger('change.select2');
      });
    }

    if (typeof ts !== 'undefined' && ts) {
      locked ? ts.disable() : ts.enable();
    }

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
    '<a href="internalList.html" class="btn btn-sm bg-white d-inline-flex align-items-center gap-1">' +
    '<i class="ri-arrow-left-line"></i> Back</a>';

  var actionMode = 'back-only';
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
    } else {
      formActionButtons.innerHTML = BACK_BTN_HTML;
    }
    /* TCM: Re-test from the request itself — once the SPK is issued, also before any report exists
       (e.g. an internal finding while testing). Same dialog as the Report form (retest.js). */
    var r = currentRecord();
    if (currentRole().code === 'TCM' && r && RETEST_STEPS.indexOf(r.step) !== -1 && !(r.reportCycle && r.reportCycle.type === 'Revision')) {
      formActionButtons.querySelector('a').insertAdjacentHTML('afterend',
        '<button type="button" data-action="retest" class="btn btn-sm btn-danger btn-wave d-inline-flex align-items-center gap-1"><i class="ri-restart-line"></i> Re-test</button>');
    }
  }

  function collectFormValues() {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    return {
      id: docNoEl ? docNoEl.textContent : generateRequestNo(),
      tanggal: docDateEl ? docDateEl.textContent : formatDateID(new Date()),
      tipe: val('tipePengajuan'),
      tujuan: val('tujuanAnalisa'),
      alamatPelanggan: val('alamatPelanggan'),
      alamatPabrik: val('alamatPabrik'),
      sampel: val('namaSampel'),
      sku: val('namaSku'),
      batch: val('kodeBatch'),
      prod: val('tanggalProduksi'),
      kategoriPangan: val('kategoriPangan'),
      kemasan: val('jenisKemasan'),
      params: (typeof ts !== 'undefined' && ts) ? ts.getValue() : [],
      suhu: val('suhuPenyimpanan'),
      pemohon: currentRole().name,
      departemen: val('departemenPemohon'),
      onBehalf: onBehalf.isOn(),
      onBehalfUser: onBehalf.user(),
      catatanTambahan: val('catatanTambahan'),
      step: 'Draft',
      approvalIdx: 0,
      spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null
    };
  }

  if (formActionButtons) {
    formActionButtons.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var docNo = docNoEl ? docNoEl.textContent : '';

      if (action === 'retest') { RetestDialog.open(currentRecord(), function () { refreshFormState(); }); return; }
      if (action === 'save-draft') {
        updateRequest(docNo, collectFormValues());
        ToastService.showSuccess('Request draft "' + docNo + '" saved.');
        refreshFormState();
      } else if (action === 'submit') {
        var form = document.getElementById('internalForm');
        if (!validateForm(form)) return;
        if (onBehalf.isOn() && !onBehalf.user()) {
          ToastService.showWarning('On Behalf is on: select the requesting user first.');
          return;
        }
        var record = collectFormValues();
        record.step = 'Approval';
        record.approvalIdx = 0;
        record.returned = false;
        updateRequest(docNo, record);
        ToastService.showSuccess('Request "' + docNo + '" submitted for approval.');
        window.location.href = 'internalList.html';
      } else if (action === 'return') {
        openReasonModal('return');
      } else if (action === 'reject') {
        openReasonModal('reject');
      } else if (action === 'approve') {
        var role = currentRole();
        var tipe = tipeSelect ? tipeSelect.value : 'Normal';
        var tujuanVal = document.getElementById('tujuanAnalisa').value;
        var chain = requestApprovalChain(tipe, tujuanVal);
        var idx = chain.indexOf(role.code);
        var pending = (getRequestById(docNo) || {}).approvalIdx || 0;
        if (idx !== pending) {
          ToastService.showWarning('It is not yet the turn of ' + role.label + '. Waiting for approval by ' + findRole(chain[pending]).label + '.');
          refreshFormState();
          return;
        }
        var isLast = idx === chain.length - 1;
        if (isLast) {
          var spkNo = generateSpkNo();
          var current = getRequestById(docNo) || {};
          var estimate = kajiUlangSuggestion(kajiUlangRows(current));
          updateRequest(docNo, { step: 'Done', approvalIdx: chain.length, spk: spkNo, sampleNos: assignSampleNos(current), estSelesai: estimate.days ? estimate.est : null });
          ToastService.showSuccess('Approved by ' + role.name + ' (' + role.label + '). SPK "' + spkNo + '" issued, sample labels ready to print.');
          window.location.href = 'internalList.html';
        } else {
          updateRequest(docNo, { approvalIdx: idx + 1 });
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

    var record = currentRecord();
    var step = record ? record.step : null;

    var isBSU = role.code === 'BSU';
    var chain = requestApprovalChain(tipe, tujuan);
    var idx = chain.indexOf(role.code);

    /* Approved levels so far: none before submit, all once past approval */
    var approvedCount = step === 'Approval' ? (record.approvalIdx || 0)
      : (step && step !== 'Draft' && step !== 'Rejected') ? chain.length : 0;

    /* BSU edits only New / Draft / Return to Edit; an approver acts only on a pending level */
    var canEdit = isBsuEditable();
    /* Only the role at the pending level may approve — no skipping earlier levels */
    var canApprove = !isBSU && step === 'Approval' && idx === approvedCount;

    setFormLocked(!canEdit);
    actionMode = canEdit && isBSU ? 'bsu' : (canApprove ? 'approver' : 'back-only');

    var lastApproverEl = document.getElementById('lastApproverValue');
    if (lastApproverEl) {
      lastApproverEl.textContent = approvedCount
        ? findRole(chain[approvedCount - 1]).label
        : '–';
    }

    /* Approval History + Document History offcanvases of onegenesis-web SpkForm (spk-history.js) */
    document.getElementById('approvalOffcanvasBody').innerHTML = requestApprovalHistoryHtml(chain, approvedCount, record);
    document.getElementById('historyOffcanvasBody').innerHTML = documentHistoryHtml(record);

    updateDocInfo();
    refreshTabs();
  }

  /* ---------- Tabs: Form Internal | Technical Review & SPK (Lab Coordinator, CRL, only) ----------
     Other roles, and new (unsaved) requests, see only the form without a tab bar. The sample
     labels live under Technical Review & SPK and appear once the SPK is issued. */
  var tabsCard = document.getElementById('internalTabsCard');
  var tabsNav = document.getElementById('internalTabs');
  var activeTab = 'form';
  var tabChosen = false;

  function currentRecord() { return getRequestById(docNoEl ? docNoEl.textContent : '') || null; }
  /* The requester can still change the request: New / Draft / Return to Edit */
  function isBsuEditable() {
    var role = currentRole();
    var r = currentRecord();
    return role.code === 'BSU' && (!r || r.step === 'Draft');
  }

  /* Info bar: doc status + workflow badge (docStatusCardHtml) and No. SPK; plus the read-only
     Est. Tanggal Selesai Uji from the kaji ulang */
  function updateDocInfo() {
    var r = currentRecord();
    var statusEl = document.getElementById('docStatusBadges');
    if (statusEl) statusEl.innerHTML = docStatusCardHtml(r);
    document.getElementById('docReasonNote').innerHTML = docReasonNoteHtml(r) + docReportNoteHtml(r, 'internal');
    var spkEl = document.getElementById('spkNoValue');
    if (spkEl) spkEl.textContent = (r && r.spk) || 'Not Issued';
    updateEstInfo(typeof ts !== 'undefined' && ts ? ts.getValue() : ((r && r.params) || []));
  }

  function renderTabPane(tab) {
    if (tab !== 'review') return;
    InternalReviewTab.render(document.getElementById('paneReview'), currentRecord(), {
      headerActions: formActionButtons,
      onIssued: function () {
        updateDocInfo();
        showTab('review');
      }
    });
  }

  /* Header actions follow the tab: the form's (Save / Submit / Approve…) on Form Internal; on
     Technical Review & SPK only Back, then the tab adds Simpan Kaji Ulang while the review is open */
  function applyHeaderForTab() {
    if (!formActionButtons) return;
    if (activeTab === 'form') renderActionButtons(actionMode);
    else formActionButtons.innerHTML = BACK_BTN_HTML;
  }

  function showTab(tab) {
    activeTab = tab;
    tabsNav.querySelectorAll('.nav-link').forEach(function (a) { a.classList.toggle('active', a.dataset.tab === tab); });
    document.querySelectorAll('[data-pane]').forEach(function (p) { p.classList.toggle('d-none', p.dataset.pane !== tab); });
    applyHeaderForTab();
    if (tab !== 'form') renderTabPane(tab);
  }

  function refreshTabs() {
    var role = currentRole();
    var showTabs = role.code === 'CRL' && !!existingRecord;
    tabsCard.classList.toggle('d-none', !showTabs);
    if (!showTabs) { showTab('form'); return; }
    /* First time the CRL opens a request: land on Technical Review & SPK while its kaji ulang is still
       empty, else on the form; ?tab=form|review overrides */
    if (!tabChosen) {
      tabChosen = true;
      var rec = currentRecord();
      var wanted = urlParams.get('tab') || (rec.spk && !rec.hasilKajiUlang && !rec.reportStatus ? 'review' : 'form');
      showTab(['form', 'review'].indexOf(wanted) !== -1 ? wanted : 'form');
    } else {
      showTab(activeTab);
    }
  }

  tabsNav.addEventListener('click', function (e) {
    var a = e.target.closest('.nav-link');
    if (!a) return;
    e.preventDefault();
    showTab(a.dataset.tab);
  });

  document.addEventListener('holabsys:rolechange', refreshFormState);
  if (tipeSelect) window.jQuery ? window.jQuery(tipeSelect).on('change', refreshFormState) : tipeSelect.addEventListener('change', refreshFormState);
  var tujuanSelectEl = document.getElementById('tujuanAnalisa');
  if (tujuanSelectEl) window.jQuery ? window.jQuery(tujuanSelectEl).on('change', refreshFormState) : tujuanSelectEl.addEventListener('change', refreshFormState);

  refreshFormState();
});
