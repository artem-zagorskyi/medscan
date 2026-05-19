import fs from 'fs/promises'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { AppError } from '../errors/AppError.js'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:4b'

//llamaindex
//langchain


const RESEARCH_GROUPS = {
  'Загальний аналіз крові (ЗАК)': [
    'Середня концентрація гемоглобіну в еритроциті (MCHC)',
    'Середній об\'єм еритроцита (MCV)',
    'Середній вміст гемоглобіну в еритроциті (MCH)',
    'Еритроцити (підрахунок автоматичний)',
    'Гемоглобін у крові',
    'Показник анізоцитозу еритроцитів (RDW)',
    'Тромбоцити (підрахунок автоматичний)',
    'Лейкоцити (підрахунок автоматичний)',
    'Середній об\'єм тромбоцита (MPV)',
    'Гематокрит (автоматичний підрахунок)',
    'Нейтрофіли абсолютна кількість',
    'Базофіли абсолютна кількість',
    'Моноцити абсолютна кількість',
    'Лімфоцити абсолютна кількість',
    'Еозинофіли абсолютна кількість',
    'Нейтрофіли відносна кількість',
    'Моноцити відносна кількість',
    'Лімфоцити відносна кількість',
    'Еозинофіли відносна кількість',
    'Базофіли відносна кількість',
    'Незрілі гранулоцити абсолютна кількість',
    'Незрілі гранулоцити відносна кількість',
    'Ядровмісні еритроцити абсолютна кількість',
    'Ядровмісні еритроцити відносна кількість',
    'Диференційний підрахунок клітин крові',
    'Загальний аналіз крові (CBC) з диференціалом',
    'Загальний аналіз крові (CBC) автоматичний',
    'ШОЕ за методом Вестергрена',
    'Морфологія еритроцитів',
    'Поліхромазія (мікроскопія)',
    'Анізоцитоз (мікроскопія)',
    'Метамієлоцити відносна кількість',
    'Мієлоцити відносна кількість',
    'Паличкоядерні нейтрофіли відносна кількість',
    'Сегментоядерні нейтрофіли відносна кількість',
    'Лейкоцити скориговані на ядровмісні еритроцити',
    'Гемоглобін A1c/загальний гемоглобін у крові',
    'Гемоглобін A1c абсолютна кількість',
    'Фібриноген у плазмі (коагулограма)',
  ],

  'Біохімічний аналіз крові': [
    'Креатинін у сироватці або плазмі',
    'Натрій у сироватці або плазмі',
    'Калій у сироватці або плазмі',
    'Хлорид у сироватці або плазмі',
    'Сечовина у сироватці або плазмі',
    'Білірубін загальний у сироватці або плазмі',
    'Білірубін прямий у сироватці або плазмі',
    'Білірубін непрямий у сироватці або плазмі',
    'Білірубін кон\'югований у сироватці або плазмі',
    'Білок загальний у сироватці або плазмі',
    'Альбумін у сироватці або плазмі',
    'Глобулін у сироватці або плазмі',
    'Аланінамінотрансфераза (АЛТ) у сироватці або плазмі',
    'Аспартатамінотрансфераза (АСТ) у сироватці або плазмі',
    'Лужна фосфатаза у сироватці або плазмі',
    'Гамма-глутамілтрансфераза (ГГТ) у сироватці або плазмі',
    'Ліпаза у сироватці або плазмі',
    'Амілаза у сироватці або плазмі',
    'Креатинкіназа у сироватці або плазмі',
    'С-реактивний білок (СРБ) у сироватці або плазмі',
    'Сечова кислота у сироватці або плазмі',
    'Аніонний розрив у сироватці або плазмі',
    'Швидкість клубочкової фільтрації (ШКФ) за MDRD',
    'Швидкість клубочкової фільтрації (ШКФ) за CKD-EPI',
    'Кліренс креатиніну за формулою Кокрофта-Голта',
    'Співвідношення альбумін/глобулін у сироватці або плазмі',
    'Співвідношення сечовина/креатинін у сироватці або плазмі',
    'Базова метаболічна панель',
    'Комплексна метаболічна панель',
    'Нефрологія (комплексна панель)',
    'Натрій у крові',
    'Калій у крові',
    'Хлорид у крові',
    'Креатинін у крові',
    'Сечовина у крові',
  ],

  'Ліпідний профіль': [
    'Холестерин загальний у сироватці або плазмі',
    'Холестерин ЛПВЩ у сироватці або плазмі',
    'Холестерин ЛПНЩ у сироватці або плазмі',
    'Холестерин ЛПДНЩ у сироватці або плазмі',
    'Холестерин не-ЛПВЩ у сироватці або плазмі',
    'Тригліцериди у сироватці або плазмі',
    'Співвідношення загальний холестерин/ЛПВЩ',
    'Ліпідна панель',
  ],

  'Коагулограма та гемостаз': [
    'Протромбіновий час (ПЧ)',
    'МНВ (міжнародне нормалізоване відношення)',
    'АЧТЧ (активований частковий тромбопластиновий час)',
    'Фібриноген у плазмі',
    'D-димер у плазмі',
    'Нефракціонований гепарин у плазмі',
  ],

  'Загальний аналіз сечі (ЗАС)': [
    'Колір сечі',
    'Зовнішній вигляд сечі',
    'pH сечі',
    'Питома вага сечі',
    'Білок у сечі',
    'Глюкоза у сечі',
    'Кетони у сечі',
    'Нітрити у сечі',
    'Білірубін у сечі',
    'Уробіліноген у сечі',
    'Гемоглобін у сечі',
    'Лейкоцитарна естераза у сечі',
    'Еритроцити у осаді сечі',
    'Лейкоцити у осаді сечі',
    'Бактерії у осаді сечі',
    'Епітеліальні клітини у осаді сечі',
    'Гіалінові циліндри у осаді сечі',
    'Слиз у осаді сечі',
    'Мікроальбумін у сечі',
    'Альбумін у сечі',
    'Співвідношення альбумін/креатинін у сечі',
    'Співвідношення білок/креатинін у сечі',
    'Осмолярність сечі',
    'Загальний аналіз сечі (макроскопічна панель)',
  ],

  'Глюкоза та діабет': [
    'Глюкоза у сироватці або плазмі',
    'Глюкоза у крові',
    'Глюкоза у капілярній крові (глюкометр)',
    'Глікований гемоглобін (HbA1c)',
    'Середній рівень глюкози розрахований з HbA1c',
    'Статус натщесерця',
  ],

  'Гормони щитоподібної залози': [
    'Тиреотропний гормон (ТТГ) у сироватці або плазмі',
    'Тироксин вільний (Т4 вільний) у сироватці або плазмі',
    'Трийодтиронін вільний (Т3 вільний) у сироватці або плазмі',
  ],

  'Гормони та онкомаркери': [
    'Тропонін I серцевий у сироватці або плазмі',
    'Простатоспецифічний антиген (ПСА)',
    'Натрійуретичний пептид B (BNP)',
    'Хоріонічний гонадотропін (ХГЛ)',
    'Паратгормон інтактний у сироватці або плазмі',
    'Рецептор епідермального фактора росту (EGFR)',
    'Тестостерон у сироватці або плазмі',
    'Прокальцитонін у сироватці або плазмі',
  ],

  'Мікробіологічний посів': [
    'Бактерії виявлені у крові (посів)',
    'Бактерії виявлені у сечі (посів)',
    'Бактерії виявлені у мокротинні (посів)',
    'Бактерії виявлені у зразку (аеробно-анаеробний посів)',
    'Мікроорганізм виявлений у зразку (посів)',
    'Мікробіологічне дослідження (фарбування за Грамом)',
    'Мікобактерії виявлені у зразку (специфічний посів)',
    'ДНК Neisseria gonorrhoeae у зразку (ПЛР)',
    'Гриби виявлені у зразку (посів)',
    'РНК Chlamydia trachomatis у зразку (ПЛР)',
    'Реагін (РПР) у сироватці',
  ],

  'Газовий склад крові': [
    'Парціальний тиск кисню (pO2) в артеріальній крові',
    'Парціальний тиск CO2 (pCO2) в артеріальній крові',
    'pH артеріальної крові',
    'Бікарбонат в артеріальній крові',
    'Насичення киснем (сатурація) артеріальної крові',
    'Надлишок основ у крові',
    'Парціальний тиск кисню (pO2) у венозній крові',
    'Парціальний тиск CO2 (pCO2) у венозній крові',
    'pH венозної крові',
    'Бікарбонат у венозній крові',
    'Лактат у крові',
    'Лактат у венозній крові',
    'Газовий склад артеріальної крові',
  ],

  'Аналіз на інфекції': [
    'РНК SARS-CoV-2 (COVID-19) у зразку дихальних шляхів (ПЛР)',
    'Антитіла до ВІЛ-1+2 та антиген p24 у сироватці або плазмі',
    'Антитіла до вірусу гепатиту C у сироватці',
    'Поверхневий антиген вірусу гепатиту B у сироватці',
    'Антинейтрофільні цитоплазматичні антитіла (ANCA)',
  ],

  'Вітаміни та мікроелементи': [
    'Кальцій у сироватці або плазмі',
    'Іонізований кальцій у крові',
    'Магній у сироватці або плазмі',
    'Фосфат у сироватці або плазмі',
    'Феритин у сироватці або плазмі',
    '25-гідроксивітамін D3 у сироватці або плазмі',
    '25-гідроксивітамін D3+D2 у сироватці або плазмі',
    'Вітамін B12 (кобаламін) у сироватці або плазмі',
    'Залізо у сироватці або плазмі',
    'Насичення трансферину залізом',
    'Залізозв\'язуюча здатність сироватки',
    'Фолат у сироватці або плазмі',
  ],

  'Токсикологічний аналіз': [
    'Такролімус у крові',
    'Етанол у сироватці або плазмі',
    'Опіати у сечі',
    'Барбітурати у сечі',
    'Канабіноїди у сечі (скринінг)',
    'Бензодіазепіни у сечі',
  ],

  'Група крові та препарати крові': [
    'Група крові ABO та резус-фактор (Rh)',
    'Скринінг антитіл до еритроцитів',
    'Ідентифікатор одиниці препарату крові',
    'Тип препарату крові',
    'Стан утилізації препарату крові',
  ],
}

