/* ---------- Approval History + Document History (port of onegenesis-web SpkForm offcanvases) ----------
   The same file in both proposal versions (LAB/ and versions/v1-before/LAB/):
   - spkApprovalHistoryHtml(data)  → "Approval History" offcanvas: creator row + one row per approver
     level (avatar initials, Approver · Level n, status badge, name, group, date, reason chip)
   - spkDocumentHistoryHtml(items) → "Document History" offcanvas: ul.tl with a coloured icon dot,
     tl-title (action, status words as badges) and tl-meta (user · date)
   - requestApprovalHistoryHtml(chain, approvedCount, record) / documentHistoryHtml(record) build
     them from the request record.
   Data: every store update records its transition in record.activity (mergeWithActivity, called by
   updateRequest / updateExternalRequest / updateSensoryRequest / updateAsltRequest). Load after
   og-shell.js; stores fall back to a plain merge on pages without this file. */

function historyNow() {
  var d = new Date();
  var p = function (n) { return String(n).padStart(2, '0'); };
  return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function historyChain(source, r) {
  if (source === 'external') return typeof externalApprovalChain === 'function' ? externalApprovalChain(r.tipe, r.tujuan) : [];
  return typeof requestApprovalChain === 'function' ? requestApprovalChain(r.tipe, r.tujuan) : [];
}

/* ---------- Document history — one source for "what happened, who, when" ----------
   Every store update (updateRequest, updateExternalRequest, updateSensoryRequest, updateAsltRequest)
   compares the record before and after and appends the transition to record.activity
   (append-only): submit, each approval level, return / reject, sample receipt, requester consent,
   SPK, delivery, schedule, report submit / return / issue, re-test. The Document History offcanvas
   shows it merged with record.resultLog (result changes, lab roles only), so request forms and the
   report read the same history — there is no separate audit trail anywhere else.
   Entry: { at: 'dd-mm-yyyy hh:mm', ts (ms, for ordering), by, role, action, note, variant } */
function activityActor() {
  var r = typeof currentRole === 'function' ? currentRole() : null;
  return r ? { by: r.name, role: r.label } : { by: 'System', role: '' };
}
function trackActivity(source, prev, next) {
  var log = prev ? (prev.activity || legacyActivity(prev)) : [];
  var add = [];
  var e = function (action, note, variant) { add.push({ action: action, note: note || '', variant: variant || 'primary' }); };
  var p = prev || {};
  if (next.step !== p.step || next.approvalIdx !== p.approvalIdx) {
    var chain = next.tipe ? historyChain(source, next) : [];
    var wasDraft = !p.step || p.step === 'Draft';
    if (next.step === 'Draft' && next.returned && p.step === 'Approval') e('Returned to Edit', next.returnReason, 'warning');
    else if (next.step === 'Draft' && !p.step) e('Saved as Draft', '', 'secondary');
    else if (next.step === 'Rejected') e('Rejected', next.rejectReason, 'danger');
    else if (wasDraft && next.step && next.step !== 'Draft') e('Submitted', chain.length ? 'Waiting for ' + chain[0] : 'No approval needed', 'info');
    else if (p.step === 'Approval') {
      var from = p.approvalIdx || 0;
      var to = next.step === 'Approval' ? (next.approvalIdx || 0) : chain.length;
      for (var i = from; i < to; i++) e('Approved', 'Level ' + (i + 1) + (chain[i] ? ' · ' + chain[i] : ''), 'success');
    }
    if (p.step === 'Approval' && next.step === 'Technical Review' && next.receipt) {
      e('Sample Received', 'Condition ' + next.receipt.condition + (next.receipt.note ? ' — ' + next.receipt.note : '') +
        ' · retained until ' + next.receipt.retentionUntil, 'primary');
    }
    if (p.step === 'Sample Delivery' && next.step === 'Confirmed') e('Delivery Confirmed', 'Sample sent to ' + (next.lab || 'the vendor lab'), 'success');
    if (p.step === 'Scheduling' && next.step === 'Running') e('Scheduled', 'Panel session saved in Schedule', 'success');
    if (p.step === 'Running' && next.step === 'Scheduling') e('Schedule Removed', 'Last panel session deleted', 'warning');
  }
  var pc = p.customerConsent || {};
  var nc = next.customerConsent || {};
  if (nc.status && (nc.status !== pc.status || nc.requestedAt !== pc.requestedAt)) {
    var items = (nc.items || []).map(function (it) { return it.text + ' (' + it.type + (it.vendor ? ' · ' + it.vendor : '') + ')'; }).join(', ');
    if (nc.status === 'Pending') e('Sent to Requester', 'Technical review outcome: ' + items, 'warning');
    if (nc.status === 'Agreed') e('Requester Agreed', items, 'success');
    if (nc.status === 'Declined') e('Requester Declined', nc.reason, 'danger');
  }
  if ((next.reviewChanges || []).length > (p.reviewChanges || []).length) {
    var rc = next.reviewChanges[next.reviewChanges.length - 1];
    e('Technical Review Changed', rc.changes.join('; ') + ' — ' + rc.reason, 'warning');
  }
  if (next.spk && !p.spk) e('SPK Issued', next.spk + (next.hasilKajiUlang ? ' · ' + next.hasilKajiUlang : ''), 'success');
  if (next.reportStatus !== p.reportStatus) {
    var rev = next.reportCycle && next.reportCycle.type === 'Revision';
    if (next.reportStatus === 'Confirm to Approve') e(rev ? 'Revision Submitted' : 'Report Submitted', rev ? next.reportCycle.reason : '', 'info');
    else if (next.reportStatus === 'Draft' && p.reportStatus === 'Confirm to Approve' && next.reportReturnReason) e('Report Returned', next.reportReturnReason, 'warning');
    else if (next.reportStatus === 'Final') e('Certificate Issued', next.reportNo, 'success');
  }
  if ((next.retests || []).length > (p.retests || []).length) {
    var t = next.retests[next.retests.length - 1];
    e('Re-test ' + t.no, t.params.join(', ') + ' — ' + t.reason, 'danger');
  }
  if (!add.length) return log;
  var who = activityActor();
  var at = historyNow();
  var ts = Date.now();
  return log.concat(add.map(function (x) { return Object.assign({ at: at, ts: ts, by: who.by, role: who.role }, x); }));
}

/* Store helper: merge a patch into the previous record and record the transition */
function mergeWithActivity(source, prev, patch, id) {
  var next = Object.assign({}, prev || { id: id }, patch);
  next.activity = trackActivity(source, prev, next);
  return next;
}

/* 'dd-mm-yyyy hh:mm' or '13 Oct 2026, 15:36' → ms (0 when unknown) */
function stampTime(s) {
  if (!s || s === '-') return 0;
  var m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)).getTime();
  var t = Date.parse(String(s).replace(',', ''));
  return isNaN(t) ? 0 : t;
}

