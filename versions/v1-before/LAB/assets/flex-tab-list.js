/* ---------- Master Data › Flex Tab list (onegenesis-web pages/Core/GEN/FlexTab/FlexTab.jsx) ---------- */
document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var body = document.getElementById('flexTabListBody');
  var deleteModal = new bootstrap.Modal(document.getElementById('deleteFlexTabModal'));
  var pendingDelete = null;

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function render() {
    var q = tableSearch.value.trim().toLowerCase();
    var all = getFlexTabs().sort(function (a, b) { return a.flexTabId.localeCompare(b.flexTabId); });
    var rows = all.filter(function (t) {
      if (!q) return true;
      return [t.flexTabId, t.description, t.flexTabParentId].concat(t.items.map(function (it) { return it.description; }))
        .some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
    });
    document.getElementById('countFlexTab').textContent = all.length;
    body.innerHTML = rows.map(function (t) {
      var href = 'flexTabForm.html?id=' + encodeURIComponent(t.flexTabId);
      return '<tr>' +
        /* SpkTableActions: edit + delete */
        '<td><div class="d-flex gap-1">' +
          '<a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Edit FlexTab"><i class="ri-edit-line"></i></a>' +
          '<button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" title="Delete FlexTab" data-delete="' + esc(t.flexTabId) + '"><i class="ri-delete-bin-line"></i></button>' +
        '</div></td>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + esc(t.flexTabId) + '</a></td>' +
        '<td>' + esc(t.description) + '</td>' +
        '<td class="font-monospace">' + (t.flexTabParentId ? esc(t.flexTabParentId) : '<span class="text-muted">-</span>') + '</td>' +
        '<td><span class="badge bg-primary-transparent">' + t.items.length + ' item</span></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="5" class="text-center text-muted p-4">' + (q ? 'No matching results.' : 'No FlexTabs yet.') + '</td></tr>';
  }

  body.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-delete]');
    if (!btn) return;
    pendingDelete = btn.dataset.delete;
    document.getElementById('deleteFlexTabId').textContent = pendingDelete;
    deleteModal.show();
  });

  document.getElementById('btnConfirmDeleteFlexTab').addEventListener('click', function () {
    var used = getFlexTabs().filter(function (t) { return t.flexTabParentId === pendingDelete; });
    deleteModal.hide();
    if (used.length) {
      ToastService.showWarning('FlexTab ' + pendingDelete + ' is still the parent of ' + used.map(function (t) { return t.flexTabId; }).join(', ') + '.');
      return;
    }
    deleteFlexTab(pendingDelete);
    ToastService.showSuccess('FlexTab ' + pendingDelete + ' deleted.');
    render();
  });

  tableSearch.addEventListener('input', render);
  render();
});
