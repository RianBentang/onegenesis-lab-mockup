/* Deterministic QR-look SVG generator — ported from OneGenesis mockup (qrSvg) */
function qrSvg(seed, size) {
  size = size || 78;
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
  return '<svg class="qr" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
    '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' + r + fin(0, 0) + fin(14, 0) + fin(0, 14) + '</svg>';
}

/* Duplicated lookup (category only needed here) — kept local to avoid cross-page coupling */
var MASTER_PARAMETER_CATEGORY = {
  moisture: { text: 'Moisture (Kadar Air)', category: 'Fisika Kimia', code: 'MOI' },
  fat: { text: 'Kadar Lemak (Fat)', category: 'Fisika Kimia', code: 'FAT' },
  ffa: { text: 'FFA (Free Fatty Acid)', category: 'Fisika Kimia', code: 'FFA' },
  protein: { text: 'Kadar Protein', category: 'Fisika Kimia', code: 'PRO' },
  salmonella: { text: 'Salmonella sp.', category: 'Mikrobiologi', code: 'SAL' },
  alt: { text: 'Angka Lempeng Total (ALT)', category: 'Mikrobiologi', code: 'ALT' },
  pb: { text: 'Cemaran Logam (Pb)', category: 'Fisika Kimia', code: 'PB' }
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

document.addEventListener('DOMContentLoaded', function () {
  var urlParams = new URLSearchParams(window.location.search);
  var docId = urlParams.get('docId');
  var record = docId ? getRequestById(docId) : null;
  var content = document.getElementById('labelingContent');

  if (!record) {
    content.innerHTML = '<div class="card custom-card"><div class="card-body text-center text-muted py-5">Dokumen tidak ditemukan.</div></div>';
    return;
  }

  if (!record.spk) {
    content.innerHTML =
      '<div class="card custom-card"><div class="card-body text-center py-5">' +
      '<i class="ri-lock-line" style="font-size:2.25rem;color:var(--bs-border-color);"></i>' +
      '<div class="fw-semibold mt-2">Label Belum Bisa Dicetak</div>' +
      '<p class="text-muted fs-13 mb-0">Label dapat dicetak setelah kaji ulang OK &amp; SPK terbit.</p>' +
      '</div></div>';
    return;
  }

  var groups = [];
  (record.params || []).forEach(function (code) {
    var cat = MASTER_PARAMETER_CATEGORY[code] ? MASTER_PARAMETER_CATEGORY[code].category : 'Umum';
    if (groups.indexOf(cat) === -1) groups.push(cat);
  });

  var labels = groups.map(function (group, i) {
    var sid = record.id + '-' + String(i + 1).padStart(2, '0');
    var chips = (record.params || [])
      .filter(function (code) { return MASTER_PARAMETER_CATEGORY[code] && MASTER_PARAMETER_CATEGORY[code].category === group; })
      .map(function (code) { return '<span>' + MASTER_PARAMETER_CATEGORY[code].code + '</span>'; })
      .join('');

    return '<div class="lbl-card">' + qrSvg(sid) +
      '<div>' +
      '<div class="lh"><span class="lid">' + sid + '</span> <span class="badge ' + (record.tipe === 'Urgent' ? 'bg-danger-transparent' : 'bg-secondary-transparent') + '">' + record.tipe + '</span></div>' +
      '<div class="ln">' + record.sampel + '</div>' +
      '<div class="lm">Batch: ' + record.batch + ' &middot; Prod: ' + record.prod + '<br>Lab: <b>' + group + '</b> &middot; Terima: ' + record.tanggal + '<br>Simpan: ' + record.suhu + ' &middot; ' + record.spk + '</div>' +
      '<div class="lp">' + chips + '</div>' +
      '</div></div>';
  });

  var role = findRole(localStorage.getItem('holabsysRole'));
  var canFinish = role.code === 'ADM' && !record.labeled;

  content.innerHTML =
    '<div class="card custom-card">' +
    '<div class="card-body">' +
    '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 no-print">' +
    '<div>' +
    '<h6 class="fw-semibold mb-0"><i class="ri-price-tag-3-line text-primary me-1"></i> Preview Label (' + labels.length + ')</h6>' +
    '<p class="text-muted fs-12 mb-0">Ukuran label 50 &times; 30 mm &middot; QR berisi ID sampel unik (Kl. 7.4)</p>' +
    '</div>' +
    '<div class="d-flex align-items-center gap-2">' +
    '<select id="printFormat" class="form-select form-select-sm" style="width:auto;">' +
    '<option>Zebra ZD230 (50&times;30)</option><option>A4 &mdash; 3&times;7 label</option><option>PDF</option>' +
    '</select>' +
    '<button type="button" id="btnPrintLabel" class="btn btn-sm bg-white border d-inline-flex align-items-center gap-1"><i class="ri-printer-line"></i> Cetak Label</button>' +
    (canFinish ? '<button type="button" id="btnLabelDone" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-check-line"></i> Label Ditempel &mdash; Serahkan ke Analis</button>' : '') +
    '</div>' +
    '</div>' +
    '<div class="label-sheet">' + labels.join('') + '</div>' +
    '</div></div>';

  document.getElementById('btnPrintLabel').addEventListener('click', function () { window.print(); });

  var doneBtn = document.getElementById('btnLabelDone');
  if (doneBtn) {
    doneBtn.addEventListener('click', function () {
      updateRequest(record.id, { step: 'Selesai', labeled: true });
      showToast('Label untuk ' + record.id + ' telah ditempel dan diserahkan ke analis.');
      setTimeout(function () { window.location.href = 'internalList.html'; }, 1200);
    });
  }
});
