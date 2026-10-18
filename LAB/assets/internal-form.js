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
  /* No. Reference (?ref=): the form pre-fills from that request's template (request-reference.js);
     the document itself (number, date, status) stays this one */
  var refRecord = urlParams.get('ref') ? getRequestById(urlParams.get('ref')) : null;
  var prefill = refRecord ? requestTemplate(refRecord) : existingRecord;

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
  if (prefill && window.jQuery) {
    window.jQuery('#tipePengajuan').val(prefill.tipe).trigger('change');
    window.jQuery('#alamatPelanggan').val(prefill.alamatPelanggan || '').trigger('change');
    window.jQuery('#alamatPabrik').val(prefill.alamatPabrik || '').trigger('change');
    window.jQuery('#tujuanAnalisa').val(prefill.tujuan).trigger('change');
    window.jQuery('#namaSku').val(prefill.sku).trigger('change');
    window.jQuery('#kategoriPangan').val(prefill.kategoriPangan).trigger('change');
    window.jQuery('#jenisKemasan').val(prefill.kemasan).trigger('change');
    window.jQuery('#suhuPenyimpanan').val(prefill.suhu).trigger('change');

    var namaSampelEl = document.getElementById('namaSampel');
    var kodeBatchEl = document.getElementById('kodeBatch');
    var catatanEl = document.getElementById('catatanTambahan');
    if (namaSampelEl) namaSampelEl.value = prefill.sampel || '';
    if (kodeBatchEl) kodeBatchEl.value = prefill.batch || '';
    if (catatanEl) catatanEl.value = prefill.catatanTambahan || '';
  }

  /* Tanggal Produksi — Flatpickr (SpkDatePicker) */
  var tanggalProduksiFp = null;
  if (window.flatpickr) {
    tanggalProduksiFp = window.flatpickr('#tanggalProduksi', {
      dateFormat: 'd-m-Y',
      maxDate: 'today',
      altInput: false
    });
    if (prefill && prefill.prod) tanggalProduksiFp.setDate(prefill.prod, true, 'd-m-Y');
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

  /* Est. Tanggal Selesai Uji (read-only): empty until the SPK is issued. The Technical Review stores
     today + Max Lead Time of the Kaji Ulang table (default 20 hari); the Lab Coordinator (CRL) can
     change it there. Confirmed docs saved without a date get the estimate shown. */
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
    if (prefill && prefill.params && prefill.params.length) {
      ts.setValue(prefill.params, true);
      onParamsChange(prefill.params);
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

  /* Always renders the full chain (creator + every approver level through completion).
     `approvedCount` levels are shown Approved; every level from there to the end is Pending. */
  function renderApprovalList(containerId, chain, approvedCount) {
    var container = document.getElementById(containerId);
    if (!container) return;

    /* Approval History offcanvas of onegenesis-web SpkForm (spk-history.js) */
    var r = currentRecord();
    container.innerHTML = requestApprovalHistoryHtml(chain, approvedCount, r);
  }

  /* ---------- Reason modal (Reject / Return to Edit) ---------- */
  var reasonModalEl = document.getElementById('reasonModal');
  var reasonModal = (window.bootstrap && reasonModalEl) ? new window.bootstrap.Modal(reasonModalEl) : null;
  var reasonModalTitle = document.getElementById('reasonModalTitle');
  var reasonModalTextarea = document.getElementById('reasonModalTextarea');
  var reasonModalError = document.getElementById('reasonModalError');
  var pendingReasonAction = null;

  function openReasonModal(action) {
    pendingReasonAction = action;
    reasonModalTitle.textContent = { reject: 'Reject Reason', decline: 'Decline Technical Review Outcome — Reason' }[action] || 'Return to Edit Reason';
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
      var docNo = docNoEl ? docNoEl.textContent : '';
      var stampNow = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
      if (pendingReasonAction === 'decline') {
        /* Requester declines: back to the CRL, who changes the review (cl. 7.1.6) */
        var rec = currentRecord();
        updateRequest(docNo, { customerConsent: Object.assign({}, rec.customerConsent, { status: 'Declined', reason: reason, decidedBy: currentRole().name, decidedAt: stampNow }) });
        if (reasonModal) reasonModal.hide();
        ToastService.showSuccess('Declined. The Lab Coordinator gets the request back with your note.');
        refreshFormState();
        return;
      }
      var actionLabel = pendingReasonAction === 'reject' ? 'Rejected' : 'Returned for Editing';
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
  var BACK_BTN_HTML = spkDocButtonHtml('back', { href: 'internalList.html' });

  var actionMode = 'back-only';
  function renderActionButtons(mode) {
    /* AppFormBase document buttons; module actions (receipt, consent) as SpkButton */
    if (mode === 'bsu') formActionButtons.innerHTML = spkDocButtonsHtml('edit', 'internalList.html');
    else if (mode === 'approver') formActionButtons.innerHTML = spkDocButtonsHtml('approver', 'internalList.html');
    else if (mode === 'receipt') {
      /* Lab Admin = last approver: Approve opens the Sample Receipt (no extra confirmation) */
      formActionButtons.innerHTML = BACK_BTN_HTML + spkDocButtonHtml('return') + spkDocButtonHtml('reject') +
        spkButtonHtml('receive', 'success', 'ri-thumb-up-line', 'Approve & Receive Sample');
    } else if (mode === 'consent') {
      formActionButtons.innerHTML = BACK_BTN_HTML + spkButtonHtml('decline', 'danger', 'ri-close-circle-line', 'Decline') +
        spkButtonHtml('agree', 'success', 'ri-thumb-up-line', 'Agree');
    } else formActionButtons.innerHTML = BACK_BTN_HTML;
    /* After the certificate is issued: Re-test (TCM) / Revision (CRL / TCM) start a new document
       (amendmentForm.html), linked to this request */
    var r = currentRecord();
    var amendBtns = r ? amendmentButtonsHtml('internal', r, currentRole()) : '';
    if (amendBtns) formActionButtons.querySelector('a').insertAdjacentHTML('afterend', amendBtns);
  }

  function collectFormValues() {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    return {
      refNo: document.getElementById('noReference').value || null,
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
    /* Save Draft / Submit / Approve ask for confirmation first (spkOnDocAction) */
    spkOnDocAction(formActionButtons, function (action) {
      var docNo = docNoEl ? docNoEl.textContent : '';

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
        var submitChain = requestApprovalChain(record.tipe, record.tujuan);
        record.step = 'Approval';
        record.approvalIdx = 0;
        record.returned = false;
        updateRequest(docNo, record);
        ToastService.showSuccess('Request "' + docNo + '" submitted. Waiting for approval by ' + findRole(submitChain[0]).label + '.');
        window.location.href = 'internalList.html';
      } else if (action === 'receive') {
        openReceiptModal();
      } else if (action === 'decline') {
        openReasonModal('decline');
      } else if (action === 'agree') {
        agreeConsent();
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
        /* The last level is the Lab Admin: approving = receiving the sample (receipt modal) */
        if (idx === chain.length - 1) {
          openReceiptModal();
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

    var canConsent = isBSU && consentPending(record);

    setFormLocked(!canEdit);
    actionMode = canEdit && isBSU ? 'bsu' : canApprove ? (role.code === 'ADM' ? 'receipt' : 'approver') : canConsent ? 'consent' : 'back-only';

    var lastApproverEl = document.getElementById('lastApproverValue');
    if (lastApproverEl) {
      lastApproverEl.textContent = approvedCount
        ? findRole(chain[approvedCount - 1]).label
        : '–';
    }

    renderApprovalList('approvalOffcanvasBody', chain, approvedCount);
    /* Document History = record.activity + result changes (documentHistoryHtml) */
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
    document.getElementById('docReasonNote').innerHTML = docProgressHtml('internal', r || {}) + docReasonNoteHtml(r) +
      consentNoteHtml(r) + receiptNoteHtml(r) + docReportNoteHtml(r, 'internal');
    /* Document Journey: this request and its Re-test / Revision documents */
    DocJourney.render(document.getElementById('docJourney'), document.getElementById('docMain'), { source: 'internal', request: r, currentId: r && r.id });
    var spkEl = document.getElementById('spkNoValue');
    if (spkEl) spkEl.textContent = (r && r.spk) || 'Not Issued';
    updateEstInfo(typeof ts !== 'undefined' && ts ? ts.getValue() : ((r && r.params) || []));
  }

  /* Report tab: the LHU of this request (ReportPanel, report-form.js), mounted once */
  var reportPanel = null;
  function renderTabPane(tab) {
    if (tab === 'report') {
      if (!reportPanel) {
        reportPanel = ReportPanel.mount({ jenis: 'internal', docId: existingRecord.id, container: document.getElementById('paneReport'),
          actions: formActionButtons, backHref: 'internalList.html', formHref: 'internalForm.html', params: urlParams,
          isActive: function () { return activeTab === 'report'; } });
      } else {
        reportPanel.render();
      }
      return;
    }
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
    else if (activeTab !== 'report') formActionButtons.innerHTML = BACK_BTN_HTML;
    /* report: ReportPanel renders its own buttons (Submit / Approve & Issue / Re-test / Download …) */
  }

  function showTab(tab) {
    activeTab = tab;
    tabsNav.querySelectorAll('.nav-link').forEach(function (a) { a.classList.toggle('active', a.dataset.tab === tab); });
    document.querySelectorAll('[data-pane]').forEach(function (p) { p.classList.toggle('d-none', p.dataset.pane !== tab); });
    applyHeaderForTab();
    if (tab !== 'form') renderTabPane(tab);
  }

  /* Tabs per access: Form (everyone) · Technical Review & SPK (CRL) · Report (reportTabVisible: lab
     roles once a report exists, everyone else once a certificate is issued). One tab → no tab bar. */
  function tabsFor(role, rec) {
    var tabs = ['form'];
    if (!rec) return tabs;
    if (role.code === 'CRL') tabs.push('review');
    if (reportTabVisible(rec, role)) tabs.push('report');
    return tabs;
  }

  function refreshTabs() {
    var rec = currentRecord();
    var tabs = existingRecord ? tabsFor(currentRole(), rec) : ['form'];
    tabsNav.querySelectorAll('.nav-link').forEach(function (a) { a.parentElement.classList.toggle('d-none', tabs.indexOf(a.dataset.tab) === -1); });
    tabsCard.classList.toggle('d-none', tabs.length < 2);
    /* First visit: ?tab= wins; the CRL lands on Technical Review while the review is still open */
    if (!tabChosen) {
      tabChosen = true;
      var wanted = urlParams.get('tab') || (tabs.indexOf('review') !== -1 && rec.step === 'Technical Review' && !consentPending(rec) ? 'review' : 'form');
      showTab(tabs.indexOf(wanted) !== -1 ? wanted : 'form');
    } else {
      showTab(tabs.indexOf(activeTab) !== -1 ? activeTab : 'form');
    }
  }

  tabsNav.addEventListener('click', function (e) {
    var a = e.target.closest('.nav-link');
    if (!a) return;
    e.preventDefault();
    showTab(a.dataset.tab);
  });

  /* ---------- Requester consent (Partially Accepted / Subcontract, cl. 7.1) ---------- */
  function consentNoteHtml(r) {
    var c = r && r.customerConsent;
    if (!c || c.status === 'Agreed') return '';
    var list = '<ul class="mb-1 ps-3">' + c.items.map(function (it) {
      return '<li><span class="fw-semibold">' + it.text + '</span> — ' + (it.type === 'Subcontract'
        ? 'tested by subcontract lab <span class="fw-semibold">' + it.vendor + '</span> (KAN ' + ((vendorByName(it.vendor) || {}).kan || '-') + ')'
        : 'cannot be tested, dropped from this request') + '</li>';
    }).join('') + '</ul>';
    if (c.status === 'Declined') {
      return '<div class="alert alert-danger d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-user-unfollow-line fs-16"></i>' +
        '<div><div class="fw-semibold">Requester declined the technical review outcome · ' + c.decidedBy + ' · ' + c.decidedAt + '</div>' + list + c.reason +
        '<div class="text-muted fs-12">The Lab Coordinator changes the Technical Review and saves it again.</div></div></div>';
    }
    return '<div class="alert alert-warning d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-user-received-line fs-16"></i>' +
      '<div><div class="fw-semibold">Waiting for the requester to approve the technical review outcome · sent by ' + c.requestedBy + ' · ' + c.requestedAt + '</div>' + list +
      '<div class="text-muted fs-12">' + (r.spk ? 'Testing goes on; the report cannot be submitted until the requester agrees.' : 'The SPK is issued once the requester agrees.') + '</div></div></div>';
  }

  function agreeConsent() {
    var r = currentRecord();
    var c = r.customerConsent;
    updateRequest(r.id, {
      customerConsent: Object.assign({}, c, { status: 'Agreed', decidedBy: currentRole().name, decidedAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }),
      consentedCodes: (r.consentedCodes || []).concat(c.items.map(function (it) { return it.code; }))
    });
    if (r.step === 'Technical Review') {
      var issued = issueInternalSpk(r.id, currentRole().name);
      ToastService.showSuccess('Agreed. SPK "' + issued.spk + '" issued' + (issued._reagentRows ? ', ' + issued._reagentRows + ' reagent deduction(s) logged' : '') + '.');
    } else {
      ToastService.showSuccess('Agreed. The lab can submit the report.');
    }
    refreshFormState();
  }

  /* ---------- Sample Receipt (ADM, cl. 7.4): one reason field; time + retention automatic ---------- */
  function receiptNoteHtml(r) {
    var x = r && r.receipt;
    if (!x) return '';
    return '<div class="alert alert-primary d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-inbox-archive-line fs-16"></i>' +
      '<div><span class="fw-semibold">Sample received ' + x.at + '</span> by ' + x.by + ' — ' + receiptSummary(x) + '</div></div>';
  }

  var receiptModalEl = document.getElementById('receiptModal');
  function openReceiptModal() {
    document.getElementById('receiptAt').value = nowStamp();
    document.getElementById('receiptRetention').value = retentionUntil();
    document.getElementById('receiptNote').value = '';
    document.getElementById('receiptError').textContent = '';
    window.bootstrap.Modal.getOrCreateInstance(receiptModalEl).show();
  }
  document.getElementById('btnConfirmReceipt').addEventListener('click', function () {
    var note = document.getElementById('receiptNote').value.trim();
    var err = !note ? 'Reason is required.' : '';
    document.getElementById('receiptError').textContent = err;
    if (err) return;
    var r = currentRecord();
    var chainLen = requestApprovalChain(r.tipe, r.tujuan).length;
    updateRequest(r.id, { step: 'Technical Review', approvalIdx: chainLen, receipt: { at: document.getElementById('receiptAt').value, by: currentRole().name,
      note: note, retentionUntil: document.getElementById('receiptRetention').value } });
    window.bootstrap.Modal.getOrCreateInstance(receiptModalEl).hide();
    ToastService.showSuccess('Approved & sample of ' + r.id + ' received: Fully Approved. The Lab Coordinator does the technical review next.');
    refreshFormState();
  });

  document.addEventListener('holabsys:rolechange', refreshFormState);
  if (tipeSelect) window.jQuery ? window.jQuery(tipeSelect).on('change', refreshFormState) : tipeSelect.addEventListener('change', refreshFormState);
  var tujuanSelectEl = document.getElementById('tujuanAnalisa');
  if (tujuanSelectEl) window.jQuery ? window.jQuery(tujuanSelectEl).on('change', refreshFormState) : tujuanSelectEl.addEventListener('change', refreshFormState);

  refreshFormState();

  RequestReference.setup({ title: 'Internal', rows: getRequests, current: function () { return getRequestById(docNoEl.textContent); }, docId: function () { return docNoEl.textContent; }, columns: [{ key: 'tujuan', label: 'Analysis Purpose' }] });
});
