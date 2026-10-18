/* ---------- No. Reference (section 1 of the request forms) ----------
   SpkLovInput: the requester picks an earlier request of the same type and its contents are copied
   into this form as a starting point ("nyontek"). The copy is a template only: number, date, status,
   approvals, lab work and results are never copied, nor the sample-specific Batch Code / Production
   Date. Picking reloads the form with ?ref=<id> (keeping ?docId= of a saved draft); the form pre-fills
   from requestTemplate(ref) instead of the saved record, and saves the reference as record.refNo.

   RequestReference.setup({ title, rows: () => records, current: () => record|null, docId: () => id,
     columns: [{ key, label }] (optional extra columns) })
   requestTemplate(record) → copy of the record without the excluded fields */
var REFERENCE_SKIP = ['id', 'tanggal', 'step', 'approvalIdx', 'returned', 'returnReason', 'rejectReason', 'reasonBy', 'reasonAt',
  'spk', 'spkAt', 'sampleNos', 'hasilKajiUlang', 'catatanKajiUlang', 'kajiUlang', 'analis', 'estSelesai', 'paramsDiterima',
  'reportStatus', 'reportNo', 'reportBase', 'reportHistory', 'reportCycle', 'reportSubmittedBy', 'reportSubmittedAt',
  'reportReturnReason', 'reportReturnedBy', 'reportReturnedAt', 'results', 'rawData', 'resultLog', 'activity', 'retests',
  'revisions', 'receipt', 'customerConsent', 'consentedCodes', 'reagentDeducted', 'reviewChanges', 'pushedAt', 'firstPushAt',
  'analisHasil', 'panelStats', 'blindCodes', 'deliveredAt', 'subkontrakCert', 'timepoint', 'status', 'refNo',
  'pemohon', 'departemen', 'onBehalf', 'onBehalfUser', 'batch', 'prod'];

function requestTemplate(record) {
  var t = {};
  Object.keys(record || {}).forEach(function (k) { if (REFERENCE_SKIP.indexOf(k) === -1) t[k] = JSON.parse(JSON.stringify(record[k])); });
  return t;
}

var RequestReference = { setup: function (opts) {
  var input = document.getElementById('noReference');
  var btn = document.getElementById('btnPickReference');
  if (!input || !btn) return;
  var params = new URLSearchParams(location.search);
  var current = opts.current();
  input.value = params.get('ref') || (current && current.refNo) || '';

  /* Only the requester, while the document is still New / Draft / Return to Edit */
  function editable() {
    var r = opts.current();
    return currentRole().code === 'BSU' && (!r || r.step === 'Draft');
  }
  function lock() { btn.disabled = !editable(); }
  lock();
  document.addEventListener('holabsys:rolechange', lock);

  btn.addEventListener('click', function () {
    if (!editable()) return;
    var me = opts.docId();
    var rows = opts.rows().filter(function (r) { return r.id !== me && r.step; }).slice().sort(newestFirst).map(function (r) {
      return Object.assign({}, r, { statusText: getDocStatus(r).status });
    });
    SpkLov.open({
      title: 'Select Reference — ' + opts.title,
      columns: [{ key: 'id', label: 'No.' }, { key: 'tanggal', label: 'Date' }, { key: 'sampel', label: 'Sample' }, { key: 'tipe', label: 'Type' }]
        .concat(opts.columns || []).concat([{ key: 'statusText', label: 'Status' }]),
      rows: rows,
      onSelect: function (r) {
        SpkConfirm.open('Copy the contents of ' + r.id + ' into this form? Current entries are replaced; Batch Code and Production Date stay empty.', function () {
          var q = new URLSearchParams(location.search);
          q.set('ref', r.id);
          q.delete('tab');
          location.href = location.pathname + '?' + q.toString();
        });
      }
    });
  });

  if (params.get('ref') && opts.rows().some(function (r) { return r.id === params.get('ref'); })) {
    ToastService.showInfo('Copied from ' + params.get('ref') + '. Check the contents, fill in Batch Code and Production Date, then save or submit.');
  }
} };
