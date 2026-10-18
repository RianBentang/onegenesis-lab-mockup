/**
 * Master Vendor Lab Eksternal (Subkontrak) Logic
 * HOLABSYS System
 */

(function () {
  'use strict';

  /* One vendor master (EXTERNAL_VENDORS, dummy-requests.js): Subcontract Lab, External requests and
     invoices read the same list. Vendors added here stay in memory for the mockup session. */
  var VENDOR_DATA = EXTERNAL_VENDORS.map(function (v, i) { return Object.assign({ id: i + 1, status: 'Active' }, v); });

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
        return '<span class="badge bg-secondary-transparent me-1 mb-1 font-monospace">' + p + '</span>';
      }).join('');

      return '<tr>' +
        /* SpkTableActions */
        '<td><div class="d-flex gap-1">' +
        '<button type="button" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Edit Data"><i class="ri-edit-line"></i></button>' +
        '<button type="button" class="btn btn-icon btn-sm btn-primary-light btn-wave" title="View Profile & SLA"><i class="ri-external-link-line"></i></button>' +
        '</div></td>' +
        '<td class="text-muted">' + (idx + 1) + '</td>' +
        '<td><div class="fw-semibold">' + item.nama + '</div><small class="text-muted font-monospace">' + item.kode + '</small></td>' +
        (function () {
          var valid = !item.kanValidUntil || new Date(item.kanValidUntil + 'T23:59:59') >= new Date();
          var until = item.kanValidUntil ? new Date(item.kanValidUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
          return '<td><span class="badge ' + (valid ? 'bg-success-transparent' : 'bg-danger-transparent') + ' font-monospace"><i class="' + (valid ? 'ri-shield-check-line' : 'ri-shield-cross-line') + '"></i> ' + item.kan + '</span>' +
            '<div class="fs-11 ' + (valid ? 'text-muted' : 'text-danger fw-semibold') + ' mt-1">' + (valid ? 'Valid until ' : 'Expired ') + until + (valid ? '' : ' · not selectable as Subcontract Lab') + '</div></td>';
        })() +
        '<td><div class="fw-semibold">' + item.kota + '</div><small class="text-muted text-truncate d-block" style="max-width:220px;" title="' + item.alamat + '">' + item.alamat + '</small></td>' +
        '<td><div class="small">' + item.pic + '</div></td>' +
        '<td><div class="d-flex flex-wrap">' + paramBadges + '</div></td>' +
        '<td><span class="badge bg-success-transparent">Active Partner</span></td>' +
        '</tr>';
    }).join('');

    var elTotal = document.getElementById('kpiTotalVendor');
    if (elTotal) elTotal.textContent = VENDOR_DATA.length + ' Laboratories';
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
      var alamat = document.getElementById('vendorAlamat').value || 'Lab Address';
      var email = document.getElementById('vendorEmail').value || 'cs@lab.com';
      var telp = document.getElementById('vendorTelp').value || '-';
      var paramsStr = document.getElementById('vendorParams').value || 'Microbiology, Physicochemical';
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
        status: 'Active'
      });

      renderTable();
      var modalEl = document.getElementById('modalAddVendor');
      var modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      this.reset();
      ToastService.showSuccess('Subcontract partner laboratory "' + nama + '" registered!');
    });
  });
})();
