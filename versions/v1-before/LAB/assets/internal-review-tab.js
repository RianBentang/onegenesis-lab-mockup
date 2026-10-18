/* ---------- Technical Review & SPK — tab of internalForm.html (Lab Coordinator, CRL, only) ----------
   InternalReviewTab.render(container, record, { headerActions, onIssued(record) })
   headerActions: the page-header action container; while the review is open the tab adds its
   Save Technical Review / Reject Request button there (after Back).
   Opens once the last approval has issued the SPK (doc Confirmed, step "Done"); the printable
   Label Sampel section shows from then on. The Kaji Ulang table checks every requested parameter
   against the Internal Document & Master Control data; from it the Hasil (Diterima Full / Parsial /
   Ditolak), the catatan and the Est. Tanggal Selesai Uji (longest lead time among the accepted
   parameters) are filled in. The Lab Coordinator (CRL) can change them until the doc is Closed (LHU Final). */
var REVIEW_TAB_STEPS = ['Done', 'Draft Report'];

/* Internal Document & Master Control — the five checks of the kaji ulang, with their data source.
   The Metode cell shows the parameter's own method; its status (In-Scope / Non-Scope) is the icon. */
var KAJI_ULANG_KONTROL = [
  { key: 'metode', title: 'Method', sub: 'Document Control WI & Scope' },
  { key: 'analis', title: 'Analyst', sub: 'Competency Matrix' },
  { key: 'reagen', title: 'Reagents & Consumables', sub: 'Stock Opname (auto deduct)' },
  { key: 'alat', title: 'Equipment', sub: 'Equipment monitoring & status' },
  { key: 'lingkungan', title: 'Test Environment', sub: 'Accommodation log (IoT)' }
];

/* Dummy result of each check per parameter (mirrors the Master Data pages).
   s: ok | warn (can still be tested) | fail (parameter cannot be tested)
   The reagent check is not here: it comes from the live stock (reagentCheck, dummy-reagents.js). */
var KAJI_ULANG_STATUS = {
  moisture: {
    metode: { s: 'ok', t: 'In-Scope' }, analis: { s: 'ok', t: 'Budi Santoso, Galih Saputra' },
    alat: { s: 'ok', t: 'Moisture Analyzer HE53' },
    lingkungan: { s: 'ok', t: 'Physicochem. Instrument Rm. In-Spec' }
  },
  fat: {
    metode: { s: 'ok', t: 'In-Scope' }, analis: { s: 'ok', t: 'Budi Santoso, Galih Saputra' },
    alat: { s: 'ok', t: 'Soxhlet Buchi E-816' },
    lingkungan: { s: 'ok', t: 'Physicochem. Instrument Rm. In-Spec' }
  },
  ffa: {
    metode: { s: 'ok', t: 'In-Scope' }, analis: { s: 'ok', t: 'Budi Santoso, Siti Aminah' },
    alat: { s: 'ok', t: 'Burette & titration' },
    lingkungan: { s: 'ok', t: 'Physicochem. Instrument Rm. In-Spec' }
  },
  protein: {
    metode: { s: 'ok', t: 'In-Scope' }, analis: { s: 'ok', t: 'Budi Santoso' },
    alat: { s: 'ok', t: 'FOSS Kjeltec 8100' },
    lingkungan: { s: 'ok', t: 'Physicochem. Instrument Rm. In-Spec' }
  },
  salmonella: {
    metode: { s: 'ok', t: 'In-Scope' }, analis: { s: 'ok', t: 'Dewi Lestari, Nur Aini' },
    alat: { s: 'ok', t: 'Incubator 37°C' },
    lingkungan: { s: 'ok', t: 'Inoculation Rm. In-Spec' }
  },
  alt: {
    metode: { s: 'warn', t: 'Non-Scope' }, analis: { s: 'ok', t: 'Dewi Lestari, Nur Aini' },
    alat: { s: 'fail', t: 'LAF Biosafety: Maintenance' },
    lingkungan: { s: 'ok', t: 'Inoculation Rm. In-Spec' }
  },
  ash: {
    metode: { s: 'ok', t: 'In-Scope' }, analis: { s: 'ok', t: 'Galih Saputra, Rian Hidayat' },
    alat: { s: 'ok', t: 'Muffle Furnace' },
    lingkungan: { s: 'ok', t: 'Physicochem. Instrument Rm. In-Spec' }
  },
  yeast: {
    metode: { s: 'ok', t: 'In-Scope' }, analis: { s: 'ok', t: 'Dewi Lestari, Putri Ayuningtyas' },
    alat: { s: 'ok', t: 'Incubator 25°C' },
    lingkungan: { s: 'ok', t: 'Inoculation Rm. In-Spec' }
  },
  coliform: {
    metode: { s: 'ok', t: 'In-Scope' }, analis: { s: 'ok', t: 'Nur Aini' },
    alat: { s: 'ok', t: 'Incubator 37°C' },
    lingkungan: { s: 'ok', t: 'Inoculation Rm. In-Spec' }
  },
  pb: {
    metode: { s: 'warn', t: 'Non-Scope' }, analis: { s: 'ok', t: 'Galih Saputra' },
    alat: { s: 'fail', t: 'AAS: Out of Service' },
    lingkungan: { s: 'ok', t: 'Physicochem. Instrument Rm. In-Spec' }
  }
};

