/* ---------- Request approval flow for the Sensory and ASLT forms (SpkForm) ----------
   Same behaviour as the Internal / External forms: the chain follows Tipe + Tujuan Analisa
   (requestApprovalChain), only the pending level can approve, Return to Edit / Reject ask for
   a reason, the requester (BSU) can only edit a new / draft / returned document, and the info bar
   shows the doc status + workflow badge (docStatusCardHtml, dummy-requests.js).
   After the last approval the request is Fully Approved with "Waiting for Schedule"; Schedule
   turns it into Confirmed (markPanelRequestScheduled), and then Excel can pull it.

   setupRequestApproval({
     docNo: () => current No. ID,           getRecord(id), update(id, patch),
     listUrl, label ('Sensory' | 'ASLT'),   formId,
     collect() → record values (step/approvalIdx are set here),
     validate() → '' or an error message,   setLocked(locked),
     onApproved(record) → extra patch for the last approval (e.g. blind codes)
   }) */
function setupRequestApproval(opts) {
  var formActionButtons = document.getElementById('formActionButtons');
  var BACK_BTN_HTML = '<a href="' + opts.listUrl + '" class="btn btn-sm bg-white d-inline-flex align-items-center gap-1"><i class="ri-arrow-left-line"></i> Back</a>';
  var tipeEl = document.getElementById('tipePengajuan');
  var tujuanEl = document.getElementById('tujuanAnalisa');

  function currentChain() {
    var rec = opts.getRecord(opts.docNo());
    var tipe = tipeEl ? tipeEl.value : (rec && rec.tipe) || 'Normal';
    var tujuan = tujuanEl ? tujuanEl.value : (rec && rec.tujuan) || '';
    return requestApprovalChain(tipe || 'Normal', tujuan);
  }

  /* ---------- reason modal (Return to Edit / Reject) ---------- */
  var reasonModalEl = document.getElementById('reasonModal');
  var reasonModal = (window.bootstrap && reasonModalEl) ? new window.bootstrap.Modal(reasonModalEl) : null;
  var pendingReasonAction = null;
  function openReasonModal(action) {
    pendingReasonAction = action;
    document.getElementById('reasonModalTitle').textContent = action === 'reject' ? 'Reject Reason' : 'Return to Edit Reason';
    document.getElementById('reasonModalTextarea').value = '';
    document.getElementById('reasonModalError').style.display = 'none';
    if (reasonModal) reasonModal.show();
  }
  var reasonConfirm = document.getElementById('reasonModalConfirm');
  if (reasonConfirm) {
    reasonConfirm.addEventListener('click', function () {
      var reason = document.getElementById('reasonModalTextarea').value.trim();
      if (!reason) { document.getElementById('reasonModalError').style.display = 'block'; return; }
      var id = opts.docNo();
      opts.update(id, pendingReasonAction === 'reject'
        ? { step: 'Rejected', rejectReason: reason, reasonBy: currentRole().label, reasonAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }
        : { step: 'Draft', approvalIdx: 0, returned: true, returnReason: reason, reasonBy: currentRole().label, reasonAt: new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) });
      if (reasonModal) reasonModal.hide();
      ToastService.showSuccess('Document ' + (pendingReasonAction === 'reject' ? 'rejected' : 'returned for editing') + ': "' + reason + '"');
      refresh();
    });
  }

  /* ---------- header buttons ---------- */
  function renderButtons(mode) {
    if (mode === 'bsu') {
      formActionButtons.innerHTML = BACK_BTN_HTML +
        '<button type="button" data-action="save-draft" class="btn btn-sm btn-warning btn-wave d-inline-flex align-items-center gap-1 text-white"><i class="ri-save-3-line"></i> Save Draft</button>' +
        '<button type="button" data-action="submit" class="btn btn-sm btn-success btn-wave d-inline-flex align-items-center gap-1"><i class="ri-send-plane-fill"></i> Submit</button>';
    } else if (mode === 'approver') {
      formActionButtons.innerHTML = BACK_BTN_HTML +
        '<button type="button" data-action="return" class="btn btn-sm btn-warning d-inline-flex align-items-center gap-1 text-white"><i class="ri-arrow-go-back-line"></i> Return to Edit</button>' +
        '<button type="button" data-action="reject" class="btn btn-sm btn-danger d-inline-flex align-items-center gap-1"><i class="ri-close-circle-line"></i> Reject</button>' +
        '<button type="button" data-action="approve" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-checkbox-circle-line"></i> Approve</button>';
    } else if (mode === 'schedule') {
      formActionButtons.innerHTML = BACK_BTN_HTML +
        '<a href="schedule.html?jenis=' + opts.label + '&request=' + encodeURIComponent(opts.docNo()) + '" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-calendar-event-line"></i> Schedule</a>';
    } else {
      formActionButtons.innerHTML = BACK_BTN_HTML;
    }
  }

  /* A new document keeps its No. ID in the URL once saved, so a reload reopens it */
  function rememberDocId(id) {
    if (!/[?&]docId=/.test(location.search) && window.history && history.replaceState) {
      history.replaceState(null, '', location.pathname + (location.search ? location.search + '&' : '?') + 'docId=' + encodeURIComponent(id));
    }
  }

  formActionButtons.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    var id = opts.docNo();
    var role = currentRole();

    if (action === 'save-draft') {
      var draft = opts.collect();
      var prev = opts.getRecord(id);
      draft.step = 'Draft';
      draft.approvalIdx = 0;
      draft.returned = !!(prev && prev.returned);
      opts.update(id, draft);
      rememberDocId(id);
      ToastService.showSuccess(opts.label + ' request draft "' + id + '" saved.');
      refresh();
    } else if (action === 'submit') {
      var form = document.getElementById(opts.formId);
      if (form && !validateForm(form)) return;
      var err = opts.validate ? opts.validate() : '';
      if (err) { ToastService.showWarning(err); return; }
      var rec = opts.collect();
      rec.step = 'Approval';
      rec.approvalIdx = 0;
      rec.returned = false;
      opts.update(id, rec);
      rememberDocId(id);
      var chain = currentChain();
      ToastService.showSuccess(opts.label + ' request "' + id + '" submitted. Waiting for approval by ' + findRole(chain[0]).label + '.');
      refresh();
    } else if (action === 'return') {
      openReasonModal('return');
    } else if (action === 'reject') {
      openReasonModal('reject');
    } else if (action === 'approve') {
      var ch = currentChain();
      var idx = ch.indexOf(role.code);
      var pending = (opts.getRecord(id) || {}).approvalIdx || 0;
      if (idx !== pending) {
        ToastService.showWarning('It is not yet the turn of ' + role.label + '. Waiting for approval by ' + findRole(ch[pending]).label + '.');
        refresh();
        return;
      }
      if (idx === ch.length - 1) {
        var patch = Object.assign({ step: 'Scheduling', approvalIdx: ch.length }, opts.onApproved ? opts.onApproved(opts.getRecord(id)) : {});
        opts.update(id, patch);
        ToastService.showSuccess('Approved by ' + role.name + ' (' + role.label + '). Fully Approved, waiting to be scheduled in Schedule.');
      } else {
        opts.update(id, { approvalIdx: idx + 1 });
        ToastService.showSuccess('Approved by ' + role.name + ' (' + role.label + '). Next: ' + findRole(ch[idx + 1]).label + '.');
      }
      refresh();
    }
  });

  /* ---------- state ---------- */
  function refresh() {
    var role = currentRole();
    var record = opts.getRecord(opts.docNo());
    var step = record ? record.step : null;
    var chain = currentChain();
    var approvedCount = step === 'Approval' ? (record.approvalIdx || 0)
      : (step === 'Scheduling' || step === 'Running') ? chain.length : 0;
    var isBSU = role.code === 'BSU';
    var editable = isBSU && (!step || step === 'Draft');
    var isApprover = !isBSU && step === 'Approval' && chain.indexOf(role.code) === approvedCount;
    var canSchedule = role.code === 'ADM' && step === 'Scheduling';

    opts.setLocked(!editable);
    renderButtons(editable ? 'bsu' : (isApprover ? 'approver' : (canSchedule ? 'schedule' : 'back-only')));

    var statusEl = document.getElementById('docStatusBadges');
    if (statusEl) statusEl.innerHTML = docStatusCardHtml(record || {});
    var noteEl = document.getElementById('docReasonNote');
    if (noteEl) noteEl.innerHTML = docReasonNoteHtml(record) + docReportNoteHtml(record, opts.label.toLowerCase());
    var lastEl = document.getElementById('lastApproverValue');
    if (lastEl) lastEl.textContent = approvedCount ? findRole(chain[approvedCount - 1]).label : '–';
    /* Approval History + Document History offcanvases of onegenesis-web SpkForm (spk-history.js) */
    document.getElementById('approvalOffcanvasBody').innerHTML = requestApprovalHistoryHtml(chain, approvedCount, record);
    document.getElementById('historyOffcanvasBody').innerHTML = documentHistoryHtml(record);
  }

  document.addEventListener('holabsys:rolechange', refresh);
  if (window.jQuery) {
    if (tipeEl) window.jQuery(tipeEl).on('change', refresh);
    if (tujuanEl) window.jQuery(tujuanEl).on('change', refresh);
  }
  refresh();
  return { refresh: refresh };
}
