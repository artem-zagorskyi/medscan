const NOISE = new Set([
  // Технические термины LOINC
  'point in time','random','quantitative','qualitative','ordinal','nominal',
  'narrative','qnt','quan','quant','ql','qual','semiqn','document',
  'p prime','r prime','s prime','i prime','identifier','identity or presence',
  'to be specified in another part of the message',
  
  // Категории и панели
  'chemistry','hematology','serology','microbiology','molecular genetics',
  'molecular pathology','genetics','panel','screen','susceptibility',
  'susceptibilty','susceptibilities','suscept','mutations','mutation','mut anl',
  'antibiotic susceptibilities','infectiousdisease','infectious disease',
  'dna nucleic acid probe','3 self-sustaining sequence replication','3sr sr',
  
  // Классы LOINC
  'molpath','molpath.mut','molpath.mutations','blood bank','bldbk',
  'drug/toxicology','drug/tox','panel.microbiology','panel.micro','panel.chem',
  'panel.chemistry','abxbact','allergy','sero','micro','coag','chem','spec',
  
  // Материалы / типы образцов
  'whole blood','blood','serum','plasma','urine','tissue','tissue, unspecified',
  'tissue unspecified','bone marrow','marrow (bone)','spinal fl','spinal fluid',
  'ur','bld','wb','ser','plas','serpl','serplas','ur+serpl','serum or plasma',
  'bld/tiss','isolate','specimen','stool','saliva','exhl gas','breath',
  
  // Общие иммуно-категории
  'antby','antibody','antibodies','autoantibody','autoantibodies',
  'immune globulin g','immune globulin a','immune globulin m','immune globulin e',
  'immunoglobulin g','immunoglobulin a','immunoglobulin m','immunoglobulin e',
  'immune blot','immunoblot','west blot','west blt','western blot',
  'enzyme immunoassay','hem','imm','nr','pot',
  
  // Болезни / симптомы (это не названия тестов)
  'chagas disease','whooping cough','cryptococcosis','filariasis',
  'trypanosomiasis','schistosomiasis','bilharziasis','avian chlamydiosis',
  'cercarial dermatitis','myasthenia gravis','pyridoxine-dependent epilepsy',
  'paraneoplastic neurological syndrome','bowel movement','blood fluke',
  'addiction','illicit',
  
  // Слишком общие слова
  'species','allergens','right','left','level','activ','kinetics','volatiles',
  'finding','findings','report','observation','test','arbitrary concentration',
  'collection supervision level','spec collect supervision level',
  'speccollectsupervisionlevel',


  'various', 'specimen', 'unspecified', 'other', 'miscellaneous',
'unknown', 'not specified', 'see report', 'not applicable',
'multiple', 'mixed', 'combined', 'general', 'specimen-source', 'specimen source', 'speci'
,'specimen sou', 'source'
]);

const GENERIC_WORDS = new Set([
  'various', 'specimen', 'unspecified', 'other', 'miscellaneous',
  'unknown', 'multiple', 'mixed', 'combined', 'general', 'right',
  'left', 'level', 'result', 'value', 'test', 'sample', 'source',
]);