var KAJI_ULANG_ICON = {
  ok: 'ri-checkbox-circle-line text-success',
  warn: 'ri-error-warning-line text-warning',
  fail: 'ri-close-circle-line text-danger'
};

/* Default lead time per parameter in the kaji ulang; every time column is picked in days */
var KAJI_ULANG_LEAD_TIME = 20;
var KAJI_ULANG_DAYS = Array.apply(null, Array(30)).map(function (_, i) { return i + 1; });
/* Subkontrak: the lab cannot test it (e.g. alat rusak after approval) and sends it to a vendor lab;
   it still counts as accepted. Icon: ok / warn / fail. */
var KAJI_ULANG_HASIL = ['Testable', 'Subcontract', 'Not Testable'];
var KAJI_ULANG_HASIL_STATUS = { 'Testable': 'ok', 'Subcontract': 'warn', 'Not Testable': 'fail' };

/* Dropdown choices of one check column: every value the dummy data knows, with its status.
   Metode lists the parameter master's methods (In-Scope ok, Non-Scope warn). */
function kajiUlangOptions(key) {
  var seen = {};
  var list = [];
  function add(t, s) { if (t && !seen[t]) { seen[t] = true; list.push({ t: t, s: s }); } }
  if (key === 'metode') {
    requestParameters('Internal').forEach(function (p) { add(p.method, p.scope ? 'ok' : 'warn'); });
  } else if (key === 'reagen') {
    Object.keys(REAGENT_USAGE).forEach(function (code) { var c = reagentCheck(code); if (c) add(c.t, c.s); });
  } else {
    Object.keys(KAJI_ULANG_STATUS).forEach(function (code) {
      var c = KAJI_ULANG_STATUS[code][key];
      if (c) add(c.t, c.s);
    });
  }
  return list;
}

function kajiUlangStatusOf(key, t) {
  return (kajiUlangOptions(key).filter(function (o) { return o.t === t; })[0] || { s: 'ok' }).s;
}

/* One row per requested parameter: the five checks, the times and the Hasil. Saved values
   (record.kajiUlang[code]) win over the defaults from the master data. */
