/* ---------- Master data (dummy) ---------- */
var MASTER_SITE_SN = ['Head Office', 'Plant Sentul', 'Plant Pati', 'Plant Gresik', 'Plant Rancaekek', 'Plant Cimanggis'];
var MASTER_DEPT_SN = ['Quality Assurance', 'Laboratorium', 'Research & Development', 'Regulatory Affairs', 'Process Development', 'Marketing'];
var MASTER_TUJUAN_SN = ['Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'Pendaftaran MD (BPOM)', 'Pengujian P5'];
var MASTER_KATEGORI_PANGAN_SN = ['Makanan Ringan', 'Minuman Susu', 'Biskuit & Wafer', 'Cokelat & Kembang Gula', 'Kacang & Snack'];
var MASTER_KEMASAN_SN = ['Plastik', 'Cup', 'Kaleng', 'Pouch Alufo', 'Karton'];
var MASTER_SUHU_PENYAJIAN = ['Ambient', 'Cool (Sejuk)', 'Frozen', 'Hot', 'Warm'];
var MASTER_LAB_SN = ['Fisika Kimia', 'Mikrobiologi', 'Sensory', 'ASLT'];

var MASTER_PARAMETER_SN = [
  { value: 'internal-rating', text: 'Internal Rating' },
  { value: 'ranking', text: 'Ranking' },
  { value: 'triangle', text: 'Triangle (Pembeda)' },
  { value: 'quality-monitoring', text: 'Quality Monitoring' }
];

/* Atribut that each parameter can test (Master Scope Lab) */
var MASTER_ATRIBUT_BY_PARAM = {
  'internal-rating': ['Rasa', 'Aroma', 'Tekstur', 'Warna & Penampakan', 'Aftertaste', 'Overall'],
  'ranking': ['Rasa', 'Aroma', 'Tekstur', 'Overall'],
  'triangle': ['Rasa', 'Aroma', 'Tekstur', 'Warna & Penampakan'],
  'quality-monitoring': ['Rasa', 'Aroma', 'Tekstur', 'Warna & Penampakan', 'Aftertaste']
};

/* Ketepatan (specific note) per atribut; the Ketepatan options of a row = those of its chosen atribut */
var MASTER_KETEPATAN_BY_ATRIBUT = {
  'Rasa': ['Rasa Manis', 'Rasa Asin', 'Rasa Asam', 'Rasa Pahit', 'Rasa Pedas', 'Rasa Gurih (Umami)'],
  'Aroma': ['Aroma Cokelat', 'Aroma Susu', 'Aroma Vanila', 'Aroma Gosong', 'Off-odor / Tengik'],
  'Tekstur': ['Renyah', 'Keras', 'Lembut', 'Lengket', 'Berpasir'],
  'Warna & Penampakan': ['Warna Cokelat', 'Kecerahan', 'Keseragaman Warna', 'Bentuk Utuh'],
  'Aftertaste': ['Aftertaste Pahit', 'Aftertaste Manis', 'Aftertaste Logam', 'Tertinggal Lama'],
  'Overall': ['Overall Liking', 'Overall Preference']
};

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
  if (el && window.spkSelect2) window.spkSelect2(el, placeholder ? { placeholder: placeholder } : {});
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
  fillSelectSn(document.getElementById('laboratorium'), toOptionsSn(MASTER_LAB_SN));
  document.getElementById('laboratorium').value = (existingRecord && existingRecord.lab) || 'Sensory';

  ['alamatPelanggan', 'alamatPabrik', 'departemenPemohon', 'tujuanAnalisa', 'kategoriPangan', 'idGenesis',
    'tipePengajuan', 'jenisKemasan', 'suhuPenyajian', 'laboratorium'
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
  /* ---------- Atribut & Ketepatan per parameter ----------
     One row per selected parameter. Atribut options come from the parameter, Ketepatan options
     from the chosen atribut; both can hold many values (TomSelect multi). */
  var atributState = {};   // { paramValue: { atribut: [], ketepatan: [] } }
  var rowSelects = [];     // TomSelect instances of the current rows
  var formLocked = false;
  var atributWrap = document.getElementById('atributTableWrap');
  var atributBody = document.getElementById('atributTableBody');

  if (existingRecord && existingRecord.atributMap) {
    Object.keys(existingRecord.atributMap).forEach(function (k) {
      atributState[k] = { atribut: (existingRecord.atributMap[k].atribut || []).slice(), ketepatan: (existingRecord.atributMap[k].ketepatan || []).slice() };
    });
  }

  function paramText(v) {
    var f = MASTER_PARAMETER_SN.filter(function (p) { return p.value === v; })[0];
    return f ? f.text : v;
  }

  function ketepatanOptions(atributList) {
    var out = [];
    atributList.forEach(function (a) {
      (MASTER_KETEPATAN_BY_ATRIBUT[a] || []).forEach(function (k) { out.push({ value: k, text: k, group: a }); });
    });
    return out;
  }

  function renderAtributTable(params) {
    rowSelects.forEach(function (t) { t.destroy(); });
    rowSelects = [];
    atributWrap.style.display = params.length ? '' : 'none';
    atributBody.innerHTML = params.map(function (p) {
      return '<tr data-param="' + p + '">' +
        '<td class="fw-semibold">' + paramText(p) + '</td>' +
        '<td><select multiple data-role="atribut" placeholder="Pilih atribut..."></select></td>' +
        '<td><select multiple data-role="ketepatan" placeholder="Pilih ketepatan..."></select></td>' +
        '</tr>';
    }).join('');

    params.forEach(function (p) {
      var st = atributState[p] = atributState[p] || { atribut: [], ketepatan: [] };
      var row = atributBody.querySelector('tr[data-param="' + p + '"]');
      var ketTs = new window.TomSelect(row.querySelector('[data-role="ketepatan"]'), {
        plugins: ['remove_button'], persist: false, create: false, dropdownParent: 'body',
        optgroupField: 'group', lockOptgroupOrder: true,
        optgroups: st.atribut.map(function (a) { return { value: a, label: a }; }),
        options: ketepatanOptions(st.atribut),
        items: st.ketepatan,
        onChange: function (v) { st.ketepatan = Array.isArray(v) ? v : (v ? [v] : []); }
      });
      var atrTs = new window.TomSelect(row.querySelector('[data-role="atribut"]'), {
        plugins: ['remove_button'], persist: false, create: false, dropdownParent: 'body',
        options: (MASTER_ATRIBUT_BY_PARAM[p] || []).map(function (a) { return { value: a, text: a }; }),
        items: st.atribut,
        onChange: function (v) {
          st.atribut = Array.isArray(v) ? v : (v ? [v] : []);
          /* Ketepatan follows the atribut: drop options/values of removed atribut, add new ones */
          var opts = ketepatanOptions(st.atribut);
          var allowed = opts.map(function (o) { return o.value; });
          st.ketepatan = st.ketepatan.filter(function (k) { return allowed.indexOf(k) !== -1; });
          ketTs.clear(true);
          ketTs.clearOptions();
          ketTs.clearOptionGroups();
          st.atribut.forEach(function (a) { ketTs.addOptionGroup(a, { value: a, label: a }); });
          ketTs.addOptions(opts);
          ketTs.setValue(st.ketepatan, true);
          ketTs.refreshOptions(false);
        }
      });
      rowSelects.push(atrTs, ketTs);
      if (formLocked) { atrTs.disable(); ketTs.disable(); }
    });
  }

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
        renderAtributTable(arr);
      }
    });
    if (existingRecord && existingRecord.params && existingRecord.params.length) {
      ts.setValue(existingRecord.params, true);
      paramCountBadge.textContent = existingRecord.params.length + ' Parameter Terpilih';
      renderAtributTable(existingRecord.params);
    }
  }

  /* Each parameter needs at least one atribut and one ketepatan */
  function atributIncomplete() {
    var params = ts ? ts.getValue() : [];
    if (!params.length) return 'Pilih minimal satu Parameter Uji.';
    var missing = params.filter(function (p) {
      var st = atributState[p];
      return !st || !st.atribut.length || !st.ketepatan.length;
    });
    return missing.length ? 'Atribut & Ketepatan wajib diisi untuk: ' + missing.map(paramText).join(', ') + '.' : '';
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
    formLocked = locked;
    rowSelects.forEach(function (t) { locked ? t.disable() : t.enable(); });
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
    var params = ts ? ts.getValue() : [];
    var atributMap = {};
    params.forEach(function (p) { if (atributState[p]) atributMap[p] = atributState[p]; });
    var flat = function (key) {
      var seen = {};
      params.forEach(function (p) { (atributMap[p] ? atributMap[p][key] : []).forEach(function (v) { seen[v] = true; }); });
      return Object.keys(seen).join(', ');
    };
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
      lab: val('laboratorium'),
      jenisSampel: val('jenisSampel'),
      kemasan: val('jenisKemasan'),
      params: params,
      atributMap: JSON.parse(JSON.stringify(atributMap)),
      atribut: flat('atribut'),
      ketepatan: flat('ketepatan'),
      param: params.map(paramText).join(', '),
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
        var atributError = atributIncomplete();
        if (atributError) { showToast(atributError); return; }
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
