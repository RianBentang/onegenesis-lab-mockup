/* ---------- FlexTab (onegenesis-web Core/GEN/FlexTab) — dummy, localStorage-backed ----------
   Generic lookup lists: a FlexTab has an ID, a Description and an optional parent FlexTab; each
   item has an ID, a Description and an optional Parent ID (an item of the parent FlexTab), which
   gives cascading dropdowns (Brand → SKU).
   The request forms fill their small dropdowns from here (flexTabOptions). Options use the
   item Description as value, so saved requests keep reading the same text. */
var FLEXTAB_STORAGE_KEY = 'holabsysFlexTabs.v3.en';

function ftItems(list, parentId) {
  return list.map(function (it) {
    return typeof it === 'string'
      ? { id: it.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''), description: it, parentId: parentId || '' }
      : { id: it.id, description: it.description, parentId: it.parentId || parentId || '' };
  });
}

var SEED_FLEXTABS = [
  /* Produk */
  { flexTabId: 'LAB_BRAND', description: 'Product Brand', flexTabParentId: '',
    items: ftItems(['WCG', 'MACO', 'Gery', 'Chocolatos', 'Slai O Lai']) },
  { flexTabId: 'LAB_SKU', description: 'SKU Name', flexTabParentId: 'LAB_BRAND',
    items: [
      { id: 'SKU-WCG', description: 'WCG - Wafer Cone Gourmet', parentId: 'WCG' },
      { id: 'SKU-MACO', description: 'MACO - Maco Wafer & Cream', parentId: 'MACO' },
      { id: 'SKU-GERY-SALUUT', description: 'Gery Saluut', parentId: 'GERY' },
      { id: 'SKU-CHOCOLATOS', description: 'Chocolatos', parentId: 'CHOCOLATOS' },
      { id: 'SKU-SLAI-O-LAI', description: 'Slai O Lai', parentId: 'SLAI_O_LAI' }
    ] },
  { flexTabId: 'LAB_KATEGORI_PANGAN', description: 'Food Category', flexTabParentId: '',
    items: ftItems(['Snack Food', 'Dairy Drink', 'Biscuit & Wafer', 'Chocolate & Confectionery', 'Nuts & Snack']) },
  { flexTabId: 'LAB_JENIS_KEMASAN', description: 'Packaging Type', flexTabParentId: '',
    items: ftItems(['Plastic', 'Cup', 'Can', 'Pouch Alufo', 'Carton']) },
  { flexTabId: 'LAB_SUHU_PENYIMPANAN', description: 'Storage Temperature', flexTabParentId: '',
    items: ftItems([{ id: 'AMBIENT', description: 'Ambient Temp' }, { id: 'COOL', description: 'Cool (2-8°C)' }, { id: 'FROZEN', description: 'Frozen (-18°C)' }]) },
  /* Report: how a requester asked for a Re-test / Revision (they ask the lab outside the app) */
  { flexTabId: 'LAB_REQUEST_CHANNEL', description: 'Request Channel (Re-test / Revision)', flexTabParentId: '',
    items: ftItems(['WhatsApp', 'Email', 'Phone', 'Internal Finding']) },
  /* Sensory */
  { flexTabId: 'SN_SUHU_PENYAJIAN', description: 'Serving Temperature (Sensory)', flexTabParentId: '',
    items: ftItems(['Ambient', 'Cool', 'Frozen', 'Hot', 'Warm']) },
  { flexTabId: 'SN_ATRIBUT', description: 'Sensory Attributes', flexTabParentId: '',
    items: ftItems(['Taste', 'Aroma', 'Texture', 'Color & Appearance', 'Aftertaste', 'Overall']) },
  { flexTabId: 'SN_KETEPATAN', description: 'Just-About-Right (JAR)', flexTabParentId: '',
    items: ftItems(['Sweetness', 'Saltiness', 'Sourness', 'Bitterness', 'Spiciness', 'Savory (Umami)',
      'Chocolate Aroma', 'Milk Aroma', 'Vanilla Aroma', 'Crispiness', 'Hardness', 'Softness', 'Thickness']) },
  /* ASLT */
  { flexTabId: 'ASLT_STANDAR_ORGANOLEPTIK', description: 'Organoleptic Release Standard', flexTabParentId: '',
    items: ftItems(['Aroma (Score 7)', 'Texture (Score 7)', 'Taste (Score 7)', 'Aftertaste (Score 6)', 'Appearance (Score 6)']) },
  { flexTabId: 'ASLT_KATEGORI', description: 'ASLT Category', flexTabParentId: '',
    items: ftItems(['NPL', 'Existing', 'Trial', 'Re-ASLT']) },
  { flexTabId: 'ASLT_KATEGORI_PERUBAHAN', description: 'Change Category', flexTabParentId: '',
    items: ftItems(['Product Formulation', 'Process', 'Packaging']) },
  { flexTabId: 'ASLT_KATEGORI_SAMPEL', description: 'ASLT Sample Category', flexTabParentId: '',
    items: ftItems(['Biscon', 'Dairy', 'Snack', 'Beverage', 'Seasoning', 'Cheese']) },
  { flexTabId: 'ASLT_JENIS_PLASTIK', description: 'Plastic Type', flexTabParentId: '',
    items: ftItems(['Alufo', 'Metalized', 'Other']) },
  { flexTabId: 'ASLT_KATEGORI_KEMASAN', description: 'Packaging Category', flexTabParentId: '',
    items: ftItems(['Primary', 'Secondary', 'Primary and Secondary']) },
  { flexTabId: 'ASLT_JUMLAH_LAYER', description: 'Number of Layers', flexTabParentId: '',
    items: ftItems(['1 Layer', '2 Layer', '3 Layer', '4 Layer', 'Others']) },
  { flexTabId: 'ASLT_METODE_PENGEMASAN', description: 'Packaging Method', flexTabParentId: '',
    items: ftItems(['With Nitrogen', 'Vacuum', 'With Oxygen', 'Other']) },
  { flexTabId: 'ASLT_UJI_KEBOCORAN', description: 'Leak Test Result (Sealing / Vacuum)', flexTabParentId: '',
    items: ftItems(['PASS', 'NOT PASS']) }
];

