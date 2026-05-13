// ────────────────────────────────────────────────────────────────────────────
// Метаданные отчёта
// ────────────────────────────────────────────────────────────────────────────

const LABS = [
  'MedLab Diagnostics', 'ClinPath Laboratory', 'BioAnalytica Central Lab',
  'HealthScreen Lab', 'Precision Lab Solutions', 'Alpha Clinical Laboratory',
];

const DOCTORS = [
  'Dr. M. Schneider', 'Dr. K. Hoffmann', 'Dr. A. Weber',
  'Dr. J. Fischer', 'Dr. S. Müller', 'Dr. L. Bauer',
];

// ────────────────────────────────────────────────────────────────────────────
// Типы образцов по классу LOINC
// ────────────────────────────────────────────────────────────────────────────

const SAMPLE_TYPES_BY_CLASS = {
  'HEM/BC':     ['Whole blood', 'Blood (venous)', 'Blood (capillary)'],
  'COAG':       ['Whole blood', 'Blood (venous)', 'Plasma (citrated)'],
  'CHEM':       ['Serum', 'Plasma', 'Blood (venous)'],
  'UA':         ['Urine', 'Urine (midstream)', 'Urine (24h)'],
  'MICRO':      ['Serum', 'Plasma', 'Blood (venous)', 'Whole blood'],
  'MOLPATH':    ['Whole blood', 'Tissue', 'Bone marrow', 'Plasma'],
  'MOLPATH.MUT':['Whole blood', 'Tissue', 'Bone marrow'],
  'ABXBACT':    ['Isolate', 'Culture'],
  'ALLERGY':    ['Serum', 'Plasma'],
  'SERO':       ['Serum', 'Plasma'],
  'DRUG/TOX':   ['Serum', 'Plasma', 'Urine', 'Whole blood', 'Hair', 'Saliva'],
  'BLDBK':      ['Serum', 'Plasma', 'Whole blood'],
  'PANEL.MICRO':['Serum', 'Plasma'],
  'PANEL.CHEM': ['Serum', 'Plasma', 'Urine'],
  'DEFAULT':    ['Serum', 'Plasma', 'Whole blood', 'Blood (venous)'],
};

// ────────────────────────────────────────────────────────────────────────────
// Сопутствующие параметры по классу LOINC
//   Каждый параметр: имя, генератор значения, единица, реф. диапазон
// ────────────────────────────────────────────────────────────────────────────

