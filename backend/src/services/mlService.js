import fs from 'fs/promises'
import { existsSync } from 'node:fs'
import path from 'path'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import Database from 'better-sqlite3'
import { AppError } from '../errors/AppError.js'


// ─── Конфігурація ───────────────────────────────────────────────

let OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text'
const SLM_MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b'
const INDEX_DB_PATH = process.env.INDEX_DB_PATH || path.resolve('data/embeddings.db')
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10)


export function getOllamaHost() {
  return OLLAMA_HOST
}

export function setOllamaHost(url) {
  OLLAMA_HOST = url
}

// ─── Векторний індекс ─────────────────

let indexCache = null

function loadIndex() {
  if (indexCache) return indexCache

  if (!existsSync(INDEX_DB_PATH)) {
    throw new AppError(`Index database not found: ${INDEX_DB_PATH}`, 500)
  }

  const db = new Database(INDEX_DB_PATH, { readonly: true })
  const rows = db.prepare(`
    SELECT id, unofficial_name, common_name, category, fluid, unit, source_count, embedding
    FROM embeddings
  `).all()
  db.close()

  if (rows.length === 0) throw new AppError('Embedding index is empty', 500)

  const vectorDim = rows[0].embedding.length / 4 // float32
  const n = rows.length
  const vectors = new Float32Array(n * vectorDim)
  const meta = new Array(n)

  for (let i = 0; i < n; i++) {
    const row = rows[i]
    // Копіюємо BLOB в окремий ArrayBuffer
    const ab = new ArrayBuffer(row.embedding.byteLength)
    const view = new Uint8Array(ab)
    for (let j = 0; j < row.embedding.byteLength; j++) {
      view[j] = row.embedding[j]
    }
    const vec = new Float32Array(ab)
    vectors.set(vec, i * vectorDim)
    meta[i] = {
      id: row.id,
      unofficial_name: row.unofficial_name,
      common_name: row.common_name,
      category: row.category,
      fluid: row.fluid,
      unit: row.unit,
      source_count: row.source_count,
    }
  }

  indexCache = { vectors, meta, n, vectorDim }
  console.log(`[ML] Index loaded: ${n} vectors, dim=${vectorDim}`)
  return indexCache
}

// ─── Векторні операції ──────────────────────────────────────────

function normalize(vector) {
  let sumSq = 0
  for (let i = 0; i < vector.length; i++) sumSq += vector[i] * vector[i]
  const norm = Math.sqrt(sumSq)
  if (norm === 0) return vector.slice()
  const result = new Float32Array(vector.length)
  for (let i = 0; i < vector.length; i++) result[i] = vector[i] / norm
  return result
}

function searchTopK(index, queryVector, k = 10) {
  const { vectors, meta, n, vectorDim } = index
  const scores = new Float32Array(n)

  for (let i = 0; i < n; i++) {
    let sum = 0
    const offset = i * vectorDim
    for (let j = 0; j < vectorDim; j++) {
      sum += vectors[offset + j] * queryVector[j]
    }
    scores[i] = sum
  }

  const indices = Array.from({ length: n }, (_, i) => i)
  indices.sort((a, b) => scores[b] - scores[a])

  const topK = []
  for (let i = 0; i < Math.min(k, n); i++) {
    const idx = indices[i]
    topK.push({ score: scores[idx], meta: meta[idx] })
  }
  return topK
}

// ─── Ollama API ─────────────────────────────────────────────────

