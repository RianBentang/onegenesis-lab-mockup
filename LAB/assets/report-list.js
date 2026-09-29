function reportRowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

function showToast(message) {
  var container = document.getElementById('appToastContainer');
  if (!container) { alert(message); return; }
  var toastEl = document.createElement('div');
  toastEl.className = 'toast align-items-center text-white bg-dark border-0 shadow';
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = '<div class="d-flex"><div class="toast-body">' + message + '</div>' +
    '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
  container.appendChild(toastEl);
  if (window.bootstrap && window.bootstrap.Toast) {
    var toast = new window.bootstrap.Toast(toastEl, { delay: 3500 });
    toastEl.addEventListener('hidden.bs.toast', function () { toastEl.remove(); });
    toast.show();
  } else {
    setTimeout(function () { toastEl.remove(); }, 3500);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  function loadData() {
    var pushDataRows = getRequests().filter(function (r) { return r.step === 'Selesai'; });

    var draftReportRows = getRequests()
      .filter(function (r) { return r.step === 'Draft Report'; })
      .map(function (r) { return Object.assign({}, r, { jenis: 'Internal' }); })
      .concat(
        getExternalRequests()
          .filter(function (r) { return r.step === 'Order Confirmation'; })
          .map(function (r) { return Object.assign({}, r, { jenis: 'External' }); })
      );

    return { pushDataRows: pushDataRows, draftReportRows: draftReportRows };
  }

  function renderPushDataList(query) {
    var rows = loadData().pushDataRows.filter(function (r) { return reportRowMatchesQuery([r.id, r.sampel, r.lab], query); });
    document.getElementById('countPushData').textContent = rows.length;
    document.getElementById('pushDataListBody').innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td class="text-primary fw-medium font-monospace">' + r.id + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + r.lab + '</td>' +
        '<td>' + r.tanggal + '</td>' +
        '<td class="text-end"><button type="button" class="btn btn-sm btn-primary btn-wave" data-push-id="' + r.id + '"><i class="ri-upload-2-line"></i> Push</button></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="5" class="text-center text-muted p-4">' + (query ? 'Tidak ada hasil yang cocok.' : 'Belum ada dokumen siap Push Data.') + '</td></tr>';

    document.querySelectorAll('[data-push-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.pushId;
        updateRequest(id, { step: 'Draft Report' });
        showToast('Data untuk "' + id + '" telah di-push. Dokumen diteruskan ke Draft & Final Report.');
        renderPushDataList(document.getElementById('tableSearch').value);
        renderDraftReportList('');
        document.getElementById('countDraftReport').textContent = loadData().draftReportRows.length;
      });
    });
  }

  function renderDraftReportList(query) {
    var rows = loadData().draftReportRows.filter(function (r) { return reportRowMatchesQuery([r.id, r.sampel, r.reportNo], query); });
    document.getElementById('countDraftReport').textContent = rows.length;
    document.getElementById('draftReportListBody').innerHTML = rows.map(function (r) {
      var jenisBadge = r.jenis === 'Internal'
        ? '<span class="badge bg-primary-transparent">Internal</span>'
        : '<span class="badge bg-info-transparent">External</span>';
      var statusBadge = r.reportStatus === 'Final'
        ? '<span class="badge bg-success-transparent">Final</span>'
        : '<span class="badge bg-warning-transparent">Draft</span>';
      return '<tr>' +
        '<td><a href="reportForm.html?docId=' + r.id + '&jenis=' + r.jenis.toLowerCase() + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Buka Laporan"><i class="ri-file-text-line"></i></a></td>' +
        '<td><a href="reportForm.html?docId=' + r.id + '&jenis=' + r.jenis.toLowerCase() + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + jenisBadge + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td class="font-monospace">' + (r.reportNo || 'Belum Terbit') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="6" class="text-center text-muted p-4">' + (query ? 'Tidak ada hasil yang cocok.' : 'Belum ada dokumen siap laporan.') + '</td></tr>';
  }

  renderPushDataList('');
  renderDraftReportList('');

  var RENDER_BY_TAB = { pushdata: renderPushDataList, draftreport: renderDraftReportList };
  var SEARCH_PLACEHOLDER = {
    pushdata: 'Cari No. Pengajuan, sampel, lab...',
    draftreport: 'Cari No. Pengajuan, sampel, No. LHU/COA...'
  };
  var activeTabId = 'pushdata';
  var tableSearch = document.getElementById('tableSearch');
  tableSearch.addEventListener('input', function (e) { RENDER_BY_TAB[activeTabId](e.target.value); });

  var tabsNav = document.querySelector('.nav-tabs[data-tabgroup]');
  var listTitle = document.getElementById('listTitle');
  if (tabsNav) {
    tabsNav.addEventListener('click', function (e) {
      var tab = e.target.closest('.nav-link');
      if (!tab || !tabsNav.contains(tab)) return;
      e.preventDefault();
      tabsNav.querySelectorAll('.nav-link').forEach(function (t) { t.classList.toggle('active', t === tab); });
      document.querySelectorAll('[data-pane]').forEach(function (pane) {
        pane.classList.toggle('d-none', pane.dataset.pane !== tab.dataset.tab);
      });
      if (listTitle) listTitle.textContent = tab.textContent.trim().replace(/s*d+$/, '');
      activeTabId = tab.dataset.tab;
      tableSearch.value = '';
      tableSearch.placeholder = SEARCH_PLACEHOLDER[activeTabId];
      RENDER_BY_TAB[activeTabId]('');
    });
  }

  tableSearch.placeholder = SEARCH_PLACEHOLDER[activeTabId];
});
