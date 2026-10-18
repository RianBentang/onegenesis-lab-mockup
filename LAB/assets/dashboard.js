/* ---------- Dashboard — one layout for every role, the data follows the role ----------
   Row 1: welcome banner (who, how many items wait for them) + 4 KPI tiles (DASH_ROLE_KPIS)
   Row 2: Request Status pie (deadline categories) + My Action Queue (nextActor, dummy-requests.js)
   Row 3: Request Pipeline (where the requests are: docStepKey)
   Scope: the requester (BSU) sees their own requests, every other role all requests. The KPI tiles
   never repeat the pie slices: the pie answers "on time?", the tiles "what is mine to do?".
   Pie categories — every submitted request (not Draft / Rejected) falls in one:
   - Done: report Final (Internal, Sensory, ASLT) or Confirmed (External ends at Confirm Delivery)
   - Over Deadline: not Done and today is past its deadline
   - In Progress: being tested (Internal SPK issued, Sensory / ASLT scheduled)
   - Waiting: still in approval or lab intake (receipt, technical review, delivery, schedule)
   Deadline = Internal Est. Tanggal Selesai Uji once the review set it, else tanggal + SLA days. */
var DASH_SLA_DAYS = {
  internal: { Normal: 14, Urgent: 7 },
  external: { Normal: 21, Urgent: 14 },
  sensory: { Normal: 14, Urgent: 7 },
  aslt: { Normal: 120, Urgent: 90 }
};

var DASH_SOURCES = {
  internal: { label: 'Internal', form: 'HOLABSYS/internalForm.html', icon: 'ri-flask-line' },
  external: { label: 'External', form: 'HOLABSYS/externalForm.html', icon: 'ri-building-2-line' },
  sensory: { label: 'Sensory', form: 'HOLABSYS/sensoryForm.html', icon: 'ri-restaurant-line' },
  aslt: { label: 'ASLT', form: 'HOLABSYS/asltForm.html', icon: 'ri-timer-line' }
};

/* Chart colors are the theme's --{variant}-rgb, same order as SpkDonutChart's legend */
var DASH_CATEGORIES = [
  { key: 'menunggu', name: 'Waiting', variant: 'warning' },
  { key: 'progress', name: 'In Progress', variant: 'info' },
  { key: 'selesai', name: 'Done', variant: 'success' },
  { key: 'over', name: 'Over Deadline', variant: 'danger' }
];

/* Pipeline stages (docStepKey → stage) */
var DASH_STAGES = [
  { key: 'approval', name: 'Approval', icon: 'ri-checkbox-circle-line', steps: ['approval'] },
  { key: 'intake', name: 'Lab Intake', icon: 'ri-inbox-archive-line', steps: ['delivery', 'schedule'] },
  { key: 'review', name: 'Technical Review', icon: 'ri-file-search-line', steps: ['review'] },
  { key: 'testing', name: 'Testing', icon: 'ri-test-tube-line', steps: ['testing'] },
  { key: 'report', name: 'Report Review', icon: 'ri-file-list-3-line', steps: ['report'] },
  { key: 'done', name: 'Completed', icon: 'ri-award-line', steps: ['done'] }
];

function dashParseDate(s) {
  var p = (s || '').split(' ')[0].split('-');
  return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]) : null;
}

function dashFormatDate(d) {
  if (!d) return '-';
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  return pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear();
}

function dashDeadline(source, r) {
  if (source === 'internal' && r.estSelesai) return dashParseDate(r.estSelesai);
  var start = dashParseDate(r.tanggal);
  if (!start) return null;
  var sla = DASH_SLA_DAYS[source][r.tipe === 'Urgent' ? 'Urgent' : 'Normal'];
  start.setDate(start.getDate() + sla);
  return start;
}

function dashCategory(source, r, today) {
  if (source === 'external' ? r.step === 'Confirmed' : r.reportStatus === 'Final') return 'selesai';
  var deadline = dashDeadline(source, r);
  if (deadline && today > deadline) return 'over';
  var key = docStepKey(source, r);
  return key === 'testing' || key === 'report' ? 'progress' : 'menunggu';
}

/* Every request of the four lists, with what the dashboard needs (Draft and Rejected included,
   the views below pick what they show) */
