/**
 * Master Log Akomodasi & Lingkungan Uji Logic
 * HOLABSYS ISO 17025 System (Klausul 6.3)
 */

(function () {
  'use strict';

  var LOG_DATA = [
    {
      id: 1,
      waktu: '23-09-2026 10:00',
      ruang: 'Ruang Instrumen Fisika Kimia',
      suhu: 22.1,
      suhuStd: '20.0 - 25.0 °C',
      rh: 56.4,
      rhStd: '<= 65 % RH',
      status: 'In-Spec',
      sensor: 'Sensor IoT Telemetry (Room 101)',
      pic: 'Auto IoT',
      catatan: 'Kondisi ruang instrumen stabil.'
    },
    {
      id: 2,
      waktu: '23-09-2026 10:00',
      ruang: 'Ruang Timbang Analitik',
      suhu: 21.8,
      suhuStd: '20.0 - 22.0 °C',
      rh: 68.2,
      rhStd: '<= 55 % RH',
      status: 'Out-of-Spec',
      sensor: 'Thermohygrometer Digital (Manual)',
      pic: 'Galih Saputra',
      catatan: 'RH melebihi batas 55%. Dehumidifier dinyalakan.'
    },
    {
      id: 3,
      waktu: '23-09-2026 09:30',
      ruang: 'Ruang Inokulasi Mikrobiologi',
      suhu: 23.2,
      suhuStd: '22.0 - 25.0 °C',
      rh: 54.0,
      rhStd: '<= 60 % RH',
      status: 'In-Spec',
      sensor: 'Sensor IoT Telemetry (Room 104)',
      pic: 'Auto IoT',
      catatan: 'Tekanan positif ruang laminar normal.'
    },
    {
      id: 4,
      waktu: '23-09-2026 09:00',
      ruang: 'Chamber ASLT (45°C / 75% RH)',
      suhu: 45.1,
      suhuStd: '45.0 ± 1.0 °C',
      rh: 74.8,
      rhStd: '75.0 ± 3.0 % RH',
      status: 'In-Spec',
      sensor: 'Sensor Internal Binder KBF 240',
      pic: 'Putri Ayuningtyas',
      catatan: 'Pengamatan batch ASLT Chocolatos hari ke-14.'
    },
    {
      id: 5,
      waktu: '23-09-2026 09:00',
      ruang: 'Chamber ASLT (35°C / 70% RH)',
      suhu: 34.9,
      suhuStd: '35.0 ± 1.0 °C',
      rh: 70.2,
      rhStd: '70.0 ± 3.0 % RH',
      status: 'In-Spec',
      sensor: 'Sensor Internal Binder KBF 115',
      pic: 'Putri Ayuningtyas',
      catatan: 'Pengamatan batch ASLT Wafer Cone hari ke-30.'
    },
    {
      id: 6,
      waktu: '23-09-2026 08:30',
      ruang: 'Sensory Testing Booth',
      suhu: 22.8,
      suhuStd: '22.0 - 24.0 °C',
      rh: 58.5,
      rhStd: 'Ambient RH',
      status: 'In-Spec',
      sensor: 'Sensor IoT Telemetry (Sensory Lab)',
      pic: 'Auto IoT',
      catatan: 'Pencahayaan booth dan sirkulasi udara siap uji panelis.'
    }
  ];

  function renderTable() {
    var tbody = document.getElementById('logTableBody');
    if (!tbody) return;

    var searchVal = (document.getElementById('searchLogInput')?.value || '').toLowerCase().trim();
    var ruangFilter = document.getElementById('filterRuangSelect')?.value || '';
    var statusFilter = document.getElementById('filterStatusLog')?.value || '';

    var filtered = LOG_DATA.filter(function (item) {
      var matchSearch = !searchVal || item.ruang.toLowerCase().includes(searchVal) || item.pic.toLowerCase().includes(searchVal) || item.sensor.toLowerCase().includes(searchVal);
      var matchRuang = !ruangFilter || item.ruang === ruangFilter;
      var matchStatus = !statusFilter || item.status === statusFilter;
      return matchSearch && matchRuang && matchStatus;
    });

    tbody.innerHTML = filtered.map(function (item, idx) {
      var statusBadge = item.status === 'In-Spec'
        ? '<span class="badge bg-success-transparent"><i class="ri-checkbox-circle-line"></i> In-Spec (Normal)</span>'
        : '<span class="badge bg-danger-transparent"><i class="ri-alert-line"></i> Out-of-Spec (Alert)</span>';

      var tempColor = item.status === 'Out-of-Spec' && item.rh > 65 ? 'text-danger fw-semibold' : 'text-dark';

      return '<tr>' +
        '<td class="text-muted">' + (idx + 1) + '</td>' +
        '<td class="font-monospace small">' + item.waktu + '</td>' +
        '<td><div class="fw-semibold">' + item.ruang + '</div></td>' +
        '<td class="font-monospace fw-semibold ' + tempColor + '">' + item.suhu + ' °C</td>' +
        '<td class="font-monospace small text-muted">' + item.suhuStd + '</td>' +
        '<td class="font-monospace fw-semibold ' + tempColor + '">' + item.rh + ' %</td>' +
        '<td class="font-monospace small text-muted">' + item.rhStd + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td><div class="small">' + item.sensor + '</div><small class="text-muted">' + item.pic + '</small></td>' +
        '<td class="small">' + item.catatan + '</td>' +
        '</tr>';
    }).join('');

    var elAlert = document.getElementById('kpiAlertCount');
    if (elAlert) elAlert.textContent = LOG_DATA.filter(function (x) { return x.status === 'Out-of-Spec'; }).length + ' Titik';
    var elNorm = document.getElementById('kpiNormalCount');
    if (elNorm) elNorm.textContent = LOG_DATA.filter(function (x) { return x.status === 'In-Spec'; }).length + ' Titik';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderTable();

    document.getElementById('searchLogInput')?.addEventListener('input', renderTable);
    document.getElementById('filterRuangSelect')?.addEventListener('change', renderTable);
    document.getElementById('filterStatusLog')?.addEventListener('change', renderTable);

    document.getElementById('formAddLog')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var ruang = document.getElementById('logRuangan').value;
      var waktu = document.getElementById('logWaktu').value;
      var suhu = parseFloat(document.getElementById('logSuhu').value) || 22.0;
      var rh = parseFloat(document.getElementById('logRh').value) || 55.0;
      var sensor = document.getElementById('logSensor').value;
      var pic = document.getElementById('logPic').value || 'Budi Santoso';
      var catatan = document.getElementById('logCatatan').value || 'Pencatatan manual lingkungan uji.';

      var isAlert = (ruang.includes('Timbang') && rh > 55) || (ruang.includes('Instrumen') && (suhu > 25 || rh > 65));

      LOG_DATA.unshift({
        id: LOG_DATA.length + 1,
        waktu: waktu,
        ruang: ruang,
        suhu: suhu,
        suhuStd: '20.0 - 25.0 °C',
        rh: rh,
        rhStd: '<= 65 % RH',
        status: isAlert ? 'Out-of-Spec' : 'In-Spec',
        sensor: sensor,
        pic: pic,
        catatan: catatan
      });

      renderTable();
      var modalEl = document.getElementById('modalAddLog');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      this.reset();
      alert('Data log lingkungan untuk "' + ruang + '" berhasil disimpan!');
    });
  });
})();
