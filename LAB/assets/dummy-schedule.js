/* ---------- Dummy test schedule store (design-only, localStorage-backed) ----------
 * One record = one session of a request. Session number (Sesi 1, 2, ...) is not stored:
 * it is the record's position when a request's sessions are sorted by start time.
 */
var SCHEDULE_STORAGE_KEY = 'holabsysSchedules';

var SCHEDULE_JENIS = {
  Internal: { color: 'primary', form: 'internalForm.html' },
  External: { color: 'info', form: 'externalForm.html' },
  ASLT: { color: 'warning', form: 'asltForm.html' },
  Sensory: { color: 'success', form: 'sensoryForm.html' }
};

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
  { id: 'SCH-0013', requestId: 'SN-202609-0012', jenis: 'Sensory', start: '2026-09-29T10:00', end: '2026-09-29T11:30', analis: 'Dewi Lestari', catatan: 'Panel booth 1-6' },
  { id: 'SCH-0014', requestId: 'SN-202609-0012', jenis: 'Sensory', start: '2026-09-29T15:00', end: '2026-09-29T16:30', analis: 'Dewi Lestari', catatan: 'Panel booth 7-12' },
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
