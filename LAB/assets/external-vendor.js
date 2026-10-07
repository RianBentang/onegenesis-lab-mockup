/**
 * Master Vendor Lab Eksternal (Subkontrak) Logic
 * HOLABSYS System
 */

(function () {
  'use strict';

  var VENDOR_DATA = [
    {
      id: 1,
      kode: 'LAB-SIG',
      nama: 'PT Saraswanti Indo Genetech (SIG Laboratory)',
      kan: 'LP-184-IDN',
      kota: 'Bogor',
      alamat: 'Jl. Rasamala No. 20 Taman Yasmin, Bogor 16113',
      pic: 'Fajar Hidayat / cs@siglaboratory.com / (0251) 7532348',
      params: ['Clostridium botulinum', 'Aflatoksin Total (B1, B2, G1, G2)', 'Cemaran Timbal (Pb) & Merkuri (Hg)', 'Kandungan Vitamin & Asam Amino'],
      status: 'Aktif'
    },
    {
      id: 2,
      kode: 'LAB-TUV',
      nama: 'TUV NORD Indonesia',
      kan: 'LP-411-IDN',
      kota: 'Jakarta',
      alamat: 'Jl. Raya Babelan, Kawasan Industri Menara Permai, Bekasi / Jakarta Timur',
      pic: 'Dewi Lestari / food.id@tuv-nord.com / (021) 8945678',
      params: ['Pestisida Multiresidu (GC-MS/MS)', 'Logam Berat ICP-MS', 'Informasi Nilai Gizi Lengkap (BPOM MD)'],
      status: 'Aktif'
    },
    {
      id: 3,
      kode: 'LAB-SGS',
      nama: 'PT SGS Indonesia',
      kan: 'LP-002-IDN',
      kota: 'Jakarta',
      alamat: 'Cilandak Commercial Estate #108C, Jl. Raya Cilandak KKO, Jakarta Selatan',
      pic: 'Aditya Pratama / id.food@sgs.com / (021) 7818111',
      params: ['Pengujian Allergen (Gluten, Peanut, Milk)', 'Salmonella Serotyping', 'Microbiology Screening MD/P5'],
      status: 'Aktif'
    },
    {
      id: 4,
      kode: 'LAB-INTERTEK',
      nama: 'PT Intertek Utama Services',
      kan: 'LP-130-IDN',
      kota: 'Jakarta',
      alamat: 'Jl. Raya Bogor KM 28, Pasar Rebo, Jakarta Timur',
      pic: 'Bambang Irawan / food.indonesia@intertek.com / (021) 87794444',
      params: ['Uji Kemasan Food Contact (Migrasi Logam & Phthalate)', 'Barrier Permeability O2 & Moisture'],
      status: 'Aktif'
    },
    {
      id: 5,
      kode: 'LAB-ANGKASA',
      nama: 'PT Angler BioChemLab',
      kan: 'LP-505-IDN',
      kota: 'Tangerang',
      alamat: 'Kawasan Industri BSD Sektor XI Blok A1, Tangerang Selatan',
      pic: 'Maya Septiana / contact@anglerbiochem.com / (021) 7588001',
      params: ['Analisa DNA Halal (Porcine Real-time PCR)', 'Spesies Identification'],
      status: 'Aktif'
    }
  ];

  function renderTable() {
    var tbody = document.getElementById('vendorTableBody');
    if (!tbody) return;

    var searchVal = (document.getElementById('searchVendorInput')?.value || '').toLowerCase().trim();
    var kotaFilter = document.getElementById('filterKotaVendor')?.value || '';

    var filtered = VENDOR_DATA.filter(function (item) {
      var matchSearch = !searchVal || item.nama.toLowerCase().includes(searchVal) || item.kode.toLowerCase().includes(searchVal) || item.pic.toLowerCase().includes(searchVal);
      var matchKota = !kotaFilter || item.kota === kotaFilter;
      return matchSearch && matchKota;
    });

    var countEl = document.getElementById('countList'); // tab badge in the card header
    if (countEl) countEl.textContent = filtered.length;
    tbody.innerHTML = filtered.map(function (item, idx) {
      var paramBadges = item.params.map(function (p) {
        return '<span class="badge bg-light text-dark border me-1 mb-1 font-monospace" style="font-size:0.75rem;">' + p + '</span>';
      }).join('');

      return '<tr>' +
        '<td class="text-muted">' + (idx + 1) + '</td>' +
        '<td><div class="fw-semibold">' + item.nama + '</div><small class="text-muted font-monospace">' + item.kode + '</small></td>' +
        '<td><span class="badge bg-success-transparent font-monospace"><i class="ri-shield-check-line"></i> ' + item.kan + '</span></td>' +
        '<td><div class="fw-semibold">' + item.kota + '</div><small class="text-muted text-truncate d-block" style="max-width:220px;" title="' + item.alamat + '">' + item.alamat + '</small></td>' +
        '<td><div class="small">' + item.pic + '</div></td>' +
        '<td><div class="d-flex flex-wrap">' + paramBadges + '</div></td>' +
        '<td><span class="badge bg-success-transparent">Mitra Aktif</span></td>' +
        '<td class="text-center">' +
        '<div class="btn-group btn-group-sm">' +
        '<button type="button" class="btn btn-outline-secondary" title="Edit Data"><i class="ri-edit-line"></i></button>' +
        '<button type="button" class="btn btn-outline-primary" title="Lihat Profil & SLA"><i class="ri-external-link-line"></i></button>' +
        '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    var elTotal = document.getElementById('kpiTotalVendor');
    if (elTotal) elTotal.textContent = VENDOR_DATA.length + ' Laboratorium';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderTable();

    document.getElementById('searchVendorInput')?.addEventListener('input', renderTable);
    document.getElementById('filterKotaVendor')?.addEventListener('change', renderTable);

    document.getElementById('formAddVendor')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var nama = document.getElementById('vendorNama').value;
      var kode = document.getElementById('vendorKode').value;
      var kan = document.getElementById('vendorKan').value || 'LP-999-IDN';
      var kota = document.getElementById('vendorKota').value || 'Jakarta';
      var alamat = document.getElementById('vendorAlamat').value || 'Alamat Lab';
      var email = document.getElementById('vendorEmail').value || 'cs@lab.com';
      var telp = document.getElementById('vendorTelp').value || '-';
      var paramsStr = document.getElementById('vendorParams').value || 'Mikrobiologi, Fisika Kimia';
      var params = paramsStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean);

      VENDOR_DATA.unshift({
        id: VENDOR_DATA.length + 1,
        kode: kode,
        nama: nama,
        kan: kan,
        kota: kota,
        alamat: alamat,
        pic: 'PIC / ' + email + ' / ' + telp,
        params: params,
        status: 'Aktif'
      });

      renderTable();
      var modalEl = document.getElementById('modalAddVendor');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      this.reset();
      alert('Laboratorium mitra subkontrak "' + nama + '" berhasil didaftarkan!');
    });
  });
})();
