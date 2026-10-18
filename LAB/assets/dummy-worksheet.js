/* ---------- Shared worksheet ↔ transaction bridge (design-only, localStorage-backed) ----------
   Flow: Internal / Sensory / ASLT transactions → Excel "Tarik Data" (rows per parameter; Sensory /
   ASLT also get one sheet per panel test with every panelist × sample code from the booth) → analyst
   fills Ulangan → "Push Data" writes the results onto that No. ID Transaksi → the transaction shows
   up in Report as a Draft report. External requests never reach Excel or Report: they end at
   Sample Delivery (Confirmed) and the vendor lab issues its own COA.
   Needs dummy-parameters.js, dummy-requests.js and dummy-aslt-sensory-requests.js loaded first. */

var WORKSHEET_SENSORY_PARAM_LABEL = {
  'internal-rating': 'Internal Rating',
  'ranking': 'Ranking',
  'triangle': 'Triangle (Discrimination)',
  'quality-monitoring': 'Quality Monitoring'
};

var WORKSHEET_SOURCES = {
  internal: { label: 'Internal', badge: 'bg-primary-transparent' },
  sensory: { label: 'Sensory', badge: 'bg-warning-transparent' },
  aslt: { label: 'ASLT', badge: 'bg-success-transparent' }
};

function worksheetSlug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* Rows the worksheet gets for one transaction: [{ key, text, unit, spec, sub }]; sub = vendor lab of
   an Internal subkontrak parameter (its result is typed from the vendor certificate) */
function worksheetParamsFor(source, record) {
  if (!record) return [];
  if (source === 'internal') {
    return (record.paramsDiterima || record.params || []).map(function (code) {
      var p = labParameter('Internal', code) || { text: code, unit: '-', spec: '-' };
      return { key: code, text: p.text, unit: p.unit, spec: p.spec, sub: paramSubkontrak(record, code), retest: retestLabelFor(record, code) };
    });
  }
  if (source === 'aslt') {
    return String(record.param || '').split(/,|&/).map(function (s) { return s.trim(); }).filter(Boolean).map(function (t) {
      return { key: worksheetSlug(t), text: t, unit: '-', spec: record.rejection || '-' };
    });
  }
  if (source === 'sensory') {
    /* From the form: one row per parameter × ketepatan (atribut/ketepatan depend on the parameter) */
    if (record.atributMap && Object.keys(record.atributMap).length) {
      var rows = [];
      Object.keys(record.atributMap).forEach(function (param) {
        var label = WORKSHEET_SENSORY_PARAM_LABEL[param] || param;
        (record.atributMap[param].ketepatan || []).forEach(function (k) {
          rows.push({ key: param + '-' + worksheetSlug(k), text: label + ' — ' + k, unit: 'Scale 1-9', spec: 'Min. 6.0' });
        });
      });
      return rows;
    }
    /* Older seed records: one row per blind code */
    var seen = {};
    return (record.blindCodes || []).filter(function (c) { return seen[c] ? false : (seen[c] = true); }).map(function (code) {
      return { key: 'code-' + code, text: 'Sample Score, Code ' + code, unit: 'Scale 1-9', spec: 'Min. 6.0' };
    });
  }
  return [];
}

function worksheetGetRecord(source, id) {
  if (source === 'internal') return getRequestById(id);
  if (source === 'sensory') return getSensoryRequestById(id);
  if (source === 'aslt') return getAsltRequestById(id);
  return null;
}

function worksheetUpdateRecord(source, id, patch) {
  if (source === 'internal') return updateRequest(id, patch);
  if (source === 'sensory') return updateSensoryRequest(id, patch);
  if (source === 'aslt') return updateAsltRequest(id, patch);
  return null;
}

/* Transactions in Excel's Tarik Data: Internal once the SPK is issued (Confirmed), Sensory / ASLT
   while running. They stay while their report is Draft, so results can be pulled and pushed again
   (e.g. a subkontrak certificate arrives later); a Final report drops them. */
/* Excel may only write while the report is not issued and not under TCM approval
   (no report yet, or Draft — also a Draft reopened by a Re-test) */
