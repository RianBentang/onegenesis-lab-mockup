function rowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

document.addEventListener('DOMContentLoaded', function () {
  var requests = getRequests();

  /* Request List shows every document with its doc status; Review & SPK shows the Kaji Ulang
     queue plus documents whose SPK is issued but whose sample label isn't handed over yet */
  var requestRows = requests;
  var reviewRows = requests.filter(function (r) { return r.step === 'Review & SPK' || r.step === 'Labeling'; });

  document.getElementById('countRequest').textContent = requestRows.length;
  document.getElementById('countReview').textContent = reviewRows.length;

  function renderRequestList(query) {
    var rows = requestRows.filter(function (r) { return rowMatchesQuery([r.id, r.sampel, r.tipe, r.tujuan], query); });
    document.getElementById('requestListBody').innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td><a href="internalForm.html?docId=' + r.id + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Lihat / Edit"><i class="ri-edit-line"></i></a></td>' +
        '<td><a href="internalForm.html?docId=' + r.id + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + r.tanggal + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + r.tipe + '</td>' +
        '<td>' + r.tujuan + '</td>' +
        '<td>' + docStatusBadgesHtml(r) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="7" class="text-center text-muted p-4">' + (query ? 'Tidak ada hasil yang cocok.' : 'Belum ada pengajuan.') + '</td></tr>';
  }

  function renderReviewList(query) {
    var rows = reviewRows.filter(function (r) { return rowMatchesQuery([r.id, r.sampel, r.tipe, r.tujuan, r.departemen], query); });
    document.getElementById('reviewListBody').innerHTML = rows.map(function (r) {
      return '<tr>' +
        '<td><a href="reviewAndSpkForm.html?docId=' + r.id + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Kaji Ulang &amp; Terbit SPK"><i class="ri-file-check-line"></i></a></td>' +
        '<td><a href="reviewAndSpkForm.html?docId=' + r.id + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + r.tipe + '</td>' +
        '<td>' + r.tujuan + '</td>' +
        '<td>' + r.departemen + '</td>' +
        '<td>' + docStatusBadgesHtml(r) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="7" class="text-center text-muted p-4">' + (query ? 'Tidak ada hasil yang cocok.' : 'Belum ada dokumen menunggu kaji ulang.') + '</td></tr>';
  }


  renderRequestList('');
  renderReviewList('');

  /* ---------- Single search box, aligned with the tabs row, dispatches to the active tab ---------- */
  var RENDER_BY_TAB = {
    request: renderRequestList,
    review: renderReviewList
  };
  var SEARCH_PLACEHOLDER = {
    request: 'Cari No. Pengajuan, sampel, tipe...',
    review: 'Cari No. Pengajuan, sampel, departemen...'
  };
  var activeTabId = 'request';
  var tableSearch = document.getElementById('tableSearch');
  tableSearch.addEventListener('input', function (e) {
    RENDER_BY_TAB[activeTabId](e.target.value);
  });

  /* Header action button — changes with the active tab; Review "create" only for ADM */
  var listActionButtons = document.getElementById('listActionButtons');

  function renderListActionButtons(tabId) {
    var role = findRole(localStorage.getItem('holabsysRole'));
    if (tabId === 'request') {
      listActionButtons.innerHTML = '<a href="internalForm.html" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-add-line me-1 align-middle"></i>Buat Pengajuan Baru</a>';
    } else if (tabId === 'review' && role.code === 'ADM') {
      listActionButtons.innerHTML = '<button type="button" data-action="pick-review" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-add-line me-1 align-middle"></i>Buat Review Baru</button>';
    } else {
      listActionButtons.innerHTML = '';
    }
  }

  /* ---------- Pick-a-document modal (Buat Review Baru) ---------- */
  var pickDocModalEl = document.getElementById('pickDocModal');
  var pickDocModal = (window.bootstrap && pickDocModalEl) ? new window.bootstrap.Modal(pickDocModalEl) : null;
  var pickDocSelect = document.getElementById('pickDocSelect');
  var pickDocError = document.getElementById('pickDocError');
  var pickDocModalTitle = document.getElementById('pickDocModalTitle');
  var pickDocTarget = null; // 'reviewAndSpkForm.html'

  function openPickDocModal(target, title) {
    pickDocTarget = target;
    pickDocModalTitle.textContent = title;
    pickDocError.style.display = 'none';

    pickDocSelect.innerHTML = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Pilih No. ID Pengajuan --';
    pickDocSelect.appendChild(placeholder);
    getRequests().forEach(function (r) {
      var opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.id + ' — ' + r.sampel;
      pickDocSelect.appendChild(opt);
    });

    if (window.jQuery && window.jQuery.fn.select2) {
      if (window.jQuery(pickDocSelect).data('select2')) window.jQuery(pickDocSelect).select2('destroy');
      window.jQuery(pickDocSelect).select2({ width: '100%', dropdownParent: window.jQuery(pickDocModalEl) });
    }

    if (pickDocModal) pickDocModal.show();
  }

  listActionButtons.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'pick-review') openPickDocModal('reviewAndSpkForm.html', 'Buat Review Baru — Pilih No. ID Pengajuan');
  });

  var pickDocConfirm = document.getElementById('pickDocConfirm');
  if (pickDocConfirm) {
    pickDocConfirm.addEventListener('click', function () {
      var docId = pickDocSelect.value;
      if (!docId) {
        pickDocError.style.display = 'block';
        return;
      }
      window.location.href = pickDocTarget + '?docId=' + docId;
    });
  }

  /* Tab switching — event delegation on the container so it's robust to re-renders / stray overlays */
  var tabsNav = document.getElementById('internalTabs');
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
      listTitle.textContent = tab.textContent.trim().replace(/\s*\d+$/, '');
      activeTabId = tab.dataset.tab;
      tableSearch.value = '';
      tableSearch.placeholder = SEARCH_PLACEHOLDER[activeTabId];
      RENDER_BY_TAB[activeTabId]('');
      renderListActionButtons(activeTabId);
    });
  }

  tableSearch.placeholder = SEARCH_PLACEHOLDER[activeTabId];
  renderListActionButtons(activeTabId);
  document.addEventListener('holabsys:rolechange', function () { renderListActionButtons(activeTabId); });
});
