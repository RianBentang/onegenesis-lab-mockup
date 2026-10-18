/* ---------- Master Parameter Uji (Master Data → Parameter Uji) — dummy, localStorage-backed ----------
   The one parameter list of the mockup: the master page (create / edit / delete), the Internal /
   External request forms, Kaji Ulang, sample labels, Excel and Report all read getLabParameters().
   jenis: Internal (tested in this lab) | External (sent to a vendor lab)
   lab:   Internal only — Fisika Kimia | Mikrobiologi (Sensory / ASLT rows are master-only; their forms
          keep their own test types). External parameters have no lab ('').
   mu:    expanded measurement uncertainty (k = 2) printed on the LHU (ISO/IEC 17025 cl. 7.6 / 7.8.3);
          '-' for qualitative tests (Negative / Positive).
   scope: inside the lab's KAN accreditation scope; the LHU marks parameters outside it.
   value: key stored on a request's params. Internal and External may use the same value, so look a
          parameter up per jenis (labParameter). label: short code on the sample label. */
var PARAMETERS_STORAGE_KEY = 'holabsysParameters.en';
var PARAMETER_LABS = ['Physicochemical', 'Microbiology', 'Sensory', 'ASLT'];

var SEED_LAB_PARAMETERS = [
  /* Internal — Lab Fisika Kimia */
  { jenis: 'Internal', lab: 'Physicochemical', value: 'moisture', code: 'PARAM-FK-01', label: 'MOI', text: 'Moisture', method: 'SNI 2897:2008', scope: true, leadTime: 2, suhu: 'Ambient Temp', unit: '% w/w', spec: 'Max. 3.0 %', mu: '± 0.08 % w/w' },
  { jenis: 'Internal', lab: 'Physicochemical', value: 'fat', code: 'PARAM-FK-02', label: 'FAT', text: 'Fat Content', method: 'IK-LAB-02 (Soxhlet)', scope: true, leadTime: 2, suhu: 'Ambient Temp', unit: '% w/w', spec: '18.0 - 22.0 %', mu: '± 0.35 % w/w' },
  { jenis: 'Internal', lab: 'Physicochemical', value: 'ffa', code: 'PARAM-FK-03', label: 'FFA', text: 'FFA (Free Fatty Acid)', method: 'AOAC 940.28', scope: true, leadTime: 1, suhu: 'Ambient Temp', unit: '% w/w', spec: 'Max. 0.5 %', mu: '± 0.02 % w/w' },
  { jenis: 'Internal', lab: 'Physicochemical', value: 'protein', code: 'PARAM-FK-04', label: 'PRO', text: 'Protein Content (Kjeldahl)', method: 'IK-LAB-05', scope: true, leadTime: 2, suhu: 'Ambient Temp', unit: '% w/w', spec: 'Min. 8.0 %', mu: '± 0.21 % w/w' },
  { jenis: 'Internal', lab: 'Physicochemical', value: 'ash', code: 'PARAM-FK-05', label: 'ASH', text: 'Ash Content', method: 'SNI 01-2891-1992', scope: true, leadTime: 2, suhu: 'Ambient Temp', unit: '% w/w', spec: 'Max. 2.0 %', mu: '± 0.05 % w/w' },
  { jenis: 'Internal', lab: 'Physicochemical', value: 'pb', code: 'PARAM-FK-06', label: 'PB', text: 'Lead (Pb) Contamination', method: 'AOAC 999.11 (AAS)', scope: false, leadTime: 4, suhu: 'Frozen (-18°C)', unit: 'mg/kg', spec: 'Max. 0.5 mg/kg', mu: '± 0.04 mg/kg' },
  /* Internal — Lab Mikrobiologi */
  { jenis: 'Internal', lab: 'Microbiology', value: 'salmonella', code: 'PARAM-MB-01', label: 'SAL', text: 'Salmonella sp.', method: 'SNI ISO 6579:2015', scope: true, leadTime: 5, suhu: 'Cool (2-8°C)', unit: '/25g', spec: 'Negative / 25g', mu: '-' },
  { jenis: 'Internal', lab: 'Microbiology', value: 'alt', code: 'PARAM-MB-02', label: 'ALT', text: 'Total Plate Count (TPC)', method: 'SNI 2897:2008', scope: false, leadTime: 3, suhu: 'Cool (2-8°C)', unit: 'CFU/g', spec: 'Max. 1 x 10⁴ CFU/g', mu: '± 0.18 log CFU/g' },
  { jenis: 'Internal', lab: 'Microbiology', value: 'yeast', code: 'PARAM-MB-03', label: 'Y&M', text: 'Yeast & Mold', method: 'ISO 21527-2', scope: true, leadTime: 5, suhu: 'Cool (2-8°C)', unit: 'CFU/g', spec: 'Max. 1 x 10² CFU/g', mu: '± 0.22 log CFU/g' },
  { jenis: 'Internal', lab: 'Microbiology', value: 'coliform', code: 'PARAM-MB-04', label: 'COL', text: 'Coliform & E. coli', method: 'SNI ISO 4832:2012', scope: true, leadTime: 3, suhu: 'Cool (2-8°C)', unit: 'APM/g', spec: '< 3 APM/g', mu: '-' },
  /* Internal — Sensory / ASLT (master only) */
  { jenis: 'Internal', lab: 'Sensory', value: 'hedonic', code: 'PARAM-SN-01', label: 'HED', text: 'Affective Sensory Test (Hedonic Rating)', method: 'IK-LAB-SN-01 (ISO 4121)', scope: false, leadTime: 1, suhu: 'Ambient Temp', unit: 'Scale 1-9', spec: 'Average >= 7.0' },
  { jenis: 'Internal', lab: 'Sensory', value: 'triangle', code: 'PARAM-SN-02', label: 'TRI', text: 'Triangle Test (Discrimination)', method: 'ISO 4120:2004', scope: false, leadTime: 1, suhu: 'Ambient Temp', unit: 'Discrimination Points', spec: 'Point 3 (Valid)' },
  { jenis: 'Internal', lab: 'ASLT', value: 'arrhenius', code: 'PARAM-AS-01', label: 'ARR', text: 'Shelf Life, Arrhenius Model (Critical)', method: 'IK-LAB-AS-01 (Labuza 1982)', scope: false, leadTime: 30, suhu: 'Ambient Temp', unit: 'Months', spec: 'Min. 12 Months' },
  { jenis: 'Internal', lab: 'ASLT', value: 'aw', code: 'PARAM-AS-02', label: 'AW', text: 'Critical Moisture (AW & Sorption Isotherm)', method: 'IK-LAB-AS-02', scope: true, leadTime: 14, suhu: 'Cool (2-8°C)', unit: 'aw', spec: 'aw < 0.60' },

  /* External (vendor lab, no lab type) */
  { jenis: 'External', lab: '', value: 'moisture', code: 'EXT-FK-01', label: 'MOI', text: 'Moisture', method: 'SNI 2897:2008', scope: true, leadTime: 7, suhu: 'Ambient Temp', unit: '% w/w', spec: 'Max. 3.0 %' },
  { jenis: 'External', lab: '', value: 'fat', code: 'EXT-FK-02', label: 'FAT', text: 'Fat Content', method: 'AOAC 2003.06', scope: true, leadTime: 7, suhu: 'Ambient Temp', unit: '% w/w', spec: '18.0 - 22.0 %' },
  { jenis: 'External', lab: '', value: 'ffa', code: 'EXT-FK-03', label: 'FFA', text: 'FFA (Free Fatty Acid)', method: 'AOAC 940.28', scope: true, leadTime: 7, suhu: 'Ambient Temp', unit: '% w/w', spec: 'Max. 0.5 %' },
  { jenis: 'External', lab: '', value: 'protein', code: 'EXT-FK-04', label: 'PRO', text: 'Protein Content (Kjeldahl)', method: 'AOAC 2001.11', scope: true, leadTime: 7, suhu: 'Ambient Temp', unit: '% w/w', spec: 'Min. 8.0 %' },
  { jenis: 'External', lab: '', value: 'pb', code: 'EXT-FK-05', label: 'PB', text: 'Lead (Pb) Contamination', method: 'AOAC 2015.01 (ICP-MS)', scope: true, leadTime: 10, suhu: 'Ambient Temp', unit: 'mg/kg', spec: 'Max. 0.5 mg/kg' },
  { jenis: 'External', lab: '', value: 'aflatoxin', code: 'EXT-FK-06', label: 'AFL', text: 'Total Aflatoxin (B1, B2, G1, G2)', method: 'AOAC 991.31 (HPLC)', scope: true, leadTime: 14, suhu: 'Ambient Temp', unit: 'µg/kg', spec: 'Max. 15 µg/kg' },
  { jenis: 'External', lab: '', value: 'salmonella', code: 'EXT-MB-01', label: 'SAL', text: 'Salmonella sp.', method: 'ISO 6579-1:2017', scope: true, leadTime: 10, suhu: 'Cool (2-8°C)', unit: '/25g', spec: 'Negative / 25g' },
  { jenis: 'External', lab: '', value: 'alt', code: 'EXT-MB-02', label: 'ALT', text: 'Total Plate Count (TPC)', method: 'ISO 4833-1:2013', scope: true, leadTime: 7, suhu: 'Cool (2-8°C)', unit: 'CFU/g', spec: 'Max. 1 x 10⁴ CFU/g' },
  { jenis: 'External', lab: '', value: 'listeria', code: 'EXT-MB-03', label: 'LIS', text: 'Listeria monocytogenes', method: 'ISO 11290-1:2017', scope: true, leadTime: 10, suhu: 'Cool (2-8°C)', unit: '/25g', spec: 'Negative / 25g' }
];

