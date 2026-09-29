/**
 * Reagen & Stok Module Logic for HOLABSYS
 * Data source and layout based on docs/legacy-mockup/OneGenesis - Modul Lab Management (UI Mockup).html
 */

(function () {
  'use strict';

  // Master Reagen Data
  var REAGEN_DATA = [
    { c: 'RG-FK-001', n: 'Heksana p.a.', lab: 'Fisika Kimia', stok: 2.5, min: 5, u: 'L', ed: '12-2027', use: 'Kadar Lemak (Soxhlet)' },
    { c: 'RG-FK-002', n: 'H₂SO₄ pekat 98%', lab: 'Fisika Kimia', stok: 8.0, min: 4, u: 'L', ed: '06-2028', use: 'Kadar Protein (Kjeldahl)' },
    { c: 'RG-FK-003', n: 'Katalis Kjeldahl (tablet)', lab: 'Fisika Kimia', stok: 180, min: 100, u: 'tab', ed: '03-2027', use: 'Kadar Protein' },
    { c: 'RG-FK-004', n: 'KOH 0,1 N (etanolik)', lab: 'Fisika Kimia', stok: 0.8, min: 2, u: 'L', ed: '10-2026', use: 'FFA' },
    { c: 'RG-MB-001', n: 'Plate Count Agar (PCA)', lab: 'Mikrobiologi', stok: 1.2, min: 1, u: 'kg', ed: '02-2027', use: 'TPC' },
    { c: 'RG-MB-002', n: 'DRBC Agar', lab: 'Mikrobiologi', stok: 0.3, min: 0.5, u: 'kg', ed: '11-2026', use: 'Kapang dan Khamir' },
    { c: 'RG-MB-003', n: 'Buffered Peptone Water', lab: 'Mikrobiologi', stok: 2.0, min: 1, u: 'kg', ed: '08-2027', use: 'Salmonella, pengenceran' },
    { c: 'CS-001', n: 'Cawan porselen', lab: 'Fisika Kimia', stok: 46, min: 30, u: 'pcs', ed: '—', use: 'Kadar Air / Abu' }
  ];

  // Log Pemakaian Data
  var LOG_DATA = [
    { tgl: '18-09-2026 09:12', reagen: 'Heksana p.a.', qty: '-0,25 L', ref: 'SPK/LAB/202609/0031 · Kadar Lemak', oleh: 'Putri Ayuningtyas', src: 'Auto-deduct' },
    { tgl: '17-09-2026 14:40', reagen: 'Plate Count Agar (PCA)', qty: '-0,05 kg', ref: 'SPK/LAB/202609/0034 · TPC', oleh: 'Galih Saputra', src: 'Auto-deduct' },
    { tgl: '17-09-2026 10:05', reagen: 'Katalis Kjeldahl (tablet)', qty: '-4 tab', ref: 'SPK/LAB/202609/0022 · Protein', oleh: 'Dimas Aditya', src: 'Auto-deduct' },
    { tgl: '15-09-2026 08:00', reagen: 'H₂SO₄ pekat 98%', qty: '+5 L', ref: 'PO-4500127710 · penerimaan', oleh: 'Siti Aminah', src: 'Manual' },
    { tgl: '14-09-2026 11:30', reagen: 'DRBC Agar', qty: '-0,05 kg', ref: 'SPK/LAB/202609/0019 · Kapang/Khamir', oleh: 'Nur Aini', src: 'Auto-deduct' },
    { tgl: '12-09-2026 16:15', reagen: 'Cawan porselen', qty: '-2 pcs', ref: 'Pecah saat preparasi sampel', oleh: 'Dimas Aditya', src: 'Manual' }
  ];

  // Stock Opname Data
  var SO_DATA = [
    { reagen: 'Heksana p.a.', sistem: '2,5 L', fisik: '2,4 L', diff: '-0,1 L', status: 'Discrepancy' },
    { reagen: 'DRBC Agar', sistem: '0,3 kg', fisik: '0,3 kg', diff: '0 kg', status: 'Match' },
    { reagen: 'Cawan porselen', sistem: '46 pcs', fisik: '44 pcs', diff: '-2 pcs', status: 'Discrepancy' },
    { reagen: 'Plate Count Agar (PCA)', sistem: '1,2 kg', fisik: '1,2 kg', diff: '0 kg', status: 'Match' },
    { reagen: 'KOH 0,1 N (etanolik)', sistem: '0,8 L', fisik: '0,8 L', diff: '0 L', status: 'Match' }
  ];

  // Load from localStorage if present
  try {
    var savedReagen = localStorage.getItem('holabsys_reagen_data');
    if (savedReagen) REAGEN_DATA = JSON.parse(savedReagen);
    var savedLogs = localStorage.getItem('holabsys_reagen_logs');
    if (savedLogs) LOG_DATA = JSON.parse(savedLogs);
  } catch (e) {
    console.error(e);
  }

  function saveToStorage() {
    try {
      localStorage.setItem('holabsys_reagen_data', JSON.stringify(REAGEN_DATA));
      localStorage.setItem('holabsys_reagen_logs', JSON.stringify(LOG_DATA));
    } catch (e) {
      console.error(e);
    }
  }

  function getStatus(item) {
    if (item.stok <= 0) return { label: 'Habis', cls: 'bg-danger-transparent', icon: 'ri-close-circle-line' };
    if (item.stok <= item.min) return { label: 'Menipis', cls: 'bg-warning-transparent', icon: 'ri-alert-line' };
    return { label: 'Aman', cls: 'bg-success-transparent', icon: 'ri-checkbox-circle-line' };
  }

  function updateKpiCards() {
    var total = REAGEN_DATA.length;
    var low = REAGEN_DATA.filter(function (x) { return x.stok <= x.min; }).length;
    var edCount = 2; // e.g. KOH 0,1 N (10-2026), DRBC Agar (11-2026)
    var txCount = LOG_DATA.length;

    var elTotal = document.getElementById('kpiTotalItem');
    if (elTotal) elTotal.textContent = total;
    var elLow = document.getElementById('kpiMenipis');
    if (elLow) elLow.textContent = low;
    var elEd = document.getElementById('kpiEd');
    if (elEd) elEd.textContent = edCount;
    var elTx = document.getElementById('kpiTx');
    if (elTx) elTx.textContent = txCount + ' transaksi';

    var cMaster = document.getElementById('countMaster');
    if (cMaster) cMaster.textContent = total;
    var cLog = document.getElementById('countLog');
    if (cLog) cLog.textContent = LOG_DATA.length;
    var cSo = document.getElementById('countSo');
    if (cSo) cSo.textContent = SO_DATA.length;
  }

  function renderMasterTable() {
    var tbody = document.getElementById('masterReagenBody');
    if (!tbody) return;

    var q = (document.getElementById('searchMaster')?.value || '').toLowerCase().trim();
    var labFilter = document.getElementById('filterLab')?.value || '';
    var statusFilter = document.getElementById('filterStatus')?.value || '';

    var filtered = REAGEN_DATA.filter(function (item) {
      var matchQ = !q || item.c.toLowerCase().includes(q) || item.n.toLowerCase().includes(q) || item.use.toLowerCase().includes(q);
      var matchLab = !labFilter || item.lab === labFilter;
      var st = getStatus(item).label;
      var matchSt = !statusFilter || st === statusFilter;
      return matchQ && matchLab && matchSt;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted"><i class="ri-inbox-line fs-24 d-block mb-1"></i>Tidak ada data reagen ditemukan</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function (item, idx) {
      var st = getStatus(item);
      var isLow = item.stok <= item.min;
      var stockVal = String(item.stok).replace('.', ',');
      var minVal = String(item.min).replace('.', ',');

      html += '<tr>' +
        '<td style="width: 1%">' +
        '  <div class="d-flex align-items-center gap-1">' +
        '    <button type="button" class="btn btn-sm btn-icon btn-light text-primary btn-edit-item" data-code="' + item.c + '" title="Edit Reagen"><i class="ri-edit-line"></i></button>' +
        '    <button type="button" class="btn btn-sm btn-icon btn-light text-danger btn-del-item" data-code="' + item.c + '" title="Hapus"><i class="ri-delete-bin-line"></i></button>' +
        '  </div>' +
        '</td>' +
        '<td><span class="badge bg-primary-transparent font-monospace text-dark">' + item.c + '</span></td>' +
        '<td><strong class="text-dark">' + item.n + '</strong></td>' +
        '<td><span class="badge bg-light text-dark border">' + item.lab + '</span></td>' +
        '<td><span class="text-muted small">' + item.use + '</span></td>' +
        '<td class="text-end ' + (isLow ? 'text-danger fw-bold' : 'fw-semibold') + '">' + stockVal + ' ' + item.u + '</td>' +
        '<td class="text-end text-muted">' + minVal + ' ' + item.u + '</td>' +
        '<td><span class="small font-monospace ' + (item.ed !== '—' && (item.ed.endsWith('2026')) ? 'text-warning fw-semibold' : '') + '">' + item.ed + '</span></td>' +
        '<td><span class="badge ' + st.cls + ' d-inline-flex align-items-center gap-1"><i class="' + st.icon + '"></i> ' + st.label + '</span></td>' +
        '</tr>';
    });

    tbody.innerHTML = html;
  }

  function renderLogTable() {
    var tbody = document.getElementById('logPemakaianBody');
    if (!tbody) return;

    var q = (document.getElementById('searchLog')?.value || '').toLowerCase().trim();
    var filtered = LOG_DATA.filter(function (l) {
      return !q || l.reagen.toLowerCase().includes(q) || l.ref.toLowerCase().includes(q) || l.oleh.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted"><i class="ri-inbox-line fs-24 d-block mb-1"></i>Tidak ada log pemakaian</td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function (l) {
      var isNeg = l.qty.startsWith('-');
      var qtyClass = isNeg ? 'text-danger fw-bold' : 'text-success fw-bold';
      var srcBadge = l.src === 'Auto-deduct'
        ? '<span class="badge bg-primary-transparent d-inline-flex align-items-center gap-1"><i class="ri-flashlight-line"></i> Auto-deduct</span>'
        : '<span class="badge bg-secondary-transparent">Manual</span>';

      html += '<tr>' +
        '<td class="text-nowrap font-monospace fs-12 text-muted">' + l.tgl + '</td>' +
        '<td><strong class="text-dark">' + l.reagen + '</strong></td>' +
        '<td class="' + qtyClass + '">' + l.qty + '</td>' +
        '<td><span class="text-muted">' + l.ref + '</span></td>' +
        '<td><span class="fw-medium text-dark">' + l.oleh + '</span></td>' +
        '<td>' + srcBadge + '</td>' +
        '</tr>';
    });

    tbody.innerHTML = html;
  }

  function renderSoTable() {
    var tbody = document.getElementById('soTableBody');
    if (!tbody) return;

    var html = '';
    SO_DATA.forEach(function (x) {
      var isDiff = x.diff !== '0' && x.diff !== '0 L' && x.diff !== '0 kg' && x.diff !== '0 pcs';
      var diffClass = isDiff ? 'text-danger fw-bold' : 'text-success fw-semibold';
      var stBadge = isDiff
        ? '<span class="badge bg-danger-transparent d-inline-flex align-items-center gap-1"><i class="ri-alert-line"></i> Selisih</span>'
        : '<span class="badge bg-success-transparent d-inline-flex align-items-center gap-1"><i class="ri-check-line"></i> Cocok</span>';

      html += '<tr>' +
        '<td><strong class="text-dark">' + x.reagen + '</strong></td>' +
        '<td class="text-end font-monospace">' + x.sistem + '</td>' +
        '<td class="text-end font-monospace">' + x.fisik + '</td>' +
        '<td class="text-end font-monospace ' + diffClass + '">' + x.diff + '</td>' +
        '<td class="text-center">' + stBadge + '</td>' +
        '</tr>';
    });

    tbody.innerHTML = html;
  }

  function showToast(msg, isSuccess) {
    var toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    var toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-white ' + (isSuccess !== false ? 'bg-success' : 'bg-danger') + ' border-0 shadow';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = '<div class="d-flex"><div class="toast-body"><i class="ri-checkbox-circle-fill me-2"></i>' + msg + '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>';

    toastContainer.appendChild(toastEl);
    var bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
    bsToast.show();
    toastEl.addEventListener('hidden.bs.toast', function () {
      toastEl.remove();
    });
  }

  // Bind Events
  document.addEventListener('DOMContentLoaded', function () {
    updateKpiCards();
    renderMasterTable();
    renderLogTable();
    renderSoTable();

    // Tab segment switcher
    var tabBtns = document.querySelectorAll('.nav-tabs[data-tabgroup="reagen"] .nav-link');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var targetTab = this.getAttribute('data-tab');
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');

        document.querySelectorAll('[data-group="reagen"][data-pane]').forEach(function (pane) {
          pane.classList.toggle('d-none', pane.dataset.pane !== targetTab);
        });
      });
    });

    // Search & Filter listeners
    var sMaster = document.getElementById('searchMaster');
    if (sMaster) sMaster.addEventListener('input', renderMasterTable);
    var fLab = document.getElementById('filterLab');
    if (fLab) fLab.addEventListener('change', renderMasterTable);
    var fStatus = document.getElementById('filterStatus');
    if (fStatus) fStatus.addEventListener('change', renderMasterTable);

    var sLog = document.getElementById('searchLog');
    if (sLog) sLog.addEventListener('input', renderLogTable);

    // Add Reagen Modal
    var modalEl = document.getElementById('modalAddReagen');
    var addModal = modalEl ? new bootstrap.Modal(modalEl) : null;
    var formReagen = document.getElementById('formReagen');

    var btnAdd = document.getElementById('btnAddNewItem');
    if (btnAdd && addModal) {
      btnAdd.addEventListener('click', function () {
        document.getElementById('modalReagenTitle').textContent = 'Tambah Item Reagen / Consumable';
        document.getElementById('reagenEditCode').value = '';
        formReagen.reset();
        addModal.show();
      });
    }

    // Save Reagen
    if (formReagen && addModal) {
      formReagen.addEventListener('submit', function (e) {
        e.preventDefault();
        var editCode = document.getElementById('reagenEditCode').value;
        var code = document.getElementById('inputCode').value.trim();
        var name = document.getElementById('inputName').value.trim();
        var lab = document.getElementById('inputLab').value;
        var unit = document.getElementById('inputUnit').value.trim();
        var stok = parseFloat(document.getElementById('inputStok').value) || 0;
        var min = parseFloat(document.getElementById('inputMin').value) || 0;
        var ed = document.getElementById('inputEd').value.trim() || '—';
        var use = document.getElementById('inputUse').value.trim();

        if (editCode) {
          // Edit existing
          var existing = REAGEN_DATA.find(function (x) { return x.c === editCode; });
          if (existing) {
            existing.c = code;
            existing.n = name;
            existing.lab = lab;
            existing.u = unit;
            existing.stok = stok;
            existing.min = min;
            existing.ed = ed;
            existing.use = use;
            showToast('Reagen ' + name + ' berhasil diperbarui');
          }
        } else {
          // Check duplicate code
          if (REAGEN_DATA.some(function (x) { return x.c === code; })) {
            alert('Kode Reagen ' + code + ' sudah digunakan!');
            return;
          }
          REAGEN_DATA.unshift({
            c: code,
            n: name,
            lab: lab,
            u: unit,
            stok: stok,
            min: min,
            ed: ed,
            use: use
          });
          // Add to log
          LOG_DATA.unshift({
            tgl: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toTimeString().slice(0, 5),
            reagen: name,
            qty: '+' + stok + ' ' + unit,
            ref: 'Registrasi item baru',
            oleh: 'Admin Lab',
            src: 'Manual'
          });
          showToast('Reagen ' + name + ' berhasil ditambahkan');
        }

        saveToStorage();
        updateKpiCards();
        renderMasterTable();
        renderLogTable();
        addModal.hide();
      });
    }

    // Delegate table actions (Edit & Delete)
    var masterTbody = document.getElementById('masterReagenBody');
    if (masterTbody && addModal) {
      masterTbody.addEventListener('click', function (e) {
        var btnEdit = e.target.closest('.btn-edit-item');
        if (btnEdit) {
          var code = btnEdit.getAttribute('data-code');
          var item = REAGEN_DATA.find(function (x) { return x.c === code; });
          if (item) {
            document.getElementById('modalReagenTitle').textContent = 'Edit Reagen — ' + item.c;
            document.getElementById('reagenEditCode').value = item.c;
            document.getElementById('inputCode').value = item.c;
            document.getElementById('inputName').value = item.n;
            document.getElementById('inputLab').value = item.lab;
            document.getElementById('inputUnit').value = item.u;
            document.getElementById('inputStok').value = item.stok;
            document.getElementById('inputMin').value = item.min;
            document.getElementById('inputEd').value = item.ed === '—' ? '' : item.ed;
            document.getElementById('inputUse').value = item.use;
            addModal.show();
          }
          return;
        }

        var btnDel = e.target.closest('.btn-del-item');
        if (btnDel) {
          var dcode = btnDel.getAttribute('data-code');
          if (confirm('Apakah Anda yakin ingin menghapus item reagen ' + dcode + '?')) {
            REAGEN_DATA = REAGEN_DATA.filter(function (x) { return x.c !== dcode; });
            saveToStorage();
            updateKpiCards();
            renderMasterTable();
            showToast('Item reagen ' + dcode + ' telah dihapus', true);
          }
        }
      });
    }

    // Adjust Stock Opname Action
    var btnAdjustSo = document.getElementById('btnAdjustSo');
    if (btnAdjustSo) {
      btnAdjustSo.addEventListener('click', function () {
        // Adjust stock values in REAGEN_DATA
        var adjustCount = 0;
        SO_DATA.forEach(function (so) {
          var item = REAGEN_DATA.find(function (r) { return r.n === so.reagen; });
          if (item && (so.diff !== '0' && so.diff !== '0 L' && so.diff !== '0 kg' && so.diff !== '0 pcs')) {
            var fVal = parseFloat(so.fisik.replace(',', '.'));
            var oldStok = item.stok;
            item.stok = fVal;
            adjustCount++;

            // Record log
            LOG_DATA.unshift({
              tgl: new Date().toLocaleDateString('id-ID') + ' ' + new Date().toTimeString().slice(0, 5),
              reagen: item.n,
              qty: (fVal - oldStok > 0 ? '+' : '') + String(Number((fVal - oldStok).toFixed(2))).replace('.', ',') + ' ' + item.u,
              ref: 'Stock Opname Adjustment (Agustus 2026)',
              oleh: 'Admin Lab',
              src: 'Manual'
            });

            // Mark SO as adjusted
            so.sistem = so.fisik;
            so.diff = '0 ' + item.u;
            so.status = 'Match';
          }
        });

        saveToStorage();
        updateKpiCards();
        renderMasterTable();
        renderLogTable();
        renderSoTable();
        showToast(adjustCount > 0 ? 'Penyesuaian stok (' + adjustCount + ' item) berhasil diterapkan!' : 'Semua stok sudah sesuai dengan hasil fisik.');
      });
    }

    // Upload Dropzone simulation
    var uploadZone = document.getElementById('soDropzone');
    if (uploadZone) {
      uploadZone.addEventListener('click', function () {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.csv';
        input.onchange = function () {
          if (input.files && input.files[0]) {
            showToast('File ' + input.files[0].name + ' berhasil diunggah & diproses');
          }
        };
        input.click();
      });
    }
  });

})();