function rand(min, max, dec) {
  return +(Math.random() * (max - min) + min).toFixed(dec);
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Гематология (общий анализ крови)
const HEM_PARAMS = [
  { param: 'WBC',         result: () => rand(4.0, 10.0, 1),   unit: 'x10^9/L',  refRange: '4.0 - 10.0' },
  { param: 'RBC',         result: () => rand(3.8, 5.5, 2),    unit: 'x10^12/L', refRange: '3.8 - 5.5' },
  { param: 'Hemoglobin',  result: () => rand(120, 160, 1),    unit: 'g/L',      refRange: '120 - 160' },
  { param: 'Hematocrit',  result: () => rand(36, 48, 1),      unit: '%',         refRange: '36 - 48' },
  { param: 'Platelets',   result: () => rand(150, 400, 0),    unit: 'x10^9/L',  refRange: '150 - 400' },
  { param: 'MCV',         result: () => rand(80, 100, 1),     unit: 'fL',        refRange: '80 - 100' },
  { param: 'MCH',         result: () => rand(27, 33, 1),      unit: 'pg',        refRange: '27 - 33' },
  { param: 'MCHC',        result: () => rand(320, 360, 0),    unit: 'g/L',       refRange: '320 - 360' },
  { param: 'RDW',         result: () => rand(11.5, 14.5, 1),  unit: '%',         refRange: '11.5 - 14.5' },
  { param: 'Neutrophils', result: () => rand(40, 75, 1),      unit: '%',         refRange: '40 - 75' },
  { param: 'Lymphocytes', result: () => rand(20, 45, 1),      unit: '%',         refRange: '20 - 45' },
];

// Коагуляция
const COAG_PARAMS = [
  { param: 'PT',          result: () => rand(10, 13, 1),       unit: 'sec',       refRange: '10.0 - 13.0' },
  { param: 'APTT',        result: () => rand(25, 35, 1),       unit: 'sec',       refRange: '25 - 35' },
  { param: 'INR',         result: () => rand(0.8, 1.2, 2),     unit: '',          refRange: '0.8 - 1.2' },
  { param: 'Fibrinogen',  result: () => rand(2.0, 4.0, 2),     unit: 'g/L',       refRange: '2.0 - 4.0' },
  { param: 'D-dimer',     result: () => rand(0, 0.5, 2),       unit: 'mg/L',      refRange: '< 0.5' },
];

// Биохимия
const CHEM_PARAMS = [
  { param: 'Glucose',           result: () => rand(3.9, 6.1, 2),    unit: 'mmol/L', refRange: '3.9 - 6.1' },
  { param: 'Creatinine',        result: () => rand(60, 110, 0),     unit: 'µmol/L', refRange: '60 - 110' },
  { param: 'Urea',              result: () => rand(2.5, 7.5, 2),    unit: 'mmol/L', refRange: '2.5 - 7.5' },
  { param: 'Total protein',     result: () => rand(65, 85, 1),      unit: 'g/L',    refRange: '65 - 85' },
  { param: 'Albumin',           result: () => rand(35, 50, 1),      unit: 'g/L',    refRange: '35 - 50' },
  { param: 'ALT',               result: () => rand(0, 40, 1),       unit: 'U/L',    refRange: '0 - 40' },
  { param: 'AST',               result: () => rand(0, 35, 1),       unit: 'U/L',    refRange: '0 - 35' },
  { param: 'Total bilirubin',   result: () => rand(3, 21, 1),       unit: 'µmol/L', refRange: '3 - 21' },
  { param: 'Sodium',            result: () => rand(135, 145, 0),    unit: 'mmol/L', refRange: '135 - 145' },
  { param: 'Potassium',         result: () => rand(3.5, 5.0, 2),    unit: 'mmol/L', refRange: '3.5 - 5.0' },
  { param: 'Chloride',          result: () => rand(98, 107, 0),     unit: 'mmol/L', refRange: '98 - 107' },
  { param: 'Calcium',           result: () => rand(2.15, 2.55, 2),  unit: 'mmol/L', refRange: '2.15 - 2.55' },
  { param: 'Cholesterol',       result: () => rand(3.5, 5.2, 2),    unit: 'mmol/L', refRange: '< 5.2' },
  { param: 'Triglycerides',     result: () => rand(0.5, 1.7, 2),    unit: 'mmol/L', refRange: '< 1.7' },
];

// Анализ мочи
const UA_PARAMS = [
  { param: 'pH',                result: () => rand(5.0, 7.5, 1),    unit: '',       refRange: '5.0 - 7.5' },
  { param: 'Specific gravity',  result: () => rand(1.005, 1.030, 3),unit: '',       refRange: '1.005 - 1.030' },
  { param: 'Protein',           result: () => rand(0, 0.15, 2),     unit: 'g/L',    refRange: '< 0.15' },
  { param: 'Glucose (urine)',   result: () => rand(0, 0.8, 2),      unit: 'mmol/L', refRange: 'Negative' },
  { param: 'Ketones',           result: () => pick(['Negative','Trace']),unit:'',   refRange: 'Negative' },
  { param: 'Leukocytes',        result: () => pick(['Negative','Trace']),unit:'',   refRange: 'Negative' },
  { param: 'Nitrites',          result: () => pick(['Negative']),    unit: '',      refRange: 'Negative' },
  { param: 'Color',             result: () => pick(['Yellow','Light yellow','Straw']), unit: '', refRange: 'Yellow' },
];

// Серология (общие иммунологические маркеры)
const SERO_PARAMS = [
  { param: 'CRP',               result: () => rand(0, 5, 2),        unit: 'mg/L',   refRange: '< 5.0' },
  { param: 'ESR',               result: () => rand(0, 20, 0),       unit: 'mm/h',   refRange: '< 20' },
  { param: 'IgG',               result: () => rand(7, 16, 2),       unit: 'g/L',    refRange: '7.0 - 16.0' },
  { param: 'IgM',               result: () => rand(0.4, 2.3, 2),    unit: 'g/L',    refRange: '0.4 - 2.3' },
  { param: 'IgA',               result: () => rand(0.7, 4.0, 2),    unit: 'g/L',    refRange: '0.7 - 4.0' },
];

// Аллергология
const ALLERGY_PARAMS = [
  { param: 'Total IgE',         result: () => rand(0, 100, 1),      unit: 'IU/mL',  refRange: '< 100' },
  { param: 'Eosinophils',       result: () => rand(0, 6, 1),        unit: '%',      refRange: '0 - 6' },
];

// Карта классов → пулы параметров
const EXTRA_BY_CLASS = {
  // Гематология
  'HEM/BC':      HEM_PARAMS,
  'HEM':         HEM_PARAMS,

  // Коагуляция
  'COAG':        COAG_PARAMS,

  // Биохимия
  'CHEM':        CHEM_PARAMS,
  'PANEL.CHEM':  CHEM_PARAMS,
  'CHEM.PANEL':  CHEM_PARAMS,

  // Моча
  'UA':          UA_PARAMS,

  // Серология / иммунология
  'SERO':        SERO_PARAMS,
  'PANEL.SERO':  SERO_PARAMS,

  // Аллергология
  'ALLERGY':     ALLERGY_PARAMS,

  // Эти классы — обычно одиночные тесты без сопутствующих параметров
  'MICRO':       [],
  'PANEL.MICRO': [],
  'MOLPATH':     [],
  'MOLPATH.MUT': [],
  'ABXBACT':     [],
  'DRUG/TOX':    [],
  'BLDBK':       [],
  'SPEC':        [],
  'PATH':        [],

  'DEFAULT':     CHEM_PARAMS,
};

// ────────────────────────────────────────────────────────────────────────────
// Параметры для ОСНОВНОГО теста по типу шкалы
// ────────────────────────────────────────────────────────────────────────────

// Когда основной тест количественный — для него нужно подобрать какой-то
// правдоподобный диапазон. Берём по классу LOINC.
const MAIN_QN_RANGES_BY_CLASS = {
  'HEM/BC':      { low: 4.0, high: 10.0, unit: 'x10^9/L',  decimals: 1 },
  'HEM':         { low: 4.0, high: 10.0, unit: 'x10^9/L',  decimals: 1 },
  'COAG':        { low: 25,  high: 35,   unit: 'sec',       decimals: 1 },
  'CHEM':        { low: 3.9, high: 6.1,  unit: 'mmol/L',    decimals: 2 },
  'PANEL.CHEM':  { low: 3.9, high: 6.1,  unit: 'mmol/L',    decimals: 2 },
  'UA':          { low: 1.005,high:1.030,unit: '',           decimals: 3 },
  'SERO':        { low: 0,   high: 5,    unit: 'mg/L',      decimals: 2 },
  'ALLERGY':     { low: 0,   high: 0.35, unit: 'kU/L',      decimals: 2 },
  'DRUG/TOX':    { low: 0,   high: 100,  unit: 'ng/mL',     decimals: 1 },
  'MICRO':       { low: 0,   high: 1.0,  unit: 'index',     decimals: 2 },
  'PANEL.MICRO': { low: 0,   high: 1.0,  unit: 'index',     decimals: 2 },
  'DEFAULT':     { low: 0,   high: 100,  unit: 'U/L',       decimals: 1 },
};

const QUAL_VALUES = ['Negative', 'Positive', 'Not detected', 'Detected', 'Reactive', 'Non-reactive'];
const ABNORMAL_QUAL = new Set(['Positive', 'Detected', 'Reactive']);

// ────────────────────────────────────────────────────────────────────────────
// Генерация
// ────────────────────────────────────────────────────────────────────────────

function randomDate() {
  const d = randInt(1, 28), m = randInt(1, 12), y = randInt(2021, 2024);
  return `${String(d).padStart(2,'0')}.${String(m).padStart(2,'0')}.${y}`;
}

function statusFromRange(val, refRange) {
  // Нестандартные форматы реф-диапазона
  if (!refRange.includes(' - ')) return 'In Range';
  const parts = refRange.split(' - ').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return 'In Range';
  return val < parts[0] ? 'LOW' : val > parts[1] ? 'HIGH' : 'In Range';
}

function generateMainParam(testName, scaleTyp, cls) {
  // Качественный результат
  if (['Ord', 'Nom', 'OrdQn'].includes(scaleTyp)) {
    const val = pick(QUAL_VALUES);
    const status = ABNORMAL_QUAL.has(val) ? 'ABNORMAL' : 'In Range';
    return { name: testName, result: val, unit: '', refRange: 'See report', status };
  }

  // Полу-количественный — титр
  if (scaleTyp === 'SemiQn') {
    const titer = pick(['<1:10', '1:20', '1:40', '1:80', '1:160', '1:320']);
    const status = titer === '<1:10' ? 'In Range' : 'ABNORMAL';
    return { name: testName, result: titer, unit: '', refRange: '< 1:10', status };
  }

  // Количественный — берём диапазон по классу
  const range = MAIN_QN_RANGES_BY_CLASS[cls] ?? MAIN_QN_RANGES_BY_CLASS['DEFAULT'];
  const { low, high, unit, decimals } = range;

  const inRange = Math.random() < 0.7;
  let val;
  if (inRange) {
    val = rand(low, high, decimals);
  } else {
    const dev = (high - low) * rand(0.1, 0.4, 2);
    val = Math.random() < 0.5
      ? Math.max(0, +(low - dev).toFixed(decimals))
      : +(high + dev).toFixed(decimals);
  }
  return {
    name: testName,
    result: String(val),
    unit,
    refRange: `${low} - ${high}`,
    status: statusFromRange(val, `${low} - ${high}`),
  };
}

function generateExtraParams(cls, count) {
  const pool = EXTRA_BY_CLASS[cls] ?? EXTRA_BY_CLASS['DEFAULT'];
  if (!pool || pool.length === 0) return [];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, pool.length));

  return selected.map(p => {
    const val = p.result();
    // Может быть число или строка (для Ketones, Color и т.д.)
    if (typeof val === 'number') {
      return {
        name: p.param,
        result: String(val),
        unit: p.unit,
        refRange: p.refRange,
        status: statusFromRange(val, p.refRange),
      };
    } else {
      return {
        name: p.param,
        result: val,
        unit: p.unit,
        refRange: p.refRange,
        status: val === 'Negative' || val === 'Yellow' || val === 'Light yellow' || val === 'Straw'
          ? 'In Range' : 'In Range', // для качественных доп. — всегда In Range
      };
    }
  });
}

