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

export function generateResearchPdfFromDataset({ record, patientName, doctorName, date, fileName, outputDir }) {
  return new Promise((resolve, reject) => {
    
    const dir      = outputDir ?? UPLOADS_DIR
    const filePath = path.join(dir, fileName)

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    let data
    try {
      data = typeof record.report_data === 'string'
        ? JSON.parse(record.report_data)
        : record.report_data
    } catch (e) {
      return reject(new Error(`Invalid report_data JSON: ${e.message}`))
    }

    const doc    = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true })
    const stream = fs.createWriteStream(filePath)

    stream.on('finish', () => resolve(filePath))
    stream.on('error', reject)
    doc.on('error', reject)

    doc.registerFont('Regular', path.join(FONTS_DIR, 'DejaVuSans.ttf'))
    doc.registerFont('Bold',    path.join(FONTS_DIR, 'DejaVuSans-Bold.ttf'))

    doc.pipe(stream)

    // Все координаты — абсолютные. Ведём свой y.
    let y = 50

    // ── Шапка лабораторії ──
    doc.fontSize(10).font('Regular').fillColor('#000')
       .text('МедСкан — Медична інформаційна система', 50, y, { align: 'center', width: 495, lineBreak: false })
    y += 14

    doc.fontSize(8).fillColor('#666')
       .text('вул. Медична, 1, м. Київ | тел: +380 44 000-00-00', 50, y, { align: 'center', width: 495, lineBreak: false })
    y += 14

    doc.fillColor('#000')
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#1a3a5c').lineWidth(2).stroke()
    y += 14

    // ── Заголовок ──
    doc.fontSize(13).fillColor('#222').font('Bold')
       .text('ЛАБОРАТОРНИЙ ЗВІТ', 50, y, { align: 'center', width: 495, lineBreak: false })
    y += 30

    // ── Дані пацієнта (двоколонкова сітка) ──
    doc.fontSize(9).fillColor('#000')

    const labelX1 = 50,  valueX1 = 130
    const labelX2 = 300, valueX2 = 390
    const rowH = 16

    doc.font('Bold').text('ID пацієнта:', labelX1, y, { lineBreak: false })
    doc.font('Regular').text(String(data.patientId ?? ''), valueX1, y, { lineBreak: false })
    doc.font('Bold').text('Дата забору:', labelX2, y, { lineBreak: false })
    doc.font('Regular').text(formatDate(date) || String(data.collection ?? ''), valueX2, y, { lineBreak: false })
    y += rowH

    doc.font('Bold').text('ID зразка:', labelX1, y, { lineBreak: false })
    doc.font('Regular').text(String(data.sampleId ?? ''), valueX1, y, { lineBreak: false })
    doc.font('Bold').text('Лікар:', labelX2, y, { lineBreak: false })
    doc.font('Regular').text(String(doctorName || data.physician || ''), valueX2, y, { lineBreak: false })
    y += rowH

    doc.font('Bold').text('Тип зразка:', labelX1, y, { lineBreak: false })
    doc.font('Regular').text(String(data.sampleType ?? ''), valueX1, y, { lineBreak: false })
    doc.font('Bold').text('Лабораторія:', labelX2, y, { lineBreak: false })
    doc.font('Regular').text(String(data.lab ?? ''), valueX2, y, { width: 155, lineBreak: false, ellipsis: true })
    y += rowH + 18

    // ── Замовлене дослідження ──
    doc.font('Bold').text('Замовлене дослідження:', 50, y, { lineBreak: false })
    doc.font('Regular').text(String(record.raw_test_name ?? ''), 220, y, { width: 325, lineBreak: false, ellipsis: true })
    y += 18

    // ── Заголовок таблиці ──
    doc.fontSize(10).fillColor('#1a3a5c').font('Bold')
       .text('РЕЗУЛЬТАТИ ДОСЛІДЖЕНЬ', 50, y, { lineBreak: false })
    doc.fillColor('#000')
    y += 18

    // ── Таблиця результатів ──
    const cols = [
      { key: 'name',     label: 'Показник',       x: 50,  w: 160 },
      { key: 'result',   label: 'Результат',       x: 210, w: 90  },
      { key: 'unit',     label: 'Одиниці',         x: 300, w: 55  },
      { key: 'refRange', label: 'Реф. діапазон',   x: 355, w: 90  },
      { key: 'status',   label: 'Статус',          x: 445, w: 100 },
    ]

    const headerH = 22
    doc.rect(50, y, 495, headerH).fill('#1a3a5c')
    doc.fillColor('#fff').fontSize(9).font('Bold')
    cols.forEach(c => {
      doc.text(c.label, c.x + 4, y + 7, { width: c.w - 8, lineBreak: false })
    })
    doc.fillColor('#000')
    y += headerH

    const ABNORMAL = new Set([
      'HIGH', 'LOW', 'ABNORMAL',
      'ВИСОКИЙ', 'НИЗЬКИЙ', 'АНОМАЛЬНИЙ', 'НЕОБР', 'АБОВІННОСТ',
    ])

    const rowItemH = 24
    const tableStartY = y - headerH
    doc.fontSize(9)

    data.parameters.forEach((p, i) => {
      const bg         = i % 2 === 0 ? '#ffffff' : '#f6f6f6'
      const isAbnormal = ABNORMAL.has(String(p.status).toUpperCase().trim())

      doc.rect(50, y, 495, rowItemH).fill(bg)

      cols.forEach(c => {
        const val   = String(p[c.key] ?? '')
        const color = (c.key === 'status' && isAbnormal) ? '#c0392b' : '#000'
        const font  = (c.key === 'status' && isAbnormal) ? 'Bold' : 'Regular'
        doc.fillColor(color).font(font)
           .text(val, c.x + 4, y + 8, { width: c.w - 8, ellipsis: true, lineBreak: false })
      })

      y += rowItemH
    })

    doc.strokeColor('#ccc').lineWidth(0.5).rect(50, tableStartY, 495, y - tableStartY).stroke()

    // ── Примітки ──
    y += 20
    doc.fontSize(8).fillColor('#888').font('Regular')
       .text('Результати слід інтерпретувати в клінічному контексті.', 50, y, { width: 495, lineBreak: false })
    y += 12
    doc.text('Аналіз виконано відповідно до стандартів ISO 15189.', 50, y, { width: 495, lineBreak: false })
    y += 12
    doc.text(`№ звіту: ${data.reportNo ?? ''}    Дата звіту: ${data.reportDate ?? ''}`, 50, y, { width: 495, lineBreak: false })
    y += 20

    // ── Підпис ──
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ccc').stroke()
    y += 8
    doc.fontSize(8).fillColor('#666')
       .text(`Авторизовано: ${doctorName || data.physician || ''}  |  ${data.lab ?? ''}`,
              50, y, { align: 'center', width: 495, lineBreak: false })
    doc.fillColor('#000')

    doc.end()
  })
}

export function buildExtractedText(record, patientName, doctorName, date) {
  const data = typeof record.report_data === 'string'
    ? JSON.parse(record.report_data)
    : record.report_data

  const lines = [
    data.lab,
    `№ звіту: ${data.reportNo}    Дата: ${data.reportDate}`,
    `Пацієнт: ${patientName}`,
    `Лікар: ${doctorName}`,
    `Тип зразка: ${data.sampleType}`,
    '',
    `Замовлене дослідження: ${record.raw_test_name}`,
    record.long_name ? `Стандартна назва: ${record.long_name}` : '',
    '',
    'Показник | Результат | Одиниці | Реф. діапазон | Статус',
    ...data.parameters.map(p =>
      `${p.name} | ${p.result} | ${p.unit} | ${p.refRange} | ${p.status}`
    ),
    '',
    'Результати слід інтерпретувати в клінічному контексті.',
    `Авторизовано: ${doctorName} | ${data.lab}`,
  ]

  return lines.filter(Boolean).join('\n')
}