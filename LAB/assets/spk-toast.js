/* ---------- SpkToast + form check (onegenesis-web AppToast / ToastService) ----------
   Shared by LAB (og-shell pages) and PANELIS; load after the bootstrap bundle, before page scripts.
   One toast at a time, top center. Success / info hide themselves; warning / error stay until
   closed (as in the app). ToastService.showSuccess / showWarning / showError / showInfo / hide.
   validateForm(form) → false + warning toast naming the first invalid field. */
(function () {
  var TOAST_TYPES = {
    success: { title: 'Success!', bg: 'bg-success', icon: 'bi bi-check-circle', delay: 15000 },
    warning: { title: 'Warning!', bg: 'bg-warning', icon: 'bi bi-exclamation-triangle' },
    error: { title: 'Error!', bg: 'bg-danger', icon: 'bi bi-exclamation-triangle' },
    info: { title: 'Info!', bg: 'bg-primary', icon: 'bi bi-info-circle', delay: 5000 }
  };
  /* The app's toast lives in the SPA layout, so it survives a route change. Here every page is a
     new document: the open toast is kept in sessionStorage and shown again on the next page with
     the time it has left, until it hides itself or is closed. */
  var TOAST_KEY = 'ogToast';
  function storeToast(value) {
    try {
      if (value) sessionStorage.setItem(TOAST_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(TOAST_KEY);
    } catch (e) { /* storage blocked: the toast just stays on this page */ }
  }

  function showToast(message, type, until) {
    storeToast(null);
    var container = document.getElementById('ogToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ogToastContainer';
      container.className = 'toast-container position-fixed top-0 start-50 translate-middle-x p-3 no-print';
      container.style.zIndex = '1060';
      document.body.appendChild(container);
    }
    container.innerHTML = '';
    if (!message) return;
    var t = TOAST_TYPES[type] || TOAST_TYPES.info;
    var el = document.createElement('div');
    el.className = 'toast ' + t.bg + ' text-fixed-white colored-toast';
    el.setAttribute('role', type === 'success' || type === 'info' ? 'status' : 'alert');
    el.innerHTML =
      '<div class="toast-header ' + t.bg + ' text-fixed-white border-bottom-0">' +
      '<strong class="me-auto"><i class="' + t.icon + ' me-2"></i>' + t.title + '</strong>' +
      '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div>' +
      '<div class="toast-body w-100">' + message + '</div>';
    container.appendChild(el);
    if (t.delay && !until) until = Date.now() + t.delay;
    var toast = new bootstrap.Toast(el, { autohide: !!until, delay: until ? Math.max(until - Date.now(), 0) : 5000 });
    el.addEventListener('hidden.bs.toast', function () { el.remove(); storeToast(null); });
    toast.show();
    storeToast({ message: message, type: type, until: until || null });
  }

  /* Toast carried over from the previous page */
  try {
    var carried = JSON.parse(sessionStorage.getItem(TOAST_KEY) || 'null');
    if (carried && (!carried.until || carried.until > Date.now())) showToast(carried.message, carried.type, carried.until);
    else storeToast(null);
  } catch (e) { /* ignore */ }
  window.ToastService = {
    showSuccess: function (m) { showToast(m, 'success'); },
    showWarning: function (m) { showToast(m, 'warning'); },
    showError: function (m) { showToast(m, 'error'); },
    showInfo: function (m) { showToast(m, 'info'); },
    hide: function () { showToast(''); }
  };

  /* Form check before an action: on the first invalid field shows a warning toast naming it
     ("<Label> wajib diisi.") and focuses it; returns true when the form is valid. */
  function validateForm(form) {
    if (!form || form.checkValidity()) return true;
    var field = form.querySelector('input:invalid, select:invalid, textarea:invalid');
    var label = field && field.id ? form.querySelector('label[for="' + field.id + '"]') : null;
    if (!label && field) {
      var col = field.closest('[class*="col-"], .mb-3');
      label = col ? col.querySelector('.form-label') : null;
    }
    var name = label ? label.textContent.replace(/\*/g, '').trim() : 'Field';
    ToastService.showWarning(name + (field && !field.validity.valueMissing ? ' is invalid.' : ' is required.'));
    if (field) {
      var s2 = field.nextElementSibling && field.nextElementSibling.classList.contains('select2')
        ? field.nextElementSibling.querySelector('.select2-selection') : null;
      var target = s2 || field;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus({ preventScroll: true });
    }
    return false;
  }
  window.validateForm = validateForm;
})();
