/* ---------- HOLABSYS Excel page (FortuneSheet + Tarik Data / Push Data + fullscreen) ---------- */

// The FortuneSheet UMD build calls Node's crypto.randomFillSync (via uuid) on the browser
// crypto global. Not needed in the React app, where the bundler resolves the browser build.
if (window.crypto && !window.crypto.randomFillSync) {
  window.crypto.randomFillSync = function (arr) { return window.crypto.getRandomValues(arr); };
}

/* Worksheet columns. Ulangan 1–3 are filled by the analyst; Rata-rata is a formula. */
var SHEET_HEADER = ['Transaction ID', 'Type', 'Sample', 'Parameter', 'Replicate 1', 'Replicate 2', 'Replicate 3', 'Average', 'Unit', 'Specification', 'Analyst'];
var COL = { u1: 4, u3: 6, avg: 7 };

/* Panel sheets (Sensory / ASLT): the first columns identify the panelist row */
var PANEL_BASE_HEADER = ['Session', 'Booth', 'NIK', 'Panelist Name'];

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
  /* The Analyst (ANL) fills the sheet; only the Lab Coordinator (CRL) pushes results to the report,
     since the CRL reviews and submits that report */
  function canPush() { return currentRole().code === 'CRL'; }
  function applyPushRole() { btnPush.classList.toggle('d-none', !canPush()); }
  applyPushRole();
  document.addEventListener('holabsys:rolechange', applyPushRole);
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
    var analis = analisLabel(record.analis);
    params.forEach(function (p, i) {
      var r = i + 1, xl = r + 1;
      [record.id, WORKSHEET_SOURCES[source].label, record.sampel, p.text + (p.sub ? ' [Subcontract: ' + p.sub + ']' : '') + (p.retest ? ' [' + p.retest + ']' : '')].forEach(function (v, c) {
        celldata.push({ r: r, c: c, v: cell(v) });
      });
      /* Pulling a Draft again brings back the values pushed before */
      var prev = record.results && record.results[p.key];
      (prev ? prev.values : []).forEach(function (v, j) { celldata.push({ r: r, c: COL.u1 + j, v: cell(v) }); });
      var avg = prev && !isNaN(Number(prev.result)) ? Number(prev.result) : null;
      celldata.push({ r: r, c: COL.avg, v: formula('=IF(COUNT(E' + xl + ':G' + xl + ')=0,"",ROUND(AVERAGE(E' + xl + ':G' + xl + '),3))', avg) });
      celldata.push({ r: r, c: 8, v: cell(p.unit) });
      celldata.push({ r: r, c: 9, v: cell(p.spec) });
      celldata.push({ r: r, c: 10, v: cell(analis) });
    });
    return {
      name: 'Test Results', id: id, order: order, status: order === 0 ? 1 : 0,
      row: Math.max(40, params.length + 10), column: 16, celldata: celldata,
      /* Rata-rata formulas must be in the calc chain, or FortuneSheet won't recalc them on edit */
      calcChain: params.map(function (p, i) { return { r: i + 1, c: COL.avg, id: id }; }),
      config: { columnlen: { 0: 140, 1: 80, 2: 200, 3: 200, 7: 90, 9: 150, 10: 120 } }
    };
  }

  /* ---------- panel sheets: one per test, one row per panelist × code ---------- */
  function panelEntries(trx) {
    /* Sesi column: session date + Sesi label (Sensory slot / ASLT order); rows ordered by session, then time */
    var info = {};
    panelSessionsForTrx(trx.id).forEach(function (s) {
      info[s.id] = { label: s.start.slice(8, 10) + '/' + s.start.slice(5, 7) + ' ' + s.sesiLabel.replace(/ \(.*\)$/, ''), start: s.start };
    });
    return panelScoresForTrx(trx.id).map(function (e) {
      var i = info[e.scheduleId];
      return Object.assign({ sesi: i ? i.label : e.scheduleId, sesiStart: i ? i.start : '' }, e);
    }).sort(function (a, b) { return a.sesiStart < b.sesiStart ? -1 : (a.sesiStart > b.sesiStart ? 1 : (a.at < b.at ? -1 : 1)); });
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
    var cols, widths = { 0: 100, 1: 60, 2: 110, 3: 160, 4: 100 };

    if (t.type === 'triangle') {
      /* The odd cup differs per panelist (balanced patterns): each row carries its own */
      cols = PANEL_BASE_HEADER.concat(['Serving Pattern', 'Odd Code', 'Code Picked', 'Correct (1/0)']);
      cols.forEach(function (h, c) { put(0, c, cell(h, { bl: 1 })); });
      widths[5] = 110; widths[6] = 110; widths[7] = 100;
      entries.forEach(function (e) {
        r++;
        var a = (e.answers || {})[t.param] || {};
        var odd = panelOddCodeOf(e);
        base(r, e);
        put(r, 4, cell(e.plan && e.plan.pattern ? e.plan.pattern : ''));
        put(r, 5, textCell(odd || ''));
        put(r, 6, textCell(a.pick || ''));
        putF(r, 7, '=IF(G' + (r + 1) + '="","",IF(G' + (r + 1) + '=F' + (r + 1) + ',1,0))',
          a.pick ? (String(a.pick) === String(odd) ? 1 : 0) : null);
        rows.push({ r: r, entry: e });
      });
      var last = r + 1;
      r += 2;
      put(r, 3, cell('Statistics', { bl: 1 }));
      put(r + 1, 3, cell('Serving pattern')); put(r + 1, 7, cell('Balanced, 6 patterns'));
      put(r + 2, 3, cell('Panelist count')); putF(r + 2, 7, '=COUNT(H2:H' + last + ')', colNums(7, 2, last).length);
      put(r + 3, 3, cell('Correct count')); putF(r + 3, 7, '=SUM(H2:H' + last + ')', colNums(7, 2, last).reduce(function (x, y) { return x + y; }, 0));
      put(r + 4, 3, cell('Min. correct (α 0.05)')); put(r + 4, 7, cell(panelTriangleCritical(entries.length)));
      r += 4;
    } else {
      /* rating: atribut (1–9) + JAR ketepatan (1 Kurang · 2 Pas · 3 Terlalu); ranking: rank per atribut */
      var valueCols = t.type === 'ranking'
        ? t.atribut.map(function (a) { return { kind: 'rank', key: a, head: 'Rank ' + a }; })
        : t.atribut.map(function (a) { return { kind: 'score', key: a, head: a + ' (1-9)' }; })
            .concat(t.ketepatan.map(function (k) { return { kind: 'jar', key: k, head: 'JAR ' + k + ' (1/2/3)' }; }));
      /* Urutan Sajian = position of this code in the panelist's serving order (Williams design) */
      cols = PANEL_BASE_HEADER.concat(['Sample Code', 'Serving Order']).concat(valueCols.map(function (v) { return v.head; }));
      widths[5] = 110;
      cols.forEach(function (h, c) { put(0, c, cell(h, { bl: 1 })); });
      valueCols.forEach(function (v, i) { widths[6 + i] = 120; });
      var blocks = [];
      trx.codes.forEach(function (code) {
        var first = r + 1;
        entries.forEach(function (e) {
          r++;
          var a = (e.answers || {})[t.param] || {};
          base(r, e);
          put(r, 4, textCell(code));
          put(r, 5, cell(e.plan && e.plan.order ? e.plan.order.indexOf(code) + 1 : ''));
          valueCols.forEach(function (v, i) {
            var val = v.kind === 'score' ? ((a.scores || {})[code] || {})[v.key]
              : v.kind === 'jar' ? ((a.jar || {})[code] || {})[v.key]
              : ((a.ranks || {})[v.key] || {})[code];
            put(r, 6 + i, cell(val == null ? '' : val));
          });
          rows.push({ r: r, entry: e, code: code });
        });
        blocks.push({ code: code, from: first + 1, to: r + 1 });
      });
      r += 2;
      put(r, 3, cell('Statistics', { bl: 1 }));
      blocks.forEach(function (b) {
        var labels = t.type === 'ranking' ? ['Rank sum', 'Average rank', 'n'] : ['Average (JAR: % Just Right)', 'SD', 'n'];
        labels.forEach(function (label, li) {
          r++;
          put(r, 3, cell(label)); put(r, 4, textCell(b.code, { bl: 1 }));
          valueCols.forEach(function (v, i) {
            var c = 6 + i, rg = colLetter(c) + b.from + ':' + colLetter(c) + b.to;
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
      name: 'Test Results', order: 0, status: 1, row: 40, column: 16,
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
    /* Internal has its own tab (per-parameter sheets); this list is Sensory / ASLT only */
    trxSelect.innerHTML = '<option value="">Select Transaction ID</option>' + ['sensory', 'aslt'].map(function (src) {
      if (!groups[src]) return '';
      return '<optgroup label="' + WORKSHEET_SOURCES[src].label + '">' + groups[src].map(function (r) {
        var n = src === 'internal' ? 0 : panelScoresForTrx(r.id).length;
        return '<option value="' + src + '|' + r.id + '">' + r.id + ' — ' + r.sampel + (n ? ' (' + n + ' panelist scores)' : '') +
          (r.reportStatus === 'Draft' ? ' · Report Draft, push again' : '') + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    btnPull.disabled = true;
  }

  trxSelect.addEventListener('change', function () { btnPull.disabled = !trxSelect.value; });

  btnPull.addEventListener('click', function () {
    if (activeTab === 'internal') { pullInternal(false); return; }
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
      info = entries.length + ' panelist scores from ' + sessions.length + ' session(s) · one sheet per panel parameter' +
        (loaded.params.length ? ' + Test Results (' + loaded.params.length + ' lab parameters)' : '') + '. Check the values, then Push Data.';
      if (!entries.length) ToastService.showWarning('No panelist scores yet for "' + record.id + '". Set up sessions & panelists in Schedule.');
    } else {
      info = loaded.params.length + ' parameters. Fill in Replicates 1–3, then Push Data.';
    }

    renderWorkbook(sheets, record.id + '-' + Date.now());
    btnPush.disabled = false;
    sheetInfo.innerHTML = '<span class="badge ' + WORKSHEET_SOURCES[source].badge + ' me-1">' + WORKSHEET_SOURCES[source].label + '</span>' +
      '<span class="font-monospace fw-semibold">' + record.id + '</span> · ' + record.sampel + ' · ' + info;
    ToastService.showSuccess('Transaction "' + record.id + '" pulled into the worksheet.');
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
        var out = byKey[k] = byKey[k] || { scheduleId: e.scheduleId, nik: e.nik, name: e.name, plan: e.plan, answers: {} };
        var where = t.label + ' row ' + (row.r + 1);
        if (t.type === 'triangle') {
          var pick = readValue(row.r, 6, sheet.id);
          if (pick === null) return;
          pick = String(pick);
          if (loaded.trx.codes.indexOf(pick) === -1) { errors.push(where + ' (code ' + pick + ' does not exist)'); return; }
          out.answers[t.param] = { pick: pick };
          return;
        }
        var ans = out.answers[t.param] = out.answers[t.param] || (t.type === 'ranking' ? { ranks: {} } : { scores: {}, jar: {} });
        var c = 6;
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
    if (!canPush()) { ToastService.showWarning('Only the Lab Coordinator (CRL) can push results to the report.'); return; }
    if (!loaded) return;
    if (loaded.mode === 'internal') { pushInternal(); return; }
    var results = {}, missing = [];
    loaded.params.forEach(function (p, i) {
      var r = i + 1, values = [];
      for (var c = COL.u1; c <= COL.u3; c++) {
        var v = readValue(r, c, loaded.paramSheetId);
        if (v !== null) values.push(v);
      }
      if (!values.length) { missing.push(p.text); return; }
      results[p.key] = { values: values, result: worksheetResultOf(values) };
    });

    /* Partial push is fine (the Draft report flags what is missing), but not an empty one */
    if (loaded.params.length && missing.length === loaded.params.length && !loaded.trx) {
      ToastService.showWarning('Fill in at least one result before Push Data.');
      return;
    }

    var panelStats = null;
    if (loaded.trx) {
      var errors = [];
      var entries = readPanel(errors);
      if (errors.length) {
        ToastService.showWarning('Values out of scale: ' + errors.slice(0, 4).join(', ') + (errors.length > 4 ? ', …' : '') + '.');
        return;
      }
      var empty = loaded.trx.tests.filter(function (t) {
        return !entries.some(function (e) { return e.answers[t.param]; });
      });
      if (empty.length) {
        ToastService.showWarning('No panelist scores yet for: ' + empty.map(function (t) { return t.label; }).join(', ') + '.');
        return;
      }
      panelStats = { at: new Date().toISOString(), codes: loaded.trx.codes, panelists: entries.length, tests: panelStatsFor(loaded.trx, entries) };
    }

    var id = loaded.record.id;
    var again = loaded.record.reportStatus === 'Draft';
    pushWorksheetResults(loaded.source, id, loaded.params.length ? results : null, analisLabel(loaded.record.analis) || null, panelStats);
    ToastService.showSuccess('Data pushed to "' + id + '"' + (panelStats ? ' (statistics of ' + panelStats.panelists + ' panelists)' : '') +
      (again ? '. Draft report updated.' : '. The report is now in Report as a Draft.'));
    if (missing.length) ToastService.showWarning(missing.length + ' parameter(s) without a result, flagged in the Draft report. Push again once the results are in.');
    loaded = null;
    btnPush.disabled = true;
    sheetInfo.textContent = PANEL_INFO;
    fillTransactions();
    renderWorkbook(emptySheet(), 'empty-' + Date.now());
  });


  /* ---------- Internal tab: one sheet per parameter, rows per Sample No. (duplo) ----------
     Like the lab's Fiskim workbook: every open Internal request (Confirmed, report not Final) puts
     its accepted parameters on the sheet of that parameter, 2 rows per Sample No. (the lab label
     of that parameter's lab). The CRL pushes only the samples whose Push cell holds anything. */
  var INTERNAL_HEADER = ['Sample No.', 'Request ID', 'Sample', 'Result', 'AVG', 'RPD < 10%', 'Inference', 'Method', 'Unit', 'Push'];
  var IC = { result: 3, avg: 4, rpd: 5, inference: 6, push: 9 };
  var PANEL_INFO = 'Select a Sensory / ASLT Transaction ID, then Pull Data. The panelist scores come from the booth. While the report is still Draft, data can be pulled & pushed again.';
  var INTERNAL_INFO = 'Pull Data loads every open Internal request, one sheet per parameter (2 rows per Sample No.). Type the results, put anything in Push for the samples to send, then Push Data.';
  var activeTab = 'internal';

  function internalSheets() {
    var byCode = {};
    getWorksheetTransactions().filter(function (t) { return t.source === 'internal'; }).forEach(function (t) {
      worksheetParamsFor('internal', t.record).forEach(function (p) {
        (byCode[p.key] = byCode[p.key] || []).push({ record: t.record, p: p });
      });
    });
    var order = labParameters('Internal').map(function (p) { return p.value; });
    return Object.keys(byCode).sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); }).map(function (code, si) {
      var master = labParameter('Internal', code) || { text: code, method: '-', unit: '-' };
      var id = 'int-' + code;
      var celldata = INTERNAL_HEADER.map(function (h, c) { return { r: 0, c: c, v: cell(h, { bl: 1 }) }; });
      var calc = [], rows = [];
      byCode[code].sort(function (a, b) { return sampleNoFor(a.record, code) < sampleNoFor(b.record, code) ? -1 : 1; }).forEach(function (it, i) {
        var r = 1 + i * 2, x1 = r + 1, x2 = r + 2; // Excel row numbers of the duplo pair
        var prev = it.record.results && it.record.results[code];
        var vals = prev ? prev.values : [];
        var vendorMethod = it.p.sub && labParameter('External', code) ? labParameter('External', code).method : master.method;
        [r, r + 1].forEach(function (row, k) {
          celldata.push({ r: row, c: 0, v: textCell(sampleNoFor(it.record, code) || '-', { bl: k ? 0 : 1 }) });
          celldata.push({ r: row, c: 1, v: cell(it.record.id) });
          celldata.push({ r: row, c: 2, v: cell(it.record.sampel + (it.p.sub ? ' [Subcontract: ' + it.p.sub + ']' : '') + (it.p.retest ? ' [' + it.p.retest + ']' : '')) });
          if (vals[k] != null) celldata.push({ r: row, c: IC.result, v: cell(vals[k]) });
          celldata.push({ r: row, c: 7, v: cell(vendorMethod) });
          celldata.push({ r: row, c: 8, v: cell(master.unit) });
        });
        var nums = vals.filter(function (v) { return typeof v === 'number'; });
        var avg = nums.length ? round(nums.reduce(function (a, b) { return a + b; }, 0) / nums.length, 3) : null;
        var rpd = nums.length === 2 && avg ? round(Math.abs(nums[0] - nums[1]) / avg, 4) : null;
        celldata.push({ r: r, c: IC.avg, v: formula('=IF(COUNT(D' + x1 + ':D' + x2 + ')=0,"",ROUND(AVERAGE(D' + x1 + ':D' + x2 + '),3))', avg) });
        celldata.push({ r: r, c: IC.rpd, v: formula('=IF(COUNT(D' + x1 + ':D' + x2 + ')<2,"",ROUND(ABS(D' + x1 + '-D' + x2 + ')/AVERAGE(D' + x1 + ':D' + x2 + '),4))', rpd) });
        celldata.push({ r: r, c: IC.inference, v: formula('=IF(F' + x1 + '="","",IF(F' + x1 + '<0.1,"Precise","Repeat"))', rpd == null ? null : (rpd < 0.1 ? 'Precise' : 'Repeat')) });
        calc.push({ r: r, c: IC.avg, id: id }, { r: r, c: IC.rpd, id: id }, { r: r, c: IC.inference, id: id });
        rows.push({ r: r, record: it.record });
      });
      return {
        sheet: { name: master.text, id: id, order: si, status: si === 0 ? 1 : 0, row: Math.max(40, rows.length * 2 + 10), column: 14,
          celldata: celldata, calcChain: calc, config: { columnlen: { 0: 95, 1: 130, 2: 230, 6: 90, 7: 170, 9: 70 } } },
        meta: { id: id, code: code, text: master.text, rows: rows }
      };
    });
  }

  function emptyInternalSheet() {
    return [{ name: 'Internal', order: 0, status: 1, row: 40, column: 14,
      celldata: INTERNAL_HEADER.map(function (h, c) { return { r: 0, c: c, v: cell(h, { bl: 1 }) }; }),
      config: { columnlen: { 0: 95, 1: 130, 2: 230, 7: 170 } } }];
  }

  function pullInternal(silent) {
    var built = internalSheets();
    if (!built.length) {
      loaded = null;
      btnPush.disabled = true;
      renderWorkbook(emptyInternalSheet(), 'int-empty-' + Date.now());
      sheetInfo.textContent = 'No open Internal requests to test.';
      if (!silent) ToastService.showWarning('No open Internal requests to pull.');
      return;
    }
    loaded = { mode: 'internal', sheets: built.map(function (b) { return b.meta; }) };
    renderWorkbook(built.map(function (b) { return b.sheet; }), 'int-' + Date.now());
    btnPush.disabled = false;
    var reqs = {};
    built.forEach(function (b) { b.meta.rows.forEach(function (row) { reqs[row.record.id] = true; }); });
    sheetInfo.innerHTML = '<span class="badge ' + WORKSHEET_SOURCES.internal.badge + ' me-1">Internal</span>' + Object.keys(reqs).length +
      ' open request(s) · ' + built.length + ' parameter sheet(s). Type the results, put anything in Push for the samples to send, then Push Data.';
    if (!silent) ToastService.showSuccess('Internal worksheet pulled: ' + built.length + ' parameter sheet(s).');
  }

  function pushInternal() {
    var byRecord = {}, empty = [], count = 0;
    loaded.sheets.forEach(function (sheet) {
      sheet.rows.forEach(function (row) {
        var marked = readValue(row.r, IC.push, sheet.id) !== null || readValue(row.r + 1, IC.push, sheet.id) !== null;
        if (!marked) return;
        var values = [readValue(row.r, IC.result, sheet.id), readValue(row.r + 1, IC.result, sheet.id)].filter(function (v) { return v !== null; });
        var label = sampleNoFor(row.record, sheet.code) + ' ' + sheet.text;
        if (!values.length) { empty.push(label); return; }
        var rec = byRecord[row.record.id] = byRecord[row.record.id] || { record: row.record, results: {} };
        rec.results[sheet.code] = { values: values, result: worksheetResultOf(values) };
        count++;
      });
    });
    if (empty.length) {
      ToastService.showWarning('Marked for Push without a result: ' + empty.join(', ') + '.');
      return;
    }
    var ids = Object.keys(byRecord);
    if (!ids.length) {
      ToastService.showWarning('Put anything in the Push column of the samples to send first.');
      return;
    }
    ids.forEach(function (id) {
      var fresh = worksheetGetRecord('internal', id);
      pushWorksheetResults('internal', id, Object.assign({}, fresh.results, byRecord[id].results), analisLabel(fresh.analis) || null, null);
    });
    ToastService.showSuccess('Pushed ' + count + ' result(s) to ' + ids.length + ' request(s): ' + ids.join(', ') + '. Their Draft reports are updated.');
    pullInternal(true);
  }

  /* ---------- page tabs: Internal | Sensory & ASLT ---------- */
  var tabsNav = document.getElementById('excelTabs');
  var trxWrap = document.getElementById('trxWrap');
  function showTab(tab) {
    activeTab = tab;
    tabsNav.querySelectorAll('.nav-link').forEach(function (a) { a.classList.toggle('active', a.dataset.tab === tab); });
    trxWrap.classList.toggle('d-none', tab === 'internal');
    loaded = null;
    btnPush.disabled = true;
    if (tab === 'internal') {
      btnPull.disabled = false;
      sheetInfo.textContent = INTERNAL_INFO;
      renderWorkbook(emptyInternalSheet(), 'int-empty-' + Date.now());
    } else {
      fillTransactions();
      sheetInfo.textContent = PANEL_INFO;
      renderWorkbook(emptySheet(), 'empty-' + Date.now());
    }
  }
  tabsNav.addEventListener('click', function (e) {
    var a = e.target.closest('.nav-link');
    if (!a) return;
    e.preventDefault();
    showTab(a.dataset.tab);
  });

  showTab(/[?&]tab=panel\b/.test(location.search) ? 'panel' : 'internal');

  // FortuneSheet only re-measures its canvas on window resize, so forward every host size
  // change (initial layout settling, sidebar toggle, fullscreen) as one.
  new ResizeObserver(function () { window.dispatchEvent(new Event('resize')); }).observe(host);

  /* ---------- fullscreen ---------- */
  var card = document.getElementById('sheetCard');
  var btn = document.getElementById('btnFullscreen');

  btn.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else card.requestFullscreen().catch(function (e) { console.warn('Fullscreen refused by the browser:', e.message); });
  });

  document.addEventListener('fullscreenchange', function () {
    var on = document.fullscreenElement === card;
    btn.innerHTML = on
      ? '<i class="ri-fullscreen-exit-line me-1"></i><span>Exit Fullscreen</span>'
      : '<i class="ri-fullscreen-line me-1"></i><span>Fullscreen</span>';
  });
});
