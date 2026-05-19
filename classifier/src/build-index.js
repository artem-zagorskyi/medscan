import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
import { parse } from 'csv-parse/sync';
import Database from 'better-sqlite3';
import { config } from './config.js';
import { getEmbedding, generateKeywords } from './utils/ollama.js';
import { normalize, vectorToBuffer } from './utils/vector.js';

// Ключ дедупликации — поля які формують унікальний запис
function makeKey(record) {
  const norm = (s) => (s || '').toString().trim().toLowerCase();
  return [
    norm(record.unofficial_name),
    norm(record.category),
    norm(record.fluid),
    norm(record.unit),
  ].join('|');
}

// Форматування часу
function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hours = Math.floor(min / 60);
  const remMin = min % 60;
  const remSec = sec % 60;
  if (hours > 0) return `${hours}г ${remMin}м ${remSec}с`;
  if (min > 0) return `${min}м ${remSec}с`;
  return `${remSec}с`;
}

async function main() {
  console.log('=== Побудова векторного індексу (v3: SLM keywords + embedding) ===\n');

  // === 1. Читаємо train ===
  console.log(`Читання train: ${config.paths.train}`);
  const csvText = fs.readFileSync(config.paths.train, 'utf-8');
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  console.log(`  Рядків завантажено: ${records.length}`);

  // === 2. Дедуплікація ===
  console.log(`\nДедуплікація...`);
  const uniqueMap = new Map();
  for (const rec of records) {
    const key = makeKey(rec);
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { record: rec, count: 0 });
    }
    uniqueMap.get(key).count++;
  }
  const uniqueEntries = [...uniqueMap.values()];
  console.log(`  Унікальних комбінацій: ${uniqueEntries.length}`);

  // === 3. Підготовка SQLite ===
  const outputDir = path.dirname(config.paths.indexDb);
  fs.mkdirSync(outputDir, { recursive: true });

  if (fs.existsSync(config.paths.indexDb)) {
    fs.unlinkSync(config.paths.indexDb);
    console.log(`\nСтарий індекс видалено: ${config.paths.indexDb}`);
  }

  console.log(`\nСтворення БД: ${config.paths.indexDb}`);
  const db = new Database(config.paths.indexDb);

  db.exec(`
    CREATE TABLE embeddings (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      unofficial_name TEXT NOT NULL,
      common_name     TEXT NOT NULL,
      category        TEXT,
      fluid           TEXT,
      unit            TEXT,
      source_count    INTEGER NOT NULL,
      keywords        TEXT NOT NULL,
      embedding       BLOB NOT NULL
    );

    CREATE INDEX idx_common_name ON embeddings(common_name);

    CREATE TABLE meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Зберігаємо метадані побудови
  const insertMeta = db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)');
  insertMeta.run('embedding_model', config.ollama.embeddingModel);
  insertMeta.run('slm_model', config.ollama.slmModel);
  insertMeta.run('built_at', new Date().toISOString());
  insertMeta.run('source_records', String(records.length));
  insertMeta.run('unique_combinations', String(uniqueEntries.length));
  insertMeta.run('method', 'v3_slm_keywords');

  const insertEmbedding = db.prepare(`
    INSERT INTO embeddings 
      (unofficial_name, common_name, category, fluid, unit, source_count, keywords, embedding)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // === 4. Генеруємо ключові слова (SLM) + embeddings і пишемо в БД ===
  console.log(`\nІндексація ${uniqueEntries.length} комбінацій через ${config.ollama.url}`);
  console.log(`  Крок 1: генерація ключових слів (${config.ollama.slmModel})`);
  console.log(`  Крок 2: embedding (${config.ollama.embeddingModel})\n`);

  const startTime = Date.now();
  let processed = 0;
  let failed = 0;
  const failedEntries = [];

  for (const { record, count } of uniqueEntries) {
    try {
      // Крок 1: SLM генерує ключові слова
      const keywords = await generateKeywords(
        record.unofficial_name,
        record.category,
        record.fluid,
        record.unit
      );

      // Крок 2: Embedding від ключових слів
      const rawEmbedding = await getEmbedding(keywords);
      const normalized = normalize(rawEmbedding);
      const blob = vectorToBuffer(normalized);

      insertEmbedding.run(
        record.unofficial_name || '',
        record.common_name,
        record.category || null,
        record.fluid || null,
        record.unit || null,
        count,
        keywords,
        blob
      );

      processed++;
    } catch (err) {
      failed++;
      failedEntries.push({
        unofficial_name: record.unofficial_name,
        category: record.category,
        fluid: record.fluid,
        unit: record.unit,
        error: err.message,
      });
      console.error(`  ✗ "${record.unofficial_name}": ${err.message}`);
    }

    // Прогрес кожні 50 записів
    if ((processed + failed) % 50 === 0 || (processed + failed) === uniqueEntries.length) {
      const elapsed = Date.now() - startTime;
      const done = processed + failed;
      const rate = done / (elapsed / 1000);
      const remaining = uniqueEntries.length - done;
      const eta = remaining / rate * 1000;

      console.log(
        `  [${done}/${uniqueEntries.length}] ` +
        `${rate.toFixed(2)} rec/с | ` +
        `пройшло ${formatDuration(elapsed)} | ` +
        `залишилось ~${formatDuration(eta)}`
      );
    }
  }

  const totalTime = Date.now() - startTime;

  // === 5. Фінальний звіт ===
  console.log(`\n=== Готово ===`);
  console.log(`  Час: ${formatDuration(totalTime)}`);
  console.log(`  Успішно: ${processed}`);
  console.log(`  Помилок: ${failed}`);

  if (failed > 0) {
    const errorLog = path.join(outputDir, 'index_errors.json');
    fs.writeFileSync(errorLog, JSON.stringify(failedEntries, null, 2), 'utf-8');
    console.log(`  Лог помилок: ${errorLog}`);
  }

  // Розмір БД
  const stats = fs.statSync(config.paths.indexDb);
  console.log(`  Розмір БД: ${(stats.size / 1024 / 1024).toFixed(2)} МБ`);

  // Зберігаємо підсумкову статистику в meta
  insertMeta.run('indexed_count', String(processed));
  insertMeta.run('failed_count', String(failed));
  insertMeta.run('build_duration_ms', String(totalTime));

  db.close();
}

const isMainModule = fileURLToPath(import.meta.url) === argv[1];

if (isMainModule) {
  main().catch((err) => {
    console.error('Фатальна помилка:', err);
    process.exit(1);
  });
}