/* ---------- Shared dummy request store (design-only, localStorage-backed) ---------- */
/* Analis names as in Master Data → Analis Competency */
var MASTER_ANALIS = ['Budi Santoso', 'Galih Saputra', 'Dewi Lestari', 'Nur Aini', 'Dimas Aditya', 'Putri Ayuningtyas', 'Siti Aminah', 'Rian Hidayat'];

/* Internal requests keep Penunjukan Analis as a list; older records and Sensory / ASLT a string */
function analisLabel(analis) {
  return Array.isArray(analis) ? analis.join(', ') : (analis || '');
}

/* ---------- Vendor labs — the one master (Master Data → External Lab Vendors) ----------
   `name` is the value stored on documents (External Laboratorium Tujuan, Subcontract Lab, invoices).
   ISO/IEC 17025 cl. 6.6: a subcontractor must be competent, so its KAN accreditation must be valid
   (kanValidUntil, yyyy-mm-dd) to be chosen as Subcontract Lab in the Technical Review. */
var EXTERNAL_VENDORS = [
  { name: 'SIG (Saraswanti Indo Genetech)', kode: 'LAB-SIG', nama: 'PT Saraswanti Indo Genetech (SIG Laboratory)', kan: 'LP-184-IDN', kanValidUntil: '2028-05-31',
    kota: 'Bogor', alamat: 'Jl. Rasamala No. 20 Taman Yasmin, Bogor 16113', pic: 'Fajar Hidayat / cs@siglaboratory.com / (0251) 7532348',
    params: ['Clostridium botulinum', 'Total Aflatoxin (B1, B2, G1, G2)', 'Lead (Pb) & Mercury (Hg) Contamination', 'Vitamin & Amino Acid Content'] },
  { name: 'TUV NORD', kode: 'LAB-TUV', nama: 'TUV NORD Indonesia', kan: 'LP-411-IDN', kanValidUntil: '2027-11-30',
    kota: 'Jakarta', alamat: 'Jl. Raya Babelan, Kawasan Industri Menara Permai, Bekasi / Jakarta Timur', pic: 'Dewi Lestari / food.id@tuv-nord.com / (021) 8945678',
    params: ['Multi-residue Pesticides (GC-MS/MS)', 'Heavy Metals ICP-MS', 'Full Nutrition Facts (BPOM MD)'] },
  { name: 'SGS Indonesia', kode: 'LAB-SGS', nama: 'PT SGS Indonesia', kan: 'LP-002-IDN', kanValidUntil: '2029-01-31',
    kota: 'Jakarta', alamat: 'Cilandak Commercial Estate #108C, Jl. Raya Cilandak KKO, Jakarta Selatan', pic: 'Aditya Pratama / id.food@sgs.com / (021) 7818111',
    params: ['Allergen Testing (Gluten, Peanut, Milk)', 'Salmonella Serotyping', 'Microbiology Screening MD/P5'] },
  { name: 'Intertek Utama', kode: 'LAB-INTERTEK', nama: 'PT Intertek Utama Services', kan: 'LP-130-IDN', kanValidUntil: '2027-06-30',
    kota: 'Jakarta', alamat: 'Jl. Raya Bogor KM 28, Pasar Rebo, Jakarta Timur', pic: 'Bambang Irawan / food.indonesia@intertek.com / (021) 87794444',
    params: ['Food Contact Packaging Test (Metal & Phthalate Migration)', 'Barrier Permeability O2 & Moisture'] },
  { name: 'Angler BioChemLab', kode: 'LAB-ANGLER', nama: 'PT Angler BioChemLab', kan: 'LP-505-IDN', kanValidUntil: '2026-03-31',
    kota: 'Tangerang', alamat: 'Kawasan Industri BSD Sektor XI Blok A1, Tangerang Selatan', pic: 'Maya Septiana / contact@anglerbiochem.com / (021) 7588001',
    params: ['Halal DNA Analysis (Porcine Real-time PCR)', 'Species Identification'] }
];
var EXTERNAL_MASTER_LAB = EXTERNAL_VENDORS.map(function (v) { return v.name; });

function vendorByName(name) {
  return EXTERNAL_VENDORS.filter(function (v) { return v.name === name; })[0] || null;
}
/* KAN accreditation still valid today (expired → not selectable as Subcontract Lab) */
function vendorAccredited(name) {
  var v = vendorByName(name);
  return !!v && new Date(v.kanValidUntil + 'T23:59:59') >= new Date();
}

/* Internal parameter sent to a vendor lab (Kaji Ulang Hasil "Subcontract"): the vendor name, else null */
function paramSubkontrak(record, code) {
  var k = record && record.kajiUlang && record.kajiUlang[code];
  return k && k.hasil === 'Subcontract' ? (k.vendor || 'External Lab') : null;
}

var REQUESTS_STORAGE_KEY = 'holabsysRequests.v3.en'; // v3: seed numbers follow one running series

/* ---------- Document numbers ----------
   Every number is "<prefix><running no.>", the next free one of this month: it never reuses a
   number that already exists (Internal / External REQ-, SPK, LHU, SN-, ASLT-). */
function currentYm() {
  var now = new Date();
  return now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
}
/* The running number never restarts: a prefix holding the current yyyymm (REQ-202610-, SPK/LAB/202610/,
   LHU/…, SN-, ASLT-, QR-) continues after the highest number of any month of that series, so a new
   October request follows REQ-202609-0033 as REQ-202610-0034. */
function nextFreeNo(prefix, usedNos, width) {
  var ym = currentYm();
  var esc = prefix.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
  var series = prefix.indexOf(ym) !== -1 ? new RegExp('^' + esc.replace(ym, '\\d{6}') + '(\\d+)$') : null;
  var max = 0;
  usedNos.forEach(function (no) {
    if (!no) return;
    var m = series ? String(no).match(series) : null;
    if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
    else if (!series && no.indexOf(prefix) === 0) max = Math.max(max, parseInt(no.slice(prefix.length), 10) || 0);
  });
  return prefix + String(max + 1).padStart(width, '0');
}

/* Lists show the newest document first: by date (dd-mm-yyyy), then by number. Rows may be records or
   { record } wrappers (Report list). */
function newestFirst(a, b) {
  var ra = a && a.record ? a.record : a, rb = b && b.record ? b.record : b;
  var d = function (r) { var p = String((r && r.tanggal) || '').split('-'); return p.length === 3 ? +(p[2] + p[1] + p[0]) : 0; };
  return (d(rb) - d(ra)) || String((rb && (rb.id || rb.no)) || '').localeCompare(String((ra && (ra.id || ra.no)) || ''));
}
/* Internal and External requests share the REQ- numbers (load dummy-external-requests.js too) */
function generateRequestNo() {
  var ids = getRequests().map(function (r) { return r.id; });
  if (typeof getExternalRequests === 'function') ids = ids.concat(getExternalRequests().map(function (r) { return r.id; }));
  return nextFreeNo('REQ-' + currentYm() + '-', ids, 4);
}

/* ---------- Approval chain (Internal, Sensory, ASLT) ----------
   Follows Tipe + Tujuan Analisa; only the pending level can approve. External has its own chain
   (externalApprovalChain, dummy-external-requests.js).
   ADM (Lab Admin) is always the last level. On an Internal request the ADM approval is the Sample
   Receipt (ISO/IEC 17025 cl. 7.4): ADM approves by receiving the sample (condition, retention) →
   Fully Approved · Waiting for Technical Review. */
function isMdOrP5(tujuan) {
  return tujuan === 'MD Registration (BPOM)' || tujuan === 'P5 Testing';
}
function requestApprovalChain(tipe, tujuan) {
  var mdP5 = isMdOrP5(tujuan);
  if (tipe === 'Urgent') return mdP5 ? ['MGU', 'HOL', 'HOR', 'FRA', 'ADM'] : ['MGU', 'HOL', 'HOR', 'ADM'];
  return mdP5 ? ['FRA', 'ADM'] : ['ADM'];
}

/* ---------- Sample No. ----------
   Every lab label of an Internal request (one per lab of its accepted parameters) gets a 5-digit
   running Sample No. (04181, 04182, …) at SPK issue. Labels and the Internal Excel use it as the
   sample identity: record.sampleNos = { Physicochemical: '04181', Microbiology: '04182' }. */
var SAMPLE_SEQ_KEY = 'holabsysSampleSeq.en';
var SAMPLE_SEQ_START = 4180; // above the seeded numbers

