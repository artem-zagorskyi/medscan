import Database from 'better-sqlite3';
import { config } from './config.js';
import { getEmbedding, generateKeywords } from './utils/ollama.js';
import { normalize, bufferToVector, dotProduct } from './utils/vector.js';

/**
 * Загружает весь индекс из SQLite в память.
 * Возвращает структуры, готовые для быстрого поиска.
 */
export function loadIndex(dbPath = config.paths.indexDb) {
  const db = new Database(dbPath, { readonly: true });

  const rows = db.prepare(`
    SELECT id, unofficial_name, common_name, category, fluid, unit, source_count, embedding
    FROM embeddings
  `).all();

  db.close();

  // Векторы кладём в один большой Float32Array для cache-friendly прохода
  // Метаданные — в параллельные массивы
  const n = rows.length;
  if (n === 0) throw new Error('Индекс пустой');

  const vectorDim = rows[0].embedding.length / 4; // 768 для nomic-embed-text
  const vectors = new Float32Array(n * vectorDim);
  const meta = new Array(n);

  for (let i = 0; i < n; i++) {
    const row = rows[i];
    const vec = bufferToVector(row.embedding);
    vectors.set(vec, i * vectorDim);
    meta[i] = {
      id: row.id,
      unofficial_name: row.unofficial_name,
      common_name: row.common_name,
      category: row.category,
      fluid: row.fluid,
      unit: row.unit,
      source_count: row.source_count,
    };
  }

  return { vectors, meta, n, vectorDim };
}

/**
 * Поиск top-K ближайших векторов в индексе.
 * Возвращает массив { score, meta } отсортированный по score убыванию.
 */
export function searchTopK(index, queryVector, k = 10) {
  const { vectors, meta, n, vectorDim } = index;

  // Считаем scores для всех записей
  const scores = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const offset = i * vectorDim;
    for (let j = 0; j < vectorDim; j++) {
      sum += vectors[offset + j] * queryVector[j];
    }
    scores[i] = sum;
  }

  // Берём top-K через partial sort
  // Для малого K эффективнее чем полная сортировка n элементов
  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort((a, b) => scores[b] - scores[a]);

  const topK = [];
  for (let i = 0; i < Math.min(k, n); i++) {
    const idx = indices[i];
    topK.push({
      score: scores[idx],
      meta: meta[idx],
    });
  }

  return topK;
}

/**
 * Стратегия 1: top-1 — берём common_name самого близкого вектора.
 * Возвращает упорядоченный по score список уникальных common_name.
 */
export function strategyTop1(topK) {
  const seen = new Set();
  const ranking = [];

  for (const item of topK) {
    const cn = item.meta.common_name;
    if (seen.has(cn)) continue;
    seen.add(cn);
    ranking.push({
      common_name: cn,
      score: item.score,
      method: 'top1',
    });
  }

  return ranking;
}

/**
 * Стратегия 2: голосование — взвешенное по score голосование среди top-K.
 * Каждый сосед голосует за свой common_name с весом = score.
 * Возвращает упорядоченный список common_name по суммарному весу.
 */
export function strategyVoting(topK) {
  const votes = new Map(); // common_name -> сумма scores

  for (const item of topK) {
    const cn = item.meta.common_name;
    const prev = votes.get(cn) || 0;
    votes.set(cn, prev + item.score);
  }

  const ranking = [...votes.entries()]
    .map(([common_name, score]) => ({ common_name, score, method: 'voting' }))
    .sort((a, b) => b.score - a.score);

  return ranking;
}

/**
 * Главная функция классификации.
 * Принимает данные запроса, возвращает ранжированные предсказания обеими стратегиями.
 *
 * @param {Object} query - { unofficial_name, category, fluid, unit }
 * @param {Object} index - результат loadIndex()
 * @param {Object} options - { k: число соседей для рассмотрения }
 */
export async function classify(query, index, options = {}) {
  const { k = 10 } = options;

  // 1. SLM генерує ключові слова (той самий промпт що і при індексації!)
  const keywords = await generateKeywords(
    query.unofficial_name,
    query.category,
    query.fluid,
    query.unit
  );

  // 2. Embedding від ключових слів
  const rawEmbedding = await getEmbedding(keywords);
  const queryVector = normalize(rawEmbedding);

  // 3. Шукаємо top-K
  const topK = searchTopK(index, queryVector, k);

  // 4. Застосовуємо обидві стратегії
  const top1Ranking = strategyTop1(topK);
  const votingRanking = strategyVoting(topK);

  return {
    query,
    keywords,
    topK,
    top1: top1Ranking,
    voting: votingRanking,
  };
}