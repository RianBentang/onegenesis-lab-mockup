/* ---------- Kaji Ulang & SPK — tab of internalForm.html (Lab Administrator only) ----------
   InternalReviewTab.render(container, record, { toast, onIssued(record) })
   Opens once the request has passed approval (step "Review & SPK"); issuing the SPK moves the
   request to Labeling. After that the tab shows the review read-only. */
function generateSpkNo() {
  var now = new Date();
  var ym = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  var seq = String(Math.floor(Math.random() * 90) + 10);
  return 'SPK/LAB/' + ym + '/00' + seq;
}

window.InternalReviewTab = {
  render: function (container, record, opts) {
    opts = opts || {};

    if (!record || record.step === 'Draft' || record.step === 'Approval') {
      container.innerHTML =
        '<div class="card custom-card"><div class="card-body text-center py-5">' +
        '<i class="ri-lock-line fs-24 text-muted"></i>' +
        '<div class="fw-semibold mt-2">Kaji Ulang Belum Tersedia</div>' +
        '<p class="text-muted fs-13 mb-0">Kaji ulang teknis &amp; penerbitan SPK dibuka setelah pengajuan selesai di-approve.</p>' +
        '</div></div>';
      return;
    }

    var issued = !!record.spk;
    container.innerHTML =
      '<form id="reviewSpkForm">' +
      '<div class="card custom-card">' +
        '<div class="card-body">' +
          '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">' +
            '<h6 class="fw-semibold mb-0">Kaji Ulang Teknis &amp; Penerbitan SPK</h6>' +
            (issued ? '<span class="badge bg-success-transparent"><i class="ri-checkbox-circle-line me-1"></i>SPK terbit: <span class="font-monospace">' + record.spk + '</span></span>' : '') +
          '</div>' +
          '<div class="row g-3">' +
            '<div class="col-12 col-md-4">' +
              '<label class="form-label">Hasil Kaji Ulang Teknis <span class="text-danger">*</span></label>' +
              '<select id="hasilKajiUlang" class="form-select" required>' +
                '<option value="">-- Pilih --</option>' +
                '<option value="Diterima Full">Diterima Full</option>' +
                '<option value="Diterima Parsial">Diterima Parsial</option>' +
                '<option value="Ditolak">Ditolak</option>' +
              '</select>' +
            '</div>' +
            '<div class="col-12 col-md-4">' +
              '<label class="form-label">Penunjukan Analis <span class="text-danger">*</span></label>' +
              '<select id="penunjukanAnalis" class="form-select" required>' +
                '<option value="">-- Pilih Analis --</option>' +
                MASTER_ANALIS.map(function (n) { return '<option value="' + n + '">' + n + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
            '<div class="col-12 col-md-4">' +
              '<label class="form-label">Est. Tanggal Selesai Uji <span class="text-danger">*</span></label>' +
              '<div class="input-group">' +
                '<input type="text" id="estSelesai" class="form-control" placeholder="Pilih tanggal" required />' +
                '<span class="input-group-text"><i class="ri-calendar-line"></i></span>' +
              '</div>' +
            '</div>' +
            '<div class="col-12" id="wrapCatatanKajiUlang" style="display:none;">' +
              '<label class="form-label">Catatan Kaji Ulang <span class="text-danger">*</span></label>' +
              '<textarea id="catatanKajiUlang" class="form-control" rows="2" placeholder="Wajib diisi jika hasil Ditolak / Diterima Parsial"></textarea>' +
            '</div>' +
          '</div>' +
        '</div>' +
        (issued ? '' :
          '<div class="card-footer d-flex justify-content-end">' +
            '<button type="button" id="btnIssueSpk" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-file-check-line"></i> Terima &amp; Terbit SPK</button>' +
          '</div>') +
      '</div>' +
      '</form>';

    var form = container.querySelector('#reviewSpkForm');
    var hasilSelect = container.querySelector('#hasilKajiUlang');
    var analisSelect = container.querySelector('#penunjukanAnalis');
    var estInput = container.querySelector('#estSelesai');
    var wrapCatatan = container.querySelector('#wrapCatatanKajiUlang');
    var catatanEl = container.querySelector('#catatanKajiUlang');

    if (record.hasilKajiUlang) hasilSelect.value = record.hasilKajiUlang;
    if (record.analis) analisSelect.value = record.analis;
    if (record.catatanKajiUlang) catatanEl.value = record.catatanKajiUlang;

    var estFp = window.flatpickr ? window.flatpickr(estInput, { dateFormat: 'd-m-Y', clickOpens: !issued }) : null;
    if (record.estSelesai) { if (estFp) estFp.setDate(record.estSelesai, true, 'd-m-Y'); else estInput.value = record.estSelesai; }

    /* Hasil Kaji Ulang → Catatan required for Ditolak / Diterima Parsial */
    function toggleCatatan() {
      var needs = hasilSelect.value === 'Ditolak' || hasilSelect.value === 'Diterima Parsial';
      wrapCatatan.style.display = needs ? '' : 'none';
      catatanEl.required = needs;
      if (!needs && !issued) catatanEl.value = '';
    }
    toggleCatatan();
    hasilSelect.addEventListener('change', toggleCatatan);

    if (issued) {
      form.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = true; });
      return;
    }

    container.querySelector('#btnIssueSpk').addEventListener('click', function () {
      if (form.checkValidity() === false) { form.reportValidity(); return; }
      var spkNo = generateSpkNo();
      var updated = updateRequest(record.id, {
        spk: spkNo,
        hasilKajiUlang: hasilSelect.value,
        catatanKajiUlang: catatanEl.value,
        analis: analisSelect.value,
        estSelesai: estInput.value,
        step: 'Labeling'
      });
      if (opts.toast) opts.toast('SPK "' + spkNo + '" terbit untuk ' + record.id + '. Lanjut ke Labeling.');
      if (opts.onIssued) opts.onIssued(updated);
    });
  }
};