function dashAllRows() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var lists = { internal: getRequests(), external: getExternalRequests(), sensory: getSensoryRequests(), aslt: getAsltRequests() };
  var rows = [];
  Object.keys(lists).forEach(function (source) {
    lists[source].forEach(function (r) {
      if (!r.step) return;
      var key = docStepKey(source, r);
      rows.push({
        source: source, record: r,
        submitted: r.step !== 'Draft' && r.step !== 'Rejected',
        deadline: dashDeadline(source, r),
        category: dashCategory(source, r, today),
        stage: DASH_STAGES.filter(function (s) { return s.steps.indexOf(key) !== -1; }).map(function (s) { return s.key; })[0] || null,
        actor: nextActor(source, r)
      });
    });
  });
  rows.sort(function (a, b) { return (dashParseDate(b.record.tanggal) || 0) - (dashParseDate(a.record.tanggal) || 0); });
  return rows;
}

/* ---------- KPI tiles per role: same 4-tile row, the content follows the role ----------
   value(ctx) → number; ctx = { all: rows in scope, queue: rows waiting for this role, role } */
function dashCount(list, fn) { return list.filter(fn).length; }
var DASH_KPI = {
  queue: { label: 'Needs My Action', icon: 'ri-user-received-line', variant: 'primary', hint: 'Waiting for you now',
    value: function (c) { return c.queue.length; }, href: '#dashQueue' },
  urgentQueue: { label: 'Urgent for Me', icon: 'ri-flashlight-line', variant: 'danger', hint: 'Urgent requests in your queue',
    value: function (c) { return dashCount(c.queue, function (x) { return x.record.tipe === 'Urgent'; }); }, href: '#dashQueue' },
  returned: { label: 'Returned to Me', icon: 'ri-arrow-go-back-line', variant: 'warning', hint: 'Fix and resubmit',
    value: function (c) { return dashCount(c.all, function (x) { return x.record.step === 'Draft' && x.record.returned; }); }, href: 'HOLABSYS/internalList.html' },
  inLab: { label: 'In the Lab', icon: 'ri-flask-line', variant: 'info', hint: 'Lab Admin, Coordinator, Analyst or TCM acting',
    value: function (c) { return dashCount(c.all, function (x) { return x.actor && ['ADM', 'CRL', 'ANL', 'TCM'].indexOf(x.actor.code) !== -1; }); } },
  certificates: { label: 'Certificates Ready', icon: 'ri-award-line', variant: 'success', hint: 'Issued, ready to download',
    value: function (c) { return dashCount(c.all, function (x) { return !!lastIssuedReport(x.record); }); }, href: 'HOLABSYS/reportList.html' },
  approvedByMe: { label: 'Approved by Me', icon: 'ri-checkbox-circle-line', variant: 'success', hint: 'Requests past your level',
    value: function (c) {
      return dashCount(c.all, function (x) {
        var chain = docApprovalChain(x.source, x.record);
        var i = chain.indexOf(c.role.code);
        var done = x.record.step === 'Approval' ? (x.record.approvalIdx || 0) : (x.submitted ? chain.length : 0);
        return i !== -1 && i < done;
      });
    } },
  returnedByMe: { label: 'Returned / Rejected by Me', icon: 'ri-close-circle-line', variant: 'warning', hint: 'With your reason on the document',
    value: function (c) { return dashCount(c.all, function (x) { return (x.record.reasonBy || '').indexOf(c.role.label) === 0; }); } },
  receive: { label: 'Samples to Receive', icon: 'ri-inbox-archive-line', variant: 'primary', hint: 'Internal · last approval = sample receipt',
    value: function (c) { return dashCount(c.all, function (x) { return x.source === 'internal' && x.actor && x.actor.code === 'ADM'; }); }, href: 'HOLABSYS/internalList.html' },
  deliver: { label: 'Deliveries to Confirm', icon: 'ri-truck-line', variant: 'info', hint: 'External · sample to vendor',
    value: function (c) { return dashCount(c.all, function (x) { return x.record.step === 'Sample Delivery'; }); }, href: 'HOLABSYS/externalList.html' },
  schedule: { label: 'Panels to Schedule', icon: 'ri-calendar-event-line', variant: 'warning', hint: 'Sensory / ASLT',
    value: function (c) { return dashCount(c.all, function (x) { return x.record.step === 'Scheduling'; }); }, href: 'HOLABSYS/schedule.html' },
  invoices: { label: 'Overdue Invoices', icon: 'ri-bill-line', variant: 'danger', hint: 'External lab invoices past due',
    value: function () { return typeof getInvoices === 'function' ? getInvoices().filter(function (i) { return invoiceStatusLabel(i) === 'Overdue'; }).length : 0; }, href: 'Master-Data/invoice.html' },
  reviews: { label: 'Technical Reviews', icon: 'ri-file-search-line', variant: 'primary', hint: 'Received samples to review',
    value: function (c) { return dashCount(c.all, function (x) { return x.record.step === 'Technical Review' && !consentPending(x.record); }); }, href: 'HOLABSYS/internalList.html' },
  toEnter: { label: 'Results to Enter', icon: 'ri-file-excel-2-line', variant: 'info', hint: 'In testing, not pushed yet',
    value: function (c) { return dashCount(c.all, function (x) { return x.stage === 'testing'; }); }, href: 'HOLABSYS/excel.html' },
  reportsDraft: { label: 'Reports to Review', icon: 'ri-file-list-3-line', variant: 'warning', hint: 'Draft reports → Submit',
    value: function (c) { return dashCount(c.all, function (x) { return x.record.reportStatus === 'Draft'; }); }, href: 'HOLABSYS/reportList.html' },
  consent: { label: 'Waiting for Requester', icon: 'ri-user-shared-line', variant: 'danger', hint: 'Partial / subcontract approval',
    value: function (c) { return dashCount(c.all, function (x) { return consentPending(x.record); }); } },
  toApprove: { label: 'Reports to Approve', icon: 'ri-shield-check-line', variant: 'primary', hint: 'Approve & issue the LHU',
    value: function (c) { return dashCount(c.all, function (x) { return x.record.reportStatus === 'Confirm to Approve'; }); }, href: 'HOLABSYS/reportList.html' },
  retests: { label: 'Open Re-tests', icon: 'ri-restart-line', variant: 'warning', hint: 'Waiting for a new result',
    value: function (c) { return dashCount(c.all, function (x) { return !!openRetest(x.record) || !!(x.record.reportCycle && x.record.reportCycle.type === 'Re-test'); }); } },
  ncOpen: { label: 'Open Nonconformities', icon: 'ri-error-warning-line', variant: 'danger', hint: 'Root cause + corrective action',
    value: function () { return getQualityRecords().filter(function (r) { return r.status === 'Open'; }).length; }, href: 'HOLABSYS/qualityRecords.html' },
  ptFollow: { label: 'PT to Follow Up', icon: 'ri-medal-line', variant: 'info', hint: 'Questionable / unsatisfactory z-score',
    value: function () { return getProficiencyTests().filter(function (p) { return ptVerdict(p) !== 'Satisfactory'; }).length; }, href: 'HOLABSYS/qualityRecords.html?tab=pt' },
  lowStock: { label: 'Reagents Below Minimum', icon: 'ri-test-tube-line', variant: 'warning', hint: 'Stock opname',
    value: function () { return getReagents().filter(function (r) { return r.stok < r.min; }).length; }, href: 'Master-Data/reagenStock.html' }
};
var DASH_ROLE_KPIS = {
  BSU: ['queue', 'returned', 'inLab', 'certificates'],
  MGU: ['queue', 'urgentQueue', 'approvedByMe', 'returnedByMe'],
  HOR: ['queue', 'urgentQueue', 'approvedByMe', 'returnedByMe'],
  FRA: ['queue', 'urgentQueue', 'approvedByMe', 'returnedByMe'],
  HOL: ['queue', 'urgentQueue', 'lowStock', 'ncOpen'],
  ADM: ['receive', 'deliver', 'schedule', 'invoices'],
  CRL: ['reviews', 'toEnter', 'reportsDraft', 'consent'],
  ANL: ['queue', 'toEnter', 'retests', 'lowStock'],
  TCM: ['toApprove', 'retests', 'ncOpen', 'ptFollow']
};

