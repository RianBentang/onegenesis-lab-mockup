/* ---------- Shared dummy ASLT & Sensory request stores (design-only, localStorage-backed) ---------- */
var ASLT_STORAGE_KEY = 'holabsysAsltRequests.v2.en';
var SENSORY_STORAGE_KEY = 'holabsysSensoryRequests.v4.en';

var SEED_ASLT_REQUESTS = [
  {
    id: 'ASLT-202609-001', tanggal: '05-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Running', approvalIdx: 1,
    sampel: 'Chocolatos Wafer Stick 16g', kategori: 'NPL',
    suhuChamber: '25°C, 35°C, 45°C (75% RH)',
    kemasan: 'Pouch Alufo 3-Layer (O2TR < 0.5)',
    param: 'Moisture & Taste Organoleptic',
    timepoint: 'D-28 (In Progress)',
    rejection: 'Moisture > 3.0% / Score < 6.0',
    status: 'In Chamber',
    panel: { open: true, codes: ['415', '287', '603'], openedAt: '2026-09-24T08:00:00' }
  },
  {
    id: 'ASLT-202609-002', tanggal: '06-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Running', approvalIdx: 1,
    sampel: 'Maco Chocolate Wafer 120g', kategori: 'Trial',
    suhuChamber: '35°C, 45°C (75% RH)',
    kemasan: 'Metalized Film (WVTR < 1.0)',
    param: 'Moisture, FFA & Crispiness',
    timepoint: 'D-60 (Approaching Final)',
    rejection: 'Moisture > 3.2% / FFA > 0.5%',
    status: 'In Chamber'
  },
  {
    id: 'ASLT-202609-003', tanggal: '08-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Running', approvalIdx: 1,
    sampel: 'Pilus Fried Noodle Flavor 85g', kategori: 'Existing',
    suhuChamber: '45°C (75% RH)',
    kemasan: 'Pillow Pack Pillow Bag',
    param: 'Moisture & Peroxide Value (PV)',
    timepoint: 'D-90 (Observation Complete)',
    rejection: 'PV > 10 meq/kg',
    status: 'Final Physicochemical Check',
    reportStatus: 'Final', reportNo: 'LHU/LAB/202609/0031', analisHasil: 'Galih Saputra',
    results: { 'moisture': { values: [2.61, 2.58, 2.64], result: '2.61' }, 'peroxide-value-pv': { values: [4.2, 4.4, 4.3], result: '4.3' } }
  },
  {
    id: 'ASLT-202609-004', tanggal: '10-09-2026', tipe: 'Urgent', alasanUrgent: 'Q4 NPL follow-up, launch deadline brought forward.',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Running', approvalIdx: 1,
    sampel: 'Gery Saluut Malkist Sweet Cheese', kategori: 'NPL',
    suhuChamber: '25°C, 35°C, 45°C',
    kemasan: 'Pillow Pack Flow Wrap',
    param: 'Moisture & Organoleptic',
    timepoint: 'D-14 (In Progress)',
    rejection: 'Taste Score < 6.0',
    status: 'In Chamber'
  },
  {
    id: 'ASLT-202609-005', tanggal: '12-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Approval', approvalIdx: 0, tujuan: 'R&D Trial',
    sampel: 'Slai O Lai Blueberry Biscuit 32g', kategori: 'Trial',
    suhuChamber: '35°C, 45°C',
    kemasan: 'Plastic Flow Pack',
    param: 'Critical AW & Jam Brix',
    timepoint: 'D-21',
    rejection: 'AW > 0.65',
    status: 'In Chamber'
  },
  {
    id: 'ASLT-202609-006', tanggal: '14-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Scheduling', approvalIdx: 1, tujuan: 'Routine QC',
    sampel: 'WCG Wafer Cone Chocolate 120g', kategori: 'Re-ASLT',
    suhuChamber: '25°C, 45°C',
    kemasan: 'Pouch Alufo',
    param: 'Moisture & Crispiness',
    timepoint: 'D-0 (Initial)',
    rejection: 'Moisture > 2.8%',
    status: 'Initial Physicochemical Check'
  }
];

/* Sampel, Atribut & Ketepatan of a seeded Sensory request, in the shape the Sensory form saves:
   sampelDetail (jenis + Tgl Pembuatan + Exp. Date), jenisSampel (the names) and one
   atributMap[param] = { atribut, ketepatan } per request, which the panel booth asks for every cup.
   Atribut must be in MASTER_ATRIBUT_BY_PARAM[param] and FlexTab SN_ATRIBUT. */
function snSeedAtribut(param, jenisSampel, atribut, ketepatan, tglPembuatan, expDate) {
  var map = {};
  map[param] = { atribut: atribut.slice(), ketepatan: ketepatan.slice() };
  return {
    params: [param], jenisSampel: jenisSampel,
    sampelDetail: jenisSampel.map(function (j) { return { jenis: j, tglPembuatan: tglPembuatan, expDate: expDate }; }),
    atributMap: map, atribut: atribut.join(', '), ketepatan: ketepatan.join(', ')
  };
}

