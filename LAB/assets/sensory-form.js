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

/* Jenis pengujian shown in the Sensory list, per parameter */
var SENSORY_JENIS_BY_PARAM = {
  'internal-rating': 'Uji Sensori Internal - Afektif Rating',
  'ranking': 'Uji Sensori Internal - Afektif Ranking',
  'triangle': 'Uji Triangle',
  'quality-monitoring': 'Quality Monitoring'
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
  /* Next free number of this month (never reuses an existing No. ID) */
  var prefix = 'SN-' + ym + '-';
  var max = 0;
  getSensoryRequests().forEach(function (r) { if (r.id.indexOf(prefix) === 0) max = Math.max(max, parseInt(r.id.slice(prefix.length), 10) || 0); });
  return prefix + String(max + 1).padStart(4, '0');
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
    [['tujuanAnalisa', 'tujuan'], ['alamatPelanggan', 'alamatPelanggan'], ['alamatPabrik', 'alamatPabrik'], ['suhuPenyajian', 'suhuPenyajian'],
      ['jenisKemasan', 'kemasan'], ['laboratorium', 'lab']].forEach(function (m) {
      if (existingRecord[m[1]]) window.jQuery('#' + m[0]).val(existingRecord[m[1]]).trigger('change');
    });

    var idMap = { namaSampel: 'sampel', kodeBatch: 'batch', catatanTambahan: 'catatanTambahan', alasanUrgent: 'alasanUrgent', kondisiPenyajian: 'kondisiPenyajian' };
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

  /* ---------- Parameter Uji (SpkSelect2, one per request) ---------- */
  var paramEl = document.getElementById('parameterUji');
  fillSelectSn(paramEl, MASTER_PARAMETER_SN);
  initSelect2Sn('parameterUji');
  if (existingRecord && existingRecord.params && existingRecord.params.length) {
    paramEl.value = existingRecord.params[0];
  }

  function paramText(v) {
    var f = MASTER_PARAMETER_SN.filter(function (p) { return p.value === v; })[0];
    return f ? f.text : v;
  }

  /* ---------- Atribut & Ketepatan per jenis sampel ----------
     One row per jenis sampel. Atribut options come from the Parameter Uji, Ketepatan options
     from the chosen atribut; both can hold many values (TomSelect multi). */
  var atributState = {};   // { jenisSampel: { atribut: [], ketepatan: [] } }
  var rowSelects = [];     // TomSelect instances of the current rows
  var formLocked = false;
  var atributWrap = document.getElementById('atributTableWrap');
  var atributBody = document.getElementById('atributTableBody');

  if (existingRecord && existingRecord.atributBySampel) {
    Object.keys(existingRecord.atributBySampel).forEach(function (k) {
      var m = existingRecord.atributBySampel[k];
      atributState[k] = { atribut: (m.atribut || []).slice(), ketepatan: (m.ketepatan || []).slice() };
    });
  }

  function escSn(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function ketepatanOptions(atributList) {
    var out = [];
    atributList.forEach(function (a) {
      (MASTER_KETEPATAN_BY_ATRIBUT[a] || []).forEach(function (k) { out.push({ value: k, text: k, group: a }); });
    });
    return out;
  }

  function renderAtributTable() {
    var samples = jenisSampelTs ? jenisSampelTs.getValue() : [];
    var param = paramEl.value;
    var atributOpts = MASTER_ATRIBUT_BY_PARAM[param] || [];
    rowSelects.forEach(function (t) { t.destroy(); });
    rowSelects = [];
    atributWrap.style.display = samples.length ? '' : 'none';
    atributBody.innerHTML = samples.map(function (s, i) {
      return '<tr data-row="' + i + '">' +
        '<td class="fw-semibold">' + escSn(s) + '</td>' +
        '<td><select multiple data-role="atribut" placeholder="' + (param ? 'Pilih atribut...' : 'Pilih Parameter Uji dulu') + '"></select></td>' +
        '<td><select multiple data-role="ketepatan" placeholder="Pilih ketepatan..."></select></td>' +
        '</tr>';
    }).join('');

    samples.forEach(function (s, i) {
      var st = atributState[s] = atributState[s] || { atribut: [], ketepatan: [] };
      /* Atribut not offered by the current parameter are dropped (and their ketepatan) */
      st.atribut = st.atribut.filter(function (a) { return atributOpts.indexOf(a) !== -1; });
      var allowedKet = ketepatanOptions(st.atribut).map(function (o) { return o.value; });
      st.ketepatan = st.ketepatan.filter(function (k) { return allowedKet.indexOf(k) !== -1; });

      var row = atributBody.querySelector('tr[data-row="' + i + '"]');
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
        options: atributOpts.map(function (a) { return { value: a, text: a }; }),
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
      if (formLocked || !param) { atrTs.disable(); ketTs.disable(); }
    });
  }

  /* ---------- Jenis Sampel (TomSelect multi, free text) ---------- */
  var jenisSampelTs = null;
  var jenisSampelEl = document.getElementById('jenisSampel');
  if (jenisSampelEl && window.TomSelect) {
    var existingJenis = existingRecord && existingRecord.jenisSampel;
    existingJenis = Array.isArray(existingJenis) ? existingJenis : (existingJenis ? [existingJenis] : []);
    jenisSampelTs = new window.TomSelect(jenisSampelEl, {
      plugins: ['remove_button'],
      create: true,
      createOnBlur: true,
      persist: false,
      delimiter: ',',
      options: existingJenis.map(function (v) { return { value: v, text: v }; }),
      items: existingJenis,
      render: { no_results: null, option_create: function (data, escape) { return '<div class="create">Tambah <strong>' + escape(data.input) + '</strong></div>'; } },
      onChange: renderAtributTable
    });
  }
  paramEl.addEventListener('change', renderAtributTable);
  renderAtributTable();

  /* Parameter, at least one jenis sampel, and atribut + ketepatan for each jenis sampel */
  function paramIncomplete() {
    if (!paramEl.value) return 'Pilih Parameter Uji.';
    var samples = jenisSampelTs ? jenisSampelTs.getValue() : [];
    if (!samples.length) return 'Isi minimal satu Jenis Sampel.';
    var missing = samples.filter(function (s) {
      var st = atributState[s];
      return !st || !st.atribut.length || !st.ketepatan.length;
    });
    return missing.length ? 'Atribut & Ketepatan wajib diisi untuk: ' + missing.join(', ') + '.' : '';
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

  function setFormLocked(locked) {
    document.querySelectorAll('#sensoryForm input, #sensoryForm select, #sensoryForm textarea').forEach(function (el) { el.disabled = locked; });
    if (window.jQuery) {
      window.jQuery('#sensoryForm select').each(function () {
        if (window.jQuery(this).data('select2')) window.jQuery(this).prop('disabled', locked).trigger('change.select2');
      });
    }
    if (jenisSampelTs) { locked ? jenisSampelTs.disable() : jenisSampelTs.enable(); }
    formLocked = locked;
    rowSelects.forEach(function (t) { locked || !paramEl.value ? t.disable() : t.enable(); });
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
    var samples = jenisSampelTs ? jenisSampelTs.getValue() : [];
    /* Atribut & Ketepatan per jenis sampel; the panel tests use their union per parameter */
    var atributBySampel = {}, unionAtr = {}, unionKet = {};
    samples.forEach(function (s) {
      var st = atributState[s] || { atribut: [], ketepatan: [] };
      atributBySampel[s] = { atribut: st.atribut.slice(), ketepatan: st.ketepatan.slice() };
      st.atribut.forEach(function (a) { unionAtr[a] = true; });
      st.ketepatan.forEach(function (k) { unionKet[k] = true; });
    });
    var atributMap = {};
    if (param) atributMap[param] = { atribut: Object.keys(unionAtr), ketepatan: Object.keys(unionKet) };
    return {
      id: docNoEl ? docNoEl.textContent : generateSensoryDocNo(),
      tanggal: docDateEl ? docDateEl.textContent : formatDateIDSn(new Date()),
      tipe: val('tipePengajuan'),
      alasanUrgent: val('alasanUrgent'),
      tujuan: val('tujuanAnalisa'),
      alamatPelanggan: val('alamatPelanggan'),
      alamatPabrik: val('alamatPabrik'),
      suhuPenyajian: val('suhuPenyajian'),
      kondisiPenyajian: val('kondisiPenyajian'),
      pemohon: findRole(localStorage.getItem('holabsysRole')).name,
      departemen: val('departemenPemohon'),
      jenis: SENSORY_JENIS_BY_PARAM[param] || 'Uji Sensori Internal - Afektif Rating',
      sampel: val('namaSampel'),
      kategoriPangan: val('kategoriPangan'),
      batch: val('kodeBatch'),
      prod: val('tanggalProduksi'),
      catatanTambahan: val('catatanTambahan'),
      blindCodes: (existingRecord && existingRecord.blindCodes) || [],
      suhuWadah: (val('suhuPenyajian') || '-') + ' · ' + (val('kondisiPenyajian') || '-'),
      lab: val('laboratorium'),
      jenisSampel: samples,
      atributBySampel: atributBySampel,
      atributMap: atributMap,
      atribut: Object.keys(unionAtr).join(', '),
      ketepatan: Object.keys(unionKet).join(', '),
      kemasan: val('jenisKemasan'),
      params: params,
      param: param ? paramText(param) : ''
    };
  }

  /* ---------- Approval flow: shared with ASLT (request-approval.js) ---------- */
  /* Last approval: one 3-digit blind code per jenis sampel (triangle: 3 cups) */
  function newBlindCodes(n) {
    var out = [];
    while (out.length < n) {
      var c = String(Math.floor(100 + Math.random() * 900));
      if (out.indexOf(c) === -1) out.push(c);
    }
    return out;
  }
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
    toast: showToast,
    onApproved: function (rec) {
      var n = Math.max((rec.jenisSampel || []).length, 2);
      if ((rec.params || [])[0] === 'triangle') n = 3;
      var codes = rec.blindCodes && rec.blindCodes.length ? rec.blindCodes : newBlindCodes(n);
      return { blindCodes: codes, panel: { codes: codes, oddCode: (rec.params || [])[0] === 'triangle' ? codes[1] : null } };
    }
  });
});