function nextSampleNo() {
  var n = (parseInt(localStorage.getItem(SAMPLE_SEQ_KEY), 10) || SAMPLE_SEQ_START) + 1;
  localStorage.setItem(SAMPLE_SEQ_KEY, String(n));
  return String(n).padStart(5, '0');
}

function sampleLabOf(code) {
  var p = typeof labParameter === 'function' ? labParameter('Internal', code) : null;
  return p ? p.lab : 'General';
}

/* Sample Nos. for every lab of the accepted parameters; labs that already have one keep it */
function assignSampleNos(record) {
  var nos = Object.assign({}, record.sampleNos);
  (record.paramsDiterima || record.params || []).forEach(function (code) {
    var lab = sampleLabOf(code);
    if (!nos[lab]) nos[lab] = nextSampleNo();
  });
  return nos;
}

function sampleNoFor(record, code) {
  return (record && record.sampleNos && record.sampleNos[sampleLabOf(code)]) || '';
}

var SEED_REQUESTS = [
  {
    id: 'REQ-202609-0018', tanggal: '18-09-2026', tipe: 'Normal', tujuan: 'Routine QC',
    sampel: 'Chocolatos Sachet 20g', sku: 'Chocolatos', alamatPelanggan: 'Head Office', alamatPabrik: 'Plant Sentul',
    batch: 'B2609-02A', prod: '10-09-2026', kategoriPangan: 'Dairy Drink', kemasan: 'Pouch Alufo',
    params: ['moisture', 'fat'], suhu: 'Ambient Temp', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Draft', approvalIdx: 0,
    spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null
  },
  {
    id: 'REQ-202609-0021', tanggal: '19-09-2026', tipe: 'Urgent', tujuan: 'Customer Complaint',
    sampel: 'Slai O Lai Coklat 32g', sku: 'Slai O Lai', alamatPelanggan: 'Head Office', alamatPabrik: 'Plant Pati',
    batch: 'B2609-05C', prod: '12-09-2026', kategoriPangan: 'Biscuit & Wafer', kemasan: 'Plastic',
    params: ['salmonella', 'alt'], suhu: 'Cool (2-8°C)', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Approval', approvalIdx: 1,
    spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null
  },
  {
    id: 'REQ-202609-0027', tanggal: '21-09-2026', tipe: 'Urgent', tujuan: 'P5 Testing',
    sampel: 'Maco Chocolate Wafer 120g', sku: 'MACO - Maco Wafer & Cream', alamatPelanggan: 'Head Office', alamatPabrik: 'Plant Gresik',
    batch: 'B2609-08A', prod: '15-09-2026', kategoriPangan: 'Biscuit & Wafer', kemasan: 'Pouch Alufo',
    params: ['moisture', 'salmonella', 'pb'], suhu: 'Frozen (-18°C)', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Done', approvalIdx: 5,
    spk: 'SPK/LAB/202609/0014', sampleNos: { Physicochemical: '04171', Microbiology: '04172' }, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null
  },
  {
    id: 'REQ-202609-0015', tanggal: '17-09-2026', tipe: 'Normal', tujuan: 'Scale Up',
    sampel: 'Gery Saluut Kacang 18g', sku: 'Gery Saluut', alamatPelanggan: 'Head Office', alamatPabrik: 'Plant Rancaekek',
    batch: 'B2609-01B', prod: '08-09-2026', kategoriPangan: 'Nuts & Snack', kemasan: 'Carton',
    params: ['ffa', 'protein'], suhu: 'Ambient Temp', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Done', approvalIdx: 1,
    spk: 'SPK/LAB/202609/0011', sampleNos: { Physicochemical: '04165' }, hasilKajiUlang: 'Fully Accepted', catatanKajiUlang: '',
    analis: ['Budi Santoso'], estSelesai: '25-09-2026'
  },
  {
    id: 'REQ-202609-0009', tanggal: '15-09-2026', tipe: 'Normal', tujuan: 'R&D Trial',
    sampel: 'WCG Seasoning Powder', sku: 'WCG - Wafer Cone Gourmet', alamatPelanggan: 'Head Office', alamatPabrik: 'Plant Cimanggis',
    batch: 'B2609-00A', prod: '05-09-2026', kategoriPangan: 'Snack Food', kemasan: 'Cup',
    params: ['salmonella', 'pb'], suhu: 'Frozen (-18°C)', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Done', approvalIdx: 1,
    spk: 'SPK/LAB/202609/0006', sampleNos: { Microbiology: '04160' }, hasilKajiUlang: 'Partially Accepted', catatanKajiUlang: 'Lead (Pb) contamination not testable (AAS: Out of Service).',
    analis: ['Dewi Lestari', 'Nur Aini'], estSelesai: '22-09-2026', paramsDiterima: ['salmonella'],
    reportStatus: null, reportNo: null
  },
  {
    id: 'REQ-202610-0034', tanggal: '05-10-2026', tipe: 'Normal', tujuan: 'Routine QC',
    sampel: 'Gery Chocolatos Wafer 18g', sku: 'Chocolatos', alamatPelanggan: 'Head Office', alamatPabrik: 'Plant Sentul',
    batch: 'B2610-01A', prod: '01-10-2026', kategoriPangan: 'Biscuit & Wafer', kemasan: 'Pouch Alufo',
    params: ['moisture', 'ash', 'alt'], suhu: 'Cool (2-8°C)', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Approval', approvalIdx: 0,
    spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null
  },
  {
    id: 'REQ-202610-0035', tanggal: '06-10-2026', tipe: 'Normal', tujuan: 'Scale Up',
    sampel: 'Gery Saluut Pedas 95g', sku: 'Gery Saluut', alamatPelanggan: 'Head Office', alamatPabrik: 'Plant Pati',
    batch: 'B2610-02C', prod: '02-10-2026', kategoriPangan: 'Nuts & Snack', kemasan: 'Plastic',
    params: ['fat', 'ffa', 'pb'], suhu: 'Frozen (-18°C)', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Technical Review', approvalIdx: 1,
    receipt: { at: '07-10-2026 09:20', by: 'Bambang Admin', condition: 'Good', note: '', retentionUntil: '06-11-2026' },
    spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null
  }
];

function getRequests() {
  try {
    var raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(SEED_REQUESTS));
      return SEED_REQUESTS.slice();
    }
    /* Requests saved by older versions of the mockup (the seed is only written once):
       - Labeling / Review & SPK steps were dropped → Confirmed with an SPK
       - 'Draft Report' was the same as Done + reportStatus → Done
       - the separate 'Sample Receipt' step became the ADM approval → back to Approval, pending ADM */
    var list = JSON.parse(raw);
    list.forEach(function (r) {
      if (r.step === 'Labeling') r.step = 'Done';
      if (r.step === 'Review & SPK') {
        r.step = 'Done';
        r.spk = r.spk || nextFreeNo('SPK/LAB/' + currentYm() + '/', list.map(function (x) { return x.spk; }), 4);
      }
      if (r.step === 'Draft Report') r.step = 'Done';
      if (r.step === 'Sample Receipt') {
        r.step = 'Approval';
        r.approvalIdx = requestApprovalChain(r.tipe, r.tujuan).length - 1;
      }
    });
    return list;
  } catch (e) {
    return SEED_REQUESTS.slice();
  }
}

function saveRequests(list) {
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(list));
}

function getRequestById(id) {
  var list = getRequests();
  var found = null;
  list.forEach(function (r) { if (r.id === id) found = r; });
  return found;
}

function updateRequest(id, patch) {
  var list = getRequests();
  var idx = -1;
  list.forEach(function (r, i) { if (r.id === id) idx = i; });
  /* mergeWithActivity (spk-history.js): every transition lands in the Document History */
  var merge = typeof mergeWithActivity === 'function' ? mergeWithActivity : function (s, prev, p, i) { return Object.assign({}, prev || { id: i }, p); };
  if (idx === -1) list.push(merge('internal', null, patch, id));
  else list[idx] = merge('internal', list[idx], patch, id);
  saveRequests(list);
  return getRequestById(id);
}

function addRequest(record) {
  var list = getRequests();
  list.push(record);
  saveRequests(list);
  return record;
}

/* ---------- Document status (SpkForm getBadgeClass) ----------
   New → (Draft) → Confirm To Approve → Partially Approved (chain ≥ 2, some approved)
   → Fully Approved → Confirmed. Partially Approved only appears with a chain of 2+ levels.
   Return to Edit and Rejected come from an approver.
   Between Fully Approved and Confirmed the doc runs its workflow; the pending step is shown
   as an extra workflow badge ("Waiting for …"). Internal: the last approval (ADM) receives the sample → Technical Review
   (CRL), whose save issues the SPK (issueInternalSpk) and makes the doc Confirmed; a review that needs
   the requester shows "Waiting for Requester Approval" (consentPending).
   A doc whose LHU / COA is Final (reportStatus 'Final') is Closed.
   External requests use the same statuses; their one workflow step is Sample Delivery.
   Sensory / ASLT: one workflow step, Penjadwalan ("Waiting for Schedule"). */