const GROUP_NAMES = Object.keys(RESEARCH_GROUPS)


const KEYWORD_MAP = [
  {
    group: 'Загальний аналіз крові (ЗАК)',
    keywords: ['еритроцит', 'лейкоцит', 'гемоглобін', 'тромбоцит', 'гематокрит',
      'нейтрофіл', 'лімфоцит', 'моноцит', 'еозинофіл', 'базофіл',
      'mchc', 'mcv', 'mch', 'cbc', 'rbc', 'wbc', 'hgb', 'hct', 'plt',
      'rdw', 'mpv', 'шое', 'диференційний підрахунок']
  },
  {
    group: 'Ліпідний профіль',
    keywords: ['холестерин', 'cholesterol', 'тригліцерид', 'triglyceride',
      'лпвщ', 'hdl', 'лпнщ', 'ldl', 'лпднщ', 'vldl', 'ліпід', 'lipid']
  },
  {
    group: 'Коагулограма та гемостаз',
    keywords: ['протромбін', 'мнв', 'inr', 'ачтч', 'aptt',
      'фібриноген', 'fibrinogen', 'd-димер', 'd-dimer', 'гепарин']
  },
  {
    group: 'Глюкоза та діабет',
    keywords: ['hba1c', 'глікован', 'glycated', 'кетон', 'ketone', 'натщесерц',
      'глюкоз', 'glucose']
  },
  {
    group: 'Гормони щитоподібної залози',
    keywords: ['ттг', 'tsh', 'тиреотропін', 'thyrotropin',
      'тироксин', 'thyroxine', 'трийодтиронін', 'triiodothyronine']
  },
  {
    group: 'Гормони та онкомаркери',
    keywords: ['тропонін', 'troponin', 'пса', 'psa', 'простатоспецифічн',
      'хгл', 'hcg', 'прокальцитонін', 'procalcitonin', 'bnp',
      'натрійуретичний', 'паратгормон', 'тестостерон']
  },
  {
    group: 'Мікробіологічний посів',
    keywords: ['посів', 'culture', 'антибіотикограм',
      'фарбування за грамом', 'gram stain', 'мікобактер', 'mycobacterium',
      'гриб', 'fungus', 'гонорея', 'хламідія', 'рпр', 'rpr']
  },
  {
    group: 'Газовий склад крові',
    keywords: ['газовий склад', 'pco2', 'po2', 'ph крові', 'ph артеріальн',
      'бікарбонат', 'bicarbonate', 'надлишок основ', 'base excess',
      'сатурація кисню', 'oxygen saturation', 'артеріальна кров']
  },
  {
    group: 'Аналіз на інфекції',
    keywords: ['віл', 'hiv', 'гепатит', 'hepatitis', 'covid', 'sars-cov', 'anca']
  },
  {
    group: 'Вітаміни та мікроелементи',
    keywords: ['вітамін d', 'vitamin d', '25-гідрокси', '25-hydroxy',
      'кобаламін', 'cobalamin', 'фолат', 'folate', 'феритин', 'ferritin',
      'залізозв', 'трансферин', 'transferrin', 'вітамін b12']
  },
  {
    group: 'Токсикологічний аналіз',
    keywords: ['алкоголь', 'ethanol', 'опіат', 'opiate', 'канабіноїд', 'cannabinoid',
      'барбітурат', 'barbiturate', 'бензодіазепін', 'benzodiazepine',
      'такролімус', 'tacrolimus']
  },
  {
    group: 'Група крові та препарати крові',
    keywords: ['група крові', 'blood group', 'резус-фактор', 'rh factor',
      'аво', 'abo', 'антитіла до еритроцит', 'blood product', 'переливання']
  },
  {
    group: 'Загальний аналіз сечі (ЗАС)',
    keywords: ['загальний аналіз сечі', 'нітрит сечі', 'питома вага сечі',
      'лейкоцитарна естераза', 'осмолярність сечі', 'мікроальбумін',
      'осад сечі', 'колір сечі', 'зовнішній вигляд сечі']
  },
  {
    group: 'Біохімічний аналіз крові',
    keywords: ['креатинін', 'creatinine', 'creat', 'серпл', 'сечовина', 'urea',
      'білірубін', 'bilirubin', 'алт', 'alt', 'аст', 'ast',
      'лужна фосфатаза', 'alp', 'альбумін', 'albumin', 'глобулін',
      'аніонний розрив', 'шкф', 'ліпаза', 'амілаза', 'срб', 'crp',
      'нефрологія', 'метаболічна панель',
      'натрій', 'sodium', 'калій', 'potassium', 'хлорид', 'chloride',
      'кальцій', 'calcium', 'магній', 'magnesium', 'фосфат', 'phosphate']
    
  },
]


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


