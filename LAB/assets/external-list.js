/* ---------- Approval chain (duplicated — kept local, no cross-page coupling) ---------- */
function extIsMdOrP5(tujuan) {
  return tujuan === 'Pendaftaran MD (BPOM)' || tujuan === 'Pengujian P5';
}

function getExternalApprovalChain(tipe, tujuan) {
  var mdP5 = extIsMdOrP5(tujuan);
  if (tipe === 'Urgent') {
    return mdP5 ? ['MGU', 'HOL', 'HOR', 'FRA', 'ADM'] : ['MGU', 'HOL', 'HOR', 'ADM'];
  }
  return mdP5 ? ['FRA', 'HOL', 'ADM'] : ['HOL', 'ADM'];
}

function externalStatusLabel(r) {
  if (r.step === 'Draft') return '<span class="badge bg-secondary-transparent">Draft</span>';
  var chain = getExternalApprovalChain(r.tipe, r.tujuan);
  var pendingRole = chain[r.approvalIdx] || chain[chain.length - 1];
  var role = (typeof findRole === 'function') ? findRole(pendingRole) : { label: pendingRole };
  return '<span class="badge bg-warning-transparent">Menunggu ' + role.label + '</span>';
}

function extRowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

document.addEventListener('DOMContentLoaded', function () {
  var requests = getExternalRequests();

  var requestRows = requests.filter(function (r) { return r.step === 'Draft' || r.step === 'Approval'; });
  var shipmentRows = requests.filter(function (r) { return r.step === 'Pengiriman Sampel'; });
  var orderConfRows = requests.filter(function (r) { return r.step === 'Order Confirmation'; });

  document.getElementById('countRequest').textContent = requestRows.length;
  document.getElementById('countShipment').textContent = shipmentRows.length;
  document.getElementById('countOrderConf').textContent = orderConfRows.length;

  function renderRequestList(query) {
    var rows = requestRows.filter(function (r) { return extRowMatchesQuery([r.id, r.sampel, r.tipe, r.tujuan], query); });
    document.getElementById('requestListBody').innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td><a href="externalForm.html?docId=' + r.id + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Lihat / Edit"><i class="ri-edit-line"></i></a></td>' +
        '<td><a href="externalForm.html?docId=' + r.id + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + r.tanggal + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + r.tipe + '</td>' +
        '<td>' + r.tujuan + '</td>' +
        '<td>' + externalStatusLabel(r) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="7" class="text-center text-muted p-4">' + (query ? 'Tidak ada hasil yang cocok.' : 'Belum ada pengajuan.') + '</td></tr>';
  }

  /* Pengiriman Sampel & Order Confirmation — read-only tables, no linked form yet */
  function renderReadOnlyList(bodyId, rows, query, emptyMsg) {
    var filtered = rows.filter(function (r) { return extRowMatchesQuery([r.id, r.sampel, r.lab], query); });
    document.getElementById(bodyId).innerHTML = filtered.map(function (r) {
      return '<tr>' +
        '<td class="text-primary fw-medium font-monospace">' + r.id + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + r.lab + '</td>' +
        '<td>' + r.tanggal + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="4" class="text-center text-muted p-4">' + (query ? 'Tidak ada hasil yang cocok.' : emptyMsg) + '</td></tr>';
  }

  function renderShipmentList(query) { renderReadOnlyList('shipmentListBody', shipmentRows, query, 'Belum ada dokumen menunggu pengiriman sampel.'); }
  function renderOrderConfList(query) { renderReadOnlyList('orderConfListBody', orderConfRows, query, 'Belum ada dokumen menunggu order confirmation.'); }

  renderRequestList('');
  renderShipmentList('');
  renderOrderConfList('');

  /* ---------- Single search box, aligned with the tabs row, dispatches to the active tab ---------- */
  var RENDER_BY_TAB = {
    request: renderRequestList,
    shipment: renderShipmentList,
    orderconf: renderOrderConfList
  };
  var SEARCH_PLACEHOLDER = {
    request: 'Cari No. Pengajuan, sampel, tipe...',
    shipment: 'Cari No. Pengajuan, sampel, lab...',
    orderconf: 'Cari No. Pengajuan, sampel, lab...'
  };
  var activeTabId = 'request';
  var tableSearch = document.getElementById('tableSearch');
  tableSearch.addEventListener('input', function (e) {
    RENDER_BY_TAB[activeTabId](e.target.value);
  });

  /* Header action button — only Request List gets "Buat Pengajuan Baru" */
  var listActionButtons = document.getElementById('listActionButtons');
  function renderListActionButtons(tabId) {
    if (tabId === 'request') {
      listActionButtons.innerHTML = '<a href="externalForm.html" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-add-line"></i> Buat Pengajuan Baru</a>';
    } else {
      listActionButtons.innerHTML = '';
    }
  }

  /* Tab switching — event delegation on the container so it's robust to re-renders / stray overlays */
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
      renderListActionButtons(activeTabId);
    });
  }

  tableSearch.placeholder = SEARCH_PLACEHOLDER[activeTabId];
  renderListActionButtons(activeTabId);
});