/* Records saved before record.activity existed: rebuild what the stored fields still tell */
function legacyActivity(r) {
  var out = [];
  var e = function (at, action, note, variant, by) { if (at) out.push({ at: at, by: by || '-', role: '', action: action, note: note || '', variant: variant }); };
  if (r.step && r.step !== 'Draft') e(r.tanggal, 'Submitted', '', 'info', r.pemohon);
  if (r.receipt) e(r.receipt.at, 'Sample Received', 'Condition ' + r.receipt.condition, 'primary', r.receipt.by);
  if (r.spkAt) e(r.spkAt, 'SPK Issued', r.spk, 'success');
  if (r.reasonAt) e(r.reasonAt, r.step === 'Rejected' ? 'Rejected' : 'Returned to Edit', r.rejectReason || r.returnReason, r.step === 'Rejected' ? 'danger' : 'warning', r.reasonBy);
  (r.retests || []).forEach(function (t) { e(t.at, 'Re-test ' + t.no, t.params.join(', ') + ' — ' + t.reason, 'danger', t.by); });
  (r.reportHistory || []).forEach(function (h) { e(h.at, 'Certificate Issued', h.no, 'success', h.approvedBy); });
  return out;
}

/* SpkApprovalTimeline items of the Document History: activity + result changes (lab roles), oldest first */
function documentHistoryItems(r, withResults) {
  if (!r) return [];
  var items = (r.activity || legacyActivity(r)).map(function (a, i) {
    return { t: a.ts || stampTime(a.at), i: i, status: a.action, variant: a.variant, who: a.by, role: a.role, at: a.at, note: a.note };
  });
  if (withResults) {
    (r.resultLog || []).forEach(function (x, i) {
      var p = typeof labParameter === 'function' ? labParameter('Internal', x.code) : null;
      items.push({ t: x.ts || stampTime(x.at), i: 1000 + i, status: x.action, variant: /Superseded/.test(x.action) ? 'danger' : 'secondary',
        who: x.by, role: '', at: x.at,
        note: (p ? p.text : x.code) + ((x.values || []).length ? ': ' + x.values.join(' / ') + ' → ' + x.result : '') + (x.note ? ' · ' + x.note : '') });
    });
  }
  return items.sort(function (a, b) { return a.t - b.t || a.i - b.i; });
}