/* Labs an Internal request can pick parameters from, in dropdown order */
var PARAMETER_REQUEST_LABS = ['Physicochemical', 'Microbiology'];

function getLabParameters() {
  try {
    var raw = localStorage.getItem(PARAMETERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PARAMETERS_STORAGE_KEY, JSON.stringify(SEED_LAB_PARAMETERS));
      return SEED_LAB_PARAMETERS.slice();
    }
    /* Fields added to the seed later (mu) are filled in once for parameters saved before */
    var list = JSON.parse(raw);
    var changed = false;
    list.forEach(function (p) {
      if (p.mu !== undefined) return;
      var seed = SEED_LAB_PARAMETERS.filter(function (x) { return x.jenis === p.jenis && x.value === p.value; })[0];
      p.mu = seed && seed.mu ? seed.mu : '';
      changed = true;
    });
    if (changed) localStorage.setItem(PARAMETERS_STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    return SEED_LAB_PARAMETERS.slice();
  }
}

function saveLabParameters(list) {
  localStorage.setItem(PARAMETERS_STORAGE_KEY, JSON.stringify(list));
}

/* Insert or replace (by jenis + value) */
function saveLabParameter(param) {
  var list = getLabParameters().filter(function (p) { return !(p.jenis === param.jenis && p.value === param.value); });
  list.push(param);
  saveLabParameters(list);
  return param;
}

