/* ---------- Proposal version 1 (flow before the KAN review) ----------
   Loaded first in every page of versions/v1-before/. Both versions are served from the same origin,
   so this copy keeps its own browser data: every localStorage / sessionStorage key gets the "v1:"
   prefix and never touches the data of the current version (LAB/). Also shows a "Version 1" label. */
(function () {
  var PREFIX = 'v1:';
  var proto = Storage.prototype;
  var get = proto.getItem, set = proto.setItem, remove = proto.removeItem;
  proto.getItem = function (k) { return get.call(this, PREFIX + k); };
  proto.setItem = function (k, v) { return set.call(this, PREFIX + k, v); };
  proto.removeItem = function (k) { return remove.call(this, PREFIX + k); };

  document.addEventListener('DOMContentLoaded', function () {
    var tag = document.createElement('div');
    tag.className = 'badge bg-warning text-fixed-white rounded-pill px-3 py-2 fs-12 shadow';
    tag.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:1080';
    tag.innerHTML = '<i class="ri-git-branch-line me-1"></i>Version 1 · original flow';
    document.body.appendChild(tag);
  });
})();
