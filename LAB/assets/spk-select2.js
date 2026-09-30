/* ---------- SpkSelect2 — every dropdown in the mockups renders through select2 ----------
   The app renders every dropdown with the SpkSelect2 component (select2, default theme, styled
   by onegenesis.css). This file makes every <select> on a page do the same, so page markup stays
   a plain <select class="form-select"> (port 1:1 to <SpkSelect2 />) and page scripts don't need
   to initialise anything.

   Load it after jQuery + select2 and before og-shell.js / page scripts.

   - Auto-initialises every <select> on DOMContentLoaded and any <select> added later
     (table cells, modals, the shell's role switcher). Opt out with data-native (single-selects should not).
   - Options follow SpkSelect2: width 100% (the theme forces it; size a select with a wrapper
     <div style="width:…">, never on the <select>), placeholder = the
     first empty <option>, allowClear when the field is optional, dropdownParent = the enclosing
     modal / offcanvas so search works inside Bootstrap modals.
   - <select multiple> is left alone: multi-selects stay on TomSelect.
   - Selecting a value dispatches a real DOM `change` event, so plain addEventListener('change')
     handlers work as well as jQuery .on('change') ones.
   - Setting el.value / el.selectedIndex, replacing the <option>s, or form.reset() from page code
     refreshes the select2 display automatically. */

(function () {
  if (!window.jQuery || !window.jQuery.fn.select2) return;
  var $ = window.jQuery;

  /* select2 fires `change` with jQuery.trigger, which skips native listeners. For select2
     elements turn an un-namespaced `change` into a real DOM event: jQuery and native handlers
     both get it exactly once. Namespaced triggers (`change.select2`) stay jQuery-only. */
  var prevSpecial = $.event.special.change || {};
  $.event.special.change = $.extend({}, prevSpecial, {
    trigger: function (event) {
      if (this.nodeName === 'SELECT' && $(this).data('select2') && event && !event.namespace) {
        this.dispatchEvent(new Event('change', { bubbles: true }));
        return false;
      }
      return prevSpecial.trigger ? prevSpecial.trigger.apply(this, arguments) : undefined;
    }
  });

  var valueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  var indexDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'selectedIndex');

  function refresh(el) {
    if ($(el).data('select2')) $(el).trigger('change.select2');
  }

  /* Programmatic value changes don't fire events; mirror them into the select2 display. */
  function watchValue(el) {
    if (el._spkWatched) return;
    el._spkWatched = true;
    Object.defineProperty(el, 'value', {
      configurable: true,
      get: function () { return valueDesc.get.call(this); },
      set: function (v) { valueDesc.set.call(this, v); refresh(this); }
    });
    Object.defineProperty(el, 'selectedIndex', {
      configurable: true,
      get: function () { return indexDesc.get.call(this); },
      set: function (v) { indexDesc.set.call(this, v); refresh(this); }
    });
    new MutationObserver(function () { refresh(el); }).observe(el, { childList: true });
  }

  function defaultOptions(el) {
    var first = el.options[0];
    var placeholder = (first && first.value === '') ? first.textContent : undefined;
    var parent = el.closest('.modal, .offcanvas');
    return {
      width: '100%',
      placeholder: placeholder,
      allowClear: !!placeholder && !el.required,
      dropdownParent: parent ? $(parent) : undefined
    };
  }

  /* spkSelect2(el, options?) — (re)initialise one select like <SpkSelect2 />. Page scripts only
     call this when they need non-default options. */
  window.spkSelect2 = function (el, options) {
    if (!el || el.nodeName !== 'SELECT' || el.multiple || el.hasAttribute('data-native')) return;
    var opts = $.extend(defaultOptions(el), options || {});
    if (opts.dropdownParent === undefined) delete opts.dropdownParent;
    if ($(el).data('select2')) $(el).select2('destroy');
    $(el).select2(opts);
    watchValue(el);
  };

  window.spkSelect2All = function (root) {
    $(root || document).find('select').each(function () {
      if (this.multiple || this.hasAttribute('data-native')) return;
      if ($(this).data('select2')) watchValue(this);
      else window.spkSelect2(this);
    });
  };

  /* Runs after the page scripts' DOMContentLoaded handlers have filled the <option>s, so the
     placeholder is read from the real first option. */
  document.addEventListener('DOMContentLoaded', function () { setTimeout(start); });

  function start() {
    window.spkSelect2All(document);

    /* Selects rendered later (innerHTML table rows, shell header, modals built in JS) */
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1 || n.closest('.select2-container')) return;
          if (n.nodeName === 'SELECT') { if (!$(n).data('select2')) window.spkSelect2(n); }
          else window.spkSelect2All(n);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });

    /* form.reset() restores values without events */
    document.addEventListener('reset', function (e) {
      setTimeout(function () { $(e.target).find('select').each(function () { refresh(this); }); });
    }, true);
  }
})();