var SEED_SENSORY_REQUESTS = [
  Object.assign({
    id: 'SN-202610-0014', tanggal: '06-10-2026', tipe: 'Urgent', alasanUrgent: 'Customer complaint, difference check needed urgently.', tujuan: 'Customer Complaint',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Approval', approvalIdx: 1,
    jenis: 'Triangle Test', sampel: 'BBQ Roasted Peanuts', batch: 'B2610-02A',
    blindCodes: [], suhuWadah: 'Ambient · Plastic Cup', status: 'Waiting for Approval'
  }, snSeedAtribut('triangle', ['Rosta ORC', 'Rosta BBQ Sapi'], [], [], '01-10-2026', '01-04-2027')),
  Object.assign({
    id: 'SN-202610-0013', tanggal: '05-10-2026', tipe: 'Normal', alasanUrgent: '', tujuan: 'Routine QC',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Scheduling', approvalIdx: 1,
    jenis: 'Internal Sensory Test - Affective Rating', sampel: 'Hot Chocolate Drink', batch: '3UNR240127 2447',
    blindCodes: ['198', '465', '210'],
    panel: { codes: ['198', '465', '210'] }, suhuWadah: 'Hot · Paper Cup', status: 'Waiting for Schedule'
  }, snSeedAtribut('internal-rating', ['Beng Beng Drink', 'Chocodrink', 'DRINK5'], ['Color & Appearance', 'Aroma', 'Taste'], ['Sweetness'], '28-09-2026', '28-03-2027')),
  Object.assign({
    id: 'SN-202609-0012', tanggal: '23-09-2026', tipe: 'Normal', alasanUrgent: '', tujuan: 'R&D Trial',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Running', approvalIdx: 1,
    jenis: 'Internal Sensory Test - Affective Rating',
    sampel: 'Chocolatos Wafer Stick New Formula',
    blindCodes: ['842', '319', '571'], batch: 'B2609-14A',
    sesi: 'Session 1 (15 Panelists)',
    suhuWadah: 'Ambient · Plastic Cup',
    status: 'Session Active',
    panel: { open: true, codes: ['842', '319', '571'], openedAt: '2026-09-23T08:00:00' }
  }, snSeedAtribut('internal-rating', ['New Formula A', 'New Formula B', 'Control (Existing)'], ['Taste', 'Texture', 'Aftertaste'], ['Sweetness', 'Crispiness'], '15-09-2026', '15-03-2027')),
  /* Triangle: 3 cup positions (204 · 791 · 538) whose content rotates per panelist */
  Object.assign({
    id: 'SN-202609-0011', tanggal: '22-09-2026', tipe: 'Normal', alasanUrgent: '', tujuan: 'Scale Up',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Running', approvalIdx: 1,
    jenis: 'Triangle Test',
    sampel: 'Maco Chocolate Wafer vs Competitor X',
    blindCodes: ['204', '791', '538'], batch: 'B2609-10C',
    sesi: 'Session 2 (12 Panelists)',
    suhuWadah: 'Ambient · Glass Plate',
    status: 'Done (Point 3 Valid)',
    panel: { open: true, codes: ['204', '791', '538'], openedAt: '2026-09-22T08:00:00' }
  }, snSeedAtribut('triangle', ['Maco Chocolate Wafer', 'Competitor X'], [], [], '15-09-2026', '15-09-2027')),
  Object.assign({
    id: 'SN-202609-0010', tanggal: '20-09-2026', tipe: 'Normal', alasanUrgent: '', tujuan: 'Routine QC',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Running', approvalIdx: 1,
    jenis: 'Quality Monitoring',
    sampel: 'Pilus Fried Noodle Flavor (LAB-QM)',
    blindCodes: ['112', '449'], batch: '2 SMD 220427 054',
    sesi: 'QA Routine Session (8 Panelists)',
    suhuWadah: 'Ambient · Plastic Cup',
    status: 'Done',
    reportStatus: 'Draft', reportNo: null, analisHasil: 'Dewi Lestari',
    results: { 'code-112': { values: [7.1, 6.9, 7.3], result: '7.1' }, 'code-449': { values: [6.4, 6.6, 6.5], result: '6.5' } }
  }, snSeedAtribut('quality-monitoring', ['PGMF', 'GF2'], ['Aroma', 'Taste', 'Texture'], ['Saltiness', 'Crispiness'], '10-09-2026', '10-03-2027')),
  Object.assign({
    id: 'SN-202609-0009', tanggal: '18-09-2026', tipe: 'Normal', alasanUrgent: '', tujuan: 'R&D Trial',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Running', approvalIdx: 1,
    jenis: 'Internal Sensory Test - Affective Ranking',
    sampel: 'Gery Saluut Sweet Cheese vs 2 Flavor Variants',
    blindCodes: ['633', '902', '158'], batch: 'B2609-03B',
    sesi: 'Session 1 (20 Panelists)',
    suhuWadah: 'Ambient · Plastic Cup',
    status: 'Done'
  }, snSeedAtribut('ranking', ['Sweet Cheese Original', 'Cheese Plus Variant', 'Less Sugar Variant'], ['Taste', 'Overall'], [], '08-09-2026', '08-03-2027'))
];

