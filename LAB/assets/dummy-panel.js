/* ---------- Panel sensori: sesi, panelis, nilai & statistik (design-only, localStorage-backed) ----------
   Shared by LAB (ASLT & Sensory → Sesi Panelis, Excel, Report) and the PANELIS app (login + booth).
   Needs dummy-aslt-sensory-requests.js and dummy-schedule.js loaded first.

   Flow: every Sensory / ASLT session in Schedule is a panel session. Panelists are not
   registered: while a session runs (start–end) anyone can log in at the booth (HRIS NIK, or a
   non-HRIS person such as an intern with NIK magang + name) and score it once. An ASLT session
   takes at most ASLT_PANEL_QUOTA scores. Each submission is one entry in PANEL_SCORES_KEY. Excel
   pulls the entries of a transaction (one row per panelist × sample code), the lab checks them
   and Push Data computes the statistics (record.panelStats) → Report Draft. */

var PANEL_SCORES_KEY = 'holabsysPanelScores.v3';
var PANEL_LOGIN_KEY = 'holabsysPanelist.v3';

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
/* Parameters a sensory record tests (form records have params; old seeds only a "jenis" label) */
function panelSensoryParams(record) {
  if (record.params && record.params.length) return record.params;
  var j = String(record.jenis || '').toLowerCase();
  if (j.indexOf('triangle') !== -1) return ['triangle'];
  if (j.indexOf('ranking') !== -1) return ['ranking'];
  if (j.indexOf('monitoring') !== -1) return ['quality-monitoring'];
  return ['internal-rating'];
}


/* ---------- transaction: what is tested ---------- */
/* Panel definition of one Sensory / ASLT transaction: { id, source, record, title, codes, oddCode, tests }.
   The blind codes are fixed per transaction (3 cups; triangle marks one odd cup). */
function panelTrxFor(source, record) {
  if (!record) return null;
  var panel = record.panel || {};
  var blind = (record.blindCodes || []).filter(function (c, i, a) { return a.indexOf(c) === i; });
  var codes = panel.codes && panel.codes.length ? panel.codes : (blind.length >= 2 ? blind : panelGenerateCodes(Array.isArray(record.jenisSampel) && record.jenisSampel.length >= 2 ? record.jenisSampel.length : 3, record.id));
  var tests;
  if (source === 'aslt') {
    tests = [{ param: 'organoleptik', type: 'rating', label: PANEL_PARAM_LABEL.organoleptik, atribut: ASLT_ORGANOLEPTIK_ATRIBUT.slice(), ketepatan: [] }];
  } else {
    tests = panelSensoryParams(record).map(function (p) {
      var m = (record.atributMap && record.atributMap[p]) || PANEL_DEFAULT_ATRIBUT[p] || { atribut: [], ketepatan: [] };
      return { param: p, type: PANEL_TEST_TYPE[p] || 'rating', label: PANEL_PARAM_LABEL[p] || p, atribut: (m.atribut || []).slice(), ketepatan: (m.ketepatan || []).slice() };
    });
  }
  var hasTriangle = tests.some(function (t) { return t.type === 'triangle'; });
  return {
    id: record.id, source: source, record: record, title: record.sampel,
    codes: codes, oddCode: hasTriangle ? (panel.oddCode || codes[1]) : null, tests: tests
  };
}
function panelTrxById(source, id) {
  return panelTrxFor(source, source === 'aslt' ? getAsltRequestById(id) : getSensoryRequestById(id));
}