/* Spk DocStatus (AppPageBase): Title Case labels; list pill (renderDocStatusBadge) and SpkForm
   status card use different variants for Fully Approved. Closed is HOLABSYS-only (LHU Final). */
var DOC_STATUS = {
  'New': { list: 'secondary', card: 'secondary', icon: 'ri-sparkling-line' },
  'Draft': { list: 'secondary', card: 'secondary', icon: 'ri-draft-line' },
  'Confirm To Approve': { list: 'info', card: 'info', icon: 'ri-time-line' },
  'Partially Approved': { list: 'primary2', card: 'primary2', icon: 'ri-loader-2-line' },
  'Fully Approved': { list: 'primary2', card: 'primary1', icon: 'ri-checkbox-circle-line' },
  'Confirmed': { list: 'success', card: 'success', icon: 'ri-checkbox-circle-line' },
  'Closed': { list: 'orange', card: 'orange', icon: 'ri-lock-line' },
  'Return to Edit': { list: 'warning', card: 'warning', icon: 'ri-edit-line' },
  'Rejected': { list: 'danger', card: 'danger', icon: 'ri-close-circle-line' }
};
/* renderDocStatusBadge: the list / table pill */
function spkStatusPill(variant, icon, label) {
  return '<span class="badge bg-' + variant + '-transparent text-' + variant + ' rounded-pill fw-semibold px-2 py-1"><i class="' + icon + ' me-1"></i>' + label + '</span>';
}

/* Pending workflow step after approval, per request step */
var DOC_WORKFLOW = {
  'Technical Review': 'Waiting for Technical Review', // Internal: CRL reviews the request; the review issues the SPK (cl. 7.1)
  'Sample Delivery': 'Waiting for Sample Delivery', // External: Lab Admin confirms the sample was sent
  'Scheduling': 'Waiting for Schedule' // Sensory / ASLT: the request still has to be put in Schedule
};

/* SPK number, issued by the Technical Review of an Internal request (issueInternalSpk) */
function generateSpkNo() {
  return nextFreeNo('SPK/LAB/' + currentYm() + '/', getRequests().map(function (r) { return r.spk; }), 4);
}

