/* ---------- Quality Records (HOLABSYS › Quality Records) — dummy, localStorage-backed ----------
   The lab's management-system records that ISO/IEC 17025 asks for next to the test flow:
   - Nonconforming Work + corrective action (cl. 7.10 / 8.7)
   - Complaints (cl. 7.9)
   - Proficiency Testing / interlaboratory comparison results (cl. 7.7.2; KAN requires PT participation)
   A Re-test (applyRetest, dummy-requests.js) adds a Nonconforming Work record here by itself.
   Record: { id, type, date, requestId, params, description, source, rootCause, action, owner,
             status: Open | Closed, closedAt, closedBy }
   PT:     { id, scheme, provider, parameter, round, date, assigned, result, sdpa } → z = (result - assigned) / sdpa */
var QUALITY_STORAGE_KEY = 'holabsysQuality.en';
var PT_STORAGE_KEY = 'holabsysProficiency.en';
var QUALITY_TYPES = ['Nonconforming Work', 'Complaint'];

var SEED_QUALITY = [
  { id: 'QR-202608-001', type: 'Nonconforming Work', date: '29-08-2026', requestId: '', params: 'Protein Content (Kjeldahl)',
    description: 'PT LGC QFCS QF-218: z = 3.19 (Unsatisfactory).', source: 'Proficiency Testing PT-2026-04',
    rootCause: '', action: '', owner: 'Budi Santoso', status: 'Open', closedAt: '', closedBy: '' },
  { id: 'QR-202609-001', type: 'Nonconforming Work', date: '22-09-2026', requestId: 'REQ-202609-0009', params: 'Lead (Pb) Contamination',
    description: 'AAS out of service during the testing window; parameter could not be run in-house.', source: 'Technical Review',
    rootCause: 'Lamp failure, preventive maintenance overdue by 2 weeks.', action: 'Lamp replaced, PM interval added to the equipment master; Pb offered as subcontract.',
    owner: 'Budi Santoso', status: 'Closed', closedAt: '30-09-2026', closedBy: 'Siti Rahmawati' },
  { id: 'QR-202610-001', type: 'Complaint', date: '03-10-2026', requestId: 'REQ-202609-0015', params: 'FFA (Free Fatty Acid)',
    description: 'Requester questions the FFA result against the plant in-line reading.', source: 'Email · Marsya Valentina',
    rootCause: '', action: '', owner: 'Siti Rahmawati', status: 'Open', closedAt: '', closedBy: '' }
];

var SEED_PT = [
  { id: 'PT-2026-01', scheme: 'FAPAS 1427 — Proximates in Biscuit', provider: 'FAPAS (Fera Science)', parameter: 'Moisture', round: '2026-R1', date: '15-03-2026', assigned: 2.84, result: 2.91, sdpa: 0.12 },
  { id: 'PT-2026-02', scheme: 'FAPAS 1427 — Proximates in Biscuit', provider: 'FAPAS (Fera Science)', parameter: 'Fat Content', round: '2026-R1', date: '15-03-2026', assigned: 19.6, result: 20.1, sdpa: 0.36 },
  { id: 'PT-2026-03', scheme: 'KAN ILC Mikrobiologi Pangan', provider: 'KAN / BSN', parameter: 'Total Plate Count (TPC)', round: '2026-02', date: '10-06-2026', assigned: 4.21, result: 4.36, sdpa: 0.25 },
  { id: 'PT-2026-04', scheme: 'LGC QFCS — Food Chemistry', provider: 'LGC Axio', parameter: 'Protein Content (Kjeldahl)', round: 'QF-218', date: '22-08-2026', assigned: 9.12, result: 9.98, sdpa: 0.27 }
];

function qualityStore(key, seed) {
  try {
    var raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(key, JSON.stringify(seed));
  } catch (e) { /* fall back to the seed */ }
  return JSON.parse(JSON.stringify(seed));
}

function getQualityRecords() { return qualityStore(QUALITY_STORAGE_KEY, SEED_QUALITY); }
function saveQualityRecords(list) { localStorage.setItem(QUALITY_STORAGE_KEY, JSON.stringify(list)); }
function getProficiencyTests() { return qualityStore(PT_STORAGE_KEY, SEED_PT); }
function saveProficiencyTests(list) { localStorage.setItem(PT_STORAGE_KEY, JSON.stringify(list)); }

function qualityToday() {
  var d = new Date();
  return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
}

/* New record (Open) with the next free QR- number of the month → the record */
function addQualityRecord(fields) {
  var list = getQualityRecords();
  var rec = Object.assign({ date: qualityToday(), rootCause: '', action: '', status: 'Open', closedAt: '', closedBy: '' }, fields, {
    id: nextFreeNo('QR-' + currentYm() + '-', list.map(function (r) { return r.id; }), 3)
  });
  list.push(rec);
  saveQualityRecords(list);
  return rec;
}

function updateQualityRecord(id, patch) {
  var list = getQualityRecords().map(function (r) { return r.id === id ? Object.assign({}, r, patch) : r; });
  saveQualityRecords(list);
  return list.filter(function (r) { return r.id === id; })[0];
}

/* z-score and its ISO 13528 verdict: |z| ≤ 2 Satisfactory, < 3 Questionable, else Unsatisfactory */
function ptZScore(pt) {
  return pt.sdpa ? Math.round((pt.result - pt.assigned) / pt.sdpa * 100) / 100 : null;
}
function ptVerdict(pt) {
  var z = Math.abs(ptZScore(pt));
  return z <= 2 ? 'Satisfactory' : z < 3 ? 'Questionable' : 'Unsatisfactory';
}
var PT_VERDICT_CLS = { Satisfactory: 'bg-success-transparent', Questionable: 'bg-warning-transparent', Unsatisfactory: 'bg-danger-transparent' };