const callOllama = async (prompt) => {
  console.log('Calling Ollama at:', OLLAMA_HOST, 'Model:', MODEL)
  const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.1, top_p: 0.9, stop: ['<end_of_turn>', '<start_of_turn>'] }
    }),
    signal: AbortSignal.timeout(120000)
  })
  if (!response.ok) throw new AppError(`Ollama error: ${response.statusText}`, 500)
  return response.json()
}


const classifyGroup = async (text) => {
  const orderedMatch = text.match(/Замовлене дослідження:\s*(\S[^\n\r]{0,50})/i)
  const orderedTest = orderedMatch ? orderedMatch[1].trim() : ''

  
  let hint = ''
  if (orderedTest) {
    const lower = orderedTest.toLowerCase()
    for (const { group, keywords } of KEYWORD_MAP) {
      if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        hint = `\nПідказка: схоже що замовлене дослідження "${orderedTest}" може відноситись до групи "${group}", але перевір самостійно.`
        break
      }
    }
  }

  const truncated = text.slice(0, 1500)
  const groupList = GROUP_NAMES.map((g, i) => `${i + 1}. ${g}`).join('\n')

  const prompt = `<start_of_turn>user
Ти медичний асистент. Визнач групу медичного дослідження.

Групи досліджень:
${groupList}
${hint}

Текст дослідження:
${truncated}

Поверни ТІЛЬКИ валідний JSON без пояснень:
{"group":"<назва групи з списку>","confidence":"<high або low>"}
<end_of_turn>
<start_of_turn>model
`

  const data = await callOllama(prompt)
  const raw = data.response?.trim() || ''
  const cleaned = raw.replace(/```json|```/g, '').trim()
  console.log('Group raw:', cleaned)

  try {
    const json = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] || '{}')
    const matched = GROUP_NAMES.find(g =>
      g.toLowerCase() === json.group?.toLowerCase() ||
      json.group?.toLowerCase().includes(g.toLowerCase())
    )
    return { group: matched || 'Інше', confidence: json.confidence === 'high' ? 'high' : 'low' }
  } catch {
    const matched = GROUP_NAMES.find(g => cleaned.toLowerCase().includes(g.toLowerCase()))
    return { group: matched || 'Інше', confidence: 'low' }
  }
}