/* ---------- Rendering (markup of SpkForm, onegenesis-web) ---------- */
function historyInitials(name) {
  if (!name || !String(name).trim()) return '??';
  return String(name).trim().split(/\s+/).slice(0, 2).map(function (p) { return p[0].toUpperCase(); }).join('');
}
/* SpkForm formatDateTime: '14 Oct 2026, 02:07' */
function historyDateTime(s) {
  var t = typeof s === 'number' ? s : stampTime(s);
  if (!t) return '-';
  var d = new Date(t);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/* SpkForm getApprovalBadge */
var HISTORY_APPROVAL_BADGE = {
  Approved: 'badge bg-success-transparent', Requester: 'badge bg-info-transparent', RTE: 'badge bg-warning-transparent',
  Rejected: 'badge bg-danger-transparent', Canceled: 'badge bg-danger-transparent'
};

/* data = { docId, creator: { name, userId, group, date }, approvers: [{ level, name, userId, group, date, status, reason }] }
   status: 'Approved' | 'RTE' | 'Rejected' | 'Pending' */
function spkApprovalHistoryHtml(data) {
  var c = data.creator;
  var html = '<ul class="list-group list-group-flush mb-0">' +
    '<li class="list-group-item d-flex align-items-start gap-2 py-3 border-bottom-0 bg-primary-transparent rounded mb-2">' +
      '<span class="avatar avatar-md avatar-rounded bg-primary-transparent text-primary flex-shrink-0 mt-1">' + historyInitials(c.name) + '</span>' +
      '<div class="flex-fill min-w-0">' +
        '<div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-1">' +
          '<span class="text-uppercase text-muted fw-semibold fs-10">Creator' + (c.userId ? ' · ' + c.userId : '') + '</span>' +
          '<span class="badge bg-primary-transparent">Creator</span></div>' +
        '<div class="fw-semibold text-heading fs-13">' + (c.name || '-') + '</div>' +
        (c.group ? '<div class="text-muted fs-11 mt-1">' + c.group + '</div>' : '') +
        '<div class="text-muted fs-10 mt-1">' + historyDateTime(c.date) + '</div>' +
      '</div></li>';
  data.approvers.forEach(function (a) {
    var pending = a.status === 'Pending';
    var bad = a.status === 'Rejected' || a.status === 'Canceled';
    html += '<li class="list-group-item d-flex align-items-start gap-2 py-3 border-bottom border-block-end-dashed' + (pending ? ' opacity-75' : '') + '">' +
      '<span class="avatar avatar-md avatar-rounded flex-shrink-0 mt-1 ' + (pending ? 'bg-light text-muted' : 'bg-success-transparent text-success') + '">' + historyInitials(a.name) + '</span>' +
      '<div class="flex-fill min-w-0">' +
        '<div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-1">' +
          '<span class="text-uppercase text-muted fw-semibold fs-10">Approver · Level ' + a.level + (a.userId ? ' · ' + a.userId : '') + '</span>' +
          '<span class="' + (pending ? 'badge bg-light text-muted' : HISTORY_APPROVAL_BADGE[a.status] || 'badge bg-light text-muted') + '">' + a.status + '</span></div>' +
        '<div class="fw-semibold text-heading fs-13">' + a.name + '</div>' +
        (a.group ? '<div class="text-muted fs-11 mt-1">' + a.group + '</div>' : '') +
        '<div class="text-muted fs-10 mt-1">' + (pending ? '—' : historyDateTime(a.date)) + '</div>' +
        (a.reason ? '<div class="mt-2 p-1 px-2 d-inline-flex align-items-start gap-1 rounded fs-10 fw-semibold text-wrap ' +
          (bad ? 'bg-danger-transparent text-danger' : 'bg-warning-transparent text-warning') + '">' +
          '<i class="' + (bad ? 'ri-close-circle-line' : 'ri-file-edit-line') + ' mt-1"></i><span>' + a.reason + '</span></div>' : '') +
      '</div></li>';
  });
  return html + '</ul>';
}

/* SpkForm getTimelineDot, by action text */
function historyTimelineDot(action) {
  var a = String(action || '').toUpperCase();
  if (a.indexOf('CANCEL') !== -1) return { style: 'background: rgb(var(--danger-rgb))', icon: 'ri-forbid-line' };
  if (a.indexOf('RETURN') !== -1) return { style: 'background: rgb(var(--warning-rgb))', icon: 'ri-file-edit-line' };
  if (a.indexOf('REJECT') !== -1 || a.indexOf('DECLIN') !== -1 || a.indexOf('SUPERSEDED') !== -1 || a.indexOf('RE-TEST') !== -1) {
    return { style: 'background: rgb(var(--danger-rgb))', icon: 'ri-close-line' };
  }
  if (a.indexOf('DRAFT') !== -1 || a.indexOf('RAW DATA') !== -1) return { style: 'background: rgb(var(--info-rgb))', icon: 'ri-file-add-line' };
  if (a.indexOf('SUBMIT') !== -1 || a.indexOf('SENT') !== -1) return { cls: 'bg-primary-gradient', icon: 'ri-send-plane-line' };
  return { cls: 'bg-success-gradient', icon: a.indexOf('ISSUED') !== -1 || a.indexOf('CONFIRMED') !== -1 ? 'ri-checkbox-circle-line' : 'ri-check-line' };
}
/* SpkForm renderActionPart: status words become badges */
function historyActionHtml(action) {
  var a = String(action || '');
  var u = a.toUpperCase();
  if (u === 'RETURNED TO EDIT') return '<span class="badge bg-warning-transparent ms-1">RTE</span>';
  if (/REJECT|DECLIN/.test(u)) return '<span class="badge bg-danger-transparent ms-1">' + a + '</span>';
  if (u === 'APPROVED' || u === 'REQUESTER AGREED') return '<span class="badge bg-success-transparent ms-1">' + a + '</span>';
  return '<span>' + a + '</span>';
}

/* items: documentHistoryItems() → [{ status (action), who, role, at, t, note }] */
function spkDocumentHistoryHtml(items) {
  return '<ul class="tl">' + (items.length ? items.map(function (it) {
    var dot = historyTimelineDot(it.status);
    return '<li class="tl-item">' +
      '<span class="tl-dot ' + (dot.cls || '') + '"' + (dot.style ? ' style="' + dot.style + '"' : '') + '><i class="' + dot.icon + '"></i></span>' +
      '<div class="tl-title">' + historyActionHtml(it.status) + (it.note ? ' <span class="text-muted">· ' + it.note + '</span>' : '') + '</div>' +
      '<div class="tl-meta">' + it.who + (it.role ? ' (' + it.role + ')' : '') + ' · ' + historyDateTime(it.t || it.at) + '</div>' +
      '</li>';
  }).join('') : '<li class="text-muted fs-12">No history available.</li>') + '</ul>' +
    '<p class="fs-11 text-muted mb-0 mt-3"><i class="ri-information-line me-1"></i>Document Created originates from either <strong>Save Draft</strong> or direct <strong>Submit</strong>.</p>';
}

/* ---------- Builders from a request record ---------- */
function documentHistoryHtml(r) {
  return spkDocumentHistoryHtml(documentHistoryItems(r, typeof currentRole === 'function' && typeof isLabRole === 'function' && isLabRole(currentRole())));
}

/* Approval History of a request: dates and reasons from record.activity */
function requestApprovalHistoryHtml(chain, approvedCount, r) {
  var act = (r && (r.activity || legacyActivity(r))) || [];
  var approvals = act.filter(function (a) { return a.action === 'Approved'; });
  var created = act.filter(function (a) { return a.action === 'Saved as Draft' || a.action === 'Submitted'; })[0];
  var creator = typeof findRole === 'function' ? findRole('BSU') : { name: '-' };
  var lastReason = r && (r.step === 'Rejected' || (r.step === 'Draft' && r.returned)) ? r : null;
  return spkApprovalHistoryHtml({
    creator: { name: (r && r.pemohon) || creator.name, userId: 'BSU', group: (r && r.departemen) || creator.dept, date: created ? (created.ts || created.at) : (r && r.tanggal) },
    approvers: chain.map(function (code, i) {
      var role = typeof findRole === 'function' ? findRole(code) : { name: code, label: code };
      var row = { level: i + 1, name: role.name, userId: code, group: role.label, status: 'Pending', date: null, reason: '' };
      if (i < approvedCount) {
        row.status = 'Approved';
        var a = approvals.filter(function (x) { return x.note && x.note.indexOf('Level ' + (i + 1)) === 0; }).pop();
        row.date = a ? (a.ts || a.at) : null;
      } else if (lastReason && (lastReason.reasonBy || '').indexOf(role.label) === 0) {
        row.status = lastReason.step === 'Rejected' ? 'Rejected' : 'RTE';
        row.reason = lastReason.rejectReason || lastReason.returnReason || '';
        row.date = lastReason.reasonAt;
      }
      return row;
    })
  });
}
