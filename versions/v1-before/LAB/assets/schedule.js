/* ---------- HOLABSYS Schedule page (FullCalendar), laid out like Google Calendar ----------
   One tab per panel type. Sensory: fixed slots (SENSORY_SLOTS, the rest of the day is greyed),
   one session (date + slot) holds many requests but only one kind, Triangle or Non-Triangle,
   coloured by that kind. ASLT: free time, drag / resize to move; max ASLT_PANEL_QUOTA panelists.

   - Left column: requests waiting for a schedule (Fully Approved). Drag one onto the calendar to
     schedule it, or click it for the full form.
   - Click an empty time: quick-create popover next to the click (request + analis); "Opsi
     lainnya" opens the full modal.
   - Click a session: side panel (offcanvas, no backdrop) with its requests; add / remove requests
     right there. The panel stays open and follows every change.
   - Full modal "Buat / Atur Jadwal": all sessions of one request at once.
   Panelists are never registered here: anyone can score at the booth while a session runs. */
document.addEventListener('DOMContentLoaded', function () {
  var schedules = getSchedules();
  var requests = getSchedulableRequests();
  var activeJenis = 'Sensory';

  var scheduleModalEl = document.getElementById('scheduleModal');
  var scheduleModal = new bootstrap.Modal(scheduleModalEl);
  /* Bootstrap ignores hide() while the modal is still animating open: close it once it is shown */
  var modalOpening = false, closeWhenShown = false;
  scheduleModalEl.addEventListener('show.bs.modal', function () { modalOpening = true; });
  scheduleModalEl.addEventListener('shown.bs.modal', function () {
    modalOpening = false;
    if (closeWhenShown) { closeWhenShown = false; scheduleModal.hide(); }
  });
  function closeScheduleModal() { if (modalOpening) closeWhenShown = true; else scheduleModal.hide(); }
  var panelEl = document.getElementById('detailPanel');
  var panel = new bootstrap.Offcanvas(panelEl);
  var panelState = null; // { type: 'slot', start } | { type: 'aslt', id }

  var sessionHead = document.getElementById('sessionHead');
  var sessionBody = document.getElementById('sessionBody');
  var $request = $('#schRequest');
  var editingRequestId = null; // set when the modal edits an existing request's sessions

  var TAB_HINT = {
    Sensory: '<i class="ri-time-line fs-15"></i><span>Fixed session times: <b>' + [1, 2, 3].map(sensorySlotLabel).join('</b> · <b>') +
      '</b>. A session can hold several requests, but only one kind: Triangle or Non-Triangle.</span>',
    ASLT: '<i class="ri-drag-move-2-line fs-15"></i><span>Free times: click an empty slot to create, drag a session to move it or change its duration. ' +
      'Max. <b>' + ASLT_PANEL_QUOTA + ' panelists</b> per session.</span>'
  };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function toLocalIso(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function addHours(iso, h) { var d = new Date(iso); d.setHours(d.getHours() + h); return toLocalIso(d); }
  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtTime(iso) { return iso.slice(11, 16); }
  function whenLine(start, end) {
    return new Date(start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
      ' · ' + fmtTime(start) + ' – ' + fmtTime(end);
  }
  function findRequest(id) {
    for (var i = 0; i < requests.length; i++) if (requests[i].id === id) return requests[i];
    return null;
  }
  function sessionsOf(requestId) {
    return schedules.filter(function (s) { return s.requestId === requestId; })
      .sort(function (a, b) { return a.start < b.start ? -1 : 1; });
  }
  /* Sensory: the slot ("Sesi 1"); ASLT: order within the request */
  function sessionLabel(s) {
    return s.jenis === 'Sensory' ? 'Session ' + s.slot : 'Session ' + (sessionsOf(s.requestId).indexOf(s) + 1);
  }
  function findSchedule(id) {
    for (var i = 0; i < schedules.length; i++) if (schedules[i].id === id) return schedules[i];
    return null;
  }
  /* Sensory slot of a time, or null outside the slots */
  function slotAt(hhmm) {
    var found = null;
    Object.keys(SENSORY_SLOTS).forEach(function (k) {
      if (hhmm >= SENSORY_SLOTS[k].start && hhmm < SENSORY_SLOTS[k].end) found = Number(k);
    });
    return found;
  }
  function slotStartOf(date, slot) { return date + 'T' + SENSORY_SLOTS[slot].start; }
  function slotItems(start) { return schedules.filter(function (s) { return s.jenis === 'Sensory' && s.start === start; }); }
  /* A request of the other kind already in that Sensory session, or null */
  function slotClash(start, requestId) {
    var kind = sensorySessionKind(requestId);
    return slotItems(start).filter(function (s) { return s.requestId !== requestId && sensorySessionKind(s.requestId) !== kind; })[0] || null;
  }
  function clashMessage(start, slot, other, requestId) {
    return sensorySlotLabel(slot) + ', ' + fmtDate(start) + ' already holds a ' + sensorySessionKind(other.requestId) + ' request' +
      ' (' + other.requestId + '). A session can only be Triangle or Non-Triangle; choose another session for ' + requestId +
      ' (' + sensorySessionKind(requestId) + ').';
  }
  function colorOf(s) {
    return s.jenis === 'Sensory' ? SENSORY_KIND_COLOR[sensorySessionKind(s.requestId)] : SCHEDULE_JENIS[s.jenis].color;
  }
  function sampleCount(req) {
    if (req.jenis !== 'Sensory') return '';
    var r = getSensoryRequestById(req.id);
    var n = r && Array.isArray(r.jenisSampel) ? r.jenisSampel.length : 0;
    return n ? n + ' samples' : '';
  }
  function analisOptionsHtml(selected) {
    return '<option value="">-</option>' + MASTER_ANALIS.map(function (a) {
      return '<option value="' + esc(a) + '"' + (a === selected ? ' selected' : '') + '>' + esc(a) + '</option>';
    }).join('');
  }

  /* Save + refresh everything that shows the schedule: counts, calendar, waiting list, open panel */
  function refreshAll() {
    saveSchedules(schedules);
    requests = getSchedulableRequests();
    Object.keys(SCHEDULE_JENIS).forEach(function (j) {
      var el = document.getElementById('count' + j);
      if (el) el.textContent = schedules.filter(function (s) { return s.jenis === j; }).length;
    });
    calendar.refetchEvents();
    renderWaiting();
    renderPanel();
  }

  /* Add one session of a request; the request becomes Confirmed (Waiting for Schedule → Berjalan) */
  function addSession(requestId, jenis, fields) {
    var rec = Object.assign({ id: nextScheduleId(schedules), requestId: requestId, jenis: jenis, analis: '', catatan: '' }, fields);
    schedules.push(rec);
    markPanelRequestScheduled(jenis, requestId);
    refreshAll();
    return rec;
  }
  /* Remove one session; a request left without sessions waits for a schedule again */
  function removeSession(id) {
    var s = findSchedule(id);
    schedules = schedules.filter(function (x) { return x.id !== id; });
    if (!sessionsOf(s.requestId).length) markPanelRequestUnscheduled(s.jenis, s.requestId);
    refreshAll();
    return s;
  }

  /* ---------- tabs ---------- */
  var tabsNav = document.getElementById('scheduleTabs');
  function applyTab() {
    tabsNav.querySelectorAll('.nav-link').forEach(function (t) { t.classList.toggle('active', t.dataset.jenis === activeJenis); });
    document.getElementById('scheduleTabHint').innerHTML = TAB_HINT[activeJenis];
    var dot = function (color, text) {
      return '<div class="d-flex align-items-center gap-2"><span class="rounded-1 bg-' + color + '" style="width:12px;height:12px"></span>' + text + '</div>';
    };
    document.getElementById('legend').innerHTML = activeJenis === 'Sensory'
      ? dot(SENSORY_KIND_COLOR.Triangle, 'Triangle session') + dot(SENSORY_KIND_COLOR['Non-Triangle'], 'Non-Triangle session (rating, ranking, QM)') +
        '<div class="text-muted">Hours outside Session 1–3 are grey</div>'
      : dot(SCHEDULE_JENIS.ASLT.color, 'ASLT organoleptic session');
    // Sensory times are fixed: no drag / resize, slots highlighted. ASLT can be moved freely.
    calendar.setOption('editable', activeJenis === 'ASLT');
    calendar.setOption('businessHours', activeJenis === 'Sensory'
      ? Object.keys(SENSORY_SLOTS).map(function (k) { return { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startTime: SENSORY_SLOTS[k].start, endTime: SENSORY_SLOTS[k].end }; })
      : false);
    closeQuick();
    panel.hide();
    calendar.refetchEvents();
    renderWaiting();
  }
  tabsNav.addEventListener('click', function (e) {
    var tab = e.target.closest('.nav-link');
    if (!tab) return;
    e.preventDefault();
    activeJenis = tab.dataset.jenis;
    applyTab();
  });

  /* ---------- left column: requests waiting for a schedule (drag onto the calendar) ---------- */
  var waitingList = document.getElementById('waitingList');
  function renderWaiting() {
    var waiting = requests.filter(function (r) { return r.jenis === activeJenis && r.waiting; });
    document.getElementById('waitingCount').textContent = waiting.length;
    document.getElementById('waitingHint').textContent = waiting.length
      ? 'Drag onto the calendar to schedule, or click for full settings.'
      : '';
    waitingList.innerHTML = waiting.map(function (r) {
      var kind = r.jenis === 'Sensory' ? sensorySessionKind(r.id) : '';
      var color = r.jenis === 'Sensory' ? SENSORY_KIND_COLOR[kind] : SCHEDULE_JENIS.ASLT.color;
      var meta = [kind, sampleCount(r)].filter(Boolean).join(' · ');
      return '<div class="sch-waiting border rounded-1 p-2 d-flex align-items-start gap-2 bg-' + color + '-transparent" role="button" tabindex="0" ' +
          'data-request="' + esc(r.id) + '" title="Drag onto the calendar, or click to manage the schedule">' +
        '<i class="ri-draggable text-muted mt-1"></i>' +
        '<div class="flex-fill">' +
          '<div class="font-monospace fw-semibold fs-12">' + esc(r.id) + '</div>' +
          '<div class="fs-12">' + esc(r.sampel) + '</div>' +
          (meta ? '<div class="fs-11 text-muted">' + esc(meta) + '</div>' : '') +
        '</div></div>';
    }).join('') || '<div class="text-muted fs-12 border rounded-1 p-3 text-center"><i class="ri-checkbox-circle-line text-success me-1"></i>All requests are scheduled.</div>';
  }
  new FullCalendar.Draggable(waitingList, {
    itemSelector: '.sch-waiting',
    eventData: function (el) { return { title: el.dataset.request, duration: '02:00', create: false }; }
  });
  waitingList.addEventListener('click', function (e) {
    var item = e.target.closest('.sch-waiting');
    if (item) openModalFor(item.dataset.request);
  });
  waitingList.addEventListener('keydown', function (e) {
    var item = e.target.closest('.sch-waiting');
    if (item && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openModalFor(item.dataset.request); }
  });

  /* Dropped from the waiting list */
  function dropRequest(requestId, date, allDay) {
    var req = findRequest(requestId);
    if (!req) return;
    var iso = toLocalIso(date);
    if (req.jenis === 'Sensory') {
      var slot = allDay ? null : slotAt(iso.slice(11, 16));
      if (!slot) { ToastService.showWarning('Drop ' + requestId + ' inside session hours (Session 1–3), in Week or Day view.'); return; }
      var start = slotStartOf(iso.slice(0, 10), slot);
      var other = slotClash(start, requestId);
      if (other) { ToastService.showWarning(clashMessage(start, slot, other, requestId)); return; }
      var existing = slotItems(start)[0];
      addSession(requestId, 'Sensory', { slot: slot, start: start, end: iso.slice(0, 10) + 'T' + SENSORY_SLOTS[slot].end, analis: existing ? existing.analis : '' });
      ToastService.showSuccess(requestId + ' scheduled in ' + sensorySlotLabel(slot) + ', ' + fmtDate(start) + '.');
      openPanel({ type: 'slot', start: start });
    } else {
      var aStart = allDay ? iso.slice(0, 10) + 'T09:00' : iso;
      var rec = addSession(requestId, 'ASLT', { start: aStart, end: addHours(aStart, 2) });
      ToastService.showSuccess(requestId + ' scheduled ' + fmtDate(aStart) + ' ' + fmtTime(aStart) + '–' + fmtTime(rec.end) + '.');
      openPanel({ type: 'aslt', id: rec.id });
    }
  }

  /* ---------- calendar ---------- */
  var calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    locale: 'en-gb',
    initialView: 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
    buttonText: { today: 'Today', month: 'Month', week: 'Week', day: 'Day', list: 'List' },
    navLinks: true,
    dayMaxEvents: 3,
    nowIndicator: true,
    slotMinTime: '07:00:00',
    slotMaxTime: '18:00:00',
    slotDuration: '00:30:00',
    slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
    allDaySlot: false,
    expandRows: true, // hour slots stretch to the full calendar height in week/day view
    editable: false,
    selectable: true,
    selectMirror: true,
    droppable: true,
    /* Month cells open the day view; Sensory selections must fall inside one slot */
    selectAllow: function (info) {
      if (calendar.view.type === 'dayGridMonth') return false;
      if (activeJenis !== 'Sensory') return true;
      var s = slotAt(toLocalIso(info.start).slice(11, 16));
      var last = new Date(info.end.getTime() - 60000);
      return !!s && s === slotAt(toLocalIso(last).slice(11, 16));
    },
    events: function (info, success) {
      var styleFor = function (color) { return { classNames: ['bg-' + color + '-transparent'], borderColor: 'rgb(var(--' + color + '-rgb))' }; };
      if (activeJenis === 'Sensory') {
        /* Sensory: one box per session (date + slot), however many requests it holds */
        var groups = {};
        schedules.filter(function (s) { return s.jenis === 'Sensory'; }).forEach(function (s) {
          (groups[s.start] = groups[s.start] || []).push(s);
        });
        success(Object.keys(groups).map(function (start) {
          var g = groups[start];
          return Object.assign({
            id: 'slot|' + start,
            title: 'Session ' + g[0].slot + ' · ' + sensorySessionKind(g[0].requestId) + ' · ' + g.length + ' request(s)',
            start: start,
            end: g[0].end
          }, styleFor(colorOf(g[0])));
        }));
        return;
      }
      success(schedules.filter(function (s) { return s.jenis === activeJenis; }).map(function (s) {
        return Object.assign({ id: s.id, title: s.requestId + ' · ' + sessionLabel(s), start: s.start, end: s.end }, styleFor(colorOf(s)));
      }));
    },
    dateClick: function (info) {
      if (info.view.type === 'dayGridMonth') calendar.changeView('timeGridDay', info.date);
    },
    select: function (info) {
      var start = toLocalIso(info.start);
      openQuick(activeJenis === 'Sensory'
        ? { date: start.slice(0, 10), slot: slotAt(start.slice(11, 16)) }
        : { start: start, end: toLocalIso(info.end) }, info.jsEvent);
      calendar.unselect();
    },
    eventClick: function (info) {
      info.jsEvent.preventDefault();
      closeQuick();
      if (info.event.id.indexOf('slot|') === 0) openPanel({ type: 'slot', start: info.event.id.slice(5) });
      else openPanel({ type: 'aslt', id: info.event.id });
    },
    drop: function (info) { dropRequest(info.draggedEl.dataset.request, info.date, info.allDay); },
    eventDrop: moveEvent,
    eventResize: moveEvent
  });
  calendar.render();
  /* FullCalendar only re-measures on window resize; the column next to it changes its width too */
  if (window.ResizeObserver) new ResizeObserver(function () { calendar.updateSize(); }).observe(document.getElementById('calendar'));

  function moveEvent(info) {
    var s = findSchedule(info.event.id);
    if (!s || s.jenis !== 'ASLT') { info.revert(); return; }
    s.start = toLocalIso(info.event.start);
    s.end = toLocalIso(info.event.end || info.event.start);
    refreshAll();
    ToastService.showSuccess(s.requestId + ' moved to ' + fmtDate(s.start) + ' ' + fmtTime(s.start) + '–' + fmtTime(s.end));
  }

  /* ---------- quick create (popover next to the clicked empty time) ---------- */
  var quickEl = document.getElementById('quickCreate');
  var quickRequest = document.getElementById('quickRequest');
  var quickAnalis = document.getElementById('quickAnalis');
  var quickTarget = null; // { date, slot } (Sensory) | { start, end } (ASLT)

  function quickStart(t) { return activeJenis === 'Sensory' ? slotStartOf(t.date, t.slot) : t.start; }
  function quickEnd(t) { return activeJenis === 'Sensory' ? t.date + 'T' + SENSORY_SLOTS[t.slot].end : t.end; }

  /* Request options for a time (label = the request number only): Sensory leaves out requests
     already in the session and, once the session has a kind, requests of the other kind;
     waiting requests first */
  function requestOptionsFor(target, selected) {
    var start = target ? quickStart(target) : null;
    var inSlot = activeJenis === 'Sensory' && start ? slotItems(start) : [];
    var slotKind = inSlot.length ? sensorySessionKind(inSlot[0].requestId) : null;
    var list = requests.filter(function (r) {
      return r.jenis === activeJenis && !inSlot.some(function (s) { return s.requestId === r.id; }) &&
        !(slotKind && sensorySessionKind(r.id) !== slotKind);
    }).sort(function (a, b) { return (b.waiting ? 1 : 0) - (a.waiting ? 1 : 0); });
    return '<option value="">-- Select request --</option>' + list.map(function (r) {
      return '<option value="' + esc(r.id) + '"' + (r.id === selected ? ' selected' : '') + '>' + esc(r.id) + '</option>';
    }).join('');
  }

  function openQuick(target, jsEvent) {
    if (activeJenis === 'Sensory' && !target.slot) return;
    quickTarget = target;
    var start = quickStart(target), end = quickEnd(target);
    var inSlot = activeJenis === 'Sensory' ? slotItems(start) : [];
    document.getElementById('quickTitle').textContent = activeJenis === 'Sensory'
      ? sensorySlotLabel(target.slot) + (inSlot.length ? ' · ' + sensorySessionKind(inSlot[0].requestId) : '')
      : 'New ASLT session';
    document.getElementById('quickWhen').textContent = whenLine(start, end) + (inSlot.length ? ' · already ' + inSlot.length + ' request(s)' : '');
    quickRequest.innerHTML = requestOptionsFor(target);
    quickAnalis.innerHTML = analisOptionsHtml(inSlot.length ? inSlot[0].analis : '');

    quickEl.classList.remove('d-none');
    var w = quickEl.offsetWidth, h = quickEl.offsetHeight;
    var x = jsEvent ? jsEvent.clientX + 12 : (window.innerWidth - w) / 2;
    var y = jsEvent ? jsEvent.clientY - 20 : (window.innerHeight - h) / 2;
    quickEl.style.left = Math.max(16, Math.min(x, window.innerWidth - w - 16)) + 'px';
    quickEl.style.top = Math.max(16, Math.min(y, window.innerHeight - h - 16)) + 'px';
    setTimeout(function () { if ($(quickRequest).data('select2')) $(quickRequest).select2('open'); });
  }
  function closeQuick() {
    if (quickEl.classList.contains('d-none')) return;
    if ($(quickRequest).data('select2')) $(quickRequest).select2('close');
    quickEl.classList.add('d-none');
    quickTarget = null;
  }
  document.getElementById('quickClose').addEventListener('click', closeQuick);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeQuick(); });
  document.addEventListener('mousedown', function (e) {
    if (quickEl.classList.contains('d-none')) return;
    if (quickEl.contains(e.target) || e.target.closest('.select2-container')) return;
    closeQuick();
  });

  document.getElementById('quickSave').addEventListener('click', function () {
    var requestId = quickRequest.value;
    if (!requestId) { ToastService.showWarning('A request must be selected.'); return; }
    var t = quickTarget, start = quickStart(t), end = quickEnd(t);
    if (activeJenis === 'Sensory') {
      var other = slotClash(start, requestId);
      if (other) { ToastService.showWarning(clashMessage(start, t.slot, other, requestId)); return; }
      addSession(requestId, 'Sensory', { slot: t.slot, start: start, end: end, analis: quickAnalis.value });
      ToastService.showSuccess(requestId + ' scheduled in ' + sensorySlotLabel(t.slot) + ', ' + fmtDate(start) + '.');
    } else {
      addSession(requestId, 'ASLT', { start: start, end: end, analis: quickAnalis.value });
      ToastService.showSuccess(requestId + ' scheduled ' + fmtDate(start) + ' ' + fmtTime(start) + '–' + fmtTime(end) + '.');
    }
    closeQuick();
  });

  document.getElementById('quickMore').addEventListener('click', function () {
    var t = quickTarget, requestId = quickRequest.value;
    closeQuick();
    var slot = activeJenis === 'Sensory' ? { date: t.date, slot: t.slot } : { start: t.start, end: t.end };
    if (requestId && sessionsOf(requestId).length) openModal(requestId, slot);
    else { openModal(null, slot); if (requestId) $request.val(requestId).trigger('change'); }
  });

  /* ---------- side panel (offcanvas): one Sensory session or one ASLT session ---------- */
  var panelBody = document.getElementById('panelBody');
  function iconRow(icon, html) {
    return '<div class="d-flex align-items-start gap-3 mb-3"><i class="' + icon + ' fs-16 text-muted lh-1 mt-1" style="width: 18px"></i>' +
      '<div class="flex-fill fs-13">' + html + '</div></div>';
  }
  function setPanelHead(color, title, sub) {
    document.getElementById('panelColor').className = 'rounded-1 flex-shrink-0 mt-1 bg-' + color;
    document.getElementById('panelTitle').textContent = title;
    document.getElementById('panelSub').textContent = sub;
  }
  function openPanel(state) {
    panelState = state;
    renderPanel();
    if (panelState) panel.show();
  }
  panelEl.addEventListener('hidden.bs.offcanvas', function () { panelState = null; });

  function renderPanel() {
    if (!panelState) return;
    if (panelState.type === 'slot') renderSlotPanel(panelState.start);
    else renderAsltPanel(panelState.id);
  }

  /* Rencana penyajian for the lab (uji buta): which panelist gets which serving order, and for a
     triangle what goes in each coded cup. The booth applies the same plan by the order panelists
     start (panelServingPlan); the pattern repeats every 6 (triangle) / Williams rows. */
  function planHtml(rec, triangle) {
    var codes = panelRequestCodes(rec);
    if (!codes.length) return '<div class="fs-11 text-muted mt-2">Blind codes are generated at the last approval.</div>';
    var jenis = Array.isArray(rec.jenisSampel) ? rec.jenisSampel : [];
    var rows = panelPlanTable(codes, triangle, 18);
    var who = function (r) { return r.panelists.join(', ') + (r.panelists.length ? ', …' : ''); };
    var table = triangle
      ? '<div class="fs-12 mb-1">Sample <b>A</b> = ' + esc(jenis[0] || '-') + ' · Sample <b>B</b> = ' + esc(jenis[1] || '-') + '</div>' +
        '<table class="table table-sm table-bordered mb-0 fs-12"><thead><tr><th>Panelist #</th>' +
          codes.slice(0, 3).map(function (c, i) { return '<th class="text-center">Cup ' + (i + 1) + '<div class="font-monospace">' + esc(c) + '</div></th>'; }).join('') +
        '</tr></thead><tbody>' + rows.map(function (r) {
          return '<tr><td>' + who(r) + '</td>' + r.plan.cups.map(function (cup) {
            return '<td class="text-center' + (cup.code === r.plan.oddCode ? ' fw-bold text-danger' : '') + '">' + cup.sample + '</td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>' +
        '<div class="fs-11 text-muted mt-1">Red = the odd cup. The pattern repeats every 6 panelists.</div>'
      : '<table class="table table-sm table-bordered mb-0 fs-12"><thead><tr><th>Panelist #</th><th>Serving order</th></tr></thead><tbody>' +
          rows.map(function (r) { return '<tr><td>' + who(r) + '</td><td class="font-monospace">' + r.plan.order.join(' → ') + '</td></tr>'; }).join('') +
        '</tbody></table>' +
        '<div class="fs-11 text-muted mt-1">Williams design: every sample appears in every position equally often. Panelist order = the order they start scoring at the booth.</div>';
    return '<details class="mt-2"><summary class="fs-12 text-primary fw-medium">Serving plan</summary><div class="mt-2">' + table + '</div></details>';
  }

  /* Inline confirmation inside a row instead of another modal */
  function confirmHtml(text, action, id) {
    return '<div class="d-flex align-items-center justify-content-between gap-2 bg-danger-transparent rounded-1 px-2 py-1 mt-2" data-confirm>' +
      '<span class="fs-12">' + text + '</span><span class="d-flex gap-1 flex-shrink-0">' +
        '<button type="button" class="btn btn-sm btn-light" data-cancel>Cancel</button>' +
        '<button type="button" class="btn btn-sm btn-danger" data-' + action + '="' + esc(id) + '">Ya</button>' +
      '</span></div>';
  }

  function renderSlotPanel(start) {
    var items = slotItems(start);
    if (!items.length) { panelState = null; panel.hide(); return; }
    var slot = items[0].slot, kind = sensorySessionKind(items[0].requestId);
    setPanelHead(SENSORY_KIND_COLOR[kind], sensorySlotLabel(slot) + ' · ' + kind, whenLine(start, items[0].end) + ' · ' + items.length + ' request(s)');
    var analis = items.map(function (x) { return x.analis; }).filter(function (a, i, arr) { return a && arr.indexOf(a) === i; }).join(', ');

    var cards = items.map(function (s) {
      var rec = getSensoryRequestById(s.requestId) || {};
      var samples = sensoryIsTriangle(rec) ? [] : sensorySampleRows(rec);
      return '<div class="border rounded-1 p-2 mb-2" data-item="' + esc(s.id) + '">' +
        '<div class="d-flex align-items-start justify-content-between gap-2">' +
          '<div>' +
            '<a href="sensoryForm.html?docId=' + encodeURIComponent(s.requestId) + '" class="font-monospace fw-semibold text-primary fs-13">' + esc(s.requestId) + '</a>' +
            '<div class="fs-13">' + esc(rec.sampel || '-') + '</div>' +
            '<div class="fs-11 text-muted">Batch ' + esc(rec.batch || '-') + (s.catatan ? ' · ' + esc(s.catatan) : '') + '</div>' +
          '</div>' +
          '<div class="d-flex gap-1 flex-shrink-0">' +
            '<button type="button" class="btn btn-icon btn-sm btn-primary-light btn-wave" data-edit-request="' + esc(s.requestId) + '" title="Manage all sessions of this request"><i class="ri-calendar-event-line"></i></button>' +
            '<button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" data-ask-remove="' + esc(s.id) + '" title="Remove from session"><i class="ri-delete-bin-line"></i></button>' +
          '</div>' +
        '</div>' +
        (samples.length ? '<table class="table table-sm table-bordered mb-0 mt-2 fs-12"><thead><tr><th style="width: 30%">Code</th><th>Sample Type</th></tr></thead><tbody>' +
          samples.map(function (m) { return '<tr><td class="font-monospace fw-semibold">' + esc(m.kode) + '</td><td>' + esc(m.jenis) + '</td></tr>'; }).join('') +
          '</tbody></table>' : '') +
        planHtml(rec, sensoryIsTriangle(rec)) +
        '</div>';
    }).join('');

    var addOptions = requestOptionsFor({ date: start.slice(0, 10), slot: slot });
    var canAdd = /<option value="[^"]+"/.test(addOptions);

    panelBody.innerHTML =
      iconRow('ri-time-line', esc(whenLine(start, items[0].end)) + '<div class="fs-12 text-muted">Sensory session times are fixed</div>') +
      iconRow('ri-group-line', 'Open to any panelist<div class="fs-12 text-muted">No registration, log in at the booth while the session runs</div>') +
      iconRow('ri-user-line', 'Analyst: ' + esc(analis || '-')) +
      '<div class="fw-semibold mb-2">Requests in this session</div>' + cards +
      '<div class="border-top pt-3 mt-3">' +
        '<label class="form-label fw-semibold" for="panelAddRequest">Add a request to this session</label>' +
        (canAdd
          ? '<div class="d-flex gap-2"><div class="flex-fill"><select class="form-select" id="panelAddRequest">' + addOptions + '</select></div>' +
            '<button type="button" class="btn btn-primary btn-sm btn-wave flex-shrink-0" id="btnPanelAdd"><i class="ri-add-line me-1"></i>Add</button></div>' +
            '<div class="form-text">Only ' + kind + ' requests can join this session.</div>'
          : '<div class="text-muted fs-12">No other ' + kind + ' requests can be added.</div>') +
      '</div>';
  }

  function renderAsltPanel(id) {
    var s = findSchedule(id);
    if (!s) { panelState = null; panel.hide(); return; }
    var req = findRequest(s.requestId);
    var meta = SCHEDULE_JENIS[s.jenis];
    setPanelHead(meta.color, s.requestId + ' · ' + sessionLabel(s), whenLine(s.start, s.end));
    var list = sessionsOf(s.requestId).map(function (x) {
      var cur = x.id === s.id;
      return '<li><a href="#!" class="d-flex align-items-center justify-content-between rounded-1 px-3 py-2 mb-1 text-reset' + (cur ? ' bg-primary-transparent' : ' bg-light') + '" data-open-session="' + esc(x.id) + '">' +
        '<span class="fw-medium">' + sessionLabel(x) + '</span>' +
        '<span class="text-muted fs-12">' + fmtDate(x.start) + ' · ' + fmtTime(x.start) + '–' + fmtTime(x.end) + '</span></a></li>';
    }).join('');
    panelBody.innerHTML =
      iconRow('ri-flask-line', esc(req ? req.sampel : '-') +
        '<div class="mt-1"><a href="' + meta.form + '?docId=' + encodeURIComponent(s.requestId) + '" class="fs-12 text-primary"><i class="ri-external-link-line me-1"></i>Open request ' + esc(s.requestId) + '</a></div>') +
      iconRow('ri-time-line', esc(whenLine(s.start, s.end)) + '<div class="fs-12 text-muted">Drag on the calendar to move it or change its duration</div>') +
      iconRow('ri-group-line', 'Max. ' + ASLT_PANEL_QUOTA + ' panelists per session<div class="fs-12 text-muted">No registration, anyone can score at the booth while the session runs</div>') +
      iconRow('ri-user-line', 'Analyst: ' + esc(s.analis || '-')) +
      iconRow('ri-file-text-line', esc(s.catatan || 'No notes')) +
      iconRow('ri-cup-line', 'Organoleptic blind codes' + planHtml(getAsltRequestById(s.requestId) || {}, false)) +
      '<div class="fw-semibold mb-2">All sessions of this request</div>' +
      '<ul class="list-unstyled mb-3">' + list + '</ul>' +
      '<div class="d-flex gap-2" data-item="' + esc(s.id) + '">' +
        '<button type="button" class="btn btn-primary btn-sm btn-wave" data-edit-request="' + esc(s.requestId) + '"><i class="ri-calendar-event-line me-1"></i>Manage Schedule</button>' +
        '<button type="button" class="btn btn-danger-light btn-sm btn-wave" data-ask-remove="' + esc(s.id) + '"><i class="ri-delete-bin-line me-1"></i>Delete session</button>' +
      '</div>';
  }

  panelBody.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-edit-request]'))) { openModalFor(t.getAttribute('data-edit-request')); return; }
    if ((t = e.target.closest('[data-open-session]'))) { e.preventDefault(); openPanel({ type: 'aslt', id: t.getAttribute('data-open-session') }); return; }
    if ((t = e.target.closest('[data-ask-remove]'))) {
      var item = t.closest('[data-item]');
      if (item.querySelector('[data-confirm]')) return;
      var s = findSchedule(t.getAttribute('data-ask-remove'));
      item.insertAdjacentHTML('beforeend', confirmHtml(s.jenis === 'Sensory'
        ? 'Remove ' + esc(s.requestId) + ' from this session?'
        : 'Delete ' + sessionLabel(s) + ' ' + esc(s.requestId) + '?', 'remove', s.id));
      return;
    }
    if ((t = e.target.closest('[data-cancel]'))) { t.closest('[data-confirm]').remove(); return; }
    if ((t = e.target.closest('[data-remove]'))) {
      var removed = removeSession(t.getAttribute('data-remove'));
      ToastService.showSuccess(removed.jenis === 'Sensory'
        ? removed.requestId + ' removed from ' + sensorySlotLabel(removed.slot) + '.'
        : sessionLabel(removed) + ' ' + removed.requestId + ' deleted.');
      return;
    }
    if (e.target.closest('#btnPanelAdd')) {
      var requestId = document.getElementById('panelAddRequest').value;
      if (!requestId) { ToastService.showWarning('Select the request to add.'); return; }
      var start = panelState.start, first = slotItems(start)[0];
      var other = slotClash(start, requestId);
      if (other) { ToastService.showWarning(clashMessage(start, first.slot, other, requestId)); return; }
      addSession(requestId, 'Sensory', { slot: first.slot, start: start, end: first.end, analis: first.analis || '' });
      ToastService.showSuccess(requestId + ' added to ' + sensorySlotLabel(first.slot) + '.');
    }
  });

  /* ---------- full modal: every session of one request ---------- */
  var slotOptions = Object.keys(SENSORY_SLOTS).map(function (k) {
    return '<option value="' + k + '">' + sensorySlotLabel(k) + '</option>';
  }).join('');

  function modalJenis() {
    var req = findRequest(editingRequestId || $request.val());
    return req ? req.jenis : activeJenis;
  }

  function fillRequestOptions(slot) {
    var target = slot && slot.date && slot.slot ? slot : null;
    $request.html(requestOptionsFor(activeJenis === 'Sensory' ? target : null).replace('<option value="">-- Select request --</option>', '<option></option>'));
  }
  $request.select2({ width: '100%', placeholder: 'Select request', allowClear: true, dropdownParent: $('#scheduleModal') });

  function renderHead() {
    var sensory = modalJenis() === 'Sensory';
    var reqId = editingRequestId || $request.val();
    sessionHead.innerHTML = '<tr><th style="width: 1%">No</th><th>Date <span class="text-danger">*</span></th>' +
      (sensory ? '<th>Session <span class="text-danger">*</span></th>'
        : '<th>Start Time <span class="text-danger">*</span></th><th>End Time <span class="text-danger">*</span></th>') +
      '<th>Analyst</th><th>Notes</th><th style="width: 1%"></th></tr>';
    document.getElementById('schSessionHint').textContent = sensory
      ? 'Select date and session; the times follow the session. A request can have several sessions.' +
        (reqId ? ' This request is ' + sensorySessionKind(reqId) + ': it can only join an empty session or one holding ' + sensorySessionKind(reqId) + '.' : '')
      : 'Free times. A request can have several sessions; max. ' + ASLT_PANEL_QUOTA + ' panelists per session.';
  }

  function addSessionRow(s) {
    s = s || {};
    var sensory = modalJenis() === 'Sensory';
    var tr = document.createElement('tr');
    tr.className = 'session-row';
    tr.dataset.id = s.id || '';
    var date = s.date || (s.start ? s.start.slice(0, 10) : '');
    tr.innerHTML =
      '<td class="fw-medium sesi-no"></td>' +
      '<td><input type="date" class="form-control form-control-sm" data-f="date" value="' + date + '" /></td>' +
      (sensory
        ? '<td style="min-width: 200px"><select class="form-select form-select-sm" data-f="slot">' + slotOptions + '</select></td>'
        : '<td><input type="time" class="form-control form-control-sm" data-f="startTime" value="' + (s.start ? fmtTime(s.start) : '') + '" /></td>' +
          '<td><input type="time" class="form-control form-control-sm" data-f="endTime" value="' + (s.end ? fmtTime(s.end) : '') + '" />' +
          '<div class="invalid-feedback">End time must be after start time.</div></td>') +
      '<td style="min-width: 160px"><select class="form-select form-select-sm" data-f="analis">' + analisOptionsHtml(s.analis || '') + '</select></td>' +
      '<td><input type="text" class="form-control form-control-sm" data-f="catatan" value="' + esc(s.catatan || '') + '" /></td>' +
      '<td><button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" data-remove-row title="Delete session"><i class="ri-delete-bin-line"></i></button></td>';
    if (sensory) tr.querySelector('[data-f="slot"]').value = String(s.slot || 1);
    sessionBody.appendChild(tr);
    renumberRows();
  }

  function renumberRows() {
    var rows = sessionBody.querySelectorAll('tr.session-row');
    rows.forEach(function (tr, i) {
      tr.querySelector('.sesi-no').textContent = i + 1;
      tr.querySelector('[data-remove-row]').disabled = rows.length === 1;
    });
  }

  sessionBody.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove-row]');
    if (!btn) return;
    btn.closest('tr').remove();
    renumberRows();
  });

  document.getElementById('btnAddSession').addEventListener('click', function () { addSessionRow(); });

  /* extraSlot: { date, slot } (Sensory) or { start, end } (ASLT) prefilled as a new row */
  function loadRequestRows(requestId, extraSlot) {
    sessionBody.innerHTML = '';
    renderHead();
    var existing = requestId ? sessionsOf(requestId) : [];
    existing.forEach(addSessionRow);
    var already = extraSlot && existing.some(function (s) {
      return extraSlot.slot ? s.start === slotStartOf(extraSlot.date, extraSlot.slot) : s.start === extraSlot.start;
    });
    if (extraSlot && !already) addSessionRow(extraSlot);
    if (!sessionBody.querySelector('tr.session-row')) addSessionRow();
    var req = findRequest(requestId);
    document.getElementById('schSampel').value = req ? req.sampel : '';
  }

  var pendingSlot = null;
  $request.on('change', function () {
    if (editingRequestId) return;
    loadRequestRows($request.val(), pendingSlot);
    document.getElementById('schRequestError').classList.add('d-none');
  });

  /* The theme puts modals (z-index 105) under the offcanvas: step the side panel aside while the
     full modal is open and bring it back, refreshed, when the modal closes */
  var resumePanel = null;
  function openModal(requestId, slot) {
    if (panelState) { resumePanel = panelState; panel.hide(); }
    editingRequestId = requestId;
    pendingSlot = slot;
    if (requestId && findRequest(requestId)) activeJenis = findRequest(requestId).jenis;
    fillRequestOptions(slot);
    document.getElementById('scheduleModalTitle').textContent = (requestId ? 'Manage Schedule ' + requestId : 'Create Schedule') + ' · ' + activeJenis;
    document.getElementById('schRequestError').classList.add('d-none');
    $request.val(requestId).trigger('change.select2');
    $request.prop('disabled', !!requestId);
    loadRequestRows(requestId, slot);
    scheduleModal.show();
  }
  /* Edit the request's sessions, or create them when it has none yet */
  function openModalFor(requestId) {
    if (sessionsOf(requestId).length) { openModal(requestId, null); return; }
    openModal(null, null);
    $request.val(requestId).trigger('change');
  }

  document.getElementById('btnCreateSchedule').addEventListener('click', function () { closeQuick(); openModal(null, null); });

  document.getElementById('btnSaveSchedule').addEventListener('click', function () {
    var requestId = editingRequestId || $request.val();
    var valid = true;
    document.getElementById('schRequestError').classList.toggle('d-none', !!requestId);
    if (!requestId) valid = false;
    var jenis = modalJenis();

    var trs = sessionBody.querySelectorAll('tr.session-row');
    var rows = Array.prototype.map.call(trs, function (tr) {
      var get = function (f) { return tr.querySelector('[data-f="' + f + '"]'); };
      var date = get('date');
      date.classList.toggle('is-invalid', !date.value);
      if (!date.value) valid = false;
      var out = { id: tr.dataset.id, analis: get('analis').value, catatan: get('catatan').value.trim() };
      if (jenis === 'Sensory') {
        var slot = Number(get('slot').value) || 1;
        out.slot = slot;
        out.start = slotStartOf(date.value, slot);
        out.end = date.value + 'T' + SENSORY_SLOTS[slot].end;
      } else {
        var st = get('startTime'), et = get('endTime');
        [st, et].forEach(function (el) { el.classList.toggle('is-invalid', !el.value); });
        var orderOk = !st.value || !et.value || et.value > st.value;
        if (!orderOk) et.classList.add('is-invalid');
        if (!st.value || !et.value || !orderOk) valid = false;
        out.start = date.value + 'T' + st.value;
        out.end = date.value + 'T' + et.value;
      }
      return out;
    });
    if (!valid) {
      ToastService.showWarning(requestId ? 'Date &amp; time of every session are required (end time after start time).' : 'A request must be selected.');
      return;
    }

    /* Sensory: a session (date + slot) holds Triangle or Non-Triangle requests, never both */
    if (jenis === 'Sensory') {
      var clash = null;
      rows.forEach(function (r, i) {
        var other = slotClash(r.start, requestId);
        trs[i].querySelector('[data-f="date"]').classList.toggle('is-invalid', !!other);
        if (other && !clash) clash = { row: r, other: other };
      });
      if (clash) { ToastService.showWarning(clashMessage(clash.row.start, clash.row.slot, clash.other, requestId)); return; }
    }

    var keptIds = rows.map(function (r) { return r.id; }).filter(Boolean);
    // Rows removed in the modal delete their sessions.
    schedules = schedules.filter(function (s) { return s.requestId !== requestId || keptIds.indexOf(s.id) !== -1; });
    rows.forEach(function (r) {
      var rec = r.id ? findSchedule(r.id) : null;
      if (!rec) {
        rec = { id: nextScheduleId(schedules), requestId: requestId, jenis: jenis };
        schedules.push(rec);
      }
      rec.start = r.start;
      rec.end = r.end;
      rec.analis = r.analis;
      rec.catatan = r.catatan;
      if (jenis === 'Sensory') rec.slot = r.slot; else delete rec.slot;
    });
    /* Scheduling a Fully Approved request confirms it (Waiting for Schedule → Confirmed) */
    markPanelRequestScheduled(jenis, requestId);
    closeScheduleModal();
    refreshAll(); // the side panel, if open, follows the change
    ToastService.showSuccess('Schedule of ' + requestId + ' saved (' + rows.length + ' session(s)).');
  });

  /* The modal can switch the tab (editing a request of the other type) */
  scheduleModalEl.addEventListener('hidden.bs.modal', function () {
    var shown = tabsNav.querySelector('.nav-link.active');
    if (shown && shown.dataset.jenis !== activeJenis) { resumePanel = null; applyTab(); }
    if (resumePanel) { var back = resumePanel; resumePanel = null; openPanel(back); }
  });

  /* ---------- mockup test mode (scheduleTestMode, dummy-schedule.js) ---------- */
  var testSwitch = document.getElementById('testModeSwitch');
  function applyTestMode() {
    var on = scheduleTestMode();
    testSwitch.checked = on;
    document.getElementById('testModeBanner').classList.toggle('d-none', !on);
  }
  testSwitch.addEventListener('change', function () {
    setScheduleTestMode(testSwitch.checked);
    applyTestMode();
    if (testSwitch.checked) ToastService.showInfo('Test Mode on: every session is open at the panelist booth.');
    else ToastService.showInfo('Test Mode off: sessions follow their session hours again.');
  });
  window.addEventListener('storage', function (e) { if (e.key === SCHEDULE_TEST_MODE_KEY) applyTestMode(); });
  applyTestMode();

  /* ---------- start ---------- */
  refreshAll();
  applyTab();

  /* schedule.html?jenis=Sensory&request=SN-... (Jadwalkan from a Fully Approved request) */
  var qJenis = /[?&]jenis=(Sensory|ASLT)/.exec(location.search);
  var qRequest = /[?&]request=([^&]+)/.exec(location.search);
  if (qJenis) { activeJenis = qJenis[1]; applyTab(); }
  if (qRequest && findRequest(decodeURIComponent(qRequest[1]))) {
    var qId = decodeURIComponent(qRequest[1]);
    var item = waitingList.querySelector('[data-request="' + qId + '"]');
    if (item) {
      item.classList.add('border-primary');
      item.scrollIntoView({ block: 'nearest' });
      ToastService.showInfo('Drag ' + qId + ' onto the calendar to schedule it, or click for full settings.');
    } else {
      openModalFor(qId);
    }
  }
});
