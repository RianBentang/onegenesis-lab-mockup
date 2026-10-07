/* ---------- HOLABSYS Schedule page (FullCalendar): panel sessions, one tab per panel type ----------
   Sensory: fixed slots (SENSORY_SLOTS), the time cannot be changed or dragged; one slot can hold
   many requests. ASLT: free time, drag / resize to move; max ASLT_PANEL_QUOTA panelists per session.
   Panelists are never registered here: anyone can score at the booth while a session runs. */
document.addEventListener('DOMContentLoaded', function () {
  var schedules = getSchedules();
  var requests = getSchedulableRequests();
  var activeJenis = 'Sensory';

  var scheduleModal = new bootstrap.Modal(document.getElementById('scheduleModal'));
  var deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  var detailOffcanvas = new bootstrap.Offcanvas(document.getElementById('detailOffcanvas'));
  var toast = new bootstrap.Toast(document.getElementById('scheduleToast'), { delay: 2500 });

  var sessionHead = document.getElementById('sessionHead');
  var sessionBody = document.getElementById('sessionBody');
  var $request = $('#schRequest');
  var editingRequestId = null; // set when the modal edits an existing request's sessions
  var detailScheduleId = null;

  var TAB_HINT = {
    Sensory: '<i class="ri-time-line fs-15"></i><span>Jam sesi Sensory tetap: <b>' + [1, 2, 3].map(sensorySlotLabel).join('</b> · <b>') +
      '</b>. Satu sesi bisa berisi beberapa pengajuan. Panelis tidak perlu didaftarkan, siapa saja bisa menilai di booth selama sesi berlangsung.</span>',
    ASLT: '<i class="ri-drag-move-2-line fs-15"></i><span>Jam sesi ASLT bebas: klik / seret jam kosong untuk membuat, seret jadwal untuk memindah atau mengubah durasi. ' +
      'Panelis tidak didaftarkan, tapi <b>maks. ' + ASLT_PANEL_QUOTA + ' panelis</b> yang bisa menilai per sesi.</span>'
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
  function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtTime(iso) { return iso.slice(11, 16); }
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
    return s.jenis === 'Sensory' ? 'Sesi ' + s.slot : 'Sesi ' + (sessionsOf(s.requestId).indexOf(s) + 1);
  }
  function findSchedule(id) {
    for (var i = 0; i < schedules.length; i++) if (schedules[i].id === id) return schedules[i];
    return null;
  }
  /* Slot of a clicked time (Sensory); outside the slots → Sesi 1 */
  function slotAt(hhmm) {
    var found = 1;
    Object.keys(SENSORY_SLOTS).forEach(function (k) {
      if (hhmm >= SENSORY_SLOTS[k].start && hhmm < SENSORY_SLOTS[k].end) found = Number(k);
    });
    return found;
  }
  function showToast(text) {
    document.getElementById('scheduleToastText').textContent = text;
    toast.show();
  }
  function updateCounts() {
    Object.keys(SCHEDULE_JENIS).forEach(function (j) {
      var el = document.getElementById('count' + j);
      if (el) el.textContent = schedules.filter(function (s) { return s.jenis === j; }).length;
    });
  }
  function persist() {
    saveSchedules(schedules);
    updateCounts();
    calendar.refetchEvents();
  }

  /* ---------- tabs ---------- */
  var tabsNav = document.getElementById('scheduleTabs');
  function applyTab() {
    document.getElementById('scheduleTabHint').innerHTML = TAB_HINT[activeJenis];
    // Sensory times are fixed: no drag / resize. ASLT can be moved freely.
    calendar.setOption('editable', activeJenis === 'ASLT');
    calendar.refetchEvents();
  }
  tabsNav.addEventListener('click', function (e) {
    var tab = e.target.closest('.nav-link');
    if (!tab) return;
    e.preventDefault();
    tabsNav.querySelectorAll('.nav-link').forEach(function (t) { t.classList.toggle('active', t === tab); });
    activeJenis = tab.dataset.jenis;
    applyTab();
  });

  /* ---------- calendar ---------- */
  var calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    locale: 'id',
    initialView: 'timeGridWeek',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
    buttonText: { today: 'Hari ini', month: 'Bulan', week: 'Minggu', day: 'Hari', list: 'List' },
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
    slotEventOverlap: false, // requests in the same slot sit side by side instead of stacking
    editable: false,
    selectable: true,
    selectMirror: true,
    // Month cells open the day view instead of creating a schedule.
    selectAllow: function () { return calendar.view.type !== 'dayGridMonth'; },
    events: function (info, success) {
      var color = SCHEDULE_JENIS[activeJenis].color;
      var style = { classNames: ['bg-' + color + '-transparent'], borderColor: 'rgb(var(--' + color + '-rgb))' };
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
            title: 'Sesi ' + g[0].slot + ' · ' + g.length + ' pengajuan',
            start: start,
            end: g[0].end
          }, style);
        }));
        return;
      }
      success(schedules.filter(function (s) { return s.jenis === activeJenis; }).map(function (s) {
        return Object.assign({ id: s.id, title: s.requestId + ' · ' + sessionLabel(s), start: s.start, end: s.end }, style);
      }));
    },
    dateClick: function (info) {
      if (info.view.type === 'dayGridMonth') calendar.changeView('timeGridDay', info.date);
    },
    select: function (info) {
      var start = toLocalIso(info.start);
      openModal(null, activeJenis === 'Sensory'
        ? { date: start.slice(0, 10), slot: slotAt(start.slice(11, 16)) }
        : { start: start, end: toLocalIso(info.end) });
      calendar.unselect();
    },
    eventClick: function (info) {
      info.jsEvent.preventDefault();
      if (info.event.id.indexOf('slot|') === 0) openSlotDetail(info.event.id.slice(5));
      else openDetail(info.event.id);
    },
    eventDrop: moveEvent,
    eventResize: moveEvent
  });
  calendar.render();
  updateCounts();
  applyTab();

  function moveEvent(info) {
    var s = findSchedule(info.event.id);
    if (s.jenis !== 'ASLT') { info.revert(); return; }
    s.start = toLocalIso(info.event.start);
    s.end = toLocalIso(info.event.end || info.event.start);
    persist();
    showToast(s.requestId + ' dipindah ke ' + fmtDate(s.start) + ' ' + fmtTime(s.start) + '–' + fmtTime(s.end));
  }

  /* ---------- detail offcanvas ----------
     ASLT: one schedule record. Sensory: one session (date + slot) with every request in it,
     listed like the old app (Nomor Pengajuan · Kode · Nama Sampel · Jenis Sampel · Kode Batch). */
  var detailEl = document.getElementById('detailOffcanvas');
  var detailSlotStart = null;
  function detailRow(label, value) {
    return '<div class="mb-3"><div class="text-uppercase text-muted fs-10 mb-1">' + label + '</div><div class="fs-13 text-heading">' + value + '</div></div>';
  }
  function setDetailMode(slotMode) {
    detailEl.style.width = slotMode ? '760px' : '390px';
    document.getElementById('btnDetailDelete').classList.toggle('d-none', slotMode);
    document.getElementById('btnDetailEdit').innerHTML = slotMode
      ? '<i class="ri-add-line me-1"></i><span>Tambah Pengajuan ke Sesi Ini</span>'
      : '<i class="ri-edit-line me-1"></i><span>Atur Jadwal</span>';
  }

  function openDetail(id) {
    var s = findSchedule(id);
    if (!s) return;
    detailScheduleId = id;
    detailSlotStart = null;
    setDetailMode(false);
    var req = findRequest(s.requestId);
    var meta = SCHEDULE_JENIS[s.jenis];
    var all = sessionsOf(s.requestId);
    document.getElementById('detailTitle').textContent = 'Detail Jadwal';
    document.getElementById('detailDocNo').textContent = s.requestId;
    var list = all.map(function (x) {
      var cur = x.id === s.id;
      return '<li class="d-flex align-items-center justify-content-between rounded-1 px-2 py-1 mb-1' + (cur ? ' bg-primary-transparent' : ' bg-light') + '">' +
        '<span class="fs-12 fw-medium">' + sessionLabel(x) + '</span>' +
        '<span class="fs-12 text-muted">' + fmtDate(x.start) + ' · ' + fmtTime(x.start) + '–' + fmtTime(x.end) + '</span></li>';
    }).join('');

    document.getElementById('detailBody').innerHTML =
      '<div class="d-flex align-items-center gap-2 mb-3">' +
        '<span class="badge bg-' + meta.color + '-transparent">' + esc(s.jenis) + '</span>' +
        '<span class="fs-13 fw-semibold">' + sessionLabel(s) + ' dari ' + all.length + '</span>' +
      '</div>' +
      detailRow('Sampel', esc(req ? req.sampel : '-')) +
      detailRow('Waktu', fmtDate(s.start) + '<br />' + fmtTime(s.start) + ' – ' + fmtTime(s.end)) +
      detailRow('Panelis', 'Maks. ' + ASLT_PANEL_QUOTA + ' panelis, tanpa pendaftaran') +
      detailRow('Analis', esc(s.analis || '-')) +
      detailRow('Catatan', esc(s.catatan || '-')) +
      '<div class="text-uppercase text-muted fs-10 mb-1">Semua Sesi Pengajuan Ini</div>' +
      '<ul class="list-unstyled mb-3">' + list + '</ul>' +
      '<a href="' + meta.form + '?docId=' + encodeURIComponent(s.requestId) + '" class="text-primary fw-medium fs-12">' +
        '<i class="ri-external-link-line me-1"></i>Buka Pengajuan</a>';
    detailOffcanvas.show();
  }

  function openSlotDetail(start) {
    var items = schedules.filter(function (x) { return x.jenis === 'Sensory' && x.start === start; });
    if (!items.length) { detailOffcanvas.hide(); return; }
    detailSlotStart = start;
    detailScheduleId = null;
    setDetailMode(true);
    var slot = items[0].slot;
    document.getElementById('detailTitle').textContent = sensorySlotLabel(slot);
    document.getElementById('detailDocNo').textContent = fmtDate(start) + ' · ' + items.length + ' pengajuan';

    var rows = [];
    items.forEach(function (s) {
      var rec = getSensoryRequestById(s.requestId) || {};
      var samples = sensorySampleRows(rec);
      if (!samples.length) samples = [{ jenis: '-', kode: '-' }];
      samples.forEach(function (smp, i) {
        rows.push('<tr>' +
          (i === 0 ? '<td rowspan="' + samples.length + '"><a href="sensoryForm.html?docId=' + encodeURIComponent(s.requestId) + '" class="font-monospace fw-medium text-primary">' + esc(s.requestId) + '</a>' +
            (s.catatan ? '<div class="fs-11 text-muted">' + esc(s.catatan) + '</div>' : '') + '</td>' : '') +
          '<td class="font-monospace fw-semibold">' + esc(smp.kode) + '</td>' +
          (i === 0 ? '<td rowspan="' + samples.length + '">' + esc(rec.sampel || '-') + '</td>' : '') +
          '<td>' + esc(smp.jenis) + '</td>' +
          (i === 0 ? '<td rowspan="' + samples.length + '" class="font-monospace fs-12 text-nowrap">' + esc(rec.batch || '-') + '</td>' +
            '<td rowspan="' + samples.length + '" class="text-nowrap">' +
              '<button type="button" class="btn btn-icon btn-sm btn-primary-light btn-wave me-1" data-slot-edit="' + esc(s.requestId) + '" title="Atur jadwal pengajuan"><i class="ri-edit-line"></i></button>' +
              '<button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" data-slot-remove="' + esc(s.id) + '" title="Keluarkan dari sesi"><i class="ri-delete-bin-line"></i></button>' +
            '</td>' : '') +
          '</tr>');
      });
    });

    document.getElementById('detailBody').innerHTML =
      '<div class="d-flex flex-wrap align-items-center gap-2 mb-3">' +
        '<span class="badge bg-success-transparent">Sensory</span>' +
        '<span class="fs-13 fw-semibold">' + fmtDate(start) + ' · ' + fmtTime(start) + '–' + fmtTime(items[0].end) + '</span>' +
        '<span class="badge bg-light text-muted">jam tetap</span>' +
      '</div>' +
      '<p class="fs-12 text-muted mb-3">Panelis terbuka untuk siapa saja, tanpa pendaftaran. Analis: ' +
        esc(items.map(function (x) { return x.analis; }).filter(function (a, i, arr) { return a && arr.indexOf(a) === i; }).join(', ') || '-') + '.</p>' +
      '<div class="table-responsive"><table class="table table-sm table-bordered align-middle mb-0">' +
        '<thead><tr><th>Nomor Pengajuan</th><th>Kode</th><th>Nama Sampel</th><th>Jenis Sampel</th><th>Kode Batch</th><th style="width: 1%"></th></tr></thead>' +
        '<tbody>' + rows.join('') + '</tbody></table></div>';
    detailOffcanvas.show();
  }

  document.getElementById('detailBody').addEventListener('click', function (e) {
    var edit = e.target.closest('[data-slot-edit]');
    if (edit) { detailOffcanvas.hide(); openModal(edit.getAttribute('data-slot-edit'), null); return; }
    var rm = e.target.closest('[data-slot-remove]');
    if (rm) {
      detailScheduleId = rm.getAttribute('data-slot-remove');
      var s = findSchedule(detailScheduleId);
      document.getElementById('deleteText').textContent = 'Keluarkan ' + s.requestId + ' dari ' + sensorySlotLabel(s.slot) + ', ' + fmtDate(s.start) + '?';
      detailOffcanvas.hide();
      deleteModal.show();
    }
  });

  document.getElementById('btnDetailEdit').addEventListener('click', function () {
    detailOffcanvas.hide();
    if (detailSlotStart) {
      var first = schedules.filter(function (x) { return x.start === detailSlotStart; })[0];
      openModal(null, { date: detailSlotStart.slice(0, 10), slot: first ? first.slot : 1 });
      return;
    }
    openModal(findSchedule(detailScheduleId).requestId, null);
  });

  document.getElementById('btnDetailDelete').addEventListener('click', function () {
    var s = findSchedule(detailScheduleId);
    document.getElementById('deleteText').textContent = 'Hapus ' + sessionLabel(s) + ' ' + s.requestId + ' (' + fmtDate(s.start) + ' ' + fmtTime(s.start) + ')?';
    detailOffcanvas.hide();
    deleteModal.show();
  });

  document.getElementById('btnConfirmDelete').addEventListener('click', function () {
    var s = findSchedule(detailScheduleId);
    schedules = schedules.filter(function (x) { return x.id !== detailScheduleId; });
    persist();
    deleteModal.hide();
    showToast(s.jenis === 'Sensory' ? s.requestId + ' dikeluarkan dari ' + sensorySlotLabel(s.slot) : 'Sesi ' + s.requestId + ' dihapus');
    if (detailSlotStart) openSlotDetail(detailSlotStart); // refresh the open session list
  });

  /* ---------- create / edit modal ---------- */
  var analisOptions = ['<option value="">-</option>'].concat(MASTER_ANALIS.map(function (a) {
    return '<option value="' + esc(a) + '">' + esc(a) + '</option>';
  })).join('');
  var slotOptions = Object.keys(SENSORY_SLOTS).map(function (k) {
    return '<option value="' + k + '">' + sensorySlotLabel(k) + '</option>';
  }).join('');

  function modalJenis() {
    var req = findRequest(editingRequestId || $request.val());
    return req ? req.jenis : activeJenis;
  }

  function fillRequestOptions() {
    $request.html('<option></option>' + requests.filter(function (r) { return r.jenis === activeJenis; }).map(function (r) {
      return '<option value="' + esc(r.id) + '">' + esc(r.id) + ' — ' + esc(r.sampel) + (r.waiting ? ' (Waiting for Schedule)' : '') + '</option>';
    }).join(''));
  }
  $request.select2({ width: '100%', placeholder: 'Pilih pengajuan', allowClear: true, dropdownParent: $('#scheduleModal') });

  function renderHead() {
    var sensory = modalJenis() === 'Sensory';
    sessionHead.innerHTML = '<tr><th style="width: 1%">No</th><th>Tanggal <span class="text-danger">*</span></th>' +
      (sensory ? '<th>Sesi <span class="text-danger">*</span></th>'
        : '<th>Jam Mulai <span class="text-danger">*</span></th><th>Jam Selesai <span class="text-danger">*</span></th>') +
      '<th>Analis</th><th>Catatan</th><th style="width: 1%"></th></tr>';
    document.getElementById('schSessionHint').textContent = sensory
      ? 'Pilih tanggal dan sesi; jamnya mengikuti sesi (tidak bisa diubah). Satu pengajuan bisa punya beberapa sesi.'
      : 'Jam bebas. Satu pengajuan bisa punya beberapa sesi; maks. ' + ASLT_PANEL_QUOTA + ' panelis per sesi.';
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
          '<div class="invalid-feedback">Jam selesai harus setelah jam mulai.</div></td>') +
      '<td style="min-width: 160px"><select class="form-select form-select-sm" data-f="analis">' + analisOptions + '</select></td>' +
      '<td><input type="text" class="form-control form-control-sm" data-f="catatan" value="' + esc(s.catatan || '') + '" /></td>' +
      '<td><button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" data-remove title="Hapus sesi"><i class="ri-delete-bin-line"></i></button></td>';
    tr.querySelector('[data-f="analis"]').value = s.analis || '';
    if (sensory) tr.querySelector('[data-f="slot"]').value = String(s.slot || 1);
    sessionBody.appendChild(tr);
    renumberRows();
  }

  function renumberRows() {
    var rows = sessionBody.querySelectorAll('tr.session-row');
    rows.forEach(function (tr, i) {
      tr.querySelector('.sesi-no').textContent = i + 1;
      tr.querySelector('[data-remove]').disabled = rows.length === 1;
    });
  }

  sessionBody.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    btn.closest('tr').remove();
    renumberRows();
  });

  document.getElementById('btnAddSession').addEventListener('click', function () { addSessionRow(); });

  function loadRequestRows(requestId, extraSlot) {
    sessionBody.innerHTML = '';
    renderHead();
    var existing = requestId ? sessionsOf(requestId) : [];
    existing.forEach(addSessionRow);
    if (extraSlot) addSessionRow(extraSlot);
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

  function openModal(requestId, slot) {
    editingRequestId = requestId;
    pendingSlot = slot;
    if (requestId) activeJenis = findRequest(requestId).jenis;
    fillRequestOptions();
    document.getElementById('scheduleModalTitle').textContent = (requestId ? 'Atur Jadwal ' + requestId : 'Buat Jadwal') + ' · ' + activeJenis;
    document.getElementById('schRequestError').classList.add('d-none');
    $request.val(requestId).trigger('change.select2');
    $request.prop('disabled', !!requestId);
    loadRequestRows(requestId, slot);
    scheduleModal.show();
  }

  document.getElementById('btnCreateSchedule').addEventListener('click', function () { openModal(null, null); });

  document.getElementById('btnSaveSchedule').addEventListener('click', function () {
    var requestId = editingRequestId || $request.val();
    var valid = true;
    document.getElementById('schRequestError').classList.toggle('d-none', !!requestId);
    if (!requestId) valid = false;
    var jenis = modalJenis();

    var rows = Array.prototype.map.call(sessionBody.querySelectorAll('tr.session-row'), function (tr) {
      var get = function (f) { return tr.querySelector('[data-f="' + f + '"]'); };
      var date = get('date');
      date.classList.toggle('is-invalid', !date.value);
      if (!date.value) valid = false;
      var out = { id: tr.dataset.id, analis: get('analis').value, catatan: get('catatan').value.trim() };
      if (jenis === 'Sensory') {
        var slot = Number(get('slot').value) || 1;
        out.slot = slot;
        out.start = date.value + 'T' + SENSORY_SLOTS[slot].start;
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
    if (!valid) return;

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
    persist();
    /* Scheduling a Fully Approved request confirms it (Waiting for Schedule → Confirmed) */
    markPanelRequestScheduled(jenis, requestId);
    scheduleModal.hide();
    showToast('Jadwal ' + requestId + ' disimpan (' + rows.length + ' sesi)');
  });

  /* Open the tab matching the active one when the modal closes after switching via edit */
  document.getElementById('scheduleModal').addEventListener('hidden.bs.modal', function () {
    tabsNav.querySelectorAll('.nav-link').forEach(function (t) { t.classList.toggle('active', t.dataset.jenis === activeJenis); });
    applyTab();
  });

  /* schedule.html?jenis=Sensory&request=SN-... (Jadwalkan from a Fully Approved request) */
  var qJenis = /[?&]jenis=(Sensory|ASLT)/.exec(location.search);
  var qRequest = /[?&]request=([^&]+)/.exec(location.search);
  if (qJenis) {
    activeJenis = qJenis[1];
    tabsNav.querySelectorAll('.nav-link').forEach(function (t) { t.classList.toggle('active', t.dataset.jenis === activeJenis); });
    applyTab();
  }
  if (qRequest && findRequest(decodeURIComponent(qRequest[1]))) {
    var qId = decodeURIComponent(qRequest[1]);
    if (sessionsOf(qId).length) openModal(qId, null);
    else { openModal(null, null); $request.val(qId).trigger('change'); }
  }
});
