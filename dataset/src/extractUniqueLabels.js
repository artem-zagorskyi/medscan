import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const INPUT_PATH  = './output/dataset.csv';
const OUTPUT_PATH = './output/unique_labels.csv';

const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
const records = parse(raw, { columns: true, skip_empty_lines: true });
console.log(`Total records: ${records.length}`);

// Считаем сколько раз встречается каждый long_name
const counts = new Map();
for (const rec of records) {
  const key = rec.long_name;
  counts.set(key, (counts.get(key) || 0) + 1);
}

console.log(`Unique long_name values: ${counts.size}`);

// Сортируем по частоте — редкие классы снизу
const rows = [...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([long_name, count]) => ({ long_name, count }));

// Статистика
const singletons = rows.filter(r => r.count === 1).length;
const rare       = rows.filter(r => r.count < 5).length;
console.log(`Classes with only 1 example: ${singletons}`);
console.log(`Classes with < 5 examples:   ${rare}`);
console.log(`Top 10 most frequent:`);
rows.slice(0, 10).forEach(r => console.log(`  ${r.count}x  ${r.long_name}`));

fs.writeFileSync(OUTPUT_PATH, stringify(rows, { header: true }));
console.log(`\nSaved to ${OUTPUT_PATH}`);