/* ---------- Shared reagent & consumable stock (design-only, localStorage-backed) ----------
   One store for Master Data › Reagents & Stock, the Technical Review reagent check and the
   automatic deduction:
   - Technical Review (CRL saves the kaji ulang): first deduction, once per accepted parameter that
     the lab tests itself (Subcontract / Not Testable deduct nothing). record.reagentDeducted keeps
     the parameters already deducted, so saving the review again deducts nothing more.
   - Re-test (TCM, Report form): every re-test is a new run and deducts again for its parameters.
   Stock never goes below 0. A parameter set to Subcontract / Not Testable after the SPK (e.g. the
   instrument broke) gets its first run back (returnReagents) — only while nothing was tested yet. */
var REAGENTS_STORAGE_KEY = 'holabsys_reagen_data.en';
var REAGENT_LOGS_STORAGE_KEY = 'holabsys_reagen_logs.en';

var SEED_REAGENTS = [
  { c: 'RG-FK-001', n: 'Hexane p.a.', lab: 'Physicochemical', stok: 2.5, min: 5, u: 'L', ed: '12-2027', use: 'Fat Content (Soxhlet)' },
  { c: 'RG-FK-002', n: 'Concentrated H₂SO₄ 98%', lab: 'Physicochemical', stok: 8.0, min: 4, u: 'L', ed: '06-2028', use: 'Protein Content (Kjeldahl)' },
  { c: 'RG-FK-003', n: 'Kjeldahl Catalyst (tablet)', lab: 'Physicochemical', stok: 180, min: 100, u: 'tab', ed: '03-2027', use: 'Protein Content' },
  { c: 'RG-FK-004', n: 'KOH 0.1 N (ethanolic)', lab: 'Physicochemical', stok: 0.8, min: 2, u: 'L', ed: '10-2026', use: 'FFA' },
  { c: 'RG-FK-005', n: 'Nitric Acid HNO₃ 65%', lab: 'Physicochemical', stok: 3.0, min: 1, u: 'L', ed: '09-2028', use: 'Lead (Pb)' },
  { c: 'RG-MB-001', n: 'Plate Count Agar (PCA)', lab: 'Microbiology', stok: 1.2, min: 1, u: 'kg', ed: '02-2027', use: 'TPC' },
  { c: 'RG-MB-002', n: 'DRBC Agar', lab: 'Microbiology', stok: 0.3, min: 0.5, u: 'kg', ed: '11-2026', use: 'Yeast & Mold' },
  { c: 'RG-MB-003', n: 'Buffered Peptone Water', lab: 'Microbiology', stok: 2.0, min: 1, u: 'kg', ed: '08-2027', use: 'Salmonella, dilution' },
  { c: 'CS-001', n: 'Porcelain Crucible', lab: 'Physicochemical', stok: 46, min: 30, u: 'pcs', ed: '—', use: 'Moisture / Ash' }
];

var SEED_REAGENT_LOGS = [
  { tgl: '18-09-2026 09:12', reagen: 'Hexane p.a.', qty: '-0.25 L', ref: 'SPK/LAB/202609/0031 · Fat Content', oleh: 'Putri Ayuningtyas', src: 'Auto-deduct' },
  { tgl: '17-09-2026 14:40', reagen: 'Plate Count Agar (PCA)', qty: '-0.05 kg', ref: 'SPK/LAB/202609/0034 · TPC', oleh: 'Galih Saputra', src: 'Auto-deduct' },
  { tgl: '17-09-2026 10:05', reagen: 'Kjeldahl Catalyst (tablet)', qty: '-4 tab', ref: 'SPK/LAB/202609/0022 · Protein', oleh: 'Dimas Aditya', src: 'Auto-deduct' },
  { tgl: '15-09-2026 08:00', reagen: 'Concentrated H₂SO₄ 98%', qty: '+5 L', ref: 'PO-4500127710 · receipt', oleh: 'Siti Aminah', src: 'Manual' },
  { tgl: '14-09-2026 11:30', reagen: 'DRBC Agar', qty: '-0.05 kg', ref: 'SPK/LAB/202609/0019 · Yeast/Mold', oleh: 'Nur Aini', src: 'Auto-deduct' },
  { tgl: '12-09-2026 16:15', reagen: 'Porcelain Crucible', qty: '-2 pcs', ref: 'Broken during sample preparation', oleh: 'Dimas Aditya', src: 'Manual' }
];