function nowStamp() {
  var d = new Date();
  var p = function (n) { return String(n).padStart(2, '0'); };
  return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/* ---------- Sample Receipt = the ADM approval of an Internal request (and of a Re-test) — ISO/IEC 17025 cl. 7.4 ----------
   One field for the Lab Admin: the reason / note of the receipt; the time and the retention date are
   filled in automatically. receipt = { at, by, note, retentionUntil } (older records: + condition) */
var SAMPLE_RETENTION_DAYS = 30;
/* "note · retained until …" (with the condition of older records) */
function receiptSummary(x) {
  return (x.condition ? 'Condition ' + x.condition + (x.note ? ' — ' : '') : '') + (x.note || '') + ' · retained until ' + x.retentionUntil;
}
function retentionUntil(from) {
  var d = from ? new Date(from) : new Date();
  d.setDate(d.getDate() + SAMPLE_RETENTION_DAYS);
  return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
}

/* ---------- Requester consent (ISO/IEC 17025 cl. 7.1.1 / 7.1.6) ----------
   A Technical Review that does not accept the request as asked (Partially Accepted, or a parameter
   sent to a Subcontract lab) needs the requester's approval before the SPK — and again later when a
   new Subcontract appears after the SPK (e.g. instrument broken while testing).
   record.customerConsent = { status: 'Pending' | 'Agreed' | 'Declined', items: [{ code, text, type, vendor }],
     requestedAt, requestedBy, decidedAt, decidedBy, reason }; record.consentedCodes = codes already agreed. */
function consentPending(r) {
  return !!(r && r.customerConsent && r.customerConsent.status === 'Pending');
}
/* Items of a review that still need the requester: not-accepted parameters and new Subcontracts */
function consentItemsFor(r, kajiUlang, accepted) {
  var agreed = r.consentedCodes || [];
  var items = [];
  (r.params || []).forEach(function (code) {
    var k = (kajiUlang || {})[code] || {};
    var p = typeof labParameter === 'function' ? labParameter('Internal', code) : null;
    var text = p ? p.text : code;
    if (accepted.indexOf(code) === -1 && agreed.indexOf(code) === -1) items.push({ code: code, text: text, type: 'Not Testable' });
    else if (k.hasil === 'Subcontract' && agreed.indexOf(code) === -1) items.push({ code: code, text: text, type: 'Subcontract', vendor: k.vendor });
  });
  return items;
}

/* SPK issue — the end of the request review: SPK no., Sample Nos., first reagent run of every
   accepted parameter the lab tests itself (once per parameter), step Done (Confirmed).
   Called by the Technical Review save, or by the requester's Agree when consent was needed. */
function issueInternalSpk(id, byName) {
  var r = getRequestById(id);
  var patch = { step: 'Done', spk: r.spk || generateSpkNo(), spkAt: r.spkAt || nowStamp() };
  patch.sampleNos = assignSampleNos(r);
  var rows = deductFirstRuns(updateRequest(id, patch), byName);
  return Object.assign(getRequestById(id), { _reagentRows: rows });
}
/* First reagent deduction of the accepted, lab-tested parameters not deducted yet → rows logged */
function deductFirstRuns(r, byName) {
  if (!r.spk || typeof deductReagents !== 'function') return 0;
  var done = r.reagentDeducted || [];
  var codes = (r.paramsDiterima || r.params || []).filter(function (code) {
    return done.indexOf(code) === -1 && !paramSubkontrak(r, code);
  });
  if (!codes.length) return 0;
  var rows = deductReagents(codes, r.spk + ' · First run', byName);
  updateRequest(r.id, { reagentDeducted: done.concat(codes) });
  return rows;
}

/* ---------- Result audit trail (ISO/IEC 17025 cl. 7.5.2 / 7.11) ----------
   Results are never changed without a trace: every raw-data save, push, certificate attach and
   re-test appends to record.resultLog = [{ at, by, action, code, values, result, note }].
   changes = { code: { values, result } | null }; returns the new log (only real changes). */
function resultLogWith(r, changes, action, note) {
  var by = typeof currentRole === 'function' ? currentRole().name : '-';
  var at = nowStamp();
  var log = (r.resultLog || []).slice();
  Object.keys(changes).forEach(function (code) {
    var next = changes[code];
    var prev = (r.results || {})[code];
    if (action === 'Pushed' && prev && next && JSON.stringify(prev.values) === JSON.stringify(next.values)) return;
    log.push({ at: at, ts: Date.now(), by: by, action: action, code: code, values: next ? next.values : (prev ? prev.values : []),
      result: next ? next.result : (prev ? prev.result : ''), note: note || '' });
  });
  return log;
}

/* Returns { status, workflow } — workflow is null or the pending workflow step label */
function getDocStatus(r) {
  if (!r || !r.step) return { status: 'New', workflow: null };
  if (r.step === 'Rejected') return { status: 'Rejected', workflow: null };
  if (r.step === 'Draft') return { status: r.returned ? 'Return to Edit' : 'Draft', workflow: null };
  if (r.step === 'Approval') return { status: r.approvalIdx > 0 ? 'Partially Approved' : 'Confirm To Approve', workflow: null };
  if (r.reportStatus === 'Final') return { status: 'Closed', workflow: null };
  /* An open Re-test / Revision document: the issued certificate is still valid, so the request stays
     Closed while the new version is worked on in that document */
  if (openAmendmentOf(r) && lastIssuedReport(r)) return { status: 'Closed', workflow: r.reportCycle.type + ' in Progress' };
  if (consentPending(r)) return { status: r.spk ? 'Confirmed' : 'Fully Approved', workflow: 'Waiting for Requester Approval' };
  if (DOC_WORKFLOW[r.step]) return { status: 'Fully Approved', workflow: DOC_WORKFLOW[r.step] };
  /* Confirmed with a report on its way: an open Re-test / Revision, or waiting for TCM */
  if (r.reportCycle) return { status: 'Confirmed', workflow: r.reportCycle.type + ' in Progress' };
  if (openRetest(r)) return { status: 'Confirmed', workflow: 'Re-test in Progress' };
  if (r.reportStatus === 'Confirm to Approve') return { status: 'Confirmed', workflow: 'Waiting for Report Approval' };
  return { status: 'Confirmed', workflow: null };
}

/* Return to Edit / Reject note of the approver, shown under the status card of a request form
   (and in its Approval History) → '' when the document is neither returned nor rejected */
function docReasonNoteHtml(r) {
  if (!r) return '';
  var who = (r.reasonBy ? ' by ' + r.reasonBy : '') + (r.reasonAt ? ' · ' + r.reasonAt : '');
  if (r.step === 'Rejected' && (r.rejectReason || r.reason)) {
    return '<div class="alert alert-danger d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-close-circle-line fs-16"></i>' +
      '<div><div class="fw-semibold">Rejected' + who + '</div>' + (r.rejectReason || r.reason) + '</div></div>';
  }
  if (r.step === 'Draft' && r.returned && (r.returnReason || r.reason)) {
    return '<div class="alert alert-warning d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-arrow-go-back-line fs-16"></i>' +
      '<div><div class="fw-semibold">Returned for editing' + who + '</div>' + (r.returnReason || r.reason) + '</div></div>';
  }
  return '';
}

/* ---------- Report numbers: Re-test (RT- document) and Revision (RV- document) ----------
   Same request number throughout. The first LHU number is the base; a re-test reissues it as
   base-RT<n>, a revision as base[-RT<n>]-R<m>. Every issued number stays in record.reportHistory. */
function reportBaseNo(record) {
  return record.reportBase || (record.reportNo ? record.reportNo.replace(/(-RT\d+)?(-R\d+)?$/, '') : null);
}
/* First LHU number of a report: next free base over Internal, Sensory and ASLT reports */
function generateReportBaseNo() {
  var records = getRequests();
  if (typeof getSensoryRequests === 'function') records = records.concat(getSensoryRequests(), getAsltRequests());
  return nextFreeNo('LHU/LAB/' + currentYm() + '/', records.map(reportBaseNo), 4);
}
/* Re-tests after the first issue change the number (older records may hold re-tests of a Draft) */
function reportRetestCount(record) {
  return (record.retests || []).filter(function (t) { return t.afterIssue !== false; }).length;
}
function reportNoFor(record, base, revision) {
  var rt = reportRetestCount(record);
  return base + (rt ? '-RT' + rt : '') + (revision ? '-R' + revision : '');
}

/* ---------- Report (LHU / COA) lifecycle — the same path for every issued version ----------
   reportStatus: 'Draft' (results from Excel; the CRL reviews them and submits)
     → 'Confirm to Approve' (TCM approves & issues, or returns it to the CRL with a reason:
       reportReturnReason / reportReturnedBy / reportReturnedAt)
     → 'Final' (LHU number issued, request Closed).
   After an issue a Re-test (RT-) or Revision (RV-) document opens one cycle at a time
   (record.reportCycle with its amendmentId, cleared at the next issue — see "Re-test & Revision
   documents" below):
     Re-test → results of the chosen parameters cleared, reagents deducted, back to Draft and into
       Excel → next issue <base>-RT<n>;
     Revision → Sample Name / Customer Address / Packaging changed → Confirm to Approve
       → next issue <base>[-RT<n>]-R<m>.
   Every issue stores a snapshot in reportHistory, so the last issued certificate stays downloadable
   while a cycle is open. */
var REPORT_STATUS = {
  'Draft': { cls: 'bg-warning-transparent', icon: 'ri-draft-line' },
  'Confirm to Approve': { cls: 'bg-info-transparent', icon: 'ri-time-line' },
  'Final': { cls: 'bg-success-transparent', icon: 'ri-shield-check-line' }
};
function reportStatusOf(r) {
  return r && REPORT_STATUS[r.reportStatus] ? r.reportStatus : 'Draft';
}
/* Shown in Spk Title Case; the stored reportStatus value stays 'Confirm to Approve' */
function reportStatusLabel(s) { return s === 'Confirm to Approve' ? 'Confirm To Approve' : s; }
function reportStatusBadgeHtml(r) {
  var s = reportStatusOf(r);
  var v = REPORT_STATUS[s].cls.replace(/^bg-|-transparent$/g, '');
  return spkStatusPill(v, REPORT_STATUS[s].icon, reportStatusLabel(s)) +
    (r && r.reportCycle ? ' ' + spkStatusPill('danger', 'ri-restart-line', r.reportCycle.type + ' ' + r.reportCycle.no) : '');
}
/* Lab staff (HOL, ADM, CRL, TCM) work on Draft reports; everyone else sees issued certificates only */
function isLabRole(role) {
  return !!role && role.dept === 'Laboratory';
}
/* Latest issued version { no, type, at, snapshot? } or null when nothing was issued yet */
function lastIssuedReport(r) {
  var h = (r && r.reportHistory) || [];
  if (h.length) return h[h.length - 1];
  return r && r.reportStatus === 'Final' && r.reportNo ? { no: r.reportNo, type: 'Original', at: '-' } : null;
}
function reportStamp() {
  return new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

/* Snapshot of what a certificate prints, kept with every issued version (record.reportHistory) */
function reportSnapshot(r) {
  return { sampel: r.sampel, alamatPelanggan: r.alamatPelanggan, kemasan: r.kemasan, receipt: r.receipt || null, results: r.results || null,
    panelStats: r.panelStats || null, paramsDiterima: r.paramsDiterima || null, catatanKajiUlang: r.catatanKajiUlang || '' };
}

/* ---------- Re-test & Revision documents — only after a certificate is issued ----------
   Like the LSPD → SUPD → PSPD chain of New Material Registration (onegenesis-web, szRefDocId): a
   re-test or a revision of an issued certificate is a document of its own that points to its
   request (refDocId):
     Re-test  RT-yyyymm-NNNN — Internal only: run parameters again on a new sample. Two ways: the
       requester (BSU) or the TCM starts it, the other one approves it (retestApprovalChain), then the
       Lab Admin approves by receiving the new sample (cl. 7.4) — only then do the parameters go back
       to Excel (receiveRetestSample). Return to Edit sends it back to its creator; Reject closes it;
     Revision RV-yyyymm-NNNN — CRL / TCM, Internal / Sensory / ASLT: correct Sample Name, Customer
       Address, Packaging (results unchanged).
   The work still runs on the request: re-tested parameters go back to Excel on the request and its
   report goes back to Draft (re-test) or straight to Confirm to Approve (revision); the request
   carries the open cycle (reportCycle.amendmentId). The request stays Closed — its certificate is
   valid until the TCM approves the new one, which supersedes it and closes the document. One open
   document per request at a time (canAmend). The requester sees every document (Internal list
   accordion, note on the request form, Document History) and approves a Re-test the TCM started.
   amendment = { id, type, source, refDocId, refReportNo, tanggal, pemohon, role, reason,
     codes, params, chain, approvalIdx, receipt (Re-test) | fields, changes (Revision),
     step 'Approval' | 'Draft' (returned) | 'Rejected' (Re-test) | 'Open' | 'Closed', issuedNo, issuedAt, activity } */
var AMENDMENTS_STORAGE_KEY = 'holabsysAmendments.en';
var AMENDMENT_TYPES = {
  'Re-test': { key: 'retest', prefix: 'RT-', icon: 'ri-restart-line', roles: ['BSU', 'TCM'], sources: ['internal'] },
  'Revision': { key: 'revision', prefix: 'RV-', icon: 'ri-edit-2-line', roles: ['CRL', 'TCM'], sources: ['internal', 'sensory', 'aslt'] }
};
var AMENDMENT_FORM_PAGE = 'amendmentForm.html';
/* Re-test approval: the other side approves (TCM started → requester, requester started → TCM), then
   the Lab Admin, whose approval is receiving the new sample */
function retestApprovalChain(creatorCode) {
  return [creatorCode === 'BSU' ? 'TCM' : 'BSU', 'ADM'];
}

function getAmendments() {
  try { return JSON.parse(localStorage.getItem(AMENDMENTS_STORAGE_KEY)) || []; } catch (e) { return []; }
}
function getAmendmentById(id) {
  return getAmendments().filter(function (a) { return a.id === id; })[0] || null;
}
/* Documents of one request, oldest first */
function amendmentsOf(refDocId) {
  return getAmendments().filter(function (a) { return a.refDocId === refDocId; })
    .sort(function (a, b) { return a.id.localeCompare(b.id); });
}
/* patch merged; entry = { action, note, variant } appended to the document's own history */
function updateAmendment(id, patch, entry) {
  var list = getAmendments();
  var idx = -1;
  list.forEach(function (a, i) { if (a.id === id) idx = i; });
  var next = Object.assign({}, idx === -1 ? { id: id } : list[idx], patch);
  if (entry) {
    var who = typeof currentRole === 'function' ? currentRole() : { name: 'System', label: '' };
    next.activity = (next.activity || []).concat({ at: nowStamp(), ts: Date.now(), by: who.name, role: who.label,
      action: entry.action, note: entry.note || '', variant: entry.variant || 'primary' });
  }
  if (idx === -1) list.push(next); else list[idx] = next;
  localStorage.setItem(AMENDMENTS_STORAGE_KEY, JSON.stringify(list));
  return next;
}
function amendmentHref(id, extra) {
  return AMENDMENT_FORM_PAGE + '?docId=' + encodeURIComponent(id) + (extra || '');
}
/* The request behind a document (Sensory / ASLT need dummy-aslt-sensory-requests.js) */
function amendmentParent(a) {
  if (!a) return null;
  if (a.source === 'sensory') return typeof getSensoryRequestById === 'function' ? getSensoryRequestById(a.refDocId) : null;
  if (a.source === 'aslt') return typeof getAsltRequestById === 'function' ? getAsltRequestById(a.refDocId) : null;
  return getRequestById(a.refDocId);
}
function amendmentStore(source) {
  return function (id, patch) { return typeof worksheetUpdateRecord === 'function' ? worksheetUpdateRecord(source, id, patch) : updateRequest(id, patch); };
}
/* The open document of a request (its reportCycle points to it), else null. Cycles opened before the
   documents existed have no amendmentId: they finish on the request's own Report tab as before. */
function openAmendmentOf(r) {
  var id = r && r.reportCycle && r.reportCycle.amendmentId;
  return id ? getAmendmentById(id) : null;
}
/* '' when role may start this type on request r, else why not */
function amendmentBlocker(type, source, r, role) {
  var t = AMENDMENT_TYPES[type];
  if (!t || t.sources.indexOf(source) === -1) return type + ' is not available here.';
  if (!role || t.roles.indexOf(role.code) === -1) return type + ' is started by the ' + t.roles.join(' / ') + '.';
  if (!r || !lastIssuedReport(r)) return 'Only after the certificate is issued.';
  if (r.reportCycle) return (openAmendmentOf(r) ? r.reportCycle.amendmentId : 'A ' + r.reportCycle.type) + ' is still open for this request.';
  if (r.reportStatus !== 'Final') return 'Only after the certificate is issued.';
  return '';
}
function canAmend(type, source, r, role) { return !amendmentBlocker(type, source, r, role); }

/* Header buttons of a request form / its Report tab: start a new document (links, no dialog) */
function amendmentButtonsHtml(source, r, role) {
  return Object.keys(AMENDMENT_TYPES).filter(function (type) { return canAmend(type, source, r, role); }).map(function (type) {
    var t = AMENDMENT_TYPES[type];
    var href = AMENDMENT_FORM_PAGE + '?ref=' + encodeURIComponent(r.id) + '&src=' + source + '&type=' + t.key;
    return '<a href="' + href + '" class="btn btn-danger btn-sm btn-wave d-inline-flex align-items-center"><i class="' + t.icon + ' me-1"></i><span>' + type + '</span></a>';
  }).join('');
}

/* ---------- Request list accordion (port of the New Material Registration list, onegenesis-web) ----------
   A request with Re-test / Revision documents gets an expand button (SpkButton light btn-icon) and a
   count badge in its Transaction ID cell; expanded, one indented child row per document under it.
   cells(a) → the <td>s after Action and Transaction ID. */
function amendmentToggleHtml(r, expanded) {
  var n = amendmentsOf(r.id).length;
  if (!n) return '<span class="d-inline-block me-2" style="width:28px"></span>';
  return '<button type="button" class="btn btn-icon btn-sm btn-light me-2" data-amend-toggle="' + r.id + '" title="' +
    (expanded ? 'Collapse documents' : 'Expand Re-test / Revision documents') + '"><i class="' + (expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line') + '"></i></button>' +
    '<span class="badge bg-info-transparent me-2">' + n + (n > 1 ? ' Documents' : ' Document') + '</span>';
}
function amendmentChildRowsHtml(r, cells) {
  return amendmentsOf(r.id).map(function (a) {
    var href = amendmentHref(a.id);
    return '<tr class="amend-child-row">' +
      '<td><a href="' + href + '" class="btn btn-icon btn-sm btn-primary-light btn-wave" title="Open ' + a.type + ' ' + a.id + '"><i class="ri-eye-line"></i></a></td>' +
      '<td><span class="ms-4 ps-3"><i class="ri-corner-down-right-line me-1 text-muted"></i><a href="' + href + '" class="text-primary fw-bold font-monospace">' + a.id + '</a></span></td>' +
      cells(a) + '</tr>';
  }).join('');
}
/* What a document changes, for list rows: the re-tested parameters or the corrected fields */
function amendmentSummary(a) {
  return a.type === 'Re-test' ? (a.params || []).join(', ') : (a.changes || []).map(function (c) { return c.split(':')[0]; }).join(', ');
}
/* Ids of the requests whose documents match a search (the accordion opens for them) */
function amendmentMatches(query) {
  var q = String(query || '').trim().toLowerCase();
  if (!q) return {};
  var out = {};
  getAmendments().forEach(function (a) {
    if ([a.id, a.type, amendmentSummary(a)].some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; })) out[a.refDocId] = true;
  });
  return out;
}

/* Status of a document: New → Confirmed (+ where its report is) → Closed (new certificate issued) */
function getAmendmentStatus(a) {
  if (!a || !a.step) return { status: 'New', workflow: null };
  if (a.step === 'Closed') return { status: 'Closed', workflow: null };
  if (a.step === 'Rejected') return { status: 'Rejected', workflow: null };
  if (a.step === 'Draft') return { status: a.returned ? 'Return to Edit' : 'Draft', workflow: null };
  if (a.step === 'Approval') {
    var code = (a.chain || [])[a.approvalIdx || 0];
    var who = typeof findRole === 'function' && findRole(code) ? findRole(code).label : code;
    return { status: a.approvalIdx > 0 ? 'Partially Approved' : 'Confirm To Approve',
      workflow: code === 'ADM' ? 'Waiting for Sample Receipt' : 'Waiting for ' + who + ' Approval' };
  }
  var p = amendmentParent(a) || {};
  var workflow = 'Waiting for Report Approval';
  if (p.reportStatus === 'Draft') {
    var waiting = a.type === 'Re-test' && (a.codes || []).some(function (c) { return !(p.results && p.results[c]); });
    workflow = a.type === 'Revision' ? 'Returned to CRL' : (waiting ? 'Waiting for Results (Excel)' : 'Waiting for CRL Review');
  }
  return { status: 'Confirmed', workflow: workflow };
}
function amendmentStatusBadgesHtml(a) {
  var s = getAmendmentStatus(a);
  var meta = DOC_STATUS[s.status];
  return spkStatusPill(meta.list, meta.icon, s.status) + (s.workflow ? ' ' + spkStatusPill('warning', 'ri-time-line', s.workflow) : '');
}
function amendmentStatusCardHtml(a) {
  var s = getAmendmentStatus(a);
  var meta = DOC_STATUS[s.status];
  var big = 'd-inline-flex align-items-center gap-1 py-2 px-3 fs-11 lh-1 rounded-1';
  var sep = '<span class="d-none d-sm-inline-block text-muted opacity-50 fs-10 user-select-none lh-1">|</span>';
  return '<span class="badge bg-' + meta.card + '-transparent ' + big + '"><i class="' + meta.icon + ' fs-13"></i>' + s.status + '</span>' +
    (s.workflow ? sep + '<span class="badge bg-warning-transparent ' + big + '"><i class="ri-time-line fs-13"></i>' + s.workflow + '</span>' : '');
}
function amendmentTypeBadgeHtml(type) {
  return '<span class="badge bg-danger-transparent"><i class="' + AMENDMENT_TYPES[type].icon + ' me-1"></i>' + type + '</span>';
}

/* Parameters of the request with whether they can be re-tested: [{ code, text, ok, why }] — a
   parameter qualifies once its first run exists (reagents deducted at SPK issue, raw data saved or a
   result pushed); one that was never tested has nothing to repeat. */
function retestCandidates(r) {
  if (!r || r.step !== 'Done') return [];
  var ran = r.reagentDeducted || [];
  return (r.paramsDiterima || r.params || []).map(function (code) {
    var p = typeof labParameter === 'function' ? labParameter('Internal', code) : null;
    var tested = ran.indexOf(code) !== -1 || !!(r.results && r.results[code]) || !!(r.rawData && r.rawData[code]);
    return { code: code, text: p ? p.text : code, ok: tested, why: tested ? '' : 'Not tested' };
  });
}

/* Re-test whose parameters are still waiting for a new result (or null) */
function openRetest(r) {
  var list = (r && r.retests) || [];
  for (var i = list.length - 1; i >= 0; i--) {
    var codes = list[i].codes || [];
    if (codes.some(function (c) { return !(r.results && r.results[c]); })) return list[i];
  }
  return null;
}
/* "Re-test RT-…" label of one parameter while its new result is still missing, else '' */
function retestLabelFor(r, code) {
  var t = openRetest(r);
  return t && (t.codes || []).indexOf(code) !== -1 && !(r.results && r.results[code]) ? 'Re-test ' + (t.amendmentId || t.no) : '';
}

/* Keep the version issued so far in the history with a snapshot (seeded or older reports were
   finalized without one), so it stays downloadable while the new version is worked on */
function ensureReportHistory(source, r) {
  if ((r.reportHistory || []).length || !(r.reportStatus === 'Final' && r.reportNo)) return r;
  return amendmentStore(source)(r.id, { reportHistory: [{ no: r.reportNo, type: 'Original', at: '-', reason: '', snapshot: reportSnapshot(r) }] });
}

/* Re-test on the request: results of the chosen parameters cleared (kept in resultLog, cl. 7.5.2),
   one more reagent run deducted (not for Subcontract), a Nonconforming Work Quality Record (cl. 7.10),
   report back to Draft → next issue <base>-RT<n>. by = currentRole(). */
function applyRetest(r, codes, reason, by, amendmentId) {
  var no = (r.retests || []).length + 1;
  var texts = codes.map(function (c) { var p = typeof labParameter === 'function' ? labParameter('Internal', c) : null; return p ? p.text : c; });
  var results = Object.assign({}, r.results);
  var raw = Object.assign({}, r.rawData);
  var cleared = {};
  codes.forEach(function (c) { if (results[c]) cleared[c] = null; delete results[c]; delete raw[c]; });
  var t = { no: no, amendmentId: amendmentId, at: reportStamp(), by: by.label, stage: 'Issued', reason: reason, params: texts, codes: codes, afterIssue: true };
  var rows = typeof deductReagents === 'function'
    ? deductReagents(codes.filter(function (c) { return !paramSubkontrak(r, c); }), amendmentId + ' · Re-test', by.name) : 0;
  if (typeof addQualityRecord === 'function') {
    t.qualityId = addQualityRecord({
      type: 'Nonconforming Work', requestId: r.id,
      params: texts.join(', '), description: reason, source: 'Re-test ' + amendmentId, owner: by.name
    }).id;
  }
  var updated = updateRequest(r.id, { retests: (r.retests || []).concat(t), results: results, rawData: raw,
    resultLog: resultLogWith(r, cleared, 'Superseded by Re-test ' + no, amendmentId + ' — ' + reason),
    reportStatus: 'Draft', reportBase: reportBaseNo(r), reportReturnReason: null,
    reportCycle: { type: 'Re-test', no: reportRetestCount(r) + 1, amendmentId: amendmentId, reason: reason, params: texts, at: t.at, by: t.by } });
  updated._reagentRows = rows;
  return updated;
}

/* Revision fields against the certificate issued so far → ['Sample Name: a → b', …] */
var REVISION_FIELDS = { sampel: 'Sample Name', alamatPelanggan: 'Customer Address', kemasan: 'Packaging' };
function revisionChanges(r, fields, show) {
  var issuedSnap = (lastIssuedReport(r) || {}).snapshot || reportSnapshot(r);
  show = show || function (k, v) { return v || '-'; };
  return Object.keys(REVISION_FIELDS).filter(function (k) { return (fields[k] || '') !== (issuedSnap[k] || ''); }).map(function (k) {
    return REVISION_FIELDS[k] + ': ' + show(k, issuedSnap[k]) + ' → ' + show(k, fields[k]);
  });
}
/* Revision on the request: fields changed, report straight to Confirm to Approve (results unchanged)
   → next issue <base>[-RT<n>]-R<m>. Also the resubmit after the TCM returned it to the CRL. */
function applyRevision(source, r, fields, changes, reason, by, amendmentId) {
  var open = r.reportCycle && r.reportCycle.amendmentId === amendmentId;
  var rt = reportRetestCount(r);
  var revisions = (r.revisions || []).slice();
  var rv = { no: open ? revisions[revisions.length - 1].no : revisions.length + 1, rt: rt, amendmentId: amendmentId, at: reportStamp(), by: by.label, reason: reason, changes: changes };
  if (open) revisions[revisions.length - 1] = rv; else revisions.push(rv);
  return amendmentStore(source)(r.id, Object.assign({}, fields, {
    revisions: revisions, reportBase: reportBaseNo(r), reportStatus: 'Confirm to Approve',
    reportSubmittedBy: by.name, reportSubmittedAt: rv.at, reportReturnReason: null,
    reportCycle: { type: 'Revision', no: revisions.filter(function (x) { return x.rt === rt; }).length, amendmentId: amendmentId,
      reason: reason, changes: changes, at: rv.at, by: rv.by }
  }));
}

/* Submit a new document. data = { codes } (Re-test) | { fields, changes } (Revision), reason.
   Returns { amendment } or { error } */
function createAmendment(type, source, r, data, reason, by) {
  var why = amendmentBlocker(type, source, r, by);
  if (why) return { error: why };
  if (type === 'Re-test') {
    var tested = retestCandidates(r).filter(function (c) { return c.ok; }).map(function (c) { return c.code; });
    if (!(data.codes || []).length || data.codes.some(function (c) { return tested.indexOf(c) === -1; })) return { error: 'Select at least one tested parameter.' };
  } else if (!(data.changes || []).length) return { error: 'Change at least one field.' };
  if (!reason) return { error: 'Reason is required.' };
  var id =nextFreeNo(AMENDMENT_TYPES[type].prefix + currentYm() + '-', getAmendments().map(function (a) { return a.id; }), 4);
  r = ensureReportHistory(source, r);
  var doc = { type: type, source: source, refDocId: r.id, refReportNo: lastIssuedReport(r).no, tanggal: formatDocDate(new Date()),
    pemohon: by.name, role: by.code, departemen: by.dept, reason: reason, step: 'Open' };
  var note;
  if (type === 'Re-test') {
    /* Nothing runs yet: the request only holds the cycle (blocks a second document, shows the badge)
       until the other side and the Lab Admin approve */
    doc.codes = data.codes;
    doc.params = paramTexts(data.codes);
    doc.chain = retestApprovalChain(by.code);
    doc.approvalIdx = 0;
    doc.step = 'Approval';
    amendmentStore(source)(r.id, { reportCycle: { type: 'Re-test', no: reportRetestCount(r) + 1, amendmentId: id, reason: reason,
      params: doc.params, at: reportStamp(), by: by.label, pending: true } });
    note = doc.params.join(', ') + ' — ' + reason + ' · waiting for ' + doc.chain[0];
  } else {
    applyRevision(source, r, data.fields, data.changes, reason, by, id);
    doc.fields = data.fields;
    doc.changes = data.changes;
    note = data.changes.join(' · ') + ' — ' + reason;
  }
  return { amendment: updateAmendment(id, doc, { action: 'Submitted', note: note, variant: 'info' }) };
}

function paramTexts(codes) {
  return (codes || []).map(function (c) { var p = typeof labParameter === 'function' ? labParameter('Internal', c) : null; return p ? p.text : c; });
}

/* ---------- Re-test approval (amendment form) ----------
   by = currentRole(). Each returns { amendment } or { error }. */
function amendmentPendingCode(a) {
  return a && a.step === 'Approval' ? (a.chain || [])[a.approvalIdx || 0] || null : null;
}
function amendmentReasonPatch(by) {
  return { reasonBy: by.label, reasonAt: reportStamp() };
}
/* An approval level that is not the last one (the Lab Admin receives the sample instead) */
function approveAmendment(a, by) {
  var code = amendmentPendingCode(a);
  if (code !== by.code || code === 'ADM') return { error: 'It is not the turn of ' + by.label + '.' };
  var idx = a.approvalIdx || 0;
  return { amendment: updateAmendment(a.id, { approvalIdx: idx + 1 },
    { action: 'Approved', note: 'Level ' + (idx + 1) + ' · ' + code, variant: 'success' }) };
}
/* Last level: the Lab Admin receives the new sample → the re-test starts on the request: results of
   the parameters cleared, reagents deducted, Nonconforming Work, report back to Draft (applyRetest).
   The request prints the new receipt; the earlier one stays in receiptHistory and in the snapshots. */
function receiveRetestSample(a, receipt, by) {
  if (amendmentPendingCode(a) !== 'ADM' || by.code !== 'ADM') return { error: 'Only the Lab Admin receives the sample, after the approval.' };
  var r = getRequestById(a.refDocId);
  updateRequest(r.id, { receipt: receipt, receiptHistory: (r.receiptHistory || []).concat(r.receipt ? [r.receipt] : []) });
  var creator = typeof findRole === 'function' ? findRole(a.role) : by;
  var updated = applyRetest(getRequestById(r.id), a.codes, a.reason, { label: creator.label, name: by.name }, a.id);
  var idx = a.approvalIdx || 0;
  updateAmendment(a.id, { approvalIdx: idx + 1, receipt: receipt, step: 'Open', reagentRows: updated._reagentRows },
    { action: 'Approved', note: 'Level ' + (idx + 1) + ' · ADM', variant: 'success' });
  return { amendment: updateAmendment(a.id, {}, { action: 'Sample Received', variant: 'primary',
    note: receiptSummary(receipt) }), reagentRows: updated._reagentRows };
}
/* Return to Edit: back to its creator, who changes it and submits again (resubmitRetest) */
function returnAmendment(a, reason, by) {
  if (amendmentPendingCode(a) !== by.code) return { error: 'It is not the turn of ' + by.label + '.' };
  return { amendment: updateAmendment(a.id, Object.assign({ step: 'Draft', returned: true, returnReason: reason }, amendmentReasonPatch(by)),
    { action: 'Returned to Edit', note: reason, variant: 'warning' }) };
}
/* Reject: the document ends, the request's certificate stays as it is */
function rejectAmendment(a, reason, by) {
  if (amendmentPendingCode(a) !== by.code) return { error: 'It is not the turn of ' + by.label + '.' };
  var r = amendmentParent(a);
  if (r && r.reportCycle && r.reportCycle.amendmentId === a.id) amendmentStore(a.source)(r.id, { reportCycle: null });
  return { amendment: updateAmendment(a.id, Object.assign({ step: 'Rejected', rejectReason: reason }, amendmentReasonPatch(by)),
    { action: 'Rejected', note: reason, variant: 'danger' }) };
}
function resubmitRetest(a, codes, reason, by) {
  if (a.step !== 'Draft' || by.code !== a.role) return { error: 'Only the creator changes a returned re-test.' };
  var r = amendmentParent(a);
  var tested = retestCandidates(r).filter(function (c) { return c.ok; }).map(function (c) { return c.code; });
  if (!codes.length || codes.some(function (c) { return tested.indexOf(c) === -1; })) return { error: 'Select at least one tested parameter.' };
  if (!reason) return { error: 'Reason is required.' };
  var texts = paramTexts(codes);
  amendmentStore(a.source)(r.id, { reportCycle: Object.assign({}, r.reportCycle, { reason: reason, params: texts }) });
  return { amendment: updateAmendment(a.id, { codes: codes, params: texts, reason: reason, step: 'Approval', approvalIdx: 0, returned: false },
    { action: 'Resubmitted', note: texts.join(', ') + ' — ' + reason + ' · waiting for ' + a.chain[0], variant: 'info' }) };
}

/* Revision returned by the TCM (report Draft again): the CRL / TCM corrects it and submits again */
function resubmitRevision(a, fields, changes, reason, by) {
  var r = amendmentParent(a);
  if (!r || !r.reportCycle || r.reportCycle.amendmentId !== a.id || r.reportStatus !== 'Draft') return { error: 'This revision cannot be changed now.' };
  applyRevision(a.source, r, fields, changes, reason, by, a.id);
  return { amendment: updateAmendment(a.id, { fields: fields, changes: changes, reason: reason },
    { action: 'Resubmitted', note: changes.join(' · ') + ' — ' + reason, variant: 'info' }) };
}

/* TCM approved the new certificate (report-form.js approveAndIssue) → the document is Closed */
function closeAmendment(id, reportNo, replaces) {
  return updateAmendment(id, { step: 'Closed', issuedNo: reportNo, issuedAt: reportStamp() },
    { action: 'Certificate Issued', note: reportNo + (replaces ? ' — supersedes ' + replaces : ''), variant: 'success' });
}

function formatDocDate(d) {
  return String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear();
}

/* Request form page of each report source (the Report tab lives there) */
var REPORT_FORM_PAGE = { internal: 'internalForm.html', sensory: 'sensoryForm.html', aslt: 'asltForm.html' };

/* Report note under the status card of a request form (Internal / Sensory / ASLT): the issued
   certificate with its Download button, and the open Re-test / Revision. jenis = worksheet source. */
function docReportNoteHtml(r, jenis) {
  if (!r) return '';
  /* The report lives in the Report tab of the request form */
  var href = REPORT_FORM_PAGE[jenis] + '?docId=' + encodeURIComponent(r.id) + '&tab=report';
  var issued = lastIssuedReport(r);
  var c = r.reportCycle;
  var html = '';
  var t = !c ? openRetest(r) : null;
  if (t) {
    html += '<div class="alert alert-danger d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-restart-line fs-16"></i>' +
      '<div><div class="fw-semibold">Re-test ' + t.no + ' in progress · ' + t.by + ' · ' + t.at + '</div>' +
      t.params.join(', ') + ' — ' + t.reason + '<div class="text-muted fs-12">The parameters are back in Excel for a new run.</div></div></div>';
  }
  if (c) {
    /* The open Re-test / Revision document, linked */
    var doc = c.amendmentId ? '<a href="' + amendmentHref(c.amendmentId) + '" class="font-monospace">' + c.amendmentId + '</a>' : c.no;
    html += '<div class="alert alert-danger d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-restart-line fs-16"></i>' +
      '<div><div class="fw-semibold">' + c.type + ' ' + doc + (c.pending ? ' requested, waiting for approval' : ' in progress') + ' · ' + c.by + ' · ' + c.at + '</div>' +
      (c.params ? c.params.join(', ') + ' — ' : '') + c.reason +
      (issued ? '<div class="text-muted fs-12">Until it is approved, ' + issued.no + ' stays the valid certificate.</div>' : '') + '</div></div>';
  }
  if (issued) {
    html += '<div class="alert alert-success d-flex align-items-center flex-wrap gap-2 py-2 fs-13 mb-3"><i class="ri-award-line fs-16"></i>' +
      '<div class="flex-fill"><div class="fw-semibold">Certificate ' + issued.no + '</div><div class="fs-12 text-muted">' + issued.type + (issued.at && issued.at !== '-' ? ' · issued ' + issued.at : '') + '</div></div>' +
      '<a href="' + href + '&view=issued" class="btn btn-sm btn-success btn-wave d-inline-flex align-items-center gap-1"><i class="ri-download-2-line"></i> Download Certificate</a></div>';
  }
  return html;
}

/* Compact badges for list tables */
function docStatusBadgesHtml(r) {
  var s = getDocStatus(r);
  var meta = DOC_STATUS[s.status];
  var html = spkStatusPill(meta.list, meta.icon, s.status);
  if (s.workflow) html += ' ' + spkStatusPill('warning', 'ri-time-line', s.workflow);
  return html;
}

/* Large badges for the SpkForm document info bar */
function docStatusCardHtml(r) {
  var s = getDocStatus(r);
  var meta = DOC_STATUS[s.status];
  var big = 'd-inline-flex align-items-center gap-1 py-2 px-3 fs-11 lh-1 rounded-1';
  var sep = '<span class="d-none d-sm-inline-block text-muted opacity-50 fs-10 user-select-none lh-1">|</span>';
  var html = '<span class="badge bg-' + meta.card + '-transparent ' + big + '"><i class="' + meta.icon + ' fs-13"></i>' + s.status + '</span>';
  if (s.workflow) html += sep + '<span class="badge bg-warning-transparent ' + big + '"><i class="ri-time-line fs-13"></i>' + s.workflow + '</span>';
  return html;
}

/* ---------- Who acts next — one answer for the forms, the stepper and the Dashboard ----------
   source: 'internal' | 'external' | 'sensory' | 'aslt'. Returns { code, action, icon } (role code of
   ROLES in og-shell.js) or null when nobody has to act (Closed, Rejected, External Confirmed). */
function docApprovalChain(source, r) {
  if (source === 'external') return typeof externalApprovalChain === 'function' ? externalApprovalChain(r.tipe, r.tujuan) : [];
  return requestApprovalChain(r.tipe, r.tujuan);
}
function nextActor(source, r) {
  if (!r || !r.step || r.step === 'Rejected') return null;
  if (r.step === 'Draft') return { code: 'BSU', action: r.returned ? 'Revise & resubmit' : 'Submit draft', icon: 'ri-edit-2-line' };
  if (r.step === 'Approval') {
    var chain = docApprovalChain(source, r);
    var code = chain[r.approvalIdx || 0];
    if (!code) return null;
    return source === 'internal' && code === 'ADM'
      ? { code: code, action: 'Approve & receive sample', icon: 'ri-inbox-archive-line' }
      : { code: code, action: 'Approve request', icon: 'ri-checkbox-circle-line' };
  }
  if (consentPending(r)) return { code: 'BSU', action: 'Approve review outcome', icon: 'ri-user-received-line' };
  if (r.step === 'Technical Review') return { code: 'CRL', action: 'Technical review', icon: 'ri-file-search-line' };
  if (r.step === 'Sample Delivery') return { code: 'ADM', action: 'Confirm delivery', icon: 'ri-truck-line' };
  if (r.step === 'Scheduling') return { code: 'ADM', action: 'Schedule panel', icon: 'ri-calendar-event-line' };
  if (source === 'external') return null;
  /* A Re-test document waiting for its approval (or returned to its creator) */
  var amend = openAmendmentOf(r);
  if (amend && amend.step === 'Approval') {
    var pc = amendmentPendingCode(amend);
    return pc === 'ADM' ? { code: 'ADM', action: 'Receive re-test sample', icon: 'ri-inbox-archive-line' }
      : { code: pc, action: 'Approve re-test', icon: 'ri-checkbox-circle-line' };
  }
  if (amend && amend.step === 'Draft') return { code: amend.role, action: 'Revise re-test', icon: 'ri-edit-2-line' };
  if (r.reportStatus === 'Final') return null;
  if (r.reportStatus === 'Confirm to Approve') return { code: 'TCM', action: 'Approve & issue report', icon: 'ri-shield-check-line' };
  if (r.reportStatus === 'Draft') return { code: 'CRL', action: 'Review report', icon: 'ri-file-list-3-line' };
  /* Testing: the Analyst enters results in Excel; once every accepted parameter has raw data or a
     result, the Lab Coordinator pushes them to the report */
  var codes = r.paramsDiterima || r.params || [];
  var entered = codes.length && codes.every(function (c) { return (r.results && r.results[c]) || (r.rawData && r.rawData[c]); });
  return entered ? { code: 'CRL', action: 'Push results (Excel)', icon: 'ri-upload-2-line' }
    : { code: 'ANL', action: 'Enter results (Excel)', icon: 'ri-flask-line' };
}

/* ---------- Document progress stepper (request forms) ----------
   Same steps as getDocStatus / nextActor, drawn as one card above the form. */
var DOC_STEPS = {
  internal: [
    { key: 'request', title: 'Request', who: 'Requester' },
    { key: 'approval', title: 'Approval & Sample Receipt', who: '' },
    { key: 'review', title: 'Technical Review', who: 'Lab Coordinator' },
    { key: 'testing', title: 'Testing', who: 'Analyst · Excel' },
    { key: 'report', title: 'Report Review', who: 'CRL → TCM' },
    { key: 'closed', title: 'Certificate', who: 'Requester downloads' }
  ],
  external: [
    { key: 'request', title: 'Request', who: 'Requester' },
    { key: 'approval', title: 'Approval', who: '' },
    { key: 'delivery', title: 'Sample Delivery', who: 'Lab Admin' },
    { key: 'closed', title: 'Vendor COA', who: 'Vendor lab' }
  ],
  panel: [
    { key: 'request', title: 'Request', who: 'Requester' },
    { key: 'approval', title: 'Approval', who: '' },
    { key: 'schedule', title: 'Schedule', who: 'Lab Admin' },
    { key: 'testing', title: 'Panel Testing', who: 'Panelists · Excel' },
    { key: 'report', title: 'Report Review', who: 'CRL → TCM' },
    { key: 'closed', title: 'Certificate', who: 'Requester downloads' }
  ]
};
function docStepKey(source, r) {
  if (!r || !r.step || r.step === 'Draft') return 'request';
  if (r.step === 'Approval') return 'approval';
  if (r.step === 'Technical Review') return 'review';
  if (r.step === 'Sample Delivery') return 'delivery';
  if (r.step === 'Scheduling') return 'schedule';
  if (source === 'external') return 'done';
  if (r.reportStatus === 'Final' || openAmendmentOf(r)) return 'done';
  return r.reportStatus ? 'report' : 'testing';
}
function docProgressHtml(source, r) {
  if (r && r.step === 'Rejected') return '';
  var chain = r && r.tipe ? docApprovalChain(source, r) : null;
  var steps = DOC_STEPS[source === 'internal' || source === 'external' ? source : 'panel'].filter(function (s) {
    return s.key !== 'approval' || !chain || chain.length;
  });
  var key = docStepKey(source, r);
  var at = key === 'done' ? steps.length : steps.map(function (s) { return s.key; }).indexOf(key);
  var actor = nextActor(source, r);
  return '<div class="card custom-card no-print mb-3"><div class="card-body py-3"><div class="doc-stepper">' +
    steps.map(function (s, i) {
      var state = i < at ? 'is-done' : i === at ? 'is-current' : '';
      var who = s.key === 'approval' ? (chain && chain.length ? chain.join(' → ') : 'Approvers') : s.who;
      if (i === at && actor && typeof findRole === 'function') who = findRole(actor.code).label;
      return '<div class="doc-step ' + state + '">' +
        '<span class="doc-step-dot">' + (i < at ? '<i class="ri-check-line"></i>' : (i + 1)) + '</span>' +
        '<div class="doc-step-text"><div class="doc-step-title">' + s.title + '</div><div class="doc-step-who">' + who + '</div></div></div>';
    }).join('') +
    '</div></div></div>';
}


/* ---------- Analysis progress per parameter (Internal list "Progress" column) ----------
   One segment per accepted parameter, from what the analyst did in Excel:
   'done' = result pushed, 'running' = raw data saved (Save Raw Data), 'waiting' = not started.
   A re-test clears the result, so its parameter goes back to waiting. null before the SPK. */
var ANALYSIS_STATE = {
  done: { cls: 'bg-success', label: 'Result in' },
  running: { cls: 'bg-warning', label: 'In analysis' },
  waiting: { cls: '', label: 'Not started' }
};
function analysisProgress(r) {
  if (!r || !r.spk) return null;
  var items = (r.paramsDiterima || r.params || []).map(function (code) {
    var p = typeof labParameter === 'function' ? labParameter('Internal', code) : null;
    var state = r.results && r.results[code] ? 'done' : (r.rawData && r.rawData[code] ? 'running' : 'waiting');
    return { code: code, text: p ? p.text : code, state: state };
  });
  return {
    items: items,
    done: items.filter(function (i) { return i.state === 'done'; }).length,
    running: items.filter(function (i) { return i.state === 'running'; }).length
  };
}
/* Bootstrap 5.3 progress-stacked, one segment per parameter (title = parameter · state) */
function analysisProgressHtml(r) {
  var a = analysisProgress(r);
  if (!a) return '<span class="text-muted fs-12">' + (r && r.step === 'Rejected' ? '-' : 'Waiting for SPK') + '</span>';
  if (!a.items.length) return '<span class="text-muted fs-12">-</span>';
  var w = 100 / a.items.length;
  return '<div style="min-width:140px">' +
    '<div class="progress-stacked progress-sm mb-1">' + a.items.map(function (i) {
      var s = ANALYSIS_STATE[i.state];
      return '<div class="progress" role="progressbar" style="width:' + w + '%" title="' + i.text + ' · ' + s.label + '">' +
        '<div class="progress-bar ' + s.cls + '" style="width:' + (i.state === 'waiting' ? 0 : 100) + '%"></div></div>';
    }).join('') + '</div>' +
    '<div class="fs-11 text-muted">' + a.done + '/' + a.items.length + ' parameters' + (a.running ? ' · ' + a.running + ' in analysis' : '') + '</div></div>';
}
