/**
 * Master Tanda Tangan Digital & Barcode/QR Code Logic
 * HOLABSYS ISO 17025 System
 */

(function () {
  'use strict';

  // Deterministic SVG signature generator for mockup preview
  function makeSignatureSvg(name, title) {
    var strokeColor = '#0b2e63';
    return '<svg viewBox="0 0 200 70" width="160" height="55" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M 20,45 Q 40,10 65,35 T 110,30 T 150,45 Q 170,55 180,25" fill="none" stroke="' + strokeColor + '" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M 40,52 Q 90,48 160,50" fill="none" stroke="' + strokeColor + '" stroke-width="1.2" stroke-linecap="round"/>' +
      '<text x="25" y="65" font-family="sans-serif" font-size="9" fill="#555">' + (title || name) + '</text>' +
      '</svg>';
  }

  // QR Code SVG generator
  function makeQrSvg(seed, size) {
    size = size || 130;
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
    var n = 21, cell = size / n, r = '';
    function fin(x, y) {
      return '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + (7 * cell) + '" height="' + (7 * cell) + '" fill="#111"/>' +
        '<rect x="' + ((x + 1) * cell) + '" y="' + ((y + 1) * cell) + '" width="' + (5 * cell) + '" height="' + (5 * cell) + '" fill="#fff"/>' +
        '<rect x="' + ((x + 2) * cell) + '" y="' + ((y + 2) * cell) + '" width="' + (3 * cell) + '" height="' + (3 * cell) + '" fill="#111"/>';
    }
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
        h = (h * 1103515245 + 12345) >>> 0;
        if (h & 0x40000) r += '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + cell + '" height="' + cell + '" fill="#111"/>';
      }
    }
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
      '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' + r + fin(0, 0) + fin(14, 0) + fin(0, 14) + '</svg>';
  }

  // Initial Master Data Specimen TTD
  var TTD_DATA = [
    {
      id: 1,
      nama: 'Siti Rahmawati, S.Si.',
      nik: 'GF-10024',
      role: 'TCM',
      roleLabel: 'Technical Manager',
      dept: 'Laboratorium',
      hash: 'SHA256: 7f8a9...b12e',
      validUntil: '31-12-2027',
      status: 'Active',
      specimen: makeSignatureSvg('Siti Rahmawati', 'Digital Signed TCM')
    },
    {
      id: 2,
      nama: 'Budi Santoso, S.TP.',
      nik: 'GF-10492',
      role: 'CRL',
      roleLabel: 'Koordinator Lab / Penyelia',
      dept: 'Laboratorium',
      hash: 'SHA256: 4a2c1...99ef',
      validUntil: '31-12-2027',
      status: 'Active',
      specimen: makeSignatureSvg('Budi Santoso', 'Digital Signed CRL')
    },
    {
      id: 3,
      nama: 'Bambang Admin, A.Md.',
      nik: 'GF-10811',
      role: 'ADM',
      roleLabel: 'Lab Administrator',
      dept: 'Laboratorium',
      hash: 'SHA256: 1c3d9...65ab',
      validUntil: '31-12-2026',
      status: 'Active',
      specimen: makeSignatureSvg('Bambang Admin', 'Digital Signed ADM')
    },
    {
      id: 4,
      nama: 'Ratna Sari, M.Sc.',
      nik: 'GF-09871',
      role: 'HOL',
      roleLabel: 'Head of Laboratory',
      dept: 'Laboratorium',
      hash: 'SHA256: 9e8d3...41aa',
      validUntil: '31-12-2027',
      status: 'Active',
      specimen: makeSignatureSvg('Ratna Sari', 'Digital Signed HOL')
    },
    {
      id: 5,
      nama: 'Agus Setiawan, Ph.D.',
      nik: 'GF-08112',
      role: 'HOR',
      roleLabel: 'Head of R&D',
      dept: 'Research & Development',
      hash: 'SHA256: 3b1a8...56ce',
      validUntil: '31-12-2027',
      status: 'Active',
      specimen: makeSignatureSvg('Agus Setiawan', 'Digital Signed HOR')
    }
  ];

  // Audit Log Data
  var AUDIT_LOGS = [
    { time: '23-09-2026 10:15:30', doc: 'COA/LAB/202609/0040', aksi: 'Final Digital Sign-off', user: 'Siti Rahmawati', role: 'TCM', status: 'SUCCESS', ip: '10.20.14.88 (GF-Intranet)' },
    { time: '23-09-2026 09:40:12', doc: 'LHU/LAB/202609/0039', aksi: 'Validasi & Review Draf', user: 'Budi Santoso', role: 'CRL', status: 'SUCCESS', ip: '10.20.14.92 (GF-Intranet)' },
    { time: '22-09-2026 16:30:05', doc: 'SPK/LAB/202609/0011', aksi: 'Kaji Ulang & Terbit SPK', user: 'Bambang Admin', role: 'ADM', status: 'SUCCESS', ip: '10.20.14.101 (GF-Intranet)' },
    { time: '22-09-2026 14:10:44', doc: 'COA/LAB/202609/0038', aksi: 'Scan Verifikasi Publik QR', user: 'External Client / QA', role: 'Guest', status: 'VALIDATED', ip: '180.252.16.5 (Public Web)' },
    { time: '21-09-2026 11:05:19', doc: 'COA/LAB/202609/0035', aksi: 'Final Digital Sign-off', user: 'Siti Rahmawati', role: 'TCM', status: 'SUCCESS', ip: '10.20.14.88 (GF-Intranet)' }
  ];

  function getBadgeClass(role) {
    if (role === 'TCM') return 'bg-primary-transparent';
    if (role === 'CRL') return 'bg-success-transparent';
    if (role === 'ADM') return 'bg-secondary-transparent';
    return 'bg-light text-muted';
  }

  function renderTable() {
    var tbody = document.getElementById('ttdTableBody');
    if (!tbody) return;

    var searchVal = (document.getElementById('searchTtdInput')?.value || '').toLowerCase().trim();
    var filtered = TTD_DATA.filter(function (item) {
      return !searchVal || item.nama.toLowerCase().includes(searchVal) || item.role.toLowerCase().includes(searchVal) || item.dept.toLowerCase().includes(searchVal);
    });

    var countEl = document.getElementById('countTtd'); // tab badge in the card header
    if (countEl) countEl.textContent = filtered.length;

    tbody.innerHTML = filtered.map(function (item, idx) {
      var badgeCls = getBadgeClass(item.role);
      var statusBadge = item.status === 'Active'
        ? '<span class="badge bg-success-transparent"><i class="ri-checkbox-circle-line"></i> Aktif</span>'
        : '<span class="badge bg-secondary-transparent">Nonaktif</span>';

      return '<tr>' +
        '<td class="text-muted">' + (idx + 1) + '</td>' +
        '<td><div class="fw-semibold">' + item.nama + '</div><small class="text-muted font-monospace">' + item.nik + '</small></td>' +
        '<td><span class="badge ' + badgeCls + ' px-2 py-1 font-monospace">' + item.role + '</span><div class="small text-muted mt-1">' + item.roleLabel + '</div></td>' +
        '<td>' + item.dept + '</td>' +
        '<td><div class="sig-preview-box py-1">' + item.specimen + '</div></td>' +
        '<td><code class="small text-dark">' + item.hash + '</code><div class="small text-success mt-1"><i class="ri-lock-2-line"></i> Enkripsi RSA-2048</div></td>' +
        '<td class="font-monospace small">' + item.validUntil + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td class="text-center">' +
        '<div class="btn-group btn-group-sm">' +
        '<button type="button" class="btn btn-outline-secondary btn-edit-ttd" data-id="' + item.id + '" title="Edit Spesimen"><i class="ri-edit-line"></i></button>' +
        '<button type="button" class="btn btn-outline-danger btn-toggle-status" data-id="' + item.id + '" title="Nonaktifkan"><i class="ri-shut-down-line"></i></button>' +
        '</div>' +
        '</td>' +
        '</tr>';
    }).join('');
  }

  function renderAuditLogs() {
    var tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    var countEl = document.getElementById('countAudit');
    if (countEl) countEl.textContent = AUDIT_LOGS.length;

    tbody.innerHTML = AUDIT_LOGS.map(function (log) {
      return '<tr>' +
        '<td class="font-monospace small text-muted">' + log.time + '</td>' +
        '<td class="font-monospace fw-semibold text-primary">' + log.doc + '</td>' +
        '<td>' + log.aksi + '</td>' +
        '<td><span class="fw-semibold">' + log.user + '</span></td>' +
        '<td><span class="badge bg-light text-dark font-monospace">' + log.role + '</span></td>' +
        '<td><span class="badge bg-success-transparent"><i class="ri-check-line"></i> ' + log.status + '</span></td>' +
        '<td class="small font-monospace text-muted">' + log.ip + '</td>' +
        '</tr>';
    }).join('');
  }

  function updateQrPreview() {
    var type = document.getElementById('qrTypeSelect')?.value || 'LHU';
    var size = parseInt(document.getElementById('qrSizeRange')?.value || '130', 10);
    var template = document.getElementById('qrUrlTemplate')?.value || 'https://holabsys.garudafood.com/verify/cert/{CERT_ID}?hash={TOKEN}';

    var sampleId = type === 'LHU' ? 'COA-202609-0040' : (type === 'LABEL' ? 'SMP-202609-0018-01' : 'SPK-202609-0011');
    var hash = 'a8f9c0e21b7d34fe';
    var nowIso = new Date().toISOString();

    var payload = template.replace('{CERT_ID}', sampleId).replace('{TOKEN}', hash).replace('{TIMESTAMP}', nowIso);

    var labelEl = document.getElementById('qrLabelCode');
    if (labelEl) labelEl.textContent = sampleId;

    var liveSvg = document.getElementById('qrLiveSvg');
    if (liveSvg) liveSvg.innerHTML = makeQrSvg(payload, size);

    var decEl = document.getElementById('qrPayloadDecoded');
    if (decEl) decEl.textContent = payload;
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderTable();
    renderAuditLogs();
    updateQrPreview();

    // Search filter
    document.getElementById('searchTtdInput')?.addEventListener('input', renderTable);

    // The search in the card header only applies to the Spesimen TTD tab
    document.getElementById('sigTab')?.addEventListener('shown.bs.tab', function (e) {
      document.getElementById('sigFilters')?.classList.toggle('d-none', e.target.id !== 'tab-specimen-btn');
    });

    // QR controls
    document.getElementById('qrTypeSelect')?.addEventListener('change', function () {
      var tpl = document.getElementById('qrUrlTemplate');
      if (this.value === 'LHU') tpl.value = 'https://holabsys.garudafood.com/verify/cert/{CERT_ID}?hash={TOKEN}';
      else if (this.value === 'LABEL') tpl.value = 'https://holabsys.garudafood.com/sample/{CERT_ID}';
      else if (this.value === 'SPK') tpl.value = 'https://holabsys.garudafood.com/spk/{CERT_ID}';
      else tpl.value = 'https://holabsys.garudafood.com/reagen/{CERT_ID}';
      updateQrPreview();
    });

    document.getElementById('qrSizeRange')?.addEventListener('input', function () {
      var sizeVal = document.getElementById('qrSizeVal');
      if (sizeVal) sizeVal.textContent = this.value + 'px';
      updateQrPreview();
    });

    document.getElementById('btnSaveQrConfig')?.addEventListener('click', function () {
      alert('Konfigurasi Template QR Code berhasil disimpan ke Master Data Sistem!');
    });

    document.getElementById('btnCopyPayload')?.addEventListener('click', function () {
      var text = document.getElementById('qrPayloadDecoded')?.textContent.trim();
      navigator.clipboard?.writeText(text);
      alert('URL Verifikasi disalin ke clipboard: \n' + text);
    });

    document.getElementById('btnTestVerify')?.addEventListener('click', function () {
      alert('Simulasi Validasi Sertifikat ISO 17025:\n\nStatus: KEABSAHAN VALID (100% ASLI)\nNomor: COA/LAB/202609/0040\nPenandatangan: Siti Rahmawati, S.Si. (TCM)\nWaktu: 23-Sep-2026 10:15 WIB\nIntegritas Dokumen: Lolos verifikasi SHA-256');
    });

    // Form Add TTD
    document.getElementById('formAddTtd')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var nama = document.getElementById('ttdNama').value;
      var role = document.getElementById('ttdRole').value;
      var nik = document.getElementById('ttdNik').value || 'GF-' + Math.floor(10000 + Math.random() * 90000);

      var roleMap = {
        TCM: 'Technical Manager',
        CRL: 'Koordinator Lab / Penyelia',
        ADM: 'Lab Administrator',
        HOL: 'Head of Laboratory',
        HOR: 'Head of R&D',
        MGU: 'Manager User'
      };

      TTD_DATA.push({
        id: TTD_DATA.length + 1,
        nama: nama,
        nik: nik,
        role: role,
        roleLabel: roleMap[role] || role,
        dept: role === 'HOR' ? 'Research & Development' : (role === 'MGU' ? 'Quality Assurance' : 'Laboratorium'),
        hash: 'SHA256: ' + Math.random().toString(36).substring(2, 8) + '...new',
        validUntil: '31-12-2027',
        status: 'Active',
        specimen: makeSignatureSvg(nama, 'Digital Signed ' + role)
      });

      renderTable();
      var kpi = document.getElementById('kpiTtdActive');
      if (kpi) kpi.textContent = TTD_DATA.length;

      var modalEl = document.getElementById('modalAddTtd');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      this.reset();
      alert('Spesimen Tanda Tangan Digital baru untuk ' + nama + ' berhasil didaftarkan!');
    });
  });
})();
