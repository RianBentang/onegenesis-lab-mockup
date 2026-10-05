/* ---------- PANELIS login: NIK only (booth comes from the tablet) → HRIS lookup shows the username → booth screen ---------- */
document.addEventListener('DOMContentLoaded', function () {
  /* Already logged in → straight to the booth */
  if (panelisCurrent()) { window.location.href = 'booth.html'; return; }

  var form = document.getElementById('loginForm');
  var nikInput = document.getElementById('loginNik');
  var feedback = document.getElementById('loginNikFeedback');
  var checking = document.getElementById('loginNikChecking');
  var result = document.getElementById('hrisResult');
  var submit = document.getElementById('loginSubmit');
  var timer = null;
  var found = null; // panelist record when the NIK is in HRIS and registered as panelist
  var booth = panelisDeviceBooth();
  document.getElementById('deviceBooth').textContent = 'Booth ' + String(booth).padStart(2, '0');

  function setState(state, message) {
    nikInput.classList.toggle('is-invalid', state === 'invalid');
    nikInput.classList.toggle('is-valid', state === 'valid');
    feedback.textContent = message || '';
    checking.classList.toggle('d-none', state !== 'checking');
  }

  function showEmployee(k, isPanelist) {
    document.getElementById('hrisAvatar').textContent = k.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    document.getElementById('hrisName').textContent = k.name;
    document.getElementById('hrisUsername').textContent = '@' + k.username;
    document.getElementById('hrisDept').textContent = k.position + ' · ' + k.dept;
    var badge = document.getElementById('hrisBadge');
    badge.className = 'badge ' + (isPanelist ? 'bg-success-transparent' : 'bg-warning-transparent');
    badge.innerHTML = isPanelist ? '<i class="ri-checkbox-circle-line me-1"></i>Panelis' : '<i class="ri-error-warning-line me-1"></i>Bukan panelis';
    result.classList.remove('d-none');
  }

  function lookup() {
    var nik = nikInput.value.trim();
    found = null;
    submit.disabled = true;
    result.classList.add('d-none');
    if (!nik) { setState(''); return; }
    setState('checking');
    clearTimeout(timer);
    // Fake HRIS round trip so the "checking" state is visible in the mockup.
    timer = setTimeout(function () {
      var k = hrisFindByNik(nik);
      if (!k) { setState('invalid', 'NIK tidak ditemukan di HRIS.'); return; }
      var p = MASTER_PANELIS.filter(function (x) { return x.nik === k.nik; })[0] || null;
      showEmployee(k, !!p);
      if (!p) { setState('invalid', 'NIK terdaftar di HRIS, tetapi belum terdaftar sebagai panelis.'); return; }
      setState('valid');
      found = p;
      submit.disabled = false;
    }, 400);
  }

  nikInput.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
    clearTimeout(timer);
    found = null;
    submit.disabled = true;
    timer = setTimeout(lookup, 300);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!found) { if (!nikInput.value.trim()) setState('invalid', 'NIK wajib diisi.'); return; }
    panelisLogin(found.id, booth);
    window.location.href = 'booth.html';
  });
});
