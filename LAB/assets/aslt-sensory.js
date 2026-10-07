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
    form: 'sensoryForm.html', jenisHead: 'Jenis Pengujian',
    list: function () { return getSensoryRequests(); },
    jenis: function (r) { return r.jenis || '-'; }
  },
  aslt: {
    form: 'asltForm.html', jenisHead: 'Kategori',
    list: function () { return getAsltRequests(); },
    jenis: function (r) { return r.kategori || '-'; }
  }
};

document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var filterStatus = document.getElementById('filterStatus');
  var tabsNav = document.getElementById('asltSensoryTabs');
  var activeTab = /[?&]tab=aslt\b/.test(location.search) ? 'aslt' : 'sensory';

  function renderList() {
    var cfg = ASLT_SENSORY_TABS[activeTab];
    var query = tableSearch.value, status = filterStatus.value;
    var all = cfg.list();
    var rows = all.filter(function (r) {
      return (!status || getDocStatus(r).status === status) && aslRowMatchesQuery([r.id, r.sampel, r.tipe, cfg.jenis(r)], query);
    });
    document.getElementById('colJenis').textContent = cfg.jenisHead;
    document.getElementById('requestListBody').innerHTML = rows.map(function (r) {
      var href = cfg.form + '?docId=' + r.id;
      return '<tr>' +
        '<td><a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Buka Pengajuan"><i class="ri-eye-line"></i></a></td>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + r.tanggal + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + (r.tipe || '-') + '</td>' +
        '<td>' + cfg.jenis(r) + '</td>' +
        '<td>' + docStatusBadgesHtml(r) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="7" class="text-center text-muted p-4">' + (query || status ? 'Tidak ada hasil yang cocok.' : 'Belum ada pengajuan.') + '</td></tr>';

    document.getElementById('countSensory').textContent = getSensoryRequests().length;
    document.getElementById('countAslt').textContent = getAsltRequests().length;
    document.getElementById('listActionButtons').innerHTML =
      '<a href="' + cfg.form + '" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-add-line me-1 align-middle"></i>Buat Pengajuan Baru</a>';
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
  tableSearch.addEventListener('input', renderList);
  filterStatus.addEventListener('change', renderList);

  /* Re-render on role switch (mockup role switcher) */
  document.addEventListener('holabsys:rolechange', renderList);

  showTab(activeTab);
});
