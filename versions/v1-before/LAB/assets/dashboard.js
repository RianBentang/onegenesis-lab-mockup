/* ---------- Dashboard: request status over Internal, External, Sensory & ASLT ----------
   Every submitted request (not Draft / Return to Edit / Rejected) is "masuk" and falls in one
   category:
   - Selesai: report Final (Internal, Sensory, ASLT) or Confirmed (External ends at Confirm Delivery)
   - Over Deadline: not Selesai and today is past its deadline
   - In Progress: being worked on (Internal SPK issued, Sensory / ASLT scheduled)
   - Menunggu Proses: still in approval or its first workflow step
   Deadline = Internal Est. Tanggal Selesai Uji when the SPK is out, else tanggal + SLA days. */
var DASH_SLA_DAYS = {
  internal: { Normal: 14, Urgent: 7 },
  external: { Normal: 21, Urgent: 14 },
  sensory: { Normal: 14, Urgent: 7 },
  aslt: { Normal: 120, Urgent: 90 }
};

var DASH_SOURCES = {
  internal: { label: 'Internal', form: 'HOLABSYS/internalForm.html' },
  external: { label: 'External', form: 'HOLABSYS/externalForm.html' },
  sensory: { label: 'Sensory', form: 'HOLABSYS/sensoryForm.html' },
  aslt: { label: 'ASLT', form: 'HOLABSYS/asltForm.html' }
};

/* Chart colors are the theme's --{variant}-rgb, same order as SpkDonutChart's legend */
var DASH_CATEGORIES = [
  { key: 'menunggu', name: 'Waiting', variant: 'warning' },
  { key: 'progress', name: 'In Progress', variant: 'info' },
  { key: 'selesai', name: 'Done', variant: 'success' },
  { key: 'over', name: 'Over Deadline', variant: 'danger' }
];

function dashParseDate(s) {
  var p = (s || '').split('-');
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
  var running = source === 'internal' ? (r.step === 'Done' || r.step === 'Draft Report')
    : source === 'external' ? false
    : r.step === 'Running';
  return running ? 'progress' : 'menunggu';
}

function dashRows() {
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var lists = {
    internal: getRequests(),
    external: getExternalRequests(),
    sensory: getSensoryRequests(),
    aslt: getAsltRequests()
  };
  var rows = [];
  Object.keys(lists).forEach(function (source) {
    lists[source].forEach(function (r) {
      if (!r.step || r.step === 'Draft' || r.step === 'Rejected') return;
      rows.push({
        source: source, record: r,
        deadline: dashDeadline(source, r),
        category: dashCategory(source, r, today)
      });
    });
  });
  rows.sort(function (a, b) { return (dashParseDate(b.record.tanggal) || 0) - (dashParseDate(a.record.tanggal) || 0); });
  return rows;
}

function dashThemeColor(variant) {
  var rgb = getComputedStyle(document.documentElement).getPropertyValue('--' + variant + '-rgb').trim();
  return 'rgb(' + rgb + ')';
}

function dashCategoryBadge(key) {
  var c = DASH_CATEGORIES.filter(function (x) { return x.key === key; })[0];
  return '<span class="badge bg-' + c.variant + '-transparent">' + c.name + '</span>';
}

