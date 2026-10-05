/* ---------- Panel sensori: panelis, sesi, nilai & statistik (design-only, localStorage-backed) ----------
   Shared by LAB (ASLT & Sensory → Data Panelis & Statistik, Report) and the PANELIS app
   (login + booth). Needs dummy-aslt-sensory-requests.js loaded first.

   A Sensory / ASLT transaction becomes a panel session when the lab opens it
   (record.panel = { open, codes, oddCode }). Panelists score it in the booth; each submission is
   one entry in PANEL_SCORES_KEY. LAB computes statistics from those entries and sends them to the
   transaction (record.panelStats), which the report prints. */

var PANEL_SCORES_KEY = 'holabsysPanelScores';
var PANEL_LOGIN_KEY = 'holabsysPanelist';

/* Master panelis (dummy). Login: NIK only; name / username come from HRIS (dummy-hris.js). */
var MASTER_PANELIS = [
  { id: 'PN-01', nik: '20180123', name: 'Ayu Pratiwi', tipe: 'Terlatih', booth: 1 },
  { id: 'PN-02', nik: '20170456', name: 'Bima Santoso', tipe: 'Terlatih', booth: 2 },
  { id: 'PN-03', nik: '20190311', name: 'Citra Maharani', tipe: 'Terlatih', booth: 3 },
  { id: 'PN-04', nik: '20160782', name: 'Dimas Prakoso', tipe: 'Terlatih', booth: 4 },
  { id: 'PN-05', nik: '20200145', name: 'Eka Wulandari', tipe: 'Semi Terlatih', booth: 5 },
  { id: 'PN-06', nik: '20210533', name: 'Fajar Nugroho', tipe: 'Semi Terlatih', booth: 6 },
  { id: 'PN-07', nik: '20190877', name: 'Gita Anjani', tipe: 'Semi Terlatih', booth: 1 },
  { id: 'PN-08', nik: '20220219', name: 'Hana Puspita', tipe: 'Semi Terlatih', booth: 2 },
  { id: 'PN-09', nik: '20150664', name: 'Irfan Hakim', tipe: 'Konsumen', booth: 3 },
  { id: 'PN-10', nik: '20230108', name: 'Jihan Safitri', tipe: 'Konsumen', booth: 4 },
  { id: 'PN-11', nik: '20210990', name: 'Kevin Adiputra', tipe: 'Konsumen', booth: 5 },
  { id: 'PN-12', nik: '20220347', name: 'Laras Kusuma', tipe: 'Konsumen', booth: 6 }
];

/* Hedonic scale 1–9 */
var PANEL_HEDONIK = [
  { v: 1, label: 'Amat Sangat Tidak Suka' }, { v: 2, label: 'Sangat Tidak Suka' }, { v: 3, label: 'Tidak Suka' },
  { v: 4, label: 'Agak Tidak Suka' }, { v: 5, label: 'Netral' }, { v: 6, label: 'Agak Suka' },
  { v: 7, label: 'Suka' }, { v: 8, label: 'Sangat Suka' }, { v: 9, label: 'Amat Sangat Suka' }
];

/* Ketepatan = Just-About-Right scale */
var PANEL_JAR = [{ v: 1, label: 'Kurang' }, { v: 2, label: 'Pas' }, { v: 3, label: 'Terlalu' }];

var PANEL_PARAM_LABEL = {
  'internal-rating': 'Internal Rating', 'ranking': 'Ranking', 'triangle': 'Triangle (Pembeda)',
  'quality-monitoring': 'Quality Monitoring', 'organoleptik': 'Organoleptik ASLT'
};
var PANEL_TEST_TYPE = {
  'internal-rating': 'rating', 'quality-monitoring': 'rating', 'organoleptik': 'rating',
  'ranking': 'ranking', 'triangle': 'triangle'
};
var PANEL_DEFAULT_ATRIBUT = {
  'internal-rating': { atribut: ['Warna & Penampakan', 'Aroma', 'Rasa'], ketepatan: ['Rasa Manis'] },
  'quality-monitoring': { atribut: ['Aroma', 'Rasa', 'Tekstur'], ketepatan: [] },
  'ranking': { atribut: ['Rasa'], ketepatan: [] },
  'triangle': { atribut: [], ketepatan: [] }
};
var ASLT_ORGANOLEPTIK_ATRIBUT = ['Penampakan', 'Aroma', 'Rasa', 'Tekstur', 'Aftertaste'];
var PANEL_SPEC_MIN = 6.0; // standar release organoleptik (skor 6)

