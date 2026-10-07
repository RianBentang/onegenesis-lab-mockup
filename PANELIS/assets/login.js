/* ---------- PANELIS login: NIK only (booth comes from the tablet) ----------
   Panelists are not registered: anyone can log in while a panel session runs. The NIK is looked
   up in HRIS; a NIK that is not there (e.g. an intern's NIK magang) logs in as non-HRIS with a
   name. Login needs at least one session this person can still score (running, not scored by
   them yet, ASLT quota not full). */
document.addEventListener('DOMContentLoaded', function () {
  /* Already logged in → straight to the booth */
  if (panelisCurrent()) { window.location.href = 'booth.html'; return; }

  var form = document.getElementById('loginForm');
  var nikInput = document.getElementById('loginNik');
  var namaInput = document.getElementById('loginNama');
  var nonHrisWrap = document.getElementById('nonHrisWrap');
  var feedback = document.getElementById('loginNikFeedback');
  var checking = document.getElementById('loginNikChecking');
  var result = document.getElementById('hrisResult');
  var submit = document.getElementById('loginSubmit');
  var timer = null;
  var person = null;   // HRIS person, or { nik, source: 'Non-HRIS' } waiting for a name
  var canEnter = false; // there is a session this NIK can score now
  var booth = panelisDeviceBooth();
  document.getElementById('deviceBooth').textContent = 'Booth ' + String(booth).padStart(2, '0');

  function setState(state, message) {
    nikInput.classList.toggle('is-invalid', state === 'invalid');
    nikInput.classList.toggle('is-valid', state === 'valid');
    feedback.textContent = message || '';
    checking.classList.toggle('d-none', state !== 'checking');
  }

  function fmt(iso) {
    return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' }) + ' ' + iso.slice(11, 16);
  }

  function showPerson(p, open) {
    document.getElementById('hrisAvatar').textContent = p.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    document.getElementById('hrisName').textContent = p.name;
    document.getElementById('hrisUsername').textContent = '@' + p.username;
    document.getElementById('hrisDept').textContent = p.info;
    var el = document.getElementById('hrisBadge');
    el.className = 'badge mt-1 ' + (open ? 'bg-success-transparent' : 'bg-warning-transparent');
    el.innerHTML = open ? '<i class="ri-checkbox-circle-line me-1"></i>HRIS · ' + open + ' sesi bisa dinilai' : 'HRIS';
    result.classList.remove('d-none');
  }

  function updateSubmit() {
    var nameOk = person && (person.source === 'HRIS' || namaInput.value.trim().length >= 3);
    submit.disabled = !(canEnter && nameOk);
  }

  function lookup() {
    var nik = nikInput.value.trim();
    person = null;
    canEnter = false;
    result.classList.add('d-none');
    nonHrisWrap.classList.add('d-none');
    updateSubmit();
    if (!nik) { setState(''); return; }
    setState('checking');
    clearTimeout(timer);
    // Fake HRIS round trip so the "checking" state is visible in the mockup.
    timer = setTimeout(function () {
      var open = panelOpenSessionsFor(nik);
      var hris = panelFindPerson(nik);
      person = hris || { nik: nik, source: 'Non-HRIS' };
      canEnter = open.length > 0;
      if (hris) showPerson(hris, open.length);
      else nonHrisWrap.classList.remove('d-none');

      if (canEnter) {
        setState('valid', '');
      } else {
        var running = panelSessions().filter(function (s) { return s.status === 'Berlangsung'; });
        var next = panelNextSession();
        setState('invalid', running.length
          ? 'Semua sesi yang berjalan sudah Anda nilai atau kuota panelisnya penuh.'
          : 'Belum ada sesi panel yang berjalan.' + (next ? ' Sesi berikutnya: ' + fmt(next.start) + '.' : ''));
      }
      updateSubmit();
    }, 400);
  }

  nikInput.addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    clearTimeout(timer);
    person = null;
    canEnter = false;
    updateSubmit();
    timer = setTimeout(lookup, 300);
  });
  namaInput.addEventListener('input', updateSubmit);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!person) { if (!nikInput.value.trim()) setState('invalid', 'NIK wajib diisi.'); return; }
    if (submit.disabled) return;
    var who = person.source === 'HRIS' ? person
      : { nik: person.nik, name: namaInput.value.trim(), source: 'Non-HRIS', username: null, info: 'Panelis non-HRIS' };
    panelisLogin(who, booth);
    window.location.href = 'booth.html';
  });
});
