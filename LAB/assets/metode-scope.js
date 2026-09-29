/**
 * Master Metode & Scope Uji ISO 17025 Logic
 * HOLABSYS System
 */

(function () {
  'use strict';

  var PARAMETER_DATA = [
    { code: 'PARAM-FK-01', name: 'Moisture (Kadar Air)', lab: 'Fisika Kimia', method: 'SNI 2897:2008', scope: true, leadTime: 2, suhu: 'Ambient Temp', unit: '% b/b', spec: 'Maks. 3.0 %' },
    { code: 'PARAM-FK-02', name: 'Kadar Lemak (Fat)', lab: 'Fisika Kimia', method: 'IK-LAB-02 (Soxhlet)', scope: true, leadTime: 2, suhu: 'Ambient Temp', unit: '% b/b', spec: '18.0 - 22.0 %' },
    { code: 'PARAM-FK-03', name: 'FFA (Free Fatty Acid)', lab: 'Fisika Kimia', method: 'AOAC 940.28', scope: true, leadTime: 1, suhu: 'Ambient Temp', unit: '% b/b', spec: 'Maks. 0.5 %' },
    { code: 'PARAM-FK-04', name: 'Kadar Protein (Kjeldahl)', lab: 'Fisika Kimia', method: 'IK-LAB-05', scope: true, leadTime: 2, suhu: 'Ambient Temp', unit: '% b/b', spec: 'Min. 8.0 %' },
    { code: 'PARAM-FK-05', name: 'Kadar Abu (Ash Content)', lab: 'Fisika Kimia', method: 'SNI 01-2891-1992', scope: true, leadTime: 2, suhu: 'Ambient Temp', unit: '% b/b', spec: 'Maks. 2.0 %' },
    { code: 'PARAM-FK-06', name: 'Cemaran Logam Timbal (Pb)', lab: 'Fisika Kimia', method: 'AOAC 999.11 (AAS)', scope: false, leadTime: 4, suhu: 'Frozen (-18°C)', unit: 'mg/kg', spec: 'Maks. 0.5 mg/kg' },
    { code: 'PARAM-MB-01', name: 'Salmonella sp.', lab: 'Mikrobiologi', method: 'SNI ISO 6579:2015', scope: true, leadTime: 5, suhu: 'Cool (2-8°C)', unit: '/25g', spec: 'Negatif / 25g' },
    { code: 'PARAM-MB-02', name: 'Angka Lempeng Total (ALT / TPC)', lab: 'Mikrobiologi', method: 'SNI 2897:2008', scope: false, leadTime: 3, suhu: 'Cool (2-8°C)', unit: 'CFU/g', spec: 'Maks. 1 x 10⁴ CFU/g' },
    { code: 'PARAM-MB-03', name: 'Kapang dan Khamir (Yeast & Mold)', lab: 'Mikrobiologi', method: 'ISO 21527-2', scope: true, leadTime: 5, suhu: 'Cool (2-8°C)', unit: 'CFU/g', spec: 'Maks. 1 x 10² CFU/g' },
    { code: 'PARAM-MB-04', name: 'Coliform & E. coli', lab: 'Mikrobiologi', method: 'SNI ISO 4832:2012', scope: true, leadTime: 3, suhu: 'Cool (2-8°C)', unit: 'APM/g', spec: '< 3 APM/g' },
    { code: 'PARAM-SN-01', name: 'Uji Sensori Afektif (Hedonik Rating)', lab: 'Sensory', method: 'IK-LAB-SN-01 (ISO 4121)', scope: false, leadTime: 1, suhu: 'Ambient Temp', unit: 'Skala 1-9', spec: 'Rata-rata >= 7.0' },
    { code: 'PARAM-SN-02', name: 'Uji Triangle Test (Pembeda)', lab: 'Sensory', method: 'ISO 4120:2004', scope: false, leadTime: 1, suhu: 'Ambient Temp', unit: 'Poin Pembeda', spec: 'Poin 3 (Valid)' },
    { code: 'PARAM-AS-01', name: 'Umur Simpan Model Arrhenius (Kritis)', lab: 'ASLT', method: 'IK-LAB-AS-01 (Labuza 1982)', scope: false, leadTime: 30, suhu: 'Ambient Temp', unit: 'Bulan', spec: 'Min. 12 Bulan' },
    { code: 'PARAM-AS-02', name: 'Kadar Air Kritis (AW & Sorpsi Isoterm)', lab: 'ASLT', method: 'IK-LAB-AS-02', scope: true, leadTime: 14, suhu: 'Cool (2-8°C)', unit: 'aw', spec: 'aw < 0.60' }
  ];

  function renderTable() {
    var tbody = document.getElementById('paramTableBody');
    if (!tbody) return;

    var searchVal = (document.getElementById('searchParamInput')?.value || '').toLowerCase().trim();
    var labFilter = document.getElementById('filterLabSelect')?.value || '';
    var scopeFilter = document.getElementById('filterScopeSelect')?.value || '';

    var filtered = PARAMETER_DATA.filter(function (item) {
      var matchSearch = !searchVal || item.name.toLowerCase().includes(searchVal) || item.method.toLowerCase().includes(searchVal) || item.code.toLowerCase().includes(searchVal);
      var matchLab = !labFilter || item.lab === labFilter;
      var matchScope = !scopeFilter || (scopeFilter === 'In-Scope' ? item.scope : !item.scope);
      return matchSearch && matchLab && matchScope;
    });

    tbody.innerHTML = filtered.map(function (item, idx) {
      var scopeBadge = item.scope
        ? '<span class="badge bg-success-transparent"><i class="ri-check-line"></i> In-Scope (KAN)</span>'
        : '<span class="badge bg-secondary-transparent">Non-Scope</span>';

      return '<tr>' +
        '<td class="text-muted">' + (idx + 1) + '</td>' +
        '<td><div class="fw-semibold">' + item.name + '</div><small class="text-muted font-monospace">' + item.code + '</small></td>' +
        '<td><span class="badge bg-light text-dark">' + item.lab + '</span></td>' +
        '<td><code class="text-dark font-monospace fw-semibold">' + item.method + '</code></td>' +
        '<td>' + scopeBadge + '</td>' +
        '<td class="font-monospace">' + item.leadTime + ' Hari</td>' +
        '<td><span class="badge bg-light text-muted border">' + item.suhu + '</span></td>' +
        '<td><div>' + (item.spec || '-') + '</div><small class="text-muted font-monospace">' + item.unit + '</small></td>' +
        '<td class="text-center">' +
        '<div class="btn-group btn-group-sm">' +
        '<button type="button" class="btn btn-outline-secondary" title="Edit"><i class="ri-edit-line"></i></button>' +
        '<button type="button" class="btn btn-outline-danger" title="Hapus"><i class="ri-delete-bin-line"></i></button>' +
        '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    var elTotal = document.getElementById('kpiTotalParam');
    if (elTotal) elTotal.textContent = PARAMETER_DATA.length;
    var elIn = document.getElementById('kpiInScope');
    if (elIn) elIn.textContent = PARAMETER_DATA.filter(function (x) { return x.scope; }).length + ' Parameter';
    var elNon = document.getElementById('kpiNonScope');
    if (elNon) elNon.textContent = PARAMETER_DATA.filter(function (x) { return !x.scope; }).length + ' Parameter';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderTable();

    document.getElementById('searchParamInput')?.addEventListener('input', renderTable);
    document.getElementById('filterLabSelect')?.addEventListener('change', renderTable);
    document.getElementById('filterScopeSelect')?.addEventListener('change', renderTable);

    document.getElementById('formAddParam')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('paramName').value;
      var lab = document.getElementById('paramLab').value;
      var method = document.getElementById('paramMethod').value;
      var scope = document.getElementById('paramScope').value === 'true';
      var leadTime = parseInt(document.getElementById('paramLeadTime').value, 10) || 2;
      var suhu = document.getElementById('paramSuhu').value;
      var unit = document.getElementById('paramUnit').value || '%';
      var spec = document.getElementById('paramSpec').value || '-';

      PARAMETER_DATA.unshift({
        code: 'PARAM-NEW-' + Math.floor(10 + Math.random() * 90),
        name: name,
        lab: lab,
        method: method,
        scope: scope,
        leadTime: leadTime,
        suhu: suhu,
        unit: unit,
        spec: spec
      });

      renderTable();
      var modalEl = document.getElementById('modalAddParam');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      this.reset();
      alert('Parameter "' + name + '" berhasil ditambahkan ke master scope!');
    });
  });
})();
