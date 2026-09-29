/* ---------- HOLABSYS Excel page (FortuneSheet + fullscreen) ---------- */

// The FortuneSheet UMD build calls Node's crypto.randomFillSync (via uuid) on the browser
// crypto global. Not needed in the React app, where the bundler resolves the browser build.
if (window.crypto && !window.crypto.randomFillSync) {
  window.crypto.randomFillSync = function (arr) { return window.crypto.getRandomValues(arr); };
}
document.addEventListener('DOMContentLoaded', function () {
  /* ---------- dummy workbook: lembar kerja hasil uji ---------- */
  var header = ['No. Pengajuan', 'Sampel', 'Parameter', 'Ulangan 1', 'Ulangan 2', 'Ulangan 3', 'Rata-rata', 'Satuan', 'Spesifikasi', 'Analis'];
  var rows = [
    ['REQ-202609-0018', 'Chocolatos Sachet 20g', 'Kadar Air', 2.41, 2.38, 2.45, '%', '≤ 3.0', 'Budi Santoso'],
    ['REQ-202609-0018', 'Chocolatos Sachet 20g', 'Lemak', 18.2, 18.5, 18.3, '%', '17 – 20', 'Budi Santoso'],
    ['REQ-202609-0021', 'Slai O Lai Coklat 32g', 'Kadar Air', 3.12, 3.08, 3.15, '%', '≤ 3.2', 'Galih Saputra'],
    ['REQ-202609-0021', 'Slai O Lai Coklat 32g', 'FFA', 0.31, 0.29, 0.33, '%', '≤ 0.5', 'Galih Saputra'],
    ['REQ-202609-0027', 'Gery Saluut Malkist 100g', 'Kadar Abu', 1.52, 1.49, 1.55, '%', '≤ 2.0', 'Dewi Lestari'],
    ['REQ-202609-0027', 'Gery Saluut Malkist 100g', 'pH', 6.8, 6.7, 6.8, '-', '6.5 – 7.0', 'Dewi Lestari']
  ];

  var celldata = header.map(function (h, c) {
    return { r: 0, c: c, v: { v: h, m: h, bl: 1, ht: 0 } };
  });
  rows.forEach(function (row, i) {
    var r = i + 1;
    var avg = Math.round((row[3] + row[4] + row[5]) / 3 * 1000) / 1000;
    var values = row.slice(0, 6).concat([null]).concat(row.slice(6));
    values.forEach(function (v, c) {
      if (c === 6) {
        celldata.push({ r: r, c: c, v: { v: avg, m: String(avg), f: '=ROUND(AVERAGE(D' + (r + 1) + ':F' + (r + 1) + '),3)' } });
      } else {
        celldata.push({ r: r, c: c, v: { v: v, m: String(v) } });
      }
    });
  });

  var sheets = [
    {
      name: 'Hasil Uji',
      order: 0,
      status: 1,
      row: 60,
      column: 20,
      celldata: celldata,
      config: { columnlen: { 0: 130, 1: 180, 2: 100, 8: 100, 9: 120 } }
    },
    { name: 'Kalibrasi', order: 1, row: 60, column: 20, celldata: [] }
  ];

  var host = document.getElementById('sheet');
  ReactDOM.createRoot(host).render(
    React.createElement(window.react.Workbook, { data: sheets, lang: 'en' })
  );

  // FortuneSheet only re-measures its canvas on window resize, so forward every host size
  // change (initial layout settling, sidebar toggle, fullscreen) as one.
  new ResizeObserver(function () { window.dispatchEvent(new Event('resize')); }).observe(host);

  /* ---------- fullscreen ---------- */
  var card = document.getElementById('sheetCard');
  var btn = document.getElementById('btnFullscreen');

  btn.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else card.requestFullscreen().catch(function (e) { console.warn('Fullscreen ditolak browser:', e.message); });
  });

  document.addEventListener('fullscreenchange', function () {
    var on = document.fullscreenElement === card;
    btn.innerHTML = on
      ? '<i class="ri-fullscreen-exit-line me-1"></i><span>Exit Fullscreen</span>'
      : '<i class="ri-fullscreen-line me-1"></i><span>Fullscreen</span>';
  });
});
