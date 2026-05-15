import fs from 'fs';
import path from 'path';
import readline from 'readline';

// ─────────────────────────────────────────────
// ПУТИ — поменяй под свою папку
// ─────────────────────────────────────────────
const INPUT_DIR  = './data/';
const LOINC_FILE = './data/Loinc.csv';   // <-- поменяй на свой путь
const OUTPUT_DIR = './output/dataset_output/';

const D_LABITEMS_FILE = path.join(INPUT_DIR, 'D_LABITEMS.csv');
const LABEVENTS_FILE  = path.join(INPUT_DIR, 'LABEVENTS.csv');

// ─────────────────────────────────────────────
// Утилита: парсинг CSV-строки с учётом кавычек
// ─────────────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

// ─────────────────────────────────────────────
// Читаем CSV построчно → массив объектов
// ─────────────────────────────────────────────
async function readCSV(filePath, onRow, maxRows = Infinity) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });
  let headers = null;
  let count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    if (!headers) { headers = cols; continue; }
    if (count >= maxRows) break;
    const row = {};
    headers.forEach((h, i) => row[h] = (cols[i] ?? '').replace(/^"|"$/g, '').trim());
    onRow(row);
    count++;
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('1/4  Читаем D_LABITEMS...');
  const items = {};   // itemid → { itemid, label, fluid, category, loinc_code }
  await readCSV(D_LABITEMS_FILE, row => {
    items[row.itemid] = {
      itemid:     row.itemid,
      label:      row.label,
      fluid:      row.fluid,
      category:   row.category,
      loinc_code: row.loinc_code,
    };
  });
  console.log(`   Загружено тестов: ${Object.keys(items).length}`);

  // ─────────────────────────────────────────────
  console.log('2/4  Читаем LABEVENTS (сбор результатов)...');
  const results = {};  // itemid → [{value, valuenum, valueuom, flag}]
  const MAX_RESULTS_PER_ITEM = 50;

  await readCSV(LABEVENTS_FILE, row => {
    const id = row.itemid;
    if (!items[id]) return;
    if (!results[id]) results[id] = [];
    if (results[id].length >= MAX_RESULTS_PER_ITEM) return;
    results[id].push({
      value:    row.value,
      valuenum: row.valuenum !== '' ? parseFloat(row.valuenum) : null,
      unit:     row.valueuom,
      flag:     row.flag || null,
      time:     row.charttime,
    });
  });
  console.log(`   Собраны результаты для ${Object.keys(results).length} тестов`);

  // ─────────────────────────────────────────────
  console.log('3/4  Читаем Loinc.csv (ищем совпадения по коду)...');

  // Собираем все LOINC-коды которые нам нужны
  const neededLoinc = new Set(
    Object.values(items).map(i => i.loinc_code).filter(Boolean)
  );
  console.log(`   Нужно найти LOINC-записей: ${neededLoinc.size}`);

  const loincData = {};  // loinc_num → { long_name, short_name, consumer_name, synonyms[], description, units, display_name }

  await readCSV(LOINC_FILE, row => {
    const code = row['LOINC_NUM'];
    if (!neededLoinc.has(code)) return;

    // Синонимы из RELATEDNAMES2 — разделены "; "
    const synonyms = (row['RELATEDNAMES2'] || '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 1 && s.length < 100);

    loincData[code] = {
      long_name:     row['LONG_COMMON_NAME']   || '',
      short_name:    row['SHORTNAME']           || '',
      consumer_name: row['CONSUMER_NAME']       || '',
      display_name:  row['DisplayName']         || '',
      synonyms,
      description:   row['DefinitionDescription'] || '',
      units:         row['EXAMPLE_UNITS']       || '',
    };
  });
  console.log(`   Найдено LOINC-записей: ${Object.keys(loincData).length}`);

  // ─────────────────────────────────────────────
  console.log('4/4  Собираем финальный датасет...');

  const dataset = [];

  for (const [itemid, item] of Object.entries(items)) {
    const loinc  = loincData[item.loinc_code] || null;
    const res    = results[itemid] || [];

    // Официальное название: предпочитаем LOINC long_name, иначе MIMIC label
    const official_name = loinc?.long_name || item.label;

    // Собираем все варианты названий (дедупликация)
    const namesSet = new Set();
    namesSet.add(item.label);
    if (loinc) {
      if (loinc.long_name)     namesSet.add(loinc.long_name);
      if (loinc.short_name)    namesSet.add(loinc.short_name);
      if (loinc.consumer_name) namesSet.add(loinc.consumer_name);
      if (loinc.display_name)  namesSet.add(loinc.display_name);
      loinc.synonyms.forEach(s => namesSet.add(s));
    }
    // Убираем пустые и слишком короткие
    const all_names = [...namesSet].filter(n => n && n.length > 1);

    // Единицы: из LOINC или из реальных данных
    const units = loinc?.units
      || (res.find(r => r.unit)?.unit)
      || '';

    // Статистика по результатам
    const nums = res.map(r => r.valuenum).filter(v => v !== null && !isNaN(v));
    const value_min  = nums.length ? Math.min(...nums) : null;
    const value_max  = nums.length ? Math.max(...nums) : null;
    const value_mean = nums.length
      ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
      : null;

    dataset.push({
      itemid,
      loinc_code:    item.loinc_code || '',
      official_name,
      mimic_label:   item.label,
      category:      item.category,
      fluid:         item.fluid,
      all_names:     JSON.stringify(all_names),
      description:   loinc?.description || '',
      units,
      value_min,
      value_max,
      value_mean,
      results_count: res.length,
      results:       JSON.stringify(res),
    });
  }

  console.log(`   Всего записей в датасете: ${dataset.length}`);

  // ─────────────────────────────────────────────
  // Сохраняем dataset.csv
  // ─────────────────────────────────────────────
  const csvHeaders = [
    'itemid','loinc_code','official_name','mimic_label',
    'category','fluid','all_names','description',
    'units','value_min','value_max','value_mean',
    'results_count','results'
  ];

  const csvEscape = v => {
    const s = v === null || v === undefined ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const csvLines = [
    csvHeaders.join(','),
    ...dataset.map(row => csvHeaders.map(h => csvEscape(row[h])).join(','))
  ];

  fs.writeFileSync(path.join(OUTPUT_DIR, 'dataset.csv'), csvLines.join('\n'), 'utf8');
  console.log('   ✓ dataset.csv сохранён');

  // ─────────────────────────────────────────────
  // Сохраняем classes.json
  // ─────────────────────────────────────────────
  const classesMap = {};  // category → [{ itemid, mimic_label, loinc_code, all_names_count }]

  for (const row of dataset) {
    const cat = row.category || 'Unknown';
    if (!classesMap[cat]) classesMap[cat] = [];
    classesMap[cat].push({
      itemid:          row.itemid,
      mimic_label:     row.mimic_label,
      official_name:   row.official_name,
      loinc_code:      row.loinc_code,
      all_names_count: JSON.parse(row.all_names).length,
      results_count:   row.results_count,
    });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'classes.json'),
    JSON.stringify(classesMap, null, 2),
    'utf8'
  );
  console.log('   ✓ classes.json сохранён');

  // ─────────────────────────────────────────────
  // Сохраняем categories.json
  // ─────────────────────────────────────────────
  const categories = Object.entries(classesMap).map(([name, classes]) => ({
    category:      name,
    total_classes: classes.length,
    with_loinc:    classes.filter(c => c.loinc_code).length,
    with_results:  classes.filter(c => c.results_count > 0).length,
    classes:       classes.map(c => c.mimic_label).sort(),
  })).sort((a, b) => b.total_classes - a.total_classes);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'categories.json'),
    JSON.stringify(categories, null, 2),
    'utf8'
  );
  console.log('   ✓ categories.json сохранён');

  // ─────────────────────────────────────────────
  // Итоговая статистика
  // ─────────────────────────────────────────────
  console.log('\n═══════════════════════════════');
  console.log('ГОТОВО. Статистика:');
  console.log(`  Всего тестов (классов):  ${dataset.length}`);
  console.log(`  С LOINC-кодом:           ${dataset.filter(r => r.loinc_code).length}`);
  console.log(`  С синонимами из LOINC:   ${dataset.filter(r => JSON.parse(r.all_names).length > 1).length}`);
  console.log(`  С реальными результатами:${dataset.filter(r => r.results_count > 0).length}`);
  console.log(`  Категорий:               ${categories.length}`);
  console.log(`  Выходная папка:          ${OUTPUT_DIR}`);
  console.log('═══════════════════════════════');
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
