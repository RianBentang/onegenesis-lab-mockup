/* ---------- Master Data › Flex Tab form (onegenesis-web pages/Core/GEN/FlexTab/FlexTabForm.jsx) ----------
   flexTabForm.html?id=<FlexTab ID> edits, without id creates. Items are edited in a modal; an
   item's Parent ID picks from the items of the parent FlexTab. Description is required here
   because the request forms use it as the dropdown value. */
document.addEventListener('DOMContentLoaded', function () {
  var editId = new URLSearchParams(window.location.search).get('id') || '';
  var existing = editId ? getFlexTab(editId) : null;
  var isNew = !existing;

  var idEl = document.getElementById('flexTabId');
  var descEl = document.getElementById('flexTabDescription');
  var parentEl = document.getElementById('flexTabParentId');
  var body = document.getElementById('flexTabItemsBody');
  var checkAll = document.getElementById('checkAllItems');

  var itemModal = new bootstrap.Modal(document.getElementById('flexTabItemModal'));
  var itemIdEl = document.getElementById('itemId');
  var itemDescEl = document.getElementById('itemDescription');
  var itemParentEl = document.getElementById('itemParentId');

  var items = existing ? existing.items.map(function (it) { return Object.assign({ selected: false }, it); }) : [];
  var editIndex = -1;

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  /* Parent FlexTab options: every other FlexTab */
  getFlexTabs()
    .filter(function (t) { return t.flexTabId !== editId; })
    .sort(function (a, b) { return a.flexTabId.localeCompare(b.flexTabId); })
    .forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.flexTabId;
      o.textContent = t.flexTabId + ' — ' + t.description;
      parentEl.appendChild(o);
    });

  if (existing) {
    idEl.value = existing.flexTabId;
    idEl.disabled = true;
    descEl.value = existing.description;
    parentEl.value = existing.flexTabParentId || '';
    document.querySelector('.breadcrumb-item.active').textContent = 'Form FlexTab · ' + existing.flexTabId;
  }

  function renderItems() {
    var rows = items.map(function (it, i) {
      return '<tr>' +
        '<td><input type="checkbox" class="form-check-input" style="min-width:20px;min-height:20px" data-select="' + i + '"' + (it.selected ? ' checked' : '') + ' aria-label="Select item" /></td>' +
        /* SpkTableActions */
        '<td><div class="d-flex gap-1">' +
          '<button type="button" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Edit Item" data-edit="' + i + '"><i class="ri-edit-line"></i></button>' +
          '<button type="button" class="btn btn-icon btn-sm btn-danger-light btn-wave" title="Delete Item" data-remove="' + i + '"><i class="ri-delete-bin-line"></i></button>' +
        '</div></td>' +
        '<td class="font-monospace">' + esc(it.id) + '</td>' +
        '<td>' + esc(it.description) + '</td>' +
        '<td class="font-monospace">' + (it.parentId ? esc(it.parentId) : '<span class="text-muted">-</span>') + '</td>' +
        '</tr>';
    }).join('');
    var anySelected = items.some(function (it) { return it.selected; });
    var actionsRow = '<tr><td colspan="5" class="border-bottom-0"><div class="d-flex gap-2">' +
      '<button type="button" class="btn btn-light btn-sm btn-wave" data-add-item><i class="ri-add-line me-1"></i>Add Item</button>' +
      '<button type="button" class="btn btn-danger-light btn-sm btn-wave" id="btnDeleteSelected"' + (anySelected ? '' : ' disabled') + '><i class="ri-delete-bin-5-line me-1"></i>Delete</button>' +
      '</div></td></tr>';
    body.innerHTML = items.length ? rows + actionsRow
      : '<tr><td colspan="5" class="text-center py-4"><div class="text-muted mb-2">No FlexTab items yet</div>' +
        '<button type="button" class="btn btn-light btn-sm btn-wave" data-add-item><i class="ri-add-line me-1"></i>Add Item</button></td></tr>';
    checkAll.checked = items.length > 0 && items.every(function (it) { return it.selected; });
  }

  /* Item modal: Parent ID lists the items of the parent FlexTab chosen above */
  function openItemModal(index) {
    editIndex = index;
    var it = index === -1 ? { id: '', description: '', parentId: '' } : items[index];
    document.getElementById('flexTabItemModalTitle').textContent = index === -1 ? 'Add New Item' : 'Edit Item';
    itemIdEl.value = it.id;
    itemDescEl.value = it.description;

    var parentTab = parentEl.value ? getFlexTab(parentEl.value) : null;
    itemParentEl.innerHTML = '<option value="">-- No Parent --</option>' + (parentTab ? parentTab.items.map(function (p) {
      return '<option value="' + esc(p.id) + '">' + esc(p.id) + ' — ' + esc(p.description) + '</option>';
    }).join('') : '');
    itemParentEl.value = it.parentId || '';
    jQuery(itemParentEl).prop('disabled', !parentTab).trigger('change.select2');
    document.getElementById('itemParentHint').textContent = parentTab
      ? 'Item of the parent FlexTab ' + parentTab.flexTabId + '.'
      : 'Select the FlexTab Parent ID first to link items to a parent.';
    itemModal.show();
  }

  document.getElementById('btnSaveItem').addEventListener('click', function () {
    if (!validateForm(document.getElementById('flexTabItemForm'))) return;
    var id = itemIdEl.value.trim();
    var dup = items.some(function (it, i) { return i !== editIndex && it.id === id; });
    if (dup) { ToastService.showWarning('ID ' + id + ' is already used by another item.'); return; }
    var item = { id: id, description: itemDescEl.value.trim(), parentId: itemParentEl.value };
    if (editIndex === -1) items.push(Object.assign({ selected: false }, item));
    else items[editIndex] = Object.assign({ selected: items[editIndex].selected }, item);
    itemModal.hide();
    renderItems();
  });

  body.addEventListener('click', function (e) {
    if (e.target.closest('[data-add-item]')) { openItemModal(-1); return; }
    var edit = e.target.closest('[data-edit]');
    if (edit) { openItemModal(Number(edit.dataset.edit)); return; }
    var remove = e.target.closest('[data-remove]');
    if (remove) { items.splice(Number(remove.dataset.remove), 1); renderItems(); return; }
    if (e.target.closest('#btnDeleteSelected')) {
      items = items.filter(function (it) { return !it.selected; });
      renderItems();
    }
  });

  body.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-select]');
    if (!sel) return;
    items[Number(sel.dataset.select)].selected = sel.checked;
    renderItems();
  });

  checkAll.addEventListener('change', function () {
    items.forEach(function (it) { it.selected = checkAll.checked; });
    renderItems();
  });

  document.getElementById('btnSaveFlexTab').addEventListener('click', function () {
    if (!validateForm(document.getElementById('flexTabForm'))) return;
    var id = idEl.value.trim();
    if (isNew && getFlexTab(id)) { ToastService.showWarning('FlexTab ID ' + id + ' already exists.'); return; }
    saveFlexTab({
      flexTabId: id,
      description: descEl.value.trim(),
      flexTabParentId: parentEl.value,
      items: items.map(function (it) { return { id: it.id, description: it.description, parentId: it.parentId }; })
    });
    ToastService.showSuccess('FlexTab ' + id + ' saved.');
    window.location.href = 'flexTab.html';
  });

  renderItems();
});
