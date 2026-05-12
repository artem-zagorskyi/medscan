import fs from 'fs/promises'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')
import { AppError } from '../errors/AppError.js'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:1b'

const RESEARCH_TYPES = [
  'Загальний аналіз крові',
  'Біохімічний аналіз крові',
  'Загальний аналіз сечі',
  'ЕКГ',
  'УЗД черевної порожнини',
  'Рентген грудної клітки',
  'МРТ головного мозку',
  'КТ органів грудної клітки',
  'Ехокардіографія',
  'Спірометрія',
  'Інше',
]


export const extractTextFromPdf = async (filePath) => {
  try {
    const absolutePath = path.resolve(filePath)
    const buffer = await fs.readFile(absolutePath)
    const data = await pdfParse(buffer)
    return data.text?.trim() || ''
  } catch (error) {
    throw new AppError(`Failed to extract text from PDF: ${error.message}`, 500)
  }
}

export const classifyWithOllama = async (text) => {
  const truncatedText = text.slice(0, 2000)

  const prompt = `Ти медичний асистент. Проаналізуй наступний текст медичного дослідження і визнач його тип.

Можливі типи досліджень:
${RESEARCH_TYPES.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Текст дослідження:
${truncatedText}

Відповідай ТІЛЬКИ назвою типу дослідження з наведеного списку, без пояснень. Якщо не можеш визначити — відповідай "Інше".`

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.9,
        }
      }),
      signal: AbortSignal.timeout(60000)
    })

    if (!response.ok) {
      throw new AppError(`Ollama API error: ${response.statusText}`, 500)
    }

    const data = await response.json()
    const rawAnswer = data.response?.trim() || 'Інше'

    const matched = RESEARCH_TYPES.find(type =>
      rawAnswer.toLowerCase().includes(type.toLowerCase())
    )

    return matched || 'Інше'
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(`Failed to call Ollama: ${error.message}`, 500)
  }
}


export const analyzeFile = async (filePath) => {
  const extractedText = await extractTextFromPdf(filePath)

  if (!extractedText || extractedText.length < 10) {
    throw new AppError('Could not extract meaningful text from PDF', 422)
  }

  const researchType = await classifyWithOllama(extractedText)

  return {
    researchType,
    extractedText: extractedText.slice(0, 1000),
    confidence: researchType !== 'Інше' ? 'high' : 'low'
  }
}


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
      hasModel: models.some(m => m.startsWith('gemma3'))
    }
  } catch {
    return { online: false, models: [], hasModel: false }
  }
}