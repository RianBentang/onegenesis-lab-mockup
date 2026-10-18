/* ---------- Shared dummy request store (design-only, localStorage-backed) ---------- */
/* Analis names as in Master Data → Analis Competency */
var MASTER_ANALIS = ['Budi Santoso', 'Galih Saputra', 'Dewi Lestari', 'Nur Aini', 'Dimas Aditya', 'Putri Ayuningtyas', 'Siti Aminah', 'Rian Hidayat'];

/* Internal requests keep Penunjukan Analis as a list; older records and Sensory / ASLT a string */
function analisLabel(analis) {
  return Array.isArray(analis) ? analis.join(', ') : (analis || '');
}

/* Vendor labs (Master Data → External Vendor): External requests and Internal subkontrak */
var EXTERNAL_MASTER_LAB = ['SIG (Saraswanti Indo Genetech)', 'TUV NORD', 'SGS Indonesia'];

/* Internal parameter sent to a vendor lab (Kaji Ulang Hasil "Subcontract"): the vendor name, else null */
function paramSubkontrak(record, code) {
  var k = record && record.kajiUlang && record.kajiUlang[code];
  return k && k.hasil === 'Subcontract' ? (k.vendor || 'External Lab') : null;
}

var REQUESTS_STORAGE_KEY = 'holabsysRequests.v2.en';

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
   (externalApprovalChain, dummy-external-requests.js). */
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
  }
];

