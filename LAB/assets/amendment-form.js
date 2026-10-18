/* ---------- Re-test / Revision document form (amendmentForm.html) ----------
   See dummy-requests.js "Re-test & Revision documents". A document of its own (RT- / RV-) for an
   issued certificate, linked to its request:
   - new: ?ref=<request>&src=internal|sensory|aslt&type=retest|revision → the requester or the TCM
     (Re-test) or the CRL / TCM (Revision) fills it in and submits (createAmendment);
   - Re-test approval (retestApprovalChain): the other side approves (Approve / Return to Edit /
     Reject with a reason), then the Lab Admin approves by receiving the new sample (one Reason
     field, receiveRetestSample) — only then do the parameters go back to Excel. A Revision has no
     approval chain: the TCM approves the new certificate in the Report tab;
   - existing: ?docId=<RT-/RV- no.>[&tab=report] → read-only form; the Report tab (lab roles while
     open, everyone once issued) works on the new version of the request's report (ReportPanel with
     amendmentId). A Revision the TCM returned to the CRL can be corrected and submitted again.
   Needs dummy-requests.js, dummy-worksheet.js, report-form.js (+ the stores they read). */
var AMEND_LIST_PAGE = { internal: 'internalList.html', sensory: 'asltAndSensory.html', aslt: 'asltAndSensory.html?tab=aslt' };
var AMEND_SOURCE_LABEL = { internal: 'Internal', sensory: 'ASLT and Sensory', aslt: 'ASLT and Sensory' };

