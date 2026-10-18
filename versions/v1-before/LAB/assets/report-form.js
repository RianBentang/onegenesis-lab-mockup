/* Deterministic QR-look SVG generator — ported from OneGenesis mockup (qrSvg) */
function qrSvg(seed, size) {
  size = size || 84;
  var h = 0;
  for (var i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
  var n = 21, cell = size / n, r = '';
  function fin(x, y) {
    return '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + (7 * cell) + '" height="' + (7 * cell) + '" fill="#111"/>' +
      '<rect x="' + ((x + 1) * cell) + '" y="' + ((y + 1) * cell) + '" width="' + (5 * cell) + '" height="' + (5 * cell) + '" fill="#fff"/>' +
      '<rect x="' + ((x + 2) * cell) + '" y="' + ((y + 2) * cell) + '" width="' + (3 * cell) + '" height="' + (3 * cell) + '" fill="#111"/>';
  }
  for (var y = 0; y < n; y++) {
    for (var x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      h = (h * 1103515245 + 12345) >>> 0;
      if (h & 0x40000) r += '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + cell + '" height="' + cell + '" fill="#111"/>';
    }
  }
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
    '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' + r + fin(0, 0) + fin(14, 0) + fin(0, 14) + '</svg>';
}

/* Reference method printed for Sensory / ASLT rows (their worksheet rows carry no method) */
var REPORT_METHOD_BY_SOURCE = {
  sensory: 'IK-LAB-SN-01 (ISO 4121)',
  aslt: 'IK-LAB-AS-01 (Labuza 1982)'
};

/* Report form — one path for every issued version (see dummy-requests.js "Report lifecycle"):
   Draft (CRL reviews the Excel results, Submit for Approval) → Confirm to Approve (TCM: Approve &
   Issue, or Return to CRL) → Final. Re-test (TCM, Internal, any time; also from the Internal form
   before a report exists) and Revision (CRL / TCM,
   after an issue) reopen it as a new cycle on this page. Lab roles work on the live report; other
   roles (the requester) only see the last issued certificate and download it.
   ?view=issued[&v=<history index>] shows an issued version from its snapshot. */
document.addEventListener('DOMContentLoaded', function () {
  var urlParams = new URLSearchParams(window.location.search);
  var docId = urlParams.get('docId');
  var jenis = (urlParams.get('jenis') || 'internal').toLowerCase();
  var record = worksheetGetRecord(jenis, docId);

  var content = document.getElementById('reportContent');
  var docNoEl = document.getElementById('docNoValue');
  var reportNoEl = document.getElementById('reportNoValue');
  var reportStatusEl = document.getElementById('reportStatusBadge');

  if (!record) {
    content.innerHTML = '<div class="card custom-card"><div class="card-body text-center text-muted py-5">Document not found.</div></div>';
    return;
  }

  docNoEl.textContent = record.id;

  var CHANNELS = flexTabOptions('LAB_REQUEST_CHANNEL');
  var stamp = function () { return reportStamp(); };
  var role = function () { return currentRole(); };

  /* ---------- Which version is shown ---------- */
  function issuedEntries() {
    return (record.reportHistory || []).length ? record.reportHistory : (lastIssuedReport(record) ? [lastIssuedReport(record)] : []);
  }
  /* The history entry being viewed, or null for the live (working) report */
  function viewedEntry() {
    var list = issuedEntries();
    if (!isLabRole(role()) || urlParams.get('view') === 'issued') {
      var v = urlParams.get('v');
      return list[v !== null && list[v] ? Number(v) : list.length - 1] || null;
    }
    return null;
  }
  /* Record as printed: an issued version takes the fields of its snapshot */
  function docView(entry) {
    if (!entry) return record;
    return Object.assign({}, record, entry.snapshot || {}, { reportNo: entry.no, reportStatus: 'Final', reportHistoryEntry: entry });
  }

  /* Before a Re-test / Revision: make sure the version issued so far is in the history with a
     snapshot (seeded or older reports were finalized without one) */
  function snapshotOf(r) {
    return { sampel: r.sampel, alamatPelanggan: r.alamatPelanggan, kemasan: r.kemasan, results: r.results || null,
      panelStats: r.panelStats || null, paramsDiterima: r.paramsDiterima || null };
  }
  function ensureHistory() {
    if ((record.reportHistory || []).length || !(record.reportStatus === 'Final' && record.reportNo)) return;
    record = worksheetUpdateRecord(jenis, record.id, { reportHistory: [{ no: record.reportNo, type: 'Original', at: '-', reason: '', snapshot: snapshotOf(record) }] });
  }

  function updateDocInfoBar() {
    var entry = viewedEntry();
    if (entry) {
      reportNoEl.textContent = entry.no;
      reportStatusEl.innerHTML = '<span class="badge bg-success-transparent"><i class="ri-shield-check-line me-1"></i>Issued</span>';
    } else {
      var issued = lastIssuedReport(record);
      reportNoEl.textContent = record.reportStatus === 'Final' ? record.reportNo : (issued ? issued.no + ' (valid until reissued)' : 'Not Issued');
      reportStatusEl.innerHTML = reportStatusBadgeHtml(record);
    }
  }

  /* Method on the report: a subkontrak parameter uses the vendor's method (External master) */
  function reportMethod(code) {
    var own = labParameter('Internal', code);
    var vendor = paramSubkontrak(record, code) ? labParameter('External', code) : null;
    return (record.paramMethods && record.paramMethods[code]) || (vendor || own || {}).method || '-';
  }

  function siteLabel(site) {
    var d = site && typeof MASTER_SITE_DETAIL !== 'undefined' ? MASTER_SITE_DETAIL[site] : null;
    return d ? d.company + ' - ' + d.kota : (site || '-');
  }

  /* ---------- Page ---------- */
  function render() {
    var entry = viewedEntry();
    updateDocInfoBar();
    if (!entry && !isLabRole(role())) {
      content.innerHTML = '<div class="card custom-card"><div class="card-body text-center text-muted py-5">' +
        '<i class="ri-time-line fs-24 d-block mb-1"></i>The certificate has not been issued yet. It appears here once the Technical Manager approves it.</div></div>';
      renderActionButtons(null);
      return;
    }
    var doc = docView(entry);
    var working = !entry;
    var status = reportStatusOf(record);
    content.innerHTML =
      (working ? workflowCardHtml() : issuedViewNoteHtml(entry)) +
      (working && jenis === 'internal' && status === 'Draft' ? draftCardHtml() : '') +
      (isLabRole(role()) ? historyCardHtml() : '') +
      certificateHtml(doc, working ? status : 'Final');
    renderActionButtons(entry);
  }

  function certificateHtml(doc, status) {
    var titleText = 'TEST RESULT REPORT (LHU)';
    var labText = WORKSHEET_SOURCES[jenis].label + ' — Internal Laboratory';
    var results = doc.results || {};

    function resultRow(i, text, unit, method, spec, result, pass) {
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + text + '</td>' +
        '<td>' + unit + '</td>' +
        '<td class="font-monospace">' + method + '</td>' +
        '<td>' + spec + '</td>' +
        '<td class="font-monospace fw-semibold">' + result + '</td>' +
        '<td>' + (pass === false ? '<span class="badge bg-danger-transparent">FAIL</span>' : '<span class="badge bg-success-transparent">PASS</span>') + '</td>' +
        '</tr>';
    }

    var rows;
    if (jenis === 'sensory' || jenis === 'aslt') {
      /* Rows = worksheet parameters and/or panel statistics, both from Push Data in Excel. With
         panel statistics the organoleptic rows come from the panel (worksheetLabParams). */
      var list = [];
      if (doc.results || !doc.panelStats) {
        (doc.panelStats ? worksheetLabParams(jenis, doc) : worksheetParamsFor(jenis, doc)).forEach(function (p) {
          list.push({ text: p.text, unit: p.unit, spec: p.spec, result: results[p.key] ? results[p.key].result : '-' });
        });
      }
      if (doc.panelStats && typeof panelReportRows === 'function') list = list.concat(panelReportRows(doc));
      rows = list.map(function (r, i) {
        return resultRow(i, r.text, r.unit, REPORT_METHOD_BY_SOURCE[jenis], r.spec, r.result, r.pass);
      }).join('');
    } else {
      /* Subkontrak parameters get a * and the legend under the table */
      rows = (doc.paramsDiterima || doc.params || []).map(function (code, i) {
        var p = labParameter('Internal', code);
        var text = (p ? p.text : code) + (paramSubkontrak(record, code) ? ' <sup>*</sup>' : '');
        return resultRow(i, text, p ? p.unit : '-', reportMethod(code), p ? p.spec : '-', results[code] ? results[code].result : '-');
      }).join('');
    }

    var verified = status !== 'Draft';
    var isFinal = status === 'Final';
    return '<div class="card custom-card"><div class="card-body">' +
      '<div class="printable-doc" id="printableDoc">' +

      '<div class="cert-header">' +
      '<div class="cert-header-brand">' +
      '<img src="../assets/img/garudafood-logo.png" alt="Garudafood" />' +
      '<div><h4>HOLABSYS Central Laboratory</h4>' +
      '<p>Testing, Inspection &amp; Quality Assurance Center</p>' +
      '<p>PT Garudafood Putra Putri Jaya Tbk</p></div>' +
      '</div>' +
      '<div class="cert-kan-box">' +
      '<div class="box"><div class="kan">KAN</div><div class="lp">LP-1234-IDN</div></div>' +
      '<small>ISO/IEC 17025</small>' +
      '</div>' +
      '</div>' +

      '<div class="cert-title">' +
      '<h3>' + titleText + '</h3>' +
      '<div class="cert-no">Number: ' + (isFinal ? doc.reportNo : '(not issued — ' + status + ')') + '</div>' +
      replacesNoteHtml(doc) +
      '</div>' +

      '<div class="cert-meta-grid">' +
      '<div class="row-item"><span>Request ID</span><span>' + doc.id + '</span></div>' +
      '<div class="row-item"><span>Laboratory Type</span><span>' + labText + '</span></div>' +
      '<div class="row-item"><span>Requester / Department</span><span>' + doc.pemohon + ' / ' + doc.departemen + '</span></div>' +
      '<div class="row-item"><span>Sample Name</span><span>' + doc.sampel + '</span></div>' +
      '<div class="row-item"><span>Batch Code</span><span>' + (doc.batch || '-') + '</span></div>' +
      '<div class="row-item"><span>Production Date</span><span>' + (doc.prod || '-') + '</span></div>' +
      '<div class="row-item"><span>Request Date</span><span>' + doc.tanggal + '</span></div>' +
      '<div class="row-item"><span>Request Type</span><span>' + doc.tipe + '</span></div>' +
      '<div class="row-item"><span>Customer Address</span><span>' + siteLabel(doc.alamatPelanggan) + '</span></div>' +
      '<div class="row-item"><span>Packaging</span><span>' + (doc.kemasan || '-') + '</span></div>' +
      '</div>' +

      '<table class="cert-result-table"><thead><tr>' +
      '<th>No</th><th>Test Parameter</th><th>Unit</th><th>Reference Method</th><th>Quality Standard / Specification</th><th>Test Result</th><th>Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      (jenis === 'internal' ? subkontrakLegendHtml(doc) : '') +

      '<div class="cert-sign-grid">' +
      '<div class="cert-sign-box">' +
      '<div class="status ' + (verified ? 'text-success' : 'text-warning') + '">' + (verified ? 'Verified (Technical Review)' : 'Waiting for CRL review') + '</div>' +
      '<div class="cert-qr-wrap">' + qrSvg(doc.id + '-verify') + '</div>' +
      '<div class="name">Dian Pramono, S.Si</div>' +
      '<div class="role">Lab Coordinator / Supervisor (CRL)</div>' +
      '</div>' +
      '<div class="cert-sign-box">' +
      '<div class="status ' + (isFinal ? 'text-success' : 'text-warning') + '">' + (isFinal ? 'Approved &amp; Issued (Digital Signature)' : 'Waiting for TCM approval') + '</div>' +
      '<div class="cert-qr-wrap">' + qrSvg(doc.id + '-' + (isFinal ? doc.reportNo : 'draft')) + '</div>' +
      '<div class="name">Siti Rahmawati</div>' +
      '<div class="role">Technical Manager (TCM)</div>' +
      '</div>' +
      '</div>' +

      '</div>' +
      '</div></div>';
  }

  /* ---------- Workflow card (lab roles): where the report is and who acts next ---------- */
  function workflowCardHtml() {
    var status = reportStatusOf(record);
    var steps = [
      { key: 'Draft', title: 'Review Results', who: 'CRL', icon: 'ri-file-search-line' },
      { key: 'Confirm to Approve', title: 'Approve & Issue', who: 'TCM', icon: 'ri-shield-check-line' },
      { key: 'Final', title: 'Certificate Issued', who: 'Requester downloads', icon: 'ri-award-line' }
    ];
    var at = steps.map(function (s) { return s.key; }).indexOf(status);
    var next = {
      'Draft': 'CRL: check the results' + (jenis === 'internal' ? ' (Excel / Edit, all flags cleared)' : '') + ', then Submit for Approval.',
      'Confirm to Approve': 'TCM: Approve & Issue, or Return to CRL with a note.',
      'Final': 'Issued. A re-test or revision opens a new cycle that follows the same steps.'
    }[status];
    var c = record.reportCycle;
    var issued = lastIssuedReport(record);
    return '<div class="card custom-card no-print"><div class="card-body">' +
      '<div class="d-flex align-items-center flex-wrap gap-3">' +
      steps.map(function (s, i) {
        var done = i < at || status === 'Final';
        var cur = i === at && status !== 'Final';
        return (i ? '<i class="ri-arrow-right-s-line text-muted fs-18"></i>' : '') +
          '<div class="d-flex align-items-center gap-2">' +
          '<span class="avatar avatar-sm avatar-rounded ' + (done ? 'bg-success-transparent text-success' : cur ? 'bg-primary text-white' : 'bg-light text-muted') + '"><i class="' + (done ? 'ri-check-line' : s.icon) + '"></i></span>' +
          '<div class="lh-sm"><div class="fs-13 fw-semibold' + (cur ? ' text-primary' : '') + '">' + s.title + '</div><div class="fs-11 text-muted">' + s.who + '</div></div></div>';
      }).join('') +
      '</div>' +
      '<div class="fs-12 text-muted mt-3"><i class="ri-information-line me-1"></i>' + next + '</div>' +
      (record.reportReturnReason && status === 'Draft'
        ? '<div class="alert alert-warning-transparent d-flex align-items-start gap-2 py-2 fs-13 mt-3 mb-0"><i class="ri-arrow-go-back-line fs-16"></i>' +
          '<div><div class="fw-semibold">Returned by ' + record.reportReturnedBy + ' · ' + record.reportReturnedAt + '</div>' + record.reportReturnReason + '</div></div>' : '') +
      (c
        ? '<div class="alert alert-danger-transparent d-flex align-items-start gap-2 py-2 fs-13 mt-3 mb-0"><i class="ri-restart-line fs-16"></i>' +
          '<div><div class="fw-semibold">' + c.type + ' ' + c.no + ' · requested by ' + c.requestedBy + ' via ' + c.channel + ' · started by ' + c.by + ', ' + c.at + '</div>' +
          (c.params ? c.params.join(', ') + ' — ' : '') + (c.changes ? c.changes.join(' · ') + ' — ' : '') + c.reason +
          (issued ? '<div class="text-muted fs-12">Until this is approved, ' + issued.no + ' stays the valid certificate.</div>' : '') + '</div></div>' : '') +
      '</div></div>';
  }

  function issuedViewNoteHtml(entry) {
    var lab = isLabRole(role());
    var current = issuedEntries().indexOf(entry) === issuedEntries().length - 1;
    return '<div class="alert ' + (current ? 'alert-success-transparent' : 'alert-secondary') + ' d-flex align-items-center flex-wrap gap-2 py-2 fs-13 no-print">' +
      '<i class="ri-award-line fs-16"></i><div class="flex-fill">' +
      '<span class="fw-semibold">Certificate ' + entry.no + '</span> · ' + entry.type + ' · issued ' + entry.at +
      (current ? '' : ' · <span class="fw-semibold">superseded</span> by ' + issuedEntries()[issuedEntries().length - 1].no) +
      (record.reportCycle && current ? '<div class="fs-12 text-muted">' + record.reportCycle.type + ' in progress — this certificate stays valid until the new one is approved.</div>' : '') +
      '</div>' +
      (lab ? '<a href="reportForm.html?docId=' + encodeURIComponent(record.id) + '&jenis=' + jenis + '" class="btn btn-sm btn-light">Open working report</a>' : '') +
      '</div>';
  }

  /* ---------- Draft: results from Excel per parameter, who tests it, vendor certificate, flags ---------- */
  function draftRows() {
    var results = record.results || {};
    var certs = record.subkontrakCert || {};
    return worksheetParamsFor('internal', record).map(function (p) {
      var res = results[p.key];
      var cert = certs[p.key] || {};
      var flags = [];
      if (!res) flags.push({ cls: 'bg-danger-transparent', text: 'No result yet (Excel)' });
      if (p.sub && !(cert.no && cert.file)) flags.push({ cls: 'bg-warning-transparent', text: 'Certificate not attached yet' });
      return { p: p, method: reportMethod(p.key), res: res, cert: cert, flags: flags };
    });
  }

  function draftCardHtml() {
    var rows = draftRows();
    var open = rows.filter(function (r) { return r.flags.length; }).length;
    var pushed = record.pushedAt ? new Date(record.pushedAt) : null;
    return '<div class="card custom-card no-print"><div class="card-body">' +
      '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">' +
        '<div>' +
          '<h6 class="fw-semibold mb-0">Test Result Data (from Excel)</h6>' +
          '<p class="text-muted fs-12 mb-0">Push Data in Excel can be repeated while the report is still Draft' +
            (pushed ? ' · Last push ' + pushed.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '') + '</p>' +
        '</div>' +
        (open
          ? '<span class="badge bg-warning-transparent"><i class="ri-flag-line me-1"></i>' + open + ' parameter(s) to complete</span>'
          : '<span class="badge bg-success-transparent"><i class="ri-checkbox-circle-line me-1"></i>Ready to submit</span>') +
      '</div>' +
      '<div class="table-responsive rounded border">' +
      '<table class="table table-sm align-middle mb-0">' +
        '<thead><tr><th>Action</th><th>Parameter</th><th>Tested By</th><th>Method</th><th>Replicate 1</th><th>Replicate 2</th><th>Replicate 3</th>' +
          '<th>Result</th><th>Specification</th><th>External Lab Certificate</th><th>Flag</th></tr></thead>' +
        '<tbody>' + rows.map(function (r) {
          var values = r.res ? r.res.values : [];
          var code = r.p.key;
          return '<tr>' +
            /* SpkTableActions */
            '<td><div class="d-flex gap-1"><button type="button" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Edit" data-edit-result="' + code + '"><i class="ri-edit-line"></i></button></div></td>' +
            '<td class="fw-semibold">' + r.p.text + '</td>' +
            '<td>' + (r.p.sub
              ? '<span class="badge bg-warning-transparent"><i class="ri-building-2-line me-1"></i>Subcontract · ' + r.p.sub + '</span>'
              : '<span class="badge bg-primary-transparent"><i class="ri-flask-line me-1"></i>Internal Lab</span>') + '</td>' +
            '<td class="font-monospace fs-12">' + r.method + '</td>' +
            [0, 1, 2].map(function (j) { return '<td class="font-monospace">' + (values[j] != null ? values[j] : '<span class="text-muted">-</span>') + '</td>'; }).join('') +
            '<td class="font-monospace fw-semibold">' + (r.res ? r.res.result : '<span class="text-muted">-</span>') + ' <span class="text-muted fw-normal fs-11">' + r.p.unit + '</span></td>' +
            '<td class="fs-12">' + r.p.spec + '</td>' +
            '<td class="fs-12">' + (!r.p.sub ? '<span class="text-muted">&mdash;</span>'
              : (r.cert.no || r.cert.file)
                ? '<div class="font-monospace">' + (r.cert.no || '-') + '</div>' + (r.cert.file ? '<div class="text-muted fs-11"><i class="ri-attachment-2 me-1"></i>' + r.cert.file + '</div>' : '')
                : '<span class="text-muted">None yet</span>') + '</td>' +
            '<td>' + (r.flags.length
              ? r.flags.map(function (f) { return '<span class="badge ' + f.cls + ' d-block mb-1"><i class="ri-flag-line me-1"></i>' + f.text + '</span>'; }).join('')
              : '<span class="badge bg-success-transparent"><i class="ri-check-line me-1"></i>Complete</span>') + '</td>' +
          '</tr>';
        }).join('') + '</tbody>' +
      '</table></div>' +
      '</div></div>';
  }

  /* LHU legend: which parameters a vendor lab tested, with their certificate */
  function subkontrakLegendHtml(doc) {
    var certs = record.subkontrakCert || {};
    var subs = (doc.paramsDiterima || doc.params || []).filter(function (code) { return paramSubkontrak(record, code); });
    if (!subs.length) return '';
    return '<div class="cert-legend"><strong>Notes:</strong><br>' +
      '<sup>*</sup> Parameter subcontracted to an external laboratory: ' +
      subs.map(function (code) {
        var p = labParameter('Internal', code);
        var no = certs[code] && certs[code].no;
        return (p ? p.text : code) + ' by ' + paramSubkontrak(record, code) + (no ? ' (Certificate No. ' + no + ')' : '');
      }).join('; ') + '. Results as stated on that laboratory\'s certificate.' +
      '</div>';
  }

  /* "Revision n / Re-test n — replaces <previous no.>" under the LHU number */
  function replacesNoteHtml(doc) {
    var h = issuedEntries();
    var entry = doc.reportHistoryEntry || (doc.reportStatus === 'Final' ? h[h.length - 1] : null);
    var i = h.indexOf(entry);
    if (i < 1) return '';
    return '<div class="fs-11 text-muted">' + entry.type + ' — replaces ' + h[i - 1].no + '</div>';
  }

  function historyCardHtml() {
    var h = issuedEntries();
    if (!h.length) return '';
    var base = 'reportForm.html?docId=' + encodeURIComponent(record.id) + '&jenis=' + jenis + '&view=issued&v=';
    return '<div class="card custom-card no-print"><div class="card-body">' +
      '<h6 class="fw-semibold mb-3">Report History</h6>' +
      '<div class="table-responsive rounded border"><table class="table table-sm align-middle mb-0">' +
        '<thead><tr><th>Action</th><th>LHU No.</th><th>Type</th><th>Issued</th><th>Requested By / Channel</th><th>Reason / Changes</th></tr></thead><tbody>' +
        h.map(function (x, i) { return { x: x, i: i }; }).reverse().map(function (o, k) {
          var x = o.x;
          return '<tr>' +
            '<td><a href="' + base + o.i + '" class="btn btn-icon btn-sm btn-success-light btn-wave" title="View / download this version"><i class="ri-download-2-line"></i></a></td>' +
            '<td class="font-monospace">' + x.no + (k === 0 ? ' <span class="badge bg-success-transparent ms-1">Current</span>' : ' <span class="badge bg-light text-muted ms-1">Superseded</span>') + '</td>' +
            '<td>' + x.type + '</td><td class="fs-12">' + x.at + '</td>' +
            '<td class="fs-12">' + (x.requestedBy ? x.requestedBy + ' · ' + x.channel : '-') + '</td>' +
            '<td class="fs-12">' + (x.reason || '-') + (x.changes ? '<div class="text-muted">' + x.changes + '</div>' : '') + '</td></tr>';
        }).join('') +
      '</tbody></table></div></div></div>';
  }

  /* ---------- Edit modal (Action → Edit): Ulangan, Hasil and the vendor certificate of one parameter.
     Saved values are what Excel pre-fills on the next Pull Data. ---------- */
  var editModalEl = document.getElementById('editResultModal');
  var editCode = null;
  var editInputs = ['editU1', 'editU2', 'editU3'].map(function (id) { return document.getElementById(id); });

  function parseCell(v) {
    v = v.trim();
    if (!v) return null;
    var n = Number(v.replace(',', '.'));
    return isNaN(n) ? v : n;
  }
  function editValues() {
    return editInputs.map(function (el) { return parseCell(el.value); }).filter(function (v) { return v !== null; });
  }
  function updateEditHasil() {
    var values = editValues();
    document.getElementById('editHasil').value = values.length ? worksheetResultOf(values) : '';
  }
  editInputs.forEach(function (el) { el.addEventListener('input', updateEditHasil); });

  content.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-edit-result]');
    if (!btn) return;
    editCode = btn.dataset.editResult;
    var row = draftRows().filter(function (r) { return r.p.key === editCode; })[0];
    var values = row.res ? row.res.values : [];
    document.getElementById('editResultTitle').textContent = 'Edit Test Result — ' + row.p.text;
    document.getElementById('editResultInfo').innerHTML = (row.p.sub
      ? '<span class="badge bg-warning-transparent"><i class="ri-building-2-line me-1"></i>Subcontract · ' + row.p.sub + '</span>'
      : '<span class="badge bg-primary-transparent"><i class="ri-flask-line me-1"></i>Internal Lab</span>') +
      '<span class="fs-12 text-muted">' + row.method + ' · ' + row.p.spec + ' (' + row.p.unit + ')</span>';
    editInputs.forEach(function (el, j) { el.value = values[j] != null ? values[j] : ''; });
    updateEditHasil();
    document.getElementById('editCertWrap').classList.toggle('d-none', !row.p.sub);
    document.getElementById('editCertNo').value = row.cert.no || '';
    document.getElementById('editCertFile').value = '';
    document.getElementById('editCertCurrent').innerHTML = row.cert.file ? '<i class="ri-attachment-2 me-1"></i>Current: ' + row.cert.file : '';
    window.bootstrap.Modal.getOrCreateInstance(editModalEl).show();
  });

  document.getElementById('btnSaveResult').addEventListener('click', function () {
    var values = editValues();
    var results = Object.assign({}, record.results);
    if (values.length) results[editCode] = { values: values, result: worksheetResultOf(values) };
    else delete results[editCode];
    var patch = { results: results };
    if (paramSubkontrak(record, editCode)) {
      var certs = Object.assign({}, record.subkontrakCert);
      var cert = Object.assign({}, certs[editCode]);
      var fileEl = document.getElementById('editCertFile');
      cert.no = document.getElementById('editCertNo').value.trim();
      if (fileEl.files[0]) cert.file = fileEl.files[0].name;
      certs[editCode] = cert;
      patch.subkontrakCert = certs;
    }
    record = worksheetUpdateRecord(jenis, record.id, patch);
    window.bootstrap.Modal.getOrCreateInstance(editModalEl).hide();
    render();
    ToastService.showSuccess('Test result updated.');
  });

  /* ---------- Shared modal helpers ---------- */
  function fillChannel(selectId, value) {
    var el = document.getElementById(selectId);
    el.innerHTML = '<option value="">-- Select --</option>' + CHANNELS.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    window.jQuery(el).val(value || '').trigger('change');
  }

  /* ---------- CRL: Submit for Approval ---------- */
  function submitForApproval() {
    var open = jenis === 'internal' ? draftRows().filter(function (r) { return r.flags.length; }) : [];
    if (open.length) {
      ToastService.showWarning('Cannot be submitted yet: ' + open.map(function (r) { return r.p.text + ' (' + r.flags.map(function (f) { return f.text; }).join(', ') + ')'; }).join('; ') + '.');
      return;
    }
    record = worksheetUpdateRecord(jenis, record.id, { reportStatus: 'Confirm to Approve', reportSubmittedBy: role().name, reportSubmittedAt: stamp(),
      reportReturnReason: null, reportReturnedBy: null, reportReturnedAt: null });
    render();
    ToastService.showSuccess('Report of ' + record.id + ' sent to the Technical Manager for approval.');
  }

  /* ---------- TCM: Return to CRL ---------- */
  var returnModalEl = document.getElementById('reportReturnModal');
  function openReturnModal() {
    document.getElementById('reportReturnReason').value = '';
    document.getElementById('reportReturnError').textContent = '';
    window.bootstrap.Modal.getOrCreateInstance(returnModalEl).show();
  }
  document.getElementById('btnConfirmReportReturn').addEventListener('click', function () {
    var reason = document.getElementById('reportReturnReason').value.trim();
    document.getElementById('reportReturnError').textContent = reason ? '' : 'Reason is required.';
    if (!reason) return;
    record = worksheetUpdateRecord(jenis, record.id, { reportStatus: 'Draft', reportReturnReason: reason, reportReturnedBy: role().label, reportReturnedAt: stamp() });
    window.bootstrap.Modal.getOrCreateInstance(returnModalEl).hide();
    render();
    ToastService.showSuccess('Report returned to the CRL: "' + reason + '"');
  });

  /* ---------- TCM: Approve & Issue — every version, also re-tests and revisions ---------- */
  function approveAndIssue() {
    var c = record.reportCycle;
    var base = reportBaseNo(record) || generateReportBaseNo();
    var rt = reportRetestCount(record);
    var revNo = (record.revisions || []).filter(function (rv) { return rv.rt === rt; }).length;
    var reportNo = reportNoFor(record, base, c && c.type === 'Revision' ? revNo : 0);
    var entry = { no: reportNo, type: c ? c.type + ' ' + c.no : 'Original', at: stamp(), approvedBy: role().name,
      reason: c ? c.reason : '', changes: c && c.changes ? c.changes.join(' · ') : '',
      requestedBy: c ? c.requestedBy : '', channel: c ? c.channel : '', snapshot: snapshotOf(record) };
    record = worksheetUpdateRecord(jenis, record.id, { reportStatus: 'Final', reportNo: reportNo, reportBase: base, reportCycle: null,
      reportReturnReason: null, reportReturnedBy: null, reportReturnedAt: null,
      reportHistory: (record.reportHistory || []).concat(entry) });
    render();
    ToastService.showSuccess('Certificate "' + reportNo + '" approved and issued. The request is Closed and the requester can download it.');
  }

  /* ---------- TCM: Re-test (Internal) — shared dialog and logic (retest.js, applyRetest) ---------- */
  function openRetestModal() {
    ensureHistory();
    RetestDialog.open(record, function (updated) { record = updated; render(); });
  }

  /* ---------- CRL / TCM: Revision (after an issue) — Sample Name / Customer Address / Packaging ---------- */
  var revisionModalEl = document.getElementById('revisionModal');
  function openRevisionModal() {
    var siteEl = document.getElementById('revAlamat');
    var packEl = document.getElementById('revKemasan');
    var c = record.reportCycle && record.reportCycle.type === 'Revision' ? record.reportCycle : null;
    siteEl.innerHTML = '<option value="">-- Select --</option>' + siteOptions().map(function (o) { return '<option value="' + o.value + '">' + o.text + '</option>'; }).join('');
    packEl.innerHTML = '<option value="">-- Select --</option>' + flexTabOptions('LAB_JENIS_KEMASAN').map(function (v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
    document.getElementById('revSampel').value = record.sampel || '';
    window.jQuery(siteEl).val(record.alamatPelanggan || '').trigger('change');
    window.jQuery(packEl).val(record.kemasan || '').trigger('change');
    document.getElementById('revRequestedBy').value = c ? c.requestedBy : (record.pemohon || '');
    fillChannel('revChannel', c ? c.channel : 'WhatsApp');
    document.getElementById('revReason').value = c ? c.reason : '';
    document.getElementById('revError').textContent = '';
    window.bootstrap.Modal.getOrCreateInstance(revisionModalEl).show();
  }

  document.getElementById('btnConfirmRevision').addEventListener('click', function () {
    ensureHistory();
    var issuedSnap = (lastIssuedReport(record) || {}).snapshot || snapshotOf(record);
    var next = { sampel: document.getElementById('revSampel').value.trim(), alamatPelanggan: document.getElementById('revAlamat').value, kemasan: document.getElementById('revKemasan').value };
    var labels = { sampel: 'Sample Name', alamatPelanggan: 'Customer Address', kemasan: 'Packaging' };
    var requestedBy = document.getElementById('revRequestedBy').value.trim();
    var channel = document.getElementById('revChannel').value;
    var reason = document.getElementById('revReason').value.trim();
    /* Changes against the certificate issued so far */
    var changes = Object.keys(next).filter(function (k) { return (next[k] || '') !== (issuedSnap[k] || ''); }).map(function (k) {
      var show = function (v) { return k === 'alamatPelanggan' ? siteLabel(v) : (v || '-'); };
      return labels[k] + ': ' + show(issuedSnap[k]) + ' → ' + show(next[k]);
    });
    var err = !next.sampel ? 'Sample Name is required.' : (!changes.length ? 'Change at least one field.' : (!requestedBy || !channel ? 'Requested By and Channel are required.' : (!reason ? 'Reason is required.' : '')));
    document.getElementById('revError').textContent = err;
    if (err) return;
    var open = record.reportCycle && record.reportCycle.type === 'Revision';
    var rt = reportRetestCount(record);
    var revisions = (record.revisions || []).slice();
    var rv = { no: open ? revisions[revisions.length - 1].no : revisions.length + 1, rt: rt, at: stamp(), by: role().label, reason: reason, changes: changes, requestedBy: requestedBy, channel: channel };
    if (open) revisions[revisions.length - 1] = rv; else revisions.push(rv);
    record = worksheetUpdateRecord(jenis, record.id, Object.assign({}, next, {
      revisions: revisions, reportBase: reportBaseNo(record), reportStatus: 'Confirm to Approve',
      reportSubmittedBy: role().name, reportSubmittedAt: rv.at, reportReturnReason: null,
      reportCycle: { type: 'Revision', no: revisions.filter(function (x) { return x.rt === rt; }).length, reason: reason, changes: changes, requestedBy: requestedBy, channel: channel, at: rv.at, by: rv.by }
    }));
    window.bootstrap.Modal.getOrCreateInstance(revisionModalEl).hide();
    render();
    ToastService.showSuccess('Revision sent to the Technical Manager for approval. The current certificate stays valid until then.');
  });

  /* ---------- Buttons per role and report state ---------- */
  function btn(id, cls, icon, text) {
    return '<button type="button" id="' + id + '" class="btn btn-sm ' + cls + ' btn-wave d-inline-flex align-items-center gap-1"><i class="' + icon + '"></i> ' + text + '</button>';
  }
  function renderActionButtons(entry) {
    var r = role();
    var code = r.code;
    var lab = isLabRole(r);
    var status = reportStatusOf(record);
    var c = record.reportCycle;
    var issued = lastIssuedReport(record);
    var html = '<a href="reportList.html" class="btn btn-sm bg-white d-inline-flex align-items-center gap-1"><i class="ri-arrow-left-line"></i> Back</a>';

    if (entry) {
      html += btn('btnDownload', 'btn-success', 'ri-download-2-line', 'Download Certificate');
    } else if (lab) {
      /* Corrective actions in red next to Back, the next workflow step in primary at the end */
      if (code === 'TCM' && jenis === 'internal' && !(c && c.type === 'Revision')) html += btn('btnRetest', 'btn-danger', 'ri-restart-line', 'Re-test');
      if ((code === 'CRL' || code === 'TCM') && issued && status === 'Final') html += btn('btnRevision', 'btn-danger', 'ri-edit-2-line', 'Revision');
      if (code === 'CRL' && status === 'Draft' && c && c.type === 'Revision') html += btn('btnRevision', 'btn-warning text-white', 'ri-edit-2-line', 'Edit Revision');
      html += btn('btnPrint', 'bg-white border', 'ri-printer-line', 'Print Preview');
      if (issued) html += '<a href="reportForm.html?docId=' + encodeURIComponent(record.id) + '&jenis=' + jenis + '&view=issued" class="btn btn-sm btn-success-light d-inline-flex align-items-center gap-1"><i class="ri-award-line"></i> Issued ' + issued.no + '</a>';
      if (code === 'CRL' && status === 'Draft') html += btn('btnSubmitReport', 'btn-primary', 'ri-send-plane-fill', 'Submit for Approval');
      if (code === 'TCM' && status === 'Confirm to Approve') {
        html += btn('btnReturnReport', 'btn-warning text-white', 'ri-arrow-go-back-line', 'Return to CRL');
        html += btn('btnApproveReport', 'btn-primary', 'ri-shield-check-line', 'Approve & Issue');
      }
    }

    var bar = document.getElementById('formActionButtons');
    bar.innerHTML = html;
    var on = function (id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('btnDownload', function () { window.print(); });
    on('btnPrint', function () { window.print(); });
    on('btnSubmitReport', submitForApproval);
    on('btnReturnReport', openReturnModal);
    on('btnApproveReport', approveAndIssue);
    on('btnRetest', openRetestModal);
    on('btnRevision', openRevisionModal);
  }

  render();
  document.addEventListener('holabsys:rolechange', render);
});
