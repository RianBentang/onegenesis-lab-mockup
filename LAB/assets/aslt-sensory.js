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
        : '<button type="button" class="btn btn-outline-primary btn-open-booth" data-session="sensory|' + item.id + '" title="Data Panelis & Statistik"><i class="ri-group-line"></i></button>' +
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

  /* ---------- Data Panelis & Statistik (scores from the PANELIS booth app) ---------- */
  function fillPanelSessions(preferKey) {
    var sel = document.getElementById('panelSessionSelect');
    if (!sel) return;
    var prev = preferKey || sel.value;
    var sessions = panelAllSessions();
    function opts(src) {
      return sessions.filter(function (s) { return s.source === src; }).map(function (s) {
        return '<option value="' + src + '|' + s.id + '">' + s.id + ' — ' + s.title + (s.open ? ' · Sesi dibuka' : '') + '</option>';
      }).join('');
    }
    sel.innerHTML = '<optgroup label="Sensory">' + opts('sensory') + '</optgroup><optgroup label="ASLT (Organoleptik)">' + opts('aslt') + '</optgroup>';
    if (prev && sel.querySelector('option[value="' + prev + '"]')) sel.value = prev;
  }

  function currentPanelSession() {
    var sel = document.getElementById('panelSessionSelect');
    if (!sel || !sel.value) return null;
    var parts = sel.value.split('|');
    var record = parts[0] === 'aslt' ? getAsltRequestById(parts[1]) : getSensoryRequestById(parts[1]);
    return panelSessionFor(parts[0], record);
  }

  function statCard(title, body) {
    return '<div class="card custom-card border shadow-none mb-3">' +
      '<div class="card-header"><div class="card-title fs-14">' + title + '</div></div>' +
      '<div class="card-body p-0"><div class="table-responsive">' + body + '</div></div></div>';
  }

  function renderPanel() {
    var host = document.getElementById('panelContent');
    if (!host) return;
    var s = currentPanelSession();
    var toggle = document.getElementById('btnPanelToggle');
    var reportBtn = document.getElementById('btnPanelReport');
    var statusEl = document.getElementById('panelSessionStatus');
    if (!s) {
      host.innerHTML = '<div class="text-center text-muted p-4">Belum ada pengajuan Sensory / ASLT yang berjalan.</div>';
      if (toggle) toggle.disabled = true;
      if (reportBtn) reportBtn.disabled = true;
      return;
    }

    var entries = panelScoresFor(s.id);
    var stats = panelStatsFor(s);
    var rec = s.record;

    toggle.disabled = false;
    toggle.className = 'btn btn-sm btn-wave ' + (s.open ? 'btn-danger-light' : 'btn-success');
    toggle.innerHTML = s.open ? '<i class="ri-stop-circle-line me-1 align-middle"></i>Tutup Sesi Panel' : '<i class="ri-play-circle-line me-1 align-middle"></i>Buka Sesi Panel';
    reportBtn.disabled = !entries.length;
    statusEl.innerHTML =
      '<span class="badge ' + (s.open ? 'bg-success-transparent' : 'bg-secondary-transparent') + ' me-1">' + (s.open ? 'Sesi dibuka' : 'Sesi ditutup') + '</span>' +
      '<span class="badge bg-primary-transparent me-1">' + entries.length + ' / ' + MASTER_PANELIS.length + ' panelis</span>' +
      (rec.panelStats ? '<span class="badge bg-info-transparent">Statistik di Report (' + (rec.reportStatus || 'Draft') + ')</span>' : '');

    var codes = s.codes.length
      ? s.codes.map(function (c) {
          return '<span class="badge bg-dark-transparent font-monospace fs-13 me-1">' + c + (c === s.oddCode ? ' <i class="ri-star-fill text-warning" title="Sampel berbeda (triangle)"></i>' : '') + '</span>';
        }).join('')
      : '<span class="text-muted fs-12">Kode dibuat saat sesi dibuka</span>';
    var html = '<div class="d-flex flex-wrap align-items-center gap-3 mb-3 fs-13">' +
      '<div><span class="text-muted">Kode sampel:</span> ' + codes + '</div>' +
      '<div><span class="text-muted">Parameter:</span> ' + s.tests.map(function (t) { return '<span class="badge bg-primary-transparent me-1">' + t.label + '</span>'; }).join('') + '</div>' +
      '</div>';

    if (!entries.length) {
      host.innerHTML = html + '<div class="text-center text-muted border rounded p-4">' +
        (s.open ? 'Sesi dibuka. Menunggu panelis mengisi penilaian di booth.' : 'Buka sesi panel agar panelis bisa menilai di booth.') + '</div>';
      return;
    }

    /* Statistics per parameter */
    stats.forEach(function (t) {
      if (t.type === 'rating') {
        html += statCard('Statistik — ' + t.label + ' <span class="text-muted fw-normal fs-12">(skala hedonik 1–9, standar min. ' + panelFmt(PANEL_SPEC_MIN, 1) + ')</span>',
          '<table class="table table-hover text-nowrap mb-0"><thead><tr><th>Kode</th><th>Atribut</th><th class="text-end">n</th><th class="text-end">Rata-rata</th><th class="text-end">SD</th><th class="text-end">Min</th><th class="text-end">Max</th><th>Status</th></tr></thead><tbody>' +
          t.rows.map(function (r) {
            return '<tr><td class="font-monospace fw-semibold">' + r.code + '</td><td>' + r.atribut + '</td><td class="text-end">' + r.n + '</td>' +
              '<td class="text-end fw-semibold">' + panelFmt(r.mean) + '</td><td class="text-end">' + panelFmt(r.sd) + '</td><td class="text-end">' + panelFmt(r.min, 0) + '</td><td class="text-end">' + panelFmt(r.max, 0) + '</td>' +
              '<td>' + (r.pass ? '<span class="badge bg-success-transparent">Memenuhi</span>' : '<span class="badge bg-danger-transparent">Di bawah standar</span>') + '</td></tr>';
          }).join('') + '</tbody></table>');
        if (t.jar.length) {
          html += statCard('Ketepatan (Just About Right) — ' + t.label,
            '<table class="table table-hover text-nowrap mb-0"><thead><tr><th>Kode</th><th>Ketepatan</th><th class="text-end">n</th><th class="text-end">Kurang</th><th class="text-end">Pas</th><th class="text-end">Terlalu</th></tr></thead><tbody>' +
            t.jar.map(function (j) {
              return '<tr><td class="font-monospace fw-semibold">' + j.code + '</td><td>' + j.ketepatan + '</td><td class="text-end">' + j.n + '</td>' +
                '<td class="text-end">' + panelFmt(j.kurang, 0) + '%</td><td class="text-end fw-semibold">' + panelFmt(j.pas, 0) + '%</td><td class="text-end">' + panelFmt(j.terlalu, 0) + '%</td></tr>';
            }).join('') + '</tbody></table>');
        }
      } else if (t.type === 'triangle') {
        var tr = t.triangle;
        html += statCard('Statistik — ' + t.label,
          '<table class="table mb-0"><tbody>' +
          '<tr><td class="text-muted">Panelis</td><td class="fw-semibold">' + tr.n + '</td></tr>' +
          '<tr><td class="text-muted">Jawaban benar (kode ' + tr.oddCode + ')</td><td class="fw-semibold">' + tr.correct + '</td></tr>' +
          '<tr><td class="text-muted">Minimal benar agar beda nyata (α 0,05)</td><td class="fw-semibold">' + tr.critical + '</td></tr>' +
          '<tr><td class="text-muted">Kesimpulan</td><td>' + (tr.significant ? '<span class="badge bg-warning-transparent">Beda nyata</span>' : '<span class="badge bg-success-transparent">Tidak beda nyata</span>') + '</td></tr>' +
          '</tbody></table>');
      } else if (t.type === 'ranking') {
        html += statCard('Statistik — ' + t.label + ' <span class="text-muted fw-normal fs-12">(jumlah rank terkecil = paling disukai)</span>',
          '<table class="table table-hover text-nowrap mb-0"><thead><tr><th>Atribut</th><th>Urutan</th><th>Kode</th><th class="text-end">n</th><th class="text-end">Jumlah Rank</th><th class="text-end">Rata-rata Rank</th></tr></thead><tbody>' +
          t.ranking.map(function (rk) {
            return rk.codes.map(function (c, i) {
              return '<tr><td>' + (i === 0 ? rk.atribut : '') + '</td><td>' + (i + 1) + '</td><td class="font-monospace fw-semibold">' + c.code + '</td><td class="text-end">' + c.n + '</td><td class="text-end fw-semibold">' + c.sum + '</td><td class="text-end">' + panelFmt(c.mean) + '</td></tr>';
            }).join('');
          }).join('') + '</tbody></table>');
      }
    });

    /* Raw panelist data */
    var heads = [];
    s.tests.forEach(function (t) {
      if (t.type === 'rating') s.codes.forEach(function (c) { heads.push({ t: t, code: c, label: t.label + ' · ' + c + '<div class="fs-11 text-muted fw-normal">' + t.atribut.join(' / ') + '</div>' }); });
      else heads.push({ t: t, label: t.label });
    });
    html += statCard('Data Panelis <span class="text-muted fw-normal fs-12">(' + entries.length + ' panelis sudah menilai)</span>',
      '<table class="table table-hover text-nowrap mb-0"><thead><tr><th>Panelis</th><th>Booth</th><th>Waktu</th>' +
      heads.map(function (h) { return '<th>' + h.label + '</th>'; }).join('') + '</tr></thead><tbody>' +
      entries.map(function (e) {
        var p = panelFindPanelis(e.panelistId) || { name: e.panelistId, tipe: '' };
        return '<tr><td><div class="fw-semibold">' + p.name + '</div><div class="fs-11 text-muted">' + e.panelistId + ' · ' + p.tipe + '</div></td>' +
          '<td>' + (e.booth ? '#' + String(e.booth).padStart(2, '0') : '-') + '</td>' +
          '<td class="fs-12">' + String(e.at).replace('T', ' ').slice(0, 16) + '</td>' +
          heads.map(function (h) {
            var a = e.answers[h.t.param] || {};
            if (h.t.type === 'rating') {
              var sc = (a.scores || {})[h.code] || {}, jr = (a.jar || {})[h.code] || {};
              return '<td class="font-monospace">' + h.t.atribut.map(function (x) { return sc[x] || '-'; }).join(' / ') +
                (h.t.ketepatan.length ? '<div class="fs-11 text-muted">' + h.t.ketepatan.map(function (k) { return k + ': ' + (jr[k] ? PANEL_JAR[jr[k] - 1].label : '-'); }).join(', ') + '</div>' : '') + '</td>';
            }
            if (h.t.type === 'triangle') {
              return '<td class="font-monospace">' + (a.pick || '-') + (a.pick ? (a.pick === s.oddCode ? ' <i class="ri-check-line text-success"></i>' : ' <i class="ri-close-line text-danger"></i>') : '') + '</td>';
            }
            var rk = a.ranks || {};
            return '<td class="fs-12">' + h.t.atribut.map(function (x) {
              return x + ': ' + s.codes.slice().sort(function (c1, c2) { return ((rk[x] || {})[c1] || 9) - ((rk[x] || {})[c2] || 9); }).join(' > ');
            }).join('<br>') + '</td>';
          }).join('') + '</tr>';
      }).join('') + '</tbody></table>');

    host.innerHTML = html;
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
          '<button type="button" class="btn btn-outline-primary btn-open-booth" data-session="aslt|' + item.id + '" title="Data Panelis & Statistik (Organoleptik)"><i class="ri-group-line"></i></button>' +
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

    // Switch to Booth tab from table
    document.addEventListener('click', function (e) {
      var boothBtn = e.target.closest('.btn-open-booth');
      if (boothBtn) {
        fillPanelSessions(boothBtn.getAttribute('data-session'));
        renderPanel();
        var triggerTab = document.getElementById('tab-booth-btn');
        if (triggerTab && window.bootstrap) {
          var tab = new window.bootstrap.Tab(triggerTab);
          tab.show();
        }
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

    /* ---------- Data Panelis & Statistik ---------- */
    fillPanelSessions();
    renderPanel();
    document.getElementById('panelSessionSelect')?.addEventListener('change', renderPanel);

    document.getElementById('btnPanelToggle')?.addEventListener('click', function () {
      var s = currentPanelSession();
      if (!s) return;
      if (s.open) { panelCloseSession(s.source, s.id); showToast('Sesi panel ' + s.id + ' ditutup. Booth tidak lagi menampilkan sesi ini.'); }
      else { panelOpenSession(s.source, s.id); showToast('Sesi panel ' + s.id + ' dibuka. Panelis bisa menilai di booth.'); }
      fillPanelSessions(s.source + '|' + s.id);
      renderPanel();
    });

    document.getElementById('btnPanelReport')?.addEventListener('click', function () {
      var s = currentPanelSession();
      if (!s) return;
      var rec = panelSendToReport(s.source, s.id);
      showToast('Statistik ' + s.id + ' dikirim ke Report (' + (rec.reportStatus || 'Draft') + ').');
      renderPanel();
    });

    /* Booth submissions from another tab show up live */
    window.addEventListener('storage', function (e) { if (e.key === PANEL_SCORES_KEY) renderPanel(); });

    document.getElementById('btnExportMatrix')?.addEventListener('click', function () {
      alert('Matriks Pengamatan & Kurva Arrhenius (ln k vs 1/T) berhasil diekspor dalam format spreadsheet XLS!');
    });
  });
})();
