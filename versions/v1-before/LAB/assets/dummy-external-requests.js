/* ---------- Shared dummy External request store (design-only, localStorage-backed) ---------- */



var EXTERNAL_MASTER_TUJUAN = [
  'Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'MD Registration (BPOM)', 'P5 Testing'
];

/* Kategori Pangan and Jenis Kemasan come from FlexTab (dummy-flextab.js) */

/* Steps: Draft → Approval → Sample Delivery (workflow after the last approval; Lab Admin sends the
   sample to the vendor lab and presses Confirm Delivery) → Confirmed. External requests end there:
   they do not go to Excel or Report (the vendor lab issues its own COA). */
/* External approval chain: Normal always goes through HOL before ADM; Urgent is the same as
   requestApprovalChain (dummy-requests.js, isMdOrP5 lives there too) */
function externalApprovalChain(tipe, tujuan) {
  if (tipe === 'Urgent') return requestApprovalChain(tipe, tujuan);
  return isMdOrP5(tujuan) ? ['FRA', 'HOL', 'ADM'] : ['HOL', 'ADM'];
}

var EXTERNAL_REQUESTS_STORAGE_KEY = 'holabsysExternalRequests.en';
var EXTERNAL_OLD_STEPS = { 'Sample Shipping': 'Sample Delivery', 'Order Confirmation': 'Confirmed' };

var SEED_EXTERNAL_REQUESTS = [
  {
    id: 'REQ-202609-0031', tanggal: '20-09-2026', tipe: 'Normal', tujuan: 'Routine QC',
    lab: 'SGS Indonesia', sampel: 'Chocolatos Sachet 20g',
    batch: 'B2609-11A', prod: '12-09-2026', kategoriPangan: 'Dairy Drink', kemasan: 'Pouch Alufo',
    params: ['moisture', 'fat'], pemohon: 'Marsya Valentina', departemen: 'Quality Assurance',
    step: 'Draft', approvalIdx: 0, catatanTambahan: ''
  },
  {
    id: 'REQ-202609-0033', tanggal: '21-09-2026', tipe: 'Urgent', tujuan: 'Customer Complaint',
    lab: 'TUV NORD', sampel: 'Slai O Lai Coklat 32g',
    batch: 'B2609-12C', prod: '14-09-2026', kategoriPangan: 'Biscuit & Wafer', kemasan: 'Plastic',
    params: ['salmonella', 'alt'], pemohon: 'Marsya Valentina', departemen: 'Quality Assurance',
    step: 'Approval', approvalIdx: 1, catatanTambahan: ''
  },
  {
    id: 'REQ-202609-0025', tanggal: '18-09-2026', tipe: 'Normal', tujuan: 'MD Registration (BPOM)',
    lab: 'SIG (Saraswanti Indo Genetech)', sampel: 'Maco Chocolate Wafer 120g',
    batch: 'B2609-09A', prod: '10-09-2026', kategoriPangan: 'Biscuit & Wafer', kemasan: 'Pouch Alufo',
    params: ['moisture', 'pb'], pemohon: 'Marsya Valentina', departemen: 'Quality Assurance',
    step: 'Sample Delivery', approvalIdx: 3, catatanTambahan: ''
  },
  {
    id: 'REQ-202609-0019', tanggal: '16-09-2026', tipe: 'Normal', tujuan: 'Scale Up',
    lab: 'SGS Indonesia', sampel: 'Gery Saluut Kacang 18g',
    batch: 'B2609-06B', prod: '07-09-2026', kategoriPangan: 'Nuts & Snack', kemasan: 'Carton',
    params: ['ffa', 'protein'], pemohon: 'Marsya Valentina', departemen: 'Quality Assurance',
    step: 'Confirmed', approvalIdx: 2, catatanTambahan: '',
    deliveredAt: '19-09-2026 10:15', deliveredBy: 'Bambang Admin'
  }
];

function getExternalRequests() {
  try {
    var raw = localStorage.getItem(EXTERNAL_REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXTERNAL_REQUESTS_STORAGE_KEY, JSON.stringify(SEED_EXTERNAL_REQUESTS));
      return SEED_EXTERNAL_REQUESTS.slice();
    }
    /* Records saved before the Sample Delivery workflow used the old tab steps */
    return JSON.parse(raw).map(function (r) {
      return EXTERNAL_OLD_STEPS[r.step] ? Object.assign({}, r, { step: EXTERNAL_OLD_STEPS[r.step] }) : r;
    });
  } catch (e) {
    return SEED_EXTERNAL_REQUESTS.slice();
  }
}

function saveExternalRequests(list) {
  localStorage.setItem(EXTERNAL_REQUESTS_STORAGE_KEY, JSON.stringify(list));
}

function getExternalRequestById(id) {
  var list = getExternalRequests();
  var found = null;
  list.forEach(function (r) { if (r.id === id) found = r; });
  return found;
}

function updateExternalRequest(id, patch) {
  var list = getExternalRequests();
  var idx = -1;
  list.forEach(function (r, i) { if (r.id === id) idx = i; });
  /* mergeWithActivity (spk-history.js): every transition lands in the Document History */
  var merge = typeof mergeWithActivity === 'function' ? mergeWithActivity : function (s, prev, p, i) { return Object.assign({}, prev || { id: i }, p); };
  if (idx === -1) list.push(merge('external', null, patch, id));
  else list[idx] = merge('external', list[idx], patch, id);
  saveExternalRequests(list);
  return getExternalRequestById(id);
}
