/* ---------- Shared worksheet ↔ transaction bridge (design-only, localStorage-backed) ----------
   Flow: Internal / Sensory / ASLT transactions → Excel "Tarik Data" (rows per parameter; Sensory /
   ASLT also get one sheet per panel test with every panelist × sample code from the booth) → analyst
   fills Ulangan → "Push Data" writes the results onto that No. ID Transaksi → the transaction shows
   up in Report as a Draft report. External requests never reach Excel or Report: they end at
   Sample Delivery (Confirmed) and the vendor lab issues its own COA.
   Needs dummy-requests.js and dummy-aslt-sensory-requests.js loaded first. */

/* Internal parameter catalogue: name, unit, spec (method lives in internal-form.js / report-form.js) */
var WORKSHEET_PARAM_INTERNAL = {
  moisture: { text: 'Moisture (Kadar Air)', unit: '% b/b', spec: 'Maks. 3.0' },
  fat: { text: 'Kadar Lemak (Fat)', unit: '% b/b', spec: '18.0 - 22.0' },
  ffa: { text: 'FFA (Free Fatty Acid)', unit: '% b/b', spec: 'Maks. 0.5' },
  protein: { text: 'Kadar Protein', unit: '% b/b', spec: 'Min. 8.0' },
  salmonella: { text: 'Salmonella sp.', unit: '/25g', spec: 'Negatif' },
  alt: { text: 'Angka Lempeng Total (ALT)', unit: 'CFU/g', spec: 'Maks. 1 x 10⁴' },
  pb: { text: 'Cemaran Logam (Pb)', unit: 'mg/kg', spec: 'Maks. 0.5' }
};

var WORKSHEET_SENSORY_PARAM_LABEL = {
  'internal-rating': 'Internal Rating',
  'ranking': 'Ranking',
  'triangle': 'Triangle (Pembeda)',
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

/* Rows the worksheet gets for one transaction: [{ key, text, unit, spec }] */
function worksheetParamsFor(source, record) {
  if (!record) return [];
  if (source === 'internal') {
    return (record.params || []).map(function (code) {
      var p = WORKSHEET_PARAM_INTERNAL[code] || { text: code, unit: '-', spec: '-' };
      return { key: code, text: p.text, unit: p.unit, spec: p.spec };
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
          rows.push({ key: param + '-' + worksheetSlug(k), text: label + ' — ' + k, unit: 'Skala 1-9', spec: 'Min. 6.0' });
        });
      });
      return rows;
    }
    /* Older seed records: one row per blind code */
    var seen = {};
    return (record.blindCodes || []).filter(function (c) { return seen[c] ? false : (seen[c] = true); }).map(function (code) {
      return { key: 'kode-' + code, text: 'Skor Sampel Kode ' + code, unit: 'Skala 1-9', spec: 'Min. 6.0' };
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

/* Transactions waiting for results in Excel: Internal after labeling (handed to the analyst),
   Sensory / ASLT while running. Pushed ones (reportStatus set) drop out. */
function getWorksheetTransactions() {
  var out = [];
  getRequests().forEach(function (r) {
    if (r.step === 'Selesai' && !r.reportStatus) out.push({ source: 'internal', record: r });
  });
  getSensoryRequests().forEach(function (r) {
    if (r.step === 'Berjalan' && !r.reportStatus) out.push({ source: 'sensory', record: r });
  });
  getAsltRequests().forEach(function (r) {
    if (r.step === 'Berjalan' && !r.reportStatus) out.push({ source: 'aslt', record: r });
  });
  return out;
}

/* Lab parameters that stay in the "Ulangan" worksheet when the transaction also runs a sensory
   panel: Sensory has none (the panel sheets replace them), ASLT keeps its non-organoleptic ones. */
function worksheetLabParams(source, record) {
  if (source === 'sensory') return [];
  return worksheetParamsFor(source, record).filter(function (p) { return !/organoleptik/i.test(p.text); });
}

/* Push Data: results = { paramKey: { values: [..], result: '..' } }; panelStats from the panel sheets (Sensory / ASLT) */
function pushWorksheetResults(source, id, results, analis, panelStats) {
  var patch = { results: results, analisHasil: analis || null, reportStatus: 'Draft', pushedAt: new Date().toISOString() };
  if (panelStats) patch.panelStats = panelStats;
  if (source === 'internal') patch.step = 'Draft Report';
  return worksheetUpdateRecord(source, id, patch);
}

/* Report list: every transaction with a report (Draft or Final): Internal, Sensory, ASLT */
function getReportRows() {
  var rows = [];
  getRequests().forEach(function (r) {
    if (r.reportStatus || r.step === 'Draft Report') rows.push({ source: 'internal', record: r });
  });
  getSensoryRequests().forEach(function (r) { if (r.reportStatus) rows.push({ source: 'sensory', record: r }); });
  getAsltRequests().forEach(function (r) { if (r.reportStatus) rows.push({ source: 'aslt', record: r }); });
  return rows;
}
