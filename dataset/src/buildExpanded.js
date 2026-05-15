import fs from 'fs';
import path from 'path';
import readline from 'readline';

// ─────────────────────────────────────────────
// ПУТИ — поменяй под свои
// ─────────────────────────────────────────────
const INPUT_DIR    = './data/';
const SYNONYMS_JSON = './data/synonyms_clean.json';
const OUTPUT_DIR   = './output/dataset_output';

const LABEVENTS_FILE = path.join(INPUT_DIR, 'LABEVENTS.csv');
const OUTPUT_FILE    = path.join(OUTPUT_DIR, 'expanded_dataset.csv');

// ─────────────────────────────────────────────
// Парсинг CSV-строки с кавычками
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

const csvEscape = v => {
  const s = v === null || v === undefined ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
};

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Грузим очищенные синонимы
  console.log('1/2  Загружаем synonyms_clean.json...');
  const synonymsList = JSON.parse(fs.readFileSync(SYNONYMS_JSON, 'utf8'));

  // Оставляем только те у кого есть LOINC и хотя бы 1 синоним
  const itemMeta = {};
  for (const item of synonymsList) {
    if (item.loinc_code && item.synonyms && item.synonyms.length > 0) {
      itemMeta[item.itemid] = {
        mimic_label:  item.mimic_label,
        common_name:  item.official_name,  // LONG_COMMON_NAME из LOINC
        category:     item.category,
        fluid:        item.fluid,
        synonyms:     item.synonyms,
      };
    }
  }
  console.log(`   Тестов с LOINC и синонимами: ${Object.keys(itemMeta).length}`);

  // 2. Читаем LABEVENTS и пишем сразу в выходной файл (потоково)
  console.log('2/2  Читаем LABEVENTS и разворачиваем по синонимам...');

  const headers = [
    'mimic_label','common_name','unofficial_name',
    'category','fluid',
    'value','valuenum','unit','flag'
  ];

  const out = fs.createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });
  out.write(headers.join(',') + '\n');

  const rl = readline.createInterface({
    input: fs.createReadStream(LABEVENTS_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let csvHeaders = null;
  let measurements = 0;
  let skipped = 0;
  let totalRows = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    if (!csvHeaders) { csvHeaders = cols; continue; }

    const row = {};
    csvHeaders.forEach((h, i) => row[h] = (cols[i] ?? '').trim());

    const meta = itemMeta[row.itemid];
    if (!meta) { skipped++; continue; }

    measurements++;

    // Перебираем все синонимы — каждый даёт отдельную строку
    for (const syn of meta.synonyms) {
      const outRow = [
        meta.mimic_label,
        meta.common_name,
        syn,
        meta.category,
        meta.fluid,
        row.value,
        row.valuenum,
        row.valueuom,
        row.flag || '',
      ];
      out.write(outRow.map(csvEscape).join(',') + '\n');
      totalRows++;
    }
  }

  await new Promise(resolve => out.end(resolve));

  // Размер файла
  const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1);

  console.log('\n═══════════════════════════════');
  console.log('ГОТОВО:');
  console.log(`  Измерений использовано:        ${measurements}`);
  console.log(`  Измерений пропущено (без LOINC): ${skipped}`);
  console.log(`  Строк в итоговом CSV:           ${totalRows}`);
  console.log(`  Раздувание на одно измерение:   ${(totalRows/measurements).toFixed(1)}x`);
  console.log(`  Размер файла:                   ${sizeMB} MB`);
  console.log(`  Выходной файл:                  ${OUTPUT_FILE}`);
  console.log('═══════════════════════════════');
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
