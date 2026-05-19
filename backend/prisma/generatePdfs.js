import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'research')
const FONTS_DIR = path.join(__dirname, 'fonts')

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

export const randomInt  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
export const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

function formatDate(date) {
  if (typeof date === 'string') return date
  if (!date) return ''
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Колонки нового датасету:
//   mimic_label     — назва параметра (рядок таблиці)
//   common_name     — повна стандартна назва
//   unofficial_name — назва тесту (заголовок / "Замовлене дослідження")
//   category        — категорія (Хімія, Гематологія тощо)
//   fluid           — тип біоматеріалу (Кров, Сеча тощо)
//   value           — результат
//   valuenum        — числове значення (не використовуємо в PDF)
//   unit            — одиниці виміру
//   flag            — позначка (порожньо = норма)

function flagToStatus(flag) {
  if (!flag || flag.trim() === '') return 'НОРМА'
  const f = flag.toLowerCase().trim()
  if (f === 'abnormal' || f === 'аномальний') return 'АНОМАЛЬНИЙ'
  if (f === 'normal'   || f === 'нормальний') return 'НОРМА'
  if (f === 'critical' || f === 'критичний')  return 'КРИТИЧНИЙ'
  if (f === 'high'     || f === 'високий')    return 'ВИСОКИЙ'
  if (f === 'low'      || f === 'низький')    return 'НИЗЬКИЙ'
  return flag.toUpperCase()
}

let _reportCounter = 1
function nextReportNo() {
  return `RPT-${String(_reportCounter++).padStart(6, '0')}`
}

// record = один рядок CSV датасету:
// { mimic_label, common_name, unofficial_name, category, fluid, value, valuenum, unit, flag }
export function generateResearchPdfFromDataset({ record, patientName, doctorName, date, fileName, outputDir }) {
  return new Promise((resolve, reject) => {

    const dir      = outputDir ?? UPLOADS_DIR
    const filePath = path.join(dir, fileName)

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const status     = flagToStatus(record.flag)
    const isAbnormal = status !== 'НОРМА'

    const doc    = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true })
    const stream = fs.createWriteStream(filePath)

    stream.on('finish', () => resolve(filePath))
    stream.on('error', reject)
    doc.on('error', reject)

    doc.registerFont('Regular', path.join(FONTS_DIR, 'DejaVuSans.ttf'))
    doc.registerFont('Bold',    path.join(FONTS_DIR, 'DejaVuSans-Bold.ttf'))

    doc.pipe(stream)

    let y = 50

    // ── Шапка лабораторії ──
    doc.fontSize(10).font('Regular').fillColor('#000')
       .text('МедСкан — Медична інформаційна система', 50, y, { align: 'center', width: 495, lineBreak: false })
    y += 14

    doc.fontSize(8).fillColor('#666')
       .text('вул. Медична, 1, м. Київ | тел: +380 44 000-00-00', 50, y, { align: 'center', width: 495, lineBreak: false })
    y += 14

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#1a3a5c').lineWidth(2).stroke()
    y += 14

    // ── Заголовок ──
    doc.fontSize(13).fillColor('#222').font('Bold')
       .text('ЛАБОРАТОРНИЙ ЗВІТ', 50, y, { align: 'center', width: 495, lineBreak: false })
    y += 30

    // ── Дані пацієнта ──
    doc.fontSize(9).fillColor('#000')

    const labelX1 = 50,  valueX1 = 130
    const labelX2 = 360, valueX2 = 450
    const rowH = 16

    // Доступна ширина для значення лівої колонки: 360 - 130 = 230, мінус відступ
    const leftValueW  = 220
    const rightValueW = 95

    doc.font('Bold').text('Пацієнт:',     labelX1, y, { lineBreak: false })
    doc.font('Regular').text(patientName, valueX1, y, { width: leftValueW, lineBreak: false, ellipsis: true })
    doc.font('Bold').text('Дата забору:', labelX2, y, { lineBreak: false })
    doc.font('Regular').text(formatDate(date), valueX2, y, { width: rightValueW, lineBreak: false })
    y += rowH

    doc.font('Bold').text('Лікар:',        labelX1, y, { lineBreak: false })
    doc.font('Regular').text(doctorName,   valueX1, y, { width: leftValueW, lineBreak: false, ellipsis: true })
    doc.font('Bold').text('Категорія:',    labelX2, y, { lineBreak: false })
    doc.font('Regular').text(String(record.category ?? ''), valueX2, y, { width: rightValueW, lineBreak: false, ellipsis: true })
    y += rowH

    doc.font('Bold').text('Тип зразка:',  labelX1, y, { lineBreak: false })
    doc.font('Regular').text(String(record.fluid ?? ''), valueX1, y, { width: leftValueW, lineBreak: false, ellipsis: true })
    doc.font('Bold').text('№ звіту:',     labelX2, y, { lineBreak: false })
    doc.font('Regular').text(nextReportNo(), valueX2, y, { width: rightValueW, lineBreak: false })
    y += rowH + 14

    // ── Замовлене дослідження ──
    doc.font('Bold').text('Замовлене дослідження:', 50, y, { lineBreak: false })
    doc.font('Regular').text(String(record.unofficial_name ?? ''), 230, y, { width: 315, lineBreak: false, ellipsis: true })
    y += 14

    y += 10

    // ── Заголовок таблиці ──
    doc.fontSize(10).fillColor('#1a3a5c').font('Bold')
       .text('РЕЗУЛЬТАТИ ДОСЛІДЖЕНЬ', 50, y, { lineBreak: false })
    doc.fillColor('#000')
    y += 18

    // ── Таблиця (50..545 = 495px) ──
    // Показник:200  Результат:80  Одиниці:60  Реф.діап.:75  Статус:80  → 495
    const cols = [
      { key: 'name',     label: 'Показник',   x: 50,  w: 200 },
      { key: 'result',   label: 'Результат',  x: 250, w: 80  },
      { key: 'unit',     label: 'Одиниці',    x: 330, w: 60  },
      { key: 'refRange', label: 'Реф. діап.', x: 390, w: 75  },
      { key: 'status',   label: 'Статус',     x: 465, w: 80  },
    ]

    const headerH = 24
    const tableStartY = y
    doc.rect(50, y, 495, headerH).fill('#1a3a5c')
    doc.fillColor('#fff').fontSize(9).font('Bold')
    cols.forEach(c => {
      doc.text(c.label, c.x + 4, y + 8, { width: c.w - 8, lineBreak: false, ellipsis: true })
    })
    doc.fillColor('#000')
    y += headerH

    // Один рядок результату
    const rowItemH = 26
    doc.rect(50, y, 495, rowItemH).fill('#ffffff')

    const rowData = {
      name:     record.unofficial_name ?? '',
      result:   record.value           ?? '',
      unit:     record.unit            ?? '',
      refRange: '—',
      status,
    }

    cols.forEach(c => {
      const val   = String(rowData[c.key] ?? '')
      const color = (c.key === 'status' && isAbnormal) ? '#c0392b' : '#000'
      const font  = (c.key === 'status' && isAbnormal) ? 'Bold'    : 'Regular'
      doc.fillColor(color).font(font).fontSize(7)
         .text(val, c.x + 4, y + 9, { width: c.w - 8, ellipsis: true, lineBreak: false })
    })

    y += rowItemH

    doc.strokeColor('#ccc').lineWidth(0.5)
       .rect(50, tableStartY, 495, y - tableStartY).stroke()

    // ── Примітки ──
    y += 20
    doc.fontSize(8).fillColor('#888').font('Regular')
       .text('Результати слід інтерпретувати в клінічному контексті.', 50, y, { width: 495, lineBreak: false })
    y += 12
    doc.text('Аналіз виконано відповідно до стандартів ISO 15189.', 50, y, { width: 495, lineBreak: false })
    y += 20

    // ── Підпис ──
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke()
    y += 8
    doc.fontSize(8).fillColor('#666')
       .text(`Авторизовано: ${doctorName}  |  Клінічна лабораторія МедСкан`,
              50, y, { align: 'center', width: 495, lineBreak: false })
    doc.fillColor('#000')

    doc.end()
  })
}

// Текст для поля extracted_text в БД
// record = один рядок CSV датасету
export function buildExtractedText(record, patientName, doctorName, date) {
  const status = flagToStatus(record.flag)

  const lines = [
    'Клінічна лабораторія МедСкан',
    `Дата: ${formatDate(date)}`,
    `Пацієнт: ${patientName}`,
    `Лікар: ${doctorName}`,
    `Тип зразка: ${record.fluid ?? ''}`,
    `Категорія: ${record.category ?? ''}`,
    '',
    `Замовлене дослідження: ${record.unofficial_name ?? ''}`,
    '',
    'Показник | Результат | Одиниці | Реф. діапазон | Статус',
    `${record.unofficial_name} | ${record.value} | ${record.unit} | — | ${status}`,
    '',
    'Результати слід інтерпретувати в клінічному контексті.',
    `Авторизовано: ${doctorName} | Клінічна лабораторія МедСкан`,
  ]

  return lines.filter(l => l !== undefined && l !== null).join('\n')
}