function deleteLabParameter(jenis, value) {
  saveLabParameters(getLabParameters().filter(function (p) { return !(p.jenis === jenis && p.value === value); }));
}

function labParameters(jenis) {
  return getLabParameters().filter(function (p) { return p.jenis === jenis; });
}

function labParameter(jenis, value) {
  return labParameters(jenis).filter(function (p) { return p.value === value; })[0] || null;
}

/* Parameters a request can pick: Internal from Fisika Kimia / Mikrobiologi, External all */
function requestParameters(jenis) {
  return labParameters(jenis).filter(function (p) { return jenis === 'External' || PARAMETER_REQUEST_LABS.indexOf(p.lab) !== -1; });
}

/* TomSelect settings for a request's parameter picker: options grouped per lab ("Physicochemical Lab",
   "Microbiology Lab"), like the optgroups of the Excel Tarik Data dropdown.
   Internal form: parameterPickerOptions('Internal') — value = parameter value.
   External form: parameterPickerOptions(['Internal', 'External']) — a big INTERNAL heading over its lab
   groups, then EXTERNAL as one flat group (External has no lab); value = "Jenis:value" (paramKey),
   since both lists share values. */
function parameterPickerOptions(jenisList) {
  jenisList = [].concat(jenisList);
  var nested = jenisList.length > 1;
  var options = [];
  var optgroups = [];
  jenisList.forEach(function (jenis) {
    var flat = jenis === 'External';
    requestParameters(jenis).forEach(function (p) {
      options.push({ value: nested ? paramKey(jenis, p.value) : p.value, text: p.text, jenis: jenis, group: flat ? jenis : jenis + '|' + p.lab });
    });
    if (flat) optgroups.push({ value: jenis, label: '', jenis: jenis, first: true });
    else PARAMETER_REQUEST_LABS.forEach(function (lab, i) {
      optgroups.push({ value: jenis + '|' + lab, label: 'Lab ' + lab, jenis: jenis, first: i === 0 });
    });
  });
  var settings = { options: options, optgroups: optgroups, optgroupField: 'group', lockOptgroupOrder: true };
  if (nested) {
    settings.render = {
      /* The jenis heading sits above its first lab group */
      optgroup_header: function (d) {
        return '<div class="optgroup-header">' + (d.first ? '<div class="param-jenis-header">' + d.jenis + '</div>' : '') + d.label + '</div>';
      },
      item: function (d) {
        return '<div>' + d.text + ' <span class="badge ' + (d.jenis === 'External' ? 'bg-info-transparent' : 'bg-primary-transparent') + ' ms-1">' + d.jenis + '</span></div>';
      }
    };
  }
  return settings;
}

