function rowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var filterStatus = document.getElementById('filterStatus');

  /* Request List — every internal request with its doc status (+ workflow badge); opens internalForm.html */
  function renderRequestList() {
    var query = tableSearch.value, status = filterStatus.value;
    var all = getRequests();
    var rows = all.filter(function (r) {
      return (!status || getDocStatus(r).status === status) && rowMatchesQuery([r.id, r.sampel, r.tipe, r.tujuan, r.spk], query);
    });
    document.getElementById('countRequest').textContent = all.length;
    document.getElementById('requestListBody').innerHTML = rows.map(function (r) {
      var href = 'internalForm.html?docId=' + r.id;
      return '<tr>' +
        '<td><a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Buka Pengajuan"><i class="ri-eye-line"></i></a></td>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + r.tanggal + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + r.tipe + '</td>' +
        '<td>' + r.tujuan + '</td>' +
        '<td class="font-monospace">' + (r.spk || '<span class="text-muted">-</span>') + '</td>' +
        '<td>' + docStatusBadgesHtml(r) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="8" class="text-center text-muted p-4">' + (query || status ? 'Tidak ada hasil yang cocok.' : 'Belum ada pengajuan.') + '</td></tr>';
  }

  tableSearch.addEventListener('input', renderRequestList);
  filterStatus.addEventListener('change', renderRequestList);
  renderRequestList();

  /* Header action */
  document.getElementById('listActionButtons').innerHTML =
    '<a href="internalForm.html" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-add-line me-1 align-middle"></i>Buat Pengajuan Baru</a>';

  /* Re-render on role switch (mockup role switcher) */
  document.addEventListener('holabsys:rolechange', renderRequestList);
});
