/* ---------- Dummy test schedule store (design-only, localStorage-backed) ----------
 * One record = one session of a request. Session number (Sesi 1, 2, ...) is not stored:
 * it is the record's position when a request's sessions are sorted by start time.
 *
 * Sensory / ASLT sessions can carry panelists: [{ nik, name, source: 'HRIS' | 'Non-HRIS', ket }].
 * A session with panelists is a panel session: the PANELIS booth shows it to those panelists
 * while it runs (start–end). Non-HRIS panelists (e.g. interns) are registered right here with
 * their NIK magang; they have no HRIS record.
 */
var SCHEDULE_STORAGE_KEY = 'holabsysSchedules.v2';

var SCHEDULE_JENIS = {
  Internal: { color: 'primary', form: 'internalForm.html' },
  External: { color: 'info', form: 'externalForm.html' },
  ASLT: { color: 'warning', form: 'asltForm.html' },
  Sensory: { color: 'success', form: 'sensoryForm.html' }
};

/* Seed panel sessions are placed relative to the day the seed is written, so there is always
   a running session to try in the booth: yesterday (done), now (running), tomorrow (scheduled). */
function _schAt(dayOffset, hhmm) {
  var d = new Date();
  d.setDate(d.getDate() + dayOffset);
  var p = function (n) { return String(n).padStart(2, '0'); };
  if (!hhmm) {
    // "now" slot: from the last full half hour minus 1 hour
    d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
    d.setHours(d.getHours() - 1);
  } else {
    d.setHours(Number(hhmm.slice(0, 2)), Number(hhmm.slice(3, 5)), 0, 0);
  }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function _schPlusHours(iso, h) {
  var d = new Date(iso);
  d.setMinutes(d.getMinutes() + h * 60);
  var p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function _hris(nik, name) { return { nik: nik, name: name, source: 'HRIS', ket: '' }; }
var _NOW_SLOT = _schAt(0);

var SEED_SCHEDULES = [
  { id: 'SCH-0001', requestId: 'REQ-202609-0018', jenis: 'Internal', start: '2026-09-29T08:00', end: '2026-09-29T10:00', analis: 'Budi Santoso', catatan: 'Preparasi sampel & moisture' },
  { id: 'SCH-0002', requestId: 'REQ-202609-0018', jenis: 'Internal', start: '2026-09-30T13:00', end: '2026-09-30T15:30', analis: 'Budi Santoso', catatan: 'Analisa lemak' },
  { id: 'SCH-0003', requestId: 'REQ-202609-0021', jenis: 'Internal', start: '2026-09-29T08:30', end: '2026-09-29T11:00', analis: 'Galih Saputra', catatan: '' },
  { id: 'SCH-0004', requestId: 'REQ-202609-0021', jenis: 'Internal', start: '2026-10-01T09:00', end: '2026-10-01T11:00', analis: 'Galih Saputra', catatan: '' },
  { id: 'SCH-0005', requestId: 'REQ-202609-0027', jenis: 'Internal', start: '2026-09-29T10:00', end: '2026-09-29T12:00', analis: 'Dewi Lestari', catatan: '' },
  { id: 'SCH-0006', requestId: 'REQ-202609-0027', jenis: 'Internal', start: '2026-09-29T13:00', end: '2026-09-29T15:00', analis: 'Dewi Lestari', catatan: '' },
  { id: 'SCH-0007', requestId: 'REQ-202609-0027', jenis: 'Internal', start: '2026-10-02T08:00', end: '2026-10-02T10:00', analis: 'Dewi Lestari', catatan: 'Verifikasi ulang' },
  { id: 'SCH-0008', requestId: 'REQ-202609-0031', jenis: 'External', start: '2026-09-29T09:00', end: '2026-09-29T10:00', analis: '', catatan: 'Pengiriman sampel ke SGS' },
  { id: 'SCH-0009', requestId: 'REQ-202609-0031', jenis: 'External', start: '2026-10-06T14:00', end: '2026-10-06T15:00', analis: '', catatan: 'Terima hasil' },
  { id: 'SCH-0010', requestId: 'ASLT-202609-001', jenis: 'ASLT', start: '2026-09-29T14:00', end: '2026-09-29T16:00', analis: 'Budi Santoso', catatan: 'Tarik sampel H-28' },
  { id: 'SCH-0011', requestId: 'ASLT-202609-001', jenis: 'ASLT', start: '2026-10-27T14:00', end: '2026-10-27T16:00', analis: 'Budi Santoso', catatan: 'Tarik sampel H-56' },
  { id: 'SCH-0012', requestId: 'ASLT-202609-002', jenis: 'ASLT', start: '2026-09-24T09:00', end: '2026-09-24T11:00', analis: 'Galih Saputra', catatan: '' },
  /* Panel sessions (Sensory / ASLT organoleptik) */
  { id: 'SCH-0013', requestId: 'SN-202609-0011', jenis: 'Sensory', start: _schAt(-1, '09:00'), end: _schAt(-1, '10:30'), analis: 'Dewi Lestari', catatan: 'Uji triangle',
    panelists: [_hris('20180123', 'Ayu Pratiwi'), _hris('20170456', 'Bima Santoso'), _hris('20190311', 'Citra Maharani'), _hris('20160782', 'Dimas Prakoso'),
      _hris('20200145', 'Eka Wulandari'), _hris('20210533', 'Fajar Nugroho'), _hris('20190877', 'Gita Anjani'), _hris('20220219', 'Hana Puspita')] },
  { id: 'SCH-0014', requestId: 'SN-202609-0012', jenis: 'Sensory', start: _schAt(-1, '13:00'), end: _schAt(-1, '14:30'), analis: 'Dewi Lestari', catatan: 'Panel terlatih',
    panelists: [_hris('20150664', 'Irfan Hakim'), _hris('20230108', 'Jihan Safitri'), _hris('20210990', 'Kevin Adiputra'), _hris('20220347', 'Laras Kusuma'), _hris('20160782', 'Dimas Prakoso')] },
  { id: 'SCH-0017', requestId: 'SN-202609-0012', jenis: 'Sensory', start: _NOW_SLOT, end: _schPlusHours(_NOW_SLOT, 4), analis: 'Dewi Lestari', catatan: 'Panel campuran + magang',
    panelists: [_hris('20180123', 'Ayu Pratiwi'), _hris('20170456', 'Bima Santoso'), _hris('20190311', 'Citra Maharani'), _hris('20190877', 'Gita Anjani'),
      { nik: 'MG24090017', name: 'Nadia Rahma', source: 'Non-HRIS', ket: 'Magang QC · Universitas Brawijaya' }] },
  { id: 'SCH-0018', requestId: 'ASLT-202609-001', jenis: 'ASLT', start: _NOW_SLOT, end: _schPlusHours(_NOW_SLOT, 4), analis: 'Budi Santoso', catatan: 'Organoleptik H-28',
    panelists: [_hris('20180123', 'Ayu Pratiwi'), _hris('20160782', 'Dimas Prakoso'), _hris('20200145', 'Eka Wulandari'), _hris('20210533', 'Fajar Nugroho'),
      { nik: 'MG24090021', name: 'Rizky Pratama', source: 'Non-HRIS', ket: 'Magang R&D · IPB University' }] },
  { id: 'SCH-0019', requestId: 'SN-202609-0009', jenis: 'Sensory', start: _schAt(1, '10:00'), end: _schAt(1, '11:30'), analis: 'Dewi Lestari', catatan: 'Uji ranking',
    panelists: [_hris('20190877', 'Gita Anjani'), _hris('20220219', 'Hana Puspita'), _hris('20150664', 'Irfan Hakim'), _hris('20180123', 'Ayu Pratiwi')] },
  { id: 'SCH-0015', requestId: 'REQ-202609-0025', jenis: 'Internal', start: '2026-09-22T08:00', end: '2026-09-22T12:00', analis: 'Galih Saputra', catatan: '' },
  { id: 'SCH-0016', requestId: 'REQ-202609-0025', jenis: 'Internal', start: '2026-09-23T08:00', end: '2026-09-23T12:00', analis: 'Galih Saputra', catatan: '' }
];

function getSchedules() {
  try {
    var raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(SEED_SCHEDULES));
      return SEED_SCHEDULES.slice();
    }
    return JSON.parse(raw);
  } catch (e) {
    return SEED_SCHEDULES.slice();
  }
}

function saveSchedules(list) {
  try { localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
}

function nextScheduleId(list) {
  var max = 0;
  list.forEach(function (s) { var n = parseInt(s.id.replace('SCH-', ''), 10); if (n > max) max = n; });
  return 'SCH-' + String(max + 1).padStart(4, '0');
}

/* Requests from every HOLABSYS store, tagged with their jenis. */
function getSchedulableRequests() {
  var out = [];
  var add = function (list, jenis) {
    list.forEach(function (r) { out.push({ id: r.id, jenis: jenis, sampel: r.sampel || '' }); });
  };
  add(getRequests(), 'Internal');
  add(getExternalRequests(), 'External');
  add(getAsltRequests(), 'ASLT');
  add(getSensoryRequests(), 'Sensory');
  return out;
}