function reportOpenForExcel(r) {
  return !r.reportStatus || r.reportStatus === 'Draft';
}

function getWorksheetTransactions() {
  var out = [];
  getRequests().forEach(function (r) {
    if (r.step === 'Done' && reportOpenForExcel(r)) out.push({ source: 'internal', record: r });
  });
  getSensoryRequests().forEach(function (r) {
    if (r.step === 'Running' && reportOpenForExcel(r)) out.push({ source: 'sensory', record: r });
  });
  getAsltRequests().forEach(function (r) {
    if (r.step === 'Running' && reportOpenForExcel(r)) out.push({ source: 'aslt', record: r });
  });
  return out;
}

/* Lab parameters that stay in the "Ulangan" worksheet when the transaction also runs a sensory
   panel: Sensory has none (the panel sheets replace them), ASLT keeps its non-organoleptic ones. */
function worksheetLabParams(source, record) {
  if (source === 'sensory') return [];
  return worksheetParamsFor(source, record).filter(function (p) { return !/organoleptik/i.test(p.text); });
}

/* Hasil of one parameter from its Ulangan: average of numbers (3 decimals), else the first value
   (text results like "Negatif"). Used by Excel Push Data and the Draft report edit. */
function worksheetResultOf(values) {
  var nums = values.filter(function (v) { return typeof v === 'number'; });
  return nums.length === values.length
    ? String(Math.round(nums.reduce(function (a, b) { return a + b; }, 0) / nums.length * 1000) / 1000)
    : String(values[0]);
}

/* Push Data (repeatable while the report is Draft; each push replaces the results):
   results = { paramKey: { values: [..], result: '..' } }; panelStats from the panel sheets (Sensory / ASLT).
   Every changed result is appended to the record's resultLog (cl. 7.5.2), so a value that is pushed
   again stays traceable. firstPushAt + pushedAt give the testing period printed on the LHU. */
function pushWorksheetResults(source, id, results, analis, panelStats) {
  var r = worksheetGetRecord(source, id) || {};
  var now = new Date().toISOString();
  var patch = { results: results, analisHasil: analis || null, reportStatus: 'Draft', pushedAt: now, firstPushAt: r.firstPushAt || now };
  if (results) patch.resultLog = resultLogWith(r, results, 'Pushed');
  if (panelStats) patch.panelStats = panelStats;
  return worksheetUpdateRecord(source, id, patch);
}

/* Save Raw Data (Excel, Internal): what the analyst typed is kept as soon as it is typed, before any
   Push (cl. 7.5.1 — records made at the time). rawData = { code: { values, at, by } }; Pull Data
   brings it back. entries = { recordId: { code: values[] } } → number of values saved */
function saveWorksheetRawData(entries) {
  var count = 0;
  Object.keys(entries).forEach(function (id) {
    var r = getRequestById(id);
    var raw = Object.assign({}, r.rawData);
    var changes = {};
    Object.keys(entries[id]).forEach(function (code) {
      var values = entries[id][code];
      var prev = raw[code] || (r.results || {})[code];
      if (prev && JSON.stringify(prev.values) === JSON.stringify(values)) return;
      raw[code] = { values: values, at: nowStamp(), by: typeof currentRole === 'function' ? currentRole().name : '-' };
      changes[code] = { values: values, result: worksheetResultOf(values) };
      count++;
    });
    if (Object.keys(changes).length) updateRequest(id, { rawData: raw, resultLog: resultLogWith(r, changes, 'Raw data recorded') });
  });
  return count;
}

/* Report list: every transaction with a report (Draft or Final): Internal, Sensory, ASLT */
function getReportRows() {
  var rows = [];
  getRequests().forEach(function (r) {
    if (r.reportStatus) rows.push({ source: 'internal', record: r });
  });
  getSensoryRequests().forEach(function (r) { if (r.reportStatus) rows.push({ source: 'sensory', record: r }); });
  getAsltRequests().forEach(function (r) { if (r.reportStatus) rows.push({ source: 'aslt', record: r }); });
  return rows;
}
