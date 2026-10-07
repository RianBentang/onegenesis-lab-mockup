/**
 * Master Matriks Kompetensi Analis Logic
 * HOLABSYS System
 */

(function () {
  'use strict';

  var ANALIS_DATA = [
    {
      id: 1,
      nik: 'GF-10492',
      nama: 'Budi Santoso, S.TP.',
      lab: 'Fisika Kimia',
      status: 'Certified',
      params: ['Moisture (Kadar Air)', 'Kadar Lemak (Fat)', 'FFA (Free Fatty Acid)', 'Kadar Protein', 'Kadar Abu'],
      evalDate: '15-08-2026',
      validUntil: '15-08-2027',
      ptResult: 'Satisfactory (Z=0.42)'
    },
    {
      id: 2,
      nik: 'GF-10512',
      nama: 'Galih Saputra, A.Md.',
      lab: 'Fisika Kimia',
      status: 'Certified',
      params: ['Moisture (Kadar Air)', 'Kadar Lemak (Fat)', 'FFA', 'Cemaran Logam Pb (AAS)'],
      evalDate: '10-07-2026',
      validUntil: '10-07-2027',
      ptResult: 'Satisfactory (Z=0.88)'
    },
    {
      id: 3,
      nik: 'GF-10633',
      nama: 'Dewi Lestari, S.Si.',
      lab: 'Mikrobiologi',
      status: 'Certified',
      params: ['Salmonella sp.', 'ALT / TPC', 'Kapang dan Khamir', 'Coliform & E. coli'],
      evalDate: '20-08-2026',
      validUntil: '20-08-2027',
      ptResult: 'Satisfactory (Z=0.15)'
    },
    {
      id: 4,
      nik: 'GF-10744',
      nama: 'Nur Aini, A.Md.',
      lab: 'Mikrobiologi',
      status: 'Certified',
      params: ['Salmonella sp.', 'ALT / TPC', 'Kapang dan Khamir'],
      evalDate: '05-06-2026',
      validUntil: '05-06-2027',
      ptResult: 'Satisfactory (Z=0.61)'
    },
    {
      id: 5,
      nik: 'GF-10889',
      nama: 'Dimas Aditya, S.T.',
      lab: 'Fisika Kimia',
      status: 'Training',
      params: ['Moisture (Kadar Air)', 'Kadar Protein (Under Supervision)'],
      evalDate: '01-09-2026',
      validUntil: '01-03-2027',
      ptResult: 'Internal Check (In Progress)'
    },
    {
      id: 6,
      nik: 'GF-10922',
      nama: 'Putri Ayuningtyas, S.Si.',
      lab: 'Sensory & ASLT',
      status: 'Certified',
      params: ['Sensory Hedonik', 'Triangle Test', 'Arrhenius Shelf Life', 'AW Kritis'],
      evalDate: '12-08-2026',
      validUntil: '12-08-2027',
      ptResult: 'Panelis Leader Certified'
    },
    {
      id: 7,
      nik: 'GF-11005',
      nama: 'Siti Aminah, A.Md.',
      lab: 'Fisika Kimia',
      status: 'Certified',
      params: ['FFA', 'Kadar Abu', 'Preparasi Reagen'],
      evalDate: '18-05-2026',
      validUntil: '18-05-2027',
      ptResult: 'Satisfactory (Z=0.33)'
    },
    {
      id: 8,
      nik: 'GF-11140',
      nama: 'Rian Hidayat, S.TP.',
      lab: 'Sensory & ASLT',
      status: 'Training',
      params: ['Organoleptik Screening', 'ASLT Chamber Monitoring'],
      evalDate: '15-09-2026',
      validUntil: '15-03-2027',
      ptResult: 'Screening Phase'
    }
  ];

  function renderTable() {
    var tbody = document.getElementById('analisTableBody');
    if (!tbody) return;

    var searchVal = (document.getElementById('searchAnalisInput')?.value || '').toLowerCase().trim();
    var labFilter = document.getElementById('filterLabAnalis')?.value || '';
    var statusFilter = document.getElementById('filterStatusAnalis')?.value || '';

    var filtered = ANALIS_DATA.filter(function (item) {
      var matchSearch = !searchVal || item.nama.toLowerCase().includes(searchVal) || item.nik.toLowerCase().includes(searchVal);
      var matchLab = !labFilter || item.lab === labFilter;
      var matchStatus = !statusFilter || item.status === statusFilter;
      return matchSearch && matchLab && matchStatus;
    });

    var countEl = document.getElementById('countList'); // tab badge in the card header
    if (countEl) countEl.textContent = filtered.length;
    tbody.innerHTML = filtered.map(function (item, idx) {
      var statusBadge = item.status === 'Certified'
        ? '<span class="badge bg-success-transparent"><i class="ri-shield-check-line"></i> Certified (Mandiri)</span>'
        : '<span class="badge bg-warning-transparent"><i class="ri-time-line"></i> In Training (Supervisi)</span>';

      var paramBadges = item.params.map(function (p) {
        return '<span class="badge bg-light text-dark border me-1 mb-1 font-monospace" style="font-size:0.75rem;">' + p + '</span>';
      }).join('');

      return '<tr>' +
        '<td class="text-muted">' + (idx + 1) + '</td>' +
        '<td><div class="fw-semibold">' + item.nama + '</div><small class="text-muted font-monospace">' + item.nik + '</small></td>' +
        '<td><span class="badge bg-light text-muted border">' + item.lab + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td><div class="d-flex flex-wrap">' + paramBadges + '</div></td>' +
        '<td class="font-monospace small">' + item.evalDate + '</td>' +
        '<td class="font-monospace small">' + item.validUntil + '</td>' +
        '<td class="text-center">' +
        '<div class="btn-group btn-group-sm">' +
        '<button type="button" class="btn btn-outline-secondary" title="Edit Matriks"><i class="ri-edit-line"></i></button>' +
        '<button type="button" class="btn btn-outline-primary" title="Riwayat Pelatihan"><i class="ri-file-user-line"></i></button>' +
        '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    var elTotal = document.getElementById('kpiTotalAnalis');
    if (elTotal) elTotal.textContent = ANALIS_DATA.length + ' Personel';
    var elCert = document.getElementById('kpiCertified');
    if (elCert) elCert.textContent = ANALIS_DATA.filter(function (x) { return x.status === 'Certified'; }).length + ' Analis';
    var elTrain = document.getElementById('kpiTraining');
    if (elTrain) elTrain.textContent = ANALIS_DATA.filter(function (x) { return x.status === 'Training'; }).length + ' Analis';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderTable();

    document.getElementById('searchAnalisInput')?.addEventListener('input', renderTable);
    document.getElementById('filterLabAnalis')?.addEventListener('change', renderTable);
    document.getElementById('filterStatusAnalis')?.addEventListener('change', renderTable);

    document.getElementById('formAddAnalis')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var nama = document.getElementById('analisNama').value;
      var nik = document.getElementById('analisNik').value;
      var lab = document.getElementById('analisLab').value;
      var status = document.getElementById('analisStatus').value;
      var paramsStr = document.getElementById('analisParams').value || 'Moisture, Fat';
      var params = paramsStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean);

      ANALIS_DATA.unshift({
        id: ANALIS_DATA.length + 1,
        nik: nik,
        nama: nama,
        lab: lab,
        status: status,
        params: params,
        evalDate: '23-09-2026',
        validUntil: '23-09-2027',
        ptResult: 'New Personel'
      });

      renderTable();
      var modalEl = document.getElementById('modalAddAnalis');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      this.reset();
      alert('Personel analis ' + nama + ' berhasil didaftarkan ke matriks kompetensi lab!');
    });
  });
})();
