import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const INPUT_PATH    = './output/dataset.csv';
const OUTPUT_PATH   = './output/dataset_uk.csv';
const CACHE_PATH    = './output/translation_cache.json';
const OLLAMA_URL = 'http://127.0.0.1:11434/api/generate';
const MODEL         = 'gemma3:4b';

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv;
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? parseInt(args[i + 1]) : null;
};
const LIMIT = getArg('--limit');

// ── Кеш переводов ───────────────────────────────────────────────────────────
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  console.log(`Loaded cache: ${Object.keys(cache).length} entries`);
}

const DOCTORS_UK = {
  'Dr. M. Schneider': 'Лікар М. Шнайдер',
  'Dr. K. Hoffmann':  'Лікар К. Гофман',
  'Dr. A. Weber':     'Лікар А. Вебер',
  'Dr. J. Fischer':   'Лікар Й. Фішер',
  'Dr. S. Müller':    'Лікар С. Мюллер',
  'Dr. L. Bauer':     'Лікар Л. Бауер',
};

function saveCache() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

Object.assign(cache, DOCTORS_UK);
saveCache();

// ── Вызов Ollama ────────────────────────────────────────────────────────────
import https from 'https';
import http from 'http';

async function callOllama(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model:  MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 200 },
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port:     11434,
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



// ── Перевод одной строки с кешем ────────────────────────────────────────────
async function translate(text) {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (cache[trimmed]) return cache[trimmed];

  const prompt = `Translate the following English medical laboratory text into Ukrainian. Output ONLY the translation, no explanation, no quotes, no extra text. If the text is a proper noun, abbreviation, or code, keep it as is.

Text: ${trimmed}

Ukrainian translation:`;

  try {
    let result = await callOllama(prompt);
    // Чистка: убираем кавычки и префиксы которые модель иногда добавляет
    result = result.replace(/^["'«»]|["'«»]$/g, '').trim();
    result = result.replace(/^(Translation|Переклад|Ukrainian):\s*/i, '').trim();

    cache[trimmed] = result;
    return result;
  } catch (e) {
    console.error(`  Error translating "${trimmed}": ${e.message}`);
    return text;
  }
}

// ── Перевод объекта report_data ─────────────────────────────────────────────
async function translateReportData(data) {
  // Переводим только текстовые поля, оставляем ID, даты, числа
  data.lab        = await translate(data.lab);
  data.sampleType = await translate(data.sampleType);

  data.physician = await translate(data.physician);

  for (const p of data.parameters) {
    p.name = await translate(p.name);

    // result: переводим только если это качественное значение (не число)
    if (isNaN(parseFloat(p.result))) {
      p.result = await translate(p.result);
    }

    p.status = await translate(p.status);
    if (p.refRange && isNaN(parseFloat(p.refRange)) && p.refRange !== 'See report') {
      p.refRange = await translate(p.refRange);
    } else if (p.refRange === 'See report') {
      p.refRange = 'Див. звіт';  // просто захардкодь — это фиксированная фраза
    }
  }

  return data;
}

// ── Основной цикл ───────────────────────────────────────────────────────────
async function main() {
  console.log('Loading dataset...');
  const raw = fs.readFileSync(INPUT_PATH, 'utf-8');
  let records = parse(raw, { columns: true, skip_empty_lines: true });
  console.log(`Records: ${records.length}`);

  if (LIMIT) {
    records = records.slice(0, LIMIT);
    console.log(`Limited to: ${records.length}`);
  }

  // Проверка что Ollama жива
  try {
    await callOllama('Say OK');
    console.log('Ollama connection OK\n');
   } catch (e) {
     console.error(`Cannot reach Ollama at ${OLLAMA_URL}`);
     console.error(`Error: ${e.message}`);
     console.error(`Make sure 'ollama serve' is running and '${MODEL}' is pulled`);
     process.exit(1);
   }

  const translated = [];
  const startTime = Date.now();

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];

    // Текстовые поля верхнего уровня
    const new_raw_test_name = await translate(rec.raw_test_name);
    const new_long_name     = await translate(rec.long_name);
    const new_component     = await translate(rec.component);

    // JSON-данные внутри report_data
    let new_report_data = rec.report_data;
    try {
      const parsed    = JSON.parse(rec.report_data);
      const translatedData = await translateReportData(parsed);
      new_report_data = JSON.stringify(translatedData);
    } catch (e) {
      console.error(`  JSON parse error on record ${i}: ${e.message}`);
    }

    translated.push({
      loinc_num:     rec.loinc_num,
      raw_test_name: new_raw_test_name,
      long_name:     new_long_name,
      class:         rec.class,
      component:     new_component,
      system:        rec.system,
      scale_typ:     rec.scale_typ,
      report_data:   new_report_data,
    });

    // Прогресс и периодическое сохранение
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate    = ((i + 1) / elapsed).toFixed(2);
    const eta     = ((records.length - i - 1) / rate).toFixed(0);
    const pct     = (((i + 1) / records.length) * 100).toFixed(1);
    const cacheSize = Object.keys(cache).length;

    process.stdout.write(
      `\r[${pct}%] ${i + 1}/${records.length}  |  ${rate} rec/s  |  ETA ${eta}s  |  кеш: ${cacheSize}    `
    );

    if ((i + 1) % 100 === 0) {
      saveCache();
      fs.writeFileSync(OUTPUT_PATH, stringify(translated, { header: true }));
    }
  }

  

  saveCache();
  fs.writeFileSync(OUTPUT_PATH, stringify(translated, { header: true }));

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  process.stdout.write('\n');
  console.log(`\nДone in ${totalTime}s`);
  console.log(`Translated: ${translated.length} records`);
  console.log(`Cache size: ${Object.keys(cache).length} unique strings`);
  console.log(`Saved to: ${OUTPUT_PATH}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});