function kajiUlangRows(record) {
  return (record.params || []).map(function (code) {
    var p = labParameter('Internal', code) || { value: code, text: code, method: '', leadTime: 0 };
    var checks = Object.assign({}, KAJI_ULANG_STATUS[code], { reagen: reagentCheck(code) });
    var saved = (record.kajiUlang && record.kajiUlang[code]) || {};
    var values = {};
    KAJI_ULANG_KONTROL.forEach(function (k) {
      /* Reagent stock is always the live reading (it moves with every deduction), not a saved text */
      var live = k.key === 'reagen' && checks.reagen ? checks.reagen.t : '';
      values[k.key] = live || saved[k.key] || (k.key === 'metode' ? p.method : (checks[k.key] ? checks[k.key].t : ''));
    });
    var fails = KAJI_ULANG_KONTROL.filter(function (k) { return values[k.key] && kajiUlangStatusOf(k.key, values[k.key]) === 'fail'; })
      .map(function (k) { return values[k.key]; });
    var hasil = saved.hasil || (fails.length ? 'Not Testable' : 'Testable');
    return {
      param: p,
      values: values,
      efektif: Number(saved.efektif) || p.leadTime,
      leadTime: Number(saved.leadTime) || KAJI_ULANG_LEAD_TIME,
      actual: saved.actual ? Number(saved.actual) : '',
      hasil: hasil,
      fails: fails,
      vendor: hasil === 'Subcontract' ? (saved.vendor || '') : '',
      ok: hasil !== 'Not Testable'
    };
  });
}

/* Hasil, catatan and est. selesai suggested by the kaji ulang */
function kajiUlangSuggestion(rows) {
  var accepted = rows.filter(function (r) { return r.ok; });
  var hasil = !accepted.length ? 'Rejected' : accepted.length === rows.length ? 'Fully Accepted' : 'Partially Accepted';
  var catatan = rows.filter(function (r) { return !r.ok; })
    .map(function (r) { return r.param.text + ' not testable' + (r.fails.length ? ' (' + r.fails.join(', ') + ')' : ''); }).join('; ');
  var days = accepted.reduce(function (max, r) { return Math.max(max, r.leadTime || 0); }, 0);
  var longest = accepted.filter(function (r) { return r.leadTime === days; })[0];
  var est = new Date();
  est.setDate(est.getDate() + days);
  var analis = [];
  /* Analis: the lab's own parameters; a vendor tests the subkontrak ones */
  accepted.filter(function (r) { return r.hasil !== 'Subcontract'; }).forEach(function (r) {
    (r.values.analis || '').split(',').forEach(function (n) {
      n = n.trim();
      if (n && analis.indexOf(n) === -1) analis.push(n);
    });
  });
  return {
    hasil: hasil,
    analis: analis,
    catatan: catatan ? catatan + '.' : '',
    accepted: accepted.map(function (r) { return r.param.value; }),
    days: days,
    longest: longest ? longest.param.text : '',
    est: String(est.getDate()).padStart(2, '0') + '-' + String(est.getMonth() + 1).padStart(2, '0') + '-' + est.getFullYear()
  };
}

function kajiUlangSelectHtml(code, col, current, options, placeholder) {
  return '<select class="form-select form-select-sm spk-select2-sm" data-ku-row="' + code + '" data-ku-col="' + col + '">' +
    (placeholder ? '<option value="">' + placeholder + '</option>' : '') +
    options.map(function (o) {
      return '<option value="' + o.v + '"' + (String(o.v) === String(current) ? ' selected' : '') + '>' + o.t + '</option>';
    }).join('') +
    '</select>';
}

function kajiUlangDaysHtml(code, col, current, placeholder) {
  return kajiUlangSelectHtml(code, col, current, KAJI_ULANG_DAYS.map(function (d) { return { v: d, t: d + ' days' }; }), placeholder);
}

