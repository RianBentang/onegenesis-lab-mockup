/**
 * Master Alat & Kalibrasi Logic
 * HOLABSYS System
 */

(function () {
  'use strict';

  var ALAT_DATA = [
    {
      id: 1,
      kode: 'INST-FK-001',
      nama: 'Moisture Analyzer Halogen',
      model: 'Mettler Toledo HE53',
      serial: 'SN-MT-99210',
      lab: 'Fisika Kimia',
      status: 'Operasional',
      lastCal: '10-06-2026',
      dueCal: '10-06-2027',
      vendor: 'PT Mettler Toledo Indonesia',
      cert: 'CAL-MTI-2026/041'
    },
    {
      id: 2,
      kode: 'INST-FK-002',
      nama: 'Unit Destilasi Protein Kjeldahl',
      model: 'FOSS Kjeltec 8100',
      serial: 'SN-FOSS-8812',
      lab: 'Fisika Kimia',
      status: 'Operasional',
      lastCal: '15-04-2026',
      dueCal: '15-04-2027',
      vendor: 'PT Laborindo Sarana',
      cert: 'CAL-LAB-2026/899'
    },
    {
      id: 3,
      kode: 'INST-FK-003',
      nama: 'Soxhlet Extraction System (Fat)',
      model: 'Buchi E-816 SOX',
      serial: 'SN-BUCHI-1049',
      lab: 'Fisika Kimia',
      status: 'Operasional',
      lastCal: '20-03-2026',
      dueCal: '20-03-2027',
      vendor: 'Buchi Indonesia',
      cert: 'CAL-BCH-2026/112'
    },
    {
      id: 4,
      kode: 'INST-FK-004',
      nama: 'Atomic Absorption Spectrometer (AAS - Pb)',
      model: 'Shimadzu AA-7000',
      serial: 'SN-SHM-7718',
      lab: 'Fisika Kimia',
      status: 'Out of Service',
      lastCal: '12-01-2025',
      dueCal: '12-01-2026 (Expired)',
      vendor: 'Shimadzu Service Center',
      cert: 'Menunggu Penggantian Lampu Hollow'
    },
    {
      id: 5,
      kode: 'INST-MB-001',
      nama: 'Autoclave Vertical Digital',
      model: 'Hirayama HVE-50',
      serial: 'SN-HRY-5501',
      lab: 'Mikrobiologi',
      status: 'Operasional',
      lastCal: '05-08-2026',
      dueCal: '05-08-2027',
      vendor: 'BBSPJI Kemenperin',
      cert: 'CAL-KMP-2026/0991'
    },
    {
      id: 6,
      kode: 'INST-MB-002',
      nama: 'Incubator Bakteri 37°C',
      model: 'Memmert IN55',
      serial: 'SN-MMT-4402',
      lab: 'Mikrobiologi',
      status: 'Operasional',
      lastCal: '18-07-2026',
      dueCal: '18-07-2027',
      vendor: 'PT Sumber Aneka',
      cert: 'CAL-SAN-2026/304'
    },
    {
      id: 7,
      kode: 'INST-MB-003',
      nama: 'Laminar Air Flow (LAF Biosafety)',
      model: 'Esco Airstream Class II',
      serial: 'SN-ESCO-1299',
      lab: 'Mikrobiologi',
      status: 'Maintenance',
      lastCal: '10-09-2025',
      dueCal: '10-10-2026 (Jatuh Tempo < 30 Hari)',
      vendor: 'Esco Indonesia',
      cert: 'Validasi HEPA Filter'
    },
    {
      id: 8,
      kode: 'INST-AS-001',
      nama: 'Climate Chamber ASLT (45°C / 75% RH)',
      model: 'Binder KBF 240',
      serial: 'SN-BND-3091',
      lab: 'Sensory & ASLT',
      status: 'Operasional',
      lastCal: '01-09-2026',
      dueCal: '01-09-2027',
      vendor: 'PT Binder Lab Indonesia',
      cert: 'CAL-BND-2026/778'
    },
    {
      id: 9,
      kode: 'INST-AS-002',
      nama: 'Water Activity Meter (aw Analyzer)',
      model: 'Novasina LabMaster-aw neo',
      serial: 'SN-NVS-8803',
      lab: 'Sensory & ASLT',
      status: 'Operasional',
      lastCal: '22-08-2026',
      dueCal: '22-08-2027',
      vendor: 'PT Novasina Indo',
      cert: 'CAL-NVS-2026/190'
    },
    {
      id: 10,
      kode: 'INST-AS-003',
      nama: 'Oxygen Transmission Rate (O2TR)',
      model: 'Mocon OX-TRAN 2/22',
      serial: 'SN-MCN-9901',
      lab: 'Sensory & ASLT',
      status: 'Operasional',
      lastCal: '14-06-2026',
      dueCal: '14-06-2027',
      vendor: 'Mocon Lab',
      cert: 'CAL-MCN-2026/410'
    }
  ];

  function renderTable() {
    var tbody = document.getElementById('alatTableBody');
    if (!tbody) return;

    var searchVal = (document.getElementById('searchAlatInput')?.value || '').toLowerCase().trim();
    var labFilter = document.getElementById('filterLabAlat')?.value || '';
    var statusFilter = document.getElementById('filterStatusAlat')?.value || '';

    var filtered = ALAT_DATA.filter(function (item) {
      var matchSearch = !searchVal || item.nama.toLowerCase().includes(searchVal) || item.kode.toLowerCase().includes(searchVal) || item.model.toLowerCase().includes(searchVal) || item.serial.toLowerCase().includes(searchVal);
      var matchLab = !labFilter || item.lab === labFilter;
      var matchStatus = !statusFilter || item.status === statusFilter;
      return matchSearch && matchLab && matchStatus;
    });

    tbody.innerHTML = filtered.map(function (item, idx) {
      var statusBadge = item.status === 'Operasional'
        ? '<span class="badge bg-success-transparent"><i class="ri-checkbox-circle-line"></i> Operasional</span>'
        : (item.status === 'Out of Service'
          ? '<span class="badge bg-danger-transparent"><i class="ri-close-circle-line"></i> Out of Service</span>'
          : '<span class="badge bg-warning-transparent"><i class="ri-tools-line"></i> Maintenance</span>');

      var isDueWarning = item.dueCal.includes('< 30 Hari') || item.dueCal.includes('Expired');
      var dueClass = isDueWarning ? 'text-danger fw-semibold' : 'text-secondary';

      return '<tr>' +
        '<td class="text-muted">' + (idx + 1) + '</td>' +
        '<td><div class="fw-semibold">' + item.nama + '</div><small class="text-muted font-monospace">' + item.kode + '</small></td>' +
        '<td><div>' + item.model + '</div><small class="text-muted font-monospace">' + item.serial + '</small></td>' +
        '<td><span class="badge bg-light text-muted border">' + item.lab + '</span></td>' +
        '<td>' + statusBadge + '</td>' +
        '<td class="font-monospace small">' + item.lastCal + '</td>' +
        '<td class="font-monospace small ' + dueClass + '">' + item.dueCal + '</td>' +
        '<td><div class="small">' + item.cert + '</div><small class="text-muted">' + item.vendor + '</small></td>' +
        '<td class="text-center">' +
        '<div class="btn-group btn-group-sm">' +
        '<button type="button" class="btn btn-outline-secondary" title="Edit Alat"><i class="ri-edit-line"></i></button>' +
        '<button type="button" class="btn btn-outline-primary" title="Log Servis & Kalibrasi"><i class="ri-file-list-3-line"></i></button>' +
        '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    var elTotal = document.getElementById('kpiTotalAlat');
    if (elTotal) elTotal.textContent = ALAT_DATA.length + ' Unit';
    var elOp = document.getElementById('kpiOperasional');
    if (elOp) elOp.textContent = ALAT_DATA.filter(function (x) { return x.status === 'Operasional'; }).length + ' Unit';
    var elOos = document.getElementById('kpiOos');
    if (elOos) elOos.textContent = ALAT_DATA.filter(function (x) { return x.status !== 'Operasional'; }).length + ' Unit';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderTable();

    document.getElementById('searchAlatInput')?.addEventListener('input', renderTable);
    document.getElementById('filterLabAlat')?.addEventListener('change', renderTable);
    document.getElementById('filterStatusAlat')?.addEventListener('change', renderTable);

    document.getElementById('formAddAlat')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var nama = document.getElementById('alatNama').value;
      var kode = document.getElementById('alatKode').value;
      var model = document.getElementById('alatModel').value;
      var serial = document.getElementById('alatSerial').value || 'SN-UNKNOWN';
      var lab = document.getElementById('alatLab').value;
      var status = document.getElementById('alatStatus').value;
      var lastCal = document.getElementById('alatCalDate').value;
      var dueCal = document.getElementById('alatDueDate').value;
      var cert = document.getElementById('alatCert').value || '-';

      ALAT_DATA.unshift({
        id: ALAT_DATA.length + 1,
        kode: kode,
        nama: nama,
        model: model,
        serial: serial,
        lab: lab,
        status: status,
        lastCal: lastCal,
        dueCal: dueCal,
        vendor: 'Internal / Vendor',
        cert: cert
      });

      renderTable();
      var modalEl = document.getElementById('modalAddAlat');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      this.reset();
      alert('Instrumen alat ' + nama + ' berhasil didaftarkan ke inventaris lab!');
    });
  });
})();
