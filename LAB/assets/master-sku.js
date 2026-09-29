/**
 * Master SKU & Produk Logic
 * HOLABSYS System
 */

(function () {
  'use strict';

  var SKU_DATA = [
    {
      id: 1,
      kode: 'SKU-WCG-001',
      nama: 'WCG - Wafer Cone Gourmet Vanilla 120g',
      brand: 'WCG',
      kategori: 'Biskuit & Wafer',
      kemasan: 'Pouch Alufo',
      netto: '120g',
      spec: 'Kadar Air <= 2.5%, Fat 19.5-22.0%, ALT < 1x10⁴ CFU/g',
      status: 'Aktif'
    },
    {
      id: 2,
      kode: 'SKU-WCG-002',
      nama: 'WCG - Wafer Cone Chocolate Cream 120g',
      brand: 'WCG',
      kategori: 'Biskuit & Wafer',
      kemasan: 'Pouch Alufo',
      netto: '120g',
      spec: 'Kadar Air <= 2.8%, Fat 20.0-23.0%, Salmonella Negatif/25g',
      status: 'Aktif'
    },
    {
      id: 3,
      kode: 'SKU-MACO-001',
      nama: 'MACO - Chocolate Wafer & Cream 120g',
      brand: 'MACO',
      kategori: 'Biskuit & Wafer',
      kemasan: 'Pouch Alufo',
      netto: '120g',
      spec: 'Kadar Air <= 3.0%, Fat 18.0-22.0%, Protein min. 8.0%',
      status: 'Aktif'
    },
    {
      id: 4,
      kode: 'SKU-CHOC-001',
      nama: 'Chocolatos Drink Sachet Chocolate 28g',
      brand: 'Chocolatos',
      kategori: 'Minuman Susu',
      kemasan: 'Pouch Alufo Sachet',
      netto: '28g',
      spec: 'Kadar Air <= 3.5%, FFA <= 0.3%, Coliform < 3 APM/g',
      status: 'Aktif'
    },
    {
      id: 5,
      kode: 'SKU-CHOC-002',
      nama: 'Chocolatos Wafer Stick Original 16g',
      brand: 'Chocolatos',
      kategori: 'Biskuit & Wafer',
      kemasan: 'Plastik Pillow Pack',
      netto: '16g',
      spec: 'Kadar Air <= 2.0%, Fat 22.0-25.0%, Organoleptik Valid',
      status: 'Aktif'
    },
    {
      id: 6,
      kode: 'SKU-GERY-001',
      nama: 'Gery Saluut Malkist Sweet Cheese 110g',
      brand: 'Gery',
      kategori: 'Biskuit & Wafer',
      kemasan: 'Plastik Pillow Pack',
      netto: '110g',
      spec: 'Kadar Air <= 2.5%, Fat 24.0-27.0%, TPC < 1x10⁴ CFU/g',
      status: 'Aktif'
    },
    {
      id: 7,
      kode: 'SKU-GERY-002',
      nama: 'Gery Saluut Kacang 18g',
      brand: 'Gery',
      kategori: 'Kacang & Snack',
      kemasan: 'Karton Box Display',
      netto: '18g',
      spec: 'Kadar Air <= 2.0%, FFA <= 0.5%, Aflatoksin < 20 ppb',
      status: 'Aktif'
    },
    {
      id: 8,
      kode: 'SKU-SLAI-001',
      nama: 'Slai O Lai Blueberry Biskuit 32g',
      brand: 'Slai O Lai',
      kategori: 'Biskuit & Wafer',
      kemasan: 'Plastik Flow Pack',
      netto: '32g',
      spec: 'Kadar Air <= 3.2%, Jam Brix min. 68%, Kapang < 1x10²',
      status: 'Aktif'
    },
    {
      id: 9,
      kode: 'SKU-PILUS-001',
      nama: 'Garuda Pilus Rasa Mie Goreng 85g',
      brand: 'Garuda Pilus',
      kategori: 'Makanan Ringan',
      kemasan: 'Pillow Pack Pillow Bag',
      netto: '85g',
      spec: 'Kadar Air <= 2.0%, Fat <= 28.0%, FFA <= 0.8%',
      status: 'Aktif'
    },
    {
      id: 10,
      kode: 'SKU-PILUS-002',
      nama: 'Garuda Pilus Rasa Rumput Laut 85g',
      brand: 'Garuda Pilus',
      kategori: 'Makanan Ringan',
      kemasan: 'Pillow Pack Pillow Bag',
      netto: '85g',
      spec: 'Kadar Air <= 2.0%, Fat <= 28.0%, Organoleptik Standard',
      status: 'Aktif'
    }
  ];

  function renderTable() {
    var tbody = document.getElementById('skuTableBody');
    if (!tbody) return;

    var searchVal = (document.getElementById('searchSkuInput')?.value || '').toLowerCase().trim();
    var brandFilter = document.getElementById('filterBrandSku')?.value || '';
    var katFilter = document.getElementById('filterKategoriSku')?.value || '';

    var filtered = SKU_DATA.filter(function (item) {
      var matchSearch = !searchVal || item.nama.toLowerCase().includes(searchVal) || item.kode.toLowerCase().includes(searchVal);
      var matchBrand = !brandFilter || item.brand === brandFilter;
      var matchKat = !katFilter || item.kategori === katFilter;
      return matchSearch && matchBrand && matchKat;
    });

    tbody.innerHTML = filtered.map(function (item, idx) {
      return '<tr>' +
        '<td class="text-muted">' + (idx + 1) + '</td>' +
        '<td><div class="fw-semibold">' + item.nama + '</div><small class="text-muted font-monospace">' + item.kode + '</small></td>' +
        '<td><span class="badge bg-light text-primary border">' + item.brand + '</span></td>' +
        '<td>' + item.kategori + '</td>' +
        '<td>' + item.kemasan + '</td>' +
        '<td class="font-monospace small">' + item.netto + '</td>' +
        '<td><small class="text-muted">' + item.spec + '</small></td>' +
        '<td><span class="badge bg-success-transparent"><i class="ri-check-line"></i> Aktif</span></td>' +
        '<td class="text-center">' +
        '<div class="btn-group btn-group-sm">' +
        '<button type="button" class="btn btn-outline-secondary" title="Edit SKU"><i class="ri-edit-line"></i></button>' +
        '<button type="button" class="btn btn-outline-primary" title="Spesifikasi Mutu"><i class="ri-survey-line"></i></button>' +
        '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    var elTotal = document.getElementById('kpiTotalSku');
    if (elTotal) elTotal.textContent = SKU_DATA.length + ' SKU';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderTable();

    document.getElementById('searchSkuInput')?.addEventListener('input', renderTable);
    document.getElementById('filterBrandSku')?.addEventListener('change', renderTable);
    document.getElementById('filterKategoriSku')?.addEventListener('change', renderTable);

    document.getElementById('formAddSku')?.addEventListener('submit', function (e) {
      e.preventDefault();
      var nama = document.getElementById('skuNama').value;
      var kode = document.getElementById('skuKode').value;
      var brand = document.getElementById('skuBrand').value;
      var kategori = document.getElementById('skuKategori').value;
      var kemasan = document.getElementById('skuKemasan').value;
      var netto = document.getElementById('skuNetto').value || '100g';
      var spec = document.getElementById('skuSpec').value || 'Kadar Air <= 3.0%';

      SKU_DATA.unshift({
        id: SKU_DATA.length + 1,
        kode: kode,
        nama: nama,
        brand: brand,
        kategori: kategori,
        kemasan: kemasan,
        netto: netto,
        spec: spec,
        status: 'Aktif'
      });

      renderTable();
      var modalEl = document.getElementById('modalAddSku');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      this.reset();
      alert('SKU produk "' + nama + '" berhasil didaftarkan!');
    });
  });
})();