/* Every column after Parameter is a SpkSelect2 dropdown; the icon left of a check follows its status */
function kajiUlangTableHtml(rows) {
  return '<div class="table-responsive rounded border mb-3">' +
    '<table class="table table-sm align-middle mb-0 kaji-ulang-table">' +
      '<thead><tr>' +
        '<th>Parameter</th>' +
        KAJI_ULANG_KONTROL.map(function (k) {
          return '<th>' + k.title + '<div class="fs-11 fw-normal text-muted">' + k.sub + '</div></th>';
        }).join('') +
        '<th>Effective Analysis Time</th>' +
        '<th>Max Lead Time</th>' +
        '<th>Actual Time</th>' +
        '<th>Result</th>' +
        '<th>Subcontract Lab</th>' +
      '</tr></thead>' +
      '<tbody>' +
        rows.map(function (r) {
          var code = r.param.value;
          return '<tr>' +
            '<td class="fw-semibold">' + r.param.text + '</td>' +
            KAJI_ULANG_KONTROL.map(function (k) {
              var current = r.values[k.key];
              var opts = kajiUlangOptions(k.key);
              if (current && !opts.some(function (o) { return o.t === current; })) opts = opts.concat({ t: current, s: 'ok' });
              return '<td><div class="d-flex align-items-center gap-1">' +
                '<i class="' + KAJI_ULANG_ICON[kajiUlangStatusOf(k.key, current)] + '" data-ku-icon="' + code + '-' + k.key + '"></i>' +
                '<div class="flex-fill">' + kajiUlangSelectHtml(code, k.key, current, opts.map(function (o) { return { v: o.t, t: o.t }; })) + '</div>' +
              '</div></td>';
            }).join('') +
            '<td>' + kajiUlangDaysHtml(code, 'efektif', r.efektif) + '</td>' +
            '<td>' + kajiUlangDaysHtml(code, 'leadTime', r.leadTime) + '</td>' +
            '<td>' + kajiUlangDaysHtml(code, 'actual', r.actual, '-- Select --') + '</td>' +
            /* Hasil: same icon + dropdown cell as the checks (green Dapat / red Tidak Dapat Diuji) */
            '<td><div class="d-flex align-items-center gap-1">' +
              '<i class="' + KAJI_ULANG_ICON[KAJI_ULANG_HASIL_STATUS[r.hasil]] + '" data-ku-icon="' + code + '-hasil"></i>' +
              '<div class="flex-fill">' + kajiUlangSelectHtml(code, 'hasil', r.hasil, KAJI_ULANG_HASIL.map(function (h) { return { v: h, t: h }; })) + '</div>' +
            '</div></td>' +
            /* Vendor lab, only for Subkontrak */
            '<td>' + kajiUlangSelectHtml(code, 'vendor', r.vendor, EXTERNAL_MASTER_LAB.map(function (v) { return { v: v, t: v }; }), '-- Select Lab --') + '</td>' +
          '</tr>';
        }).join('') +
      '</tbody>' +
    '</table>' +
  '</div>';
}

/* Current table values as { code: { metode, analis, reagen, alat, lingkungan, efektif, leadTime, actual, hasil, vendor } } */
function kajiUlangCollect(container) {
  var out = {};
  container.querySelectorAll('[data-ku-row]').forEach(function (el) {
    var row = out[el.dataset.kuRow] = out[el.dataset.kuRow] || {};
    row[el.dataset.kuCol] = el.value;
  });
  return out;
}

