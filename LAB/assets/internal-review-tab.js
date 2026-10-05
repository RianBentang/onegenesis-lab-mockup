/* ---------- Kaji Ulang & SPK — tab of internalForm.html (Lab Administrator only) ----------
   InternalReviewTab.render(container, record, { toast, onIssued(record), onLabeled(record) })
   Opens once the request is Fully Approved (step "Review & SPK"). Issuing the SPK shows the
   Label Sampel section right below (sampleLabelsHtml, sample-label.js), printable; "Label
   Ditempel" hands the sample to the analyst. After the SPK the review itself is read-only. */
var REVIEW_TAB_STEPS = ['Review & SPK', 'Labeling', 'Selesai', 'Draft Report'];
function generateSpkNo() {
  var now = new Date();
  var ym = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0');
  var seq = String(Math.floor(Math.random() * 90) + 10);
  return 'SPK/LAB/' + ym + '/00' + seq;
}

window.InternalReviewTab = {
  render: function (container, record, opts) {
    opts = opts || {};

    if (!record || REVIEW_TAB_STEPS.indexOf(record.step) === -1) {
      container.innerHTML =
        '<div class="card custom-card"><div class="card-body text-center py-5">' +
        '<i class="ri-lock-line fs-24 text-muted"></i>' +
        '<div class="fw-semibold mt-2">Kaji Ulang Belum Tersedia</div>' +
        '<p class="text-muted fs-13 mb-0">Kaji ulang teknis &amp; penerbitan SPK dibuka setelah pengajuan Fully Approved.</p>' +
        '</div></div>';
      return;
    }

    var issued = !!record.spk;
    container.innerHTML =
      '<form id="reviewSpkForm" class="no-print">' +
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
      '</form>' +
      /* SpkFormSection: Label Sampel — appears as soon as the SPK is issued; printable */
      '<div class="card custom-card" id="labelSection">' + labelSectionHtml(record) + '</div>';

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

    var printBtn = container.querySelector('#btnPrintLabel');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
    var doneBtn = container.querySelector('#btnLabelDone');
    if (doneBtn) {
      doneBtn.addEventListener('click', function () {
        var updated = updateRequest(record.id, { step: 'Selesai', labeled: true });
        if (opts.toast) opts.toast('Label untuk ' + record.id + ' telah ditempel dan diserahkan ke analis.');
        if (opts.onLabeled) opts.onLabeled(updated);
      });
    }

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
      if (opts.toast) opts.toast('SPK "' + spkNo + '" berhasil diterbitkan untuk ' + record.id + '. Label sampel siap dicetak.');
      if (opts.onIssued) opts.onIssued(updated);
    });
  }
};

/* Label Sampel section body: locked until the SPK is issued */
function labelSectionHtml(record) {
  if (!record.spk) {
    return '<div class="card-body text-center py-4">' +
      '<i class="ri-lock-line fs-24 text-muted"></i>' +
      '<div class="fw-semibold mt-2">Label Belum Bisa Dicetak</div>' +
      '<p class="text-muted fs-13 mb-0">Label muncul otomatis setelah kaji ulang selesai &amp; SPK terbit.</p>' +
      '</div>';
  }
  var labels = sampleLabelsHtml(record);
  return '<div class="card-body">' +
    '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 no-print">' +
      '<div>' +
        '<h6 class="fw-semibold mb-0">Label Sampel <span class="text-muted fw-normal">(' + labels.length + ')</span></h6>' +
        '<p class="text-muted fs-12 mb-0">Ukuran label 50 &times; 30 mm &middot; QR berisi ID sampel unik (Kl. 7.4)</p>' +
      '</div>' +
      '<div class="d-flex align-items-center flex-wrap gap-2">' +
        (record.labeled ? '<span class="badge bg-success-transparent"><i class="ri-check-line me-1"></i>Sudah diserahkan ke analis</span>' : '') +
        '<div style="width:190px;"><select id="printFormat" class="form-select form-select-sm">' +
          '<option>Zebra ZD230 (50&times;30)</option><option>A4 &mdash; 3&times;7 label</option><option>PDF</option>' +
        '</select></div>' +
        '<button type="button" id="btnPrintLabel" class="btn btn-sm btn-light btn-wave d-inline-flex align-items-center gap-1"><i class="ri-printer-line"></i> Cetak Label</button>' +
        (record.step === 'Labeling' ? '<button type="button" id="btnLabelDone" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-check-line"></i> Label Ditempel &mdash; Serahkan ke Analis</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="label-sheet">' + labels.join('') + '</div>' +
    '</div>';
}
