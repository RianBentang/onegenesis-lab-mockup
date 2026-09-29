/* ---------- Shared dummy External request store (design-only, localStorage-backed) ---------- */
var EXTERNAL_MASTER_SITE = [
  'Head Office', 'Plant Sentul', 'Plant Pati', 'Plant Gresik', 'Plant Rancaekek', 'Plant Cimanggis'
];

var EXTERNAL_MASTER_DEPT = ['Quality Assurance', 'Laboratorium', 'Research & Development', 'Regulatory Affairs', 'Process Development', 'Marketing'];

var EXTERNAL_MASTER_LAB = ['SIG (Saraswanti Indo Genetech)', 'TUV NORD', 'SGS Indonesia'];

var EXTERNAL_MASTER_TUJUAN = [
  'Scale Up', 'R&D Trial', 'Routine QC', 'Customer Complaint', 'Pendaftaran MD (BPOM)', 'Pengujian P5'
];

var EXTERNAL_MASTER_KATEGORI_PANGAN = ['Makanan Ringan', 'Minuman Susu', 'Biskuit & Wafer', 'Cokelat & Kembang Gula', 'Kacang & Snack'];

var EXTERNAL_MASTER_KEMASAN = ['Plastik', 'Cup', 'Kaleng', 'Pouch Alufo', 'Karton'];

var EXTERNAL_MASTER_PARAMETER = [
  { value: 'moisture', text: 'Moisture (Kadar Air)', method: 'SNI 2897:2008', category: 'Fisika Kimia' },
  { value: 'fat', text: 'Kadar Lemak (Fat)', method: 'IK-LAB-02', category: 'Fisika Kimia' },
  { value: 'ffa', text: 'FFA (Free Fatty Acid)', method: 'AOAC 940.28', category: 'Fisika Kimia' },
  { value: 'protein', text: 'Kadar Protein', method: 'IK-LAB-05', category: 'Fisika Kimia' },
  { value: 'salmonella', text: 'Salmonella sp.', method: 'SNI ISO 6579', category: 'Mikrobiologi' },
  { value: 'alt', text: 'Angka Lempeng Total (ALT)', method: 'SNI 2897:2008', category: 'Mikrobiologi' },
  { value: 'pb', text: 'Cemaran Logam (Pb)', method: 'AOAC 999.11', category: 'Fisika Kimia' }
];

var EXTERNAL_REQUESTS_STORAGE_KEY = 'holabsysExternalRequests';

var SEED_EXTERNAL_REQUESTS = [
  {
    id: 'REQ-202609-0031', tanggal: '20-09-2026', tipe: 'Normal', tujuan: 'Routine QC',
    lab: 'SGS Indonesia', sampel: 'Chocolatos Sachet 20g',
    batch: 'B2609-11A', prod: '12-09-2026', kategoriPangan: 'Minuman Susu', kemasan: 'Pouch Alufo',
    params: ['moisture', 'fat'], pemohon: 'Marsya Valentina', departemen: 'Quality Assurance',
    step: 'Draft', approvalIdx: 0, catatanTambahan: ''
  },
  {
    id: 'REQ-202609-0033', tanggal: '21-09-2026', tipe: 'Urgent', tujuan: 'Customer Complaint',
    lab: 'TUV NORD', sampel: 'Slai O Lai Coklat 32g',
    batch: 'B2609-12C', prod: '14-09-2026', kategoriPangan: 'Biskuit & Wafer', kemasan: 'Plastik',
    params: ['salmonella', 'alt'], pemohon: 'Marsya Valentina', departemen: 'Quality Assurance',
    step: 'Approval', approvalIdx: 1, catatanTambahan: ''
  },
  {
    id: 'REQ-202609-0025', tanggal: '18-09-2026', tipe: 'Normal', tujuan: 'Pendaftaran MD (BPOM)',
    lab: 'SIG (Saraswanti Indo Genetech)', sampel: 'Maco Chocolate Wafer 120g',
    batch: 'B2609-09A', prod: '10-09-2026', kategoriPangan: 'Biskuit & Wafer', kemasan: 'Pouch Alufo',
    params: ['moisture', 'pb'], pemohon: 'Marsya Valentina', departemen: 'Quality Assurance',
    step: 'Pengiriman Sampel', approvalIdx: 3, catatanTambahan: ''
  },
  {
    id: 'REQ-202609-0019', tanggal: '16-09-2026', tipe: 'Normal', tujuan: 'Scale Up',
    lab: 'SGS Indonesia', sampel: 'Gery Saluut Kacang 18g',
    batch: 'B2609-06B', prod: '07-09-2026', kategoriPangan: 'Kacang & Snack', kemasan: 'Karton',
    params: ['ffa', 'protein'], pemohon: 'Marsya Valentina', departemen: 'Quality Assurance',
    step: 'Order Confirmation', approvalIdx: 2, catatanTambahan: '',
    reportStatus: null, reportNo: null
  }
];

function getExternalRequests() {
  try {
    var raw = localStorage.getItem(EXTERNAL_REQUESTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EXTERNAL_REQUESTS_STORAGE_KEY, JSON.stringify(SEED_EXTERNAL_REQUESTS));
      return SEED_EXTERNAL_REQUESTS.slice();
    }
    return JSON.parse(raw);
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
  if (idx === -1) {
    list.push(Object.assign({ id: id }, patch));
  } else {
    list[idx] = Object.assign({}, list[idx], patch);
  }
  saveExternalRequests(list);
  return getExternalRequestById(id);
}