window.InternalReviewTab = {
  render: function (container, record, opts) {
    opts = opts || {};

    var rejectedInReview = record && record.step === 'Rejected' && !!record.hasilKajiUlang;
    if (!record || (REVIEW_TAB_STEPS.indexOf(record.step) === -1 && !rejectedInReview)) {
      container.innerHTML =
        '<div class="card custom-card"><div class="card-body text-center py-5">' +
        '<i class="ri-lock-line fs-24 text-muted"></i>' +
        '<div class="fw-semibold mt-2">Technical Review Not Available Yet</div>' +
        '<p class="text-muted fs-13 mb-0">The technical review opens once the last approval issues the SPK.</p>' +
        '</div></div>';
      return;
    }

    /* Editable until the LHU is Final (doc Closed) */
    var done = record.reportStatus === 'Final' || rejectedInReview;
    var rows = kajiUlangRows(record);
    var auto = kajiUlangSuggestion(rows);

    container.innerHTML =
      '<form id="reviewSpkForm" class="no-print">' +
      '<div class="card custom-card">' +
        '<div class="card-body">' +
          '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">' +
            '<div>' +
              '<h6 class="fw-semibold mb-0">Technical Review &amp; SPK Issuance</h6>' +
              '<p class="text-muted fs-12 mb-0">Lab capability per parameter from Internal Document &amp; Master Control</p>' +
            '</div>' +
            (record.spk ? '<span class="badge bg-success-transparent"><i class="ri-checkbox-circle-line me-1"></i>SPK issued: <span class="font-monospace">' + record.spk + '</span></span>' : '') +
            (rejectedInReview ? '<span class="badge bg-danger-transparent"><i class="ri-close-circle-line me-1"></i>Request rejected</span>' : '') +
          '</div>' +
          kajiUlangTableHtml(rows) +
          '<div class="row g-3">' +
            '<div class="col-12 col-md-4">' +
              '<label class="form-label">Technical Review Result <span class="text-danger">*</span></label>' +
              '<select id="hasilKajiUlang" class="form-select" required>' +
                '<option value="">-- Select --</option>' +
                '<option value="Fully Accepted">Fully Accepted</option>' +
                '<option value="Partially Accepted">Partially Accepted</option>' +
                '<option value="Rejected">Rejected</option>' +
              '</select>' +
              (done ? '' : '<div class="form-text"><i class="ri-magic-line"></i> Automatic from the technical review table</div>') +
            '</div>' +
            '<div class="col-12 col-md-4" id="wrapAnalis">' +
              '<label class="form-label">Assigned Analysts <span class="text-danger">*</span></label>' +
              '<select id="penunjukanAnalis" multiple required placeholder="Select analysts..."></select>' +
              (done ? '' : '<div class="form-text"><i class="ri-magic-line"></i> Default from the analyst matrix of the testable parameters</div>') +
            '</div>' +
            '<div class="col-12 col-md-4" id="wrapEstSelesai">' +
              '<label class="form-label">Est. Test Completion Date <span class="text-danger">*</span></label>' +
              '<div class="input-group">' +
                '<input type="text" id="estSelesai" class="form-control" placeholder="Select date" required />' +
                '<span class="input-group-text"><i class="ri-calendar-line"></i></span>' +
              '</div>' +
              (done ? '' : '<div class="form-text"><i class="ri-magic-line"></i> Default: today + longest lead time</div>') +
            '</div>' +
            '<div class="col-12" id="wrapCatatanKajiUlang">' +
              '<label class="form-label">Technical Review Notes <span class="text-danger">*</span></label>' +
              '<textarea id="catatanKajiUlang" class="form-control" rows="2" placeholder="Required if the result is Rejected / Partially Accepted"></textarea>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</form>' +
      /* SpkFormSection: Label Sampel — appears as soon as the SPK is issued (last approval); printable */
      (rejectedInReview ? '' : '<div class="card custom-card" id="labelSection">' + labelSectionHtml(record) + '</div>');

    var form = container.querySelector('#reviewSpkForm');
    var hasilSelect = container.querySelector('#hasilKajiUlang');
    var analisSelect = container.querySelector('#penunjukanAnalis');
    var estInput = container.querySelector('#estSelesai');
    var wrapCatatan = container.querySelector('#wrapCatatanKajiUlang');
    var catatanEl = container.querySelector('#catatanKajiUlang');
    var wrapAnalis = container.querySelector('#wrapAnalis');
    var wrapEst = container.querySelector('#wrapEstSelesai');
    /* The action button sits in the page header next to Back, like Approve on the form tab */
    var issueBtn = null;
    if (!done && opts.headerActions) {
      issueBtn = document.createElement('button');
      issueBtn.type = 'button';
      issueBtn.id = 'btnIssueSpk';
      opts.headerActions.appendChild(issueBtn);
    }

    /* Saved values win; a request just arriving at the step gets the kaji ulang suggestion */
    hasilSelect.value = record.hasilKajiUlang || auto.hasil;
    catatanEl.value = record.hasilKajiUlang ? (record.catatanKajiUlang || '') : auto.catatan;
    /* TomSelect multi-select; saved list wins, else the matriks analis of the accepted parameters */
    var analisTs = new window.TomSelect(analisSelect, {
      plugins: ['remove_button'],
      persist: false,
      options: MASTER_ANALIS.map(function (n) { return { value: n, text: n }; })
    });
    var savedAnalis = record.analis ? [].concat(record.analis) : null;
    analisTs.setValue(savedAnalis || auto.analis, true);

    var estFp = window.flatpickr ? window.flatpickr(estInput, { dateFormat: 'd-m-Y', clickOpens: !done }) : null;
    var estValue = record.estSelesai || (auto.days ? auto.est : '');
    if (estValue) { if (estFp) estFp.setDate(estValue, true, 'd-m-Y'); else estInput.value = estValue; }

    /* Hasil → Catatan required for Ditolak / Diterima Parsial; Ditolak needs no analis / est. and rejects */
    function applyHasil() {
      var rejected = hasilSelect.value === 'Rejected';
      var needs = rejected || hasilSelect.value === 'Partially Accepted';
      wrapCatatan.style.display = needs ? '' : 'none';
      catatanEl.required = needs;
      wrapAnalis.style.display = rejected ? 'none' : '';
      wrapEst.style.display = rejected ? 'none' : '';
      analisSelect.required = !rejected;
      estInput.required = !rejected;
      if (issueBtn) {
        issueBtn.className = 'btn btn-sm btn-wave d-inline-flex align-items-center gap-1 ' + (rejected ? 'btn-danger' : 'btn-primary');
        issueBtn.innerHTML = rejected
          ? '<i class="ri-close-circle-line"></i> Reject Request'
          : '<i class="ri-save-line"></i> Save Technical Review';
      }
    }
    applyHasil();
    if (window.jQuery) window.jQuery(hasilSelect).on('change', applyHasil);
    else hasilSelect.addEventListener('change', applyHasil);

    var printBtn = container.querySelector('#btnPrintLabel');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    if (done || !issueBtn) {
      form.querySelectorAll('input, select, textarea').forEach(function (el) { el.disabled = true; });
      analisTs.disable();
      return;
    }

    /* A table dropdown changed: a check updates its icon and the row's Hasil; then Hasil Kaji Ulang,
       catatan and Est. Selesai follow the table again */
    function onTableChange(e) {
      var el = e.target;
      var code = el.dataset.kuRow;
      var col = el.dataset.kuCol;
      if (KAJI_ULANG_KONTROL.some(function (k) { return k.key === col; })) {
        var icon = container.querySelector('[data-ku-icon="' + code + '-' + col + '"]');
        if (icon) icon.className = KAJI_ULANG_ICON[kajiUlangStatusOf(col, el.value)];
        var values = kajiUlangCollect(container);
        delete values[code].hasil;
        var rowHasil = kajiUlangRows({ params: [code], kajiUlang: values })[0].hasil;
        var hasilEl = container.querySelector('[data-ku-row="' + code + '"][data-ku-col="hasil"]');
        /* A row already sent to a vendor lab stays Subkontrak */
        if (hasilEl.value !== 'Subcontract' && hasilEl.value !== rowHasil) window.jQuery(hasilEl).val(rowHasil).trigger('change');
      }
      if (col === 'hasil') {
        container.querySelector('[data-ku-icon="' + code + '-hasil"]').className = KAJI_ULANG_ICON[KAJI_ULANG_HASIL_STATUS[el.value]];
        applyVendor(code);
      }
      auto = kajiUlangSuggestion(kajiUlangRows({ params: record.params, kajiUlang: kajiUlangCollect(container) }));
      analisTs.setValue(auto.analis, true);
      window.jQuery(hasilSelect).val(auto.hasil).trigger('change');
      catatanEl.value = auto.catatan;
      if (auto.days) { if (estFp) estFp.setDate(auto.est, true, 'd-m-Y'); else estInput.value = auto.est; }
    }
    window.jQuery(container).off('change.kajiUlang').on('change.kajiUlang', '[data-ku-row]', onTableChange);

    /* Lab Subkontrak is only open (and required) while the row's Hasil is Subkontrak */
    function applyVendor(code) {
      var sub = container.querySelector('[data-ku-row="' + code + '"][data-ku-col="hasil"]').value === 'Subcontract';
      var vendorEl = container.querySelector('[data-ku-row="' + code + '"][data-ku-col="vendor"]');
      vendorEl.required = sub;
      if (!sub && vendorEl.value) vendorEl.value = '';
      window.jQuery(vendorEl).prop('disabled', !sub).trigger('change.select2');
    }
    (record.params || []).forEach(applyVendor);

    issueBtn.addEventListener('click', function () {
      if (!validateForm(form)) return;
      var updated;
      if (hasilSelect.value === 'Rejected') {
        updated = updateRequest(record.id, {
          step: 'Rejected',
          hasilKajiUlang: 'Rejected',
          kajiUlang: kajiUlangCollect(container),
          catatanKajiUlang: catatanEl.value,
          rejectReason: catatanEl.value, reasonBy: currentRole().label + ' (Technical Review)', reasonAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
        });
        ToastService.showSuccess('Request ' + record.id + ' rejected in technical review.');
      } else {
        updated = updateRequest(record.id, {
          hasilKajiUlang: hasilSelect.value,
          kajiUlang: kajiUlangCollect(container),
          catatanKajiUlang: hasilSelect.value === 'Fully Accepted' ? '' : catatanEl.value,
          paramsDiterima: hasilSelect.value === 'Fully Accepted' ? record.params.slice() : auto.accepted,
          analis: analisTs.getValue(),
          estSelesai: estInput.value
        });
        /* A lab that joins later (e.g. a parameter accepted again) gets its own Sample No. */
        updated = updateRequest(record.id, { sampleNos: assignSampleNos(updated) });
        /* First reagent deduction: accepted parameters the lab tests itself, each only once */
        var done = updated.reagentDeducted || [];
        var toDeduct = (updated.paramsDiterima || []).filter(function (code) {
          return done.indexOf(code) === -1 && (updated.kajiUlang[code] || {}).hasil !== 'Subcontract';
        });
        var rows = deductReagents(toDeduct, (updated.spk || updated.id) + ' · Technical Review', currentRole().name);
        if (toDeduct.length) updated = updateRequest(record.id, { reagentDeducted: done.concat(toDeduct) });
        ToastService.showSuccess('Technical review of ' + record.id + ' saved.' + (rows ? ' ' + rows + ' reagent deduction(s) written to the usage log.' : ''));
      }
      if (opts.onIssued) opts.onIssued(updated);
    });
  }
};