function isGoodSynonym(s) {
  // Слишком короткое
  if (s.length < 4) return false;
  
  // Слишком длинное (это уже описание а не название)
  if (s.length > 80) return false;
  
  // Только одно слово и оно короче 5 букв — скорее всего мусор
  if (!s.includes(' ') && s.length < 5) return false;
  
  // Содержит цифры или медицинские паттерны — хорошо
  // (Hgb, ALT, IgG, 24h, kD, pH и т.д.)
  const hasMedicalPattern = /\d|IgG|IgM|IgA|IgE|Ab|Ag|RNA|DNA|PCR|pH|kD|ng|mg|mL/i.test(s);
  if (hasMedicalPattern) return true;
  
  // Содержит типичные медлаб слова — хорошо
  const medWords = [
    'acid', 'alb', 'albumin', 'alk', 'amino', 'amylase', 'antigen',
    'antibody', 'bilirubin', 'blood', 'calcium', 'chloride', 'chol',
    'creatinine', 'culture', 'enzyme', 'ferritin', 'fibrinogen',
    'gene', 'globulin', 'glucose', 'hemo', 'hemoglobin', 'hepatitis',
    'hormone', 'immuno', 'insulin', 'iron', 'lactate', 'leuko',
    'lipase', 'lymph', 'magnesium', 'mono', 'neutro', 'panel',
    'phosphate', 'platelet', 'potassium', 'protein', 'serum',
    'sodium', 'thyroid', 'transferase', 'troponin', 'urea', 'urine',
    'vitamin', 'virus', 'test', 'assay', 'count', 'ratio', 'index',
    'screen', 'analysis', 'mut', 'anl', 'susc', 'islt',
  ];
  const lower = s.toLowerCase();
  if (medWords.some(w => lower.includes(w))) return true;
  
  // Выглядит как аббревиатура лабораторного теста (2-8 заглавных букв)
  if (/^[A-Z]{2,8}$/.test(s)) return true;
  
  // Содержит типичные суффиксы лабораторных сокращений
  if (/\b(Ser|Plas|Bld|Ur|Tiss|Islt|Ql|Qn|IA|IB|Ab|Ag|Pnl)\b/.test(s)) return true;

  // Одиночное общее слово без медицинского контекста — скорее мусор
  const genericWords = new Set([
    'various', 'specimen', 'unspecified', 'other', 'miscellaneous',
    'unknown', 'multiple', 'mixed', 'combined', 'general', 'right',
    'left', 'level', 'result', 'value', 'sample', 'source', 'method',
    'finding', 'findings', 'report', 'observation', 'comment',
    'service', 'type', 'color', 'colour', 'appearance', 'status',
    'random', 'routine', 'stat', 'urgent', 'normal', 'abnormal',
    'positive', 'negative', 'reactive', 'detected', 'present',
  ]);
  if (genericWords.has(lower)) return false;

  // По умолчанию — пропускаем если больше одного слова
  // (скорее всего реальное название теста)
  if (s.includes(' ')) return true;

  // Одиночное слово длиннее 6 букв — вероятно реальный термин
  if (s.length >= 6) return true;

  return false;
}

function looksLikeTechCode(s) {
  // Технические коды вроде CMC1, HEL-216, BRCA1 — только заглавные/цифры
  return /^[A-Z0-9\-\.]+$/.test(s) && s.length < 10;
}

function cleanRelatedNames(raw) {
  if (!raw) return [];
  return raw
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      const lower = s.toLowerCase().trim();
      if (s.length < 4) return false;
      if (s.length > 60) return false;          
      if (NOISE.has(lower)) return false;
      if (looksLikeTechCode(s)) return false;
      if (!s.includes(' ') && s.length < 5) return false;
      if (!isGoodSynonym(s)) return false;
      return true;
    }).filter(s => !GENERIC_WORDS.has(s.toLowerCase()))
}

function generateVariants(name) {
  if (!name || name.length < 4) return [];
  const variants = [];
  variants.push(name.toUpperCase());
  variants.push(name.toLowerCase());

  if (name.length > 6) {
    variants.push(name.slice(0, -2) + '.');
    variants.push(name.slice(0, -3));
  }

  if (name.includes(' ')) {
    variants.push(name.replace(/ /g, '-'));
    variants.push(name.replace(/ /g, ''));
  }

  // Опечатка: пропустить букву в середине
  const mid = Math.floor(name.length / 2);
  variants.push(name.slice(0, mid) + name.slice(mid + 1));

  return variants.filter(v => v.length > 3);
}

export function getAllNameVariants(row) {
  const variants = new Set();

  const candidates = [row.SHORTNAME, row.CONSUMER_NAME, row.COMPONENT];
  for (const c of candidates) {
    if (!c) continue;
    const trimmed = c.trim();
    if (trimmed.length < 4) continue;
    if (trimmed.length > 60) continue;
    if (NOISE.has(trimmed.toLowerCase())) continue;  
    variants.add(trimmed);
  }

  cleanRelatedNames(row.RELATEDNAMES2).forEach(s => variants.add(s));

  for (const base of candidates) {
    if (base) generateVariants(base.trim()).forEach(v => {
      if (!NOISE.has(v.toLowerCase())) variants.add(v);   
    });
  }

  return [...variants].filter(v => v.length > 3);
}