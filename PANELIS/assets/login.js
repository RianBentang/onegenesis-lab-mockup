/* ---------- PANELIS login: NIK only (booth comes from the tablet) ----------
   The NIK is looked up in HRIS, or among the non-HRIS panelists (interns, by NIK magang) that the
   lab registered in Schedule. Login is allowed only while one of this person's panel sessions is
   running (Schedule start–end). */
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
  var found = null; // person, when they have a running session
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

  function showPerson(person, badge) {
    document.getElementById('hrisAvatar').textContent = person.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    document.getElementById('hrisName').textContent = person.name;
    document.getElementById('hrisUsername').textContent = person.username ? '@' + person.username : 'Panelis non-HRIS';
    document.getElementById('hrisDept').textContent = person.info;
    var el = document.getElementById('hrisBadge');
    el.className = 'badge ' + badge.cls;
    el.innerHTML = badge.html;
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
      var person = panelFindPerson(nik);
      if (!person) { setState('invalid', 'NIK tidak ditemukan di HRIS maupun di daftar panelis non-HRIS.'); return; }
      var sessions = panelSessionsForNik(person.nik);
      var running = sessions.filter(function (s) { return s.status === 'Berlangsung'; });
      var next = sessions.filter(function (s) { return s.status === 'Terjadwal'; })[0];
      var srcBadge = person.source === 'HRIS' ? 'HRIS' : 'Non-HRIS';
      if (running.length) {
        showPerson(person, { cls: 'bg-success-transparent', html: '<i class="ri-checkbox-circle-line me-1"></i>' + srcBadge + ' · ' + running.length + ' sesi berjalan' });
        setState('valid');
        found = person;
        submit.disabled = false;
        return;
      }
      showPerson(person, { cls: 'bg-warning-transparent', html: '<i class="ri-time-line me-1"></i>' + srcBadge });
      if (next) setState('invalid', 'Belum ada sesi panel yang berjalan untuk NIK ini. Sesi berikutnya: ' + fmt(next.start) + '.');
      else if (sessions.length) setState('invalid', 'Tidak ada sesi panel yang berjalan untuk NIK ini saat ini.');
      else setState('invalid', 'NIK ini belum didaftarkan sebagai panelis di sesi mana pun (diatur lab di Schedule).');
    }, 400);
  }

  nikInput.addEventListener('input', function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    clearTimeout(timer);
    found = null;
    submit.disabled = true;
    timer = setTimeout(lookup, 300);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!found) { if (!nikInput.value.trim()) setState('invalid', 'NIK wajib diisi.'); return; }
    panelisLogin(found, booth);
    window.location.href = 'booth.html';
  });
});
