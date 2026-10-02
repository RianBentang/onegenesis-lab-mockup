/* ---------- Detail Alamat modal (eye button next to Alamat Pelanggan / Alamat Pabrik) ----------
   Markup next to an address select:
     <button type="button" class="btn btn-icon btn-primary-light btn-wave" data-address-for="alamatPelanggan">
   Clicking it opens one shared modal with the selected site's detail from MASTER_SITE_DETAIL
   (dummy-sites.js). Works when the form is locked, since it only reads. */
document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('[data-address-for]')) return;

  /* Modal (markup.md §11) */
  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<div class="modal fade" id="addressDetailModal" tabindex="-1" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered">' +
        '<div class="modal-content">' +
          '<div class="modal-header">' +
            '<h6 class="modal-title fw-semibold" id="addressDetailTitle">Detail Alamat</h6>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
          '</div>' +
          '<div class="modal-body" id="addressDetailBody"></div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn btn-sm btn-light" data-bs-dismiss="modal">Tutup</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap.firstChild);

  var modalEl = document.getElementById('addressDetailModal');
  var titleEl = document.getElementById('addressDetailTitle');
  var bodyEl = document.getElementById('addressDetailBody');

  function row(label, value) {
    return '<div class="col-4 text-muted fs-12">' + label + '</div><div class="col-8 fw-medium">' + (value || '-') + '</div>';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-address-for]');
    if (!btn) return;
    var select = document.getElementById(btn.dataset.addressFor);
    var labelEl = select && select.closest('[class*="col-"]') ? select.closest('[class*="col-"]').querySelector('.form-label') : null;
    var fieldLabel = labelEl ? labelEl.firstChild.textContent.trim() : 'Alamat';
    var site = select ? select.value : '';
    var d = (typeof MASTER_SITE_DETAIL !== 'undefined') ? MASTER_SITE_DETAIL[site] : null;

    titleEl.textContent = 'Detail ' + fieldLabel + (site ? ' — ' + site : '');
    if (!site) {
      bodyEl.innerHTML = '<div class="text-center text-muted py-3"><i class="ri-map-pin-line fs-24 d-block mb-1"></i>Pilih ' + fieldLabel + ' terlebih dahulu.</div>';
    } else if (!d) {
      bodyEl.innerHTML = '<div class="text-center text-muted py-3">Detail alamat untuk "' + site + '" belum ada di Master Data Site.</div>';
    } else {
      bodyEl.innerHTML =
        '<div class="d-flex align-items-center gap-2 mb-3">' +
          '<span class="avatar avatar-md bg-primary-transparent"><i class="ri-map-pin-2-line fs-18"></i></span>' +
          '<div><div class="fw-semibold">' + site + '</div><span class="badge bg-info-transparent">' + d.tipe + '</span></div>' +
        '</div>' +
        '<div class="row gy-2">' +
          row('Alamat', d.alamat) +
          row('Kota / Kab.', d.kota) +
          row('Provinsi', d.provinsi) +
          row('Kode Pos', d.kodePos) +
          row('PIC', d.pic) +
          row('Telepon', d.telp) +
          row('Email', d.email) +
        '</div>';
    }
    window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });
});
