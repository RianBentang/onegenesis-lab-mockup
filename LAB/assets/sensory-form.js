/* ---------- Master data (dummy) ---------- */
var MASTER_DEPT_SN = ['Quality Assurance', 'Laboratory', 'Research & Development', 'Regulatory Affairs', 'Process Development', 'Marketing'];
var MASTER_TUJUAN_SN = ['Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'MD Registration (BPOM)', 'P5 Testing'];
var MASTER_LAB_SN = ['Physicochemical', 'Microbiology', 'Sensory', 'ASLT'];

var MASTER_PARAMETER_SN = [
  { value: 'internal-rating', text: 'Internal Rating' },
  { value: 'ranking', text: 'Ranking' },
  { value: 'triangle', text: 'Triangle (Discrimination)' },
  { value: 'quality-monitoring', text: 'Quality Monitoring' }
];

/* Atribut that each parameter can test (Master Scope Lab); Triangle has none, it only picks the odd cup */
var MASTER_ATRIBUT_BY_PARAM = {
  'internal-rating': ['Taste', 'Aroma', 'Texture', 'Color & Appearance', 'Aftertaste', 'Overall'],
  'ranking': ['Taste', 'Aroma', 'Texture', 'Overall'],
  'quality-monitoring': ['Taste', 'Aroma', 'Texture', 'Color & Appearance', 'Aftertaste']
};

/* Atribut, Ketepatan (suggestions; free text allowed), Kategori Pangan, Jenis Kemasan and Suhu
   Penyajian come from FlexTab (dummy-flextab.js) */

/* Jenis pengujian shown in the Sensory list, per parameter */
var SENSORY_JENIS_BY_PARAM = {
  'internal-rating': 'Internal Sensory Test - Affective Rating',
  'ranking': 'Internal Sensory Test - Affective Ranking',
  'triangle': 'Triangle Test',
  'quality-monitoring': 'Quality Monitoring'
};

function toOptionsSn(list) { return list.map(function (v) { return { value: v, text: v }; }); }

function fillSelectSn(selectEl, options, placeholder) {
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

function initSelect2Sn(id, placeholder) {
  var el = document.getElementById(id);
  if (el && window.spkSelect2) window.spkSelect2(el, placeholder ? { placeholder: placeholder } : {});
}

function generateSensoryDocNo() {
  return nextFreeNo('SN-' + currentYm() + '-', getSensoryRequests().map(function (r) { return r.id; }), 4);
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
  /* No. Reference (?ref=): the form pre-fills from that request's template (request-reference.js);
     the document itself (number, date, status) stays this one */
  var refRecord = urlParams.get('ref') ? getSensoryRequestById(urlParams.get('ref')) : null;
  var prefill = refRecord ? requestTemplate(refRecord) : existingRecord;

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
  fillSelectSn(document.getElementById('alamatPelanggan'), siteOptions());
  fillSelectSn(document.getElementById('alamatPabrik'), siteOptions());
  fillSelectSn(document.getElementById('departemenPemohon'), toOptionsSn(MASTER_DEPT_SN));
  fillSelectSn(document.getElementById('tujuanAnalisa'), toOptionsSn(MASTER_TUJUAN_SN));
  fillSelectSn(document.getElementById('kategoriPangan'), toOptionsSn(flexTabOptions('LAB_KATEGORI_PANGAN')));
  fillSelectSn(document.getElementById('jenisKemasan'), toOptionsSn(flexTabOptions('LAB_JENIS_KEMASAN')));
  fillSelectSn(document.getElementById('suhuPenyajian'), toOptionsSn(flexTabOptions('SN_SUHU_PENYAJIAN')));
  fillSelectSn(document.getElementById('laboratorium'), toOptionsSn(MASTER_LAB_SN));
  document.getElementById('laboratorium').value = (prefill && prefill.lab) || 'Sensory';

  ['alamatPelanggan', 'alamatPabrik', 'departemenPemohon', 'tujuanAnalisa', 'kategoriPangan', 'idGenesis',
    'tipePengajuan', 'jenisKemasan', 'suhuPenyajian', 'laboratorium'
  ].forEach(function (id) { initSelect2Sn(id); });

  var roleCode = currentRole().code;
  var role = (typeof findRole === 'function') ? findRole(roleCode) : null;
  if (role && window.jQuery) {
    window.jQuery('#departemenPemohon').val(existingRecord ? existingRecord.departemen : role.dept).trigger('change');
  }

  if (prefill && window.jQuery) {
    window.jQuery('#tipePengajuan').val(prefill.tipe).trigger('change');
    window.jQuery('#kategoriPangan').val(prefill.kategoriPangan).trigger('change');
    [['tujuanAnalisa', 'tujuan'], ['alamatPelanggan', 'alamatPelanggan'], ['alamatPabrik', 'alamatPabrik'], ['suhuPenyajian', 'suhuPenyajian'],
      ['jenisKemasan', 'kemasan'], ['laboratorium', 'lab']].forEach(function (m) {
      if (prefill[m[1]]) window.jQuery('#' + m[0]).val(prefill[m[1]]).trigger('change');
    });

    var idMap = { namaSampel: 'sampel', kodeBatch: 'batch', catatanTambahan: 'catatanTambahan', alasanUrgent: 'alasanUrgent', kondisiPenyajian: 'kondisiPenyajian' };
    Object.keys(idMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = prefill[idMap[id]] || '';
    });
  }

  var tanggalProduksiFp = null;
  if (window.flatpickr) {
    tanggalProduksiFp = window.flatpickr('#tanggalProduksi', { dateFormat: 'd-m-Y', maxDate: 'today', altInput: false });
    if (prefill && prefill.prod) tanggalProduksiFp.setDate(prefill.prod, true, 'd-m-Y');
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

  /* ---------- Parameter Uji (SpkSelect2, one per request) ---------- */
  var paramEl = document.getElementById('parameterUji');
  fillSelectSn(paramEl, MASTER_PARAMETER_SN);
  initSelect2Sn('parameterUji');
  if (prefill && prefill.params && prefill.params.length) {
    paramEl.value = prefill.params[0];
  }

  function paramText(v) {
    var f = MASTER_PARAMETER_SN.filter(function (p) { return p.value === v; })[0];
    return f ? f.text : v;
  }

  /* ---------- Jenis Sampel, Atribut & Ketepatan ----------
     Jenis Sampel: free-text rows (add more), each with Tgl Pembuatan + Exp. Date.
     Atribut and Ketepatan: one list per request — every sample (blind cup) is scored on the same
     questions. SpkSelect2 rows, add more downwards. Atribut options = what the Parameter Uji can
     test (and FlexTab SN_ATRIBUT has); Ketepatan = FlexTab SN_KETEPATAN or free text (tags).
     Triangle only picks the odd cup (no atribut / ketepatan); Ranking has no ketepatan. */
  var formLocked = false;
  var sampelBody = document.getElementById('sampelBody');
  var atributList = document.getElementById('atributList');
  var ketepatanList = document.getElementById('ketepatanList');
  var existingMap = prefill && prefill.atributMap && prefill.params
    ? prefill.atributMap[prefill.params[0]] || {} : {};

  function escSn(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function paramUses(param) {
    return { atribut: !!param && param !== 'triangle', ketepatan: param === 'internal-rating' || param === 'quality-monitoring' };
  }
  function atributOptions() {
    var allowed = flexTabOptions('SN_ATRIBUT');
    return (MASTER_ATRIBUT_BY_PARAM[paramEl.value] || []).filter(function (a) { return allowed.indexOf(a) !== -1; });
  }

  /* Jenis Sampel rows */
  function addSampelRow(s) {
    s = s || {};
    var tr = document.createElement('tr');
    tr.className = 'sampel-row';
    tr.innerHTML =
      '<td class="fw-medium sampel-no"></td>' +
      '<td><input type="text" class="form-control form-control-sm" data-f="jenis" placeholder="Sample name / variant" value="' + escSn(s.jenis || '') + '" /></td>' +
      '<td><input type="text" class="form-control form-control-sm" data-f="tglPembuatan" placeholder="dd-mm-yyyy" /></td>' +
      '<td><input type="text" class="form-control form-control-sm" data-f="expDate" placeholder="dd-mm-yyyy" /></td>' +
      '<td><button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" data-remove-sampel title="Delete sample"><i class="ri-delete-bin-line"></i></button></td>';
    sampelBody.appendChild(tr);
    var prodEl = tr.querySelector('[data-f="tglPembuatan"]'), expEl = tr.querySelector('[data-f="expDate"]');
    if (window.flatpickr) {
      var prod = window.flatpickr(prodEl, { dateFormat: 'd-m-Y', maxDate: 'today' });
      var exp = window.flatpickr(expEl, { dateFormat: 'd-m-Y' });
      if (s.tglPembuatan) prod.setDate(s.tglPembuatan, false, 'd-m-Y');
      if (s.expDate) exp.setDate(s.expDate, false, 'd-m-Y');
    } else {
      prodEl.value = s.tglPembuatan || '';
      expEl.value = s.expDate || '';
    }
    if (formLocked) tr.querySelectorAll('input').forEach(function (el) { el.disabled = true; });
    renumberSampel();
  }
  function renumberSampel() {
    var rows = sampelBody.querySelectorAll('tr.sampel-row');
    rows.forEach(function (tr, i) {
      tr.querySelector('.sampel-no').textContent = i + 1;
      tr.querySelector('[data-remove-sampel]').disabled = formLocked || rows.length === 1;
    });
  }
  function sampelValues() {
    return Array.prototype.map.call(sampelBody.querySelectorAll('tr.sampel-row'), function (tr) {
      var get = function (f) { return tr.querySelector('[data-f="' + f + '"]').value.trim(); };
      return { jenis: get('jenis'), tglPembuatan: get('tglPembuatan'), expDate: get('expDate') };
    });
  }
  sampelBody.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-sampel]');
    if (!btn) return;
    btn.closest('tr').remove();
    renumberSampel();
  });
  document.getElementById('btnAddSampel').addEventListener('click', function () { addSampelRow(); });

  /* Atribut / Ketepatan rows: one SpkSelect2 each + delete */
  function addPickRow(list, options, value, tags) {
    var row = document.createElement('div');
    row.className = 'd-flex align-items-center gap-2 pick-row';
    var opts = options.slice();
    if (value && opts.indexOf(value) === -1) opts.push(value);
    row.innerHTML =
      '<div class="flex-grow-1"><select class="form-select"><option value="">-- Select --</option>' +
        opts.map(function (o) { return '<option value="' + escSn(o) + '"' + (o === value ? ' selected' : '') + '>' + escSn(o) + '</option>'; }).join('') +
      '</select></div>' +
      '<button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave flex-shrink-0" data-remove-pick title="Delete"><i class="ri-delete-bin-line"></i></button>';
    list.appendChild(row);
    if (window.spkSelect2) window.spkSelect2(row.querySelector('select'), tags ? { tags: true } : {});
    if (formLocked) setPickLocked(row, true);
  }
  function pickValues(list) {
    var out = [];
    list.querySelectorAll('select').forEach(function (s) { var v = s.value.trim(); if (v && out.indexOf(v) === -1) out.push(v); });
    return out;
  }
  function pickDuplicates(list) {
    var seen = {}, dup = [];
    list.querySelectorAll('select').forEach(function (s) {
      var v = s.value.trim();
      if (!v) return;
      if (seen[v] && dup.indexOf(v) === -1) dup.push(v);
      seen[v] = true;
    });
    return dup;
  }
  function setPickLocked(row, locked) {
    if (window.jQuery) window.jQuery(row.querySelector('select')).prop('disabled', locked).trigger('change.select2');
    row.querySelector('[data-remove-pick]').disabled = locked;
  }
  [atributList, ketepatanList].forEach(function (list) {
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-remove-pick]');
      if (btn) btn.closest('.pick-row').remove();
    });
  });
  document.getElementById('btnAddAtribut').addEventListener('click', function () { addPickRow(atributList, atributOptions(), '', false); });
  document.getElementById('btnAddKetepatan').addEventListener('click', function () { addPickRow(ketepatanList, flexTabOptions('SN_KETEPATAN'), '', true); });

  /* Parameter change: show the lists it uses, re-offer the atribut it allows (keep valid picks) */
  function applyParam() {
    var use = paramUses(paramEl.value);
    document.getElementById('wrapAtribut').style.display = use.atribut ? '' : 'none';
    document.getElementById('wrapKetepatan').style.display = use.ketepatan ? '' : 'none';
    document.getElementById('jenisSampelHint').textContent = paramEl.value === 'triangle'
      ? 'Triangle: enter 2 samples. Panelists get 3 cups (2 identical, 1 different) and only see the blind codes.'
      : 'One row per sample. Panelists only see the blind code, not the sample name.';
    var keep = pickValues(atributList).filter(function (a) { return atributOptions().indexOf(a) !== -1; });
    atributList.innerHTML = '';
    (keep.length ? keep : ['']).forEach(function (a) { addPickRow(atributList, atributOptions(), a, false); });
  }

  /* Initial rows */
  var existingSampel = prefill && prefill.sampelDetail
    ? prefill.sampelDetail
    : ((prefill && prefill.jenisSampel) || []).map(function (j) { return { jenis: j }; });
  (existingSampel.length ? existingSampel : [{}]).forEach(function (s) { addSampelRow(s); });
  ((existingMap.atribut && existingMap.atribut.length) ? existingMap.atribut : ['']).forEach(function (a) { addPickRow(atributList, atributOptions(), a, false); });
  ((existingMap.ketepatan && existingMap.ketepatan.length) ? existingMap.ketepatan : ['']).forEach(function (k) { addPickRow(ketepatanList, flexTabOptions('SN_KETEPATAN'), k, true); });
  paramEl.addEventListener('change', applyParam);
  applyParam();

  /* Parameter, complete jenis sampel rows, at least one atribut; no duplicates */
  function paramIncomplete() {
    var param = paramEl.value;
    if (!param) return 'Select a Test Parameter.';
    var samples = sampelValues();
    if (samples.some(function (s) { return !s.jenis; })) return 'Sample Type name is required on every row.';
    if (samples.some(function (s) { return !s.tglPembuatan || !s.expDate; })) return 'Manufacturing Date & Exp. Date are required for every sample.';
    var names = samples.map(function (s) { return s.jenis.toLowerCase(); });
    if (names.some(function (n, i) { return names.indexOf(n) !== i; })) return 'Sample Types must be different.';
    if (param === 'triangle' && samples.length !== 2) return 'The Triangle test needs exactly 2 sample types.';
    if (param === 'ranking' && samples.length < 2) return 'The Ranking test needs at least 2 sample types.';
    var use = paramUses(param);
    if (use.atribut && !pickValues(atributList).length) return 'Enter at least one Attribute.';
    if (use.atribut && pickDuplicates(atributList).length) return 'Duplicate attributes: ' + pickDuplicates(atributList).join(', ') + '.';
    if (use.ketepatan && pickDuplicates(ketepatanList).length) return 'Duplicate JAR attributes: ' + pickDuplicates(ketepatanList).join(', ') + '.';
    return '';
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
    document.querySelectorAll('#sensoryForm input, #sensoryForm select, #sensoryForm textarea').forEach(function (el) { el.disabled = locked; });
    if (window.jQuery) {
      window.jQuery('#sensoryForm select').each(function () {
        if (window.jQuery(this).data('select2')) window.jQuery(this).prop('disabled', locked).trigger('change.select2');
      });
    }
    formLocked = locked;
    ['btnAddSampel', 'btnAddAtribut', 'btnAddKetepatan'].forEach(function (id) { document.getElementById(id).disabled = locked; });
    document.querySelectorAll('[data-remove-pick]').forEach(function (b) { b.disabled = locked; });
    renumberSampel();
    if (tanggalProduksiFp) {
      tanggalProduksiFp.set('clickOpens', !locked);
      document.getElementById('tanggalProduksi').disabled = locked;
    }
    var dz = document.getElementById('fileDropzone');
    if (dz) dz.classList.toggle('disabled', locked);
  }

  function collectFormValues() {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var param = val('parameterUji');
    var params = param ? [param] : [];
    var samples = sampelValues().filter(function (s) { return s.jenis; });
    /* One atribut / ketepatan list per request, only what the parameter uses (the panel booth asks these) */
    var use = paramUses(param);
    var atribut = use.atribut ? pickValues(atributList) : [];
    var ketepatan = use.ketepatan ? pickValues(ketepatanList) : [];
    var atributMap = {};
    if (param) atributMap[param] = { atribut: atribut, ketepatan: ketepatan };
    return {
      refNo: document.getElementById('noReference').value || null,
      id: docNoEl ? docNoEl.textContent : generateSensoryDocNo(),
      tanggal: docDateEl ? docDateEl.textContent : formatDateIDSn(new Date()),
      tipe: val('tipePengajuan'),
      alasanUrgent: val('alasanUrgent'),
      tujuan: val('tujuanAnalisa'),
      alamatPelanggan: val('alamatPelanggan'),
      alamatPabrik: val('alamatPabrik'),
      suhuPenyajian: val('suhuPenyajian'),
      kondisiPenyajian: val('kondisiPenyajian'),
      pemohon: currentRole().name,
      departemen: val('departemenPemohon'),
      jenis: SENSORY_JENIS_BY_PARAM[param] || 'Internal Sensory Test - Affective Rating',
      sampel: val('namaSampel'),
      kategoriPangan: val('kategoriPangan'),
      batch: val('kodeBatch'),
      prod: val('tanggalProduksi'),
      catatanTambahan: val('catatanTambahan'),
      blindCodes: (existingRecord && existingRecord.blindCodes) || [],
      suhuWadah: (val('suhuPenyajian') || '-') + ' · ' + (val('kondisiPenyajian') || '-'),
      lab: val('laboratorium'),
      jenisSampel: samples.map(function (s) { return s.jenis; }),
      sampelDetail: samples,
      atributMap: atributMap,
      atribut: atribut.join(', '),
      ketepatan: ketepatan.join(', '),
      kemasan: val('jenisKemasan'),
      params: params,
      param: param ? paramText(param) : ''
    };
  }

  /* ---------- Approval flow: shared with ASLT (request-approval.js) ---------- */
  setupRequestApproval({
    label: 'Sensory',
    formId: 'sensoryForm',
    listUrl: 'asltAndSensory.html',
    docNo: function () { return docNoEl ? docNoEl.textContent : ''; },
    getRecord: getSensoryRequestById,
    update: updateSensoryRequest,
    collect: collectFormValues,
    validate: paramIncomplete,
    setLocked: setFormLocked,
    /* Last approval: blind codes unique over all panel requests (panelNewBlindCodes): one per
       jenis sampel, triangle 3 cup positions whose content rotates per panelist */
    onApproved: function (rec) {
      var n = sensoryIsTriangle(rec) ? 3 : Math.max((rec.jenisSampel || []).length, 2);
      var codes = rec.blindCodes && rec.blindCodes.length ? rec.blindCodes : panelNewBlindCodes(n, rec.id);
      return { blindCodes: codes, panel: { codes: codes } };
    }
  });

  RequestReference.setup({ title: 'Sensory', rows: getSensoryRequests, current: function () { return getSensoryRequestById(docNo); }, docId: function () { return docNo; } });
});
