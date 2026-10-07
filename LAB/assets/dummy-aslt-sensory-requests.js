/* ---------- Shared dummy ASLT & Sensory request stores (design-only, localStorage-backed) ---------- */
var ASLT_STORAGE_KEY = 'holabsysAsltRequests';
var SENSORY_STORAGE_KEY = 'holabsysSensoryRequests';

var SEED_ASLT_REQUESTS = [
  {
    id: 'ASLT-202609-001', tanggal: '05-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    sampel: 'Chocolatos Wafer Stick 16g', kategori: 'NPL',
    suhuChamber: '25°C, 35°C, 45°C (75% RH)',
    kemasan: 'Pouch Alufo 3-Layer (O2TR < 0.5)',
    param: 'Kadar Air & Organoleptik Rasa',
    timepoint: 'H-28 (Sedang Berjalan)',
    rejection: 'Kadar Air > 3.0% / Skor < 6.0',
    status: 'In Chamber',
    panel: { open: true, codes: ['415', '287', '603'], oddCode: null, openedAt: '2026-09-24T08:00:00' }
  },
  {
    id: 'ASLT-202609-002', tanggal: '06-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    sampel: 'Maco Chocolate Wafer 120g', kategori: 'Trial',
    suhuChamber: '35°C, 45°C (75% RH)',
    kemasan: 'Metalized Film (WVTR < 1.0)',
    param: 'Kadar Air, FFA & Kerenyahan',
    timepoint: 'H-60 (Menuju Final)',
    rejection: 'Kadar Air > 3.2% / FFA > 0.5%',
    status: 'In Chamber'
  },
  {
    id: 'ASLT-202609-003', tanggal: '08-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    sampel: 'Pilus Rasa Mie Goreng 85g', kategori: 'Existing',
    suhuChamber: '45°C (75% RH)',
    kemasan: 'Pillow Pack Pillow Bag',
    param: 'Kadar Air & Nilai Peroksida (PV)',
    timepoint: 'H-90 (Selesai Pengamatan)',
    rejection: 'PV > 10 meq/kg',
    status: 'Cek Fiskim Final',
    reportStatus: 'Final', reportNo: 'LHU/LAB/202609/0031', analisHasil: 'Galih Saputra',
    results: { 'kadar-air': { values: [2.61, 2.58, 2.64], result: '2.61' }, 'nilai-peroksida-pv': { values: [4.2, 4.4, 4.3], result: '4.3' } }
  },
  {
    id: 'ASLT-202609-004', tanggal: '10-09-2026', tipe: 'Urgent', alasanUrgent: 'Susulan NPL Q4, deadline launch percepatan.',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    sampel: 'Gery Saluut Malkist Sweet Cheese', kategori: 'NPL',
    suhuChamber: '25°C, 35°C, 45°C',
    kemasan: 'Pillow Pack Flow Wrap',
    param: 'Kadar Air & Organoleptik',
    timepoint: 'H-14 (Sedang Berjalan)',
    rejection: 'Skor Rasa < 6.0',
    status: 'In Chamber'
  },
  {
    id: 'ASLT-202609-005', tanggal: '12-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    sampel: 'Slai O Lai Blueberry Biskuit 32g', kategori: 'Trial',
    suhuChamber: '35°C, 45°C',
    kemasan: 'Plastik Flow Pack',
    param: 'AW Kritis & Jam Brix',
    timepoint: 'H-21',
    rejection: 'AW > 0.65',
    status: 'In Chamber'
  },
  {
    id: 'ASLT-202609-006', tanggal: '14-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    sampel: 'WCG Wafer Cone Chocolate 120g', kategori: 'Re-ASLT',
    suhuChamber: '25°C, 45°C',
    kemasan: 'Pouch Alufo',
    param: 'Kadar Air & Kerenyahan',
    timepoint: 'H-0 (Initial)',
    rejection: 'Kadar Air > 2.8%',
    status: 'Cek Fiskim Initial'
  }
];