const classifySpecific = async (text, group) => {
  const truncated = text.slice(0, 1500)
  const specificTests = RESEARCH_GROUPS[group] || []

  if (specificTests.length === 0) {
    return { specificType: group, summary: '', parameters: '', confidence: 'low' }
  }

  const testsList = specificTests.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const prompt = `<start_of_turn>user
Ти медичний асистент. Проаналізуй текст медичного дослідження типу "${group}".

Вибери ОДИН найбільш відповідний тест з цього списку (ТІЛЬКИ з цього списку, слово в слово):
${testsList}

Текст дослідження:
${truncated}

Правила:
- specificType — ТІЛЬКИ ТОЧНА назва з наведеного списку, слово в слово
- summary — короткий опис результатів українською, 2-3 речення
- parameters — лише ті показники що реально є в тексті через кому
- confidence — high якщо впевнений, low якщо ні

Поверни ТІЛЬКИ валідний JSON без markdown:
{"specificType":"<точна назва з списку>","summary":"<опис>","parameters":"<показники>","confidence":"<high або low>"}
<end_of_turn>
<start_of_turn>model
`

  const data = await callOllama(prompt)
  const raw = data.response?.trim() || ''
  const cleaned = raw.replace(/```json|```/g, '').trim()
  console.log('Specific raw:', cleaned)

  try {
    const json = JSON.parse(cleaned.match(/\{[\s\S]*\}/)?.[0] || '{}')

    const matched = specificTests.find(t =>
      t.toLowerCase() === json.specificType?.toLowerCase() ||
      json.specificType?.toLowerCase().includes(t.toLowerCase()) ||
      t.toLowerCase().includes(json.specificType?.toLowerCase())
    )

    return {
      specificType: matched || specificTests[0],
      summary: json.summary || '',
      parameters: json.parameters || '',
      confidence: json.confidence === 'high' ? 'high' : 'low'
    }
  } catch {
    return { specificType: specificTests[0], summary: '', parameters: '', confidence: 'low' }
  }
}

