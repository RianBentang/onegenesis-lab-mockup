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
        : '<button type="button" class="btn btn-outline-primary btn-open-booth" data-code="' + (item.blindCodes && item.blindCodes[0] || '') + '" title="Buka Sesi Panelis"><i class="ri-tablet-line"></i></button>' +
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

  // Global handler for hedonic buttons in booth tab
  window.setScore = function (attrId, score) {
    var scoreLabels = {
      1: 'Amat Sangat Tidak Suka',
      2: 'Sangat Tidak Suka',
      3: 'Tidak Suka',
      4: 'Agak Tidak Suka',
      5: 'Biasa / Netral',
      6: 'Agak Suka',
      7: 'Suka',
      8: 'Sangat Suka',
      9: 'Amat Sangat Suka'
    };
    var labelEl = document.getElementById('scoreVal' + attrId);
    if (labelEl) labelEl.textContent = 'Skor: ' + score + ' (' + (scoreLabels[score] || score) + ')';
  };

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
        var code = boothBtn.getAttribute('data-code');
        var codeEl = document.getElementById('boothBlindCode');
        if (codeEl) codeEl.textContent = code;
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

    document.getElementById('btnSubmitBooth')?.addEventListener('click', function () {
      var code = document.getElementById('boothBlindCode')?.textContent || '842';
      alert('Terima kasih! Penilaian sensori untuk sampel blind code #' + code + ' berhasil dikirim ke server data panelis!');
      // Switch blind code for next sample simulation
      document.getElementById('boothBlindCode').textContent = '319';
    });

    document.getElementById('btnExportMatrix')?.addEventListener('click', function () {
      alert('Matriks Pengamatan & Kurva Arrhenius (ln k vs 1/T) berhasil diekspor dalam format spreadsheet XLS!');
    });
  });
})();
