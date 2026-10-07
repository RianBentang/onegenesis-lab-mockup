/* ---------- Master data (dummy) ---------- */
var MASTER_SITE_ASLT = ['Head Office', 'Plant Sentul', 'Plant Pati', 'Plant Gresik', 'Plant Rancaekek', 'Plant Cimanggis'];
var MASTER_DEPT_ASLT = ['Quality Assurance', 'Laboratorium', 'Research & Development', 'Regulatory Affairs', 'Process Development', 'Marketing'];
var MASTER_TUJUAN_ASLT = ['Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'Pendaftaran MD (BPOM)', 'Pengujian P5'];
var MASTER_KATEGORI_PANGAN_ASLT = ['Makanan Ringan', 'Minuman Susu', 'Biskuit & Wafer', 'Cokelat & Kembang Gula', 'Kacang & Snack'];
var MASTER_ORGANOLEPTIK = ['Aroma (Skor 7)', 'Tekstur (Skor 7)', 'Rasa (Skor 7)', 'Aftertaste (Skor 6)', 'Penampakan (Skor 6)'];
var MASTER_KATEGORI_ASLT = ['NPL', 'Existing', 'Trial', 'Re-ASLT'];
var MASTER_KATEGORI_PERUBAHAN = ['Product Formulation', 'Process', 'Packaging'];
var MASTER_KATEGORI_SAMPEL_ASLT = ['Biscon', 'Dairy', 'Snack', 'Beverage', 'Seasoning', 'Cheese'];
var MASTER_KEMASAN_ASLT = ['Plastik', 'Cup', 'Kaleng', 'Pouch Alufo', 'Karton'];
var MASTER_JENIS_PLASTIK = ['Alufo', 'Metalized', 'Other'];
var MASTER_KATEGORI_KEMASAN = ['Primer', 'Sekunder', 'Primer dan Sekunder'];
var MASTER_JUMLAH_LAYER = ['1 Layer', '2 Layer', '3 Layer', '4 Layer', 'Others'];
var MASTER_METODE_PENGEMASAN = ['With Nitrogen', 'Vacuum', 'With Oxigen', 'Other'];
var MASTER_LAB_ASLT = ['Fisika Kimia', 'Mikrobiologi', 'Sensory', 'ASLT'];

var MASTER_PARAMETER_ASLT = [
  { value: 'arrhenius', text: 'Arrhenius' },
  { value: 'labuza', text: 'Labuza (AW Kritis)' },
  { value: 'retain', text: 'Retain' }
];

function toOptionsAslt(list) { return list.map(function (v) { return { value: v, text: v }; }); }

function fillSelectAslt(selectEl, options, placeholder) {
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

function initSelect2Aslt(id, placeholder) {
  var el = document.getElementById(id);
  if (el && window.spkSelect2) window.spkSelect2(el, placeholder ? { placeholder: placeholder } : {});
}

function generateAsltDocNo() {
  var now = new Date();
  var ym = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  /* Next free number of this month (never reuses an existing No. ID) */
  var prefix = 'ASLT-' + ym + '-';
  var max = 0;
  getAsltRequests().forEach(function (r) { if (r.id.indexOf(prefix) === 0) max = Math.max(max, parseInt(r.id.slice(prefix.length), 10) || 0); });
  return prefix + String(max + 1).padStart(3, '0');
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
  fillSelectAslt(document.getElementById('alamatPelanggan'), toOptionsAslt(MASTER_SITE_ASLT));
  fillSelectAslt(document.getElementById('alamatPabrik'), toOptionsAslt(MASTER_SITE_ASLT));
  fillSelectAslt(document.getElementById('departemenPemohon'), toOptionsAslt(MASTER_DEPT_ASLT));
  fillSelectAslt(document.getElementById('tujuanAnalisa'), toOptionsAslt(MASTER_TUJUAN_ASLT));
  fillSelectAslt(document.getElementById('kategoriPangan'), toOptionsAslt(MASTER_KATEGORI_PANGAN_ASLT));
  fillSelectAslt(document.getElementById('standarOrganoleptik'), toOptionsAslt(MASTER_ORGANOLEPTIK));
  fillSelectAslt(document.getElementById('kategoriAslt'), toOptionsAslt(MASTER_KATEGORI_ASLT));
  fillSelectAslt(document.getElementById('kategoriPerubahan'), toOptionsAslt(MASTER_KATEGORI_PERUBAHAN));
  fillSelectAslt(document.getElementById('kategoriSampelAslt'), toOptionsAslt(MASTER_KATEGORI_SAMPEL_ASLT));
  fillSelectAslt(document.getElementById('jenisKemasan'), toOptionsAslt(MASTER_KEMASAN_ASLT));
  fillSelectAslt(document.getElementById('jenisPlastik'), toOptionsAslt(MASTER_JENIS_PLASTIK));
  fillSelectAslt(document.getElementById('kategoriKemasan'), toOptionsAslt(MASTER_KATEGORI_KEMASAN));
  fillSelectAslt(document.getElementById('jumlahLayer'), toOptionsAslt(MASTER_JUMLAH_LAYER));
  fillSelectAslt(document.getElementById('metodePengemasan'), toOptionsAslt(MASTER_METODE_PENGEMASAN));
  fillSelectAslt(document.getElementById('laboratorium'), toOptionsAslt(MASTER_LAB_ASLT));
  document.getElementById('laboratorium').value = (existingRecord && existingRecord.lab) || 'ASLT';

  ['alamatPelanggan', 'alamatPabrik', 'departemenPemohon', 'tujuanAnalisa', 'kategoriPangan', 'idGenesis',
    'tipePengajuan', 'standarOrganoleptik', 'kategoriAslt', 'kategoriPerubahan', 'kategoriSampelAslt',
    'jenisKemasan', 'jenisPlastik', 'kategoriKemasan', 'jumlahLayer', 'metodePengemasan', 'ujiSealing', 'ujiVacuum', 'laboratorium'
  ].forEach(function (id) { initSelect2Aslt(id); });

  /* Departemen Pemohon auto-fills from the logged-in dummy role's department */
  var roleCode = localStorage.getItem('holabsysRole');
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
      placeholder: 'Cari & pilih parameter uji...',
      options: MASTER_PARAMETER_ASLT.map(function (p) { return { value: p.value, text: p.text }; }),
      onChange: function (values) {
        var arr = Array.isArray(values) ? values : (values ? [values] : []);
        paramCountBadge.textContent = arr.length + ' Parameter Terpilih';
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
      pemohon: findRole(localStorage.getItem('holabsysRole')).name,
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
      timepoint: (existingRecord && existingRecord.timepoint) || 'Belum Dimulai',
      rejection: val('perkiraanRejection'),
      status: (existingRecord && existingRecord.status) || 'Menunggu Approval'
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
      return files.length || (existingRecord && existingRecord.step && existingRecord.step !== 'Draft') ? '' : 'Lampiran Dokumen (Klausul ASLT) wajib diunggah.';
    },
    setLocked: setFormLocked,
    toast: showToast,
    onApproved: function () { return { status: 'Cek Fiskim Initial', timepoint: 'H-0 (Initial)' }; }
  });
});