function getFlexTabs() {
  try {
    var raw = localStorage.getItem(FLEXTAB_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall back to the seed */ }
  return JSON.parse(JSON.stringify(SEED_FLEXTABS));
}

function saveFlexTabs(list) {
  localStorage.setItem(FLEXTAB_STORAGE_KEY, JSON.stringify(list));
}

function getFlexTab(id) {
  return getFlexTabs().filter(function (t) { return t.flexTabId === id; })[0] || null;
}

/* Insert or replace by flexTabId */
function saveFlexTab(tab) {
  var list = getFlexTabs().filter(function (t) { return t.flexTabId !== tab.flexTabId; });
  list.push(tab);
  saveFlexTabs(list);
}

function deleteFlexTab(id) {
  saveFlexTabs(getFlexTabs().filter(function (t) { return t.flexTabId !== id; }));
}

/* Dropdown values of a FlexTab, in item order. parentDescription narrows a child FlexTab to the
   items under that parent item (e.g. Ketepatan of atribut "Taste"). */
function flexTabOptions(id, parentDescription) {
  var tab = getFlexTab(id);
  if (!tab) return [];
  var items = tab.items;
  if (parentDescription !== undefined) {
    var parentTab = getFlexTab(tab.flexTabParentId);
    var parent = parentTab && parentTab.items.filter(function (it) { return it.description === parentDescription; })[0];
    items = parent ? items.filter(function (it) { return it.parentId === parent.id; }) : [];
  }
  return items.map(function (it) { return it.description; });
}
