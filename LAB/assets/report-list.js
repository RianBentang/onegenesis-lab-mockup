function reportRowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

/* Draft & Final Report — one list fed by Internal / Sensory / ASLT (after Push Data in Excel)
   and External (vendor COA). There is no Push Data step here any more. */
document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var filterJenis = document.getElementById('filterJenis');
  var filterStatus = document.getElementById('filterStatus');

  function render() {
    var query = tableSearch.value, jenis = filterJenis.value, status = filterStatus.value;
    var rows = getReportRows().filter(function (row) {
      var r = row.record, st = r.reportStatus === 'Final' ? 'Final' : 'Draft';
      return (!jenis || row.source === jenis) && (!status || st === status) &&
        reportRowMatchesQuery([r.id, r.sampel, r.reportNo], query);
    });

    document.getElementById('countReport').textContent = rows.length;
    document.getElementById('reportListBody').innerHTML = rows.map(function (row) {
      var r = row.record, src = WORKSHEET_SOURCES[row.source];
      var href = 'reportForm.html?docId=' + encodeURIComponent(r.id) + '&jenis=' + row.source;
      var statusBadge = r.reportStatus === 'Final'
        ? '<span class="badge bg-success-transparent">Final</span>'
        : '<span class="badge bg-warning-transparent">Draft</span>';
      return '<tr>' +
        '<td><a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Buka Laporan"><i class="ri-file-text-line"></i></a></td>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td><span class="badge ' + src.badge + '">' + src.label + '</span></td>' +
        '<td>' + r.sampel + '</td>' +
        '<td class="font-monospace">' + (r.reportNo || 'Belum Terbit') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="6" class="text-center text-muted p-4">' +
      (query || jenis || status ? 'Tidak ada hasil yang cocok.' : 'Belum ada laporan. Push Data dari Excel untuk membuat Draft.') + '</td></tr>';
  }

  tableSearch.addEventListener('input', render);
  filterJenis.addEventListener('change', render);
  filterStatus.addEventListener('change', render);
  render();
});