/* Label Sampel section body: locked until the SPK is issued */
function labelSectionHtml(record) {
  if (!record.spk) {
    return '<div class="card-body text-center py-4">' +
      '<i class="ri-lock-line fs-24 text-muted"></i>' +
      '<div class="fw-semibold mt-2">Labels Cannot Be Printed Yet</div>' +
      '<p class="text-muted fs-13 mb-0">Labels appear automatically once the last approval issues the SPK.</p>' +
      '</div>';
  }
  var labels = sampleLabelsHtml(record);
  return '<div class="card-body">' +
    '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 no-print">' +
      '<div>' +
        '<h6 class="fw-semibold mb-0">Sample Labels <span class="text-muted fw-normal">(' + labels.length + ')</span></h6>' +
        '<p class="text-muted fs-12 mb-0">Label size 50 &times; 30 mm &middot; unique sample ID (Cl. 7.4)</p>' +
      '</div>' +
      '<div class="d-flex align-items-center flex-wrap gap-2">' +
        '<div style="width:190px;"><select id="printFormat" class="form-select form-select-sm">' +
          '<option>Zebra ZD230 (50&times;30)</option><option>A4 &mdash; 3&times;7 label</option><option>PDF</option>' +
        '</select></div>' +
        '<button type="button" id="btnPrintLabel" class="btn btn-sm btn-light btn-wave d-inline-flex align-items-center gap-1"><i class="ri-printer-line"></i> Print Labels</button>' +
      '</div>' +
    '</div>' +
    '<div class="label-sheet">' + labels.join('') + '</div>' +
    '</div>';
}
