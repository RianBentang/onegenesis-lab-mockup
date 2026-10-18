/* ---------- Master Data Site — address detail per site (dummy, design-only) ----------
   Keyed by the site name, which is the value of the Alamat Pelanggan / Alamat Pabrik dropdowns;
   the dropdown shows "Company - Kota" (siteOptions) and the eye button opens the full detail. */
var MASTER_SITE_DETAIL = {
  'Head Office': {
    company: 'PT Garudafood Putra Putri Jaya Tbk', tipe: 'Head Office', alamat: '10 Example Raya St., Example Bldg. 5th Fl.', kota: 'Jakarta Selatan',
    provinsi: 'DKI Jakarta', kodePos: '12310', pic: 'Andi Wijaya', telp: '021-555-0101', email: 'ho.lab@example.com'
  },
  'Plant Sentul': {
    company: 'PT Garudafood Putra Putri Jaya Tbk', tipe: 'Plant', alamat: 'Example Industrial Estate, Block A-12', kota: 'Kab. Bogor',
    provinsi: 'Jawa Barat', kodePos: '16810', pic: 'Rina Hartono', telp: '021-555-0202', email: 'sentul.qa@example.com'
  },
  'Plant Pati': {
    company: 'PT Garudafood Putra Putri Jaya Tbk', tipe: 'Plant', alamat: 'Example Raya St. Km 4', kota: 'Kab. Pati',
    provinsi: 'Jawa Tengah', kodePos: '59111', pic: 'Hendra Saputra', telp: '0295-555-0303', email: 'pati.qa@example.com'
  },
  'Plant Gresik': {
    company: 'PT Garudafood Putra Putri Jaya Tbk', tipe: 'Plant', alamat: '7 Example Industri St.', kota: 'Kab. Gresik',
    provinsi: 'Jawa Timur', kodePos: '61151', pic: 'Dewi Kartika', telp: '031-555-0404', email: 'gresik.qa@example.com'
  },
  'Plant Rancaekek': {
    company: 'PT Garudafood Putra Putri Jaya Tbk', tipe: 'Plant', alamat: 'Example Raya St. Km 22', kota: 'Kab. Bandung',
    provinsi: 'Jawa Barat', kodePos: '40394', pic: 'Yusuf Ramadhan', telp: '022-555-0505', email: 'rancaekek.qa@example.com'
  },
  'Plant Cimanggis': {
    company: 'PT Garudafood Putra Putri Jaya Tbk', tipe: 'Plant', alamat: '3 Example Industri St.', kota: 'Kota Depok',
    provinsi: 'Jawa Barat', kodePos: '16951', pic: 'Lina Marlina', telp: '021-555-0606', email: 'cimanggis.qa@example.com'
  }
};

/* Options for an address dropdown: value = site, text = "Company - Kota" */
function siteOptions() {
  return Object.keys(MASTER_SITE_DETAIL).map(function (site) {
    var d = MASTER_SITE_DETAIL[site];
    return { value: site, text: d.company + ' - ' + d.kota };
  });
}
