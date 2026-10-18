/* ---------- PANELIS booth: score the running Sensory / ASLT panel sessions ----------
   Steps: one per sample code for rating tests (hedonik 1–9 per atribut + ketepatan JAR),
   one for ranking (rank the codes per atribut), one for triangle (pick the odd cup).
   Sessions come from Schedule: every running Sensory / ASLT session this person has not scored
   yet (an ASLT session disappears once its quota of panelists is reached).
   Serving plan: the panelist's place in the session (seq = scores already in) picks the serving
   order (Williams design) and, for a triangle, which sample is in which cup (6 balanced patterns);
   panelPlanFor, dummy-panel.js. Submitting stores one entry per panelist per session, with its
   plan (panelSubmit). */
document.addEventListener('DOMContentLoaded', function () {
  var me = panelisCurrent();
  if (!me) { window.location.href = 'index.html'; return; }

  var $ = window.jQuery;
  var content = document.getElementById('boothContent');
  var pickerCard = document.getElementById('sessionPickerCard');
  var sessionSelect = document.getElementById('sessionSelect');
  var state = { session: null, plan: null, steps: [], idx: 0, answers: {} };

  /* ---------- top bar ---------- */
  document.getElementById('boothNo').textContent = 'Sensory Booth #' + String(me.booth).padStart(2, '0');
  document.getElementById('panelistName').textContent = me.panelist.name;
  document.getElementById('panelistMeta').textContent = me.panelist.nik + ' · ' + (me.panelist.username ? '@' + me.panelist.username : 'Non-HRIS');
  document.getElementById('btnTheme').addEventListener('click', panelisToggleTheme);
  document.getElementById('btnLogout').addEventListener('click', function () {
    panelisLogout();
    window.location.href = 'index.html';
  });

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function key(s) { return s.id; }
  function srcLabel(s) { return s.source === 'aslt' ? 'ASLT' : 'Sensory'; }
  /* Sessions this person can score now (running, not scored yet, ASLT quota not full)
     → booth session { id (schedule), trxId, sesiLabel, source, title, trx, tests } */
  function pendingSessions() {
    return panelOpenSessionsFor(me.panelist.nik).map(function (s) {
      return { id: s.id, trxId: s.trx.id, sesiLabel: s.sesiLabel, end: s.end, source: s.trx.source, title: s.trx.title, trx: s.trx, tests: s.trx.tests };
    });
  }

  /* ---------- home: pick the next pending session ---------- */
  function renderHome(preferKey) {
    var list = pendingSessions();
    pickerCard.classList.toggle('d-none', list.length < 2);
    sessionSelect.innerHTML = list.map(function (s) {
      return '<option value="' + key(s) + '">' + s.trxId + ' · ' + s.sesiLabel + ' — ' + esc(s.title) + ' (' + srcLabel(s) + ')</option>';
    }).join('');

    if (!list.length) {
      state.session = null;
      var next = panelNextSession();
      content.innerHTML =
        '<div class="card custom-card"><div class="card-body text-center py-5">' +
          '<span class="avatar avatar-xl bg-primary-transparent rounded-circle mb-3"><i class="ri-cup-line fs-24"></i></span>' +
          '<h5 class="fw-semibold mb-1">No session to score yet</h5>' +
          '<p class="text-muted mb-4">Panel sessions appear automatically according to the schedule set by the lab.' +
            (next ? '<br />Next session: <span class="fw-semibold">' + next.trx.id + ' · ' + next.sesiLabel + '</span>, ' +
              new Date(next.start).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' }) + ' ' + next.start.slice(11, 16) + '.' : '') + '</p>' +
          '<button type="button" class="btn btn-primary-light btn-wave" id="btnReload"><i class="ri-refresh-line me-1 align-middle"></i>Reload</button>' +
        '</div></div>';
      document.getElementById('btnReload').addEventListener('click', function () { renderHome(); });
      return;
    }
    var chosen = list.filter(function (s) { return key(s) === preferKey; })[0] || list[0];
    sessionSelect.value = key(chosen);
    startSession(chosen);
  }

  sessionSelect.addEventListener('change', function () {
    if (state.session && key(state.session) === sessionSelect.value) return;
    var s = pendingSessions().filter(function (x) { return key(x) === sessionSelect.value; })[0];
    if (s) startSession(s);
  });

  function buildSteps(session, plan) {
    var steps = [];
    session.tests.forEach(function (t) {
      if (t.type === 'rating') plan.order.forEach(function (code) { steps.push({ test: t, code: code }); });
      else steps.push({ test: t });
    });
    return steps;
  }

  function startSession(s) {
    var plan = panelPlanFor(s.trx, panelScoresForSession(s.id).length);
    state = { session: s, plan: plan, steps: buildSteps(s, plan), idx: 0, answers: {} };
    renderStep();
  }

  /* ---------- step rendering ---------- */
  var INSTRUCTION = {
    rating: 'Taste the sample by the code on the cup. Rate your liking 1–9 for each attribute, then rate the just-about-right attributes. Rinse with mineral water before the next code.',
    ranking: 'Taste all samples, then rank them from most preferred (rank 1) to least preferred. Ranks must all be different.',
    triangle: 'Three cups are served: two identical samples and one different. Taste from left to right, then pick the DIFFERENT code.'
  };

  function ratingBody(step) {
    var t = step.test;
    var saved = (state.answers[t.param] || { scores: {}, jar: {} });
    var scores = saved.scores[step.code] || {}, jar = saved.jar[step.code] || {};
    var html = '<div class="text-center mb-4">' +
      '<span class="text-muted fs-12 text-uppercase fw-semibold d-block mb-1">Sample code on the cup</span>' +
      '<span class="booth-code font-monospace">' + step.code + '</span>' +
      '<div class="text-muted fs-12 mt-1">' + esc(t.label) + ' &middot; Hedonic scale 1–9</div></div>';

    t.atribut.forEach(function (a, i) {
      var name = 'h' + i;
      html += '<div class="mb-4 pb-3 border-bottom">' +
        '<div class="d-flex justify-content-between align-items-center flex-wrap gap-1 mb-2">' +
          '<span class="fw-semibold">' + (i + 1) + '. ' + esc(a) + '</span>' +
          '<span class="badge bg-primary-transparent" data-label-for="' + name + '">' + (scores[a] ? scores[a] + ' — ' + PANEL_HEDONIK[scores[a] - 1].label : 'Not scored yet') + '</span>' +
        '</div>' +
        '<div class="booth-scale">' + PANEL_HEDONIK.map(function (h) {
          var id = name + '-' + h.v;
          return '<input type="radio" class="btn-check" name="' + name + '" id="' + id + '" value="' + h.v + '" data-atribut="' + esc(a) + '"' + (scores[a] === h.v ? ' checked' : '') + ' />' +
            '<label class="btn btn-outline-primary" for="' + id + '"><span class="fw-semibold fs-15 d-block">' + h.v + '</span><span class="booth-scale-label">' + h.label + '</span></label>';
        }).join('') + '</div></div>';
    });

    t.ketepatan.forEach(function (k, i) {
      var name = 'j' + i;
      html += '<div class="mb-3">' +
        '<div class="fw-semibold mb-2">Just-About-Right: ' + esc(k) + '</div>' +
        '<div class="btn-group w-100" role="group">' + PANEL_JAR.map(function (j) {
          var id = name + '-' + j.v;
          var text = j.v === 2 ? '<i class="ri-check-line me-1"></i>Just Right' : j.label + ' ' + esc(k.toLowerCase());
          return '<input type="radio" class="btn-check" name="' + name + '" id="' + id + '" value="' + j.v + '" data-ketepatan="' + esc(k) + '"' + (jar[k] === j.v ? ' checked' : '') + ' />' +
            '<label class="btn ' + (j.v === 2 ? 'btn-outline-success' : 'btn-outline-secondary') + '" for="' + id + '">' + text + '</label>';
        }).join('') + '</div></div>';
    });
    return html;
  }

  function rankingBody(step) {
    var t = step.test, codes = state.plan.order;
    var saved = (state.answers[t.param] || { ranks: {} }).ranks;
    return t.atribut.map(function (a, ai) {
      return '<div class="mb-4"><div class="fw-semibold mb-2">Rank by: ' + esc(a) + '</div>' +
        '<div class="row g-3">' + codes.map(function (code) {
          var cur = saved[a] ? saved[a][code] : '';
          return '<div class="col-12 col-md-4"><div class="border rounded p-3 text-center">' +
            '<div class="booth-code booth-code-sm font-monospace mb-2">' + code + '</div>' +
            '<select class="form-select" data-rank-atribut="' + esc(a) + '" data-rank-code="' + code + '">' +
              '<option value="">Select rank</option>' +
              codes.map(function (c, i) { return '<option value="' + (i + 1) + '"' + (Number(cur) === i + 1 ? ' selected' : '') + '>Rank ' + (i + 1) + (i === 0 ? ' (most preferred)' : '') + '</option>'; }).join('') +
            '</select></div></div>';
        }).join('') + '</div></div>';
    }).join('');
  }

  function triangleBody(step) {
    var t = step.test;
    var pick = (state.answers[t.param] || {}).pick;
    return '<div class="row g-3 justify-content-center">' + state.plan.order.map(function (code, i) {
      var id = 'tri-' + i;
      return '<div class="col-12 col-sm-4">' +
        '<input type="radio" class="btn-check" name="tri" id="' + id + '" value="' + code + '"' + (pick === code ? ' checked' : '') + ' />' +
        '<label class="btn btn-outline-primary w-100 py-4 booth-cup" for="' + id + '">' +
          '<i class="ri-cup-line fs-24 d-block mb-1"></i><span class="font-monospace fw-semibold fs-20">' + code + '</span>' +
          '<span class="d-block fs-12 mt-1">Cup ' + (i + 1) + '</span></label></div>';
    }).join('') + '</div>';
  }

  function renderStep() {
    var s = state.session, step = state.steps[state.idx], t = step.test;
    var last = state.idx === state.steps.length - 1;
    var pct = Math.round((state.idx + 1) / state.steps.length * 100);
    var body = t.type === 'rating' ? ratingBody(step) : (t.type === 'ranking' ? rankingBody(step) : triangleBody(step));

    content.innerHTML =
      '<div class="card custom-card">' +
        '<div class="card-header justify-content-between flex-wrap gap-2">' +
          '<div><div class="card-title">' + esc(s.title) + '</div>' +
          '<div class="text-muted fs-12 mt-1"><span class="font-monospace">' + s.trxId + '</span> &middot; ' + s.sesiLabel + ' &middot; ' + srcLabel(s) + ' &middot; ' + esc(t.label) + '</div></div>' +
          '<span class="badge bg-primary-transparent">Step ' + (state.idx + 1) + ' of ' + state.steps.length + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="progress progress-xs mb-3"><div class="progress-bar" style="width:' + pct + '%"></div></div>' +
          '<div class="alert alert-primary-transparent d-flex align-items-start gap-2 py-2 fs-13 mb-4"><i class="ri-information-line fs-16"></i><span>' + INSTRUCTION[t.type] +
            (t.type !== 'triangle' ? '<br /><span class="fw-semibold">Your tasting order:</span> <span class="font-monospace">' + state.plan.order.join(' → ') + '</span>' : '') + '</span></div>' +
          body +
        '</div>' +
        '<div class="card-footer d-flex justify-content-between">' +
          '<button type="button" class="btn btn-light btn-wave" id="btnPrev"' + (state.idx === 0 ? ' disabled' : '') + '><i class="ri-arrow-left-line me-1 align-middle"></i>Previous</button>' +
          (last
            ? '<button type="button" class="btn btn-success btn-wave" id="btnNext"><i class="ri-send-plane-fill me-1 align-middle"></i>Submit Scores</button>'
            : '<button type="button" class="btn btn-primary btn-wave" id="btnNext">Next<i class="ri-arrow-right-line ms-1 align-middle"></i></button>') +
        '</div>' +
      '</div>';

    /* live label of the chosen hedonic score */
    content.querySelectorAll('.booth-scale input').forEach(function (input) {
      input.addEventListener('change', function () {
        var badge = content.querySelector('[data-label-for="' + input.name + '"]');
        if (badge) badge.textContent = input.value + ' — ' + PANEL_HEDONIK[input.value - 1].label;
      });
    });
    document.getElementById('btnPrev').addEventListener('click', function () { if (collect(false)) { state.idx--; renderStep(); } });
    document.getElementById('btnNext').addEventListener('click', function () {
      if (!collect(true)) return;
      if (last) submit(); else { state.idx++; renderStep(); }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* Read the current step into state.answers; strict = every question must be answered */
  function collect(strict) {
    var step = state.steps[state.idx], t = step.test;
    if (t.type === 'rating') {
      var ans = state.answers[t.param] = state.answers[t.param] || { scores: {}, jar: {} };
      var sc = ans.scores[step.code] = {}, jr = ans.jar[step.code] = {};
      content.querySelectorAll('input[data-atribut]:checked').forEach(function (i) { sc[i.dataset.atribut] = Number(i.value); });
      content.querySelectorAll('input[data-ketepatan]:checked').forEach(function (i) { jr[i.dataset.ketepatan] = Number(i.value); });
      var missing = t.atribut.filter(function (a) { return !sc[a]; }).concat(t.ketepatan.filter(function (k) { return !jr[k]; }));
      if (strict && missing.length) { ToastService.showWarning('Not scored yet: ' + missing.join(', ') + '.'); return false; }
    } else if (t.type === 'ranking') {
      var ranks = {};
      content.querySelectorAll('select[data-rank-atribut]').forEach(function (sel) {
        var a = sel.dataset.rankAtribut;
        ranks[a] = ranks[a] || {};
        if (sel.value) ranks[a][sel.dataset.rankCode] = Number(sel.value);
      });
      state.answers[t.param] = { ranks: ranks };
      if (strict) {
        var bad = t.atribut.filter(function (a) {
          var vals = state.plan.order.map(function (c) { return ranks[a] && ranks[a][c]; });
          return vals.some(function (v) { return !v; }) || new Set(vals).size !== vals.length;
        });
        if (bad.length) { ToastService.showWarning('Ranks for ' + bad.join(', ') + ' must be complete and all different.'); return false; }
      }
    } else if (t.type === 'triangle') {
      var picked = content.querySelector('input[name="tri"]:checked');
      state.answers[t.param] = { pick: picked ? picked.value : null };
      if (strict && !picked) { ToastService.showWarning('Pick the one sample code that is different.'); return false; }
    }
    return true;
  }

  function submit() {
    var s = state.session;
    /* Another booth may have filled the ASLT quota while this panelist was scoring */
    var live = panelSessionById(s.id);
    if (!live || live.status !== 'Ongoing' || panelQuotaFull(live)) {
      ToastService.showError(live && panelQuotaFull(live) ? 'The quota of ' + live.quota + ' panelists for this session is full. Scores were not sent.' : 'This session has ended. Scores were not sent.');
      state.session = null;
      renderHome();
      return;
    }
    panelSubmit({ scheduleId: s.id, trxId: s.trxId, source: s.source, nik: me.panelist.nik, name: me.panelist.name, personSource: me.panelist.source, booth: me.booth, at: panelLocalIso(new Date()), plan: state.plan, answers: state.answers });
    state.session = null;
    var next = pendingSessions();
    pickerCard.classList.add('d-none');
    content.innerHTML =
      '<div class="card custom-card"><div class="card-body text-center py-5">' +
        '<span class="avatar avatar-xl bg-success-transparent rounded-circle mb-3"><i class="ri-checkbox-circle-line fs-24"></i></span>' +
        '<h5 class="fw-semibold mb-1">Thank you, ' + esc(me.panelist.name.split(' ')[0]) + '!</h5>' +
        '<p class="text-muted mb-4">Scores for <span class="font-monospace">' + s.trxId + '</span> (' + s.sesiLabel + ') have been sent to the lab.</p>' +
        (next.length
          ? '<button type="button" class="btn btn-primary btn-wave" id="btnNextSession">Continue to the next session<i class="ri-arrow-right-line ms-1 align-middle"></i></button>'
          : '<p class="fs-13 text-muted mb-0">No other session. Please log out or wait for the next session.</p>') +
      '</div></div>';
    var btn = document.getElementById('btnNextSession');
    if (btn) btn.addEventListener('click', function () { renderHome(); });
  }

  /* Sessions start / end by the schedule clock, and the lab may edit the schedule from another
     tab: refresh while idle */
  window.addEventListener('storage', function () { if (!state.session) renderHome(); });
  setInterval(function () { if (!state.session) renderHome(); }, 60000);

  renderHome();
});