function _hsListStore(key, seed) {
  return {
    getAll: function () {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) {
          localStorage.setItem(key, JSON.stringify(seed));
          return seed.slice();
        }
        return JSON.parse(raw);
      } catch (e) {
        return seed.slice();
      }
    },
    saveAll: function (list) {
      localStorage.setItem(key, JSON.stringify(list));
    }
  };
}

var _asltStore = _hsListStore(ASLT_STORAGE_KEY, SEED_ASLT_REQUESTS);
var _sensoryStore = _hsListStore(SENSORY_STORAGE_KEY, SEED_SENSORY_REQUESTS);

function getAsltRequests() { return _asltStore.getAll(); }
function getAsltRequestById(id) {
  var found = null;
  getAsltRequests().forEach(function (r) { if (r.id === id) found = r; });
  return found;
}
function updateAsltRequest(id, patch) {
  var list = getAsltRequests();
  var idx = -1;
  list.forEach(function (r, i) { if (r.id === id) idx = i; });
  /* mergeWithActivity (spk-history.js, not loaded in PANELIS): transitions land in the Document History */
  var merge = typeof mergeWithActivity === 'function' ? mergeWithActivity : function (s, prev, p, i) { return Object.assign({}, prev || { id: i }, p); };
  if (idx === -1) list.push(merge('aslt', null, patch, id));
  else list[idx] = merge('aslt', list[idx], patch, id);
  _asltStore.saveAll(list);
  return getAsltRequestById(id);
}
function addAsltRequest(record) {
  var list = getAsltRequests();
  list.push(record);
  _asltStore.saveAll(list);
  return record;
}

function getSensoryRequests() { return _sensoryStore.getAll(); }
function getSensoryRequestById(id) {
  var found = null;
  getSensoryRequests().forEach(function (r) { if (r.id === id) found = r; });
  return found;
}
function updateSensoryRequest(id, patch) {
  var list = getSensoryRequests();
  var idx = -1;
  list.forEach(function (r, i) { if (r.id === id) idx = i; });
  /* mergeWithActivity (spk-history.js, not loaded in PANELIS): transitions land in the Document History */
  var merge = typeof mergeWithActivity === 'function' ? mergeWithActivity : function (s, prev, p, i) { return Object.assign({}, prev || { id: i }, p); };
  if (idx === -1) list.push(merge('sensory', null, patch, id));
  else list[idx] = merge('sensory', list[idx], patch, id);
  _sensoryStore.saveAll(list);
  return getSensoryRequestById(id);
}
function addSensoryRequest(record) {
  var list = getSensoryRequests();
  list.push(record);
  _sensoryStore.saveAll(list);
  return record;
}

/* Blind codes of a panel request (Sensory or ASLT), without duplicates */
function panelRequestCodes(record) {
  if (!record) return [];
  return (record.panel && record.panel.codes && record.panel.codes.length ? record.panel.codes : (record.blindCodes || []))
    .filter(function (c, i, a) { return a.indexOf(c) === i; });
}
function sensoryIsTriangle(record) { return !!record && (record.params || [])[0] === 'triangle'; }

/* Sample rows of a rating / ranking / QM sensory request, as listed per session in Schedule:
   one row per jenis sampel with its fixed 3-digit blind code → [{ jenis, kode }].
   Triangle has no fixed code per sample (cups rotate per panelist): see panelPlanTable. */
function sensorySampleRows(record) {
  if (!record) return [];
  var codes = panelRequestCodes(record);
  var jenis = Array.isArray(record.jenisSampel) ? record.jenisSampel : (record.jenisSampel ? [record.jenisSampel] : []);
  if (!jenis.length) return codes.map(function (c) { return { jenis: '-', kode: c }; });
  return jenis.map(function (j, i) { return { jenis: j, kode: codes[i] || '-' }; });
}

