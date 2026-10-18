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
   Issue, or Return to CRL) → Final. After an issue, a Re-test or Revision is a new document
   (amendmentForm.html, RT- / RV-): its Report tab mounts this panel on the same request
   (opts.amendmentId) and works on the new version there, while the request's own Report tab only
   shows the certificate still valid. Lab roles work on the live report; other roles (the requester)
   only see issued certificates and download them.
   ?view=issued[&v=<history index>] shows an issued version from its snapshot. */
/* ---------- Report tab of a request form ----------
   ReportPanel.mount({ jenis, docId, container, actions, backHref, formHref, params, isActive,
     amendmentId, onChange })
   renders the report (LHU) of one request into container, and its buttons into actions (the
   page-header action bar of the request form) while isActive() — the form owns that bar on its other
   tabs. The report stays its own record (number, status, versions; ISO/IEC 17025 cl. 7.8); only the
   screen is shared with the request. formHref = request form URL without query; params =
   URLSearchParams of the page (view=issued&v=n shows an issued version). amendmentId = mounted in
   that Re-test / Revision document (docId stays the request); onChange runs after every report action.
   Returns { render, renderActions, visible }. */

/* Who sees the Report tab: lab roles once a report exists; everyone else (requester, approvers)
   only once a certificate is issued — they see and download issued certificates only */
function reportTabVisible(record, role) {
  if (!record) return false;
  return isLabRole(role) ? !!(record.reportStatus || lastIssuedReport(record)) : !!lastIssuedReport(record);
}
var REPORT_MODALS_HTML = "<div class=\"modal fade\" id=\"editResultModal\" tabindex=\"-1\" aria-hidden=\"true\"><div class=\"modal-dialog modal-dialog-centered\"><div class=\"modal-content\"><div class=\"modal-header\"><h6 class=\"modal-title fw-semibold\" id=\"editResultTitle\">Subcontract Certificate</h6><button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"Close\"></button></div><div class=\"modal-body\"><form id=\"editResultForm\"><div class=\"d-flex align-items-center flex-wrap gap-2 mb-3\" id=\"editResultInfo\"></div><!-- Results are entered only in Excel (one source, logged); this modal attaches the vendor certificate --><div class=\"alert alert-info fs-12 py-2\"><i class=\"ri-information-line me-1\"></i>The result itself is typed in Excel from the vendor certificate, so every change is in the audit trail.</div><div class=\"row g-3\"><div class=\"col-12\" id=\"editCertWrap\"><div class=\"row g-3\"><div class=\"col-12 col-md-6\"><label class=\"form-label\" for=\"editCertNo\">External Lab Certificate No.</label><input type=\"text\" class=\"form-control\" id=\"editCertNo\" placeholder=\"Vendor certificate no.\" /></div><div class=\"col-12 col-md-6\"><label class=\"form-label\" for=\"editCertFile\">Certificate File</label><input type=\"file\" class=\"form-control\" id=\"editCertFile\" accept=\".pdf,.jpg,.png\" /><div class=\"form-text fs-11\" id=\"editCertCurrent\"></div></div></div></div></div></form></div><div class=\"modal-footer\"><button type=\"button\" class=\"btn btn-sm btn-light\" data-bs-dismiss=\"modal\">Cancel</button><button type=\"button\" class=\"btn btn-sm btn-primary btn-wave\" id=\"btnSaveResult\"><i class=\"ri-save-line me-1\"></i>Save</button></div></div></div></div><div class=\"modal fade\" id=\"reportReturnModal\" tabindex=\"-1\" aria-hidden=\"true\"><div class=\"modal-dialog modal-dialog-centered\"><div class=\"modal-content\"><div class=\"modal-header\"><h6 class=\"modal-title fw-semibold\">Return to CRL</h6><button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"modal\" aria-label=\"Close\"></button></div><div class=\"modal-body\"><p class=\"text-muted fs-12\">The report goes back to Draft. The CRL sees your note, corrects the results (Excel or Edit) and submits again.</p><label class=\"form-label\" for=\"reportReturnReason\">Reason <span class=\"text-danger\">*</span></label><textarea id=\"reportReturnReason\" class=\"form-control\" rows=\"3\" placeholder=\"What has to be corrected...\"></textarea><div class=\"text-danger fs-12 mt-1\" id=\"reportReturnError\"></div></div><div class=\"modal-footer\"><button type=\"button\" class=\"btn btn-sm btn-light\" data-bs-dismiss=\"modal\">Cancel</button><button type=\"button\" class=\"btn btn-sm btn-warning text-white\" id=\"btnConfirmReportReturn\"><i class=\"ri-arrow-go-back-line me-1\"></i>Return to CRL</button></div></div></div></div>";