function getRequests() {
  try {
    var raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(SEED_REQUESTS));
      return SEED_REQUESTS.slice();
    }
    /* Requests saved before the Labeling / Review & SPK steps were dropped: Confirmed with an SPK */
    var list = JSON.parse(raw);
    list.forEach(function (r) {
      if (r.step === 'Labeling') r.step = 'Done';
      if (r.step === 'Review & SPK') {
        r.step = 'Done';
        r.spk = r.spk || nextFreeNo('SPK/LAB/' + currentYm() + '/', list.map(function (x) { return x.spk; }), 4);
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
   New → (Draft) → Confirm to Approve → Partially Approved (chain ≥ 2, some approved)
   → Fully Approved → Confirmed. Partially Approved only appears with a chain of 2+ levels.
   Return to Edit and Rejected come from an approver.
   Between Fully Approved and Confirmed the doc runs its workflow; the pending step is shown
   as an extra workflow badge ("Waiting for …"). Internal has no workflow step: the last approval
   issues the SPK and the doc is Confirmed (labels print from the Technical Review & SPK tab).
   A doc whose LHU / COA is Final (reportStatus 'Final') is Closed.
   External requests use the same statuses; their one workflow step is Sample Delivery.
   Sensory / ASLT: one workflow step, Penjadwalan ("Waiting for Schedule"). */
var DOC_STATUS = {
  'New': { cls: 'bg-secondary-transparent', icon: 'ri-file-add-line' },
  'Draft': { cls: 'bg-secondary-transparent', icon: 'ri-draft-line' },
  'Confirm to Approve': { cls: 'bg-info-transparent', icon: 'ri-time-line' },
  'Partially Approved': { cls: 'bg-primary2-transparent', icon: 'ri-checkbox-circle-line' },
  'Fully Approved': { cls: 'bg-primary1-transparent', icon: 'ri-checkbox-circle-line' },
  'Confirmed': { cls: 'bg-success-transparent', icon: 'ri-shield-check-line' },
  'Closed': { cls: 'bg-orange-transparent', icon: 'ri-lock-line' },
  'Return to Edit': { cls: 'bg-warning-transparent', icon: 'ri-arrow-go-back-line' },
  'Rejected': { cls: 'bg-danger-transparent', icon: 'ri-close-circle-line' }
};

/* Pending workflow step after approval, per request step */
var DOC_WORKFLOW = {
  'Sample Delivery': 'Waiting for Sample Delivery', // External: Lab Admin confirms the sample was sent
  'Scheduling': 'Waiting for Schedule' // Sensory / ASLT: the request still has to be put in Schedule
};

/* SPK number, issued at the last approval of an Internal request */
function generateSpkNo() {
  return nextFreeNo('SPK/LAB/' + currentYm() + '/', getRequests().map(function (r) { return r.spk; }), 4);
}

/* Returns { status, workflow } — workflow is null or the pending workflow step label */
function getDocStatus(r) {
  if (!r || !r.step) return { status: 'New', workflow: null };
  if (r.step === 'Rejected') return { status: 'Rejected', workflow: null };
  if (r.step === 'Draft') return { status: r.returned ? 'Return to Edit' : 'Draft', workflow: null };
  if (r.step === 'Approval') return { status: r.approvalIdx > 0 ? 'Partially Approved' : 'Confirm to Approve', workflow: null };
  if (r.reportStatus === 'Final') return { status: 'Closed', workflow: null };
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
    return '<div class="alert alert-danger-transparent d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-close-circle-line fs-16"></i>' +
      '<div><div class="fw-semibold">Rejected' + who + '</div>' + (r.rejectReason || r.reason) + '</div></div>';
  }
  if (r.step === 'Draft' && r.returned && (r.returnReason || r.reason)) {
    return '<div class="alert alert-warning-transparent d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-arrow-go-back-line fs-16"></i>' +
      '<div><div class="fw-semibold">Returned for editing' + who + '</div>' + (r.returnReason || r.reason) + '</div></div>';
  }
  return '';
}

/* ---------- Report numbers: Re-test (TCM, Internal form) and Revision (TCM, Report form) ----------
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
/* Only re-tests after the first issue change the number (a re-test of a Draft is just more testing) */
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
   After an issue the lab can open one cycle at a time (record.reportCycle, cleared at the next issue):
     Re-test (TCM, Internal) → results of the chosen parameters cleared, reagents deducted, back to
       Draft and into Excel → next issue <base>-RT<n>;
     Revision (CRL / TCM) → Sample Name / Customer Address / Packaging changed → Confirm to Approve
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
function reportStatusBadgeHtml(r) {
  var s = reportStatusOf(r);
  return '<span class="badge ' + REPORT_STATUS[s].cls + '"><i class="' + REPORT_STATUS[s].icon + ' me-1"></i>' + s + '</span>' +
    (r && r.reportCycle ? ' <span class="badge bg-danger-transparent"><i class="ri-restart-line me-1"></i>' + r.reportCycle.type + ' ' + r.reportCycle.no + '</span>' : '');
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

/* ---------- Re-test (Internal) — one action for the whole life of a request ----------
   A re-test is "run this parameter again". It belongs to the request, not to the report, so the
   TCM can start it wherever the document is (Internal form or Report form, retest.js):
   - a parameter qualifies once its first run exists: reagents deducted at Technical Review
     (record.reagentDeducted) or a result pushed from Excel. Not tested yet → nothing to re-test,
     the analyst simply tests it (a wrong method / instrument is a Technical Review change).
   - what else happens depends on the stage of the document (retestStage):
     'Testing' (no report yet)  → results of those parameters cleared, Excel marks them [Re-test n];
     'Report'  (Draft / Confirm to Approve, never issued) → same, report back to Draft;
     'Issued'  (a certificate exists) → also opens the Re-test cycle → next issue <base>-RT<n>.
   Every re-test deducts one more run of reagents (deductReagents, dummy-reagents.js). */
var RETEST_STEPS = ['Done', 'Draft Report'];

function retestStage(r) {
  if (lastIssuedReport(r)) return 'Issued';
  return r.reportStatus ? 'Report' : 'Testing';
}

/* Parameters of the request with whether they can be re-tested: [{ code, text, ok, why }] */
function retestCandidates(r) {
  if (!r || RETEST_STEPS.indexOf(r.step) === -1) return [];
  var ran = r.reagentDeducted || [];
  return (r.paramsDiterima || r.params || []).map(function (code) {
    var p = typeof labParameter === 'function' ? labParameter('Internal', code) : null;
    var tested = ran.indexOf(code) !== -1 || !!(r.results && r.results[code]);
    return { code: code, text: p ? p.text : code, ok: tested,
      why: tested ? '' : 'Not tested yet — the first run starts when the Technical Review is saved' };
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
/* "Re-test n" label of one parameter while its new result is still missing, else '' */
function retestLabelFor(r, code) {
  var t = openRetest(r);
  return t && (t.codes || []).indexOf(code) !== -1 && !(r.results && r.results[code]) ? 'Re-test ' + t.no : '';
}

/* Start a re-test: meta = { requestedBy, channel, reason }, by = the TCM. Returns the updated record */
function applyRetest(r, codes, meta, by) {
  var stage = retestStage(r);
  var no = (r.retests || []).length + 1;
  var texts = codes.map(function (c) { var p = typeof labParameter === 'function' ? labParameter('Internal', c) : null; return p ? p.text : c; });
  var results = Object.assign({}, r.results);
  codes.forEach(function (c) { delete results[c]; });
  var t = { no: no, at: reportStamp(), by: by.label, stage: stage, reason: meta.reason, params: texts, codes: codes,
    requestedBy: meta.requestedBy, channel: meta.channel, afterIssue: stage === 'Issued' };
  var rows = typeof deductReagents === 'function'
    ? deductReagents(codes.filter(function (c) { return !paramSubkontrak(r, c); }), (r.spk || r.id) + ' · Re-test ' + no, by.name) : 0;
  var patch = { retests: (r.retests || []).concat(t), results: results };
  if (stage !== 'Testing') {
    patch.reportStatus = 'Draft';
    patch.step = 'Draft Report';
    patch.reportBase = reportBaseNo(r);
    patch.reportReturnReason = null;
  }
  if (stage === 'Issued') {
    patch.reportCycle = { type: 'Re-test', no: reportRetestCount(r) + 1, reason: meta.reason, params: texts,
      requestedBy: meta.requestedBy, channel: meta.channel, at: t.at, by: t.by };
  }
  var updated = updateRequest(r.id, patch);
  updated._reagentRows = rows;
  return updated;
}

/* Report note under the status card of a request form (Internal / Sensory / ASLT): the issued
   certificate with its Download button, and the open Re-test / Revision. jenis = worksheet source. */
function docReportNoteHtml(r, jenis) {
  if (!r) return '';
  var href = 'reportForm.html?docId=' + encodeURIComponent(r.id) + '&jenis=' + jenis;
  var issued = lastIssuedReport(r);
  var c = r.reportCycle;
  var html = '';
  var t = !c ? openRetest(r) : null;
  if (t) {
    html += '<div class="alert alert-danger-transparent d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-restart-line fs-16"></i>' +
      '<div><div class="fw-semibold">Re-test ' + t.no + ' in progress · requested by ' + t.requestedBy + ' via ' + t.channel + ' · ' + t.at + '</div>' +
      t.params.join(', ') + ' — ' + t.reason + '<div class="text-muted fs-12">The parameters are back in Excel for a new run.</div></div></div>';
  }
  if (c) {
    html += '<div class="alert alert-danger-transparent d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-restart-line fs-16"></i>' +
      '<div><div class="fw-semibold">' + c.type + ' ' + c.no + ' in progress · requested by ' + c.requestedBy + ' via ' + c.channel + ' · ' + c.at + '</div>' +
      (c.params ? c.params.join(', ') + ' — ' : '') + c.reason +
      (issued ? '<div class="text-muted fs-12">Until it is approved, ' + issued.no + ' stays the valid certificate.</div>' : '') + '</div></div>';
  }
  if (issued) {
    html += '<div class="alert alert-success-transparent d-flex align-items-center flex-wrap gap-2 py-2 fs-13 mb-3"><i class="ri-award-line fs-16"></i>' +
      '<div class="flex-fill"><div class="fw-semibold">Certificate ' + issued.no + '</div><div class="fs-12 text-muted">' + issued.type + ' · issued ' + issued.at + '</div></div>' +
      '<a href="' + href + '&view=issued" class="btn btn-sm btn-success btn-wave d-inline-flex align-items-center gap-1"><i class="ri-download-2-line"></i> Download Certificate</a></div>';
  }
  return html;
}

/* Compact badges for list tables */
function docStatusBadgesHtml(r) {
  var s = getDocStatus(r);
  var html = '<span class="badge ' + DOC_STATUS[s.status].cls + '">' + s.status + '</span>';
  if (s.workflow) html += ' <span class="badge bg-warning-transparent"><i class="ri-time-line me-1"></i>' + s.workflow + '</span>';
  return html;
}

/* Large badges for the SpkForm document info bar */
function docStatusCardHtml(r) {
  var s = getDocStatus(r);
  var meta = DOC_STATUS[s.status];
  var big = 'd-inline-flex align-items-center gap-1 py-2 px-3 fs-11 lh-1 rounded-1';
  var sep = '<span class="d-none d-sm-inline-block text-muted opacity-50 fs-10 user-select-none lh-1">|</span>';
  var html = '<span class="badge ' + meta.cls + ' ' + big + '"><i class="' + meta.icon + '"></i> ' + s.status + '</span>';
  if (s.workflow) html += sep + '<span class="badge bg-warning-transparent ' + big + '"><i class="ri-time-line"></i> ' + s.workflow + '</span>';
  return html;
}

/* ---------- Analysis progress per parameter (Internal list "Progress" column) ----------
   One segment per accepted parameter, from what the analyst did in Excel:
   'done' = result pushed, 'waiting' = not started ('running' = raw data saved, only in version 2).
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