document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(location.search);
  var docId = params.get('docId');
  var current = docId ? getAmendmentById(docId) : null;
  var type = current ? current.type : (params.get('type') === 'revision' ? 'Revision' : 'Re-test');
  var source = current ? current.source : (params.get('src') || 'internal');
  var refId = current ? current.refDocId : params.get('ref');
  var listHref = AMEND_LIST_PAGE[source] || 'internalList.html';
  var actions = document.getElementById('formActionButtons');
  var reasonEl = document.getElementById('amendReason');
  var siteEl = document.getElementById('revAlamat');
  var packEl = document.getElementById('revKemasan');
  var activeTab = 'form';
  var tabChosen = false;
  var reportPanel = null;

  function parent() { return worksheetGetRecord(source, refId); }
  function doc() { return current ? getAmendmentById(current.id) : null; }

  document.getElementById('pageTitle').textContent = type + ' Form';
  document.getElementById('breadcrumbType').textContent = type;
  document.getElementById('formTabLabel').textContent = type + ' Form';
  document.title = type + ' | HOLABSYS';
  var crumb = document.getElementById('breadcrumbList');
  crumb.textContent = AMEND_SOURCE_LABEL[source] || 'Internal';
  crumb.href = listHref;

  if (!AMENDMENT_TYPES[type] || !parent() || (docId && !current)) {
    actions.innerHTML = spkDocButtonHtml('back', { href: listHref });
    document.querySelector('[data-pane="form"]').innerHTML =
      '<div class="card custom-card"><div class="card-body text-center text-muted py-5">Document not found.</div></div>';
    return;
  }

  /* ---------- Revision fields (SpkSelect2) ---------- */
  siteEl.innerHTML = '<option value="">-- Select --</option>' + siteOptions().map(function (o) { return '<option value="' + o.value + '">' + o.text + '</option>'; }).join('');
  packEl.innerHTML = '<option value="">-- Select --</option>' + flexTabOptions('LAB_JENIS_KEMASAN').map(function (v) { return '<option value="' + v + '">' + v + '</option>'; }).join('');
  function siteLabel(v) {
    var d = v && typeof MASTER_SITE_DETAIL !== 'undefined' ? MASTER_SITE_DETAIL[v] : null;
    return d ? d.company + ' - ' + d.kota : (v || '-');
  }
  function showField(k, v) { return k === 'alamatPelanggan' ? siteLabel(v) : (v || '-'); }
  function collectFields() {
    return { sampel: document.getElementById('revSampel').value.trim(), alamatPelanggan: siteEl.value, kemasan: packEl.value };
  }
  /* Changes against the certificate being replaced, shown while typing */
  function renderChanges() {
    var changes = revisionChanges(parent(), collectFields(), showField);
    document.getElementById('revChangesWrap').innerHTML = changes.length
      ? '<div class="alert alert-info fs-12 py-2 mb-0"><i class="ri-edit-2-line me-1"></i>' + changes.join(' · ') + '</div>'
      : '<div class="text-muted fs-12">No change yet against the issued certificate.</div>';
  }
  document.getElementById('revSampel').addEventListener('input', renderChanges);
  window.jQuery(siteEl).on('change', renderChanges);
  window.jQuery(packEl).on('change', renderChanges);

  /* The certificate this document replaces */
  function replacedEntry() {
    var p = parent();
    var d = doc();
    var h = p.reportHistory || [];
    return d ? (h.filter(function (e) { return e.no === d.refReportNo; })[0] || { no: d.refReportNo, at: '-' }) : (lastIssuedReport(p) || { no: '-', at: '-' });
  }

  /* ---------- Fill (on load and after submit) ---------- */
  function fillForm() {
    var p = parent();
    var d = doc();
    var e = replacedEntry();
    var snap = e.snapshot || reportSnapshot(p);
    document.getElementById('refRequest').value = p.id;
    document.getElementById('refSample').value = snap.sampel || p.sampel;
    document.getElementById('refRequester').value = p.pemohon + (p.departemen ? ' / ' + p.departemen : '');
    document.getElementById('refCertificate').value = e.no;
    document.getElementById('refIssuedAt').value = e.at || '-';
    document.getElementById('refCreatedBy').value = d ? d.pemohon + ' (' + findRole(d.role).label + ')' : currentRole().name;
    document.getElementById('retestSection').classList.toggle('d-none', type !== 'Re-test');
    document.getElementById('revisionSection').classList.toggle('d-none', type !== 'Revision');
    if (type === 'Revision') {
      var f = d ? d.fields : { sampel: p.sampel, alamatPelanggan: p.alamatPelanggan, kemasan: p.kemasan };
      document.getElementById('revSampel').value = f.sampel || '';
      window.jQuery(siteEl).val(f.alamatPelanggan || '').trigger('change');
      window.jQuery(packEl).val(f.kemasan || '').trigger('change');
    }
    reasonEl.value = d ? d.reason : '';
    renderRetestParams([]);
  }

  /* Re-test parameters: new → the tested ones can be ticked; existing → the chosen ones, read-only */
  function renderRetestParams(checked) {
    if (type !== 'Re-test') return;
    var d = doc();
    var p = parent();
    var open = editable();
    var list = open ? retestCandidates(p)
      : (p.paramsDiterima || p.params || []).map(function (code) { var x = labParameter('Internal', code); return { code: code, text: x ? x.text : code, ok: true }; });
    var picked = open ? (checked.length || !d ? checked : d.codes) : (d ? d.codes : checked);
    document.getElementById('retestParams').innerHTML = list.map(function (c) {
      var on = picked.indexOf(c.code) !== -1;
      if (d && !on) return '';
      return '<div class="form-check"><input class="form-check-input" type="checkbox" id="rt-' + c.code + '" value="' + c.code + '"' +
        (on ? ' checked' : '') + (open && c.ok ? '' : ' disabled') + ' />' +
        '<label class="form-check-label' + (c.ok ? '' : ' text-muted') + '" for="rt-' + c.code + '">' + c.text +
        (c.ok ? '' : ' <span class="fs-12">(not tested — nothing to repeat)</span>') + '</label></div>';
    }).join('') || '<div class="text-muted fs-12">No tested parameters.</div>';
  }
  function checkedCodes() {
    return Array.prototype.map.call(document.querySelectorAll('#retestParams input:checked'), function (i) { return i.value; });
  }

  /* New: the role may start it; existing: a Re-test returned to its creator, or a Revision returned
     by the TCM (CRL / TCM) */
  function editable() {
    var d = doc();
    var role = currentRole();
    if (!d) return canAmend(type, source, parent(), role);
    if (d.type === 'Re-test') return d.step === 'Draft' && role.code === d.role;
    var p = parent();
    return d.type === 'Revision' && d.step === 'Open' && p.reportStatus === 'Draft' && p.reportCycle &&
      p.reportCycle.amendmentId === d.id && AMENDMENT_TYPES.Revision.roles.indexOf(role.code) !== -1;
  }

  function setLocked(locked) {
    ['revSampel', 'amendReason'].forEach(function (id) { document.getElementById(id).disabled = locked; });
    [siteEl, packEl].forEach(function (el) { window.jQuery(el).prop('disabled', locked).trigger('change.select2'); });
    renderRetestParams(checkedCodes());
  }

  /* ---------- Submit ---------- */
  function submit() {
    var p = parent();
    var d = doc();
    var role = currentRole();
    var reason = reasonEl.value.trim();
    var res;
    if (type === 'Re-test') {
      res = d ? resubmitRetest(d, checkedCodes(), reason, role) : createAmendment(type, source, p, { codes: checkedCodes() }, reason, role);
    } else {
      var fields = collectFields();
      var changes = revisionChanges(p, fields, showField);
      if (!fields.sampel) res = { error: 'Sample Name is required.' };
      else if (!changes.length) res = { error: 'Change at least one field.' };
      else if (!reason) res = { error: 'Reason is required.' };
      else res = d ? resubmitRevision(d, fields, changes, reason, role) : createAmendment(type, source, p, { fields: fields, changes: changes }, reason, role);
    }
    if (res.error) { ToastService.showWarning(res.error); return; }
    current = res.amendment;
    if (window.history && history.replaceState) history.replaceState(null, '', amendmentHref(current.id));
    var valid = replacedEntry().no;
    ToastService.showSuccess(type === 'Re-test'
      ? 'Re-test "' + current.id + '" submitted. Waiting for approval by ' + findRole(current.chain[0]).label + ', then the Lab Admin receives the sample. ' + valid + ' stays valid until the new certificate is approved.'
      : 'Revision "' + current.id + '" sent to the Technical Manager for approval. ' + valid + ' stays valid until then.');
    fillForm();
    refresh();
  }

  /* ---------- Header buttons (the Report tab renders its own) ---------- */
  function renderButtons() {
    if (activeTab !== 'form') return;
    var back = spkDocButtonHtml('back', { href: listHref });
    var pending = amendmentPendingCode(doc());
    var role = currentRole();
    if (pending && pending === role.code) {
      /* Re-test approver; the Lab Admin approves by receiving the sample */
      actions.innerHTML = back + spkDocButtonHtml('return') + spkDocButtonHtml('reject') +
        (pending === 'ADM' ? spkButtonHtml('receive', 'success', 'ri-thumb-up-line', 'Approve & Receive Sample') : spkDocButtonHtml('approve'));
      return;
    }
    actions.innerHTML = back + (editable() ? spkDocButtonHtml('submit') : '');
  }
  spkOnDocAction(actions, function (action) {
    if (action === 'submit') submit();
    else if (action === 'approve') approve();
    else if (action === 'receive' || action === 'return' || action === 'reject') openReason(action);
  });

  /* ---------- Re-test approval ---------- */
  function approve() {
    var res = approveAmendment(doc(), currentRole());
    if (res.error) { ToastService.showWarning(res.error); return; }
    ToastService.showSuccess('Approved by ' + currentRole().name + '. Next: the Lab Admin receives the sample.');
    refresh();
  }
  /* One modal for Return / Reject / Receive: a reason only (receipt time + retention are automatic) */
  var reasonModalEl = document.getElementById('amendReasonModal');
  var reasonAction = null;
  var REASON_TEXT = {
    'return': { title: 'Return to Edit', button: 'Return to Edit', cls: 'btn-warning' },
    reject: { title: 'Reject', button: 'Reject', cls: 'btn-danger' },
    receive: { title: 'Approve & Receive Sample', button: 'Approve', cls: 'btn-success' }
  };
  function openReason(action) {
    reasonAction = action;
    var t = REASON_TEXT[action];
    document.getElementById('amendReasonTitle').textContent = t.title;
    var btn = document.getElementById('amendReasonConfirm');
    btn.textContent = t.button;
    btn.className = 'btn btn-sm ' + t.cls;
    document.getElementById('amendReasonText').value = '';
    document.getElementById('amendReasonError').textContent = '';
    window.bootstrap.Modal.getOrCreateInstance(reasonModalEl).show();
  }
  document.getElementById('amendReasonConfirm').addEventListener('click', function () {
    var text = document.getElementById('amendReasonText').value.trim();
    document.getElementById('amendReasonError').textContent = text ? '' : 'Reason is required.';
    if (!text) return;
    var d = doc();
    var role = currentRole();
    var res = reasonAction === 'receive'
      ? receiveRetestSample(d, { at: nowStamp(), by: role.name, note: text, retentionUntil: retentionUntil() }, role)
      : (reasonAction === 'reject' ? rejectAmendment : returnAmendment)(d, text, role);
    if (res.error) { ToastService.showWarning(res.error); return; }
    window.bootstrap.Modal.getOrCreateInstance(reasonModalEl).hide();
    ToastService.showSuccess(reasonAction === 'receive'
      ? 'Sample received. ' + d.params.join(', ') + ' back in Excel' + (res.reagentRows ? ', ' + res.reagentRows + ' reagent deduction(s) logged' : '') + '.'
      : reasonAction === 'reject' ? 'Re-test ' + d.id + ' rejected. The certificate stays as it is.'
      : 'Re-test ' + d.id + ' returned to ' + findRole(d.role).label + '.');
    fillForm();
    refresh();
  });

  /* ---------- Progress + note ---------- */
  function stepIndex(d, p) {
    if (!d) return 0;
    if (d.step === 'Closed') return 99;
    if (d.type === 'Revision') return p.reportStatus === 'Draft' ? 0 : 1;
    if (d.step === 'Draft' || d.step === 'Rejected') return 0;
    if (d.step === 'Approval') return 1 + (d.approvalIdx || 0);
    var waiting = (d.codes || []).some(function (c) { return !(p.results && p.results[c]); });
    return p.reportStatus === 'Draft' && waiting ? 3 : 4;
  }
  function progressHtml(d, p) {
    if (d && d.step === 'Rejected') return '';
    var creator = d ? d.role : currentRole().code;
    var chain = retestApprovalChain(creator);
    var steps = type === 'Re-test'
      ? [{ title: 'Re-test Request', who: findRole(creator).label }, { title: 'Approval', who: findRole(chain[0]).label },
        { title: 'Sample Receipt', who: 'Lab Admin' }, { title: 'Testing', who: 'Analyst · Excel' },
        { title: 'Report Review', who: 'CRL → TCM' }, { title: 'New Certificate', who: 'Requester downloads' }]
      : [{ title: 'Revision Request', who: 'Lab Coordinator / Technical Manager' }, { title: 'Approve & Issue', who: 'Technical Manager' },
        { title: 'New Certificate', who: 'Requester downloads' }];
    var at = Math.min(stepIndex(d, p), steps.length);
    return '<div class="card custom-card no-print mb-3"><div class="card-body py-3"><div class="doc-stepper">' +
      steps.map(function (s, i) {
        var state = i < at ? 'is-done' : i === at ? 'is-current' : '';
        return '<div class="doc-step ' + state + '">' +
          '<span class="doc-step-dot">' + (i < at ? '<i class="ri-check-line"></i>' : (i + 1)) + '</span>' +
          '<div class="doc-step-text"><div class="doc-step-title">' + s.title + '</div><div class="doc-step-who">' + s.who + '</div></div></div>';
      }).join('') + '</div></div></div>';
  }
  function noteHtml(d, p) {
    var e = replacedEntry();
    if (!d) {
      var why = amendmentBlocker(type, source, p, currentRole());
      return why
        ? '<div class="alert alert-danger d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-forbid-line fs-16"></i><div>' + why + '</div></div>'
        : '<div class="alert alert-primary d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-information-line fs-16"></i>' +
          '<div>This ' + type.toLowerCase() + ' replaces certificate <span class="fw-semibold">' + e.no + '</span> of ' + p.id +
          '. That certificate stays valid until the Technical Manager approves the new one. The requester sees this document.</div></div>';
    }
    /* Re-test: Return to Edit / Reject reason, or who approves next */
    if (d.step === 'Rejected' || d.step === 'Draft') return docReasonNoteHtml(d) +
      (d.step === 'Draft' ? '<div class="text-muted fs-12 mb-3">' + findRole(d.role).label + ' changes the re-test and submits it again.</div>' : '');
    if (d.step === 'Approval') {
      var pc = amendmentPendingCode(d);
      return '<div class="alert alert-warning d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-time-line fs-16"></i><div>' +
        (pc === 'ADM' ? 'Approved. Waiting for the Lab Admin to receive the new sample — the parameters go back to Excel then.'
          : 'Waiting for approval by ' + findRole(pc).label + '.') +
        ' Certificate <span class="fw-semibold">' + d.refReportNo + '</span> stays valid.</div></div>';
    }
    if (d.step === 'Closed') {
      return '<div class="alert alert-success d-flex align-items-center flex-wrap gap-2 py-2 fs-13 mb-3"><i class="ri-award-line fs-16"></i>' +
        '<div class="flex-fill"><div class="fw-semibold">Certificate ' + d.issuedNo + ' issued · ' + d.issuedAt + '</div>' +
        '<div class="fs-12 text-muted">Supersedes ' + d.refReportNo + '.</div></div>' +
        '<a href="' + amendmentHref(d.id, '&tab=report') + '" class="btn btn-sm btn-success btn-wave d-inline-flex align-items-center gap-1"><i class="ri-download-2-line"></i> Download Certificate</a></div>';
    }
    var returned = d.type === 'Revision' && p.reportStatus === 'Draft' && p.reportReturnReason;
    return (returned
      ? '<div class="alert alert-warning d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="ri-arrow-go-back-line fs-16"></i>' +
        '<div><div class="fw-semibold">Returned by ' + p.reportReturnedBy + ' · ' + p.reportReturnedAt + '</div>' + p.reportReturnReason +
        '<div class="text-muted fs-12">Correct the revision and submit it again.</div></div></div>' : '') +
      '<div class="alert alert-warning d-flex align-items-start gap-2 py-2 fs-13 mb-3"><i class="' + AMENDMENT_TYPES[type].icon + ' fs-16"></i>' +
      '<div>Certificate <span class="fw-semibold">' + d.refReportNo + '</span> stays valid until the Technical Manager approves the new one.</div></div>';
  }

  /* Document History: this document, plus what happened to the new version on the request since it
     was opened (report submit / return, result changes of the re-tested parameters for lab roles) */
  function historyRecord(d, p) {
    if (!d) return { activity: [] };
    var act = d.activity || [];
    var since = act.length ? act[0].ts || 0 : 0;
    var until = d.step === 'Closed' ? act[act.length - 1].ts || Infinity : Infinity;
    var within = function (x) { return (x.ts || 0) >= since && (x.ts || 0) <= until; };
    return {
      activity: act.concat((p.activity || []).filter(function (x) {
        return within(x) && /^(Report Submitted|Report Returned|Revision Submitted)$/.test(x.action);
      })),
      resultLog: (p.resultLog || []).filter(function (x) { return within(x) && (d.codes || []).indexOf(x.code) !== -1; })
    };
  }

  /* ---------- Tabs: Form (everyone) · Report (lab roles while open, everyone once issued) ---------- */
  var tabsCard = document.getElementById('amendTabsCard');
  var tabsNav = document.getElementById('amendTabs');
  function reportVisible() {
    var d = doc();
    return !!d && ((isLabRole(currentRole()) && d.step === 'Open') || d.step === 'Closed');
  }
  function showTab(tab) {
    activeTab = tab;
    tabsNav.querySelectorAll('.nav-link').forEach(function (a) { a.classList.toggle('active', a.dataset.tab === tab); });
    document.querySelectorAll('[data-pane]').forEach(function (p) { p.classList.toggle('d-none', p.dataset.pane !== tab); });
    if (tab === 'form') { renderButtons(); return; }
    if (!reportPanel) {
      reportPanel = ReportPanel.mount({ jenis: source, docId: refId, container: document.getElementById('paneReport'),
        actions: actions, backHref: listHref, formHref: REPORT_FORM_PAGE[source], params: params,
        isActive: function () { return activeTab === 'report'; }, amendmentId: doc().id, onChange: refresh });
    } else {
      reportPanel.render();
    }
  }
  tabsNav.addEventListener('click', function (e) {
    var a = e.target.closest('.nav-link');
    if (!a) return;
    e.preventDefault();
    showTab(a.dataset.tab);
  });
  function refreshTabs() {
    var show = reportVisible();
    tabsNav.querySelector('[data-tab="report"]').parentElement.classList.toggle('d-none', !show);
    tabsCard.classList.toggle('d-none', !show);
    if (!tabChosen && show) {
      tabChosen = true;
      if (params.get('tab') === 'report') { showTab('report'); return; }
    }
    if (!show && activeTab === 'report') showTab('form');
  }

  /* ---------- State ---------- */
  function refresh() {
    var d = doc();
    var p = parent();
    document.getElementById('docStatusBadges').innerHTML = amendmentStatusCardHtml(d);
    var no = d ? d.id : nextFreeNo(AMENDMENT_TYPES[type].prefix + currentYm() + '-', getAmendments().map(function (x) { return x.id; }), 4);
    document.getElementById('docNoValue').textContent = no;
    document.getElementById('docNoValueHistory').textContent = no;
    document.getElementById('docDateValue').textContent = d ? d.tanggal : formatDocDate(new Date());
    document.getElementById('refDocValue').innerHTML = '<a href="' + REPORT_FORM_PAGE[source] + '?docId=' + encodeURIComponent(p.id) + '">' + p.id + '</a>';
    document.getElementById('issuedNoValue').textContent = (d && d.issuedNo) || 'Not Issued';
    document.getElementById('docNote').innerHTML = progressHtml(d, p) + noteHtml(d, p);
    DocJourney.render(document.getElementById('docJourney'), document.getElementById('docMain'),
      { source: source, request: p, currentId: d ? d.id : null, newType: d ? null : type });
    document.getElementById('historyOffcanvasBody').innerHTML = documentHistoryHtml(historyRecord(d, p));
    /* Approval History (Re-test): creator + the other side + Lab Admin */
    var chain = d && d.chain ? d.chain : [];
    var approved = !d ? 0 : d.step === 'Approval' ? (d.approvalIdx || 0) : (d.step === 'Open' || d.step === 'Closed') ? chain.length : 0;
    document.getElementById('approvalInfo').classList.toggle('d-none', !chain.length);
    document.getElementById('lastApproverValue').textContent = approved ? findRole(chain[approved - 1]).label : '–';
    document.getElementById('approvalOffcanvasBody').innerHTML = chain.length ? requestApprovalHistoryHtml(chain, approved, d) : '';
    setLocked(!editable());
    if (type === 'Revision') renderChanges();
    refreshTabs();
    renderButtons();
  }

  fillForm();
  refresh();
  document.addEventListener('holabsys:rolechange', refresh);
});
