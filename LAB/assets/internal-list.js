/* ---------- Approval chain (duplicated from internal-form.js — kept tiny, no cross-page coupling) ---------- */
function isMdOrP5(tujuan) {
  return tujuan === 'Pendaftaran MD (BPOM)' || tujuan === 'Pengujian P5';
}

function getApprovalChain(tipe, tujuan) {
  var mdP5 = isMdOrP5(tujuan);
  if (tipe === 'Urgent') {
    return mdP5 ? ['MGU', 'HOL', 'HOR', 'FRA', 'ADM'] : ['MGU', 'HOL', 'HOR', 'ADM'];
  }
  return mdP5 ? ['FRA', 'ADM'] : ['ADM'];
}

/* Status badge per step. Kaji Ulang & SPK and Labeling happen inside internalForm.html (ADM tabs). */
function requestStatusLabel(r) {
  if (r.step === 'Draft') return '<span class="badge bg-secondary-transparent">Draft</span>';
  if (r.step === 'Approval') {
    var chain = getApprovalChain(r.tipe, r.tujuan);
    var pendingRole = chain[r.approvalIdx] || chain[chain.length - 1];
    var role = (typeof findRole === 'function') ? findRole(pendingRole) : { label: pendingRole };
    return '<span class="badge bg-warning-transparent">Menunggu ' + role.label + '</span>';
  }
  if (r.step === 'Review & SPK') return '<span class="badge bg-info-transparent">Kaji Ulang &amp; SPK</span>';
  if (r.step === 'Labeling') return '<span class="badge bg-primary-transparent">Labeling</span>';
  if (r.step === 'Selesai') return '<span class="badge bg-purple-transparent">Diuji Analis</span>';
  if (r.step === 'Draft Report') {
    return r.reportStatus === 'Final'
      ? '<span class="badge bg-success-transparent">LHU Final</span>'
      : '<span class="badge bg-success-transparent">Draft Report</span>';
  }
  return '<span class="badge bg-light text-default">' + (r.step || '-') + '</span>';
}

function rowMatchesQuery(fields, query) {
  var q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some(function (f) { return String(f || '').toLowerCase().indexOf(q) !== -1; });
}

document.addEventListener('DOMContentLoaded', function () {
  var tableSearch = document.getElementById('tableSearch');
  var filterStatus = document.getElementById('filterStatus');

  /* Request List — every internal request, any step; opens internalForm.html */
  function renderRequestList() {
    var query = tableSearch.value, status = filterStatus.value;
    var all = getRequests();
    var rows = all.filter(function (r) {
      return (!status || r.step === status) && rowMatchesQuery([r.id, r.sampel, r.tipe, r.tujuan, r.spk], query);
    });
    document.getElementById('countRequest').textContent = all.length;
    document.getElementById('requestListBody').innerHTML = rows.map(function (r) {
      var href = 'internalForm.html?docId=' + r.id;
      return '<tr>' +
        '<td><a href="' + href + '" class="btn btn-icon btn-sm btn-info-light btn-wave" title="Buka Pengajuan"><i class="ri-eye-line"></i></a></td>' +
        '<td><a href="' + href + '" class="text-primary fw-medium font-monospace">' + r.id + '</a></td>' +
        '<td>' + r.tanggal + '</td>' +
        '<td>' + r.sampel + '</td>' +
        '<td>' + r.tipe + '</td>' +
        '<td>' + r.tujuan + '</td>' +
        '<td class="font-monospace">' + (r.spk || '<span class="text-muted">-</span>') + '</td>' +
        '<td>' + requestStatusLabel(r) + '</td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="8" class="text-center text-muted p-4">' + (query || status ? 'Tidak ada hasil yang cocok.' : 'Belum ada pengajuan.') + '</td></tr>';
  }

  tableSearch.addEventListener('input', renderRequestList);
  filterStatus.addEventListener('change', renderRequestList);
  renderRequestList();

  /* Header action */
  document.getElementById('listActionButtons').innerHTML =
    '<a href="internalForm.html" class="btn btn-primary btn-sm btn-wave d-inline-flex align-items-center"><i class="ri-add-line me-1 align-middle"></i>Buat Pengajuan Baru</a>';

  /* Status labels name the pending approver role */
  document.addEventListener('holabsys:rolechange', renderRequestList);
});