/* Usage of one test run (duplo included) per Internal parameter: [{ c: reagent code, qty }] */
var REAGENT_USAGE = {
  moisture: [{ c: 'CS-001', qty: 2 }],
  fat: [{ c: 'RG-FK-001', qty: 0.25 }],
  ffa: [{ c: 'RG-FK-004', qty: 0.1 }],
  protein: [{ c: 'RG-FK-002', qty: 0.05 }, { c: 'RG-FK-003', qty: 4 }],
  ash: [{ c: 'CS-001', qty: 2 }],
  pb: [{ c: 'RG-FK-005', qty: 0.02 }],
  salmonella: [{ c: 'RG-MB-003', qty: 0.05 }],
  alt: [{ c: 'RG-MB-001', qty: 0.05 }, { c: 'RG-MB-003', qty: 0.02 }],
  yeast: [{ c: 'RG-MB-002', qty: 0.05 }],
  coliform: [{ c: 'RG-MB-003', qty: 0.03 }]
};

function getReagents() {
  try {
    var raw = localStorage.getItem(REAGENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_REAGENTS.map(function (r) { return Object.assign({}, r); });
  } catch (e) {
    return SEED_REAGENTS.map(function (r) { return Object.assign({}, r); });
  }
}
function getReagentLogs() {
  try {
    var raw = localStorage.getItem(REAGENT_LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : SEED_REAGENT_LOGS.slice();
  } catch (e) {
    return SEED_REAGENT_LOGS.slice();
  }
}
function saveReagents(list, logs) {
  localStorage.setItem(REAGENTS_STORAGE_KEY, JSON.stringify(list));
  if (logs) localStorage.setItem(REAGENT_LOGS_STORAGE_KEY, JSON.stringify(logs));
}

function reagentQty(n) { return String(Math.round(n * 100) / 100); }

/* Reagent check of the Technical Review for one parameter, from the live stock:
   fail = not enough for one run, warn = below the minimum after one run, ok otherwise.
   → { s, t } like the other checks, or null when the parameter uses no tracked reagent */
function reagentCheck(code) {
  var usage = REAGENT_USAGE[code];
  if (!usage) return null;
  var stock = getReagents();
  var rank = { ok: 0, warn: 1, fail: 2 };
  var worst = 'ok';
  var parts = usage.map(function (use) {
    var r = stock.filter(function (x) { return x.c === use.c; })[0];
    if (!r) return use.c + ' not in master';
    var after = r.stok - use.qty;
    var s = after < 0 ? 'fail' : (after < r.min ? 'warn' : 'ok');
    if (rank[s] > rank[worst]) worst = s;
    return r.n + ' ' + reagentQty(r.stok) + ' ' + r.u + (s === 'ok' ? '' : ' (min ' + reagentQty(r.min) + ' ' + r.u + ')');
  });
  return { s: worst, t: parts.join(', ') };
}

/* Deduct one run of the given parameters and write Auto-deduct log rows.
   ref: e.g. 'SPK/LAB/202610/0001 · Technical Review'. Returns the number of log rows written. */
/* Give back one run of reagents per parameter (Technical Review change after the SPK) → rows logged */
function returnReagents(codes, ref, by) {
  var stock = getReagents();
  var logs = getReagentLogs();
  var p = function (n) { return String(n).padStart(2, '0'); };
  var d = new Date();
  var stamp = p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  var rows = 0;
  codes.forEach(function (code) {
    var param = typeof labParameter === 'function' ? labParameter('Internal', code) : null;
    (REAGENT_USAGE[code] || []).forEach(function (use) {
      var r = stock.filter(function (x) { return x.c === use.c; })[0];
      if (!r) return;
      r.stok = Math.round((r.stok + use.qty) * 1000) / 1000;
      logs.unshift({ tgl: stamp, reagen: r.n, qty: '+' + reagentQty(use.qty) + ' ' + r.u,
        ref: ref + ' · ' + (param ? param.text : code), oleh: by, src: 'Auto-return' });
      rows++;
    });
  });
  if (rows) saveReagents(stock, logs);
  return rows;
}

function deductReagents(codes, ref, by) {
  var stock = getReagents();
  var logs = getReagentLogs();
  var p = function (n) { return String(n).padStart(2, '0'); };
  var d = new Date();
  var stamp = p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  var rows = 0;
  codes.forEach(function (code) {
    var param = typeof labParameter === 'function' ? labParameter('Internal', code) : null;
    (REAGENT_USAGE[code] || []).forEach(function (use) {
      var r = stock.filter(function (x) { return x.c === use.c; })[0];
      if (!r) return;
      r.stok = Math.max(0, Math.round((r.stok - use.qty) * 1000) / 1000);
      logs.unshift({ tgl: stamp, reagen: r.n, qty: '-' + reagentQty(use.qty) + ' ' + r.u,
        ref: ref + ' · ' + (param ? param.text : code), oleh: by, src: 'Auto-deduct' });
      rows++;
    });
  });
  if (rows) saveReagents(stock, logs);
  return rows;
}
