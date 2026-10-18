/* ---------- Departemen Pemohon + On Behalf switch (Internal / External forms) ----------
   Same pattern as onegenesis-web MaterialDetailsSection "Vendor Name" + "Registered Vendor?":
   - switch off: the input shows the logged-in role's department (disabled).
   - switch on: SpkLovInput (disabled input + btn-primary search button) — pick the user
     (HRIS_KARYAWAN, dummy-hris.js) the request is filed for in SpkLov (spk-lov.js); the input shows
     that user's department only, the user's NIK sits below in small text-info (like vendorId).
   Markup: input #departemenPemohon + button #btnLovPemohon in one input-group, #onBehalfUserInfo,
   form-switch #onBehalf.
   var onBehalf = OnBehalfField(existingRecord);
   onBehalf.setLocked(locked)  — call after the form's own lock, which enables every field
   onBehalf.isOn() / onBehalf.user()  — stored as record.onBehalf / record.onBehalfUser { nik, name } */
function OnBehalfField(record) {
  var input = document.getElementById('departemenPemohon');
  var btn = document.getElementById('btnLovPemohon');
  var info = document.getElementById('onBehalfUserInfo');
  var sw = document.getElementById('onBehalf');
  var locked = false;
  var user = record && record.onBehalf && record.onBehalfUser ? record.onBehalfUser : null;

  function ownDept() {
    var role = currentRole();
    return role ? role.dept : '';
  }

  function openLov() {
    SpkLov.open({
      title: 'Select User',
      columns: [
        { key: 'nik', label: 'NIK' },
        { key: 'name', label: 'Name' },
        { key: 'dept', label: 'Department' },
        { key: 'position', label: 'Position' }
      ],
      rows: HRIS_KARYAWAN,
      onSelect: function (k) {
        user = { nik: k.nik, name: k.name };
        input.value = k.dept;
        apply();
      }
    });
  }

  function apply() {
    input.disabled = true; /* SpkLovInput inputDisabled: the value only comes from the LOV */
    btn.classList.toggle('d-none', !sw.checked);
    btn.disabled = locked;
    sw.disabled = locked;
    info.textContent = sw.checked && user ? user.nik + ' · ' + user.name : '';
    info.classList.toggle('d-none', !info.textContent);
  }

  sw.checked = !!(record && record.onBehalf);
  input.value = record ? (record.departemen || '') : ownDept();

  btn.addEventListener('click', openLov);
  sw.addEventListener('change', function () {
    /* Like setIsRegisteredVendor: switching clears the pick */
    user = null;
    input.value = sw.checked ? '' : ownDept();
    apply();
  });
  /* Mockup role switcher: a new request follows the new role's department */
  document.addEventListener('holabsys:rolechange', function () {
    if (!record && !sw.checked) input.value = ownDept();
  });
  apply();

  return {
    setLocked: function (value) { locked = value; apply(); },
    isOn: function () { return sw.checked; },
    user: function () { return sw.checked ? user : null; }
  };
}
