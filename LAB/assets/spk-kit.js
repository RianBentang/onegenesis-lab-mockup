/* ---------- Spk kit renderers (onegenesis-web SpkForm + AppFormBase STANDARD_BUTTON_DEFS +
   SpkApprovalTimeline + SpkCountercard) ----------
   One place for the document-page pieces every request / report form uses, so they render the
   classes the Spk components render:
   - spkDocButtonHtml(key[, opts])  → a STANDARD_BUTTON_DEFS button (Back is an <a> to opts.href)
   - spkButtonHtml(action, variant, icon, label) → a SpkButton for a module-specific action
   - spkConfirmNeeded(key) / SpkConfirm.open(text, onYes) → the confirmation the app asks with
     SweetAlert2 before Save Draft / Submit / Approve (Bootstrap modal here, never window.confirm)
   (Approval History / Document History offcanvases: spk-history.js)
   Load after the bootstrap bundle and spk-toast.js, before the page script. */
var SPK_DOC_BUTTONS = {
  back: { label: 'Back', variant: 'light', icon: 'ri-arrow-go-back-line' },
  'save-draft': { label: 'Save Draft', variant: 'warning', icon: 'ri-save-2-line', confirm: 'Are you sure want to save this document as draft?' },
  submit: { label: 'Submit', variant: 'success', icon: 'ri-send-plane-fill', confirm: 'Are you sure want to submit this document or Check your Attachment?' },
  approve: { label: 'Approve', variant: 'success', icon: 'ri-thumb-up-line', confirm: 'Approve this document?' },
  reject: { label: 'Reject', variant: 'danger', icon: 'ri-close-circle-line' },
  'return': { label: 'Return to Edit', variant: 'warning', icon: 'ri-file-edit-line' },
  cancel: { label: 'Cancel', variant: 'danger', icon: 'ri-close-circle-line', confirm: 'Are you sure want to cancel this document?' },
  print: { label: 'Print', variant: 'secondary', icon: 'ri-printer-line' }
};

function spkButtonHtml(action, variant, icon, label, extra) {
  return '<button type="button" data-action="' + action + '"' + (extra && extra.id ? ' id="' + extra.id + '"' : '') +
    ' class="btn btn-' + variant + ' btn-sm btn-wave d-inline-flex align-items-center"><i class="' + icon + ' me-1"></i><span>' + label + '</span></button>';
}

function spkDocButtonHtml(key, opts) {
  var d = SPK_DOC_BUTTONS[key];
  opts = opts || {};
  if (key === 'back') {
    return '<a href="' + (opts.href || '#!') + '" class="btn btn-light btn-sm btn-wave d-inline-flex align-items-center"><i class="' + d.icon + ' me-1"></i><span>' + d.label + '</span></a>';
  }
  return spkButtonHtml(key, d.variant, d.icon, opts.label || d.label, opts);
}

/* Buttons per document mode, Back always first (AppFormBase initDocumentButton) */
function spkDocButtonsHtml(mode, backHref) {
  var keys = { edit: ['save-draft', 'submit'], approver: ['return', 'reject', 'approve'], returned: ['submit', 'cancel'] }[mode] || [];
  return spkDocButtonHtml('back', { href: backHref }) + keys.map(function (k) { return spkDocButtonHtml(k); }).join('');
}

function spkConfirmNeeded(key) {
  return !!(SPK_DOC_BUTTONS[key] && SPK_DOC_BUTTONS[key].confirm);
}

/* SweetAlert2 question dialog of the app, as a Bootstrap modal built once */
var SpkConfirm = (function () {
  var el = null;
  var onYes = null;
  function build() {
    if (el) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade" id="spkConfirmModal" tabindex="-1" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered modal-sm"><div class="modal-content">' +
      '<div class="modal-body text-center p-4">' +
      '<span class="avatar avatar-lg avatar-rounded bg-info-transparent text-info mb-3"><i class="ri-question-line fs-24"></i></span>' +
      '<h6 class="fw-semibold mb-2">Confirmation</h6><p class="text-muted fs-13 mb-0" id="spkConfirmText"></p></div>' +
      '<div class="modal-footer justify-content-center border-top-0 pt-0">' +
      '<button type="button" class="btn btn-light btn-sm" data-bs-dismiss="modal">Cancel</button>' +
      '<button type="button" class="btn btn-primary btn-sm" id="spkConfirmYes">Yes</button></div>' +
      '</div></div></div>';
    el = wrap.firstChild;
    document.body.appendChild(el);
    el.querySelector('#spkConfirmYes').addEventListener('click', function () {
      var fn = onYes;
      onYes = null;
      el.addEventListener('hidden.bs.modal', function once() { el.removeEventListener('hidden.bs.modal', once); if (fn) fn(); });
      window.bootstrap.Modal.getOrCreateInstance(el).hide();
    });
  }
  return {
    open: function (text, yes) {
      build();
      onYes = yes;
      el.querySelector('#spkConfirmText').textContent = text;
      window.bootstrap.Modal.getOrCreateInstance(el).show();
    }
  };
})();

/* Click handler wrapper for a header action bar: actions with a confirmation text ask first */
function spkOnDocAction(container, handler) {
  container.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    if (spkConfirmNeeded(action)) SpkConfirm.open(SPK_DOC_BUTTONS[action].confirm, function () { handler(action, btn); });
    else handler(action, btn);
  });
}

/* ---------- SpkCountercard (reusable-dashboards/spk-countercard) ----------
   c = { label, value, hint, icon, variant, href? } — the footer "View all →" only with href */
function spkCountercardHtml(c) {
  return '<div class="card custom-card h-100 mb-0">' +
    '<div class="card-body pb-2"><div class="d-flex align-items-start gap-3">' +
      '<div class="d-flex align-items-center justify-content-center flex-shrink-0 bg-' + c.variant + '-transparent" style="width:48px;height:48px;border-radius:50%">' +
        '<i class="' + c.icon + ' text-' + c.variant + '" style="font-size:1.3rem"></i></div>' +
      '<div><p class="text-muted mb-1 fw-semibold fs-10 text-uppercase">' + c.label + '</p>' +
        '<div class="d-flex align-items-baseline gap-2"><h4 class="fw-bold mb-0" style="font-size:1.6rem;line-height:1">' + c.value + '</h4></div>' +
        '<span class="text-muted fs-12">' + c.hint + '</span></div>' +
    '</div></div>' +
    (c.href ? '<hr class="my-0 mx-3" /><div class="card-footer bg-transparent border-0 pt-2 pb-3 px-3">' +
      '<a href="' + c.href + '" class="text-muted fs-11 text-decoration-none">View all <span class="ms-1">→</span></a></div>' : '') +
    '</div>';
}
