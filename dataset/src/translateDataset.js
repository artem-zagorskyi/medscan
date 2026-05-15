import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import http from 'http';

const INPUT_PATH  = './output/dataset_output/expanded_dataset.csv';
const OUTPUT_PATH = './output/dataset_output/dataset_uk.csv';
const CACHE_PATH  = './output/translation_cache.json';
const MODEL       = 'gemma3:27b';

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv;
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? parseInt(args[i + 1]) : null;
};
const LIMIT = getArg('--limit');

// ── Кеш перекладів ───────────────────────────────────────────────────────────
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  console.log(`Loaded cache: ${Object.keys(cache).length} entries`);
}

// Захардкоджені значення — щоб не гонити через модель
const FIXED_TRANSLATIONS = {
  'Blood':       'Кров',
  'Urine':       'Сеча',
  'CSF':         'СМР',
  'Chemistry':   'Хімія',
  'Hematology':  'Гематологія',
  'Coagulation': 'Коагуляція',
  'abnormal':    'аномальний',
  'normal':      'нормальний',
  'critical':    'критичний',
};
Object.assign(cache, FIXED_TRANSLATIONS);

function saveCache() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}
saveCache();

// ── Виклик Ollama ────────────────────────────────────────────────────────────
async function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:  MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 200 },
    });

    const req = http.request({
      hostname: '194.68.245.82',
      port:     22188,
      path:     '/api/generate',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.response.trim());
        } catch (e) {
          reject(new Error(`Parse error: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Переклад одного рядка з кешем ────────────────────────────────────────────
async function translate(text) {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (cache[trimmed] !== undefined) return cache[trimmed];

  // Якщо це аббревіатура (всі великі або короткий код) — лишаємо як є
  if (/^[A-Z0-9\-\.\/\[\]<>]+$/.test(trimmed) && trimmed.length <= 6) {
    cache[trimmed] = trimmed;
    return trimmed;
  }

  const prompt = `Translate the following English medical laboratory text into Ukrainian. Output ONLY the translation, no explanation, no quotes, no extra text. If the text is a proper noun, abbreviation, or short code, keep it as is.

Text: ${trimmed}

Ukrainian translation:`;

  try {
    let result = await callOllama(prompt);
    // Чистимо зайві лапки і префікси які модель іноді додає
    result = result.replace(/^["'«»]|["'«»]$/g, '').trim();
    result = result.replace(/^(Translation|Переклад|Ukrainian translation):\s*/i, '').trim();

    cache[trimmed] = result;
    return result;
  } catch (e) {
    console.error(`\n  Error translating "${trimmed}": ${e.message}`);
    return text; // fallback — оригінал
  }
}

// ── Основний цикл ────────────────────────────────────────────────────────────
async function main() {
  console.log('Loading dataset...');
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  let records = parse(raw, { columns: true, skip_empty_lines: true });
  console.log(`Records: ${records.length}`);

  if (LIMIT) {
    records = records.slice(0, LIMIT);
    console.log(`Limited to: ${records.length}`);
  }

  // Перевірка що Ollama жива
  try {
    await callOllama('Say OK');
    console.log('Ollama connection OK\n');
  } catch (e) {
    console.error(`Cannot reach Ollama at http://127.0.0.1:11434`);
    console.error(`Error: ${e.message}`);
    console.error(`Make sure 'ollama serve' is running and '${MODEL}' is pulled`);
    process.exit(1);
  }

  const translated = [];
  const startTime = Date.now();

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    // Перекладаємо текстові поля
    const new_mimic_label     = await translate(rec.mimic_label);
    const new_common_name     = await translate(rec.common_name);
    const new_unofficial_name = await translate(rec.unofficial_name);
    const new_category        = await translate(rec.category);
    const new_fluid           = await translate(rec.fluid);
    const new_flag            = rec.flag ? await translate(rec.flag) : '';

    // Числа та одиниці — залишаємо без змін
    translated.push({
      mimic_label:    new_mimic_label,
      common_name:    new_common_name,
      unofficial_name: new_unofficial_name,
      category:       new_category,
      fluid:          new_fluid,
      value:          rec.value,
      valuenum:       rec.valuenum,
      unit:           rec.unit,   // mEq/L, mg/dL тощо — не перекладаємо
      flag:           new_flag,
    });

    // Прогрес і збереження кожні 100 записів
    const elapsed  = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate     = ((i + 1) / elapsed).toFixed(2);
    const eta      = ((records.length - i - 1) / rate).toFixed(0);
    const pct      = (((i + 1) / records.length) * 100).toFixed(1);
    const cacheSize = Object.keys(cache).length;

    process.stdout.write(
      `\r[${pct}%] ${i + 1}/${records.length}  |  ${rate} rec/s  |  ETA ${eta}s  |  cache: ${cacheSize}    `
    );

    if ((i + 1) % 1000 === 0) {
      saveCache();
      fs.writeFileSync(OUTPUT_PATH, stringify(translated, { header: true }));
    }
  }

  saveCache();
  fs.writeFileSync(OUTPUT_PATH, stringify(translated, { header: true }));

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  process.stdout.write('\n');
  console.log(`\nDone in ${totalTime}s`);
  console.log(`Translated: ${translated.length} records`);
  console.log(`Cache size: ${Object.keys(cache).length} unique strings`);
  console.log(`Saved to: ${OUTPUT_PATH}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
