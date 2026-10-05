/*
 * PANELIS app shell (plain script, works from file://). Panelists are not LAB users, so there is
 * no LAB sidebar / header here: this only sets the same <html> theme attributes as og-shell.js
 * (shared 'ogTheme' setting) and provides login + toast helpers for the login and booth pages.
 * Data (panelists, sessions, scores) comes from ../LAB/assets/dummy-panel.js.
 */
(function () {
  'use strict';

  function storageGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storageSet(key, v) { try { if (v === null) localStorage.removeItem(key); else localStorage.setItem(key, v); } catch (e) { /* ignore */ } }

  /* ---------- <html> theme attributes ---------- */
  var html = document.documentElement;
  html.setAttribute('dir', 'ltr');
  html.setAttribute('data-page-style', 'regular');
  html.setAttribute('data-width', 'fullwidth');
  function applyTheme(mode) {
    html.setAttribute('data-theme-mode', mode);
    html.setAttribute('data-bs-theme', mode);
    html.setAttribute('data-header-styles', mode);
    html.setAttribute('data-menu-styles', mode);
    storageSet('ogTheme', mode);
  }
  applyTheme(storageGet('ogTheme') === 'dark' ? 'dark' : 'light');
  window.panelisToggleTheme = function () {
    applyTheme(html.getAttribute('data-theme-mode') === 'dark' ? 'light' : 'dark');
  };

  /* ---------- device booth ----------
     The booth is fixed per tablet (tablet 1-5 = booth 1-5), it is not picked at login. The real
     web app gets it from the device setup; the mockup simulates a tablet with ?booth=1..5 in the
     URL, remembered in localStorage. */
  var BOOTH_COUNT = 5;
  window.panelisDeviceBooth = function () {
    var m = /[?&]booth=(\d+)/.exec(location.search);
    var n = m ? Number(m[1]) : Number(storageGet('holabsysPanelDeviceBooth'));
    if (!(n >= 1 && n <= BOOTH_COUNT)) n = 1;
    storageSet('holabsysPanelDeviceBooth', String(n));
    return n;
  };

  /* ---------- login state: { panelistId, booth } ---------- */
  window.panelisLogin = function (panelistId, booth) {
    storageSet(PANEL_LOGIN_KEY, JSON.stringify({ panelistId: panelistId, booth: booth, at: new Date().toISOString() }));
  };
  window.panelisLogout = function () { storageSet(PANEL_LOGIN_KEY, null); };
  window.panelisCurrent = function () {
    try {
      var s = JSON.parse(storageGet(PANEL_LOGIN_KEY) || 'null');
      var p = s && panelFindPanelis(s.panelistId);
      return p ? { panelist: p, booth: s.booth } : null;
    } catch (e) { return null; }
  };

  /* ---------- toast ---------- */
  window.panelisToast = function (message, variant) {
    var container = document.getElementById('appToastContainer');
    if (!container) { alert(message); return; }
    var el = document.createElement('div');
    el.className = 'toast align-items-center text-white border-0 ' + (variant === 'danger' ? 'bg-danger' : 'bg-dark');
    el.setAttribute('role', 'alert');
    el.innerHTML = '<div class="d-flex"><div class="toast-body">' + message + '</div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
    container.appendChild(el);
    var t = new window.bootstrap.Toast(el, { delay: 3500 });
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
    t.show();
  };
})();
