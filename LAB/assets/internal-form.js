/* ---------- Master data (dummy) ---------- */
var MASTER_SITE = [
  'Head Office', 'Plant Sentul', 'Plant Pati', 'Plant Gresik', 'Plant Rancaekek', 'Plant Cimanggis'
];

var MASTER_DEPT = ['Quality Assurance', 'Laboratorium', 'Research & Development', 'Regulatory Affairs', 'Process Development', 'Marketing'];

var MASTER_LAB = ['Fisika Kimia', 'Mikrobiologi', 'Sensory', 'ASLT'];

var MASTER_TUJUAN = [
  'Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'Pendaftaran MD (BPOM)', 'Pengujian P5'
];

var MASTER_SKU = ['WCG - Wafer Cone Gourmet', 'MACO - Maco Wafer & Cream', 'Gery Saluut', 'Chocolatos', 'Slai O Lai'];

var MASTER_KATEGORI_PANGAN = ['Makanan Ringan', 'Minuman Susu', 'Biskuit & Wafer', 'Cokelat & Kembang Gula', 'Kacang & Snack'];

var MASTER_KEMASAN = ['Plastik', 'Cup', 'Kaleng', 'Pouch Alufo', 'Karton'];

var MASTER_SUHU = ['Ambient Temp', 'Cool (2-8°C)', 'Frozen (-18°C)'];

/* Suhu severity — used to auto-pick the coldest requirement among selected parameters */
var SUHU_RANK = { 'Ambient Temp': 0, 'Cool (2-8°C)': 1, 'Frozen (-18°C)': 2 };

var MASTER_PARAMETER = [
  { value: 'moisture', text: 'Moisture (Kadar Air)', method: 'SNI 2897:2008', category: 'Fisika Kimia', scope: true, leadTime: 2, suhu: 'Ambient Temp' },
  { value: 'fat', text: 'Kadar Lemak (Fat)', method: 'IK-LAB-02', category: 'Fisika Kimia', scope: true, leadTime: 2, suhu: 'Ambient Temp' },
  { value: 'ffa', text: 'FFA (Free Fatty Acid)', method: 'AOAC 940.28', category: 'Fisika Kimia', scope: true, leadTime: 1, suhu: 'Ambient Temp' },
  { value: 'protein', text: 'Kadar Protein', method: 'IK-LAB-05', category: 'Fisika Kimia', scope: true, leadTime: 2, suhu: 'Ambient Temp' },
  { value: 'salmonella', text: 'Salmonella sp.', method: 'SNI ISO 6579', category: 'Mikrobiologi', scope: true, leadTime: 5, suhu: 'Cool (2-8°C)' },
  { value: 'alt', text: 'Angka Lempeng Total (ALT)', method: 'SNI 2897:2008', category: 'Mikrobiologi', scope: false, leadTime: 3, suhu: 'Cool (2-8°C)' },
  { value: 'pb', text: 'Cemaran Logam (Pb)', method: 'AOAC 999.11', category: 'Fisika Kimia', scope: false, leadTime: 4, suhu: 'Frozen (-18°C)' }
];

function toOptions(list) {
  return list.map(function (v) { return { value: v, text: v }; });
}

function fillSelect(selectEl, options, placeholder) {
  var opt = document.createElement('option');
  opt.value = '';
  opt.textContent = placeholder || '-- Pilih --';
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
  if (!el || !window.jQuery || !window.jQuery.fn.select2) return;
  window.jQuery(el).select2({
    width: '100%',
    placeholder: placeholder || '-- Pilih --',
    allowClear: true
  });
}

