/* ---------- Master data (dummy) ---------- */
var MASTER_SITE_SN = ['Head Office', 'Plant Sentul', 'Plant Pati', 'Plant Gresik', 'Plant Rancaekek', 'Plant Cimanggis'];
var MASTER_DEPT_SN = ['Quality Assurance', 'Laboratorium', 'Research & Development', 'Regulatory Affairs', 'Process Development', 'Marketing'];
var MASTER_TUJUAN_SN = ['Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'Pendaftaran MD (BPOM)', 'Pengujian P5'];
var MASTER_KATEGORI_PANGAN_SN = ['Makanan Ringan', 'Minuman Susu', 'Biskuit & Wafer', 'Cokelat & Kembang Gula', 'Kacang & Snack'];
var MASTER_KEMASAN_SN = ['Plastik', 'Cup', 'Kaleng', 'Pouch Alufo', 'Karton'];
var MASTER_SUHU_PENYAJIAN = ['Ambient', 'Cool (Sejuk)', 'Frozen', 'Hot', 'Warm'];
var MASTER_ATRIBUT = ['Aftertaste', 'Rasa', 'Aroma', 'Warna & Penampakan', 'Tekstur'];

var MASTER_PARAMETER_SN = [
  { value: 'internal-rating', text: 'Internal Rating' },
  { value: 'ranking', text: 'Ranking' },
  { value: 'triangle', text: 'Triangle (Pembeda)' },
  { value: 'quality-monitoring', text: 'Quality Monitoring' }
];

function toOptionsSn(list) { return list.map(function (v) { return { value: v, text: v }; }); }

function fillSelectSn(selectEl, options, placeholder) {
  if (!selectEl) return;
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

function initSelect2Sn(id, placeholder) {
  var el = document.getElementById(id);
  if (!el || !window.jQuery || !window.jQuery.fn.select2) return;
  window.jQuery(el).select2({ width: '100%', placeholder: placeholder || '-- Pilih --', allowClear: true });
}

function generateSensoryDocNo() {
  var now = new Date();
  var ym = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  var seq = String(Math.floor(Math.random() * 90) + 10);
  return 'SN-' + ym + '-00' + seq;
}

function formatDateIDSn(date) {
  var d = String(date.getDate()).padStart(2, '0');
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var y = date.getFullYear();
  return d + '-' + m + '-' + y;
}

document.addEventListener('DOMContentLoaded', function () {
  var urlParams = new URLSearchParams(window.location.search);
  var existingId = urlParams.get('docId');
  var existingRecord = (existingId && typeof getSensoryRequestById === 'function') ? getSensoryRequestById(existingId) : null;

  var docNoEl = document.getElementById('docNoValue');
  var docDateEl = document.getElementById('docDateValue');
  var docNo = existingRecord ? existingRecord.id : generateSensoryDocNo();
  if (docNoEl) docNoEl.textContent = docNo;
  ['docNoValueApproval', 'docNoValueHistory'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = docNo;
  });
  if (docDateEl) docDateEl.textContent = existingRecord ? existingRecord.tanggal : formatDateIDSn(new Date());

  /* Master dropdowns */
  fillSelectSn(document.getElementById('alamatPelanggan'), toOptionsSn(MASTER_SITE_SN));
  fillSelectSn(document.getElementById('alamatPabrik'), toOptionsSn(MASTER_SITE_SN));
  fillSelectSn(document.getElementById('departemenPemohon'), toOptionsSn(MASTER_DEPT_SN));
  fillSelectSn(document.getElementById('tujuanAnalisa'), toOptionsSn(MASTER_TUJUAN_SN));
  fillSelectSn(document.getElementById('kategoriPangan'), toOptionsSn(MASTER_KATEGORI_PANGAN_SN));
  fillSelectSn(document.getElementById('jenisKemasan'), toOptionsSn(MASTER_KEMASAN_SN));
  fillSelectSn(document.getElementById('suhuPenyajian'), toOptionsSn(MASTER_SUHU_PENYAJIAN));
  fillSelectSn(document.getElementById('atribut'), toOptionsSn(MASTER_ATRIBUT));

  ['alamatPelanggan', 'alamatPabrik', 'departemenPemohon', 'tujuanAnalisa', 'kategoriPangan', 'idGenesis',
    'tipePengajuan', 'jenisKemasan', 'suhuPenyajian', 'atribut'
  ].forEach(function (id) { initSelect2Sn(id); });

  var roleCode = localStorage.getItem('holabsysRole');
  var role = (typeof findRole === 'function') ? findRole(roleCode) : null;
  if (role && window.jQuery) {
    window.jQuery('#departemenPemohon').val(existingRecord ? existingRecord.departemen : role.dept).trigger('change');
  }

  if (existingRecord && window.jQuery) {
    window.jQuery('#tipePengajuan').val(existingRecord.tipe).trigger('change');
    window.jQuery('#kategoriPangan').val(existingRecord.kategoriPangan).trigger('change');

    var idMap = { namaSampel: 'sampel', kodeBatch: 'batch', catatanTambahan: 'catatanTambahan', alasanUrgent: 'alasanUrgent' };
    Object.keys(idMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = existingRecord[idMap[id]] || '';
    });
  }

  var tanggalProduksiFp = null;
  if (window.flatpickr) {
    tanggalProduksiFp = window.flatpickr('#tanggalProduksi', { dateFormat: 'd-m-Y', maxDate: 'today', altInput: false });
    if (existingRecord && existingRecord.prod) tanggalProduksiFp.setDate(existingRecord.prod, true, 'd-m-Y');
  }

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

  var paramEl = document.getElementById('parameterUji');
  var paramCountBadge = document.getElementById('paramCountBadge');
  var ts = null;
  if (paramEl && window.TomSelect) {
    ts = new window.TomSelect(paramEl, {
      plugins: ['remove_button'],
      persist: false,
      placeholder: 'Cari & pilih parameter uji...',
      options: MASTER_PARAMETER_SN.map(function (p) { return { value: p.value, text: p.text }; }),
      onChange: function (values) {
        var arr = Array.isArray(values) ? values : (values ? [values] : []);
        paramCountBadge.textContent = arr.length + ' Parameter Terpilih';
      }
    });
  }

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
      dropzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('bg-primary-transparent'); });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('bg-primary-transparent'); });
    });
    dropzone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
  }

  /* =====================================================================
     Role-based approval simulation — 1-step chain (Request → Approve Admin),
     per the "Flow proses" diagram.
     ===================================================================== */

  function showToast(message) {
    var container = document.getElementById('appToastContainer');
    if (!container) { alert(message); return; }
    var toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white bg-dark border-0 shadow';
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = '<div class="d-flex"><div class="toast-body">' + message + '</div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
    container.appendChild(toastEl);
    if (window.bootstrap && window.bootstrap.Toast) {
      var toast = new window.bootstrap.Toast(toastEl, { delay: 3500 });
      toastEl.addEventListener('hidden.bs.toast', function () { toastEl.remove(); });
      toast.show();
    } else {
      setTimeout(function () { toastEl.remove(); }, 3500);
    }
  }

  var APPROVAL_CHAIN = ['ADM'];

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

  function renderApprovalList(containerId, approvedCount) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var html = renderApprovalRow(findRole('BSU'), 'Creator', 'Creator', false);
    APPROVAL_CHAIN.forEach(function (code, i) {
      var isApproved = i < approvedCount;
      html += renderApprovalRow(findRole(code), 'Approve Admin', isApproved ? 'Approved' : 'Pending', !isApproved);
    });
    container.innerHTML = html;
  }

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
      if (!reason) { reasonModalError.style.display = 'block'; return; }
      var actionLabel = pendingReasonAction === 'reject' ? 'Ditolak' : 'Dikembalikan untuk Edit';
      var docNoVal = docNoEl ? docNoEl.textContent : '';
      updateSensoryRequest(docNoVal, { step: 'Draft', approvalIdx: 0 });
      if (reasonModal) reasonModal.hide();
      showToast('Dokumen ' + actionLabel + ': "' + reason + '"');
      setTimeout(function () { window.location.href = 'asltAndSensory.html'; }, 1200);
    });
  }

  function setFormLocked(locked) {
    document.querySelectorAll('#sensoryForm input, #sensoryForm select, #sensoryForm textarea').forEach(function (el) { el.disabled = locked; });
    if (window.jQuery) {
      window.jQuery('#sensoryForm select').each(function () {
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
  }

  var formActionButtons = document.getElementById('formActionButtons');
  var BACK_BTN_HTML = '<a href="asltAndSensory.html" class="btn btn-sm bg-white d-inline-flex align-items-center gap-1"><i class="ri-arrow-left-line"></i> Back</a>';

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
    var atributEl = document.getElementById('atribut');
    var atributText = atributEl && atributEl.selectedIndex > -1 ? atributEl.options[atributEl.selectedIndex].text : '';
    return {
      id: docNoEl ? docNoEl.textContent : generateSensoryDocNo(),
      tanggal: docDateEl ? docDateEl.textContent : formatDateIDSn(new Date()),
      tipe: val('tipePengajuan'),
      alasanUrgent: val('alasanUrgent'),
      pemohon: findRole(localStorage.getItem('holabsysRole')).name,
      departemen: val('departemenPemohon'),
      jenis: 'Uji Sensori Internal - Afektif Rating',
      sampel: val('namaSampel'),
      kategoriPangan: val('kategoriPangan'),
      batch: val('kodeBatch'),
      prod: val('tanggalProduksi'),
      catatanTambahan: val('catatanTambahan'),
      blindCodes: [],
      sesi: '– (menunggu Approve Admin)',
      suhuWadah: (val('suhuPenyajian') || '-') + ' · ' + (val('kondisiPenyajian') || '-'),
      atribut: atributText,
      ketepatan: val('ketepatan'),
      param: ts ? ts.getValue().map(function (v) { var f = MASTER_PARAMETER_SN.find(function (p) { return p.value === v; }); return f ? f.text : v; }).join(', ') : '',
      step: 'Draft',
      approvalIdx: 0,
      status: 'Menunggu Approve Admin'
    };
  }

  if (formActionButtons) {
    formActionButtons.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.dataset.action;
      var docNoVal = docNoEl ? docNoEl.textContent : '';

      if (action === 'save-draft') {
        updateSensoryRequest(docNoVal, collectFormValues());
        showToast('Draf pengajuan Sensori "' + docNoVal + '" disimpan.');
      } else if (action === 'submit') {
        var form = document.getElementById('sensoryForm');
        if (form.checkValidity() === false) { form.reportValidity(); return; }
        var record = collectFormValues();
        record.step = 'Approval';
        record.approvalIdx = 0;
        updateSensoryRequest(docNoVal, record);
        showToast('Pengajuan Sensori "' + docNoVal + '" berhasil dikirim untuk Approve Admin.');
        setTimeout(function () { window.location.href = 'asltAndSensory.html'; }, 1200);
      } else if (action === 'return') {
        openReasonModal('return');
      } else if (action === 'reject') {
        openReasonModal('reject');
      } else if (action === 'approve') {
        var c1 = String(Math.floor(100 + Math.random() * 900));
        var c2 = String(Math.floor(100 + Math.random() * 900));
        var c3 = String(Math.floor(100 + Math.random() * 900));
        updateSensoryRequest(docNoVal, {
          step: 'Berjalan',
          approvalIdx: 1,
          status: 'Sesi Aktif',
          blindCodes: [c1, c2, c3],
          sesi: 'Sesi Baru (Menunggu Penjadwalan)'
        });
        showToast('Disetujui oleh Lab Administrator. 3-Digit Blind Codes: ' + c1 + ', ' + c2 + ', ' + c3);
        setTimeout(function () { window.location.href = 'asltAndSensory.html'; }, 1200);
      }
    });
  }

  function refreshFormState() {
    var role = findRole(localStorage.getItem('holabsysRole'));
    var isBSU = role.code === 'BSU';
    var idx = APPROVAL_CHAIN.indexOf(role.code);
    var isAuthorized = !isBSU && idx > -1 && (!existingRecord || existingRecord.step === 'Approval');

    setFormLocked(!isBSU);
    renderActionButtons(isBSU ? 'bsu' : (isAuthorized ? 'approver' : 'back-only'));

    var approvedCount = isAuthorized ? idx : (existingRecord && existingRecord.step === 'Berjalan' ? 1 : 0);

    var lastApproverEl = document.getElementById('lastApproverValue');
    if (lastApproverEl) lastApproverEl.textContent = approvedCount ? findRole(APPROVAL_CHAIN[0]).label : '–';

    renderApprovalList('approvalOffcanvasBody', approvedCount);
    renderApprovalList('historyOffcanvasBody', approvedCount);
  }

  document.addEventListener('holabsys:rolechange', refreshFormState);
  refreshFormState();
});
