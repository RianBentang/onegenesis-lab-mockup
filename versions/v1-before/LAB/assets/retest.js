/* ---------- Re-test dialog (TCM) — shared by the Internal form and the Report form ----------
   RetestDialog.open(record, onDone(updatedRecord))
   One dialog for the whole life of an Internal request (logic: applyRetest, dummy-requests.js):
   the TCM can start a re-test wherever the document is — still in testing (no report), in a Draft
   report, waiting for approval, or after the certificate was issued. Parameters that were not tested
   yet are shown but cannot be ticked. The requester asks outside the app (WhatsApp, phone, …), so
   the TCM records who asked and through which channel (FlexTab LAB_REQUEST_CHANNEL).
   Needs: dummy-requests.js, dummy-reagents.js, dummy-flextab.js, dummy-parameters.js, bootstrap,
   jQuery + spk-select2.js, spk-toast.js, og-shell.js. */
var RetestDialog = (function () {
  var STAGE_TEXT = {
    Testing: 'No report yet: the selected results are cleared (if any were pushed) and the parameters are marked [Re-test] in Excel for a new run.',
    Report: 'The report is not issued yet: the selected results are cleared, the report goes back to Draft and the parameters back to Excel. The number does not change.',
    Issued: 'The certificate is already issued: the selected results go back to Excel, the report follows CRL review → TCM approval again and is reissued with a -RT number. The current certificate stays valid until then.'
  };
  var el = null;
  var current = null;
  var onDone = null;

  function build() {
    if (el) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade" id="retestModal" tabindex="-1" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
      '<div class="modal-header"><h6 class="modal-title fw-semibold">Re-test</h6>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>' +
      '<div class="modal-body">' +
      '<div class="alert alert-info-transparent fs-12 py-2 mb-3" id="retestInfo"></div>' +
      '<div class="row g-3">' +
      '<div class="col-12"><label class="form-label">Parameters to re-test <span class="text-danger">*</span></label><div id="retestParams"></div></div>' +
      '<div class="col-12 col-md-6"><label class="form-label" for="retestRequestedBy">Requested By <span class="text-danger">*</span></label>' +
      '<input type="text" class="form-control" id="retestRequestedBy" placeholder="Name of the requester" /></div>' +
      '<div class="col-12 col-md-6"><label class="form-label" for="retestChannel">Channel <span class="text-danger">*</span></label>' +
      '<select id="retestChannel" class="form-select"></select></div>' +
      '<div class="col-12"><label class="form-label" for="retestReason">Reason <span class="text-danger">*</span></label>' +
      '<textarea id="retestReason" class="form-control" rows="3" placeholder="Write the reason..."></textarea>' +
      '<div class="form-text fs-11"><i class="ri-flask-line"></i> One more run of reagents is deducted per parameter (not for Subcontract).</div>' +
      '<div class="text-danger fs-12 mt-1" id="retestError"></div></div>' +
      '</div></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-sm btn-light" data-bs-dismiss="modal">Cancel</button>' +
      '<button type="button" class="btn btn-sm btn-danger" id="btnConfirmRetest"><i class="ri-restart-line me-1"></i>Start Re-test</button></div>' +
      '</div></div></div>';
    el = wrap.firstChild;
    document.body.appendChild(el);
    var channel = el.querySelector('#retestChannel');
    channel.innerHTML = '<option value="">-- Select --</option>' +
      flexTabOptions('LAB_REQUEST_CHANNEL').map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    if (window.spkSelect2) window.spkSelect2(channel, { dropdownParent: window.jQuery(el) });
    el.querySelector('#btnConfirmRetest').addEventListener('click', confirm);
  }

  function open(record, done) {
    build();
    current = record;
    onDone = done;
    var list = retestCandidates(record);
    el.querySelector('#retestInfo').textContent = STAGE_TEXT[retestStage(record)];
    el.querySelector('#retestParams').innerHTML = list.map(function (c) {
      var sub = paramSubkontrak(record, c.code);
      return '<div class="form-check"><input class="form-check-input" type="checkbox" id="rt-' + c.code + '" value="' + c.code + '"' + (c.ok ? '' : ' disabled') + ' />' +
        '<label class="form-check-label' + (c.ok ? '' : ' text-muted') + '" for="rt-' + c.code + '">' + c.text +
        ' <span class="text-muted fs-12">· Sample No. ' + (sampleNoFor(record, c.code) || '-') + (sub ? ' · Subcontract ' + sub : '') +
        (c.ok ? '' : ' · ' + c.why) + '</span></label></div>';
    }).join('') || '<div class="text-muted fs-12">No accepted parameters.</div>';
    var none = !list.some(function (c) { return c.ok; });
    el.querySelector('#btnConfirmRetest').disabled = none;
    el.querySelector('#retestError').textContent = none ? 'Nothing has been tested yet, so there is nothing to re-test. Test it normally; change the method / instrument in the Technical Review if needed.' : '';
    el.querySelector('#retestRequestedBy').value = record.pemohon || '';
    window.jQuery(el.querySelector('#retestChannel')).val('WhatsApp').trigger('change');
    el.querySelector('#retestReason').value = '';
    window.bootstrap.Modal.getOrCreateInstance(el).show();
  }

  function confirm() {
    var codes = Array.prototype.map.call(el.querySelectorAll('#retestParams input:checked'), function (i) { return i.value; });
    var meta = {
      requestedBy: el.querySelector('#retestRequestedBy').value.trim(),
      channel: el.querySelector('#retestChannel').value,
      reason: el.querySelector('#retestReason').value.trim()
    };
    var err = !codes.length ? 'Select at least one parameter.' : (!meta.requestedBy || !meta.channel ? 'Requested By and Channel are required.' : (!meta.reason ? 'Reason is required.' : ''));
    el.querySelector('#retestError').textContent = err;
    if (err) return;
    var updated = applyRetest(current, codes, meta, currentRole());
    window.bootstrap.Modal.getOrCreateInstance(el).hide();
    ToastService.showSuccess('Re-test ' + updated.retests.length + ' started: ' + codes.length + ' parameter(s) back in Excel' +
      (updated._reagentRows ? ', ' + updated._reagentRows + ' reagent deduction(s) logged' : '') + '.');
    if (onDone) onDone(updated);
  }

  return { open: open };
})();