async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function getEmbedding(text) {
  const response = await fetchWithTimeout(`${OLLAMA_HOST}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
  })
  if (!response.ok) throw new AppError(`Ollama embedding error: ${response.statusText}`, 500)
  const data = await response.json()
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new AppError('Invalid embedding response from Ollama', 500)
  }
  return data.embedding
}

async function callOllamaGenerate(prompt, maxTokens = 200) {
  const response = await fetchWithTimeout(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: SLM_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0, num_predict: maxTokens },
    }),
  })
  if (!response.ok) throw new AppError(`Ollama generate error: ${response.statusText}`, 500)
  const data = await response.json()
  return (data.response || '').trim()
}

function cleanMarkdown(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-•]\s*/gm, '')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ─── Крок 1: Витягнути текст з PDF ─────────────────────────────

export const extractTextFromPdf = async (filePath) => {
  try {
    const absolutePath = path.resolve(filePath)
    const buffer = await fs.readFile(absolutePath)
    const uint8Array = new Uint8Array(buffer)
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ') + '\n'
    }
    return text.trim()
  } catch (error) {
    throw new AppError(`Failed to extract text from PDF: ${error.message}`, 500)
  }
}

// ─── Крок 2: SLM витягує структуровані поля з тексту ────────────

async function extractFieldsFromText(text) {
  const truncated = text.slice(0, 2000)

  const prompt = `Проаналізуй текст лабораторного звіту та витягни інформацію.

Текст звіту:
${truncated}

Поверни ТІЛЬКИ валідний JSON без пояснень та без markdown:
{"unofficial_name":"<назва дослідження з документу>","category":"<категорія: Хімія, Гематологія, тощо>","fluid":"<тип зразка: Кров, Сеча, тощо>","unit":"<одиниці виміру результату>"}

Правила:
- unofficial_name — назва дослідження як написано в документі (поле "Замовлене дослідження" або назва показника)
- category — категорія або відділ лабораторії
- fluid — тип біоматеріалу
- unit — одиниці виміру з таблиці результатів
- Якщо поле відсутнє в тексті, пиши ""

JSON:`

  const raw = await callOllamaGenerate(prompt, 150)
  const cleaned = raw.replace(/```json|```/g, '').trim()

  try {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    const json = JSON.parse(match[0])
    return {
      unofficial_name: (json.unofficial_name || '').trim(),
      category: (json.category || '').trim(),
      fluid: (json.fluid || '').trim(),
      unit: (json.unit || '').trim(),
    }
  } catch {
    console.warn('[ML] Failed to parse fields JSON:', cleaned)
    return { unofficial_name: '', category: '', fluid: '', unit: '' }
  }
}

// ─── Крок 3: Генерація ключових слів через SLM ─────────────────

async function generateKeywords(unofficialName, category, fluid, unit) {
  const prompt = `Лабораторний тест "${unofficialName}" (${category || '?'}, ${fluid || '?'}, ${unit || '?'}).
Напиши ТІЛЬКИ список ключових слів через кому: повна назва українською, назва англійською, абревіатури, хімічна формула, група аналізів, що вимірює. Без пояснень, без речень.

Ключові слова:`

  const raw = await callOllamaGenerate(prompt, 100)
  return cleanMarkdown(raw)
}

// ─── Крок 4: RAG класифікація ───────────────────────────────────

function classifyByTopK(topK) {
  // Top-1 стратегія — беремо common_name найближчого сусіда
  const seen = new Set()
  const ranking = []

  for (const item of topK) {
    const cn = item.meta.common_name
    if (seen.has(cn)) continue
    seen.add(cn)
    ranking.push({
      common_name: cn,
      score: item.score,
    })
  }

  return ranking
}

// ─── Крок 5: SLM генерує короткий опис результатів ──────────────

async function generateResultsSummary(extractedText, classifiedName) {
  const truncated = extractedText.slice(0, 2000)

  const prompt = `Проаналізуй результати лабораторного дослідження "${classifiedName}".

Текст звіту:
${truncated}

Напиши короткий висновок українською (2-3 речення): які показники виміряно, їх значення, чи є відхилення від норми. Без заголовків, без списків, без markdown.

Висновок:`

  const raw = await callOllamaGenerate(prompt, 200)
  return cleanMarkdown(raw)
}

// ─── Головна функція: аналіз файлу ─────────────────────────────

export const analyzeFile = async (filePath) => {
  console.log('[ML] Analyzing:', filePath)

  // Крок 1: Витягуємо текст
  const extractedText = await extractTextFromPdf(filePath)
  console.log('[ML] Text length:', extractedText.length)

  if (!extractedText || extractedText.length < 10) {
    throw new AppError('Could not extract meaningful text from PDF', 422)
  }

  // Крок 2: SLM витягує поля
  console.log('[ML] Step 1: extracting fields with SLM...')
  const fields = await extractFieldsFromText(extractedText)
  console.log('[ML] Fields:', fields)

  if (!fields.unofficial_name) {
    throw new AppError('Could not extract research name from PDF', 422)
  }

  // Крок 3: Генеруємо ключові слова
  console.log('[ML] Step 2: generating keywords...')
  const keywords = await generateKeywords(
    fields.unofficial_name,
    fields.category,
    fields.fluid,
    fields.unit
  )
  console.log('[ML] Keywords:', keywords)

  // Крок 4: Embedding
  console.log('[ML] Step 3: computing embedding...')
  const rawEmbedding = await getEmbedding(keywords)
  const queryVector = normalize(rawEmbedding)

  // Крок 5: Cosine search
  console.log('[ML] Step 4: searching index...')
  const index = loadIndex()
  const topK = searchTopK(index, queryVector, 10)
  const ranking = classifyByTopK(topK)

  // Визначаємо confidence
  const topScore = ranking[0]?.score || 0
  const secondScore = ranking[1]?.score || 0
  let confidence = 'low'
  if (topScore > 0.95) confidence = 'high'
  else if (topScore > 0.85 && (topScore - secondScore) > 0.03) confidence = 'medium'

  const classifiedName = ranking[0]?.common_name || 'Невідомо'
  console.log('[ML] Result:', classifiedName, `(score: ${topScore.toFixed(4)}, confidence: ${confidence})`)

  // Крок 6: SLM генерує короткий опис результатів
  console.log('[ML] Step 5: generating results summary...')
  const results = await generateResultsSummary(extractedText, classifiedName)
  console.log('[ML] Results:', results)

  return {
    classifiedName,
    confidence,
    results,
    extractedText: extractedText.slice(0, 5000),
    candidates: ranking.slice(0, 5).map(r => ({
      commonName: r.common_name,
      score: Math.round(r.score * 1000) / 1000,
    })),
  }
}

// ─── Перевірка статусу Ollama ───────────────────────────────────

export const checkOllamaStatus = async () => {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) return { online: false, models: [] }
    const data = await response.json()
    const models = data.models?.map(m => m.name) || []
    return {
      online: true,
      models,
      hasSlmModel: models.some(m => m.includes(SLM_MODEL.split(':')[0])),
      hasEmbeddingModel: models.some(m => m.includes(EMBEDDING_MODEL.split(':')[0])),
      indexLoaded: indexCache !== null,
      indexSize: indexCache?.n || 0,
    }
  } catch {
    return { online: false, models: [], hasSlmModel: false, hasEmbeddingModel: false }
  }
}