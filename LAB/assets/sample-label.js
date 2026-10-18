/* Sample label sheet (50 × 30 mm, one label per lab of the parameter master) — rendered under the
   Technical Review & SPK tab. The label carries the lab's 5-digit Sample No. (record.sampleNos). */
function sampleLabelsHtml(record) {
  var groups = [];
  (record.paramsDiterima || record.params || []).forEach(function (code) {
    var p = labParameter('Internal', code);
    var cat = p ? p.lab : 'General';
    if (groups.indexOf(cat) === -1) groups.push(cat);
  });

  return groups.map(function (group) {
    var sid = (record.sampleNos && record.sampleNos[group]) || '-----';
    var chips = (record.paramsDiterima || record.params || [])
      .map(function (code) { return labParameter('Internal', code); })
      .filter(function (p) { return p && p.lab === group; })
      .map(function (p) { return '<span>' + p.label + '</span>'; })
      .join('');

    return '<div class="lbl-card">' +
      '<div>' +
      '<div class="lh"><span class="lid">Sample No. ' + sid + '</span> <span class="badge ' + (record.tipe === 'Urgent' ? 'bg-danger-transparent' : 'bg-secondary-transparent') + '">' + record.tipe + '</span></div>' +
      '<div class="ln">' + record.sampel + '</div>' +
      '<div class="lm">Batch: ' + (record.batch || '-') + ' &middot; Prod: ' + (record.prod || '-') + '<br>Lab: <b>' + group + '</b> &middot; Received: ' + record.tanggal + '<br>Storage: ' + record.suhu + ' &middot; ' + record.id + ' &middot; ' + record.spk + '</div>' +
      '<div class="lp">' + chips + '</div>' +
      '</div></div>';
  });
}
