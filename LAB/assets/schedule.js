/* ---------- HOLABSYS Schedule page (FullCalendar) ---------- */
document.addEventListener('DOMContentLoaded', function () {
  var schedules = getSchedules();
  var requests = getSchedulableRequests();
  var activeJenis = Object.keys(SCHEDULE_JENIS);

  var scheduleModal = new bootstrap.Modal(document.getElementById('scheduleModal'));
  var deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
  var detailOffcanvas = new bootstrap.Offcanvas(document.getElementById('detailOffcanvas'));
  var toast = new bootstrap.Toast(document.getElementById('scheduleToast'), { delay: 2500 });

  var sessionBody = document.getElementById('sessionBody');
  var $request = $('#schRequest');
  var editingRequestId = null; // set when the modal edits an existing request's sessions
  var detailScheduleId = null;

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
  function sessionNo(s) { return sessionsOf(s.requestId).indexOf(s) + 1; }
  function findSchedule(id) {
    for (var i = 0; i < schedules.length; i++) if (schedules[i].id === id) return schedules[i];
    return null;
  }
  function showToast(text) {
    document.getElementById('scheduleToastText').textContent = text;
    toast.show();
  }
  function persist() {
    saveSchedules(schedules);
    calendar.refetchEvents();
  }

  /* ---------- jenis filter / legend ---------- */
  var filterHost = document.getElementById('jenisFilter');
  filterHost.innerHTML = Object.keys(SCHEDULE_JENIS).map(function (j) {
    var c = SCHEDULE_JENIS[j].color;
    return '<div class="form-check mb-0">' +
      '<input class="form-check-input" type="checkbox" id="flt' + j + '" value="' + j + '" checked />' +
      '<label class="form-check-label d-inline-flex align-items-center gap-1" for="flt' + j + '">' +
      '<span class="badge bg-' + c + '-transparent">' + j + '</span></label></div>';
  }).join('');
  filterHost.addEventListener('change', function () {
    activeJenis = Array.prototype.map.call(filterHost.querySelectorAll('input:checked'), function (i) { return i.value; });
    calendar.refetchEvents();
  });

  /* ---------- calendar ---------- */
  var calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
    locale: 'id',
    initialView: 'dayGridMonth',
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
    slotEventOverlap: false, // overlapping tests sit side by side instead of stacking
    editable: true,
    selectable: true,
    selectMirror: true,
    // Month cells open the day view instead of creating a schedule.
    selectAllow: function () { return calendar.view.type !== 'dayGridMonth'; },
    events: function (info, success) {
      success(schedules.filter(function (s) { return activeJenis.indexOf(s.jenis) !== -1; }).map(function (s) {
        return {
          id: s.id,
          title: s.requestId + ' · Sesi ' + sessionNo(s),
          start: s.start,
          end: s.end,
          classNames: ['bg-' + SCHEDULE_JENIS[s.jenis].color + '-transparent'],
          borderColor: 'rgb(var(--' + SCHEDULE_JENIS[s.jenis].color + '-rgb))'
        };
      }));
    },
    dateClick: function (info) {
      if (info.view.type === 'dayGridMonth') calendar.changeView('timeGridDay', info.date);
    },
    select: function (info) {
      openModal(null, { start: toLocalIso(info.start), end: toLocalIso(info.end) });
      calendar.unselect();
    },
    eventClick: function (info) {
      info.jsEvent.preventDefault();
      openDetail(info.event.id);
    },
    eventDrop: moveEvent,
    eventResize: moveEvent
  });
  calendar.render();

  function moveEvent(info) {
    var s = findSchedule(info.event.id);
    s.start = toLocalIso(info.event.start);
    s.end = toLocalIso(info.event.end || info.event.start);
    persist();
    showToast(s.requestId + ' dipindah ke ' + fmtDate(s.start) + ' ' + fmtTime(s.start));
  }

  /* ---------- detail offcanvas ---------- */
  function openDetail(id) {
    var s = findSchedule(id);
    if (!s) return;
    detailScheduleId = id;
    var req = findRequest(s.requestId);
    var meta = SCHEDULE_JENIS[s.jenis];
    var all = sessionsOf(s.requestId);
    document.getElementById('detailDocNo').textContent = s.requestId;

    var row = function (label, value) {
      return '<div class="mb-3"><div class="text-uppercase text-muted fs-10 mb-1">' + label + '</div><div class="fs-13 text-heading">' + value + '</div></div>';
    };
    var list = all.map(function (x, i) {
      var cur = x.id === s.id;
      return '<li class="d-flex align-items-center justify-content-between rounded-1 px-2 py-1 mb-1' + (cur ? ' bg-primary-transparent' : ' bg-light') + '">' +
        '<span class="fs-12 fw-medium">Sesi ' + (i + 1) + '</span>' +
        '<span class="fs-12 text-muted">' + fmtDate(x.start) + ' · ' + fmtTime(x.start) + '–' + fmtTime(x.end) + '</span></li>';
    }).join('');

    document.getElementById('detailBody').innerHTML =
      '<div class="d-flex align-items-center gap-2 mb-3">' +
        '<span class="badge bg-' + meta.color + '-transparent">' + esc(s.jenis) + '</span>' +
        '<span class="fs-13 fw-semibold">Sesi ' + sessionNo(s) + ' dari ' + all.length + '</span>' +
      '</div>' +
      row('Sampel', esc(req ? req.sampel : '-')) +
      row('Waktu', fmtDate(s.start) + '<br />' + fmtTime(s.start) + ' – ' + fmtTime(s.end)) +
      row('Analis', esc(s.analis || '-')) +
      row('Catatan', esc(s.catatan || '-')) +
      '<div class="text-uppercase text-muted fs-10 mb-1">Semua Sesi</div>' +
      '<ul class="list-unstyled mb-3">' + list + '</ul>' +
      '<a href="' + meta.form + '?docId=' + encodeURIComponent(s.requestId) + '" class="text-primary fw-medium fs-12">' +
        '<i class="ri-external-link-line me-1"></i>Buka Pengajuan</a>';
    detailOffcanvas.show();
  }

  document.getElementById('btnDetailEdit').addEventListener('click', function () {
    var s = findSchedule(detailScheduleId);
    detailOffcanvas.hide();
    openModal(s.requestId, null);
  });

  document.getElementById('btnDetailDelete').addEventListener('click', function () {
    var s = findSchedule(detailScheduleId);
    document.getElementById('deleteText').textContent = 'Hapus Sesi ' + sessionNo(s) + ' ' + s.requestId + ' (' + fmtDate(s.start) + ' ' + fmtTime(s.start) + ')?';
    detailOffcanvas.hide();
    deleteModal.show();
  });

  document.getElementById('btnConfirmDelete').addEventListener('click', function () {
    var s = findSchedule(detailScheduleId);
    schedules = schedules.filter(function (x) { return x.id !== detailScheduleId; });
    persist();
    deleteModal.hide();
    showToast('Sesi ' + s.requestId + ' dihapus');
  });

  /* ---------- create / edit modal ---------- */
  $request.html('<option></option>' + Object.keys(SCHEDULE_JENIS).map(function (j) {
    return '<optgroup label="' + j + '">' + requests.filter(function (r) { return r.jenis === j; }).map(function (r) {
      return '<option value="' + esc(r.id) + '">' + esc(r.id) + ' — ' + esc(r.sampel) + '</option>';
    }).join('') + '</optgroup>';
  }).join(''));
  $request.select2({ width: '100%', placeholder: 'Pilih pengajuan', allowClear: true, dropdownParent: $('#scheduleModal') });

  var analisOptions = ['<option value="">-</option>'].concat(MASTER_ANALIS.map(function (a) {
    return '<option value="' + esc(a) + '">' + esc(a) + '</option>';
  })).join('');

  function addSessionRow(s) {
    s = s || {};
    var tr = document.createElement('tr');
    tr.dataset.id = s.id || '';
    tr.innerHTML =
      '<td class="fw-medium sesi-no"></td>' +
      '<td><input type="date" class="form-control form-control-sm" data-f="date" value="' + (s.start ? s.start.slice(0, 10) : '') + '" /></td>' +
      '<td><input type="time" class="form-control form-control-sm" data-f="startTime" value="' + (s.start ? fmtTime(s.start) : '') + '" /></td>' +
      '<td><input type="time" class="form-control form-control-sm" data-f="endTime" value="' + (s.end ? fmtTime(s.end) : '') + '" />' +
        '<div class="invalid-feedback">Jam selesai harus setelah jam mulai.</div></td>' +
      '<td><select class="form-select form-select-sm" data-f="analis">' + analisOptions + '</select></td>' +
      '<td><input type="text" class="form-control form-control-sm" data-f="catatan" value="' + esc(s.catatan || '') + '" /></td>' +
      '<td><button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" data-remove title="Hapus sesi"><i class="ri-delete-bin-line"></i></button></td>';
    tr.querySelector('[data-f="analis"]').value = s.analis || '';
    sessionBody.appendChild(tr);
    renumberRows();
  }

  function renumberRows() {
    var rows = sessionBody.querySelectorAll('tr');
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
    var existing = requestId ? sessionsOf(requestId) : [];
    existing.forEach(addSessionRow);
    if (extraSlot) addSessionRow(extraSlot);
    // A new request without a picked slot starts with the usual two sessions.
    while (sessionBody.children.length < (existing.length || extraSlot ? 1 : 2)) addSessionRow();
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
    document.getElementById('scheduleModalTitle').textContent = requestId ? 'Atur Jadwal ' + requestId : 'Buat Jadwal';
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

    var rows = Array.prototype.map.call(sessionBody.querySelectorAll('tr'), function (tr) {
      var get = function (f) { return tr.querySelector('[data-f="' + f + '"]'); };
      var date = get('date'), st = get('startTime'), et = get('endTime');
      [date, st, et].forEach(function (el) { el.classList.toggle('is-invalid', !el.value); });
      var orderOk = !st.value || !et.value || et.value > st.value;
      if (!orderOk) et.classList.add('is-invalid');
      if (!date.value || !st.value || !et.value || !orderOk) valid = false;
      return {
        id: tr.dataset.id,
        start: date.value + 'T' + st.value,
        end: date.value + 'T' + et.value,
        analis: get('analis').value,
        catatan: get('catatan').value.trim()
      };
    });
    if (!valid) return;

    var jenis = findRequest(requestId).jenis;
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
    });
    persist();
    scheduleModal.hide();
    showToast('Jadwal ' + requestId + ' disimpan (' + rows.length + ' sesi)');
  });
});
