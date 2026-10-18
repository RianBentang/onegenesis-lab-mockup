/* ---------- Document Journey (port of DevelopmentJourneySidebar, onegenesis-web New Material Registration) ----------
   Left sidebar of a request form and of its Re-test / Revision documents: the chain
   Request → RT- / RV- … (linked by refDocId), one card per document with its status; the document
   being viewed is blue, Closed ones green, open ones purple, Rejected ones red. A type the current role may start
   (canAmend) shows as a "Not yet" card that opens a new document. Collapsible to a narrow rail.
   DocJourney.render(sidebarEl, mainEl, { source, request, currentId, newType })
   - sidebarEl / mainEl: the two columns of the page row (col classes are set here)
   - currentId: id of the document on screen (request or RT- / RV-); newType: type being created
   Shown only once the request has a certificate or a document; otherwise the form stays full width.
   Needs dummy-requests.js. */
var DOC_JOURNEY_COLLAPSE_KEY = 'holabsysJourneyCollapsed';

var DocJourney = (function () {
  function collapsed() {
    try { return localStorage.getItem(DOC_JOURNEY_COLLAPSE_KEY) === '1'; } catch (e) { return false; }
  }
  function setCollapsed(on) {
    try { localStorage.setItem(DOC_JOURNEY_COLLAPSE_KEY, on ? '1' : '0'); } catch (e) { /* per-viewer convenience only */ }
  }

  /* [{ id, label, desc, icon, href, state: 'active' | 'done' | 'started' | 'todo', badge }] */
  function items(o) {
    var r = o.request;
    var role = currentRole();
    var first = (r.reportHistory || [])[0] || lastIssuedReport(r);
    var reqStatus = getDocStatus(r).status;
    var list = [{
      id: r.id, label: 'Request', icon: 'ri-file-list-3-line',
      desc: first ? 'Certificate ' + first.no : 'Certificate not issued yet',
      href: REPORT_FORM_PAGE[o.source] + '?docId=' + encodeURIComponent(r.id),
      state: o.currentId === r.id ? 'active' : (first ? 'done' : 'started'),
      badge: spkStatusPill(DOC_STATUS[reqStatus].list, DOC_STATUS[reqStatus].icon, reqStatus)
    }];
    amendmentsOf(r.id).forEach(function (a) {
      var s = getAmendmentStatus(a).status;
      list.push({
        id: a.id, label: a.type, icon: AMENDMENT_TYPES[a.type].icon,
        desc: a.step === 'Closed' ? 'Certificate ' + a.issuedNo : 'Replaces ' + a.refReportNo,
        href: amendmentHref(a.id),
        state: o.currentId === a.id ? 'active' : (a.step === 'Closed' ? 'done' : a.step === 'Rejected' ? 'rejected' : 'started'),
        badge: spkStatusPill(DOC_STATUS[s].list, DOC_STATUS[s].icon, s)
      });
    });
    /* The document being created, then what this role may still start */
    if (o.newType) {
      list.push({ id: null, label: o.newType, icon: AMENDMENT_TYPES[o.newType].icon, desc: 'Document not yet created', href: null, state: 'active', badge: notYet() });
    } else {
      Object.keys(AMENDMENT_TYPES).forEach(function (type) {
        if (!canAmend(type, o.source, r, role)) return;
        list.push({
          id: null, label: type, icon: AMENDMENT_TYPES[type].icon, desc: 'Create a new ' + type.toLowerCase() + ' document',
          href: AMENDMENT_FORM_PAGE + '?ref=' + encodeURIComponent(r.id) + '&src=' + o.source + '&type=' + AMENDMENT_TYPES[type].key,
          state: 'todo', badge: notYet()
        });
      });
    }
    return list;
  }
  function notYet() {
    return '<span class="badge bg-light text-muted rounded-pill fw-semibold px-2 py-1">Not Yet</span>';
  }

  var CIRCLE = { active: 'bg-primary text-white doc-journey-dot-active', done: 'bg-success text-white', started: 'bg-purple text-white', rejected: 'bg-danger text-white', todo: 'border border-2 border-secondary text-secondary doc-journey-dot-todo' };
  var CARD = { active: 'bg-primary-transparent border border-primary', done: 'bg-success-transparent border border-success', started: 'bg-purple-transparent border border-purple', rejected: 'bg-danger-transparent border border-danger', todo: 'border' };

  function dot(it) {
    return '<span class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 doc-journey-dot ' + CIRCLE[it.state] + '"><i class="' + it.icon + ' fs-5"></i></span>';
  }
  function link(it, inner, cls, title) {
    return it.href && it.state !== 'active'
      ? '<a href="' + it.href + '" class="' + cls + ' text-reset text-decoration-none"' + (title ? ' title="' + title + '"' : '') + '>' + inner + '</a>'
      : '<div class="' + cls + '"' + (title ? ' title="' + title + '"' : '') + '>' + inner + '</div>';
  }

  function expandedHtml(list) {
    return '<div class="card custom-card"><div class="card-body">' +
      /* SpkFormSection: Document Journey + collapse button */
      '<div class="d-flex align-items-center justify-content-between mb-3">' +
        '<h6 class="fw-semibold mb-0"><i class="ri-git-commit-line me-1"></i>Document Journey</h6>' +
        '<button type="button" class="btn btn-sm btn-icon btn-light rounded-circle text-muted shadow-none border" data-journey-toggle title="Collapse Document Journey"><i class="ri-arrow-left-s-line fs-16"></i></button>' +
      '</div>' +
      '<div class="d-flex flex-column px-2">' +
      list.map(function (it, i) {
        var last = i === list.length - 1;
        return '<div class="position-relative">' +
          (last ? '' : '<span class="doc-journey-line doc-journey-line-' + it.state + '"></span>') +
          link(it,
            '<div class="me-3 doc-journey-rail">' + dot(it) + '</div>' +
            '<div class="flex-grow-1 min-w-0"><div class="card custom-card shadow-none mb-0 ' + CARD[it.state] + '"><div class="card-body p-3">' +
              '<div class="d-flex flex-wrap justify-content-between align-items-start gap-1 mb-1"><h6 class="fw-bold mb-0 me-1">' + it.label + '</h6><span class="ms-auto">' + it.badge + '</span></div>' +
              '<div class="text-muted fs-13 mb-2">' + it.desc + '</div>' +
              (it.id ? '<div class="fw-bold fs-13 font-monospace">' + it.id + '</div>' : '<div class="fs-12 text-muted fst-italic">' + (it.state === 'todo' ? 'Click to create' : 'Document not yet created') + '</div>') +
            '</div></div></div>',
            'd-flex position-relative doc-journey-item' + (last ? '' : ' pb-4')) +
          '</div>';
      }).join('') +
      '</div></div></div>';
  }

  function collapsedHtml(list) {
    return '<div class="card custom-card"><div class="card-body px-2">' +
      '<div class="d-flex justify-content-center mb-3"><button type="button" class="btn btn-sm btn-icon btn-light rounded-circle text-muted shadow-none border" data-journey-toggle title="Expand Document Journey"><i class="ri-arrow-right-s-line fs-16"></i></button></div>' +
      '<div class="d-flex flex-column align-items-center gap-3">' +
      list.map(function (it) { return link(it, dot(it), 'd-flex', it.label + (it.id ? ' · ' + it.id : ' · not yet created')); }).join('') +
      '</div></div></div>';
  }

  function render(sidebarEl, mainEl, o) {
    var r = o.request;
    var show = !!r && (!!lastIssuedReport(r) || amendmentsOf(r.id).length > 0 || !!o.newType);
    sidebarEl.classList.toggle('d-none', !show);
    if (!show) {
      mainEl.className = 'col-12';
      return;
    }
    var list = items(o);
    var small = collapsed();
    sidebarEl.className = small ? 'col-auto doc-journey-collapsed' : 'col-xl-4 col-lg-4 col-md-12';
    mainEl.className = small ? 'col min-w-0' : 'col-xl-8 col-lg-8 col-md-12';
    sidebarEl.innerHTML = small ? collapsedHtml(list) : expandedHtml(list);
    sidebarEl.querySelector('[data-journey-toggle]').onclick = function () {
      setCollapsed(!small);
      render(sidebarEl, mainEl, o);
    };
  }

  return { render: render };
})();
