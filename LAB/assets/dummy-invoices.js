/* ---------- Master Data › Invoice Lab Eksternal — dummy, localStorage-backed ----------
   Vendor labs bill External requests and Internal subkontrak parameters in their own way (one
   invoice can cover several requests), so the link is made by hand: the Lab Admin records the
   invoice and searches the No. Pengajuan it covers. The request forms show their invoices.
   Record: { no, vendor, tanggal, jatuhTempo, nominal, status, catatan, file,
             requests: [{ jenis: 'External' | 'Internal', id }] }
   Needs dummy-requests.js (+ dummy-external-requests.js for invoiceCandidates). */
var INVOICES_STORAGE_KEY = 'holabsysInvoices.en';
var INVOICE_STATUS = ['Unpaid', 'Paid'];

var SEED_INVOICES = [
  {
    no: 'INV/SGS/2609/0112', vendor: 'SGS Indonesia', tanggal: '22-09-2026', jatuhTempo: '22-10-2026',
    nominal: 4850000, status: 'Paid', catatan: 'FFA & protein test, Gery Saluut.', file: 'INV-SGS-2609-0112.pdf',
    requests: [{ jenis: 'External', id: 'REQ-202609-0019' }]
  },
  {
    no: 'SIG-INV-26-09-045', vendor: 'SIG (Saraswanti Indo Genetech)', tanggal: '25-09-2026', jatuhTempo: '05-10-2026',
    nominal: 3200000, status: 'Unpaid', catatan: '', file: 'SIG-INV-26-09-045.pdf',
    requests: [{ jenis: 'External', id: 'REQ-202609-0025' }]
  }
];

function getInvoices() {
  try {
    var raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(SEED_INVOICES));
      return SEED_INVOICES.slice();
    }
    return JSON.parse(raw);
  } catch (e) {
    return SEED_INVOICES.slice();
  }
}

function saveInvoices(list) {
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(list));
}

function getInvoiceByNo(no) {
  return getInvoices().filter(function (inv) { return inv.no === no; })[0] || null;
}

/* Insert or replace by No. Invoice; oldNo when the number itself was edited */
function saveInvoice(invoice, oldNo) {
  var list = getInvoices().filter(function (inv) { return inv.no !== (oldNo || invoice.no); });
  list.push(invoice);
  saveInvoices(list);
  return invoice;
}

function deleteInvoice(no) {
  saveInvoices(getInvoices().filter(function (inv) { return inv.no !== no; }));
}

function parseDmy(dmy) {
  var p = String(dmy || '').split('-');
  return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]) : null;
}

/* Status shown in lists: Belum Dibayar past its Jatuh Tempo is Jatuh Tempo (overdue) */
var INVOICE_STATUS_BADGE = { 'Paid': 'bg-success-transparent', 'Unpaid': 'bg-warning-transparent', 'Overdue': 'bg-danger-transparent' };

function invoiceStatusLabel(inv) {
  if (inv.status === 'Paid') return 'Paid';
  var due = parseDmy(inv.jatuhTempo);
  var today = new Date(); today.setHours(0, 0, 0, 0);
  return due && due < today ? 'Overdue' : 'Unpaid';
}

function invoiceStatusBadge(inv) {
  var label = invoiceStatusLabel(inv);
  return '<span class="badge ' + INVOICE_STATUS_BADGE[label] + '">' + label + '</span>';
}

function formatRupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('en-GB');
}

/* Requests an invoice can be linked to: every External request (vendor = its lab) and Internal
   requests with at least one Subkontrak parameter (vendors of those parameters) */
function invoiceCandidates() {
  var out = [];
  (typeof getExternalRequests === 'function' ? getExternalRequests() : []).forEach(function (r) {
    out.push({ jenis: 'External', id: r.id, sampel: r.sampel, vendors: r.lab ? [r.lab] : [] });
  });
  getRequests().forEach(function (r) {
    var vendors = [];
    (r.params || []).forEach(function (code) {
      var v = paramSubkontrak(r, code);
      if (v && vendors.indexOf(v) === -1) vendors.push(v);
    });
    if (vendors.length) out.push({ jenis: 'Internal', id: r.id, sampel: r.sampel, vendors: vendors });
  });
  return out;
}

/* Invoices linked to one request */
function invoicesForRequest(jenis, id) {
  return getInvoices().filter(function (inv) {
    return (inv.requests || []).some(function (q) { return q.jenis === jenis && q.id === id; });
  });
}

/* Read-only card body for a request form ("Invoice Lab Eksternal"); '' when there is none */
function requestInvoicesHtml(jenis, id) {
  var list = invoicesForRequest(jenis, id);
  if (!list.length) return '';
  return '<div class="table-responsive rounded border">' +
    '<table class="table table-sm align-middle text-nowrap mb-0">' +
      '<thead><tr><th>No. Invoice</th><th>Vendor</th><th>Date</th><th>Due Date</th><th>Nominal</th><th>Status</th><th>File</th></tr></thead>' +
      '<tbody>' + list.map(function (inv) {
        return '<tr>' +
          '<td><a href="../Master-Data/invoiceForm.html?no=' + encodeURIComponent(inv.no) + '" class="text-primary fw-medium font-monospace">' + inv.no + '</a></td>' +
          '<td>' + inv.vendor + '</td>' +
          '<td>' + inv.tanggal + '</td>' +
          '<td>' + (inv.jatuhTempo || '-') + '</td>' +
          '<td class="font-monospace">' + formatRupiah(inv.nominal) + '</td>' +
          '<td>' + invoiceStatusBadge(inv) + '</td>' +
          '<td class="fs-12">' + (inv.file ? '<i class="ri-attachment-2 me-1"></i>' + inv.file : '<span class="text-muted">-</span>') + '</td>' +
        '</tr>';
      }).join('') + '</tbody>' +
    '</table></div>';
}
