function reportRowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

/* Draft & Final Report — one list fed by Internal / Sensory / ASLT (after Push Data in Excel).
   Lab roles see every report and its state (Draft → Confirm to Approve → Final); other roles (the
   requester) see only issued certificates, opened straight on the issued version to download. */
document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var filterJenis = document.getElementById('filterJenis');
  var filterStatus = document.getElementById('filterStatus');

  function render() {
    var query = tableSearch.value, jenis = filterJenis.value, status = filterStatus.value;
    var lab = isLabRole(currentRole());
    var rows = getReportRows().filter(function (row) {
      var r = row.record, st = reportStatusOf(r);
      if (!lab && !lastIssuedReport(r)) return false;
      return (!jenis || row.source === jenis) && (!status || st === status) &&
        reportRowMatchesQuery([r.id, r.sampel, r.reportNo], query);
    });
    rows.sort(newestFirst); // newest document on top

    document.getElementById('countReport').textContent = rows.length;
    document.getElementById('reportListBody').innerHTML = rows.map(function (row) {
      var r = row.record, src = WORKSHEET_SOURCES[row.source];
      var issued = lastIssuedReport(r);
      /* Opens the Report tab of the request form (REPORT_FORM_PAGE) */
      /* An open Re-test / Revision: lab roles work on the new version in that document (RT- / RV-) */
      var amend = lab ? openAmendmentOf(r) : null;
      var href = amend ? amendmentHref(amend.id, amend.step === 'Open' ? '&tab=report' : '')
        : REPORT_FORM_PAGE[row.source] + '?docId=' + encodeURIComponent(r.id) + '&tab=report' + (lab ? '' : '&view=issued');
      var statusBadge = lab ? reportStatusBadgeHtml(r) : '<span class="badge bg-success-transparent">Issued</span>';
      var reportNo = r.reportStatus === 'Final' ? r.reportNo : (issued ? issued.no : 'Not Issued');
      return '<tr>' +
        '<td><a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Open Report"><i class="ri-file-text-line"></i></a></td>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td><span class="badge ' + src.badge + '">' + src.label + '</span></td>' +
        '<td>' + r.sampel + '</td>' +
        '<td class="font-monospace">' + reportNo + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="6" class="text-center text-muted p-4">' +
      (query || jenis || status ? 'No matching results.' : 'No reports yet. Push Data from Excel to create a Draft.') + '</td></tr>';
  }

  tableSearch.addEventListener('input', render);
  filterJenis.addEventListener('change', render);
  filterStatus.addEventListener('change', render);
  render();
  document.addEventListener('holabsys:rolechange', render);
});
