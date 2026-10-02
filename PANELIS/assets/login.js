/* ---------- PANELIS login: username + PIN → booth screen ---------- */
document.addEventListener('DOMContentLoaded', function () {
  /* Already logged in → straight to the booth */
  if (panelisCurrent()) { window.location.href = 'booth.html'; return; }

  var form = document.getElementById('loginForm');
  var pin = document.getElementById('loginPin');
  var errorBox = document.getElementById('loginError');

  document.getElementById('togglePin').addEventListener('click', function () {
    var show = pin.type === 'password';
    pin.type = show ? 'text' : 'password';
    this.innerHTML = '<i class="' + (show ? 'ri-eye-line' : 'ri-eye-off-line') + ' align-middle"></i>';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var username = document.getElementById('loginUsername').value.trim().toLowerCase();
    var p = MASTER_PANELIS.filter(function (x) { return x.username === username && x.pin === pin.value.trim(); })[0];
    if (!p) { errorBox.classList.remove('d-none'); return; }
    errorBox.classList.add('d-none');
    var booth = Number(document.getElementById('loginBooth').value) || p.booth;
    panelisLogin(p.id, booth);
    window.location.href = 'booth.html';
  });
});
