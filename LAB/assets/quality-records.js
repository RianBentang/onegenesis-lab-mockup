/* ---------- HOLABSYS › Quality Records (dummy-quality.js) ----------
   Tabs: Nonconforming Work & CAPA | Complaints | Proficiency Testing. Records come from Re-tests
   automatically (applyRetest) or are added here; closing needs the root cause and the action.
   Lab roles edit; other roles only read. */
document.addEventListener('DOMContentLoaded', function () {
  var $ = window.jQuery;
  var tab = 'Nonconforming Work';
  var editing = null;
  var qrModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('qrModal'));
  var ptModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('ptModal'));

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function canEdit() { return isLabRole(currentRole()); }

  document.getElementById('qrType').innerHTML = QUALITY_TYPES.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('');
  document.getElementById('ptParameter').innerHTML = '<option value="">-- Select --</option>' +
    labParameters('Internal').map(function (p) { return '<option value="' + esc(p.text) + '">' + esc(p.text) + '</option>'; }).join('');

  /* SpkCountercard row (spk-kit.js), one column each */
  function tile(icon, variant, label, value, hint) {
    return '<div class="col-12 col-md-6 col-xl-3">' + spkCountercardHtml({ label: label, value: value, hint: hint, icon: icon, variant: variant }) + '</div>';
  }

  function render() {
    var records = getQualityRecords();
    var pts = getProficiencyTests();
    var openNc = records.filter(function (r) { return r.type === 'Nonconforming Work' && r.status === 'Open'; }).length;
    var openCp = records.filter(function (r) { return r.type === 'Complaint' && r.status === 'Open'; }).length;
    var sat = pts.filter(function (p) { return ptVerdict(p) === 'Satisfactory'; }).length;
    var flagged = pts.length - sat;
    document.getElementById('qrCounters').innerHTML =
      tile('ri-error-warning-line', 'danger', 'Open Nonconformities', openNc, 'cl. 7.10 / 8.7 · need root cause + action') +
      tile('ri-feedback-line', 'warning', 'Open Complaints', openCp, 'cl. 7.9 · from re-test requests too') +
      tile('ri-medal-line', 'success', 'PT Satisfactory', pts.length ? Math.round(sat / pts.length * 100) + '%' : '-', sat + ' of ' + pts.length + ' results · |z| ≤ 2') +
      tile('ri-alarm-warning-line', 'info', 'PT to Follow Up', flagged, 'Questionable / Unsatisfactory → NC');

    QUALITY_TYPES.forEach(function (t) {
      document.querySelector('[data-count="' + t + '"]').textContent = records.filter(function (r) { return r.type === t; }).length;
    });
    document.querySelector('[data-count="PT"]').textContent = pts.length;
    document.getElementById('qrStatusWrap').classList.toggle('d-none', tab === 'PT');
    document.getElementById('qrHeaderActions').innerHTML = canEdit()
      ? '<button type="button" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center" id="btnAddQr"><i class="ri-add-line me-1"></i>' + (tab === 'PT' ? 'Add PT Result' : 'Add ' + tab) + '</button>'
      : '';
    var add = document.getElementById('btnAddQr');
    if (add) add.addEventListener('click', function () { tab === 'PT' ? openPt() : openRecord(null); });

    var q = document.getElementById('qrSearch').value.toLowerCase().trim();
    var st = document.getElementById('qrFilterStatus').value;
    var head = document.getElementById('qrHead');
    var body = document.getElementById('qrBody');
    if (tab === 'PT') {
      head.innerHTML = '<tr><th>No.</th><th>Scheme / Provider</th><th>Parameter</th><th>Round</th><th>Date</th><th class="text-end">Assigned</th><th class="text-end">Lab Result</th><th class="text-end">z-score</th><th>Verdict</th></tr>';
      var list = pts.filter(function (p) { return !q || (p.scheme + p.provider + p.parameter + p.id).toLowerCase().indexOf(q) !== -1; });
      body.innerHTML = list.length ? list.map(function (p) {
        var v = ptVerdict(p);
        return '<tr><td class="font-monospace">' + p.id + '</td><td><div class="fw-semibold">' + esc(p.scheme) + '</div><div class="fs-12 text-muted">' + esc(p.provider) + '</div></td>' +
          '<td>' + esc(p.parameter) + '</td><td>' + esc(p.round) + '</td><td>' + p.date + '</td>' +
          '<td class="text-end font-monospace">' + p.assigned + '</td><td class="text-end font-monospace">' + p.result + '</td>' +
          '<td class="text-end font-monospace fw-semibold">' + ptZScore(p) + '</td><td><span class="badge ' + PT_VERDICT_CLS[v] + '">' + v + '</span></td></tr>';
      }).join('') : '<tr><td colspan="9" class="text-center text-muted py-4">No results.</td></tr>';
      return;
    }
    head.innerHTML = '<tr><th style="width:1%">Action</th><th>No.</th><th>Date</th><th>Request</th><th>Parameter(s)</th><th>Description</th><th>Source</th><th>Owner</th><th>Status</th></tr>';
    var rows = records.filter(function (r) {
      return r.type === tab && (!st || r.status === st) &&
        (!q || (r.id + r.requestId + r.params + r.description + r.source).toLowerCase().indexOf(q) !== -1);
    }).reverse();
    body.innerHTML = rows.length ? rows.map(function (r) {
      return '<tr><td><button type="button" class="btn btn-icon btn-sm btn-info-light btn-wave" data-open="' + r.id + '" title="' + (canEdit() && r.status === 'Open' ? 'Edit / close' : 'View') + '"><i class="' + (canEdit() && r.status === 'Open' ? 'ri-edit-line' : 'ri-eye-line') + '"></i></button></td>' +
        '<td class="font-monospace text-nowrap">' + r.id + '</td><td class="text-nowrap">' + r.date + '</td>' +
        '<td>' + (r.requestId ? '<a class="font-monospace text-nowrap" href="internalForm.html?docId=' + encodeURIComponent(r.requestId) + '">' + r.requestId + '</a>' : '-') + '</td>' +
        '<td class="fs-12">' + esc(r.params || '-') + '</td><td class="fs-12" style="min-width:240px">' + esc(r.description) + '</td>' +
        '<td class="fs-12">' + esc(r.source || '-') + '</td><td class="fs-12">' + esc(r.owner) + '</td>' +
        '<td><span class="badge ' + (r.status === 'Open' ? 'bg-warning-transparent' : 'bg-success-transparent') + '">' + r.status + '</span></td></tr>';
    }).join('') : '<tr><td colspan="9" class="text-center text-muted py-4">No records.</td></tr>';
  }

  /* ---------- record modal ---------- */
  function openRecord(id) {
    editing = id ? getQualityRecords().filter(function (r) { return r.id === id; })[0] : null;
    var r = editing || { type: tab, owner: currentRole().name, status: 'Open' };
    var locked = !canEdit() || r.status === 'Closed';
    document.getElementById('qrModalTitle').textContent = editing ? editing.id + ' · ' + editing.type : 'New ' + tab;
    $('#qrType').val(r.type).trigger('change');
    ['Request', 'Owner', 'Params', 'Description', 'RootCause', 'Action'].forEach(function (k) {
      var key = { Request: 'requestId', Owner: 'owner', Params: 'params', Description: 'description', RootCause: 'rootCause', Action: 'action' }[k];
      var el = document.getElementById('qr' + k);
      el.value = r[key] || '';
      el.disabled = locked;
    });
    $('#qrType').prop('disabled', locked || !!editing).trigger('change.select2');
    document.getElementById('qrMeta').innerHTML = editing
      ? 'Raised ' + editing.date + (editing.source ? ' · ' + esc(editing.source) : '') + (editing.status === 'Closed' ? ' · closed ' + editing.closedAt + ' by ' + esc(editing.closedBy) : '') : '';
    document.getElementById('btnSaveQr').classList.toggle('d-none', locked);
    document.getElementById('btnCloseQr').classList.toggle('d-none', locked || !editing);
    qrModal.show();
  }

  function formValues() {
    return {
      type: document.getElementById('qrType').value, requestId: document.getElementById('qrRequest').value.trim(),
      owner: document.getElementById('qrOwner').value.trim(), params: document.getElementById('qrParams').value.trim(),
      description: document.getElementById('qrDescription').value.trim(), rootCause: document.getElementById('qrRootCause').value.trim(),
      action: document.getElementById('qrAction').value.trim()
    };
  }

  document.getElementById('btnSaveQr').addEventListener('click', function () {
    if (!validateForm(document.getElementById('qrForm'))) return;
    var v = formValues();
    var rec = editing ? updateQualityRecord(editing.id, v) : addQualityRecord(Object.assign(v, { source: 'Manual entry' }));
    qrModal.hide();
    tab = rec.type;
    showTab();
    ToastService.showSuccess('Quality record ' + rec.id + ' saved.');
  });

  document.getElementById('btnCloseQr').addEventListener('click', function () {
    if (!validateForm(document.getElementById('qrForm'))) return;
    var v = formValues();
    if (!v.rootCause || !v.action) { ToastService.showWarning('Fill in the root cause and the corrective action before closing.'); return; }
    updateQualityRecord(editing.id, Object.assign(v, { status: 'Closed', closedAt: qualityToday(), closedBy: currentRole().name }));
    qrModal.hide();
    render();
    ToastService.showSuccess(editing.id + ' closed.');
  });

  /* ---------- PT modal ---------- */
  function openPt() {
    document.getElementById('ptForm').reset();
    $('#ptParameter').val('').trigger('change');
    document.getElementById('ptDate').value = qualityToday();
    document.getElementById('ptPreview').innerHTML = '';
    ptModal.show();
  }
  function ptFromForm() {
    var n = function (id) { return parseFloat(document.getElementById(id).value); };
    return { scheme: document.getElementById('ptScheme').value.trim(), provider: document.getElementById('ptProvider').value.trim(),
      parameter: document.getElementById('ptParameter').value, round: document.getElementById('ptRound').value.trim(),
      date: document.getElementById('ptDate').value.trim(), assigned: n('ptAssigned'), result: n('ptResult'), sdpa: n('ptSdpa') };
  }
  ['ptAssigned', 'ptResult', 'ptSdpa'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () {
      var p = ptFromForm();
      document.getElementById('ptPreview').innerHTML = isNaN(p.assigned) || isNaN(p.result) || !p.sdpa ? ''
        : 'z = <span class="font-monospace fw-semibold">' + ptZScore(p) + '</span> <span class="badge ' + PT_VERDICT_CLS[ptVerdict(p)] + ' ms-1">' + ptVerdict(p) + '</span>';
    });
  });
  document.getElementById('btnSavePt').addEventListener('click', function () {
    if (!validateForm(document.getElementById('ptForm'))) return;
    var p = ptFromForm();
    var list = getProficiencyTests();
    p.id = nextFreeNo('PT-' + new Date().getFullYear() + '-', list.map(function (x) { return x.id; }), 2);
    list.push(p);
    saveProficiencyTests(list);
    /* A questionable / unsatisfactory result is nonconforming work to investigate (cl. 7.7.3) */
    var nc = ptVerdict(p) !== 'Satisfactory' ? addQualityRecord({ type: 'Nonconforming Work', params: p.parameter,
      description: 'PT ' + p.scheme + ' round ' + p.round + ': z = ' + ptZScore(p) + ' (' + ptVerdict(p) + ').', source: 'Proficiency Testing ' + p.id, owner: currentRole().name }) : null;
    ptModal.hide();
    render();
    ToastService.showSuccess('PT result ' + p.id + ' saved' + (nc ? '; ' + nc.id + ' raised to investigate it.' : '.'));
  });

  /* ---------- tabs, filters ---------- */
  function showTab() {
    document.querySelectorAll('#qrTabs .nav-link').forEach(function (a) { a.classList.toggle('active', a.dataset.tab === tab); });
    render();
  }
  document.getElementById('qrTabs').addEventListener('click', function (e) {
    var a = e.target.closest('.nav-link');
    if (!a) return;
    e.preventDefault();
    tab = a.dataset.tab;
    showTab();
  });
  document.getElementById('qrBody').addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]');
    if (b) openRecord(b.dataset.open);
  });
  document.getElementById('qrSearch').addEventListener('input', render);
  $('#qrFilterStatus').on('change', render);
  document.addEventListener('holabsys:rolechange', render);
  var wanted = new URLSearchParams(location.search).get('tab');
  if (wanted === 'complaint') tab = 'Complaint';
  if (wanted === 'pt') tab = 'PT';
  showTab();
});