document.addEventListener('DOMContentLoaded', function () {
  var rows = dashRows();
  var counts = { menunggu: 0, progress: 0, selesai: 0, over: 0 };
  rows.forEach(function (row) { counts[row.category]++; });
  var total = rows.length;

  function percent(v) { return total ? Math.round(v / total * 100) : 0; }

  /* Welcome banner: today, greeting by hour, the mockup role's name */
  var now = new Date();
  document.getElementById('dashToday').textContent = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
  var hour = now.getHours();
  document.getElementById('dashGreeting').textContent =
    (hour < 11 ? 'Good morning' : hour < 15 ? 'Good afternoon' : hour < 18 ? 'Good afternoon' : 'Good evening') +
    '! Have a productive day!';
  function showUser(role) { document.getElementById('dashUserName').textContent = role.name; }
  showUser(currentRole());
  document.addEventListener('holabsys:rolechange', function (e) { showUser(e.detail); });

  /* Stat cards: "n of total" + share badge */
  document.getElementById('dashTotal').textContent = total;
  document.getElementById('dashTotalBadge').innerHTML = '<i class="ri-stack-line me-1"></i>Total';
  [['dashProgress', 'progress', 'ri-arrow-up-s-line'], ['dashSelesai', 'selesai', 'ri-arrow-up-s-line'],
    ['dashOver', 'over', 'ri-error-warning-line']].forEach(function (s) {
    document.getElementById(s[0]).textContent = counts[s[1]] + ' of ' + total;
    document.getElementById(s[0] + 'Badge').innerHTML = '<i class="' + s[2] + ' me-1"></i>' + percent(counts[s[1]]) + '%';
  });

  /* Legend (SpkDonutChart layout) */
  document.getElementById('dashLegend').innerHTML = DASH_CATEGORIES.map(function (c) {
    return '<a href="#!" class="d-flex align-items-center justify-content-between gap-2 text-decoration-none" data-category="' + c.key + '">' +
      '<span class="d-flex align-items-center gap-2"><span class="rounded-1 d-inline-block flex-shrink-0 bg-' + c.variant + '" style="width:12px;height:12px"></span>' +
      '<span class="text-muted fs-12">' + c.name + '</span></span>' +
      '<span class="text-muted fs-12">' + counts[c.key] + ' (' + percent(counts[c.key]) + '%)</span></a>';
  }).join('');
  document.getElementById('dashTotalLabel').textContent = 'Total ' + total + ' incoming requests (Internal, External, Sensory & ASLT)';

  /* Pie chart (SpkDonutChart → Spkapexcharts, type pie) */
  var chart = null;
  function renderChart() {
    if (chart) chart.destroy();
    var card = document.getElementById('dashStatusCard');
    chart = new ApexCharts(document.getElementById('dashPie'), {
      chart: {
        type: 'pie', height: 220, toolbar: { show: false },
        events: {
          dataPointSelection: function (e, ctx, cfg) { openDetail(DASH_CATEGORIES[cfg.dataPointIndex].key); }
        }
      },
      series: DASH_CATEGORIES.map(function (c) { return counts[c.key]; }),
      labels: DASH_CATEGORIES.map(function (c) { return c.name; }),
      colors: DASH_CATEGORIES.map(function (c) { return dashThemeColor(c.variant); }),
      stroke: { width: 2, colors: [getComputedStyle(card).backgroundColor] },
      dataLabels: { enabled: true, formatter: function (v, o) { return o.w.globals.series[o.seriesIndex] || ''; } },
      legend: { show: false },
      tooltip: { y: { formatter: function (v) { return v + ' requests'; } } }
    });
    chart.render();
  }
  renderChart();
  /* Re-render on the dark mode toggle so the slice borders follow the card background */
  new MutationObserver(renderChart).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-mode'] });

  /* Detail modal */
  var modalEl = document.getElementById('dashDetailModal');
  var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  var catFilter = document.getElementById('dashFilterCategory');
  var srcFilter = document.getElementById('dashFilterSource');

  function renderDetail() {
    var cat = catFilter.value;
    var src = srcFilter.value;
    var list = rows.filter(function (row) {
      return (!cat || row.category === cat) && (!src || row.source === src);
    });
    document.getElementById('dashDetailCount').textContent = list.length + ' requests';
    document.getElementById('dashDetailBody').innerHTML = list.length ? list.map(function (row) {
      var r = row.record;
      var href = DASH_SOURCES[row.source].form + '?docId=' + encodeURIComponent(r.id);
      var late = row.category === 'over';
      return '<tr>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + DASH_SOURCES[row.source].label + '</td>' +
        '<td>' + (r.sampel || '-') + '</td>' +
        '<td>' + (r.tanggal || '-') + '</td>' +
        '<td class="' + (late ? 'text-danger fw-medium' : '') + '">' + dashFormatDate(row.deadline) + '</td>' +
        '<td>' + docStatusBadgesHtml(r) + '</td>' +
        '<td>' + dashCategoryBadge(row.category) + '</td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="7" class="text-center text-muted py-4">No requests.</td></tr>';
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
});
