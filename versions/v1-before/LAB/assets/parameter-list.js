/* ---------- Master Data › Parameter Uji list — tabs Internal / External ----------
   Data: getLabParameters() (dummy-parameters.js), the list every request form, Kaji Ulang, Excel and
   Report read. Internal rows are grouped per lab; External rows have no lab. ?tab=External opens
   the External tab (the form's Back link uses it). */
document.addEventListener('DOMContentLoaded', function () {
  var tabsNav = document.getElementById('paramJenisTabs');
  var activeJenis = /[?&]tab=External\b/.test(location.search) ? 'External' : 'Internal';
  var deleteModal = new bootstrap.Modal(document.getElementById('deleteParamModal'));
  var pendingDelete = null;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  document.getElementById('filterLabSelect').insertAdjacentHTML('beforeend',
    PARAMETER_LABS.map(function (l) { return '<option value="' + l + '">' + l + '</option>'; }).join(''));

  /* Requests that still use a parameter (deleting it would leave them pointing at nothing) */
  function usedBy(p) {
    if (p.jenis === 'Internal') {
      return getRequests().filter(function (r) { return (r.params || []).indexOf(p.value) !== -1; }).map(function (r) { return r.id; });
    }
    var key = paramKey('External', p.value);
    return getExternalRequests().filter(function (r) { return externalRequestParamKeys(r.params).indexOf(key) !== -1; }).map(function (r) { return r.id; });
  }

  function rowHtml(item, no) {
    var internal = item.jenis === 'Internal';
    var href = 'parameterForm.html?jenis=' + item.jenis + '&value=' + encodeURIComponent(item.value);
    var scopeBadge = item.scope
      ? '<span class="badge bg-success-transparent"><i class="ri-check-line"></i> In-Scope</span>'
      : '<span class="badge bg-secondary-transparent">Non-Scope</span>';
    return '<tr>' +
      /* SpkTableActions */
      '<td><div class="d-flex gap-1">' +
        '<a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Edit"><i class="ri-edit-line"></i></a>' +
        '<button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" title="Delete" data-delete="' + esc(item.value) + '"><i class="ri-delete-bin-line"></i></button>' +
      '</div></td>' +
      '<td class="text-muted">' + no + '</td>' +
      '<td><a href="' + href + '" class="fw-semibold text-body">' + esc(item.text) + '</a><div><small class="text-muted font-monospace">' + esc(item.code) + '</small></div></td>' +
      (internal ? '<td><span class="badge bg-light text-dark">' + esc(item.lab) + '</span></td>' : '') +
      '<td><code class="text-dark font-monospace fw-semibold">' + esc(item.method) + '</code></td>' +
      '<td>' + scopeBadge + '</td>' +
      '<td class="font-monospace">' + esc(item.leadTime) + ' Days</td>' +
      '<td><span class="badge bg-light text-muted border">' + esc(item.suhu) + '</span></td>' +
      '<td><div>' + esc(item.spec || '-') + '</div><small class="text-muted font-monospace">' + esc(item.unit) + '</small></td>' +
      (internal ? '<td class="font-monospace">' + esc(item.label || '-') + '</td>' : '') +
      '</tr>';
  }

  function render() {
    var internal = activeJenis === 'Internal';
    var searchVal = document.getElementById('searchParamInput').value.toLowerCase().trim();
    var labFilter = internal ? document.getElementById('filterLabSelect').value : '';
    var scopeFilter = document.getElementById('filterScopeSelect').value;
    var all = labParameters(activeJenis);
    var filtered = all.filter(function (item) {
      var matchSearch = !searchVal || [item.text, item.method, item.code].some(function (f) { return String(f || '').toLowerCase().indexOf(searchVal) !== -1; });
      var matchLab = !labFilter || item.lab === labFilter;
      var matchScope = !scopeFilter || (scopeFilter === 'In-Scope' ? item.scope : !item.scope);
      return matchSearch && matchLab && matchScope;
    }).sort(function (a, b) { return String(a.code).localeCompare(String(b.code)); });

    document.getElementById('filterLabWrap').classList.toggle('d-none', !internal);
    document.getElementById('countInternal').textContent = labParameters('Internal').length;
    document.getElementById('countExternal').textContent = labParameters('External').length;
    document.getElementById('btnAddParam').href = 'parameterForm.html?jenis=' + activeJenis;

    var cols = internal ? 10 : 8;
    document.getElementById('paramTableHead').innerHTML = '<tr>' +
      '<th style="width: 1%">Action</th><th style="width: 40px">No</th><th>Code &amp; Test Parameter</th>' +
      (internal ? '<th>Laboratory</th>' : '') +
      '<th>Reference Method</th><th>ISO 17025 Scope Status</th><th>Lead Time</th><th>Storage Temp.</th><th>Unit &amp; Specification</th>' +
      (internal ? '<th>Label Code</th>' : '') + '</tr>';

    var no = 0;
    var html;
    if (internal) {
      /* One group header row per lab */
      html = PARAMETER_LABS.map(function (lab) {
        var rows = filtered.filter(function (item) { return item.lab === lab; });
        if (!rows.length) return '';
        return '<tr class="table-light"><td colspan="' + cols + '" class="fw-semibold">' +
            '<i class="ri-flask-line text-primary me-1 align-middle"></i>' + lab + ' Lab' +
            ' <span class="badge bg-primary-transparent rounded-pill ms-1">' + rows.length + '</span>' +
          '</td></tr>' +
          rows.map(function (item) { no += 1; return rowHtml(item, no); }).join('');
      }).join('');
    } else {
      html = filtered.map(function (item) { no += 1; return rowHtml(item, no); }).join('');
    }
    document.getElementById('paramTableBody').innerHTML = html ||
      '<tr><td colspan="' + cols + '" class="text-center text-muted py-4">No parameters.</td></tr>';

    document.getElementById('kpiTotalParam').textContent = all.length;
    document.getElementById('kpiTotalSub').textContent = activeJenis === 'Internal' ? 'Tested in-house' : 'Sent to a vendor lab';
    document.getElementById('kpiInScope').textContent = all.filter(function (x) { return x.scope; }).length;
    document.getElementById('kpiNonScope').textContent = all.filter(function (x) { return !x.scope; }).length;
  }

  function showTab(jenis) {
    activeJenis = jenis;
    tabsNav.querySelectorAll('.nav-link').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === jenis); });
    render();
  }

  tabsNav.addEventListener('click', function (e) {
    var tab = e.target.closest('.nav-link');
    if (!tab) return;
    e.preventDefault();
    showTab(tab.dataset.tab);
  });

  document.getElementById('paramTableBody').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-delete]');
    if (!btn) return;
    var p = labParameter(activeJenis, btn.dataset.delete);
    var used = usedBy(p);
    if (used.length) {
      ToastService.showWarning('"' + p.text + '" is still used in ' + used.join(', ') + '. Remove it from those requests first.');
      return;
    }
    pendingDelete = p;
    document.getElementById('deleteParamName').textContent = p.text + ' (' + p.jenis + ')';
    deleteModal.show();
  });

  document.getElementById('btnConfirmDeleteParam').addEventListener('click', function () {
    if (!pendingDelete) return;
    deleteLabParameter(pendingDelete.jenis, pendingDelete.value);
    ToastService.showSuccess('Parameter "' + pendingDelete.text + '" deleted.');
    pendingDelete = null;
    deleteModal.hide();
    render();
  });

  document.getElementById('searchParamInput').addEventListener('input', render);
  window.jQuery('#filterLabSelect, #filterScopeSelect').on('change', render);
  showTab(activeJenis);
});