var SEED_SENSORY_REQUESTS = [
  {
    id: 'SN-202609-0012', tanggal: '23-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    jenis: 'Uji Sensori Internal - Afektif Rating',
    sampel: 'Chocolatos Wafer Stick Formula Baru',
    blindCodes: ['842', '319', '571'], batch: 'B2609-14A',
    jenisSampel: ['Formula Baru A', 'Formula Baru B', 'Kontrol (Existing)'],
    sesi: 'Sesi 1 (15 Panelis)',
    suhuWadah: 'Ambient · Cawan Plastik',
    status: 'Sesi Aktif',
    panel: { open: true, codes: ['842', '319', '571'], oddCode: null, openedAt: '2026-09-23T08:00:00' }
  },
  {
    id: 'SN-202609-0011', tanggal: '22-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    jenis: 'Uji Triangle',
    sampel: 'Maco Chocolate Wafer vs Kompetitor X',
    blindCodes: ['204', '791', '204'], batch: 'B2609-10C',
    jenisSampel: ['Maco Chocolate Wafer', 'Kompetitor X'],
    sesi: 'Sesi 2 (12 Panelis)',
    suhuWadah: 'Ambient · Piring Kaca',
    status: 'Selesai (Poin 3 Valid)',
    panel: { open: true, codes: ['204', '791', '538'], oddCode: '791', openedAt: '2026-09-22T08:00:00' }
  },
  {
    id: 'SN-202609-0010', tanggal: '20-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    jenis: 'Quality Monitoring',
    sampel: 'Pilus Rasa Mie Goreng (LAB-QM)',
    blindCodes: ['112', '449'], batch: '2 SMD 220427 054',
    jenisSampel: ['PGMF', 'GF2'],
    sesi: 'Sesi Rutin QA (8 Panelis)',
    suhuWadah: 'Ambient · Cawan Plastik',
    status: 'Selesai',
    reportStatus: 'Draft', reportNo: null, analisHasil: 'Dewi Lestari',
    results: { 'kode-112': { values: [7.1, 6.9, 7.3], result: '7.1' }, 'kode-449': { values: [6.4, 6.6, 6.5], result: '6.5' } }
  },
  {
    id: 'SN-202609-0009', tanggal: '18-09-2026', tipe: 'Normal', alasanUrgent: '',
    pemohon: 'Marsya Valentina', departemen: 'Quality Assurance', step: 'Berjalan', approvalIdx: 1,
    jenis: 'Uji Sensori Internal - Afektif Ranking',
    sampel: 'Gery Saluut Sweet Cheese vs 3 Variasi Rasa',
    blindCodes: ['633', '902', '158'], batch: 'B2609-03B',
    jenisSampel: ['Sweet Cheese Original', 'Variasi Keju Plus', 'Variasi Less Sugar'],
    sesi: 'Sesi 1 (20 Panelis)',
    suhuWadah: 'Ambient · Cawan Plastik',
    status: 'Selesai'
  }
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
  if (idx === -1) list.push(Object.assign({ id: id }, patch));
  else list[idx] = Object.assign({}, list[idx], patch);
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
  if (idx === -1) list.push(Object.assign({ id: id }, patch));
  else list[idx] = Object.assign({}, list[idx], patch);
  _sensoryStore.saveAll(list);
  return getSensoryRequestById(id);
}
function addSensoryRequest(record) {
  var list = getSensoryRequests();
  list.push(record);
  _sensoryStore.saveAll(list);
  return record;
}

/* Sample rows of a sensory request, as listed per session in Schedule (like the old app):
   one row per jenis sampel with its 3-digit blind code → [{ jenis, kode }] */
function sensorySampleRows(record) {
  if (!record) return [];
  var codes = (record.panel && record.panel.codes && record.panel.codes.length ? record.panel.codes : (record.blindCodes || []))
    .filter(function (c, i, a) { return a.indexOf(c) === i; });
  var jenis = Array.isArray(record.jenisSampel) ? record.jenisSampel : (record.jenisSampel ? [record.jenisSampel] : []);
  if (!jenis.length) return codes.map(function (c) { return { jenis: '-', kode: c }; });
  return jenis.map(function (j, i) { return { jenis: j, kode: codes[i] || '-' }; });
}
