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

/* Panel sheets (Sensory / ASLT): the first columns identify the panelist row */
var PANEL_BASE_HEADER = ['Sesi', 'Booth', 'NIK', 'Nama Panelis'];

function colLetter(c) { return String.fromCharCode(65 + c); }

document.addEventListener('DOMContentLoaded', function () {
  var host = document.getElementById('sheet');
  var root = ReactDOM.createRoot(host);
  var workbookRef = React.createRef();
  /* { source, record, params, paramSheetId, trx, panel: [{ id, test, rows: [{ r, entry, code }] }] } */
  var loaded = null;

  var trxSelect = document.getElementById('trxSelect');
  var btnPull = document.getElementById('btnPull');
  var btnPush = document.getElementById('btnPush');
  var sheetInfo = document.getElementById('sheetInfo');

  function cell(v, extra) {
    return Object.assign({ v: v, m: v == null ? '' : String(v) }, extra || {});
  }
  function textCell(v, extra) { return cell(v == null ? '' : String(v), Object.assign({ ct: { fa: '@', t: 's' } }, extra || {})); }
  /* FortuneSheet does not evaluate formulas on load, so the cell also carries the value computed
     here; the formula takes over when the lab edits a value in the sheet. */
  function formula(f, v) { return { f: f, v: v == null ? '' : v, m: v == null ? '' : String(v) }; }
  function round(n, d) { var p = Math.pow(10, d); return Math.round(n * p) / p; }

  /* ---------- lab parameter sheet (Ulangan 1–3) ---------- */
  function paramSheet(source, record, params, id, order) {
    var celldata = SHEET_HEADER.map(function (h, c) { return { r: 0, c: c, v: cell(h, { bl: 1 }) }; });
    var analis = record.analis || '';
    params.forEach(function (p, i) {
      var r = i + 1, xl = r + 1;
      [record.id, WORKSHEET_SOURCES[source].label, record.sampel, p.text].forEach(function (v, c) {
        celldata.push({ r: r, c: c, v: cell(v) });
      });
      celldata.push({ r: r, c: COL.avg, v: formula('=IF(COUNT(E' + xl + ':G' + xl + ')=0,"",ROUND(AVERAGE(E' + xl + ':G' + xl + '),3))') });
      celldata.push({ r: r, c: 8, v: cell(p.unit) });
      celldata.push({ r: r, c: 9, v: cell(p.spec) });
      celldata.push({ r: r, c: 10, v: cell(analis) });
    });
    return {
      name: 'Hasil Uji', id: id, order: order, status: order === 0 ? 1 : 0,
      row: Math.max(40, params.length + 10), column: 16, celldata: celldata,
      /* Rata-rata formulas must be in the calc chain, or FortuneSheet won't recalc them on edit */
      calcChain: params.map(function (p, i) { return { r: i + 1, c: COL.avg, id: id }; }),
      config: { columnlen: { 0: 140, 1: 80, 2: 200, 3: 200, 7: 90, 9: 150, 10: 120 } }
    };
  }

  /* ---------- panel sheets: one per test, one row per panelist × code ---------- */
  function panelEntries(trx) {
    var sesiNo = {};
    panelSessionsForTrx(trx.id).forEach(function (s) { sesiNo[s.id] = s.sesiNo; });
    return panelScoresForTrx(trx.id).map(function (e) {
      return Object.assign({ sesi: sesiNo[e.scheduleId] ? 'Sesi ' + sesiNo[e.scheduleId] : e.scheduleId }, e);
    }).sort(function (a, b) { return a.sesi < b.sesi ? -1 : (a.sesi > b.sesi ? 1 : (a.at < b.at ? -1 : 1)); });
  }

  function panelSheet(trx, t, entries, id, order) {
    var celldata = [], calc = [], rows = [], r = 0;
    var nums = {}; // "r:c" → number, to pre-compute the formulas
    function put(rr, c, v) { celldata.push({ r: rr, c: c, v: v }); if (typeof v.v === 'number') nums[rr + ':' + c] = v.v; }
    function putF(rr, c, f, value) { put(rr, c, formula(f, value)); calc.push({ r: rr, c: c, id: id }); }
    function colNums(c, from, to) { // 1-based sheet rows, inclusive
      var out = [];
      for (var i = from - 1; i <= to - 1; i++) if (nums[i + ':' + c] !== undefined) out.push(nums[i + ':' + c]);
      return out;
    }
    function base(rr, e) {
      put(rr, 0, cell(e.sesi)); put(rr, 1, cell(e.booth || ''));
      put(rr, 2, textCell(e.nik)); put(rr, 3, cell(e.name));
    }
    var cols, widths = { 0: 70, 1: 60, 2: 110, 3: 160, 4: 100 };

    if (t.type === 'triangle') {
      cols = PANEL_BASE_HEADER.concat(['Kode Dipilih', 'Benar (1/0)']);
      cols.forEach(function (h, c) { put(0, c, cell(h, { bl: 1 })); });
      entries.forEach(function (e) {
        r++;
        var a = (e.answers || {})[t.param] || {};
        base(r, e);
        put(r, 4, textCell(a.pick || ''));
        putF(r, 5, '=IF(E' + (r + 1) + '="","",IF(E' + (r + 1) + '="' + trx.oddCode + '",1,0))',
          a.pick ? (String(a.pick) === String(trx.oddCode) ? 1 : 0) : null);
        rows.push({ r: r, entry: e });
      });
      var last = r + 1;
      r += 2;
      put(r, 3, cell('Statistik', { bl: 1 }));
      put(r + 1, 3, cell('Kode sampel berbeda')); put(r + 1, 5, textCell(trx.oddCode));
      put(r + 2, 3, cell('Jumlah panelis')); putF(r + 2, 5, '=COUNT(F2:F' + last + ')', colNums(5, 2, last).length);
      put(r + 3, 3, cell('Jumlah benar')); putF(r + 3, 5, '=SUM(F2:F' + last + ')', colNums(5, 2, last).reduce(function (x, y) { return x + y; }, 0));
      put(r + 4, 3, cell('Minimal benar (α 0,05)')); put(r + 4, 5, cell(panelTriangleCritical(entries.length)));
      r += 4;
    } else {
      /* rating: atribut (1–9) + JAR ketepatan (1 Kurang · 2 Pas · 3 Terlalu); ranking: rank per atribut */
      var valueCols = t.type === 'ranking'
        ? t.atribut.map(function (a) { return { kind: 'rank', key: a, head: 'Rank ' + a }; })
        : t.atribut.map(function (a) { return { kind: 'score', key: a, head: a + ' (1-9)' }; })
            .concat(t.ketepatan.map(function (k) { return { kind: 'jar', key: k, head: 'JAR ' + k + ' (1/2/3)' }; }));
      cols = PANEL_BASE_HEADER.concat(['Kode Sampel']).concat(valueCols.map(function (v) { return v.head; }));
      cols.forEach(function (h, c) { put(0, c, cell(h, { bl: 1 })); });
      valueCols.forEach(function (v, i) { widths[5 + i] = 120; });
      var blocks = [];
      trx.codes.forEach(function (code) {
        var first = r + 1;
        entries.forEach(function (e) {
          r++;
          var a = (e.answers || {})[t.param] || {};
          base(r, e);
          put(r, 4, textCell(code));
          valueCols.forEach(function (v, i) {
            var val = v.kind === 'score' ? ((a.scores || {})[code] || {})[v.key]
              : v.kind === 'jar' ? ((a.jar || {})[code] || {})[v.key]
              : ((a.ranks || {})[v.key] || {})[code];
            put(r, 5 + i, cell(val == null ? '' : val));
          });
          rows.push({ r: r, entry: e, code: code });
        });
        blocks.push({ code: code, from: first + 1, to: r + 1 });
      });
      r += 2;
      put(r, 3, cell('Statistik', { bl: 1 }));
      blocks.forEach(function (b) {
        var labels = t.type === 'ranking' ? ['Jumlah rank', 'Rata-rata rank', 'n'] : ['Rata-rata (JAR: % Pas)', 'SD', 'n'];
        labels.forEach(function (label, li) {
          r++;
          put(r, 3, cell(label)); put(r, 4, textCell(b.code, { bl: 1 }));
          valueCols.forEach(function (v, i) {
            var c = 5 + i, rg = colLetter(c) + b.from + ':' + colLetter(c) + b.to;
            if (b.to < b.from) return;
            var f, xs = colNums(c, b.from, b.to), n = xs.length;
            var sum = xs.reduce(function (x, y) { return x + y; }, 0), avg = n ? round(sum / n, 2) : null;
            var sd = n > 1 ? round(Math.sqrt(xs.reduce(function (x, y) { return x + (y - sum / n) * (y - sum / n); }, 0) / (n - 1)), 2) : null;
            if (li === 2) f = ['=COUNT(' + rg + ')', n];
            else if (v.kind === 'rank') f = li === 0 ? ['=SUM(' + rg + ')', sum] : ['=IF(COUNT(' + rg + ')=0,"",ROUND(AVERAGE(' + rg + '),2))', avg];
            else if (v.kind === 'jar') {
              if (li === 1) return;
              f = ['=IF(COUNT(' + rg + ')=0,"",ROUND(COUNTIF(' + rg + ',2)/COUNT(' + rg + ')*100,0))',
                n ? Math.round(xs.filter(function (x) { return x === 2; }).length / n * 100) : null];
            }
            else f = li === 0 ? ['=IF(COUNT(' + rg + ')=0,"",ROUND(AVERAGE(' + rg + '),2))', avg] : ['=IF(COUNT(' + rg + ')<2,"",ROUND(STDEV(' + rg + '),2))', sd];
            putF(r, c, f[0], f[1]);
          });
        });
      });
    }
    return {
      sheet: { name: t.label, id: id, order: order, status: order === 0 ? 1 : 0, row: Math.max(40, r + 10), column: Math.max(16, cols.length + 4),
        celldata: celldata, calcChain: calc, config: { columnlen: widths } },
      meta: { id: id, test: t, rows: rows }
    };
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
        var n = src === 'internal' ? 0 : panelScoresForTrx(r.id).length;
        return '<option value="' + src + '|' + r.id + '">' + r.id + ' — ' + r.sampel + (n ? ' (' + n + ' penilaian panelis)' : '') + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    btnPull.disabled = true;
  }

  trxSelect.addEventListener('change', function () { btnPull.disabled = !trxSelect.value; });

  btnPull.addEventListener('click', function () {
    var parts = trxSelect.value.split('|');
    var source = parts[0], record = worksheetGetRecord(source, parts[1]);
    if (!record) return;
    var sheets = [], info;
    loaded = { source: source, record: record, params: [], paramSheetId: 'ws-' + record.id, trx: null, panel: [] };

    /* Sensory always runs a panel; ASLT only when organoleptic panel sessions were scheduled */
    var hasPanel = source === 'sensory' || (source === 'aslt' && (panelSessionsForTrx(record.id).length || panelScoresForTrx(record.id).length));
    loaded.trx = hasPanel ? panelTrxFor(source, record) : null;
    loaded.params = hasPanel ? worksheetLabParams(source, record) : worksheetParamsFor(source, record);
    if (loaded.params.length) sheets.push(paramSheet(source, record, loaded.params, loaded.paramSheetId, 0));

    if (loaded.trx) {
      var entries = panelEntries(loaded.trx);
      loaded.trx.tests.forEach(function (t) {
        var ps = panelSheet(loaded.trx, t, entries, 'panel-' + record.id + '-' + t.param, sheets.length);
        sheets.push(ps.sheet);
        loaded.panel.push(ps.meta);
      });
      var sessions = panelSessionsForTrx(record.id);
      info = entries.length + ' penilaian panelis dari ' + sessions.length + ' sesi · sheet per parameter panel' +
        (loaded.params.length ? ' + Hasil Uji (' + loaded.params.length + ' parameter lab)' : '') + '. Periksa nilai, lalu Push Data.';
      if (!entries.length) showToast('Belum ada penilaian panelis untuk "' + record.id + '". Atur sesi & panelis di Schedule.', 'danger');
    } else {
      info = loaded.params.length + ' parameter. Isi Ulangan 1–3, lalu Push Data.';
    }

    renderWorkbook(sheets, record.id + '-' + Date.now());
    btnPush.disabled = false;
    sheetInfo.innerHTML = '<span class="badge ' + WORKSHEET_SOURCES[source].badge + ' me-1">' + WORKSHEET_SOURCES[source].label + '</span>' +
      '<span class="font-monospace fw-semibold">' + record.id + '</span> · ' + record.sampel + ' · ' + info;
    showToast('Data transaksi "' + record.id + '" ditarik ke lembar kerja.');
  });

  function readValue(r, c, sheetId) {
    var v = workbookRef.current ? workbookRef.current.getCellValue(r, c, { id: sheetId }) : null;
    if (v === null || v === undefined || v === '') return null;
    /* Strict: "0,5" → 0.5, but text like "Negatif" stays text instead of being half-parsed */
    var n = Number(String(v).trim().replace(',', '.'));
    return isNaN(n) ? String(v).trim() : n;
  }

  /* Panel sheets → entries [{ scheduleId, nik, answers }]; errors for values outside the scale */
  function readPanel(errors) {
    var byKey = {};
    loaded.panel.forEach(function (sheet) {
      var t = sheet.test;
      sheet.rows.forEach(function (row) {
        var e = row.entry, k = e.scheduleId + '|' + e.nik;
        var out = byKey[k] = byKey[k] || { scheduleId: e.scheduleId, nik: e.nik, name: e.name, answers: {} };
        var where = t.label + ' baris ' + (row.r + 1);
        if (t.type === 'triangle') {
          var pick = readValue(row.r, 4, sheet.id);
          if (pick === null) return;
          pick = String(pick);
          if (loaded.trx.codes.indexOf(pick) === -1) { errors.push(where + ' (kode ' + pick + ' tidak ada)'); return; }
          out.answers[t.param] = { pick: pick };
          return;
        }
        var ans = out.answers[t.param] = out.answers[t.param] || (t.type === 'ranking' ? { ranks: {} } : { scores: {}, jar: {} });
        var c = 5;
        if (t.type === 'ranking') {
          t.atribut.forEach(function (a) {
            var v = readValue(row.r, c++, sheet.id);
            if (v === null) return;
            if (!(v >= 1 && v <= loaded.trx.codes.length)) { errors.push(where + ' (rank ' + a + ')'); return; }
            (ans.ranks[a] = ans.ranks[a] || {})[row.code] = v;
          });
          return;
        }
        t.atribut.forEach(function (a) {
          var v = readValue(row.r, c++, sheet.id);
          if (v === null) return;
          if (!(v >= 1 && v <= 9)) { errors.push(where + ' (' + a + ')'); return; }
          (ans.scores[row.code] = ans.scores[row.code] || {})[a] = v;
        });
        t.ketepatan.forEach(function (kk) {
          var v = readValue(row.r, c++, sheet.id);
          if (v === null) return;
          if ([1, 2, 3].indexOf(v) === -1) { errors.push(where + ' (JAR ' + kk + ')'); return; }
          (ans.jar[row.code] = ans.jar[row.code] || {})[kk] = v;
        });
      });
    });
    return Object.keys(byKey).map(function (k) { return byKey[k]; });
  }

  btnPush.addEventListener('click', function () {
    if (!loaded) return;
    var results = {}, missing = [];
    loaded.params.forEach(function (p, i) {
      var r = i + 1, values = [];
      for (var c = COL.u1; c <= COL.u3; c++) {
        var v = readValue(r, c, loaded.paramSheetId);
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

    var panelStats = null;
    if (loaded.trx) {
      var errors = [];
      var entries = readPanel(errors);
      if (errors.length) {
        showToast('Nilai di luar skala: ' + errors.slice(0, 4).join(', ') + (errors.length > 4 ? ', …' : '') + '.', 'danger');
        return;
      }
      var empty = loaded.trx.tests.filter(function (t) {
        return !entries.some(function (e) { return e.answers[t.param]; });
      });
      if (empty.length) {
        showToast('Belum ada nilai panelis untuk: ' + empty.map(function (t) { return t.label; }).join(', ') + '.', 'danger');
        return;
      }
      panelStats = { at: new Date().toISOString(), codes: loaded.trx.codes, oddCode: loaded.trx.oddCode, panelists: entries.length, tests: panelStatsFor(loaded.trx, entries) };
    }

    var id = loaded.record.id;
    pushWorksheetResults(loaded.source, id, loaded.params.length ? results : null, loaded.record.analis || null, panelStats);
    showToast('Data di-push ke "' + id + '"' + (panelStats ? ' (statistik ' + panelStats.panelists + ' panelis)' : '') + '. Laporan masuk ke Report sebagai Draft.');
    loaded = null;
    btnPush.disabled = true;
    sheetInfo.textContent = 'Pilih No. ID Transaksi (Internal / Sensory / ASLT), lalu Tarik Data. Sensory / ASLT ikut menarik nilai panelis dari booth.';
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
