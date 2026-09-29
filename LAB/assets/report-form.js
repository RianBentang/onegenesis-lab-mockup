/* Deterministic QR-look SVG generator — ported from OneGenesis mockup (qrSvg) */
function qrSvg(seed, size) {
  size = size || 84;
  var h = 0;
  for (var i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
  var n = 21, cell = size / n, r = '';
  function fin(x, y) {
    return '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + (7 * cell) + '" height="' + (7 * cell) + '" fill="#111"/>' +
      '<rect x="' + ((x + 1) * cell) + '" y="' + ((y + 1) * cell) + '" width="' + (5 * cell) + '" height="' + (5 * cell) + '" fill="#fff"/>' +
      '<rect x="' + ((x + 2) * cell) + '" y="' + ((y + 2) * cell) + '" width="' + (3 * cell) + '" height="' + (3 * cell) + '" fill="#111"/>';
  }
  for (var y = 0; y < n; y++) {
    for (var x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      h = (h * 1103515245 + 12345) >>> 0;
      if (h & 0x40000) r += '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + cell + '" height="' + cell + '" fill="#111"/>';
    }
  }
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
    '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' + r + fin(0, 0) + fin(14, 0) + fin(0, 14) + '</svg>';
}

/* Duplicated from internal-form.js — kept local to avoid cross-page coupling */
var REPORT_MASTER_PARAMETER_INTERNAL = [
  { value: 'moisture', text: 'Moisture (Kadar Air)', method: 'SNI 2897:2008' },
  { value: 'fat', text: 'Kadar Lemak (Fat)', method: 'IK-LAB-02' },
  { value: 'ffa', text: 'FFA (Free Fatty Acid)', method: 'AOAC 940.28' },
  { value: 'protein', text: 'Kadar Protein', method: 'IK-LAB-05' },
  { value: 'salmonella', text: 'Salmonella sp.', method: 'SNI ISO 6579' },
  { value: 'alt', text: 'Angka Lempeng Total (ALT)', method: 'SNI 2897:2008' },
  { value: 'pb', text: 'Cemaran Logam (Pb)', method: 'AOAC 999.11' }
];

/* Dummy in-spec result values per parameter (design-only simulation — no real result-capture step upstream) */
var REPORT_RESULT_TABLE = {
  moisture: { unit: '% b/b', spec: 'Maks. 3.0', result: '2.14' },
  fat: { unit: '% b/b', spec: '18.0 - 22.0', result: '19.85' },
  ffa: { unit: '% b/b', spec: 'Maks. 0.5', result: '0.31' },
  protein: { unit: '% b/b', spec: 'Min. 8.0', result: '9.20' },
  salmonella: { unit: '/25g', spec: 'Negatif', result: 'Negatif / 25g' },
  alt: { unit: 'CFU/g', spec: 'Maks. 1 x 10⁴', result: '8.2 x 10³' },
  pb: { unit: 'mg/kg', spec: 'Maks. 0.5', result: '0.12' }
};

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

function reportGenerateNo(jenis) {
  var now = new Date();
  var ym = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  var seq = String(Math.floor(Math.random() * 90) + 10);
  var prefix = jenis === 'external' ? 'COA' : 'LHU';
  return prefix + '/LAB/' + ym + '/00' + seq;
}

document.addEventListener('DOMContentLoaded', function () {
  var urlParams = new URLSearchParams(window.location.search);
  var docId = urlParams.get('docId');
  var jenis = (urlParams.get('jenis') || 'internal').toLowerCase();
  var record = jenis === 'external' ? getExternalRequestById(docId) : getRequestById(docId);

  var content = document.getElementById('reportContent');
  var docNoEl = document.getElementById('docNoValue');
  var reportNoEl = document.getElementById('reportNoValue');
  var reportStatusEl = document.getElementById('reportStatusBadge');

  if (!record) {
    content.innerHTML = '<div class="card custom-card"><div class="card-body text-center text-muted py-5">Dokumen tidak ditemukan.</div></div>';
    return;
  }

  docNoEl.textContent = record.id;

  function updateDocInfoBar() {
    reportNoEl.textContent = record.reportNo || 'Belum Terbit';
    if (record.reportStatus === 'Final') {
      reportStatusEl.textContent = 'Final';
      reportStatusEl.className = 'badge bg-success-transparent';
    } else {
      reportStatusEl.textContent = 'Draft';
      reportStatusEl.className = 'badge bg-warning-transparent';
    }
  }

  var paramLookup = jenis === 'external' ? EXTERNAL_MASTER_PARAMETER : REPORT_MASTER_PARAMETER_INTERNAL;

  function renderCertificate() {
    var titleText = jenis === 'external' ? 'CERTIFICATE OF ANALYSIS (COA)' : 'LAPORAN HASIL UJI (LHU)';
    var labText = jenis === 'external' ? record.lab : (record.lab + ' — Laboratorium Internal');

    var rows = (record.params || []).map(function (code, i) {
      var p = paramLookup.filter(function (x) { return x.value === code; })[0];
      var r = REPORT_RESULT_TABLE[code] || { unit: '-', spec: '-', result: '-' };
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + (p ? p.text : code) + '</td>' +
        '<td>' + r.unit + '</td>' +
        '<td class="font-monospace">' + (p ? p.method : '-') + '</td>' +
        '<td>' + r.spec + '</td>' +
        '<td class="font-monospace fw-semibold">' + r.result + '</td>' +
        '<td><span class="badge bg-success-transparent">PASS</span></td>' +
        '</tr>';
    }).join('');

    var isFinal = record.reportStatus === 'Final';

    content.innerHTML =
      '<div class="card custom-card"><div class="card-body">' +
      '<div class="printable-doc" id="printableDoc">' +

      '<div class="cert-header">' +
      '<div class="cert-header-brand">' +
      '<img src="../assets/img/garudafood-logo.png" alt="Garudafood" />' +
      '<div><h4>HOLABSYS Central Laboratory</h4>' +
      '<p>Testing, Inspection &amp; Quality Assurance Center</p>' +
      '<p>PT Garudafood Putra Putri Jaya Tbk</p></div>' +
      '</div>' +
      '<div class="cert-kan-box">' +
      '<div class="box"><div class="kan">KAN</div><div class="lp">LP-1234-IDN</div></div>' +
      '<small>ISO/IEC 17025</small>' +
      '</div>' +
      '</div>' +

      '<div class="cert-title">' +
      '<h3>' + titleText + '</h3>' +
      '<div class="cert-no">Nomor: ' + (record.reportNo || '(belum terbit — masih Draft)') + '</div>' +
      '</div>' +

      '<div class="cert-meta-grid">' +
      '<div class="row-item"><span>No. ID Pengajuan</span><span>' + record.id + '</span></div>' +
      '<div class="row-item"><span>Jenis Laboratorium</span><span>' + labText + '</span></div>' +
      '<div class="row-item"><span>Pemohon / Departemen</span><span>' + record.pemohon + ' / ' + record.departemen + '</span></div>' +
      '<div class="row-item"><span>Nama Sampel</span><span>' + record.sampel + '</span></div>' +
      '<div class="row-item"><span>Kode Batch</span><span>' + record.batch + '</span></div>' +
      '<div class="row-item"><span>Tgl. Produksi</span><span>' + record.prod + '</span></div>' +
      '<div class="row-item"><span>Tgl. Pengajuan</span><span>' + record.tanggal + '</span></div>' +
      '<div class="row-item"><span>Tipe Pengajuan</span><span>' + record.tipe + '</span></div>' +
      '</div>' +

      '<table class="cert-result-table"><thead><tr>' +
      '<th>No</th><th>Parameter Uji</th><th>Satuan</th><th>Metode Acuan</th><th>Baku Mutu / Spesifikasi</th><th>Hasil Pengujian</th><th>Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +

      '<div class="cert-sign-grid">' +
      '<div class="cert-sign-box">' +
      '<div class="status text-muted">Diverifikasi Oleh (Technical Review)</div>' +
      '<div class="cert-qr-wrap">' + qrSvg(record.id + '-verify') + '</div>' +
      '<div class="name">Dian Pramono, S.Si</div>' +
      '<div class="role">Koordinator Lab / Penyelia (CRL)</div>' +
      '</div>' +
      '<div class="cert-sign-box">' +
      '<div class="status ' + (isFinal ? 'text-success' : 'text-warning') + '">' + (isFinal ? 'Disetujui &amp; Diterbitkan (Digital Signature)' : 'Menunggu Finalisasi TCM') + '</div>' +
      '<div class="cert-qr-wrap">' + qrSvg(record.id + '-' + (record.reportNo || 'draft')) + '</div>' +
      '<div class="name">Siti Rahmawati</div>' +
      '<div class="role">Technical Manager (TCM)</div>' +
      '</div>' +
      '</div>' +

      '</div>' +
      '</div></div>';
  }

  function renderActionButtons() {
    var role = findRole(localStorage.getItem('holabsysRole'));
    var formActionButtons = document.getElementById('formActionButtons');
    var html = '<a href="reportList.html" class="btn btn-sm bg-white d-inline-flex align-items-center gap-1"><i class="ri-arrow-left-line"></i> Back</a>' +
      '<button type="button" id="btnPrint" class="btn btn-sm bg-white border d-inline-flex align-items-center gap-1"><i class="ri-printer-line"></i> Cetak</button>';

    if (role.code === 'TCM' && record.reportStatus !== 'Final') {
      html += '<button type="button" id="btnFinalize" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-shield-check-line"></i> Finalisasi Laporan</button>';
    }

    formActionButtons.innerHTML = html;

    document.getElementById('btnPrint').addEventListener('click', function () { window.print(); });

    var finalizeBtn = document.getElementById('btnFinalize');
    if (finalizeBtn) {
      finalizeBtn.addEventListener('click', function () {
        var reportNo = reportGenerateNo(jenis);
        var patch = { reportStatus: 'Final', reportNo: reportNo };
        record = jenis === 'external' ? updateExternalRequest(record.id, patch) : updateRequest(record.id, patch);
        updateDocInfoBar();
        renderCertificate();
        renderActionButtons();
        showToast('Laporan "' + reportNo + '" berhasil difinalisasi dan ditandatangani.');
      });
    }
  }

  updateDocInfoBar();
  renderCertificate();
  renderActionButtons();
  document.addEventListener('holabsys:rolechange', renderActionButtons);
});
