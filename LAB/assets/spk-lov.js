/* ---------- SpkLov — port of onegenesis-web components/shared/lov/LovModal.jsx ----------
   The popup behind SpkLovInput: modal-xl, "Show N Entries", Search, table (table-light header,
   Select button per row, ↑ ↓ to move, Enter to pick, click a row to pick) and Prev / Next paging.
   SpkLov.open({
     title: 'Select User',
     columns: [{ key: 'nik', label: 'NIK' }, ...],
     rows: [...],                       // plain objects
     onSelect: function (row) { ... }   // the modal closes itself
   });
   Field markup (SpkLovInput, see reference/markup.md):
     <div class="input-group"><input class="form-control" disabled /><button class="btn btn-primary"><i class="ri-search-line"></i></button></div> */
(function () {
  var modalEl, modal, opts, page = 1, pageSize = 10, selectedIndex = 0, visible = [];

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function build() {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade" id="spkLovModal" tabindex="-1" aria-hidden="true">' +
        '<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">' +
          '<div class="modal-content">' +
            '<div class="modal-header pb-0">' +
              '<div class="d-flex align-items-center gap-3 w-100 me-2">' +
                '<h6 class="modal-title fs-6" id="spkLovTitle">List of Value</h6>' +
                '<span class="text-muted fs-11 ms-auto d-none d-sm-inline-flex align-items-center gap-1">' +
                  '<kbd class="bg-light text-muted border fs-10 px-1 py-0">↑</kbd>' +
                  '<kbd class="bg-light text-muted border fs-10 px-1 py-0">↓</kbd> navigate' +
                  '<kbd class="bg-light text-muted border fs-10 px-1 py-0 ms-1">↵ Enter</kbd> select' +
                '</span>' +
              '</div>' +
              '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
            '</div>' +
            '<div class="modal-body">' +
              '<div class="row gy-3">' +
                '<div class="col-xl-6">' +
                  '<div class="d-flex align-items-center gap-2">' +
                    '<span>Show</span>' +
                    '<div style="width: 80px;"><select class="form-select" id="spkLovPageSize">' +
                      '<option value="10">10</option><option value="50">50</option><option value="100">100</option>' +
                    '</select></div>' +
                    '<span>Entries</span>' +
                  '</div>' +
                '</div>' +
                '<div class="col-xl-6">' +
                  '<input class="form-control" type="search" placeholder="Search..." aria-label="Search" id="spkLovSearch" />' +
                '</div>' +
              '</div>' +
              '<div class="card-body p-0">' +
                '<div class="table-responsive">' +
                  '<table class="table table-hover text-nowrap border mt-3 mb-0">' +
                    '<thead class="table-light" id="spkLovHead"></thead>' +
                    '<tbody id="spkLovBody"></tbody>' +
                  '</table>' +
                '</div>' +
              '</div>' +
              '<div class="mt-3 d-flex align-items-center flex-wrap overflow-auto">' +
                '<div class="ms-auto"><ul class="pagination mb-0 overflow-auto" id="spkLovPaging"></ul></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    modalEl = wrap.firstChild;
    document.body.appendChild(modalEl);
    modal = new bootstrap.Modal(modalEl);

    document.getElementById('spkLovSearch').addEventListener('input', function () { page = 1; selectedIndex = 0; render(); });
    /* SpkSelect2 (spk-select2.js picks it up) — its change comes through jQuery */
    window.jQuery('#spkLovPageSize').on('change', function () { pageSize = +this.value; page = 1; selectedIndex = 0; render(); });
    document.getElementById('spkLovBody').addEventListener('click', function (e) {
      var tr = e.target.closest('[data-lov-index]');
      if (tr) pick(+tr.dataset.lovIndex);
    });
    document.getElementById('spkLovBody').addEventListener('mousemove', function (e) {
      var tr = e.target.closest('[data-lov-index]');
      if (tr && +tr.dataset.lovIndex !== selectedIndex) { selectedIndex = +tr.dataset.lovIndex; render(); }
    });
    document.getElementById('spkLovPaging').addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]');
      if (!b || b.closest('.disabled')) return;
      page = +b.dataset.page; selectedIndex = 0; render();
    });
    modalEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { selectedIndex = Math.min(selectedIndex + 1, visible.length - 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { selectedIndex = Math.max(selectedIndex - 1, 0); render(); e.preventDefault(); }
      else if (e.key === 'Enter' && visible.length) { pick(selectedIndex); e.preventDefault(); }
    });
    modalEl.addEventListener('shown.bs.modal', function () { document.getElementById('spkLovSearch').focus(); });
  }

  function pick(i) {
    var row = visible[i];
    if (!row) return;
    modal.hide();
    opts.onSelect(row);
  }

  function render() {
    var q = document.getElementById('spkLovSearch').value.trim().toLowerCase();
    var filtered = opts.rows.filter(function (r) {
      return !q || opts.columns.some(function (c) { return String(r[c.key] == null ? '' : r[c.key]).toLowerCase().indexOf(q) !== -1; });
    });
    var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, totalPages);
    visible = filtered.slice((page - 1) * pageSize, page * pageSize);

    document.getElementById('spkLovHead').innerHTML = '<tr><th style="width: 1%"></th>' +
      opts.columns.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('') + '</tr>';
    document.getElementById('spkLovBody').innerHTML = visible.length ? visible.map(function (r, i) {
      var sel = i === selectedIndex;
      return '<tr data-lov-index="' + i + '" class="align-middle' + (sel ? ' table-primary' : '') + '" style="cursor: pointer; border-left: 3px solid ' + (sel ? 'rgb(var(--primary-rgb))' : 'transparent') + ';">' +
        '<td class="align-middle"><button type="button" class="btn btn-sm ' + (sel ? 'btn-primary' : 'btn-outline-primary') + '">' + (sel ? 'Select ↵' : 'Select') + '</button></td>' +
        opts.columns.map(function (c) { return '<td class="align-middle' + (sel ? ' fw-medium' : '') + '">' + esc(r[c.key]) + '</td>'; }).join('') +
        '</tr>';
    }).join('') : '<tr><td colspan="' + (opts.columns.length + 1) + '" class="text-center p-4">No data found</td></tr>';

    var items = '<li class="page-item' + (page === 1 ? ' disabled' : '') + '"><button class="page-link" data-page="' + (page - 1) + '">Prev</button></li>';
    for (var n = 1; n <= totalPages; n++) {
      items += '<li class="page-item' + (n === page ? ' active' : '') + '"><button class="page-link" data-page="' + n + '">' + n + '</button></li>';
    }
    items += '<li class="page-item' + (page === totalPages ? ' disabled' : '') + '"><button class="page-link" data-page="' + (page + 1) + '">Next</button></li>';
    document.getElementById('spkLovPaging').innerHTML = items;
  }

  window.SpkLov = {
    open: function (options) {
      if (!modalEl) build();
      opts = options;
      page = 1; selectedIndex = 0;
      document.getElementById('spkLovTitle').textContent = options.title || 'List of Value';
      document.getElementById('spkLovSearch').value = '';
      render();
      modal.show();
    }
  };
})();
