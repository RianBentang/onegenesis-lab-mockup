/*
 * ONE-Genesis app shell for static mockups (plain script, works from file://).
 *
 * Renders the same header / sidebar / footer markup as onegenesis-web
 * (components/shared/header, sidebar/MenuRenderer + menuloop, footer), styled by
 * assets/og-theme/onegenesis.css. A page only contains its own content:
 *
 *   <div class="page">
 *     <div class="main-content app-content"><div class="container-fluid"> ... </div></div>
 *   </div>
 *   <script src="../assets/og-shell.js"></script>
 *
 * Also keeps the mockup role switcher: ROLES, findRole(), applyRole(), localStorage
 * 'holabsysRole' and the 'holabsys:rolechange' event that page scripts listen to.
 */
(function () {
  'use strict';

  /* ---------- Paths ---------- */
  var script = document.currentScript;
  var assetsBase = script.src.replace(/og-shell\.js(\?.*)?$/, '');   // .../LAB/assets/
  var rootBase = assetsBase.replace(/assets\/$/, '');                 // .../LAB/

  /* ---------- Menu (edit here to add pages) ---------- */
  // path is relative to the LAB root folder.
  var MENU = [
    { category: 'MAIN MENU' },
    {
      title: 'Home', icon: 'ri-home-4-line', children: [
        { title: 'Dashboard', path: 'index.html' },
        { title: 'Profile', path: 'profile.html' }
      ]
    },
    {
      title: 'HOLABSYS', icon: 'ri-flask-line', children: [
        { title: 'Internal', path: 'HOLABSYS/internalList.html', also: ['HOLABSYS/internalForm.html', 'HOLABSYS/reviewAndSpkForm.html', 'HOLABSYS/LabelingForm.html'] },
        { title: 'External', path: 'HOLABSYS/externalList.html', also: ['HOLABSYS/externalForm.html'] },
        { title: 'Report', path: 'HOLABSYS/reportList.html', also: ['HOLABSYS/reportForm.html'] },
        { title: 'ASLT and Sensory', path: 'HOLABSYS/asltAndSensory.html', also: ['HOLABSYS/asltForm.html', 'HOLABSYS/sensoryForm.html'] },
        { title: 'Schedule', path: 'HOLABSYS/schedule.html' },
        { title: 'Excel', path: 'HOLABSYS/excel.html' }
      ]
    },
    {
      title: 'Master Data', icon: 'ri-database-2-line', children: [
        { title: 'Metode & Scope Uji', path: 'Master-Data/metodeScope.html' },
        { title: 'Tanda Tangan & QR', path: 'Master-Data/digitalSignature.html' },
        { title: 'Matriks Kompetensi', path: 'Master-Data/analisCompetency.html' },
        { title: 'Alat & Kalibrasi', path: 'Master-Data/equipmentCalibration.html' },
        { title: 'Reagen & Stok', path: 'Master-Data/reagenStock.html' },
        { title: 'Log Lingkungan Lab', path: 'Master-Data/accommodationLog.html' },
        { title: 'Vendor Lab Eksternal', path: 'Master-Data/externalVendor.html' },
        { title: 'Master SKU', path: 'Master-Data/masterSku.html' }
      ]
    }
  ];

  /* ---------- Dummy roles (design-only, no backend) ---------- */
  var COMPANY_NAME = 'PT Garudafood Putra Putri Jaya Tbk';
  var ROLES = [
    { code: 'BSU', label: 'Basic User', name: 'Marsya Valentina', dept: 'Quality Assurance', email: 'marsya.valentina@garudafood.com' },
    { code: 'MGU', label: 'Manager User', name: 'Bayu Aditama', dept: 'Quality Assurance', email: 'bayu.aditama@garudafood.com' },
    { code: 'HOL', label: 'Head of Laboratory', name: 'Ratna Sari', dept: 'Laboratorium', email: 'ratna.sari@garudafood.com' },
    { code: 'HOR', label: 'Head of R&D', name: 'Agus Setiawan', dept: 'Research & Development', email: 'agus.setiawan@garudafood.com' },
    { code: 'FRA', label: 'FRA Administrator', name: 'Maya Putri', dept: 'Regulatory Affairs', email: 'maya.putri@garudafood.com' },
    { code: 'ADM', label: 'Lab Administrator', name: 'Bambang Admin', dept: 'Laboratorium', email: 'bambang.admin@garudafood.com' },
    { code: 'CRL', label: 'Koordinator Lab / Penyelia', name: 'Budi Santoso', dept: 'Laboratorium', email: 'budi.santoso@garudafood.com' },
    { code: 'TCM', label: 'Technical Manager', name: 'Siti Rahmawati', dept: 'Laboratorium', email: 'siti.rahmawati@garudafood.com' }
  ];

  function initials(name) {
    return name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function findRole(code) {
    for (var i = 0; i < ROLES.length; i++) if (ROLES[i].code === code) return ROLES[i];
    return ROLES[0];
  }

  function storageGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function storageSet(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* ignore */ } }

  function applyRole(code) {
    var role = findRole(code);
    storageSet('holabsysRole', role.code);
    var av = initials(role.name);
    var setText = function (id, text) { var el = document.getElementById(id); if (el) el.textContent = text; };
    var setValue = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };

    setText('userAvatar', av);
    setText('userName', role.name);
    setText('userRoleLabel', role.label);
    setText('dropdownUserName', role.name);
    setText('dropdownUserRole', role.label + ' · ' + role.dept);
    setText('dropdownCompany', COMPANY_NAME);

    // Profile page fields (only present on profile.html)
    setText('profileAvatar', av);
    setText('profileFullName', role.name);
    setText('profileRoleBadge', role.code + ' · ' + role.label);
    setValue('profileNameInput', role.name);
    setValue('profileEmailInput', role.email);
    setValue('profileDeptInput', role.dept);
    setValue('profileCompanyInput', COMPANY_NAME);
    setValue('profileRoleInput', role.code + ' - ' + role.label);

    document.dispatchEvent(new CustomEvent('holabsys:rolechange', { detail: role }));
  }

  window.COMPANY_NAME = COMPANY_NAME;
  window.ROLES = ROLES;
  window.initials = initials;
  window.findRole = findRole;
  window.applyRole = applyRole;

  /* ---------- <html> attributes (same defaults as onegenesis-web redux initialState) ---------- */
  var html = document.documentElement;
  var theme = storageGet('ogTheme') === 'dark' ? 'dark' : 'light';
  var attrs = {
    'dir': 'ltr',
    'data-nav-layout': 'vertical',
    'data-vertical-style': 'overlay',
    'data-toggled': window.innerWidth < 992 ? 'close' : 'icon-overlay-close',
    'data-menu-styles': 'dark',
    'data-page-style': 'regular',
    'data-width': 'fullwidth',
    'data-menu-position': 'fixed',
    'data-header-position': 'fixed'
  };
  Object.keys(attrs).forEach(function (k) { html.setAttribute(k, attrs[k]); });

  function applyTheme(mode) {
    html.setAttribute('data-theme-mode', mode);
    html.setAttribute('data-bs-theme', mode);
    html.setAttribute('data-header-styles', mode);
    storageSet('ogTheme', mode);
  }
  applyTheme(theme);
  window.applyTheme = applyTheme;

  /* ---------- Markup ---------- */
  var current = location.pathname.replace(/\\/g, '/');
  function isCurrent(path) { return current.slice(-path.length - 1) === '/' + path; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function logos() {
    var b = assetsBase + 'og-theme/brand/';
    return '<img src="' + b + 'desktop-logo.png" alt="logo" class="desktop-logo">' +
      '<img src="' + b + 'toggle-dark.png" alt="logo" class="toggle-dark">' +
      '<img src="' + b + 'desktop-dark.png" alt="logo" class="desktop-dark">' +
      '<img src="' + b + 'toggle-logo.png" alt="logo" class="toggle-logo">' +
      '<img src="' + b + 'toggle-dark.png" alt="logo" class="toggle-white">' +
      '<img src="' + b + 'desktop-dark.png" alt="logo" class="desktop-white">';
  }

  function menuHtml() {
    var out = '<ul class="main-menu">';
    MENU.forEach(function (item) {
      if (item.category) {
        out += '<li class="slide__category"><span class="category-name">' + esc(item.category) + '</span></li>';
        return;
      }
      var anyActive = item.children.some(function (c) {
        return isCurrent(c.path) || (c.also || []).some(isCurrent);
      });
      out += '<li class="slide has-sub' + (anyActive ? ' open active' : '') + '">' +
        '<a href="#!" class="side-menu__item' + (anyActive ? ' active' : '') + '">' +
        '<i class="' + item.icon + ' side-menu__icon"></i>' +
        '<span class="side-menu__label"> ' + esc(item.title) + ' </span>' +
        '<i class="ri-arrow-down-s-line side-menu__angle"></i></a>' +
        '<ul class="slide-menu child1"' + (anyActive ? ' style="display:block"' : '') + '>' +
        '<li class="slide side-menu__label1"><a href="#!">' + esc(item.title) + '</a></li>';
      item.children.forEach(function (c) {
        var active = isCurrent(c.path) || (c.also || []).some(isCurrent);
        out += '<li class="slide' + (active ? ' active' : '') + '">' +
          '<a href="' + rootBase + c.path + '" class="side-menu__item' + (active ? ' active' : '') + '">' +
          '<span> ' + esc(c.title) + ' </span></a></li>';
      });
      out += '</ul></li>';
    });
    return out + '</ul>';
  }

  var ICON_THEME_LIGHT = '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 header-link-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>';
  var ICON_THEME_DARK = '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 header-link-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>';
  var ICON_FULLSCREEN = '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 full-screen-open header-link-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/></svg>';

  var headerHtml =
    '<header class="app-header sticky" id="header"><div class="main-header-container container-fluid">' +
    '<div class="header-content-left">' +
    '<div class="header-element"><div class="horizontal-logo"><a href="' + rootBase + 'index.html" class="header-logo">' + logos() + '</a></div></div>' +
    '<div class="header-element mx-lg-0 mx-2 p-2" style="cursor:pointer" id="ogSidebarToggle">' +
    '<a aria-label="Hide Sidebar" class="sidemenu-toggle header-link animated-arrow hor-toggle horizontal-navtoggle" href="#!"><span></span></a></div>' +
    '</div>' +
    '<ul class="header-content-right">' +
    // Mockup-only: switch the dummy role to preview role-based states. Not in the real app.
    '<li class="header-element d-flex align-items-center me-2" title="Mockup role (not in the real app)">' +
    '<select id="roleSelect" class="form-select form-select-sm" style="width:220px"></select></li>' +
    '<li class="header-element header-theme-mode"><a href="#!" class="header-link layout-setting" id="themeToggle">' +
    '<span class="light-layout">' + ICON_THEME_LIGHT + '</span><span class="dark-layout">' + ICON_THEME_DARK + '</span></a></li>' +
    '<li class="header-element header-fullscreen"><a href="#!" class="header-link" id="fullscreenToggle">' + ICON_FULLSCREEN + '</a></li>' +
    '<li class="header-element dropdown">' +
    '<a href="#!" class="header-link dropdown-toggle no-caret" id="mainHeaderProfile" data-bs-toggle="dropdown" aria-expanded="false">' +
    '<span class="d-flex align-items-center avatar avatar-sm avatar-rounded bg-primary text-fixed-white fs-11" id="userAvatar">MV</span></a>' +
    '<ul class="main-header-dropdown dropdown-menu pt-0 overflow-hidden header-profile-dropdown dropdown-menu-end" aria-labelledby="mainHeaderProfile">' +
    '<li class="dropdown-item text-center border-bottom"><div>' +
    '<span class="fs-12 text-dark" id="dropdownUserName">Marsya Valentina</span>' +
    '<span class="d-block fs-11 text-muted" id="dropdownUserRole">Basic User</span>' +
    '<span class="d-block fs-11 text-muted" id="dropdownCompany">' + COMPANY_NAME + '</span></div></li>' +
    '<li><a class="dropdown-item d-flex align-items-center fs-11" href="' + rootBase + 'profile.html"><i class="fe fe-user p-1 rounded-circle bg-primary-transparent me-2 fs-11"></i>Profile</a></li>' +
    '<li><a class="dropdown-item d-flex align-items-center fs-11" href="#!"><i class="bi bi-key p-1 rounded-circle bg-primary-transparent me-2 fs-11"></i>Change Password</a></li>' +
    '<li><a class="dropdown-item d-flex align-items-center fs-11" href="#!"><i class="fe fe-lock p-1 rounded-circle bg-primary-transparent me-2 fs-11"></i>Log Out</a></li>' +
    '</ul></li>' +
    '</ul></div></header>';

  var sidebarHtml =
    '<div id="responsive-overlay"></div>' +
    '<aside class="app-sidebar sticky" id="sidebar">' +
    '<div class="main-sidebar-header"><a href="' + rootBase + 'index.html" class="header-logo">' + logos() + '</a></div>' +
    '<div class="main-sidebar" id="sidebar-scroll"><nav class="main-menu-container nav nav-pills flex-column sub-open">' +
    menuHtml() + '</nav></div></aside>';

  var footerHtml =
    '<footer class="footer mt-auto py-3 bg-white text-center"><div class="container"><span class="text-muted"> Copyright © <span>' +
    new Date().getFullYear() + '</span> <span class="text-dark fw-medium">Garudafood</span>. Developed by ' +
    '<span class="fw-medium text-primary">Bentang</span> All rights reserved</span></div></footer>';

  /* ---------- Mount ---------- */
  var page = document.querySelector('.page');
  if (!page) {
    console.error('[og-shell] Missing <div class="page"> wrapper.');
    return;
  }
  page.insertAdjacentHTML('afterbegin', headerHtml + sidebarHtml);
  page.insertAdjacentHTML('beforeend', footerHtml);

  /* ---------- Behavior ---------- */
  function isOverlayClosed() {
    var t = html.getAttribute('data-toggled');
    return t === 'icon-overlay-close';
  }

  var sidebar = document.getElementById('sidebar');
  sidebar.addEventListener('mouseover', function () {
    if (isOverlayClosed()) html.setAttribute('data-icon-overlay', 'open');
  });
  sidebar.addEventListener('mouseleave', function () {
    if (isOverlayClosed()) html.removeAttribute('data-icon-overlay');
  });

  document.getElementById('ogSidebarToggle').addEventListener('click', function (e) {
    e.preventDefault();
    var t = html.getAttribute('data-toggled');
    if (window.innerWidth < 992) {
      html.setAttribute('data-toggled', t === 'open' ? 'close' : 'open');
    } else {
      html.setAttribute('data-toggled', t === 'icon-overlay-close' ? '' : 'icon-overlay-close');
      html.removeAttribute('data-icon-overlay');
    }
  });

  document.getElementById('responsive-overlay').addEventListener('click', function () {
    if (window.innerWidth < 992) html.setAttribute('data-toggled', 'close');
  });

  // Submenu expand / collapse
  Array.prototype.forEach.call(sidebar.querySelectorAll('.slide.has-sub > .side-menu__item'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var li = a.parentElement;
      var ul = li.querySelector('.slide-menu');
      var open = li.classList.toggle('open');
      if (ul) ul.style.display = open ? 'block' : 'none';
    });
  });

  document.getElementById('themeToggle').addEventListener('click', function (e) {
    e.preventDefault();
    applyTheme(html.getAttribute('data-theme-mode') === 'dark' ? 'light' : 'dark');
  });

  document.getElementById('fullscreenToggle').addEventListener('click', function (e) {
    e.preventDefault();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  window.addEventListener('scroll', function () {
    sidebar.classList.toggle('sticky-pin', window.scrollY > 30);
  });

  // Role switcher
  var roleSelectEl = document.getElementById('roleSelect');
  ROLES.forEach(function (role) {
    var opt = document.createElement('option');
    opt.value = role.code;
    opt.textContent = role.code + ' — ' + role.label;
    roleSelectEl.appendChild(opt);
  });
  var savedRole = storageGet('holabsysRole') || ROLES[0].code;
  roleSelectEl.value = savedRole;
  roleSelectEl.addEventListener('change', function () { applyRole(this.value); });

  // Fires the first 'holabsys:rolechange' on DOMContentLoaded. This listener is registered
  // before the page scripts' own DOMContentLoaded handlers, so pages must also read the initial
  // role from localStorage.holabsysRole (same order as the legacy app.js).
  document.addEventListener('DOMContentLoaded', function () { applyRole(savedRole); });
})();
