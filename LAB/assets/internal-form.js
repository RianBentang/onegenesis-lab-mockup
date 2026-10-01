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

/* Alternative reference methods per parameter — the requester (BSU) and Lab Administrator (ADM) can override the default
   `method` per request. First entry is the default. */
var MASTER_METODE_ACUAN = {
  moisture: ['SNI 2897:2008', 'SNI 01-2891-1992', 'AOAC 925.10', 'IK-LAB-01'],
  fat: ['IK-LAB-02', 'SNI 01-2891-1992', 'AOAC 920.39'],
  ffa: ['AOAC 940.28', 'SNI 01-3555-1998', 'IK-LAB-03'],
  protein: ['IK-LAB-05', 'SNI 01-2891-1992', 'AOAC 2001.11'],
  salmonella: ['SNI ISO 6579', 'ISO 6579-1:2017', 'BAM Chapter 5'],
  alt: ['SNI 2897:2008', 'ISO 4833-1:2013', 'BAM Chapter 3'],
  pb: ['AOAC 999.11', 'SNI 01-2896-1998', 'IK-LAB-07']
};

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
  if (el && window.spkSelect2) window.spkSelect2(el, placeholder ? { placeholder: placeholder } : {});
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

  /* Per-request method overrides { paramValue: method }, set by BSU or ADM */
  var paramMethods = Object.assign({}, existingRecord && existingRecord.paramMethods);
  var lastParamValues = [];

  function canEditMethodRole() {
    var r = findRole(localStorage.getItem('holabsysRole'));
    /* BSU while the request is still editable; ADM also during Kaji Ulang */
    return !!r && ((r.code === 'BSU' && !isPastApproval()) || r.code === 'ADM');
  }

  function renderMethodCell(p, canEdit) {
    var current = paramMethods[p.value] || p.method;
    var changed = current !== p.method;
    if (!canEdit) {
      return '<td class="font-monospace text-muted">' + current +
        (changed ? ' <span class="badge bg-info-transparent ms-1">Bukan Default</span>' : '') + '</td>';
    }
    var options = MASTER_METODE_ACUAN[p.value] || [p.method];
    if (options.indexOf(current) === -1) options = options.concat(current);
    return '<td><select class="form-select form-select-sm spk-select2-sm" data-param-method="' + p.value + '">' +
      options.map(function (m) {
        return '<option value="' + m + '"' + (m === current ? ' selected' : '') + '>' + m + (m === p.method ? ' (default)' : '') + '</option>';
      }).join('') +
      '</select></td>';
  }

  function renderParamTable(selectedValues) {
    lastParamValues = selectedValues;
    var canEditMethod = canEditMethodRole();
    var rows = MASTER_PARAMETER.filter(function (p) { return selectedValues.indexOf(p.value) !== -1; });

    paramCountBadge.textContent = rows.length + ' Parameter Terpilih';
    paramTableWrap.style.display = rows.length ? '' : 'none';

    paramTableBody.innerHTML = rows.map(function (p) {
      var scopeBadge = p.scope
        ? '<span class="badge bg-success-transparent"><i class="ri-check-line"></i> In-Scope</span>'
        : '<span class="badge bg-secondary-transparent">Non-Scope</span>';
      return '<tr>' +
        '<td class="fw-semibold">' + p.text + '</td>' +
        renderMethodCell(p, canEditMethod) +
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

  /* BSU / ADM changes a Metode Acuan Uji dropdown — saved straight to the request when it exists */
  paramTableBody.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-param-method]');
    if (!sel) return;
    var p = MASTER_PARAMETER.filter(function (x) { return x.value === sel.dataset.paramMethod; })[0];
    if (p && sel.value === p.method) delete paramMethods[p.value];
    else paramMethods[sel.dataset.paramMethod] = sel.value;
    if (existingRecord) {
      updateRequest(existingRecord.id, { paramMethods: Object.assign({}, paramMethods) });
      showToast('Metode acuan ' + (p ? p.text : sel.dataset.paramMethod) + ' diubah ke ' + sel.value + '.');
    }
  });

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
      updateRequest(docNo, { step: 'Draft', approvalIdx: 0 });
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
      paramMethods: Object.assign({}, paramMethods),
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
      } else if (action === 'submit') {
        var form = document.getElementById('internalForm');
        if (form.checkValidity() === false) { form.reportValidity(); return; }
        var record = collectFormValues();
        record.step = 'Approval';
        record.approvalIdx = 0;
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

    var isBSU = role.code === 'BSU';
    var chain = getApprovalChain(tipe, tujuan);
    var idx = chain.indexOf(role.code);
    var past = isPastApproval();
    var isAuthorized = !isBSU && idx > -1 && !past;

    /* Past approval (Kaji Ulang / Labeling / analysis / report) the request is read-only */
    setFormLocked(!isBSU || past);
    /* Re-render after locking so the method dropdowns stay enabled for who may edit them */
    renderParamTable(lastParamValues);
    renderActionButtons(past ? 'back-only' : (isBSU ? 'bsu' : (isAuthorized ? 'approver' : 'back-only')));

    /* BSU and off-chain roles see the whole chain as not-yet-started (0 approved);
       an authorized approver sees everyone before them as Approved; past approval all approved. */
    var approvedCount = past ? chain.length : (isAuthorized ? idx : 0);

    var lastApproverEl = document.getElementById('lastApproverValue');
    if (lastApproverEl) {
      lastApproverEl.textContent = approvedCount
        ? findRole(chain[approvedCount - 1]).label
        : '–';
    }

    renderApprovalList('approvalOffcanvasBody', chain, approvedCount);
    renderApprovalList('historyOffcanvasBody', chain, approvedCount);

    updateDocInfo();
    refreshTabs();
  }

  /* ---------- Tabs: Form Internal | Kaji Ulang & SPK | Labeling (Lab Administrator only) ----------
     Other roles, and new (unsaved) requests, see only the form without a tab bar. */
  var tabsCard = document.getElementById('internalTabsCard');
  var tabsNav = document.getElementById('internalTabs');
  var activeTab = 'form';
  var tabChosen = false;

  function currentRecord() { return existingRecord ? getRequestById(existingRecord.id) : null; }
  function isPastApproval() {
    var r = currentRecord();
    return !!r && r.step !== 'Draft' && r.step !== 'Approval';
  }

  var STEP_BADGE = {
    'Draft': ['bg-secondary-transparent', 'ri-draft-line', 'DRAFT'],
    'Approval': ['bg-warning-transparent', 'ri-time-line', 'APPROVAL'],
    'Review & SPK': ['bg-info-transparent', 'ri-shield-check-line', 'KAJI ULANG & SPK'],
    'Labeling': ['bg-primary-transparent', 'ri-price-tag-3-line', 'LABELING'],
    'Selesai': ['bg-purple-transparent', 'ri-flask-line', 'DIUJI ANALIS'],
    'Draft Report': ['bg-success-transparent', 'ri-file-chart-line', 'REPORT']
  };
  function updateDocInfo() {
    var r = currentRecord();
    var b = STEP_BADGE[(r && r.step) || 'Draft'] || STEP_BADGE.Draft;
    var badge = document.getElementById('docStatusBadge');
    if (badge) {
      badge.className = 'badge ' + b[0] + ' d-inline-flex align-items-center gap-1 py-2 px-3 fs-11 lh-1 rounded-1';
      badge.innerHTML = '<i class="' + b[1] + '"></i> ' + b[2];
    }
    var spkEl = document.getElementById('spkNoValue');
    if (spkEl) spkEl.textContent = (r && r.spk) || 'Belum Terbit';
  }

  function renderTabPane(tab) {
    var r = currentRecord();
    if (tab === 'review') {
      InternalReviewTab.render(document.getElementById('paneReview'), r, {
        toast: showToast,
        onIssued: function () { updateDocInfo(); showTab('labeling'); }
      });
    } else if (tab === 'labeling') {
      InternalLabelingTab.render(document.getElementById('paneLabeling'), r, {
        toast: showToast,
        onLabeled: function () { updateDocInfo(); renderTabPane('labeling'); }
      });
    }
  }

  /* Header actions (Save / Submit / Approve…) belong to the form; other tabs keep only Back */
  function applyHeaderForTab() {
    if (!formActionButtons) return;
    Array.prototype.forEach.call(formActionButtons.children, function (el, i) {
      if (i > 0) el.classList.toggle('d-none', activeTab !== 'form');
    });
  }

  function showTab(tab) {
    activeTab = tab;
    tabsNav.querySelectorAll('.nav-link').forEach(function (a) { a.classList.toggle('active', a.dataset.tab === tab); });
    document.querySelectorAll('[data-pane]').forEach(function (p) { p.classList.toggle('d-none', p.dataset.pane !== tab); });
    if (tab !== 'form') renderTabPane(tab);
    applyHeaderForTab();
  }

  function refreshTabs() {
    var role = findRole(localStorage.getItem('holabsysRole'));
    var showTabs = role.code === 'ADM' && !!existingRecord;
    tabsCard.classList.toggle('d-none', !showTabs);
    if (!showTabs) { if (activeTab !== 'form') showTab('form'); return; }
    /* First time the ADM opens a request: land on the tab of its current step (or ?tab=) */
    if (!tabChosen) {
      tabChosen = true;
      var step = currentRecord().step;
      var wanted = urlParams.get('tab') || (step === 'Review & SPK' ? 'review' : (step === 'Labeling' ? 'labeling' : 'form'));
      showTab(['form', 'review', 'labeling'].indexOf(wanted) !== -1 ? wanted : 'form');
    } else if (activeTab !== 'form') {
      renderTabPane(activeTab);
    }
    applyHeaderForTab();
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
