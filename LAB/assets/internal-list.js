function rowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var filterStatus = document.getElementById('filterStatus');
  var expanded = {}; // request id → its Re-test / Revision documents shown

  /* Request List — every internal request with its doc status (+ workflow badge); opens internalForm.html */
  function renderRequestList() {
    var query = tableSearch.value, status = filterStatus.value;
    var all = getRequests();
    var docHits = amendmentMatches(query); // a search on RT- / RV- numbers opens their request
    var rows = all.filter(function (r) {
      return (!status || getDocStatus(r).status === status) && (rowMatchesQuery([r.id, r.sampel, r.tipe, r.tujuan, r.spk], query) || docHits[r.id]);
    });
    rows.sort(newestFirst); // newest document on top
    document.getElementById('countRequest').textContent = all.length;
    document.getElementById('requestListBody').innerHTML = rows.map(function (r) {
      var href = 'internalForm.html?docId=' + r.id;
      var open = !!(expanded[r.id] || docHits[r.id]);
      return '<tr>' +
        '<td><a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Open Request"><i class="ri-eye-line"></i></a></td>' +
        '<td><div class="d-flex align-items-center">' + amendmentToggleHtml(r, open) + '<a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></div></td>' +
        '<td>' + r.tanggal + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + r.tipe + '</td>' +
        /* Progress: analyst work per accepted parameter (analysisProgressHtml) */
        '<td>' + analysisProgressHtml(r) + '</td>' +
        '<td class="font-monospace">' + (r.spk || '<span class="text-muted">-</span>') + '</td>' +
        '<td>' + docStatusBadgesHtml(r) + '</td>' +
        '</tr>' +
        /* Re-test / Revision documents of this request (accordion) */
        (open ? amendmentChildRowsHtml(r, function (a) {
          return '<td class="text-muted fs-12">' + a.tanggal + '</td>' +
            '<td class="text-muted fs-12">' + amendmentSummary(a) + '</td>' +
            '<td>' + amendmentTypeBadgeHtml(a.type) + '</td>' +
            '<td class="text-muted fs-12">Replaces ' + a.refReportNo + '</td>' +
            '<td class="font-monospace text-muted fs-12">' + (a.issuedNo || '-') + '</td>' +
            '<td>' + amendmentStatusBadgesHtml(a) + '</td>';
        }) : '');
    }).join('') || '<tr><td colspan="8" class="text-center text-muted p-4">' + (query || status ? 'No matching results.' : 'No requests yet.') + '</td></tr>';
  }

  document.getElementById('requestListBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-amend-toggle]');
    if (!btn) return;
    expanded[btn.dataset.amendToggle] = !expanded[btn.dataset.amendToggle];
    renderRequestList();
  });
  tableSearch.addEventListener('input', renderRequestList);
  filterStatus.addEventListener('change', renderRequestList);
  renderRequestList();

  /* Header action */
  document.getElementById('listActionButtons').innerHTML =
    '<a href="internalForm.html" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-add-line me-1 align-middle"></i>Create New Request</a>';

  /* Re-render on role switch (mockup role switcher) */
  document.addEventListener('holabsys:rolechange', renderRequestList);
});
