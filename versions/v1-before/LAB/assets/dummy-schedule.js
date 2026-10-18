/* ---------- Dummy panel schedule store (design-only, localStorage-backed) ----------
 * Schedule is only for the sensory panel: Sensory and ASLT (organoleptik). Internal / External
 * have no schedule. One record = one panel session of a request.
 *
 * - Sensory: fixed slots, the time cannot be changed. A record stores `slot` (1, 2, 3) and the
 *   matching start / end. One slot can hold many requests. Panelists are open: anyone can log in
 *   at the booth and score while the session runs.
 * - ASLT: free time (start / end can be set and dragged). Panelists are not registered either,
 *   but at most ASLT_PANEL_QUOTA people can score one session.
 */
var SCHEDULE_STORAGE_KEY = 'holabsysSchedules.v3.en';

var SCHEDULE_JENIS = {
  Sensory: { color: 'success', form: 'sensoryForm.html' },
  ASLT: { color: 'warning', form: 'asltForm.html' }
};

var SENSORY_SLOTS = {
  1: { start: '10:00', end: '12:00' },
  2: { start: '13:00', end: '15:00' },
  3: { start: '15:00', end: '17:00' }
};
function sensorySlotLabel(slot) {
  var s = SENSORY_SLOTS[slot];
  return s ? 'Session ' + slot + ' (' + s.start + '–' + s.end + ')' : '-';
}
/* One Sensory session (date + slot) runs one kind of test only: Triangle or Non-Triangle
   (rating / ranking / quality monitoring), so the booth never mixes the two. */
function sensorySessionKind(requestId) {
  var r = typeof getSensoryRequestById === 'function' ? getSensoryRequestById(requestId) : null;
  return r && (r.params || [])[0] === 'triangle' ? 'Triangle' : 'Non-Triangle';
}
/* Calendar colour of a Sensory session by its kind (ASLT uses SCHEDULE_JENIS.ASLT.color) */
var SENSORY_KIND_COLOR = { 'Triangle': 'info', 'Non-Triangle': 'success' };
var ASLT_PANEL_QUOTA = 5;

/* Mockup-only test mode (not in the real app, like the role switcher): while on, every Sensory /
   ASLT session counts as running, whatever the clock says, so the booth can be tested outside
   the session hours. Off = real time. Shared by LAB and PANELIS through localStorage. */
var SCHEDULE_TEST_MODE_KEY = 'holabsysScheduleTestMode';
function scheduleTestMode() {
  try { return localStorage.getItem(SCHEDULE_TEST_MODE_KEY) === '1'; } catch (e) { return false; }
}
function setScheduleTestMode(on) {
  try { if (on) localStorage.setItem(SCHEDULE_TEST_MODE_KEY, '1'); else localStorage.removeItem(SCHEDULE_TEST_MODE_KEY); } catch (e) { /* ignore */ }
}

/* Seeds are placed relative to the day the seed is written, so the demo always has sessions
   yesterday (done), today and tomorrow. */
function _schDay(dayOffset) {
  var d = new Date();
  d.setDate(d.getDate() + dayOffset);
  var p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function _sensory(id, requestId, dayOffset, slot, catatan) {
  var day = _schDay(dayOffset);
  return { id: id, requestId: requestId, jenis: 'Sensory', slot: slot, start: day + 'T' + SENSORY_SLOTS[slot].start,
    end: day + 'T' + SENSORY_SLOTS[slot].end, analis: 'Dewi Lestari', catatan: catatan || '' };
}
/* ASLT demo session that runs now: from the last full half hour minus 1 hour, for 4 hours */
function _asltNow() {
  var d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 0 : 30, 0, 0);
  d.setHours(d.getHours() - 1);
  var p = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (x) { return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) + 'T' + p(x.getHours()) + ':' + p(x.getMinutes()); };
  var start = iso(d);
  d.setHours(d.getHours() + 4);
  return { start: start, end: iso(d) };
}
var _ASLT_NOW = _asltNow();

var SEED_SCHEDULES = [
  /* Sensory — fixed slots, several requests may share one slot */
  _sensory('SCH-0013', 'SN-202609-0011', -1, 1, 'Triangle test'),
  _sensory('SCH-0014', 'SN-202609-0012', -1, 2, ''),
  _sensory('SCH-0017', 'SN-202609-0012', 0, 1, ''),
  _sensory('SCH-0019', 'SN-202609-0009', 0, 1, 'Ranking test'),
  _sensory('SCH-0020', 'SN-202609-0012', 0, 3, 'Replicate'),
  _sensory('SCH-0021', 'SN-202609-0009', 1, 2, ''),
  /* ASLT — free time, max 5 panelists per session */
  { id: 'SCH-0010', requestId: 'ASLT-202609-001', jenis: 'ASLT', start: '2026-09-29T14:00', end: '2026-09-29T16:00', analis: 'Budi Santoso', catatan: 'Organoleptic D-21' },
  { id: 'SCH-0018', requestId: 'ASLT-202609-001', jenis: 'ASLT', start: _ASLT_NOW.start, end: _ASLT_NOW.end, analis: 'Budi Santoso', catatan: 'Organoleptic D-28' },
  { id: 'SCH-0011', requestId: 'ASLT-202609-001', jenis: 'ASLT', start: '2026-10-27T14:00', end: '2026-10-27T16:00', analis: 'Budi Santoso', catatan: 'Organoleptic D-56' },
  { id: 'SCH-0012', requestId: 'ASLT-202609-004', jenis: 'ASLT', start: _schDay(1) + 'T09:00', end: _schDay(1) + 'T10:30', analis: 'Galih Saputra', catatan: 'Organoleptic D-14' }
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
  localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(list));
}

function nextScheduleId(list) {
  var max = 0;
  list.forEach(function (s) { var n = parseInt(s.id.replace('SCH-', ''), 10); if (n > max) max = n; });
  return 'SCH-' + String(max + 1).padStart(4, '0');
}

/* Sensory and ASLT requests that can be scheduled, tagged with their jenis. */
function getSchedulableRequests() {
  var out = [];
  var add = function (list, jenis) {
    list.forEach(function (r) {
      // only Fully Approved (Waiting for Schedule) or Confirmed requests run a panel
      if (r.step !== 'Scheduling' && r.step !== 'Running') return;
      out.push({ id: r.id, jenis: jenis, sampel: r.sampel || '', waiting: r.step === 'Scheduling' });
    });
  };
  add(getSensoryRequests(), 'Sensory');
  add(getAsltRequests(), 'ASLT');
  return out;
}