/* ---------- helpers ---------- */
function panelHash(s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function panelRng(seed) {
  var x = seed >>> 0 || 1;
  return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
}
function panelGenerateCodes(n, seedText) {
  var rnd = panelRng(panelHash(seedText)), out = [];
  while (out.length < n) {
    var c = String(100 + Math.floor(rnd() * 900));
    if (out.indexOf(c) === -1) out.push(c);
  }
  return out;
}
function panelFindPanelis(id) { return MASTER_PANELIS.filter(function (p) { return p.id === id; })[0] || null; }

/* Parameters a sensory record tests (form records have params; old seeds only a "jenis" label) */
function panelSensoryParams(record) {
  if (record.params && record.params.length) return record.params;
  var j = String(record.jenis || '').toLowerCase();
  if (j.indexOf('triangle') !== -1) return ['triangle'];
  if (j.indexOf('ranking') !== -1) return ['ranking'];
  if (j.indexOf('monitoring') !== -1) return ['quality-monitoring'];
  return ['internal-rating'];
}

/* ---------- sessions ---------- */
/* Session definition for one transaction: { id, source, record, title, open, codes, oddCode, tests } */
function panelSessionFor(source, record) {
  if (!record) return null;
  var panel = record.panel || {};
  var tests;
  if (source === 'aslt') {
    tests = [{ param: 'organoleptik', type: 'rating', label: PANEL_PARAM_LABEL.organoleptik, atribut: ASLT_ORGANOLEPTIK_ATRIBUT.slice(), ketepatan: [] }];
  } else {
    tests = panelSensoryParams(record).map(function (p) {
      var m = (record.atributMap && record.atributMap[p]) || PANEL_DEFAULT_ATRIBUT[p] || { atribut: [], ketepatan: [] };
      return { param: p, type: PANEL_TEST_TYPE[p] || 'rating', label: PANEL_PARAM_LABEL[p] || p, atribut: (m.atribut || []).slice(), ketepatan: (m.ketepatan || []).slice() };
    });
  }
  return {
    id: record.id, source: source, record: record,
    title: record.sampel, open: !!panel.open,
    codes: panel.codes || [], oddCode: panel.oddCode || null, tests: tests
  };
}

/* Open a session: fixes the blind codes (3 cups; triangle marks one odd cup) */
function panelOpenSession(source, id) {
  var record = source === 'aslt' ? getAsltRequestById(id) : getSensoryRequestById(id);
  var prev = record.panel || {};
  var codes = prev.codes && prev.codes.length ? prev.codes : panelGenerateCodes(3, id);
  var session = panelSessionFor(source, record);
  var hasTriangle = session.tests.some(function (t) { return t.type === 'triangle'; });
  var patch = { panel: { open: true, codes: codes, oddCode: hasTriangle ? (prev.oddCode || codes[1]) : null, openedAt: prev.openedAt || new Date().toISOString() } };
  return source === 'aslt' ? updateAsltRequest(id, patch) : updateSensoryRequest(id, patch);
}
function panelCloseSession(source, id) {
  var record = source === 'aslt' ? getAsltRequestById(id) : getSensoryRequestById(id);
  var patch = { panel: Object.assign({}, record.panel, { open: false }) };
  return source === 'aslt' ? updateAsltRequest(id, patch) : updateSensoryRequest(id, patch);
}

/* All Sensory / ASLT transactions that can run a panel (approved, running) */
function panelAllSessions() {
  var out = [];
  getSensoryRequests().forEach(function (r) { if (r.step === 'Berjalan') out.push(panelSessionFor('sensory', r)); });
  getAsltRequests().forEach(function (r) { if (r.step === 'Berjalan') out.push(panelSessionFor('aslt', r)); });
  return out;
}
function panelOpenSessions() { return panelAllSessions().filter(function (s) { return s.open; }); }

/* ---------- scores ---------- */
function panelGetScores() {
  try {
    var raw = localStorage.getItem(PANEL_SCORES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through to seed */ }
  var seed = panelSeedScores();
  try { localStorage.setItem(PANEL_SCORES_KEY, JSON.stringify(seed)); } catch (e) { /* private mode */ }
  return seed;
}
function panelSaveScores(list) { try { localStorage.setItem(PANEL_SCORES_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ } }
function panelScoresFor(sessionId) { return panelGetScores().filter(function (s) { return s.sessionId === sessionId; }); }
function panelHasSubmitted(sessionId, panelistId) {
  return panelScoresFor(sessionId).some(function (s) { return s.panelistId === panelistId; });
}
function panelSubmit(entry) {
  var list = panelGetScores();
  list = list.filter(function (s) { return !(s.sessionId === entry.sessionId && s.panelistId === entry.panelistId); });
  list.push(entry);
  panelSaveScores(list);
}

/* Dummy responses for the seeded open sessions, so LAB has statistics to show */
function panelSeedScores() {
  var out = [];
  var plan = [{ source: 'sensory', id: 'SN-202609-0012', n: 8 }, { source: 'sensory', id: 'SN-202609-0011', n: 6 }, { source: 'aslt', id: 'ASLT-202609-001', n: 5 }];
  plan.forEach(function (p) {
    var record = p.source === 'aslt' ? getAsltRequestById(p.id) : getSensoryRequestById(p.id);
    var s = panelSessionFor(p.source, record);
    if (!s || !s.codes.length) return;
    for (var i = 0; i < p.n; i++) {
      var pan = MASTER_PANELIS[i], rnd = panelRng(panelHash(p.id + pan.id));
      var answers = {};
      s.tests.forEach(function (t) {
        if (t.type === 'rating') {
          var scores = {}, jar = {};
          s.codes.forEach(function (code, ci) {
            scores[code] = {}; jar[code] = {};
            t.atribut.forEach(function (a) { scores[code][a] = Math.max(3, Math.min(9, Math.round(7.4 - ci * 0.6 + (rnd() - 0.5) * 3))); });
            t.ketepatan.forEach(function (k) { var r = rnd(); jar[code][k] = r < 0.2 ? 1 : (r < 0.8 ? 2 : 3); });
          });
          answers[t.param] = { scores: scores, jar: jar };
        } else if (t.type === 'triangle') {
          var correct = rnd() < 0.75;
          answers[t.param] = { pick: correct ? s.oddCode : s.codes.filter(function (c) { return c !== s.oddCode; })[0] };
        } else if (t.type === 'ranking') {
          var ranks = {};
          t.atribut.forEach(function (a) {
            var order = s.codes.slice().sort(function () { return rnd() - 0.5; });
            ranks[a] = {}; order.forEach(function (c, ri) { ranks[a][c] = ri + 1; });
          });
          answers[t.param] = { ranks: ranks };
        }
      });
      out.push({ sessionId: p.id, source: p.source, panelistId: pan.id, booth: pan.booth, at: '2026-09-' + String(23 + (i % 5)).padStart(2, '0') + 'T0' + (8 + (i % 2)) + ':' + String(10 + i * 4) + ':00', answers: answers });
    }
  });
  return out;
}

/* ---------- statistics ---------- */
function panelMeanSd(values) {
  var n = values.length;
  if (!n) return { n: 0, mean: null, sd: null, min: null, max: null };
  var mean = values.reduce(function (a, b) { return a + b; }, 0) / n;
  var sd = n > 1 ? Math.sqrt(values.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (n - 1)) : 0;
  return { n: n, mean: mean, sd: sd, min: Math.min.apply(null, values), max: Math.max.apply(null, values) };
}
/* Triangle: smallest number of correct answers that is significant (one-sided binomial, p=1/3) */
function panelTriangleCritical(n, alpha) {
  alpha = alpha || 0.05;
  function comb(a, b) { var r = 1; for (var i = 1; i <= b; i++) r = r * (a - b + i) / i; return r; }
  for (var k = 0; k <= n; k++) {
    var tail = 0;
    for (var j = k; j <= n; j++) tail += comb(n, j) * Math.pow(1 / 3, j) * Math.pow(2 / 3, n - j);
    if (tail <= alpha) return k;
  }
  return n + 1;
}

/* Statistics per test of a session: [{ test, type, rows | triangle | ranking }] */
function panelStatsFor(session) {
  var entries = panelScoresFor(session.id);
  return session.tests.map(function (t) {
    var out = { param: t.param, label: t.label, type: t.type, n: entries.length };
    if (t.type === 'rating') {
      out.rows = [];
      session.codes.forEach(function (code) {
        t.atribut.forEach(function (a) {
          var vals = entries.map(function (e) { var x = e.answers[t.param]; return x && x.scores && x.scores[code] ? x.scores[code][a] : null; })
            .filter(function (v) { return typeof v === 'number'; });
          var st = panelMeanSd(vals);
          out.rows.push({ code: code, atribut: a, n: st.n, mean: st.mean, sd: st.sd, min: st.min, max: st.max, pass: st.mean !== null && st.mean >= PANEL_SPEC_MIN });
        });
      });
      out.jar = [];
      session.codes.forEach(function (code) {
        t.ketepatan.forEach(function (k) {
          var c = { 1: 0, 2: 0, 3: 0 }, n = 0;
          entries.forEach(function (e) { var x = e.answers[t.param]; var v = x && x.jar && x.jar[code] ? x.jar[code][k] : null; if (v) { c[v]++; n++; } });
          out.jar.push({ code: code, ketepatan: k, n: n, kurang: n ? c[1] / n * 100 : 0, pas: n ? c[2] / n * 100 : 0, terlalu: n ? c[3] / n * 100 : 0 });
        });
      });
    } else if (t.type === 'triangle') {
      var n = 0, correct = 0;
      entries.forEach(function (e) { var x = e.answers[t.param]; if (x && x.pick) { n++; if (x.pick === session.oddCode) correct++; } });
      var crit = panelTriangleCritical(n);
      out.triangle = { n: n, correct: correct, critical: crit, significant: n > 0 && correct >= crit, oddCode: session.oddCode };
    } else if (t.type === 'ranking') {
      out.ranking = t.atribut.map(function (a) {
        var sums = session.codes.map(function (code) {
          var vals = entries.map(function (e) { var x = e.answers[t.param]; return x && x.ranks && x.ranks[a] ? x.ranks[a][code] : null; }).filter(Boolean);
          return { code: code, n: vals.length, sum: vals.reduce(function (p, q) { return p + q; }, 0), mean: vals.length ? vals.reduce(function (p, q) { return p + q; }, 0) / vals.length : null };
        }).sort(function (x, y) { return x.sum - y.sum; });
        return { atribut: a, codes: sums };
      });
    }
    return out;
  });
}

function panelFmt(v, d) { return v === null || v === undefined ? '-' : Number(v).toFixed(d === undefined ? 2 : d); }

/* Send statistics to the transaction → it shows in Report as a Draft (or refreshes a Draft) */
function panelSendToReport(source, id) {
  var record = source === 'aslt' ? getAsltRequestById(id) : getSensoryRequestById(id);
  var session = panelSessionFor(source, record);
  var patch = { panelStats: { at: new Date().toISOString(), codes: session.codes, oddCode: session.oddCode, tests: panelStatsFor(session) } };
  if (record.reportStatus !== 'Final') patch.reportStatus = 'Draft';
  return source === 'aslt' ? updateAsltRequest(id, patch) : updateSensoryRequest(id, patch);
}

/* Report rows from record.panelStats: [{ text, unit, method, spec, result, pass }] */
function panelReportRows(record) {
  var rows = [];
  ((record.panelStats && record.panelStats.tests) || []).forEach(function (t) {
    if (t.type === 'rating') {
      (t.rows || []).forEach(function (r) {
        rows.push({ text: t.label + ' — ' + r.atribut + ' (Kode ' + r.code + ')', unit: 'Skala 1-9', spec: 'Min. ' + panelFmt(PANEL_SPEC_MIN, 1),
          result: panelFmt(r.mean) + ' ± ' + panelFmt(r.sd) + ' (n=' + r.n + ')', pass: r.pass });
      });
      (t.jar || []).forEach(function (j) {
        rows.push({ text: t.label + ' — Ketepatan ' + j.ketepatan + ' (Kode ' + j.code + ')', unit: '% panelis', spec: 'Pas ≥ 70%',
          result: 'Kurang ' + panelFmt(j.kurang, 0) + '% · Pas ' + panelFmt(j.pas, 0) + '% · Terlalu ' + panelFmt(j.terlalu, 0) + '%', pass: j.pas >= 70 });
      });
    } else if (t.type === 'triangle' && t.triangle) {
      var tr = t.triangle;
      rows.push({ text: t.label + ' — Perbedaan Sampel', unit: 'Jawaban benar', spec: 'Min. ' + tr.critical + ' benar (α 0,05)',
        result: tr.correct + ' / ' + tr.n + (tr.significant ? ' — Beda nyata' : ' — Tidak beda nyata'), pass: true });
    } else if (t.type === 'ranking') {
      (t.ranking || []).forEach(function (rk) {
        rows.push({ text: t.label + ' — ' + rk.atribut, unit: 'Jumlah rank', spec: 'Terkecil = paling disukai',
          result: rk.codes.map(function (c) { return c.code + ': ' + c.sum; }).join(' · '), pass: true });
      });
    }
  });
  return rows;
}
