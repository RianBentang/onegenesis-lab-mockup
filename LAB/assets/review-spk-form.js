/* Duplicated from internal-form.js — kept local to avoid cross-page coupling */
var MASTER_PARAMETER_LOOKUP = [
  { value: 'moisture', text: 'Moisture (Kadar Air)', method: 'SNI 2897:2008', category: 'Fisika Kimia', scope: true, leadTime: 2 },
  { value: 'fat', text: 'Kadar Lemak (Fat)', method: 'IK-LAB-02', category: 'Fisika Kimia', scope: true, leadTime: 2 },
  { value: 'ffa', text: 'FFA (Free Fatty Acid)', method: 'AOAC 940.28', category: 'Fisika Kimia', scope: true, leadTime: 1 },
  { value: 'protein', text: 'Kadar Protein', method: 'IK-LAB-05', category: 'Fisika Kimia', scope: true, leadTime: 2 },
  { value: 'salmonella', text: 'Salmonella sp.', method: 'SNI ISO 6579', category: 'Mikrobiologi', scope: true, leadTime: 5 },
  { value: 'alt', text: 'Angka Lempeng Total (ALT)', method: 'SNI 2897:2008', category: 'Mikrobiologi', scope: false, leadTime: 3 },
  { value: 'pb', text: 'Cemaran Logam (Pb)', method: 'AOAC 999.11', category: 'Fisika Kimia', scope: false, leadTime: 4 }
];

function generateSpkNo() {
  var now = new Date();
  var ym = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  var seq = String(Math.floor(Math.random() * 90) + 10);
  return 'SPK/LAB/' + ym + '/00' + seq;
}

document.addEventListener('DOMContentLoaded', function () {
  var urlParams = new URLSearchParams(window.location.search);
  var docId = urlParams.get('docId');
  var record = docId ? getRequestById(docId) : null;

  var docNoEl = document.getElementById('docNoValue');
  var spkNoEl = document.getElementById('spkNoValue');
  var docDateEl = document.getElementById('docDateValue');

  if (record) {
    docNoEl.textContent = record.id;
    docDateEl.textContent = record.tanggal;
    if (record.spk) spkNoEl.textContent = record.spk;

    document.getElementById('summarySampel').textContent = record.sampel;
    document.getElementById('summaryBatch').textContent = record.batch;
    document.getElementById('summaryTipeTujuan').textContent = record.tipe + ' · ' + record.tujuan;

    var rows = MASTER_PARAMETER_LOOKUP.filter(function (p) { return (record.params || []).indexOf(p.value) !== -1; });
    document.getElementById('summaryParamTableBody').innerHTML = rows.map(function (p) {
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

    if (record.hasilKajiUlang && window.jQuery) window.jQuery('#hasilKajiUlang').val(record.hasilKajiUlang).trigger('change');
    if (record.catatanKajiUlang) document.getElementById('catatanKajiUlang').value = record.catatanKajiUlang;
  } else {
    document.getElementById('reviewSpkForm').innerHTML = '<div class="card custom-card"><div class="card-body text-center text-muted py-5">Dokumen tidak ditemukan.</div></div>';
  }

  /* Penunjukan Analis */
  var analisSelect = document.getElementById('penunjukanAnalis');
  var opt0 = document.createElement('option');
  opt0.value = ''; opt0.textContent = '-- Pilih Analis --';
  analisSelect.appendChild(opt0);
  MASTER_ANALIS.forEach(function (name) {
    var opt = document.createElement('option');
    opt.value = name; opt.textContent = name;
    analisSelect.appendChild(opt);
  });
  if (record && record.analis) analisSelect.value = record.analis;

  ['hasilKajiUlang', 'penunjukanAnalis'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el && window.jQuery && window.jQuery.fn.select2) {
      window.jQuery(el).select2({ width: '100%', placeholder: '-- Pilih --' });
    }
  });

  /* Est. Tanggal Selesai Uji — Flatpickr */
  var estFp = null;
  if (window.flatpickr) {
    estFp = window.flatpickr('#estSelesai', { dateFormat: 'd-m-Y' });
    if (record && record.estSelesai) estFp.setDate(record.estSelesai, true, 'd-m-Y');
  }

  /* Hasil Kaji Ulang → toggle Catatan Kaji Ulang */
  var hasilSelect = document.getElementById('hasilKajiUlang');
  var wrapCatatan = document.getElementById('wrapCatatanKajiUlang');
  var catatanEl = document.getElementById('catatanKajiUlang');
  function toggleCatatan() {
    var needsCatatan = hasilSelect.value === 'Ditolak' || hasilSelect.value === 'Diterima Parsial';
    wrapCatatan.style.display = needsCatatan ? '' : 'none';
    catatanEl.required = needsCatatan;
    if (!needsCatatan) catatanEl.value = '';
  }
  toggleCatatan();
  if (window.jQuery) window.jQuery(hasilSelect).on('change', toggleCatatan);
  else hasilSelect.addEventListener('change', toggleCatatan);

  /* Role gate — only ADM / CRL can fill and submit */
  function setLocked(locked) {
    document.querySelectorAll('#reviewSpkForm input, #reviewSpkForm select, #reviewSpkForm textarea').forEach(function (el) {
      el.disabled = locked;
    });
    if (window.jQuery) {
      window.jQuery('#reviewSpkForm select').each(function () {
        if (window.jQuery(this).data('select2')) window.jQuery(this).prop('disabled', locked).trigger('change.select2');
      });
    }
    if (estFp) {
      estFp.set('clickOpens', !locked);
      document.getElementById('estSelesai').disabled = locked;
    }
  }

  var formActionButtons = document.getElementById('formActionButtons');
  var BACK_BTN_HTML = '<a href="internalList.html" class="btn btn-sm bg-white d-inline-flex align-items-center gap-1"><i class="ri-arrow-left-line"></i> Back</a>';

  function refreshRoleState() {
    var role = findRole(localStorage.getItem('holabsysRole'));
    var canAct = role.code === 'ADM' || role.code === 'CRL';
    var alreadyIssued = record && !!record.spk;

    setLocked(!canAct || alreadyIssued);

    if (canAct && !alreadyIssued) {
      formActionButtons.innerHTML = BACK_BTN_HTML +
        '<button type="button" id="btnIssueSpk" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-file-check-line"></i> Terima &amp; Terbit SPK</button>';
      document.getElementById('btnIssueSpk').addEventListener('click', handleIssueSpk);
    } else {
      formActionButtons.innerHTML = BACK_BTN_HTML;
    }
  }

  function handleIssueSpk() {
    var form = document.getElementById('reviewSpkForm');
    if (form.checkValidity() === false) { form.reportValidity(); return; }

    var spkNo = generateSpkNo();
    updateRequest(record.id, {
      spk: spkNo,
      hasilKajiUlang: hasilSelect.value,
      catatanKajiUlang: catatanEl.value,
      analis: analisSelect.value,
      estSelesai: document.getElementById('estSelesai').value,
      step: 'Labeling'
    });
    showToast('SPK "' + spkNo + '" berhasil diterbitkan untuk ' + record.id + '.');
    setTimeout(function () { window.location.href = 'internalList.html'; }, 1200);
  }

  /* ---------- Toast (top-center) — small local copy so this page has no dependency on internal-form.js ---------- */
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

  if (record) refreshRoleState();
  document.addEventListener('holabsys:rolechange', function () { if (record) refreshRoleState(); });
});
