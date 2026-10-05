/**
 * ASLT & Sensory Management Logic
 * HOLABSYS System
 */

(function () {
  'use strict';

  // Sensory Test Data & ASLT Batch Data — read from the shared, localStorage-backed
  // store (assets/dummy-aslt-sensory-requests.js) so submissions made through
  // asltForm.html / sensoryForm.html show up here after Approve Admin.
  function SENSORY_DATA_LIVE() { return getSensoryRequests(); }
  function ASLT_DATA_LIVE() { return getAsltRequests(); }

  function preOpStatusBadge(item) {
    if (item.step === 'Draft') return '<span class="badge bg-secondary-transparent">Draft</span>';
    if (item.step === 'Approval') return '<span class="badge bg-warning-transparent">Menunggu Approve Admin</span>';
    return null;
  }

  // Observation Matrix Data
  var MATRIX_DATA = [
    { suhu: '25°C (Ambient Ref)', param: 'Kadar Air (% b/b)', h0: '1.42', h7: '1.51', h14: '1.63', h21: '1.74', h28: '1.82', h60: '2.10', h90: '2.35', k: '0.0103 / hari', status: 'done' },
    { suhu: '25°C (Ambient Ref)', param: 'Skor Organoleptik', h0: '8.5', h7: '8.4', h14: '8.2', h21: '8.0', h28: '7.9', h60: '7.5', h90: '7.2', k: '-0.0145 / hari', status: 'done' },
    { suhu: '35°C (Chamber 1)', param: 'Kadar Air (% b/b)', h0: '1.42', h7: '1.68', h14: '1.89', h21: '2.15', h28: '2.38', h60: '2.80', h90: '3.12 (Rej)', k: '0.0195 / hari', status: 'done' },
    { suhu: '35°C (Chamber 1)', param: 'Skor Organoleptik', h0: '8.5', h7: '8.1', h14: '7.8', h21: '7.4', h28: '7.0', h60: '6.4', h90: '5.8 (Rej)', k: '-0.0302 / hari', status: 'done' },
    { suhu: '45°C (Chamber 2)', param: 'Kadar Air (% b/b)', h0: '1.42', h7: '1.92', h14: '2.40', h21: '2.85', h28: '3.18 (Rej)', h60: '3.75', h90: '4.20', k: '0.0412 / hari', status: 'reject' },
    { suhu: '45°C (Chamber 2)', param: 'Skor Organoleptik', h0: '8.5', h7: '7.6', h14: '6.9', h21: '6.1', h28: '5.4 (Rej)', h60: '4.5', h90: '3.8', k: '-0.0610 / hari', status: 'reject' }
  ];

  function renderSensoryTable() {
    var tbody = document.getElementById('sensoryTableBody');
    if (!tbody) return;

    var q = (document.getElementById('searchSensory')?.value || '').toLowerCase().trim();
    var filterJenis = document.getElementById('filterJenisSensory')?.value || '';

    var data = SENSORY_DATA_LIVE();
    var filtered = data.filter(function (item) {
      var matchQ = !q || item.sampel.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      var matchJ = !filterJenis || item.jenis === filterJenis;
      return matchQ && matchJ;
    });

    tbody.innerHTML = filtered.map(function (item) {
      var isPreOp = item.step === 'Draft' || item.step === 'Approval';
      var badges = (item.blindCodes || []).map(function (c) {
        return '<span class="badge bg-dark-transparent font-monospace fs-13 me-1">' + c + '</span>';
      }).join('') || '<span class="text-muted fs-11">–</span>';

      var statusHtml = preOpStatusBadge(item) || (
        '<span class="badge ' + (item.status.includes('Aktif') ? 'bg-primary-transparent text-primary' : 'bg-success-transparent') + '">' + item.status + '</span>'
      );

      var actionsHtml = isPreOp
        ? '<a href="sensoryForm.html?docId=' + item.id + '" class="btn btn-outline-primary" title="Lihat / Approve"><i class="ri-edit-line"></i></a>'
        : '<button type="button" class="btn btn-outline-primary btn-open-booth" data-session="sensory|' + item.id + '" title="Sesi Panelis"><i class="ri-group-line"></i></button>' +
          '<button type="button" class="btn btn-outline-secondary" title="Cetak Rekap Sensori"><i class="ri-printer-line"></i></button>';

      return '<tr>' +
        '<td class="font-monospace fw-semibold text-primary">' + item.id + '</td>' +
        '<td class="font-monospace small">' + item.tanggal + '</td>' +
        '<td><div class="fw-semibold">' + item.jenis + '</div></td>' +
        '<td>' + item.sampel + '</td>' +
        '<td>' + badges + '</td>' +
        '<td><span class="badge bg-light text-dark border">' + item.sesi + '</span></td>' +
        '<td><small class="text-muted">' + item.suhuWadah + '</small></td>' +
        '<td>' + statusHtml + '</td>' +
        '<td class="text-center"><div class="btn-group btn-group-sm">' + actionsHtml + '</div></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="9" class="text-center text-muted p-4">Belum ada pengajuan sensori.</td></tr>';

    var elCount = document.getElementById('badgeCountSensory');
    if (elCount) elCount.textContent = data.length;
  }

  function showToast(message) {
    var container = document.getElementById('appToastContainer');
    if (!container || !window.bootstrap) { alert(message); return; }
    var el = document.createElement('div');
    el.className = 'toast align-items-center text-white bg-dark border-0';
    el.setAttribute('role', 'alert');
    el.innerHTML = '<div class="d-flex"><div class="toast-body">' + message + '</div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
    container.appendChild(el);
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
    new window.bootstrap.Toast(el, { delay: 3500 }).show();
  }

  /* ---------- Sesi Panelis: sessions from Schedule, submissions from the PANELIS booth ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var openPanelRows = {};

  function fmtSlot(s) {
    return new Date(s.start).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) +
      '<div class="fs-11 text-muted">' + s.start.slice(11, 16) + ' – ' + s.end.slice(11, 16) + '</div>';
  }

  function panelDetailHtml(s, entries) {
    var byNik = {};
    entries.forEach(function (e) { byNik[e.nik] = e; });
    return '<div class="p-2"><table class="table table-sm table-bordered mb-0 bg-white">' +
      '<thead><tr><th>NIK</th><th>Nama Panelis</th><th>Sumber</th><th>Booth</th><th>Waktu Kirim</th><th>Status</th></tr></thead><tbody>' +
      s.panelists.map(function (p) {
        var e = byNik[p.nik];
        return '<tr><td class="font-monospace">' + esc(p.nik) + '</td>' +
          '<td>' + esc(p.name) + (p.ket ? '<div class="fs-11 text-muted">' + esc(p.ket) + '</div>' : '') + '</td>' +
          '<td><span class="badge ' + (p.source === 'HRIS' ? 'bg-primary-transparent' : 'bg-warning-transparent') + '">' + esc(p.source) + '</span></td>' +
          '<td>' + (e && e.booth ? '#' + String(e.booth).padStart(2, '0') : '-') + '</td>' +
          '<td class="fs-12">' + (e ? String(e.at).replace('T', ' ').slice(0, 16) : '-') + '</td>' +
          '<td>' + (e ? '<span class="badge bg-success-transparent"><i class="ri-check-line me-1"></i>Sudah menilai</span>'
            : (s.status === 'Selesai' ? '<span class="badge bg-danger-transparent">Tidak hadir</span>' : '<span class="badge bg-light text-muted">Belum</span>')) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function renderPanelSessions() {
    var tbody = document.getElementById('panelSessionBody');
    if (!tbody) return;
    var q = (document.getElementById('searchPanel')?.value || '').toLowerCase().trim();
    var st = document.getElementById('filterPanelStatus')?.value || '';
    var order = { Berlangsung: 0, Terjadwal: 1, Selesai: 2 };
    var list = panelSessions().filter(function (s) {
      var hay = [s.id, s.trx.id, s.trx.title].concat(s.panelists.map(function (p) { return p.name + ' ' + p.nik; })).join(' ').toLowerCase();
      return (!q || hay.indexOf(q) !== -1) && (!st || s.status === st);
    }).sort(function (a, b) { return order[a.status] - order[b.status] || (a.start < b.start ? -1 : 1); });

    tbody.innerHTML = list.map(function (s) {
      var entries = panelScoresForSession(s.id);
      var done = s.panelists.filter(function (p) { return entries.some(function (e) { return e.nik === p.nik; }); }).length;
      var nonHris = s.panelists.filter(function (p) { return p.source !== 'HRIS'; }).length;
      var pct = s.panelists.length ? Math.round(done / s.panelists.length * 100) : 0;
      var isOpen = !!openPanelRows[s.id];
      return '<tr>' +
        '<td><button type="button" class="btn btn-icon btn-sm btn-light btn-panel-detail" data-id="' + s.id + '" title="Lihat panelis"><i class="' + (isOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line') + '"></i></button></td>' +
        '<td><div class="fw-semibold">Sesi ' + s.sesiNo + '</div><div class="fs-11 text-muted font-monospace">' + s.id + '</div></td>' +
        '<td><span class="badge ' + (s.trx.source === 'aslt' ? 'bg-success-transparent' : 'bg-primary-transparent') + ' me-1">' + (s.trx.source === 'aslt' ? 'ASLT' : 'Sensory') + '</span>' +
          '<span class="font-monospace fw-semibold">' + s.trx.id + '</span><div class="fs-12 text-muted">' + esc(s.trx.title) + '</div></td>' +
        '<td>' + fmtSlot(s) + '</td>' +
        '<td>' + s.trx.tests.map(function (t) { return '<span class="badge bg-light text-dark border me-1">' + esc(t.label) + '</span>'; }).join('') +
          '<div class="fs-11 text-muted mt-1">Kode: <span class="font-monospace">' + s.trx.codes.join(' · ') + '</span></div></td>' +
        '<td><span class="fw-semibold">' + s.panelists.length + '</span> orang' + (nonHris ? '<div class="fs-11 text-muted">' + nonHris + ' non-HRIS</div>' : '') + '</td>' +
        '<td style="min-width: 140px"><div class="d-flex justify-content-between fs-12 mb-1"><span>' + done + ' / ' + s.panelists.length + '</span><span class="text-muted">' + pct + '%</span></div>' +
          '<div class="progress progress-xs"><div class="progress-bar' + (pct === 100 ? ' bg-success' : '') + '" style="width:' + pct + '%"></div></div></td>' +
        '<td><span class="badge ' + PANEL_STATUS_BADGE[s.status] + '">' + s.status + '</span></td>' +
        '</tr>' +
        (isOpen ? '<tr class="bg-light"><td></td><td colspan="7">' + panelDetailHtml(s, entries) + '</td></tr>' : '');
    }).join('') || '<tr><td colspan="8" class="text-center text-muted p-4">Belum ada sesi panel. Daftarkan panelis pada sesi Sensory / ASLT di Schedule.</td></tr>';
  }

  function renderAsltTable() {
    var tbody = document.getElementById('asltTableBody');
    if (!tbody) return;

    var q = (document.getElementById('searchAslt')?.value || '').toLowerCase().trim();
    var filterKat = document.getElementById('filterKategoriAslt')?.value || '';

    var data = ASLT_DATA_LIVE();
    var filtered = data.filter(function (item) {
      var matchQ = !q || item.sampel.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      var matchK = !filterKat || item.kategori === filterKat;
      return matchQ && matchK;
    });

    tbody.innerHTML = filtered.map(function (item) {
      var isPreOp = item.step === 'Draft' || item.step === 'Approval';
      var statusHtml = preOpStatusBadge(item) || (
        '<span class="badge ' + (item.status === 'In Chamber' ? 'bg-success-transparent' : (item.status.includes('Initial') ? 'bg-info-transparent' : 'bg-warning-transparent')) + '">' + item.status + '</span>'
      );

      var actionsHtml = isPreOp
        ? '<a href="asltForm.html?docId=' + item.id + '" class="btn btn-outline-success" title="Lihat / Approve"><i class="ri-edit-line"></i></a>'
        : '<button type="button" class="btn btn-outline-success btn-view-matrix" data-id="' + item.id + '" title="Buka Matriks Suhu x Waktu"><i class="ri-table-line"></i></button>' +
          '<button type="button" class="btn btn-outline-primary btn-open-booth" data-session="aslt|' + item.id + '" title="Sesi Panelis (Organoleptik)"><i class="ri-group-line"></i></button>' +
          '<button type="button" class="btn btn-outline-secondary" title="Detail Pengajuan"><i class="ri-file-list-line"></i></button>';

      return '<tr>' +
        '<td class="font-monospace fw-semibold text-success">' + item.id + '</td>' +
        '<td><div class="fw-semibold">' + item.sampel + '</div><span class="badge bg-light text-muted border font-monospace">' + item.kategori + '</span></td>' +
        '<td><span class="small text-dark">' + item.suhuChamber + '</span></td>' +
        '<td><small class="text-muted">' + item.kemasan + '</small></td>' +
        '<td><small class="fw-semibold">' + item.param + '</small></td>' +
        '<td><span class="badge bg-light text-dark border">' + item.timepoint + '</span></td>' +
        '<td><small class="text-danger font-monospace">' + item.rejection + '</small></td>' +
        '<td>' + statusHtml + '</td>' +
        '<td class="text-center"><div class="btn-group btn-group-sm">' + actionsHtml + '</div></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="9" class="text-center text-muted p-4">Belum ada pengajuan ASLT.</td></tr>';

    var elCount = document.getElementById('badgeCountAslt');
    if (elCount) elCount.textContent = data.length;
  }

  function renderMatrixTable() {
    var tbody = document.getElementById('matrixTableBody');
    if (!tbody) return;

    tbody.innerHTML = MATRIX_DATA.map(function (row) {
      function formatCell(val) {
        if (!val) return '<td class="text-muted">-</td>';
        if (val.includes('Rej')) return '<td class="bg-danger-transparent fw-bold">' + val + '</td>';
        return '<td class="font-monospace">' + val + '</td>';
      }

      return '<tr>' +
        '<td class="fw-semibold bg-light">' + row.suhu + '</td>' +
        '<td class="text-start">' + row.param + '</td>' +
        formatCell(row.h0) +
        formatCell(row.h7) +
        formatCell(row.h14) +
        formatCell(row.h21) +
        formatCell(row.h28) +
        formatCell(row.h60) +
        formatCell(row.h90) +
        '<td class="font-monospace fw-semibold text-primary">' + row.k + '</td>' +
        '</tr>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderSensoryTable();
    renderAsltTable();
    renderMatrixTable();

    document.getElementById('searchSensory')?.addEventListener('input', renderSensoryTable);
    document.getElementById('filterJenisSensory')?.addEventListener('change', renderSensoryTable);
    document.getElementById('searchAslt')?.addEventListener('input', renderAsltTable);
    document.getElementById('filterKategoriAslt')?.addEventListener('change', renderAsltTable);

    // Switch to the Sesi Panelis tab from a table row, filtered to that transaction
    document.addEventListener('click', function (e) {
      var boothBtn = e.target.closest('.btn-open-booth');
      if (boothBtn) {
        var search = document.getElementById('searchPanel');
        if (search) search.value = boothBtn.getAttribute('data-session').split('|')[1];
        renderPanelSessions();
        var triggerTab = document.getElementById('tab-booth-btn');
        if (triggerTab && window.bootstrap) {
          var tab = new window.bootstrap.Tab(triggerTab);
          tab.show();
        }
      }

      var detailBtn = e.target.closest('.btn-panel-detail');
      if (detailBtn) {
        var id = detailBtn.getAttribute('data-id');
        openPanelRows[id] = !openPanelRows[id];
        renderPanelSessions();
      }

      var matrixBtn = e.target.closest('.btn-view-matrix');
      if (matrixBtn) {
        var triggerTab = document.getElementById('tab-matrix-btn');
        if (triggerTab && window.bootstrap) {
          var tab = new window.bootstrap.Tab(triggerTab);
          tab.show();
        }
      }
    });

    /* ---------- Sesi Panelis ---------- */
    renderPanelSessions();
    document.getElementById('searchPanel')?.addEventListener('input', renderPanelSessions);
    document.getElementById('filterPanelStatus')?.addEventListener('change', renderPanelSessions);

    /* Booth submissions / schedule edits from another tab show up live; status follows the clock */
    window.addEventListener('storage', function (e) {
      if (e.key === PANEL_SCORES_KEY || e.key === SCHEDULE_STORAGE_KEY) renderPanelSessions();
    });
    setInterval(renderPanelSessions, 60000);

    document.getElementById('btnExportMatrix')?.addEventListener('click', function () {
      alert('Matriks Pengamatan & Kurva Arrhenius (ln k vs 1/T) berhasil diekspor dalam format spreadsheet XLS!');
    });
  });
})();
