import fs from 'fs';
import path from 'path';
import readline from 'readline';

// ─────────────────────────────────────────────
// ПУТИ — поменяй под свои
// ─────────────────────────────────────────────
const INPUT_FILE  = './output/dataset_output/expanded_dataset.csv';
const OUTPUT_FILE = './output/dataset_output/unique_classes.csv';

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
  console.log(`Читаем ${INPUT_FILE}...`);

  const rl = readline.createInterface({
    input: fs.createReadStream(INPUT_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  // Считаем сколько раз встречается каждый common_name
  const counts = new Map();
  let headers = null;
  let commonNameIdx = -1;
  let totalRows = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCSVLine(line);
    if (!headers) {
      headers = cols;
      commonNameIdx = headers.indexOf('common_name');
      if (commonNameIdx === -1) {
        console.error('Колонка common_name не найдена!');
        process.exit(1);
      }
      continue;
    }
    const name = cols[commonNameIdx];
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
    totalRows++;
  }

  console.log(`Прочитано строк: ${totalRows}`);
  console.log(`Уникальных классов: ${counts.size}`);

  // Сортируем по убыванию частоты
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  // Пишем результат
  const lines = ['class_id,common_name,count'];
  sorted.forEach(([name, count], i) => {
    lines.push(`${i + 1},${csvEscape(name)},${count}`);
  });

  fs.writeFileSync(OUTPUT_FILE, lines.join('\n'), 'utf8');
  console.log(`Сохранено: ${OUTPUT_FILE}`);

  // Топ-10 для проверки
  console.log('\nТоп-10 самых частых классов:');
  sorted.slice(0, 10).forEach(([name, count], i) => {
    console.log(`  ${i + 1}. (${count}) ${name}`);
  });
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
