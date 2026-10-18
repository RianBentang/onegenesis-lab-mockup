/* ---------- HOLABSYS ASLT & Sensory list ----------
   Same layout as the Internal / External request lists: tabs (Sensory / ASLT) + one Request List
   card with status filter and search. Status uses the shared doc status badges (getDocStatus /
   docStatusBadgesHtml, dummy-requests.js). One create button in the page header, following the
   active tab (label stays "Buat Pengajuan Baru"). Open with ?tab=aslt to land on the ASLT tab (the ASLT form's Back link does). */

function aslRowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

var ASLT_SENSORY_TABS = {
  sensory: {
    form: 'sensoryForm.html', jenisHead: 'Test Type',
    list: function () { return getSensoryRequests(); },
    jenis: function (r) { return r.jenis || '-'; }
  },
  aslt: {
    form: 'asltForm.html', jenisHead: 'Category',
    list: function () { return getAsltRequests(); },
    jenis: function (r) { return r.kategori || '-'; }
  }
};

document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var filterStatus = document.getElementById('filterStatus');
  var tabsNav = document.getElementById('asltSensoryTabs');
  var activeTab = /[?&]tab=aslt\b/.test(location.search) ? 'aslt' : 'sensory';
  var expanded = {}; // request id → its Revision documents shown

  function renderList() {
    var cfg = ASLT_SENSORY_TABS[activeTab];
    var query = tableSearch.value, status = filterStatus.value;
    var all = cfg.list();
    var docHits = amendmentMatches(query); // a search on RV- numbers opens their request
    var rows = all.filter(function (r) {
      return (!status || getDocStatus(r).status === status) && (aslRowMatchesQuery([r.id, r.sampel, r.tipe, cfg.jenis(r)], query) || docHits[r.id]);
    });
    rows.sort(newestFirst); // newest document on top
    document.getElementById('colJenis').textContent = cfg.jenisHead;
    document.getElementById('requestListBody').innerHTML = rows.map(function (r) {
      var href = cfg.form + '?docId=' + r.id;
      var open = !!(expanded[r.id] || docHits[r.id]);
      return '<tr>' +
        '<td><a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Open Request"><i class="ri-eye-line"></i></a></td>' +
        '<td><div class="d-flex align-items-center">' + amendmentToggleHtml(r, open) + '<a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></div></td>' +
        '<td>' + r.tanggal + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + (r.tipe || '-') + '</td>' +
        '<td>' + cfg.jenis(r) + '</td>' +
        '<td>' + docStatusBadgesHtml(r) + '</td>' +
        '</tr>' +
        /* Revision documents of this request (accordion) */
        (open ? amendmentChildRowsHtml(r, function (a) {
          return '<td class="text-muted fs-12">' + a.tanggal + '</td>' +
            '<td class="text-muted fs-12">' + amendmentSummary(a) + '</td>' +
            '<td>' + amendmentTypeBadgeHtml(a.type) + '</td>' +
            '<td class="font-monospace text-muted fs-12">' + (a.issuedNo || 'Replaces ' + a.refReportNo) + '</td>' +
            '<td>' + amendmentStatusBadgesHtml(a) + '</td>';
        }) : '');
    }).join('') || '<tr><td colspan="7" class="text-center text-muted p-4">' + (query || status ? 'No matching results.' : 'No requests yet.') + '</td></tr>';

    document.getElementById('countSensory').textContent = getSensoryRequests().length;
    document.getElementById('countAslt').textContent = getAsltRequests().length;
    document.getElementById('listActionButtons').innerHTML =
      '<a href="' + cfg.form + '" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-add-line me-1 align-middle"></i>Create New Request</a>';
  }

  function showTab(tab) {
    activeTab = tab;
    tabsNav.querySelectorAll('.nav-link').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
    tableSearch.value = '';
    renderList();
  }

  tabsNav.addEventListener('click', function (e) {
    var tab = e.target.closest('.nav-link');
    if (!tab) return;
    e.preventDefault();
    showTab(tab.dataset.tab);
  });
  document.getElementById('requestListBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-amend-toggle]');
    if (!btn) return;
    expanded[btn.dataset.amendToggle] = !expanded[btn.dataset.amendToggle];
    renderList();
  });
  tableSearch.addEventListener('input', renderList);
  filterStatus.addEventListener('change', renderList);

  /* Re-render on role switch (mockup role switcher) */
  document.addEventListener('holabsys:rolechange', renderList);

  showTab(activeTab);
});