function generateDocNo() {
  var now = new Date();
  var ym = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  var seq = String(Math.floor(Math.random() * 90) + 10);
  return 'REQ-' + ym + '-00' + seq;
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

  /* Document info bar */
  var docNoEl = document.getElementById('docNoValue');
  var docDateEl = document.getElementById('docDateValue');
  var docNo = existingRecord ? existingRecord.id : generateDocNo();
  if (docNoEl) docNoEl.textContent = docNo;
  ['docNoValueApproval', 'docNoValueHistory'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = docNo;
  });
  if (docDateEl) docDateEl.textContent = existingRecord ? existingRecord.tanggal : formatDateID(new Date());

  /* Master dropdowns */
  fillSelect(document.getElementById('alamatPelanggan'), toOptions(MASTER_SITE));
  fillSelect(document.getElementById('alamatPabrik'), toOptions(MASTER_SITE));
  fillSelect(document.getElementById('departemenPemohon'), toOptions(MASTER_DEPT));
  fillSelect(document.getElementById('laboratorium'), toOptions(MASTER_LAB));
  fillSelect(document.getElementById('tujuanAnalisa'), toOptions(MASTER_TUJUAN));
  fillSelect(document.getElementById('namaSku'), toOptions(MASTER_SKU));
  fillSelect(document.getElementById('kategoriPangan'), toOptions(MASTER_KATEGORI_PANGAN));
  fillSelect(document.getElementById('jenisKemasan'), toOptions(MASTER_KEMASAN));
  fillSelect(document.getElementById('suhuPenyimpanan'), toOptions(MASTER_SUHU));

  ['alamatPelanggan', 'alamatPabrik', 'departemenPemohon', 'laboratorium', 'tujuanAnalisa', 'namaSku', 'kategoriPangan', 'jenisKemasan', 'idGenesis', 'suhuPenyimpanan', 'tipePengajuan']
    .forEach(function (id) { initSelect2(id); });

  /* Departemen Pemohon auto-fills from the logged-in dummy role's department */
  var roleCode = localStorage.getItem('holabsysRole');
  var role = (typeof findRole === 'function') ? findRole(roleCode) : null;
  if (role && window.jQuery) {
    window.jQuery('#departemenPemohon').val(existingRecord ? existingRecord.departemen : role.dept).trigger('change');
  }

  /* Prefill from an existing record (opened via ?docId=) */
  if (existingRecord && window.jQuery) {
    window.jQuery('#tipePengajuan').val(existingRecord.tipe).trigger('change');
    window.jQuery('#alamatPelanggan').val(existingRecord.lab).trigger('change');
    window.jQuery('#alamatPabrik').val(existingRecord.lab).trigger('change');
    window.jQuery('#laboratorium').val(existingRecord.lab).trigger('change');
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

  /* Pilih Parameter — TomSelect multi-select, auto-fills method table + suhu */
  var paramEl = document.getElementById('parameterUji');
  var paramCountBadge = document.getElementById('paramCountBadge');
  var paramTableWrap = document.getElementById('paramTableWrap');
  var paramTableBody = document.getElementById('paramTableBody');
  var suhuAutoNote = document.getElementById('suhuAutoNote');

  function renderParamTable(selectedValues) {
    var rows = MASTER_PARAMETER.filter(function (p) { return selectedValues.indexOf(p.value) !== -1; });

    paramCountBadge.textContent = rows.length + ' Parameter Terpilih';
    paramTableWrap.style.display = rows.length ? '' : 'none';

    paramTableBody.innerHTML = rows.map(function (p) {
      var scopeBadge = p.scope
        ? '<span class="badge bg-success-transparent"><i class="ri-check-line"></i> In-Scope</span>'
        : '<span class="badge bg-secondary-transparent">Non-Scope</span>';
      return '<tr>' +
        '<td class="fw-semibold">' + p.text + '</td>' +
        '<td class="font-monospace text-muted">' + p.method + '</td>' +
        '<td>' + p.category + '</td>' +
        '<td>' + scopeBadge + '</td>' +
        '<td>' + p.leadTime + ' hari</td>' +
        '</tr>';
    }).join('');

    /* Auto Suhu Penyimpanan — from the parameter with the longest lead time */
    if (rows.length && window.jQuery) {
      var longest = rows.reduce(function (a, b) { return b.leadTime > a.leadTime ? b : a; });
      window.jQuery('#suhuPenyimpanan').val(longest.suhu).trigger('change');
      suhuAutoNote.innerHTML = '<i class="ri-magic-line"></i> Otomatis dari parameter dengan lead time terlama: <strong>' + longest.text + '</strong> (' + longest.leadTime + ' hari)';
    } else {
      suhuAutoNote.textContent = '';
    }
  }

  if (paramEl && window.TomSelect) {
    var ts = new window.TomSelect(paramEl, {
      plugins: ['remove_button'],
      persist: false,
      placeholder: 'Cari & pilih parameter uji...',
      options: MASTER_PARAMETER.map(function (p) { return { value: p.value, text: p.text }; }),
      onChange: function (values) {
        renderParamTable(Array.isArray(values) ? values : (values ? [values] : []));
      }
    });
    if (existingRecord && existingRecord.params && existingRecord.params.length) {
      ts.setValue(existingRecord.params, true);
      renderParamTable(existingRecord.params);
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
        '<button type="button" class="btn btn-danger btn-sm fs-10 py-0 px-2 file-remove" data-idx="' + idx + '">Hapus</button>' +
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
        alert('File "' + f.name + '" melebihi batas maksimal 10MB.');
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
     Role-based approval simulation
     ===================================================================== */

  /* ---------- Toast (top-center) ---------- */
  function showToast(message) {
    var container = document.getElementById('appToastContainer');
    if (!container) { alert(message); return; }

    var toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white bg-dark border-0 shadow';
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML =
      '<div class="d-flex">' +
      '<div class="toast-body">' + message + '</div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
      '</div>';
    container.appendChild(toastEl);

    if (window.bootstrap && window.bootstrap.Toast) {
      var toast = new window.bootstrap.Toast(toastEl, { delay: 3500 });
      toastEl.addEventListener('hidden.bs.toast', function () { toastEl.remove(); });
      toast.show();
    } else {
      setTimeout(function () { toastEl.remove(); }, 3500);
    }
  }

  /* ---------- Approval chain ---------- */
  function isMdOrP5(tujuan) {
    return tujuan === 'Pendaftaran MD (BPOM)' || tujuan === 'Pengujian P5';
  }

  function getApprovalChain(tipe, tujuan) {
    var mdP5 = isMdOrP5(tujuan);
    if (tipe === 'Urgent') {
      return mdP5 ? ['MGU', 'HOL', 'HOR', 'FRA', 'ADM'] : ['MGU', 'HOL', 'HOR', 'ADM'];
    }
    return mdP5 ? ['FRA', 'ADM'] : ['ADM'];
  }

  /* ---------- Approval list rendering (shared by both offcanvas panels) ---------- */
  function renderApprovalRow(role, levelLabel, statusLabel, pending) {
    var av = (typeof initials === 'function') ? initials(role.name) : role.code;
    // SpkForm approval offcanvas item
    return '<div class="d-flex align-items-start gap-2 p-3 rounded mb-2 ' + (pending ? 'bg-light' : 'bg-primary-transparent') + '">' +
      '<span class="avatar avatar-md avatar-rounded bg-primary-transparent text-primary flex-shrink-0 fs-12 fw-semibold">' + av + '</span>' +
      '<div class="flex-fill min-w-0">' +
      '<div class="text-uppercase text-muted fs-10">' + levelLabel + '</div>' +
      '<div class="fs-13 fw-semibold">' + role.name + '</div>' +
      '<div class="fs-11 text-muted">' + role.code + ' · ' + role.label + '</div>' +
      '</div>' +
      '<span class="badge ' + (pending ? 'bg-warning-transparent' : 'bg-success-transparent') + ' align-self-center">' + statusLabel + '</span>' +
      '</div>';
  }

  /* Always renders the full chain (creator + every approver level through completion).
     `approvedCount` levels are shown Approved; every level from there to the end is Pending. */
  function renderApprovalList(containerId, chain, approvedCount) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var html = renderApprovalRow(findRole('BSU'), 'Creator', 'Creator', false);
    chain.forEach(function (code, i) {
      var isApproved = i < approvedCount;
      html += renderApprovalRow(findRole(code), 'Approver · Level ' + (i + 1), isApproved ? 'Approved' : 'Pending', !isApproved);
    });
    container.innerHTML = html;
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
    reasonModalTitle.textContent = action === 'reject' ? 'Alasan Reject' : 'Alasan Return to Edit';
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
      var actionLabel = pendingReasonAction === 'reject' ? 'Ditolak' : 'Dikembalikan untuk Edit';
      var docNo = docNoEl ? docNoEl.textContent : '';
      updateRequest(docNo, pendingReasonAction === 'reject'
        ? { step: 'Rejected', reason: reason }
        : { step: 'Draft', approvalIdx: 0, returned: true, reason: reason });
      if (reasonModal) reasonModal.hide();
      showToast('Dokumen ' + actionLabel + ': "' + reason + '"');
      setTimeout(function () { window.location.href = 'internalList.html'; }, 1200);
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
  }

  /* ---------- Header action buttons ---------- */
  var formActionButtons = document.getElementById('formActionButtons');
  var BACK_BTN_HTML =
    '<a href="internalList.html" class="btn btn-sm bg-white d-inline-flex align-items-center gap-1">' +
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
    } else {
      formActionButtons.innerHTML = BACK_BTN_HTML;
    }
  }

  function collectFormValues() {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    return {
      id: docNoEl ? docNoEl.textContent : generateDocNo(),
      tanggal: docDateEl ? docDateEl.textContent : formatDateID(new Date()),
      tipe: val('tipePengajuan'),
      tujuan: val('tujuanAnalisa'),
      lab: val('laboratorium'),
      sampel: val('namaSampel'),
      sku: val('namaSku'),
      batch: val('kodeBatch'),
      prod: val('tanggalProduksi'),
      kategoriPangan: val('kategoriPangan'),
      kemasan: val('jenisKemasan'),
      params: (typeof ts !== 'undefined' && ts) ? ts.getValue() : [],
      suhu: val('suhuPenyimpanan'),
      pemohon: findRole(localStorage.getItem('holabsysRole')).name,
      departemen: val('departemenPemohon'),
      catatanTambahan: val('catatanTambahan'),
      step: 'Draft',
      approvalIdx: 0,
      spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null, labeled: false
    };
  }

  if (formActionButtons) {
    formActionButtons.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var docNo = docNoEl ? docNoEl.textContent : '';

      if (action === 'save-draft') {
        updateRequest(docNo, collectFormValues());
        showToast('Draf pengajuan "' + docNo + '" disimpan.');
        refreshFormState();
      } else if (action === 'submit') {
        var form = document.getElementById('internalForm');
        if (form.checkValidity() === false) { form.reportValidity(); return; }
        var record = collectFormValues();
        record.step = 'Approval';
        record.approvalIdx = 0;
        record.returned = false;
        updateRequest(docNo, record);
        showToast('Pengajuan "' + docNo + '" berhasil dikirim untuk approval.');
        setTimeout(function () { window.location.href = 'internalList.html'; }, 1200);
      } else if (action === 'return') {
        openReasonModal('return');
      } else if (action === 'reject') {
        openReasonModal('reject');
      } else if (action === 'approve') {
        var role = findRole(localStorage.getItem('holabsysRole'));
        var tipe = tipeSelect ? tipeSelect.value : 'Normal';
        var tujuanVal = document.getElementById('tujuanAnalisa').value;
        var chain = getApprovalChain(tipe, tujuanVal);
        var idx = chain.indexOf(role.code);
        var isLast = idx === chain.length - 1;
        if (isLast) {
          updateRequest(docNo, { step: 'Review & SPK', approvalIdx: chain.length });
          showToast('Disetujui oleh ' + role.name + ' (' + role.label + '). Dokumen diteruskan ke Review & SPK.');
          setTimeout(function () { window.location.href = 'internalList.html'; }, 1200);
        } else {
          updateRequest(docNo, { approvalIdx: idx + 1 });
          showToast('Disetujui oleh ' + role.name + ' (' + role.label + ').');
          refreshFormState();
        }
      }
    });
  }

  /* ---------- Master refresh — runs on role change / tipe change / tujuan change ---------- */
  function refreshFormState() {
    var role = findRole(localStorage.getItem('holabsysRole'));
    var tipe = tipeSelect ? tipeSelect.value : 'Normal';
    var tujuanEl = document.getElementById('tujuanAnalisa');
    var tujuan = tujuanEl ? tujuanEl.value : '';

    var record = getRequestById(docNoEl ? docNoEl.textContent : '');
    var step = record ? record.step : null;

    var isBSU = role.code === 'BSU';
    var chain = getApprovalChain(tipe, tujuan);
    var idx = chain.indexOf(role.code);

    /* Approved levels so far: none before submit, all once past approval */
    var approvedCount = step === 'Approval' ? (record.approvalIdx || 0)
      : (step && step !== 'Draft' && step !== 'Rejected') ? chain.length : 0;

    /* BSU edits only New / Draft / Return to Edit; an approver acts only on a pending level */
    var canEdit = isBSU && (!step || step === 'Draft');
    var canApprove = !isBSU && step === 'Approval' && idx >= approvedCount;

    setFormLocked(!canEdit);
    renderActionButtons(canEdit ? 'bsu' : (canApprove ? 'approver' : 'back-only'));

    var statusEl = document.getElementById('docStatusBadges');
    if (statusEl) statusEl.innerHTML = docStatusCardHtml(record);

    var lastApproverEl = document.getElementById('lastApproverValue');
    if (lastApproverEl) {
      lastApproverEl.textContent = approvedCount
        ? findRole(chain[approvedCount - 1]).label
        : '–';
    }

    renderApprovalList('approvalOffcanvasBody', chain, approvedCount);
    renderApprovalList('historyOffcanvasBody', chain, approvedCount);
  }

  document.addEventListener('holabsys:rolechange', refreshFormState);
  if (tipeSelect) window.jQuery ? window.jQuery(tipeSelect).on('change', refreshFormState) : tipeSelect.addEventListener('change', refreshFormState);
  var tujuanSelectEl = document.getElementById('tujuanAnalisa');
  if (tujuanSelectEl) window.jQuery ? window.jQuery(tujuanSelectEl).on('change', refreshFormState) : tujuanSelectEl.addEventListener('change', refreshFormState);

  refreshFormState();
});
