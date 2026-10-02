/* Deterministic QR-look SVG generator — ported from OneGenesis mockup (qrSvg) */
function qrSvg(seed, size) {
  size = size || 78;
  var h = 0;
  for (var i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
  var n = 21, cell = size / n, r = '';
  function fin(x, y) {
    return '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + (7 * cell) + '" height="' + (7 * cell) + '" fill="#111"/>' +
      '<rect x="' + ((x + 1) * cell) + '" y="' + ((y + 1) * cell) + '" width="' + (5 * cell) + '" height="' + (5 * cell) + '" fill="#fff"/>' +
      '<rect x="' + ((x + 2) * cell) + '" y="' + ((y + 2) * cell) + '" width="' + (3 * cell) + '" height="' + (3 * cell) + '" fill="#111"/>';
  }
  for (var y = 0; y < n; y++) {
    for (var x = 0; x < n; x++) {
      if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
      h = (h * 1103515245 + 12345) >>> 0;
      if (h & 0x40000) r += '<rect x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + cell + '" height="' + cell + '" fill="#111"/>';
    }
  }
  return '<svg class="qr" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
    '<rect width="' + size + '" height="' + size + '" fill="#fff"/>' + r + fin(0, 0) + fin(14, 0) + fin(0, 14) + '</svg>';
}

/* Duplicated lookup (category only needed here) — kept local to avoid cross-page coupling */
var MASTER_PARAMETER_CATEGORY = {
  moisture: { text: 'Moisture (Kadar Air)', category: 'Fisika Kimia', code: 'MOI' },
  fat: { text: 'Kadar Lemak (Fat)', category: 'Fisika Kimia', code: 'FAT' },
  ffa: { text: 'FFA (Free Fatty Acid)', category: 'Fisika Kimia', code: 'FFA' },
  protein: { text: 'Kadar Protein', category: 'Fisika Kimia', code: 'PRO' },
  salmonella: { text: 'Salmonella sp.', category: 'Mikrobiologi', code: 'SAL' },
  alt: { text: 'Angka Lempeng Total (ALT)', category: 'Mikrobiologi', code: 'ALT' },
  pb: { text: 'Cemaran Logam (Pb)', category: 'Fisika Kimia', code: 'PB' }
};

/* Sample label sheet (50 × 30 mm, one label per lab category) — rendered under Kaji Ulang & SPK */
function sampleLabelsHtml(record) {
  var groups = [];
  (record.params || []).forEach(function (code) {
    var cat = MASTER_PARAMETER_CATEGORY[code] ? MASTER_PARAMETER_CATEGORY[code].category : 'Umum';
    if (groups.indexOf(cat) === -1) groups.push(cat);
  });

  return groups.map(function (group, i) {
    var sid = record.id + '-' + String(i + 1).padStart(2, '0');
    var chips = (record.params || [])
      .filter(function (code) { return MASTER_PARAMETER_CATEGORY[code] && MASTER_PARAMETER_CATEGORY[code].category === group; })
      .map(function (code) { return '<span>' + MASTER_PARAMETER_CATEGORY[code].code + '</span>'; })
      .join('');

    return '<div class="lbl-card">' + qrSvg(sid) +
      '<div>' +
      '<div class="lh"><span class="lid">' + sid + '</span> <span class="badge ' + (record.tipe === 'Urgent' ? 'bg-danger-transparent' : 'bg-secondary-transparent') + '">' + record.tipe + '</span></div>' +
      '<div class="ln">' + record.sampel + '</div>' +
      '<div class="lm">Batch: ' + record.batch + ' &middot; Prod: ' + record.prod + '<br>Lab: <b>' + group + '</b> &middot; Terima: ' + record.tanggal + '<br>Simpan: ' + record.suhu + ' &middot; ' + record.spk + '</div>' +
      '<div class="lp">' + chips + '</div>' +
      '</div></div>';
  });
}
