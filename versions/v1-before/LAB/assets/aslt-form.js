/* ---------- Master data (dummy) ---------- */
var MASTER_DEPT_ASLT = ['Quality Assurance', 'Laboratory', 'Research & Development', 'Regulatory Affairs', 'Process Development', 'Marketing'];
var MASTER_TUJUAN_ASLT = ['Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'MD Registration (BPOM)', 'P5 Testing'];
var MASTER_LAB_ASLT = ['Physicochemical', 'Microbiology', 'Sensory', 'ASLT'];
/* Kategori Pangan, Standar Organoleptik, Kategori ASLT / Perubahan / Sampel, kemasan fields and
   Uji Kebocoran come from FlexTab (dummy-flextab.js) */

var MASTER_PARAMETER_ASLT = [
  { value: 'arrhenius', text: 'Arrhenius' },
  { value: 'labuza', text: 'Labuza (Critical AW)' },
  { value: 'retain', text: 'Retain' }
];

function toOptionsAslt(list) { return list.map(function (v) { return { value: v, text: v }; }); }

function fillSelectAslt(selectEl, options, placeholder) {
  if (!selectEl) return;
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

function initSelect2Aslt(id, placeholder) {
  var el = document.getElementById(id);
  if (el && window.spkSelect2) window.spkSelect2(el, placeholder ? { placeholder: placeholder } : {});
}

function generateAsltDocNo() {
  return nextFreeNo('ASLT-' + currentYm() + '-', getAsltRequests().map(function (r) { return r.id; }), 3);
}

function formatDateIDAslt(date) {
  var d = String(date.getDate()).padStart(2, '0');
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var y = date.getFullYear();
  return d + '-' + m + '-' + y;
}

document.addEventListener('DOMContentLoaded', function () {
  var urlParams = new URLSearchParams(window.location.search);
  var existingId = urlParams.get('docId');
  var existingRecord = (existingId && typeof getAsltRequestById === 'function') ? getAsltRequestById(existingId) : null;

  var docNoEl = document.getElementById('docNoValue');
  var docDateEl = document.getElementById('docDateValue');
  var docNo = existingRecord ? existingRecord.id : generateAsltDocNo();
  if (docNoEl) docNoEl.textContent = docNo;
  ['docNoValueApproval', 'docNoValueHistory'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = docNo;
  });
  if (docDateEl) docDateEl.textContent = existingRecord ? existingRecord.tanggal : formatDateIDAslt(new Date());

  /* Master dropdowns */
  fillSelectAslt(document.getElementById('alamatPelanggan'), siteOptions());
  fillSelectAslt(document.getElementById('alamatPabrik'), siteOptions());
  fillSelectAslt(document.getElementById('departemenPemohon'), toOptionsAslt(MASTER_DEPT_ASLT));
  fillSelectAslt(document.getElementById('tujuanAnalisa'), toOptionsAslt(MASTER_TUJUAN_ASLT));
  fillSelectAslt(document.getElementById('kategoriPangan'), toOptionsAslt(flexTabOptions('LAB_KATEGORI_PANGAN')));
  fillSelectAslt(document.getElementById('standarOrganoleptik'), toOptionsAslt(flexTabOptions('ASLT_STANDAR_ORGANOLEPTIK')));
  fillSelectAslt(document.getElementById('kategoriAslt'), toOptionsAslt(flexTabOptions('ASLT_KATEGORI')));
  fillSelectAslt(document.getElementById('kategoriPerubahan'), toOptionsAslt(flexTabOptions('ASLT_KATEGORI_PERUBAHAN')));
  fillSelectAslt(document.getElementById('kategoriSampelAslt'), toOptionsAslt(flexTabOptions('ASLT_KATEGORI_SAMPEL')));
  fillSelectAslt(document.getElementById('jenisKemasan'), toOptionsAslt(flexTabOptions('LAB_JENIS_KEMASAN')));
  fillSelectAslt(document.getElementById('jenisPlastik'), toOptionsAslt(flexTabOptions('ASLT_JENIS_PLASTIK')));
  fillSelectAslt(document.getElementById('kategoriKemasan'), toOptionsAslt(flexTabOptions('ASLT_KATEGORI_KEMASAN')));
  fillSelectAslt(document.getElementById('jumlahLayer'), toOptionsAslt(flexTabOptions('ASLT_JUMLAH_LAYER')));
  fillSelectAslt(document.getElementById('metodePengemasan'), toOptionsAslt(flexTabOptions('ASLT_METODE_PENGEMASAN')));
  fillSelectAslt(document.getElementById('ujiSealing'), toOptionsAslt(flexTabOptions('ASLT_UJI_KEBOCORAN')));
  fillSelectAslt(document.getElementById('ujiVacuum'), toOptionsAslt(flexTabOptions('ASLT_UJI_KEBOCORAN')));
  fillSelectAslt(document.getElementById('laboratorium'), toOptionsAslt(MASTER_LAB_ASLT));
  document.getElementById('laboratorium').value = (existingRecord && existingRecord.lab) || 'ASLT';

  ['alamatPelanggan', 'alamatPabrik', 'departemenPemohon', 'tujuanAnalisa', 'kategoriPangan', 'idGenesis',
    'tipePengajuan', 'standarOrganoleptik', 'kategoriAslt', 'kategoriPerubahan', 'kategoriSampelAslt',
    'jenisKemasan', 'jenisPlastik', 'kategoriKemasan', 'jumlahLayer', 'metodePengemasan', 'ujiSealing', 'ujiVacuum', 'laboratorium'
  ].forEach(function (id) { initSelect2Aslt(id); });

  /* Departemen Pemohon auto-fills from the logged-in dummy role's department */
  var roleCode = currentRole().code;
  var role = (typeof findRole === 'function') ? findRole(roleCode) : null;
  if (role && window.jQuery) {
    window.jQuery('#departemenPemohon').val(existingRecord ? existingRecord.departemen : role.dept).trigger('change');
  }

  /* Prefill from an existing record (opened via ?docId=) */
  if (existingRecord && window.jQuery) {
    window.jQuery('#tipePengajuan').val(existingRecord.tipe).trigger('change');
    window.jQuery('#kategoriPangan').val(existingRecord.kategoriPangan).trigger('change');
    window.jQuery('#kategoriAslt').val(existingRecord.kategori).trigger('change');
    window.jQuery('#jenisKemasan').val(existingRecord.jenisKemasan).trigger('change');
    [['tujuanAnalisa', 'tujuan'], ['alamatPelanggan', 'alamatPelanggan'], ['alamatPabrik', 'alamatPabrik']].forEach(function (m) {
      if (existingRecord[m[1]]) window.jQuery('#' + m[0]).val(existingRecord[m[1]]).trigger('change');
    });

    var idMap = { namaSampel: 'sampel', kodeBatch: 'batch', catatanTambahan: 'catatanTambahan', alasanUrgent: 'alasanUrgent' };
    Object.keys(idMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = existingRecord[idMap[id]] || '';
    });
  }

  /* Tanggal Produksi — Flatpickr */
  var tanggalProduksiFp = null;
  if (window.flatpickr) {
    tanggalProduksiFp = window.flatpickr('#tanggalProduksi', { dateFormat: 'd-m-Y', maxDate: 'today', altInput: false });
    if (existingRecord && existingRecord.prod) tanggalProduksiFp.setDate(existingRecord.prod, true, 'd-m-Y');
  }

  /* Tipe Pengajuan → toggle Alasan Urgent (priority indicator only, no extra approval level) */
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

  /* Pilih Parameter — TomSelect multi-select */
  var paramEl = document.getElementById('parameterUji');
  var paramCountBadge = document.getElementById('paramCountBadge');
  var ts = null;
  if (paramEl && window.TomSelect) {
    ts = new window.TomSelect(paramEl, {
      plugins: ['remove_button'],
      persist: false,
      placeholder: 'Search & select test parameters...',
      options: MASTER_PARAMETER_ASLT.map(function (p) { return { value: p.value, text: p.text }; }),
      onChange: function (values) {
        var arr = Array.isArray(values) ? values : (values ? [values] : []);
        paramCountBadge.textContent = arr.length + ' Parameters Selected';
      }
    });
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
      dropzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('bg-primary-transparent'); });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('bg-primary-transparent'); });
    });
    dropzone.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
  }

  function setFormLocked(locked) {
    document.querySelectorAll('#asltForm input, #asltForm select, #asltForm textarea').forEach(function (el) { el.disabled = locked; });
    if (window.jQuery) {
      window.jQuery('#asltForm select').each(function () {
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

  function collectFormValues() {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    return {
      id: docNoEl ? docNoEl.textContent : generateAsltDocNo(),
      tanggal: docDateEl ? docDateEl.textContent : formatDateIDAslt(new Date()),
      tipe: val('tipePengajuan'),
      alasanUrgent: val('alasanUrgent'),
      tujuan: val('tujuanAnalisa'),
      alamatPelanggan: val('alamatPelanggan'),
      alamatPabrik: val('alamatPabrik'),
      pemohon: currentRole().name,
      departemen: val('departemenPemohon'),
      sampel: val('namaSampel'),
      kategori: val('kategoriAslt'),
      kategoriPangan: val('kategoriPangan'),
      jenisKemasan: val('jenisKemasan'),
      lab: val('laboratorium'),
      batch: val('kodeBatch'),
      prod: val('tanggalProduksi'),
      catatanTambahan: val('catatanTambahan'),
      suhuChamber: (existingRecord && existingRecord.suhuChamber) || '– (ditentukan lab)',
      kemasan: val('spesifikasiKemasan'),
      param: ts ? ts.getValue().map(function (v) { var f = MASTER_PARAMETER_ASLT.find(function (p) { return p.value === v; }); return f ? f.text : v; }).join(', ') : '',
      timepoint: (existingRecord && existingRecord.timepoint) || 'Not Started',
      rejection: val('perkiraanRejection'),
      status: (existingRecord && existingRecord.status) || 'Waiting for Approval'
    };
  }

  /* ---------- Approval flow: shared with Sensory (request-approval.js) ---------- */
  setupRequestApproval({
    label: 'ASLT',
    formId: 'asltForm',
    listUrl: 'asltAndSensory.html?tab=aslt',
    docNo: function () { return docNoEl ? docNoEl.textContent : ''; },
    getRecord: getAsltRequestById,
    update: updateAsltRequest,
    collect: collectFormValues,
    validate: function () {
      return files.length || (existingRecord && existingRecord.step && existingRecord.step !== 'Draft') ? '' : 'Document Attachments (ASLT Clause) must be uploaded.';
    },
    setLocked: setFormLocked,
    /* Last approval: 3 blind codes for the organoleptik panel, unique over all panel requests */
    onApproved: function (rec) {
      var codes = panelRequestCodes(rec).length ? panelRequestCodes(rec) : panelNewBlindCodes(3, rec.id);
      return { status: 'Cek Fiskim Initial', timepoint: 'H-0 (Initial)', blindCodes: codes, panel: Object.assign({}, rec.panel, { codes: codes }) };
    }
  });
});