/* External request params are "Jenis:value"; requests saved before that hold plain External values */
function paramKey(jenis, value) {
  return jenis + ':' + value;
}

function externalRequestParamKeys(params) {
  return (params || []).map(function (v) { return v.indexOf(':') === -1 ? paramKey('External', v) : v; });
}

/* ---------- Statement of conformity (LHU Status column, ISO/IEC 17025 cl. 7.8.6) ----------
   Decision rule: simple acceptance (ILAC-G8:09/2019 §4.2.1) — the result is compared with the
   specification as reported, without guard band. Returns true (PASS), false (FAIL) or null when the
   spec or the result cannot be read as a limit (the LHU then prints "-", no statement). */
var DECISION_RULE_TEXT = 'Statement of conformity uses simple acceptance (ILAC-G8:09/2019 §4.2.1): the result is compared with the specification without guard band; the measurement uncertainty is reported but not deducted.';

function specNumber(text) {
  if (text == null) return null;
  var sup = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  var t = String(text).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, function (c) { return sup[c]; }).replace(',', '.');
  var sci = t.match(/(-?\d+(?:\.\d+)?)\s*x\s*10\s*\^?\s*(-?\d+)/i);
  if (sci) return parseFloat(sci[1]) * Math.pow(10, parseInt(sci[2], 10));
  var m = t.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function specConformity(spec, result) {
  if (!spec || result == null || result === '' || result === '-') return null;
  var s = String(spec).trim();
  var r = String(result).trim();
  if (/^negative/i.test(s)) {
    if (/negative|not detected|absent|^nd$/i.test(r)) return true;
    return /positive|detected|present/i.test(r) ? false : null;
  }
  var v = specNumber(r);
  if (v === null) return null;
  var range = s.match(/^(-?\d+(?:[.,]\d+)?)\s*-\s*(-?\d+(?:[.,]\d+)?)/);
  if (range) return v >= specNumber(range[1]) && v <= specNumber(range[2]);
  var lim = specNumber(s);
  if (lim === null) return null;
  var below = /^</.test(r); // "<3" reported as below the detection limit
  if (/^min\b|>=|≥/i.test(s)) return v >= lim;
  if (/^max\b|<=|≤/i.test(s)) return v <= lim;
  if (/</.test(s)) return v < lim || (below && v <= lim);
  if (/>/.test(s)) return v > lim;
  return null;
}
