/* ---------- HOLABSYS Excel page (FortuneSheet + Tarik Data / Push Data + fullscreen) ---------- */

// The FortuneSheet UMD build calls Node's crypto.randomFillSync (via uuid) on the browser
// crypto global. Not needed in the React app, where the bundler resolves the browser build.
if (window.crypto && !window.crypto.randomFillSync) {
  window.crypto.randomFillSync = function (arr) { return window.crypto.getRandomValues(arr); };
}

function showToast(message, variant) {
  var container = document.getElementById('appToastContainer');
  if (!container) { alert(message); return; }
  var toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-white ' + (variant === 'danger' ? 'bg-danger' : 'bg-dark') + ' border-0 shadow';
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

/* Worksheet columns. Ulangan 1–3 are filled by the analyst; Rata-rata is a formula. */
var SHEET_HEADER = ['No. ID Transaksi', 'Jenis', 'Sampel', 'Parameter', 'Ulangan 1', 'Ulangan 2', 'Ulangan 3', 'Rata-rata', 'Satuan', 'Spesifikasi', 'Analis'];
var COL = { u1: 4, u3: 6, avg: 7 };

document.addEventListener('DOMContentLoaded', function () {
  var host = document.getElementById('sheet');
  var root = ReactDOM.createRoot(host);
  var workbookRef = React.createRef();
  var loaded = null; // { source, record, params }

  var trxSelect = document.getElementById('trxSelect');
  var btnPull = document.getElementById('btnPull');
  var btnPush = document.getElementById('btnPush');
  var sheetInfo = document.getElementById('sheetInfo');

  function cell(v, extra) {
    return Object.assign({ v: v, m: v == null ? '' : String(v) }, extra || {});
  }

  function buildSheet(source, record, params) {
    var celldata = SHEET_HEADER.map(function (h, c) { return { r: 0, c: c, v: cell(h, { bl: 1 }) }; });
    var analis = record.analis || '';
    params.forEach(function (p, i) {
      var r = i + 1, xl = r + 1;
      [record.id, WORKSHEET_SOURCES[source].label, record.sampel, p.text].forEach(function (v, c) {
        celldata.push({ r: r, c: c, v: cell(v) });
      });
      celldata.push({ r: r, c: COL.avg, v: { f: '=IF(COUNT(E' + xl + ':G' + xl + ')=0,"",ROUND(AVERAGE(E' + xl + ':G' + xl + '),3))', v: '', m: '' } });
      celldata.push({ r: r, c: 8, v: cell(p.unit) });
      celldata.push({ r: r, c: 9, v: cell(p.spec) });
      celldata.push({ r: r, c: 10, v: cell(analis) });
    });
    return [{
      name: record.id,
      order: 0,
      status: 1,
      row: Math.max(40, params.length + 10),
      column: 16,
      celldata: celldata,
      /* Rata-rata formulas must be in the calc chain, or FortuneSheet won't recalc them on edit */
      id: 'ws-' + record.id,
      calcChain: params.map(function (p, i) { return { r: i + 1, c: COL.avg, id: 'ws-' + record.id }; }),
      config: { columnlen: { 0: 140, 1: 80, 2: 200, 3: 200, 7: 90, 9: 150, 10: 120 } }
    }];
  }

  function emptySheet() {
    return [{
      name: 'Hasil Uji', order: 0, status: 1, row: 40, column: 16,
      celldata: SHEET_HEADER.map(function (h, c) { return { r: 0, c: c, v: cell(h, { bl: 1 }) }; }),
      config: { columnlen: { 0: 140, 2: 200, 3: 200, 9: 150, 10: 120 } }
    }];
  }

  /* Remount the workbook per transaction (key) so FortuneSheet starts from the new data */
  function renderWorkbook(sheets, key) {
    root.render(React.createElement(window.react.Workbook, { key: key, ref: workbookRef, data: sheets, lang: 'en' }));
  }

  /* SpkSelect2: No. ID Transaksi grouped by source */
  function fillTransactions() {
    var groups = {};
    getWorksheetTransactions().forEach(function (t) {
      (groups[t.source] = groups[t.source] || []).push(t.record);
    });
    trxSelect.innerHTML = '<option value="">Pilih No. ID Transaksi</option>' + ['internal', 'sensory', 'aslt'].map(function (src) {
      if (!groups[src]) return '';
      return '<optgroup label="' + WORKSHEET_SOURCES[src].label + '">' + groups[src].map(function (r) {
        return '<option value="' + src + '|' + r.id + '">' + r.id + ' — ' + r.sampel + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    btnPull.disabled = true;
  }

  trxSelect.addEventListener('change', function () { btnPull.disabled = !trxSelect.value; });

  btnPull.addEventListener('click', function () {
    var parts = trxSelect.value.split('|');
    var source = parts[0], record = worksheetGetRecord(source, parts[1]);
    if (!record) return;
    var params = worksheetParamsFor(source, record);
    loaded = { source: source, record: record, params: params };
    renderWorkbook(buildSheet(source, record, params), record.id);
    btnPush.disabled = false;
    sheetInfo.innerHTML = '<span class="badge ' + WORKSHEET_SOURCES[source].badge + ' me-1">' + WORKSHEET_SOURCES[source].label + '</span>' +
      '<span class="font-monospace fw-semibold">' + record.id + '</span> · ' + record.sampel + ' · ' + params.length + ' parameter. Isi Ulangan 1–3, lalu Push Data.';
    showToast('Data transaksi "' + record.id + '" ditarik ke lembar kerja.');
  });

  function readNumber(r, c) {
    var v = workbookRef.current ? workbookRef.current.getCellValue(r, c) : null;
    if (v === null || v === undefined || v === '') return null;
    /* Strict: "0,5" → 0.5, but text like "Negatif" stays text instead of being half-parsed */
    var n = Number(String(v).trim().replace(',', '.'));
    return isNaN(n) ? String(v).trim() : n;
  }

  btnPush.addEventListener('click', function () {
    if (!loaded) return;
    var results = {}, missing = [];
    loaded.params.forEach(function (p, i) {
      var r = i + 1, values = [];
      for (var c = COL.u1; c <= COL.u3; c++) {
        var v = readNumber(r, c);
        if (v !== null) values.push(v);
      }
      if (!values.length) { missing.push(p.text); return; }
      var nums = values.filter(function (v) { return typeof v === 'number'; });
      var result = nums.length === values.length
        ? String(Math.round(nums.reduce(function (a, b) { return a + b; }, 0) / nums.length * 1000) / 1000)
        : String(values[0]);
      results[p.key] = { values: values, result: result };
    });

    if (missing.length) {
      showToast('Hasil belum diisi untuk: ' + missing.join(', ') + '.', 'danger');
      return;
    }

    var id = loaded.record.id;
    pushWorksheetResults(loaded.source, id, results, loaded.record.analis || null);
    showToast('Data di-push ke "' + id + '". Laporan masuk ke Report sebagai Draft.');
    loaded = null;
    btnPush.disabled = true;
    sheetInfo.textContent = 'Pilih No. ID Transaksi (Internal / Sensory / ASLT), lalu Tarik Data.';
    fillTransactions();
    renderWorkbook(emptySheet(), 'empty-' + Date.now());
  });

  fillTransactions();
  renderWorkbook(emptySheet(), 'empty');

  // FortuneSheet only re-measures its canvas on window resize, so forward every host size
  // change (initial layout settling, sidebar toggle, fullscreen) as one.
  new ResizeObserver(function () { window.dispatchEvent(new Event('resize')); }).observe(host);

  /* ---------- fullscreen ---------- */
  var card = document.getElementById('sheetCard');
  var btn = document.getElementById('btnFullscreen');

  btn.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else card.requestFullscreen().catch(function (e) { console.warn('Fullscreen ditolak browser:', e.message); });
  });

  document.addEventListener('fullscreenchange', function () {
    var on = document.fullscreenElement === card;
    btn.innerHTML = on
      ? '<i class="ri-fullscreen-exit-line me-1"></i><span>Exit Fullscreen</span>'
      : '<i class="ri-fullscreen-line me-1"></i><span>Fullscreen</span>';
  });
});
