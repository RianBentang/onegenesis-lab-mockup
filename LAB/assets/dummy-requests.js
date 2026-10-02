/* ---------- Shared dummy request store (design-only, localStorage-backed) ---------- */
var MASTER_ANALIS = ['Budi Santoso', 'Galih Saputra', 'Dewi Lestari'];

var REQUESTS_STORAGE_KEY = 'holabsysRequests';

var SEED_REQUESTS = [
  {
    id: 'REQ-202609-0018', tanggal: '18-09-2026', tipe: 'Normal', tujuan: 'Routine QC',
    lab: 'Fisika Kimia', sampel: 'Chocolatos Sachet 20g', sku: 'Chocolatos',
    batch: 'B2609-02A', prod: '10-09-2026', kategoriPangan: 'Minuman Susu', kemasan: 'Pouch Alufo',
    params: ['moisture', 'fat'], suhu: 'Ambient Temp', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Draft', approvalIdx: 0,
    spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null, labeled: false
  },
  {
    id: 'REQ-202609-0021', tanggal: '19-09-2026', tipe: 'Urgent', tujuan: 'Customer Complaint',
    lab: 'Mikrobiologi', sampel: 'Slai O Lai Coklat 32g', sku: 'Slai O Lai',
    batch: 'B2609-05C', prod: '12-09-2026', kategoriPangan: 'Biskuit & Wafer', kemasan: 'Plastik',
    params: ['salmonella', 'alt'], suhu: 'Cool (2-8°C)', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Approval', approvalIdx: 1,
    spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null, labeled: false
  },
  {
    id: 'REQ-202609-0027', tanggal: '21-09-2026', tipe: 'Urgent', tujuan: 'Pengujian P5',
    lab: 'Fisika Kimia', sampel: 'Maco Chocolate Wafer 120g', sku: 'MACO - Maco Wafer & Cream',
    batch: 'B2609-08A', prod: '15-09-2026', kategoriPangan: 'Biskuit & Wafer', kemasan: 'Pouch Alufo',
    params: ['moisture', 'salmonella'], suhu: 'Cool (2-8°C)', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Review & SPK', approvalIdx: 5,
    spk: null, hasilKajiUlang: null, catatanKajiUlang: null, analis: null, estSelesai: null, labeled: false
  },
  {
    id: 'REQ-202609-0015', tanggal: '17-09-2026', tipe: 'Normal', tujuan: 'Scale Up',
    lab: 'Fisika Kimia', sampel: 'Gery Saluut Kacang 18g', sku: 'Gery Saluut',
    batch: 'B2609-01B', prod: '08-09-2026', kategoriPangan: 'Kacang & Snack', kemasan: 'Karton',
    params: ['ffa', 'protein'], suhu: 'Ambient Temp', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Labeling', approvalIdx: 1,
    spk: 'SPK/LAB/202609/0011', hasilKajiUlang: 'Diterima Full', catatanKajiUlang: '',
    analis: 'Budi Santoso', estSelesai: '25-09-2026', labeled: false
  },
  {
    id: 'REQ-202609-0009', tanggal: '15-09-2026', tipe: 'Normal', tujuan: 'R&D Trial',
    lab: 'Mikrobiologi', sampel: 'WCG Seasoning Powder', sku: 'WCG - Wafer Cone Gourmet',
    batch: 'B2609-00A', prod: '05-09-2026', kategoriPangan: 'Makanan Ringan', kemasan: 'Cup',
    params: ['pb'], suhu: 'Frozen (-18°C)', pemohon: 'Marsya Valentina',
    departemen: 'Quality Assurance', step: 'Selesai', approvalIdx: 1,
    spk: 'SPK/LAB/202609/0006', hasilKajiUlang: 'Diterima Parsial', catatanKajiUlang: 'Parameter Pb menyusul batch berikutnya.',
    analis: 'Dewi Lestari', estSelesai: '22-09-2026', labeled: true,
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
    return JSON.parse(raw);
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
  if (idx === -1) {
    list.push(Object.assign({ id: id }, patch));
  } else {
    list[idx] = Object.assign({}, list[idx], patch);
  }
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
   → Fully Approved → Confirmed. Return to Edit and Rejected come from an approver.
   A Fully Approved doc still waiting for Kaji Ulang carries a workflow badge. */
var DOC_STATUS = {
  'New': { cls: 'bg-secondary-transparent', icon: 'ri-file-add-line' },
  'Draft': { cls: 'bg-secondary-transparent', icon: 'ri-draft-line' },
  'Confirm to Approve': { cls: 'bg-info-transparent', icon: 'ri-time-line' },
  'Partially Approved': { cls: 'bg-primary2-transparent', icon: 'ri-checkbox-circle-line' },
  'Fully Approved': { cls: 'bg-primary1-transparent', icon: 'ri-checkbox-circle-line' },
  'Confirmed': { cls: 'bg-success-transparent', icon: 'ri-shield-check-line' },
  'Return to Edit': { cls: 'bg-warning-transparent', icon: 'ri-arrow-go-back-line' },
  'Rejected': { cls: 'bg-danger-transparent', icon: 'ri-close-circle-line' }
};

/* Returns { status, workflow } — workflow is null or the pending workflow step label */
function getDocStatus(r) {
  if (!r || !r.step) return { status: 'New', workflow: null };
  if (r.step === 'Rejected') return { status: 'Rejected', workflow: null };
  if (r.step === 'Draft') return { status: r.returned ? 'Return to Edit' : 'Draft', workflow: null };
  if (r.step === 'Approval') return { status: r.approvalIdx > 0 ? 'Partially Approved' : 'Confirm to Approve', workflow: null };
  if (r.step === 'Review & SPK') return { status: 'Fully Approved', workflow: 'Kaji Ulang & SPK' };
  return { status: 'Confirmed', workflow: null };
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