var ReportPanel = { mount: function (opts) {
  var urlParams = opts.params || new URLSearchParams('');
  var docId = opts.docId;
  var jenis = opts.jenis;
  var record = worksheetGetRecord(jenis, docId);
  if (!document.getElementById('editResultModal')) document.body.insertAdjacentHTML('beforeend', REPORT_MODALS_HTML);

  opts.container.innerHTML =
    '<div class="card custom-card no-print d-flex flex-row align-items-center flex-wrap gap-2 p-2 mb-3">' +
      '<div class="d-flex flex-column gap-1 lh-1"><span class="text-uppercase text-muted fs-10">LHU No.</span>' +
        '<span class="fs-13 text-heading text-nowrap font-monospace" data-report-no>Not Issued</span></div>' +
      '<span class="d-none d-sm-inline-block text-muted opacity-50 fs-10 user-select-none lh-1">|</span>' +
      '<div class="d-flex flex-column gap-1 lh-1"><span class="text-uppercase text-muted fs-10">Report Status</span><span data-report-status></span></div>' +
    '</div><div data-report-content></div>';
  var content = opts.container.querySelector('[data-report-content]');
  var reportNoEl = opts.container.querySelector('[data-report-no]');
  var reportStatusEl = opts.container.querySelector('[data-report-status]');
  var active = opts.isActive || function () { return true; };
  /* Links inside the report point back to the Report tab of this request form */
  function tabHref(extra) { return opts.formHref + '?docId=' + encodeURIComponent(docId) + '&tab=report' + (extra || ''); }

  if (!record) {
    content.innerHTML = '<div class="card custom-card"><div class="card-body text-center text-muted py-5">Document not found.</div></div>';
    return { render: function () {}, renderActions: function () {}, visible: function () { return false; } };
  }

  var stamp = function () { return reportStamp(); };
  var role = function () { return currentRole(); };

  /* Mounted in a Re-test / Revision document: that document, else null */
  function amendment() { return opts.amendmentId ? getAmendmentById(opts.amendmentId) : null; }
  /* On the request while its new version is worked on in an RT- / RV- document */
  function cycleElsewhere() { return !opts.amendmentId && !!openAmendmentOf(record); }
  /* Where the working report is: the open document's Report tab, else this tab */
  function workingHref() {
    var id = opts.amendmentId || (openAmendmentOf(record) || {}).id;
    return id ? amendmentHref(id, '&tab=report') : tabHref('');
  }

  /* ---------- Which version is shown ---------- */
  function issuedEntries() {
    return (record.reportHistory || []).length ? record.reportHistory : (lastIssuedReport(record) ? [lastIssuedReport(record)] : []);
  }
  /* The history entry being viewed, or null for the live (working) report */
  function viewedEntry() {
    var list = issuedEntries();
    var v = urlParams.get('v');
    var pick = function (fallback) { return list[v !== null && list[v] ? Number(v) : fallback] || null; };
    var lab = isLabRole(role());
    var issuedView = urlParams.get('view') === 'issued';
    var a = amendment();
    if (a && a.step === 'Closed') {
      var at = list.map(function (e) { return e.no; }).indexOf(a.issuedNo);
      return pick(at === -1 ? list.length - 1 : at);
    }
    /* Open document: lab roles work on the new version; the requester waits for it */
    if (a) return lab && issuedView ? pick(list.length - 1) : null;
    if (!lab || issuedView || cycleElsewhere()) return pick(list.length - 1);
    return null;
  }
  /* Record as printed: an issued version takes the fields of its snapshot */
  function docView(entry) {
    if (!entry) return record;
    return Object.assign({}, record, entry.snapshot || {}, { reportNo: entry.no, reportStatus: 'Final', reportHistoryEntry: entry });
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
    record = worksheetGetRecord(jenis, docId);
    updateDocInfoBar();
    if (!entry && !isLabRole(role())) {
      var valid = lastIssuedReport(record);
      content.innerHTML = '<div class="card custom-card"><div class="card-body text-center text-muted py-5">' +
        '<i class="ri-time-line fs-24 d-block mb-1"></i>' + (amendment() && valid
          ? 'The new certificate has not been issued yet. Until the Technical Manager approves it, ' + valid.no + ' stays valid.'
          : 'The certificate has not been issued yet. It appears here once the Technical Manager approves it.') + '</div></div>';
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

    /* KAN scope (cl. 7.8.1 / KAN symbol rules): parameters outside the accreditation scope get **;
       Status = statement of conformity by the decision rule (specConformity), '-' when none applies */
    var anyInScope = false, anyOutScope = false;
    function resultRow(i, text, unit, method, spec, result, pass, mu, inScope) {
      if (pass === undefined) pass = specConformity(spec, result);
      if (inScope) anyInScope = true; else anyOutScope = true;
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + text + (inScope ? '' : ' <sup>**</sup>') + '</td>' +
        '<td>' + unit + '</td>' +
        '<td class="font-monospace">' + method + '</td>' +
        '<td>' + spec + '</td>' +
        '<td class="font-monospace fw-semibold">' + result + '</td>' +
        '<td class="font-monospace">' + (mu || '-') + '</td>' +
        '<td>' + (pass === false ? '<span class="badge bg-danger-transparent">FAIL</span>' : pass === true ? '<span class="badge bg-success-transparent">PASS</span>' : '<span class="text-muted">-</span>') + '</td>' +
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
        /* Panel tests are outside the KAN scope of this lab (Parameter master: Sensory / ASLT scope = No) */
        return resultRow(i, r.text, r.unit, REPORT_METHOD_BY_SOURCE[jenis], r.spec, r.result, r.pass, '-', false);
      }).join('');
    } else {
      /* Subkontrak parameters get a * and the legend under the table */
      rows = (doc.paramsDiterima || doc.params || []).map(function (code, i) {
        var p = labParameter('Internal', code);
        var sub = paramSubkontrak(record, code);
        var text = (p ? p.text : code) + (sub ? ' <sup>*</sup>' : '');
        /* A subcontracted result is under the vendor's accreditation, not this lab's scope */
        return resultRow(i, text, p ? p.unit : '-', reportMethod(code), p ? p.spec : '-', results[code] ? results[code].result : '-',
          undefined, sub ? '-' : (p && p.mu) || '-', !sub && !!(p && p.scope));
      }).join('');
      /* Requested but not tested (Not Testable / dropped after the SPK): listed, never left out silently */
      var accepted = doc.paramsDiterima || doc.params || [];
      var notTested = (doc.params || []).filter(function (code) { return accepted.indexOf(code) === -1; });
      rows += notTested.map(function (code, k) {
        var p = labParameter('Internal', code);
        return '<tr class="text-muted"><td>' + (accepted.length + k + 1) + '</td><td>' + (p ? p.text : code) + ' <sup>***</sup></td><td>' + (p ? p.unit : '-') + '</td>' +
          '<td class="font-monospace">' + (p ? p.method : '-') + '</td><td>' + (p ? p.spec : '-') + '</td><td>Not tested</td><td>-</td><td>-</td></tr>';
      }).join('');
      var notTestedNote = notTested.length ? '<sup>***</sup> Not tested' + (doc.catatanKajiUlang ? ': ' + doc.catatanKajiUlang : '.') + '<br>' : '';
    }

    var verified = status !== 'Draft';
    var isFinal = status === 'Final';
    var entry = doc.reportHistoryEntry || (isFinal ? issuedEntries()[issuedEntries().length - 1] : null);
    var receipt = doc.receipt || {};
    function day(iso) { var d = iso ? new Date(iso) : null; return d ? String(d.getDate()).padStart(2, '0') + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + d.getFullYear() : ''; }
    /* Testing period: SPK issue (or the first push when there is no SPK: Sensory / ASLT, older records) → last push */
    var start = doc.spkAt ? doc.spkAt.split(' ')[0] : day(doc.firstPushAt);
    var end = day(doc.pushedAt);
    var period = start && end && start !== end ? start + ' – ' + end : (start || end);
    return '<div class="card custom-card"><div class="card-body">' +
      '<div class="printable-doc" id="printableDoc">' +

      '<div class="cert-header">' +
      '<div class="cert-header-brand">' +
      '<img src="../assets/img/garudafood-logo.png" alt="Garudafood" />' +
      '<div><h4>HOLABSYS Central Laboratory</h4>' +
      '<p>Testing, Inspection &amp; Quality Assurance Center</p>' +
      '<p>PT Garudafood Putra Putri Jaya Tbk</p></div>' +
      '</div>' +
      /* KAN symbol only when the report holds at least one result within the accreditation scope */
      (anyInScope ? '<div class="cert-kan-box">' +
        '<div class="box"><div class="kan">KAN</div><div class="lp">LP-1234-IDN</div></div>' +
        '<small>ISO/IEC 17025</small>' +
        '</div>' : '') +
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
      '<div class="row-item"><span>Sample Received</span><span>' + (receipt.at || '-') + '</span></div>' +
      '<div class="row-item"><span>Receipt Note</span><span>' + ((receipt.condition ? receipt.condition + (receipt.note ? ' — ' : '') : '') + (receipt.note || '') || '-') + '</span></div>' +
      '<div class="row-item"><span>Testing Period</span><span>' + (period || '-') + '</span></div>' +
      '<div class="row-item"><span>Date of Issue</span><span>' + (entry && entry.at && entry.at !== '-' ? entry.at.split(',')[0] : (isFinal ? '-' : '(not issued)')) + '</span></div>' +
      '<div class="row-item"><span>Request Type</span><span>' + doc.tipe + '</span></div>' +
      '<div class="row-item"><span>Customer Address</span><span>' + siteLabel(doc.alamatPelanggan) + '</span></div>' +
      '<div class="row-item"><span>Packaging</span><span>' + (doc.kemasan || '-') + '</span></div>' +
      '</div>' +

      '<table class="cert-result-table"><thead><tr>' +
      '<th>No</th><th>Test Parameter</th><th>Unit</th><th>Reference Method</th><th>Quality Standard / Specification</th><th>Test Result</th><th>Uncertainty (k=2)</th><th>Status</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>' +
      (jenis === 'internal' ? subkontrakLegendHtml(doc) : '') +
      '<div class="cert-legend">' +
        (typeof notTestedNote === 'string' ? notTestedNote : '') +
        (anyOutScope ? '<sup>**</sup> ' + (anyInScope ? 'Not included in the KAN accreditation scope of this laboratory (LP-1234-IDN).' : 'This report contains no results within the KAN accreditation scope; the KAN symbol is therefore not used.') + '<br>' : '') +
        DECISION_RULE_TEXT + '<br>' +
        'The results relate only to the items tested, as received. This report shall not be reproduced except in full without the written approval of the laboratory.' +
      '</div>' +

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
      'Final': 'Issued. A re-test or revision is a new document (RT- / RV-) whose new version follows the same steps.'
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
        ? '<div class="alert alert-warning d-flex align-items-start gap-2 py-2 fs-13 mt-3 mb-0"><i class="ri-arrow-go-back-line fs-16"></i>' +
          '<div><div class="fw-semibold">Returned by ' + record.reportReturnedBy + ' · ' + record.reportReturnedAt + '</div>' + record.reportReturnReason + '</div></div>' : '') +
      (c
        ? '<div class="alert alert-danger d-flex align-items-start gap-2 py-2 fs-13 mt-3 mb-0"><i class="ri-restart-line fs-16"></i>' +
          '<div><div class="fw-semibold">' + c.type + ' ' + (c.amendmentId || c.no) + ' · ' + c.by + ' · ' + c.at + '</div>' +
          (c.params ? c.params.join(', ') + ' — ' : '') + (c.changes ? c.changes.join(' · ') + ' — ' : '') + c.reason +
          (issued ? '<div class="text-muted fs-12">Until this is approved, ' + issued.no + ' stays the valid certificate.</div>' : '') + '</div></div>' : '') +
      '</div></div>';
  }

  function issuedViewNoteHtml(entry) {
    var lab = isLabRole(role());
    var all = issuedEntries();
    var current = entry.no === all[all.length - 1].no;
    return '<div class="alert ' + (current ? 'alert-success' : 'alert-secondary') + ' d-flex align-items-center flex-wrap gap-2 py-2 fs-13 no-print">' +
      '<i class="ri-award-line fs-16"></i><div class="flex-fill">' +
      '<span class="fw-semibold">Certificate ' + entry.no + '</span> · ' + entry.type + (entry.at && entry.at !== '-' ? ' · issued ' + entry.at : '') +
      (current ? '' : ' · <span class="fw-semibold">superseded</span> by ' + issuedEntries()[issuedEntries().length - 1].no) +
      (record.reportCycle && current ? '<div class="fs-12 text-muted">' + record.reportCycle.type + ' ' + (record.reportCycle.amendmentId || '') +
        ' in progress — this certificate stays valid until the new one is approved.</div>' : '') +
      '</div>' +
      /* Link to the working report: the open RT- / RV- document, or this tab */
      (lab && record.reportStatus !== 'Final'
        ? '<a href="' + workingHref() + '" class="btn btn-sm btn-light">' + (cycleElsewhere() ? 'Open ' + openAmendmentOf(record).id : 'Open working report') + '</a>' : '') +
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
      if (p.sub && consentPending(record) && record.customerConsent.items.some(function (it) { return it.code === p.key; })) flags.push({ cls: 'bg-danger-transparent', text: 'Requester has not approved the subcontract' });
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
            '<td><div class="d-flex gap-1">' + (r.p.sub
              ? '<button type="button" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Attach vendor certificate" data-edit-result="' + code + '"><i class="ri-attachment-2"></i></button>'
              : '<a href="excel.html" class="btn btn-icon btn-sm btn-light btn-wave" title="Results are entered in Excel"><i class="ri-file-excel-2-line"></i></a>') + '</div></td>' +
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
    var base = tabHref('&view=issued&v=');
    return '<div class="card custom-card no-print"><div class="card-body">' +
      '<h6 class="fw-semibold mb-3">Report History</h6>' +
      '<div class="table-responsive rounded border"><table class="table table-sm align-middle mb-0">' +
        '<thead><tr><th>Action</th><th>LHU No.</th><th>Type</th><th>Issued</th><th>Reason / Changes</th></tr></thead><tbody>' +
        h.map(function (x, i) { return { x: x, i: i }; }).reverse().map(function (o, k) {
          var x = o.x;
          return '<tr>' +
            '<td><a href="' + base + o.i + '" class="btn btn-icon btn-sm btn-success-light btn-wave" title="View / download this version"><i class="ri-download-2-line"></i></a></td>' +
            '<td class="font-monospace">' + x.no + (k === 0 ? ' <span class="badge bg-success-transparent ms-1">Current</span>' : ' <span class="badge bg-light text-muted ms-1">Superseded</span>') + '</td>' +
            '<td>' + x.type + '</td><td class="fs-12">' + x.at + '</td>' +
            '<td class="fs-12">' + (x.reason || '-') + (x.changes ? '<div class="text-muted">' + x.changes + '</div>' : '') + '</td></tr>';
        }).join('') +
      '</tbody></table></div></div></div>';
  }

  /* ---------- Certificate modal (Subcontract rows): vendor certificate No. + file. Results are
     entered only in Excel, so the report has one source and every change is logged. ---------- */
  var editModalEl = document.getElementById('editResultModal');
  var editCode = null;

  content.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-edit-result]');
    if (!btn) return;
    editCode = btn.dataset.editResult;
    var row = draftRows().filter(function (r) { return r.p.key === editCode; })[0];
    document.getElementById('editResultTitle').textContent = 'Subcontract Certificate — ' + row.p.text;
    document.getElementById('editResultInfo').innerHTML = (row.p.sub
      ? '<span class="badge bg-warning-transparent"><i class="ri-building-2-line me-1"></i>Subcontract · ' + row.p.sub + '</span>'
      : '<span class="badge bg-primary-transparent"><i class="ri-flask-line me-1"></i>Internal Lab</span>') +
      '<span class="fs-12 text-muted">' + row.method + ' · ' + row.p.spec + ' (' + row.p.unit + ')</span>';
    document.getElementById('editCertNo').value = row.cert.no || '';
    document.getElementById('editCertFile').value = '';
    document.getElementById('editCertCurrent').innerHTML = row.cert.file ? '<i class="ri-attachment-2 me-1"></i>Current: ' + row.cert.file : '';
    window.bootstrap.Modal.getOrCreateInstance(editModalEl).show();
  });

  document.getElementById('btnSaveResult').onclick = function () {
    var certs = Object.assign({}, record.subkontrakCert);
    var cert = Object.assign({}, certs[editCode]);
    var fileEl = document.getElementById('editCertFile');
    cert.no = document.getElementById('editCertNo').value.trim();
    if (fileEl.files[0]) cert.file = fileEl.files[0].name;
    certs[editCode] = cert;
    var log = (record.resultLog || []).concat({ at: nowStamp(), ts: Date.now(), by: role().name, action: 'Certificate attached', code: editCode,
      values: [], result: (record.results && record.results[editCode] || {}).result || '', note: (cert.no || '-') + (cert.file ? ' · ' + cert.file : '') });
    record = worksheetUpdateRecord(jenis, record.id, { subkontrakCert: certs, resultLog: log });
    window.bootstrap.Modal.getOrCreateInstance(editModalEl).hide();
    render();
    ToastService.showSuccess('Vendor certificate saved.');
  };

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
    if (opts.onChange) opts.onChange();
    ToastService.showSuccess('Report of ' + record.id + ' sent to the Technical Manager for approval.');
  }

  /* ---------- TCM: Return to CRL ---------- */
  var returnModalEl = document.getElementById('reportReturnModal');
  function openReturnModal() {
    document.getElementById('reportReturnReason').value = '';
    document.getElementById('reportReturnError').textContent = '';
    window.bootstrap.Modal.getOrCreateInstance(returnModalEl).show();
  }
  document.getElementById('btnConfirmReportReturn').onclick = function () {
    var reason = document.getElementById('reportReturnReason').value.trim();
    document.getElementById('reportReturnError').textContent = reason ? '' : 'Reason is required.';
    if (!reason) return;
    record = worksheetUpdateRecord(jenis, record.id, { reportStatus: 'Draft', reportReturnReason: reason, reportReturnedBy: role().label, reportReturnedAt: stamp() });
    window.bootstrap.Modal.getOrCreateInstance(returnModalEl).hide();
    render();
    if (opts.onChange) opts.onChange();
    ToastService.showSuccess('Report returned to the CRL: "' + reason + '"');
  };

  /* ---------- TCM: Approve & Issue — every version, also re-tests and revisions ---------- */
  function approveAndIssue() {
    var c = record.reportCycle;
    var base = reportBaseNo(record) || generateReportBaseNo();
    var rt = reportRetestCount(record);
    var revNo = (record.revisions || []).filter(function (rv) { return rv.rt === rt; }).length;
    var reportNo = reportNoFor(record, base, c && c.type === 'Revision' ? revNo : 0);
    var replaces = lastIssuedReport(record);
    var entry = { no: reportNo, type: c ? c.type + ' ' + (c.amendmentId || c.no) : 'Original', at: stamp(), approvedBy: role().name,
      reason: c ? c.reason : '', changes: c && c.changes ? c.changes.join(' · ') : '', amendmentId: c ? c.amendmentId || null : null,
      snapshot: reportSnapshot(record) };
    record = worksheetUpdateRecord(jenis, record.id, { reportStatus: 'Final', reportNo: reportNo, reportBase: base, reportCycle: null,
      reportReturnReason: null, reportReturnedBy: null, reportReturnedAt: null,
      reportHistory: (record.reportHistory || []).concat(entry) });
    /* The Re-test / Revision document is done; the certificate it replaces is superseded */
    if (c && c.amendmentId) closeAmendment(c.amendmentId, reportNo, replaces ? replaces.no : '');
    render();
    if (opts.onChange) opts.onChange();
    ToastService.showSuccess('Certificate "' + reportNo + '" approved and issued. The request is Closed and the requester can download it.');
  }

  /* ---------- Buttons per role and report state ---------- */
  function btn(id, cls, icon, text) {
    return spkButtonHtml(id, cls, icon, text, { id: id });
  }
  function renderActionButtons(entry) {
    var r = role();
    var code = r.code;
    var lab = isLabRole(r);
    var status = reportStatusOf(record);
    var issued = lastIssuedReport(record);
    var html = spkDocButtonHtml('back', { href: opts.backHref });

    if (entry) {
      if (!opts.amendmentId) html += amendmentButtonsHtml(jenis, record, r); // Re-test also for the requester
      html += btn('btnDownload', 'success', 'ri-download-line', 'Download Certificate');
    } else if (lab) {
      /* Corrective actions in red next to Back, the next workflow step in primary at the end */
      /* After an issue: start a Re-test / Revision document (corrective, in red next to Back) */
      if (!opts.amendmentId) html += amendmentButtonsHtml(jenis, record, r);
      html += btn('btnPrint', 'secondary', 'ri-printer-line', 'Print Preview');
      if (issued) html += '<a href="' + tabHref('&view=issued') + '" class="btn btn-success-light btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-award-line me-1"></i><span>Issued ' + issued.no + '</span></a>';
      if (code === 'CRL' && status === 'Draft') html += btn('btnSubmitReport', 'success', 'ri-send-plane-fill', 'Submit for Approval');
      if (code === 'TCM' && status === 'Confirm to Approve') {
        html += btn('btnReturnReport', 'warning', 'ri-file-edit-line', 'Return to CRL');
        html += btn('btnApproveReport', 'success', 'ri-thumb-up-line', 'Approve & Issue');
      }
    }

    if (!active()) return;
    opts.actions.innerHTML = html;
    var on = function (id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('btnDownload', function () { window.print(); });
    on('btnPrint', function () { window.print(); });
    on('btnSubmitReport', function () { SpkConfirm.open(SPK_DOC_BUTTONS.submit.confirm, submitForApproval); });
    on('btnReturnReport', openReturnModal);
    on('btnApproveReport', function () { SpkConfirm.open('Approve and issue this certificate?', approveAndIssue); });
  }

  render();
  document.addEventListener('holabsys:rolechange', function () { if (reportTabVisible(worksheetGetRecord(jenis, docId), role())) render(); });
  return {
    render: render,
    renderActions: function () { renderActionButtons(viewedEntry()); },
    visible: function () { return reportTabVisible(worksheetGetRecord(jenis, docId), role()); }
  };
} };