function pickSampleType(cls) {
  const list = SAMPLE_TYPES_BY_CLASS[cls] ?? SAMPLE_TYPES_BY_CLASS['DEFAULT'];
  return pick(list);
}

// ────────────────────────────────────────────────────────────────────────────
// Главная функция
// ────────────────────────────────────────────────────────────────────────────

export function buildReportData(rawTestName, scaleTyp, cls) {
  const safeCls = cls || 'DEFAULT';
  const pool = EXTRA_BY_CLASS[safeCls] ?? EXTRA_BY_CLASS['DEFAULT'];
  // Количество доп. параметров — 0–3, но не больше чем есть в пуле
  const maxExtra = Math.min(3, pool.length);
  const nExtra = maxExtra === 0 ? 0 : randInt(0, maxExtra);

  const params = [
    generateMainParam(rawTestName, scaleTyp, safeCls),
    ...generateExtraParams(safeCls, nExtra),
  ];

  return {
    lab:        pick(LABS),
    reportNo:   `LAB-${randInt(100000, 999999)}`,
    reportDate: randomDate(),
    patientId:  `PT-${randInt(10000, 99999)}`,
    sampleId:   `S-${randInt(1000, 9999)}`,
    sampleType: pickSampleType(safeCls),
    collection: randomDate(),
    physician:  pick(DOCTORS),
    testClass:  safeCls,
    parameters: params,
  };
}