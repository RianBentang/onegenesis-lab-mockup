/* ---------- HRIS karyawan (design-only dummy, no backend) ----------
   Stands in for the HRIS employee lookup. The PANELIS login asks only for the NIK and shows the
   username / name from here. Panelists (MASTER_PANELIS in dummy-panel.js) link to it by NIK.
   The last two are employees who are not registered as panelists. */

var HRIS_KARYAWAN = [
  { nik: '20180123', username: 'ayu.pratiwi', name: 'Ayu Pratiwi', dept: 'Quality Control', position: 'QC Analyst' },
  { nik: '20170456', username: 'bima.santoso', name: 'Bima Santoso', dept: 'Research & Development', position: 'Product Developer' },
  { nik: '20190311', username: 'citra.maharani', name: 'Citra Maharani', dept: 'Laboratorium', position: 'Lab Analyst' },
  { nik: '20160782', username: 'dimas.prakoso', name: 'Dimas Prakoso', dept: 'Quality Assurance', position: 'QA Supervisor' },
  { nik: '20200145', username: 'eka.wulandari', name: 'Eka Wulandari', dept: 'Production', position: 'Line Leader' },
  { nik: '20210533', username: 'fajar.nugroho', name: 'Fajar Nugroho', dept: 'Production', position: 'Operator' },
  { nik: '20190877', username: 'gita.anjani', name: 'Gita Anjani', dept: 'Marketing', position: 'Brand Executive' },
  { nik: '20220219', username: 'hana.puspita', name: 'Hana Puspita', dept: 'Human Capital', position: 'HC Officer' },
  { nik: '20150664', username: 'irfan.hakim', name: 'Irfan Hakim', dept: 'Finance', position: 'Accountant' },
  { nik: '20230108', username: 'jihan.safitri', name: 'Jihan Safitri', dept: 'Supply Chain', position: 'Planner' },
  { nik: '20210990', username: 'kevin.adiputra', name: 'Kevin Adiputra', dept: 'IT', position: 'IT Support' },
  { nik: '20220347', username: 'laras.kusuma', name: 'Laras Kusuma', dept: 'Procurement', position: 'Buyer' },
  { nik: '20140219', username: 'rudi.hartono', name: 'Rudi Hartono', dept: 'Engineering', position: 'Maintenance Engineer' },
  { nik: '20240051', username: 'sinta.dewi', name: 'Sinta Dewi', dept: 'Sales', position: 'Sales Admin' }
];

function hrisFindByNik(nik) {
  nik = String(nik || '').trim();
  return HRIS_KARYAWAN.filter(function (k) { return k.nik === nik; })[0] || null;
}