export const analyzeFile = async (filePath) => {
  console.log('Analyzing:', filePath)
  const extractedText = await extractTextFromPdf(filePath)
  console.log('Text length:', extractedText.length)
  console.log('Preview:', extractedText)

  if (!extractedText || extractedText.length < 10) {
    throw new AppError('Could not extract meaningful text from PDF', 422)
  }

  console.log('Step 1: classifying group...')
  const groupResult = await classifyGroup(extractedText)
  console.log('Group result:', groupResult)

  console.log('Step 2: classifying specific test...')
  const specificResult = await classifySpecific(extractedText, groupResult.group)
  console.log('Specific result:', specificResult)

  const finalConfidence = (groupResult.confidence === 'high' && specificResult.confidence === 'high')
    ? 'high' : 'low'

  const results = specificResult.summary
    ? `${specificResult.summary}${specificResult.parameters ? '\n\nОсновні показники: ' + specificResult.parameters : ''}`
    : extractedText.slice(0, 500)

  return {
    researchType: groupResult.group,
    specificType: specificResult.specificType,
    results,
    extractedText: extractedText.slice(0, 1000),
    confidence: finalConfidence
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
    return { online: true, models, hasModel: models.some(m => m.startsWith('gemma3')) }
  } catch {
    return { online: false, models: [], hasModel: false }
  }
}