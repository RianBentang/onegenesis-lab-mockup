/* ---------- Request approval flow for the Sensory and ASLT forms (SpkForm) ----------
   Same behaviour as the Internal / External forms: the chain follows Tipe + Tujuan Analisa
   (panelRequestApprovalChain), only the pending level can approve, Return to Edit / Reject ask for
   a reason, the requester (BSU) can only edit a new / draft / returned document, and the info bar
   shows the doc status + workflow badge (docStatusCardHtml, dummy-requests.js).
   After the last approval the request is Fully Approved with "Waiting for Schedule"; Schedule
   turns it into Confirmed (markPanelRequestScheduled), and then Excel can pull it.

   setupRequestApproval({
     docNo: () => current No. ID,           getRecord(id), update(id, patch),
     listUrl, label ('Sensory' | 'ASLT'),   formId,
     collect() → record values (step/approvalIdx are set here),
     validate() → '' or an error message,   setLocked(locked),
     onApproved(record) → extra patch for the last approval (e.g. blind codes),
     toast(message)
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
    return panelRequestApprovalChain(tipe || 'Normal', tujuan);
  }

  /* ---------- approval list (Last Approver + Document History offcanvas) ---------- */
  function approvalRow(role, levelLabel, statusLabel, pending) {
    var av = (typeof initials === 'function') ? initials(role.name) : role.code;
    return '<div class="d-flex align-items-start gap-2 p-3 rounded mb-2 ' + (pending ? 'bg-light' : 'bg-primary-transparent') + '">' +
      '<span class="avatar avatar-md avatar-rounded bg-primary-transparent text-primary flex-shrink-0 fs-12 fw-semibold">' + av + '</span>' +
      '<div class="flex-fill min-w-0">' +
      '<div class="text-uppercase text-muted fs-10">' + levelLabel + '</div>' +
      '<div class="fs-13 fw-semibold">' + role.name + '</div>' +
      '<div class="fs-11 text-muted">' + role.code + ' · ' + role.label + '</div>' +
      '</div>' +
      '<span class="badge ' + (pending ? 'bg-warning-transparent' : 'bg-success-transparent') + ' align-self-center">' + statusLabel + '</span>' +
      '</div>';
  }
  function renderApprovalList(containerId, chain, approvedCount, record) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var html = approvalRow(findRole('BSU'), 'Creator', 'Creator', false);
    chain.forEach(function (code, i) {
      var ok = i < approvedCount;
      html += approvalRow(findRole(code), 'Approver · Level ' + (i + 1), ok ? 'Approved' : 'Pending', !ok);
    });
    var step = record ? record.step : null;
    if (step === 'Penjadwalan' || step === 'Berjalan') {
      var done = step === 'Berjalan';
      html += approvalRow(findRole('ADM'), 'Workflow · Schedule', done ? 'Scheduled' : 'Pending', !done);
    }
    if (step === 'Rejected') html += '<div class="alert alert-danger-transparent py-2 fs-12 mb-0">Ditolak' + (record.rejectReason ? ': ' + record.rejectReason : '') + '</div>';
    if (record && record.returned && step === 'Draft') html += '<div class="alert alert-warning-transparent py-2 fs-12 mb-0">Dikembalikan untuk edit' + (record.returnReason ? ': ' + record.returnReason : '') + '</div>';
    container.innerHTML = html;
  }

  /* ---------- reason modal (Return to Edit / Reject) ---------- */
  var reasonModalEl = document.getElementById('reasonModal');
  var reasonModal = (window.bootstrap && reasonModalEl) ? new window.bootstrap.Modal(reasonModalEl) : null;
  var pendingReasonAction = null;
  function openReasonModal(action) {
    pendingReasonAction = action;
    document.getElementById('reasonModalTitle').textContent = action === 'reject' ? 'Alasan Reject' : 'Alasan Return to Edit';
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
        ? { step: 'Rejected', rejectReason: reason }
        : { step: 'Draft', approvalIdx: 0, returned: true, returnReason: reason });
      if (reasonModal) reasonModal.hide();
      opts.toast('Dokumen ' + (pendingReasonAction === 'reject' ? 'ditolak' : 'dikembalikan untuk edit') + ': "' + reason + '"');
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
        '<a href="schedule.html?jenis=' + opts.label + '&request=' + encodeURIComponent(opts.docNo()) + '" class="btn btn-sm btn-primary btn-wave d-inline-flex align-items-center gap-1"><i class="ri-calendar-event-line"></i> Jadwalkan</a>';
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
    var role = findRole(localStorage.getItem('holabsysRole'));

    if (action === 'save-draft') {
      var draft = opts.collect();
      var prev = opts.getRecord(id);
      draft.step = 'Draft';
      draft.approvalIdx = 0;
      draft.returned = !!(prev && prev.returned);
      opts.update(id, draft);
      rememberDocId(id);
      opts.toast('Draf pengajuan ' + opts.label + ' "' + id + '" disimpan.');
      refresh();
    } else if (action === 'submit') {
      var form = document.getElementById(opts.formId);
      if (form && form.checkValidity() === false) { form.reportValidity(); return; }
      var err = opts.validate ? opts.validate() : '';
      if (err) { opts.toast(err); return; }
      var rec = opts.collect();
      rec.step = 'Approval';
      rec.approvalIdx = 0;
      rec.returned = false;
      opts.update(id, rec);
      rememberDocId(id);
      var chain = currentChain();
      opts.toast('Pengajuan ' + opts.label + ' "' + id + '" dikirim. Menunggu approval ' + findRole(chain[0]).label + '.');
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
        opts.toast('Belum giliran ' + role.label + '. Menunggu approval ' + findRole(ch[pending]).label + '.');
        refresh();
        return;
      }
      if (idx === ch.length - 1) {
        var patch = Object.assign({ step: 'Penjadwalan', approvalIdx: ch.length }, opts.onApproved ? opts.onApproved(opts.getRecord(id)) : {});
        opts.update(id, patch);
        opts.toast('Disetujui oleh ' + role.name + ' (' + role.label + '). Fully Approved, menunggu dijadwalkan di Schedule.');
      } else {
        opts.update(id, { approvalIdx: idx + 1 });
        opts.toast('Disetujui oleh ' + role.name + ' (' + role.label + '). Lanjut ke ' + findRole(ch[idx + 1]).label + '.');
      }
      refresh();
    }
  });

  /* ---------- state ---------- */
  function refresh() {
    var role = findRole(localStorage.getItem('holabsysRole'));
    var record = opts.getRecord(opts.docNo());
    var step = record ? record.step : null;
    var chain = currentChain();
    var approvedCount = step === 'Approval' ? (record.approvalIdx || 0)
      : (step === 'Penjadwalan' || step === 'Berjalan') ? chain.length : 0;
    var isBSU = role.code === 'BSU';
    var editable = isBSU && (!step || step === 'Draft');
    var isApprover = !isBSU && step === 'Approval' && chain.indexOf(role.code) === approvedCount;
    var canSchedule = role.code === 'ADM' && step === 'Penjadwalan';

    opts.setLocked(!editable);
    renderButtons(editable ? 'bsu' : (isApprover ? 'approver' : (canSchedule ? 'schedule' : 'back-only')));

    var statusEl = document.getElementById('docStatusBadges');
    if (statusEl) statusEl.innerHTML = docStatusCardHtml(record || {});
    var lastEl = document.getElementById('lastApproverValue');
    if (lastEl) lastEl.textContent = approvedCount ? findRole(chain[approvedCount - 1]).label : '–';
    renderApprovalList('approvalOffcanvasBody', chain, approvedCount, record);
    renderApprovalList('historyOffcanvasBody', chain, approvedCount, record);
  }

  document.addEventListener('holabsys:rolechange', refresh);
  if (window.jQuery) {
    if (tipeEl) window.jQuery(tipeEl).on('change', refresh);
    if (tujuanEl) window.jQuery(tujuanEl).on('change', refresh);
  }
  refresh();
  return { refresh: refresh };
}