/* ---------- Blind codes & serving plan (blind test) ----------
   Codes: 3 digits, unique over every Sensory and ASLT request, so the cups of requests sharing a
   session never carry the same code.
   Serving plan per panelist, by seq = the order a panelist starts in a session (0, 1, 2, …):
   - rating / ranking / QM / ASLT: one code per sample, served in a Williams design order (every
     sample is served in every position equally often and follows every other sample equally
     often, which balances order and carry-over effects);
   - triangle: 3 cups with fixed position codes; their content rotates over the 6 balanced
     patterns ABB BAB BBA BAA ABA AAB (A = first jenis sampel, B = second), so the odd cup is
     neither always the same position nor always the same sample. */
var PANEL_TRIANGLE_PATTERNS = ['ABB', 'BAB', 'BBA', 'BAA', 'ABA', 'AAB'];

function panelUsedBlindCodes(exceptId) {
  var used = [];
  var lists = (typeof getSensoryRequests === 'function' ? getSensoryRequests() : [])
    .concat(typeof getAsltRequests === 'function' ? getAsltRequests() : []);
  lists.forEach(function (r) {
    if (r.id === exceptId) return;
    panelRequestCodes(r).forEach(function (c) { if (used.indexOf(c) === -1) used.push(c); });
  });
  return used;
}
function panelNewBlindCodes(n, exceptId) {
  var used = panelUsedBlindCodes(exceptId), out = [];
  while (out.length < n) {
    var c = String(Math.floor(100 + Math.random() * 900));
    if (out.indexOf(c) === -1 && used.indexOf(c) === -1) out.push(c);
  }
  return out;
}

/* Williams design for n samples → list of orders (indexes); n rows when n is even, 2n when odd */
function panelWilliamsOrders(n) {
  if (n < 2) return [[0]];
  var first = [0], lo = 1, hi = n - 1;
  for (var k = 1; k < n; k++) first.push(k % 2 ? lo++ : hi--);
  var rows = [];
  for (var r = 0; r < n; r++) rows.push(first.map(function (x) { return (x + r) % n; }));
  if (n % 2) rows = rows.concat(rows.map(function (row) { return row.slice().reverse(); }));
  return rows;
}

/* Serving plan of the panelist with this seq:
   { seq, order: [codes in serving order], pattern?, cups?: [{ code, sample: 'A'|'B' }], oddCode? } */
function panelServingPlan(codes, triangle, seq) {
  seq = seq || 0;
  if (triangle) {
    var p = PANEL_TRIANGLE_PATTERNS[seq % PANEL_TRIANGLE_PATTERNS.length];
    var cups = codes.slice(0, 3).map(function (c, i) { return { code: c, sample: p[i] }; });
    var odd = cups.filter(function (cup) { return p.split(cup.sample).length - 1 === 1; })[0];
    return { seq: seq, pattern: p, order: codes.slice(0, 3), cups: cups, oddCode: odd ? odd.code : null };
  }
  var rows = panelWilliamsOrders(codes.length);
  return { seq: seq, order: rows[seq % rows.length].map(function (i) { return codes[i]; }) };
}

/* The lab's preparation table: one row per distinct plan, with the panelists (1-based) it applies
   to → [{ panelists: [1, 7, 13], plan }] for the first `upTo` panelists */
function panelPlanTable(codes, triangle, upTo) {
  var n = triangle ? PANEL_TRIANGLE_PATTERNS.length : panelWilliamsOrders(codes.length).length;
  var rows = [];
  for (var i = 0; i < n; i++) {
    var who = [];
    for (var k = i; k < (upTo || 20); k += n) who.push(k + 1);
    rows.push({ panelists: who, plan: panelServingPlan(codes, triangle, i) });
  }
  return rows;
}

/* ---------- Document flow (same statuses as Internal / External) ----------
   Draft → Approval (requestApprovalChain, dummy-requests.js — same chain as Internal)
   → 'Scheduling' = Fully Approved, workflow "Waiting for Schedule"
   → the request is put in Schedule → 'Running' = Confirmed: the panel runs and Excel can pull it.
   Return to Edit → Draft (returned), Reject → 'Rejected'. */

/* Called by Schedule when a session is saved for the request: Waiting for Schedule → Confirmed */
function markPanelRequestScheduled(jenis, id) {
  var get = jenis === 'ASLT' ? getAsltRequestById : getSensoryRequestById;
  var update = jenis === 'ASLT' ? updateAsltRequest : updateSensoryRequest;
  var r = get(id);
  if (r && r.step === 'Scheduling') update(id, { step: 'Running', scheduledAt: new Date().toISOString() });
}
/* Called by Schedule when the last session of a request is removed: back to Waiting for Schedule,
   unless its results have already gone to Report */
function markPanelRequestUnscheduled(jenis, id) {
  var get = jenis === 'ASLT' ? getAsltRequestById : getSensoryRequestById;
  var update = jenis === 'ASLT' ? updateAsltRequest : updateSensoryRequest;
  var r = get(id);
  if (r && r.step === 'Running' && !r.reportStatus) update(id, { step: 'Scheduling', scheduledAt: null });
}
