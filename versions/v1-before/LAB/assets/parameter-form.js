/* ---------- Master Data › Form Parameter Uji ----------
   ?jenis=Internal|External&value=<key> edits a parameter; ?jenis=… alone creates one of that jenis.
   Saves into getLabParameters() (dummy-parameters.js), so the request forms pick it up right away.
   External parameters have no lab and no sample-label code. */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var existing = params.get('value') ? labParameter(params.get('jenis'), params.get('value')) : null;
  var form = document.getElementById('paramForm');
  var jenisEl = document.getElementById('paramJenis');
  var labEl = document.getElementById('paramLab');
  var $ = window.jQuery;

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  labEl.innerHTML = '<option value="">-- Select Lab --</option>' +
    PARAMETER_LABS.map(function (l) { return '<option value="' + l + '">' + l + '</option>'; }).join('');
  document.getElementById('paramSuhu').innerHTML = '<option value="">-- Select --</option>' +
    flexTabOptions('LAB_SUHU_PENYIMPANAN').map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('');

  /* Lab + label only for Internal */
  function applyJenis() {
    var internal = jenisEl.value === 'Internal';
    document.getElementById('paramLabWrap').classList.toggle('d-none', !internal);
    document.getElementById('paramLabelWrap').classList.toggle('d-none', !internal);
    labEl.required = internal;
    document.getElementById('btnBackParam').href = 'parameter.html?tab=' + jenisEl.value;
  }

  if (existing) {
    document.getElementById('paramPageTitle').textContent = existing.text;
    jenisEl.value = existing.jenis;
    jenisEl.disabled = true; /* requests store the key per jenis */
    labEl.value = existing.lab || '';
    document.getElementById('paramCode').value = existing.code;
    document.getElementById('paramText').value = existing.text;
    document.getElementById('paramLabel').value = existing.label || '';
    document.getElementById('paramMethod').value = existing.method;
    document.getElementById('paramScope').value = String(!!existing.scope);
    document.getElementById('paramLeadTime').value = existing.leadTime;
    document.getElementById('paramSuhu').value = existing.suhu || '';
    document.getElementById('paramUnit').value = existing.unit || '';
    document.getElementById('paramSpec').value = existing.spec || '';
  } else if (params.get('jenis') === 'External') {
    jenisEl.value = 'External';
  }
  applyJenis();
  $(jenisEl).on('change', applyJenis);

  /* Key stored on requests: from the name, unique within the jenis */
  function newValue(jenis, text) {
    var base = text.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'param';
    var value = base, n = 2;
    while (labParameter(jenis, value)) value = base + '-' + n++;
    return value;
  }

  document.getElementById('btnSaveParam').addEventListener('click', function () {
    if (!validateForm(form)) return;
    var jenis = jenisEl.value;
    var internal = jenis === 'Internal';
    var code = document.getElementById('paramCode').value.trim();
    var text = document.getElementById('paramText').value.trim();
    var dup = labParameters(jenis).filter(function (p) { return p.code === code && (!existing || p.value !== existing.value); })[0];
    if (dup) {
      ToastService.showWarning('Code "' + code + '" is already used by ' + dup.text + '.');
      return;
    }
    saveLabParameter({
      jenis: jenis,
      lab: internal ? labEl.value : '',
      value: existing ? existing.value : newValue(jenis, text),
      code: code,
      label: internal ? document.getElementById('paramLabel').value.trim().toUpperCase() : '',
      text: text,
      method: document.getElementById('paramMethod').value.trim(),
      scope: document.getElementById('paramScope').value === 'true',
      leadTime: parseInt(document.getElementById('paramLeadTime').value, 10) || 1,
      suhu: document.getElementById('paramSuhu').value,
      unit: document.getElementById('paramUnit').value.trim(),
      spec: document.getElementById('paramSpec').value.trim()
    });
    ToastService.showSuccess('Parameter "' + text + '" saved to the master: ' + jenis + '.');
    setTimeout(function () { window.location.href = 'parameter.html?tab=' + jenis; }, 600);
  });
});