function dashThemeColor(variant) {
  var rgb = getComputedStyle(document.documentElement).getPropertyValue('--' + variant + '-rgb').trim();
  return 'rgb(' + rgb + ')';
}

function dashCategoryBadge(key) {
  var c = DASH_CATEGORIES.filter(function (x) { return x.key === key; })[0];
  return '<span class="badge bg-' + c.variant + '-transparent">' + c.name + '</span>';
}

document.addEventListener('DOMContentLoaded', function () {
  var rows = [];   // scope rows (submitted)
  var chart = null;

  /* Welcome banner: today and greeting by hour */
  var now = new Date();
  document.getElementById('dashToday').textContent = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  var hour = now.getHours();
  var greeting = hour < 11 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  function render() {
    var role = currentRole();
    var all = dashAllRows().filter(function (x) { return role.code !== 'BSU' || x.record.pemohon === role.name; });
    rows = all.filter(function (x) { return x.submitted; });
    var queue = all.filter(function (x) { return x.actor && x.actor.code === role.code; });
    var ctx = { all: all, queue: queue, role: role };

    /* ---- banner ---- */
    document.getElementById('dashUserName').textContent = role.name;
    document.getElementById('dashRole').textContent = role.label + ' · ' + role.dept;
    document.getElementById('dashGreeting').innerHTML = greeting + '! ' + (queue.length
      ? '<span class="fw-semibold">' + queue.length + ' item' + (queue.length > 1 ? 's' : '') + '</span> waiting for you.'
      : 'Nothing waiting for you right now.');

    /* ---- KPI tiles ---- */
    /* SpkCountercard row (spk-kit.js) */
    document.getElementById('dashKpis').innerHTML = (DASH_ROLE_KPIS[role.code] || DASH_ROLE_KPIS.BSU).map(function (k) {
      var d = DASH_KPI[k];
      return '<div class="col-12 col-md-6">' + spkCountercardHtml({ label: d.label, value: d.value(ctx), hint: d.hint, icon: d.icon, variant: d.variant, href: d.href }) + '</div>';
    }).join('');

    /* ---- pie ---- */
    var counts = { menunggu: 0, progress: 0, selesai: 0, over: 0 };
    rows.forEach(function (x) { counts[x.category]++; });
    var total = rows.length;
    var percent = function (v) { return total ? Math.round(v / total * 100) : 0; };
    document.getElementById('dashStatusTitle').textContent = role.code === 'BSU' ? 'My Request Status' : 'Request Status';
    document.getElementById('dashPieTotal').textContent = total;
    document.getElementById('dashLegend').innerHTML = DASH_CATEGORIES.map(function (c) {
      return '<a href="#!" class="dash-legend-item" data-category="' + c.key + '">' +
        '<span class="d-flex align-items-center gap-2"><span class="dash-legend-dot bg-' + c.variant + '"></span>' +
        '<span class="fs-13">' + c.name + '</span></span>' +
        '<span class="fs-13 fw-semibold">' + counts[c.key] + ' <span class="text-muted fw-normal fs-12">(' + percent(counts[c.key]) + '%)</span></span></a>';
    }).join('');
    document.getElementById('dashTotalLabel').textContent = (role.code === 'BSU' ? 'Your ' : '') + total + ' submitted requests · Internal, External, Sensory & ASLT';
    renderChart(counts);

    /* ---- action queue ---- */
    document.getElementById('dashQueueCount').textContent = queue.length;
    document.getElementById('dashQueueBody').innerHTML = queue.length ? queue.map(function (x) {
      var r = x.record;
      /* An open Re-test / Revision document is where the work is (its Report tab) */
      var amend = openAmendmentOf(r);
      var href = amend ? 'HOLABSYS/' + amendmentHref(amend.id, amend.step === 'Open' ? '&tab=report' : '') : DASH_SOURCES[x.source].form + '?docId=' + encodeURIComponent(r.id);
      var late = x.category === 'over';
      return '<tr>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a>' +
          (r.tipe === 'Urgent' ? ' <span class="badge bg-danger-transparent ms-1">Urgent</span>' : '') + '</td>' +
        '<td><span class="d-inline-flex align-items-center gap-1"><i class="' + DASH_SOURCES[x.source].icon + ' text-muted"></i>' + DASH_SOURCES[x.source].label + '</span></td>' +
        '<td class="text-truncate" style="max-width:200px" title="' + (r.sampel || '') + '">' + (r.sampel || '-') + '</td>' +
        '<td><span class="badge bg-primary-transparent"><i class="' + x.actor.icon + ' me-1"></i>' + x.actor.action + '</span></td>' +
        '<td class="' + (late ? 'text-danger fw-semibold' : '') + '">' + dashFormatDate(x.deadline) + (late ? ' <i class="ri-alarm-warning-line"></i>' : '') + '</td>' +
        '<td class="text-end"><div class="d-flex gap-1 justify-content-end"><a href="' + href + '" class="btn btn-icon btn-sm btn-primary-light btn-wave" title="View"><i class="ri-eye-line"></i></a></div></td></tr>';
    }).join('') : '<tr><td colspan="6"><div class="dash-empty"><i class="ri-checkbox-circle-line"></i><div class="fw-semibold">All clear</div>' +
      '<div class="text-muted fs-12">Nothing is waiting for ' + role.label + ' right now.</div></div></td></tr>';

    /* ---- pipeline ---- */
    document.getElementById('dashPipeline').innerHTML = DASH_STAGES.map(function (s) {
      var n = rows.filter(function (x) { return x.stage === s.key; }).length;
      var mine = queue.filter(function (x) { return x.stage === s.key; }).length;
      return '<div class="dash-stage' + (mine ? ' has-mine' : '') + '">' +
        '<span class="dash-stage-icon"><i class="' + s.icon + '"></i></span>' +
        '<div class="dash-stage-count">' + n + '</div><div class="dash-stage-name">' + s.name + '</div>' +
        (mine ? '<span class="badge bg-primary mt-1">' + mine + ' for you</span>' : '') + '</div>';
    }).join('');
  }

  /* Pie chart (SpkDonutChart → Spkapexcharts, type pie) */
  function renderChart(counts) {
    if (chart) chart.destroy();
    var card = document.getElementById('dashStatusCard');
    chart = new ApexCharts(document.getElementById('dashPie'), {
      chart: {
        type: 'pie', height: 230, toolbar: { show: false },
        events: { dataPointSelection: function (e, ctx, cfg) { openDetail(DASH_CATEGORIES[cfg.dataPointIndex].key); } }
      },
      series: DASH_CATEGORIES.map(function (c) { return counts[c.key]; }),
      labels: DASH_CATEGORIES.map(function (c) { return c.name; }),
      colors: DASH_CATEGORIES.map(function (c) { return dashThemeColor(c.variant); }),
      stroke: { width: 3, colors: [getComputedStyle(card).backgroundColor] },
      dataLabels: { enabled: true, formatter: function (v, o) { return o.w.globals.series[o.seriesIndex] || ''; }, dropShadow: { enabled: false } },
      legend: { show: false },
      states: { hover: { filter: { type: 'darken', value: 0.9 } } },
      tooltip: { y: { formatter: function (v) { return v + ' requests'; } } }
    });
    chart.render();
  }
  /* Re-render on the dark mode toggle so the slice borders follow the card background */
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-mode'] });

  /* ---- detail modal (pie slice / legend / View) ---- */
  var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('dashDetailModal'));
  var catFilter = document.getElementById('dashFilterCategory');
  var srcFilter = document.getElementById('dashFilterSource');

  function renderDetail() {
    var cat = catFilter.value;
    var src = srcFilter.value;
    var list = rows.filter(function (x) { return (!cat || x.category === cat) && (!src || x.source === src); });
    document.getElementById('dashDetailCount').textContent = list.length + ' requests';
    document.getElementById('dashDetailBody').innerHTML = list.length ? list.map(function (x) {
      var r = x.record;
      var href = DASH_SOURCES[x.source].form + '?docId=' + encodeURIComponent(r.id);
      return '<tr>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + DASH_SOURCES[x.source].label + '</td>' +
        '<td>' + (r.sampel || '-') + '</td>' +
        '<td>' + (r.tanggal || '-') + '</td>' +
        '<td class="' + (x.category === 'over' ? 'text-danger fw-medium' : '') + '">' + dashFormatDate(x.deadline) + '</td>' +
        '<td>' + docStatusBadgesHtml(r) + '</td>' +
        '<td>' + (x.actor ? findRole(x.actor.code).label : '-') + '</td>' +
        '<td>' + dashCategoryBadge(x.category) + '</td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="8" class="text-center text-muted py-4">No requests.</td></tr>';
  }

  function openDetail(category) {
    $(catFilter).val(category || '').trigger('change');
    $(srcFilter).val('').trigger('change');
    renderDetail();
    modal.show();
  }

  $(catFilter).on('change', renderDetail);
  $(srcFilter).on('change', renderDetail);
  document.getElementById('dashViewBtn').addEventListener('click', function () { openDetail(''); });
  document.getElementById('dashLegend').addEventListener('click', function (e) {
    var a = e.target.closest('[data-category]');
    if (!a) return;
    e.preventDefault();
    openDetail(a.getAttribute('data-category'));
  });

  render();
  document.addEventListener('holabsys:rolechange', render);
});
