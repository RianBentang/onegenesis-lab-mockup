/* ---------- Master Data › Invoice Lab Eksternal list (status filter + search, edit / delete) ---------- */
document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var filterStatus = document.getElementById('filterStatus');
  var body = document.getElementById('invoiceListBody');
  var deleteModal = new bootstrap.Modal(document.getElementById('deleteInvoiceModal'));
  var pendingDelete = null;

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function requestHref(q) {
    return '../HOLABSYS/' + (q.jenis === 'External' ? 'externalForm.html' : 'internalForm.html') + '?docId=' + encodeURIComponent(q.id);
  }

  function render() {
    var q = tableSearch.value.trim().toLowerCase();
    var status = filterStatus.value;
    var all = getInvoices().sort(function (a, b) { return (parseDmy(b.tanggal) || 0) - (parseDmy(a.tanggal) || 0); });
    var rows = all.filter(function (inv) {
      if (status && invoiceStatusLabel(inv) !== status) return false;
      if (!q) return true;
      return [inv.no, inv.vendor, inv.catatan].concat((inv.requests || []).map(function (r) { return r.id; }))
        .some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
    });
    rows.sort(newestFirst); // newest document on top
    document.getElementById('countInvoice').textContent = all.length;
    body.innerHTML = rows.map(function (inv) {
      var href = 'invoiceForm.html?no=' + encodeURIComponent(inv.no);
      return '<tr>' +
        /* SpkTableActions: edit + delete */
        '<td><div class="d-flex gap-1">' +
          '<a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Edit Invoice"><i class="ri-edit-line"></i></a>' +
          '<button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" title="Delete Invoice" data-delete="' + esc(inv.no) + '"><i class="ri-delete-bin-line"></i></button>' +
        '</div></td>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + esc(inv.no) + '</a></td>' +
        '<td>' + esc(inv.vendor) + '</td>' +
        '<td>' + esc(inv.tanggal) + '</td>' +
        '<td>' + (inv.jatuhTempo ? esc(inv.jatuhTempo) : '<span class="text-muted">-</span>') + '</td>' +
        '<td class="font-monospace">' + formatRupiah(inv.nominal) + '</td>' +
        '<td>' + (inv.requests || []).map(function (r) {
          return '<a href="' + requestHref(r) + '" class="badge ' + (r.jenis === 'External' ? 'bg-info-transparent' : 'bg-primary-transparent') + ' font-monospace me-1">' + esc(r.id) + '</a>';
        }).join('') + '</td>' +
        '<td>' + invoiceStatusBadge(inv) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="8" class="text-center text-muted py-4">No invoices.</td></tr>';
  }

  body.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-delete]');
    if (!btn) return;
    pendingDelete = btn.dataset.delete;
    document.getElementById('deleteInvoiceNo').textContent = pendingDelete;
    deleteModal.show();
  });

  document.getElementById('btnConfirmDeleteInvoice').addEventListener('click', function () {
    if (!pendingDelete) return;
    deleteInvoice(pendingDelete);
    ToastService.showSuccess('Invoice "' + pendingDelete + '" deleted.');
    pendingDelete = null;
    deleteModal.hide();
    render();
  });

  tableSearch.addEventListener('input', render);
  window.jQuery(filterStatus).on('change', render);
  render();
});