/* ---------- sessions: from Schedule ---------- */
function panelLocalIso(d) {
  var p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function panelStatusOf(sch, now) {
  var n = panelLocalIso(now || new Date());
  if (n < sch.start) return 'Terjadwal';
  if (n >= sch.end) return 'Selesai';
  return 'Berlangsung';
}

/* Every Sensory / ASLT schedule session, sorted by start:
   [{ id, sesiLabel, schedule, start, end, status, quota (ASLT) | null, trx }]
   Sensory sessions are named by their fixed slot (Sesi 1–3), ASLT ones by their order in the request. */
function panelSessions() {
  var all = getSchedules();
  var out = [];
  all.forEach(function (sch) {
    if (sch.jenis !== 'Sensory' && sch.jenis !== 'ASLT') return;
    var source = sch.jenis === 'ASLT' ? 'aslt' : 'sensory';
    var trx = panelTrxById(source, sch.requestId);
    if (!trx) return;
    var label;
    if (source === 'sensory') label = sensorySlotLabel(sch.slot);
    else {
      var siblings = all.filter(function (x) { return x.requestId === sch.requestId; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
      label = 'Sesi ' + (siblings.indexOf(sch) + 1);
    }
    out.push({
      id: sch.id, sesiLabel: label, schedule: sch, start: sch.start, end: sch.end,
      status: panelStatusOf(sch), quota: source === 'aslt' ? ASLT_PANEL_QUOTA : null, trx: trx
    });
  });
  return out.sort(function (a, b) { return a.start < b.start ? -1 : 1; });
}
function panelSessionById(id) { return panelSessions().filter(function (s) { return s.id === id; })[0] || null; }
function panelSessionsForTrx(trxId) { return panelSessions().filter(function (s) { return s.trx.id === trxId; }); }
function panelQuotaFull(s) { return !!s.quota && panelScoresForSession(s.id).length >= s.quota; }
/* Sessions this person can score right now: running, not scored by them yet, ASLT quota not full */
function panelOpenSessionsFor(nik) {
  return panelSessions().filter(function (s) {
    return s.status === 'Berlangsung' && !panelHasSubmitted(s.id, nik) && !panelQuotaFull(s);
  });
}
function panelNextSession() { return panelSessions().filter(function (s) { return s.status === 'Terjadwal'; })[0] || null; }

/* ---------- people: HRIS employee by NIK (non-HRIS people give their name at login) ---------- */
/* → { nik, name, source: 'HRIS', username, info } or null */
function panelFindPerson(nik) {
  nik = String(nik || '').trim().toUpperCase();
  var k = nik && typeof hrisFindByNik === 'function' ? hrisFindByNik(nik) : null;
  return k ? { nik: k.nik, name: k.name, source: 'HRIS', username: k.username, info: k.position + ' · ' + k.dept } : null;
}

/* ---------- scores ---------- */
/* Entry: { scheduleId, trxId, source, nik, name, personSource: 'HRIS' | 'Non-HRIS', booth, at, answers } */
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
function panelScoresForSession(scheduleId) { return panelGetScores().filter(function (e) { return e.scheduleId === scheduleId; }); }
function panelScoresForTrx(trxId) { return panelGetScores().filter(function (e) { return e.trxId === trxId; }); }
function panelHasSubmitted(scheduleId, nik) {
  return panelScoresForSession(scheduleId).some(function (e) { return e.nik === nik; });
}
function panelSubmit(entry) {
  var list = panelGetScores().filter(function (e) { return !(e.scheduleId === entry.scheduleId && e.nik === entry.nik); });
  list.push(entry);
  panelSaveScores(list);
}

/* Random but repeatable answers for one panelist on one transaction */
function panelFakeAnswers(trx, seedText) {
  var rnd = panelRng(panelHash(seedText)), answers = {};
  for (var w = 0; w < 5; w++) rnd(); // the first xorshift outputs of similar seeds are close
  trx.tests.forEach(function (t) {
    if (t.type === 'rating') {
      var scores = {}, jar = {};
      trx.codes.forEach(function (code, ci) {
        scores[code] = {}; jar[code] = {};
        t.atribut.forEach(function (a) { scores[code][a] = Math.max(3, Math.min(9, Math.round(7.4 - ci * 0.6 + (rnd() - 0.5) * 3))); });
        t.ketepatan.forEach(function (k) { var r = rnd(); jar[code][k] = r < 0.2 ? 1 : (r < 0.8 ? 2 : 3); });
      });
      answers[t.param] = { scores: scores, jar: jar };
    } else if (t.type === 'triangle') {
      var correct = rnd() < 0.75;
      answers[t.param] = { pick: correct ? trx.oddCode : trx.codes.filter(function (c) { return c !== trx.oddCode; })[0] };
    } else if (t.type === 'ranking') {
      var ranks = {};
      t.atribut.forEach(function (a) {
        var order = trx.codes.slice().sort(function () { return rnd() - 0.5; });
        ranks[a] = {}; order.forEach(function (c, ri) { ranks[a][c] = ri + 1; });
      });
      answers[t.param] = { ranks: ranks };
    }
  });
  return answers;
}

/* People used by the seeded scores (from the dummy HRIS, plus one intern) */
var PANEL_SEED_PEOPLE = [
  { nik: '20170456', name: 'Bima Santoso', source: 'HRIS' }, { nik: '20190311', name: 'Citra Maharani', source: 'HRIS' },
  { nik: '20160782', name: 'Dimas Prakoso', source: 'HRIS' }, { nik: '20200145', name: 'Eka Wulandari', source: 'HRIS' },
  { nik: 'MG24090017', name: 'Nadia Rahma', source: 'Non-HRIS' }, { nik: '20210533', name: 'Fajar Nugroho', source: 'HRIS' },
  { nik: '20190877', name: 'Gita Anjani', source: 'HRIS' }, { nik: '20220219', name: 'Hana Puspita', source: 'HRIS' },
  { nik: '20150664', name: 'Irfan Hakim', source: 'HRIS' }, { nik: '20230108', name: 'Jihan Safitri', source: 'HRIS' }
];

/* Seed: finished sessions get several scores, running ones a few (so the demo login still has
   something to score, and the ASLT session shows its quota filling up) */
function panelSeedScores() {
  var out = [];
  var plan = { 'SCH-0013': 8, 'SCH-0014': 6, 'SCH-0010': 5, 'SCH-0017': 3, 'SCH-0018': 2 };
  panelSessions().forEach(function (s) {
    var n = plan[s.id];
    if (!n || s.status === 'Terjadwal') return;
    PANEL_SEED_PEOPLE.slice(0, n).forEach(function (p, i) {
      var at = new Date(s.start);
      at.setMinutes(at.getMinutes() + 6 + i * 7);
      out.push({ scheduleId: s.id, trxId: s.trx.id, source: s.trx.source, nik: p.nik, name: p.name, personSource: p.source,
        booth: (i % 5) + 1, at: panelLocalIso(at), answers: panelFakeAnswers(s.trx, s.id + p.nik) });
    });
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


/* Statistics per test of a transaction from panel entries (Excel rows):
   [{ param, label, type, n, rows+jar | triangle | ranking }] */
function panelStatsFor(trx, entries) {
  return trx.tests.map(function (t) {
    var mine = entries.filter(function (e) { return e.answers && e.answers[t.param]; });
    var out = { param: t.param, label: t.label, type: t.type, n: mine.length };
    if (t.type === 'rating') {
      out.rows = [];
      trx.codes.forEach(function (code) {
        t.atribut.forEach(function (a) {
          var vals = mine.map(function (e) { var x = e.answers[t.param]; return x.scores && x.scores[code] ? x.scores[code][a] : null; })
            .filter(function (v) { return typeof v === 'number'; });
          var st = panelMeanSd(vals);
          out.rows.push({ code: code, atribut: a, n: st.n, mean: st.mean, sd: st.sd, min: st.min, max: st.max, pass: st.mean !== null && st.mean >= PANEL_SPEC_MIN });
        });
      });
      out.jar = [];
      trx.codes.forEach(function (code) {
        t.ketepatan.forEach(function (k) {
          var c = { 1: 0, 2: 0, 3: 0 }, n = 0;
          mine.forEach(function (e) { var x = e.answers[t.param]; var v = x.jar && x.jar[code] ? x.jar[code][k] : null; if (v) { c[v]++; n++; } });
          out.jar.push({ code: code, ketepatan: k, n: n, kurang: n ? c[1] / n * 100 : 0, pas: n ? c[2] / n * 100 : 0, terlalu: n ? c[3] / n * 100 : 0 });
        });
      });
    } else if (t.type === 'triangle') {
      var n = 0, correct = 0;
      mine.forEach(function (e) { var x = e.answers[t.param]; if (x.pick) { n++; if (String(x.pick) === String(trx.oddCode)) correct++; } });
      var crit = panelTriangleCritical(n);
      out.triangle = { n: n, correct: correct, critical: crit, significant: n > 0 && correct >= crit, oddCode: trx.oddCode };
    } else if (t.type === 'ranking') {
      out.ranking = t.atribut.map(function (a) {
        var sums = trx.codes.map(function (code) {
          var vals = mine.map(function (e) { var x = e.answers[t.param]; return x.ranks && x.ranks[a] ? x.ranks[a][code] : null; }).filter(Boolean);
          var sum = vals.reduce(function (p, q) { return p + q; }, 0);
          return { code: code, n: vals.length, sum: sum, mean: vals.length ? sum / vals.length : null };
        }).sort(function (x, y) { return x.sum - y.sum; });
        return { atribut: a, codes: sums };
      });
    }
    return out;
  });
}

function panelFmt(v, d) { return v === null || v === undefined ? '-' : Number(v).toFixed(d === undefined ? 2 : d); }

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
