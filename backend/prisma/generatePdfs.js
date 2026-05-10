import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─────────────────────────────────────────
// ПАПКА ДЛЯ PDF
// ─────────────────────────────────────────

export const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'research')

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

// ─────────────────────────────────────────
// ХЕЛПЕРИ
// ─────────────────────────────────────────

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomDecimal = (min, max, d = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(d))
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

function formatDate(date) {
  return date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}


// ─────────────────────────────────────────
// ГЕНЕРАТОРИ ПО ТИПАХ ДОСЛІДЖЕНЬ
// ─────────────────────────────────────────

function addTableRow(doc, label, value, unit = '', norm = '', isAbnormal = false) {
  const y = doc.y
  doc.fontSize(9).font('DejaVuSans').fillColor('#333').text(label, 52, y, { width: 200 })
  doc.fontSize(9).font('DejaVuSans-Bold').fillColor(isAbnormal ? '#cc0000' : '#000').text(value, 255, y, { width: 80 })
  doc.fontSize(9).font('DejaVuSans').fillColor('#555').text(unit, 335, y, { width: 60 })
  doc.fontSize(9).fillColor('#888').text(norm, 395, y, { width: 150 })
  doc.fillColor('#000')
  doc.moveDown(0.5)
}

// ── 1. Загальний аналіз крові ──────────────
function generateBloodTest(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ ЗАГАЛЬНОГО АНАЛІЗУ КРОВІ')
  doc.moveDown(0.3)

  // Заголовки таблиці
  doc.fontSize(8).font('DejaVuSans').fillColor('#888')
  doc.text('Показник', 52, doc.y, { width: 200, continued: true })
  doc.text('Результат', 255, doc.y - doc.currentLineHeight(), { width: 80, continued: true })
  doc.text('Одиниці', 335, doc.y - doc.currentLineHeight(), { width: 60, continued: true })
  doc.text('Норма', 395, doc.y - doc.currentLineHeight(), { width: 150 })
  doc.fillColor('#000')
  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke()
  doc.moveDown(0.3)

  const hgb = randomDecimal(110, 165)
  const wbc = randomDecimal(3.5, 11.0)
  const rbc = randomDecimal(3.5, 5.5)
  const plt = randomInt(150, 400)
  const hct = randomDecimal(35, 50)

  addTableRow(doc, 'Гемоглобін (HGB)', hgb.toString(), 'г/л', '120–160 г/л', hgb < 120 || hgb > 160)
  addTableRow(doc, 'Еритроцити (RBC)', rbc.toString(), '×10¹²/л', '3.8–5.5 ×10¹²/л', rbc < 3.8 || rbc > 5.5)
  addTableRow(doc, 'Лейкоцити (WBC)', wbc.toString(), '×10⁹/л', '4.0–9.0 ×10⁹/л', wbc < 4.0 || wbc > 9.0)
  addTableRow(doc, 'Тромбоцити (PLT)', plt.toString(), '×10⁹/л', '150–400 ×10⁹/л', plt < 150 || plt > 400)
  addTableRow(doc, 'Гематокрит (HCT)', hct.toString(), '%', '36–48%', hct < 36 || hct > 48)
  addTableRow(doc, 'ШОЕ', randomInt(2, 25).toString(), 'мм/год', '1–15 мм/год')
  addTableRow(doc, 'Нейтрофіли', randomDecimal(45, 75).toString(), '%', '45–75%')
  addTableRow(doc, 'Лімфоцити', randomDecimal(18, 40).toString(), '%', '18–40%')
  addTableRow(doc, 'Моноцити', randomDecimal(2, 9).toString(), '%', '2–9%')
  addTableRow(doc, 'Еозинофіли', randomDecimal(0, 5).toString(), '%', '0–5%')

  doc.moveDown(0.8)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    'Показники крові в межах вікової норми. Патологічних змін не виявлено.',
    'Незначна анемія легкого ступеня. Рекомендована консультація терапевта.',
    'Показники в межах норми. Динамічне спостереження.',
    'Виявлено лейкоцитоз, що може свідчити про запальний процес. Рекомендовано повторне дослідження.',
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 2. Біохімічний аналіз крові ────────────
function generateBiochemistry(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ БІОХІМІЧНОГО АНАЛІЗУ КРОВІ')
  doc.moveDown(0.3)

  doc.fontSize(8).font('DejaVuSans').fillColor('#888')
  doc.text('Показник', 52, doc.y, { width: 200, continued: true })
  doc.text('Результат', 255, doc.y - doc.currentLineHeight(), { width: 80, continued: true })
  doc.text('Одиниці', 335, doc.y - doc.currentLineHeight(), { width: 60, continued: true })
  doc.text('Норма', 395, doc.y - doc.currentLineHeight(), { width: 150 })
  doc.fillColor('#000')
  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke()
  doc.moveDown(0.3)

  const glucose = randomDecimal(3.5, 9.0)
  const cholesterol = randomDecimal(3.0, 7.5)
  const creatinine = randomInt(55, 130)
  const alt = randomInt(10, 60)
  const ast = randomInt(10, 55)

  addTableRow(doc, 'Глюкоза', glucose.toString(), 'ммоль/л', '3.9–6.1 ммоль/л', glucose > 6.1)
  addTableRow(doc, 'Загальний холестерин', cholesterol.toString(), 'ммоль/л', '<5.2 ммоль/л', cholesterol > 5.2)
  addTableRow(doc, 'Тригліцериди', randomDecimal(0.5, 2.5).toString(), 'ммоль/л', '<1.7 ммоль/л')
  addTableRow(doc, 'АЛТ', alt.toString(), 'Од/л', '7–40 Од/л', alt > 40)
  addTableRow(doc, 'АСТ', ast.toString(), 'Од/л', '10–40 Од/л', ast > 40)
  addTableRow(doc, 'Білірубін загальний', randomDecimal(5, 25).toString(), 'мкмоль/л', '5–21 мкмоль/л')
  addTableRow(doc, 'Загальний білок', randomDecimal(60, 85).toString(), 'г/л', '64–83 г/л')
  addTableRow(doc, 'Сечовина', randomDecimal(2.5, 8.0).toString(), 'ммоль/л', '2.5–8.3 ммоль/л')
  addTableRow(doc, 'Креатинін', creatinine.toString(), 'мкмоль/л', '55–115 мкмоль/л', creatinine > 115)
  addTableRow(doc, 'Сечова кислота', randomInt(150, 420).toString(), 'мкмоль/л', '140–420 мкмоль/л')

  doc.moveDown(0.8)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    'Біохімічні показники крові в межах норми.',
    'Виявлено підвищення рівня глюкози. Рекомендована консультація ендокринолога.',
    'Незначне підвищення холестерину. Рекомендована дієтотерапія.',
    'Показники печінкових ферментів дещо підвищені. Повторний аналіз через 2 тижні.',
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 3. Загальний аналіз сечі ────────────────
function generateUrineTest(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ ЗАГАЛЬНОГО АНАЛІЗУ СЕЧІ')
  doc.moveDown(0.3)

  doc.fontSize(8).font('DejaVuSans').fillColor('#888')
  doc.text('Показник', 52, doc.y, { width: 200, continued: true })
  doc.text('Результат', 255, doc.y - doc.currentLineHeight(), { width: 130, continued: true })
  doc.text('Норма', 385, doc.y - doc.currentLineHeight(), { width: 160 })
  doc.fillColor('#000')
  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke()
  doc.moveDown(0.3)

  const colors = ['Солом\'яно-жовтий', 'Жовтий', 'Світло-жовтий']
  const transparencies = ['Прозора', 'Злегка каламутна', 'Прозора']
  const ph = randomDecimal(5.0, 7.5)

  doc.fontSize(9).font('DejaVuSans')
  const rows = [
    ['Колір', randomItem(colors), 'Солом\'яно-жовтий'],
    ['Прозорість', randomItem(transparencies), 'Прозора'],
    ['pH', ph.toString(), '5.0–7.0'],
    ['Питома вага', `1.0${randomInt(10, 25)}`, '1.010–1.025'],
    ['Білок', randomItem(['Відсутній', 'Сліди', '0.033 г/л']), 'Відсутній'],
    ['Глюкоза', 'Відсутня', 'Відсутня'],
    ['Лейкоцити', `${randomInt(0, 8)} в п/з`, '0–5 в п/з'],
    ['Еритроцити', `${randomInt(0, 3)} в п/з`, '0–2 в п/з'],
    ['Циліндри', 'Відсутні', 'Відсутні'],
    ['Бактерії', randomItem(['Відсутні', 'Поодинокі']), 'Відсутні'],
  ]

  for (const [label, value, norm] of rows) {
    doc.text(label, 52, doc.y, { width: 200, continued: true })
    doc.font('DejaVuSans-Bold').text(value, 255, doc.y - doc.currentLineHeight(), { width: 130, continued: true })
    doc.font('DejaVuSans').fillColor('#888').text(norm, 385, doc.y - doc.currentLineHeight(), { width: 160 })
    doc.fillColor('#000')
    doc.moveDown(0.5)
  }

  doc.moveDown(0.8)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    'Показники сечі в межах норми.',
    'Незначна лейкоцитурія. Рекомендовано повторний аналіз.',
    'Аналіз сечі без патологічних змін.',
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 4. ЕКГ ──────────────────────────────────
function generateECG(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ ЕЛЕКТРОКАРДІОГРАФІЇ (ЕКГ)')
  doc.moveDown(0.5)

  doc.fontSize(9).font('DejaVuSans')
  const hr = randomInt(58, 95)
  const pq = randomDecimal(0.12, 0.22, 2)
  const qrs = randomDecimal(0.06, 0.12, 2)
  const qt = randomDecimal(0.34, 0.44, 2)

  const params = [
    ['Ритм серця:', 'Синусовий'],
    ['Частота серцевих скорочень:', `${hr} уд/хв`],
    ['Електрична вісь серця:', randomItem(['Нормальна', 'Відхилення вліво', 'Вертикальна'])],
    ['Інтервал P-Q:', `${pq} с (норма 0.12–0.20 с)`],
    ['Комплекс QRS:', `${qrs} с (норма 0.06–0.10 с)`],
    ['Інтервал Q-T:', `${qt} с`],
    ['Сегмент ST:', randomItem(['На ізолінії', 'Незначна депресія', 'Без змін'])],
    ['Зубець Т:', randomItem(['Позитивний у всіх відведеннях', 'Сплощений у V4–V6', 'Нормальний'])],
  ]

  for (const [label, value] of params) {
    doc.font('DejaVuSans').text(label, 52, doc.y, { width: 240, continued: true })
    doc.font('DejaVuSans-Bold').text(value, { width: 250 })
    doc.moveDown(0.3)
  }

  doc.moveDown(0.5)

  // Імітація "графіку" текстом
  doc.fontSize(8).fillColor('#aaa').text('[ Графік ЕКГ — відведення I, II, III, aVR, aVL, aVF, V1–V6 ]', { align: 'center' })
  doc.moveDown(0.3)
  // Проста лінія як плейсхолдер
  for (let i = 0; i < 3; i++) {
    const y = doc.y
    doc.moveTo(52, y).lineTo(545, y).strokeColor('#ddd').lineWidth(0.5).stroke()
    doc.moveDown(1.2)
  }
  doc.fillColor('#000').lineWidth(1)

  doc.moveDown(0.5)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    `Синусовий ритм з ЧСС ${hr} уд/хв. ЕКГ без патологічних змін.`,
    `Синусова тахікардія. ЧСС ${hr} уд/хв. Змін сегменту ST не виявлено.`,
    `Синусовий ритм, ЧСС ${hr} уд/хв. Ознаки гіпертрофії лівого шлуночка.`,
    `Норма. Синусовий ритм, правильний. ЧСС ${hr} уд/хв.`,
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 5. УЗД черевної порожнини ───────────────
function generateUltrasound(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ УЗД ЧЕРЕВНОЇ ПОРОЖНИНИ')
  doc.moveDown(0.5)

  const organs = [
    {
      name: 'Печінка',
      findings: [
        'Розміри не збільшені. Ехогенність нормальна. Структура однорідна. Внутрішньопечінкові жовчні протоки не розширені.',
        'Помірно збільшена. Ехогенність підвищена. Ознаки жирової інфільтрації.',
        'Розміри в межах норми. Ехоструктура однорідна.',
      ]
    },
    {
      name: 'Жовчний міхур',
      findings: [
        'Розміри нормальні. Стінки не потовщені. Вміст однорідний. Конкременти не виявлено.',
        'Розміри збільшені. Стінки дещо потовщені. Ехогенний осад.',
        'Нормальних розмірів, стінки не змінені.',
      ]
    },
    {
      name: 'Підшлункова залоза',
      findings: [
        'Розміри в межах норми. Ехогенність нормальна. Протока не розширена.',
        'Незначно збільшена головка. Ехогенність підвищена.',
        'Без патологічних змін.',
      ]
    },
    {
      name: 'Селезінка',
      findings: [
        'Розміри нормальні. Структура однорідна.',
        'Незначна спленомегалія.',
        'Без змін.',
      ]
    },
    {
      name: 'Нирки',
      findings: [
        'Обидві нирки нормальних розмірів і форми. Паренхіма однорідна. ЧМС не розширена.',
        'Права нирка — мікролітіаз. Ліва нирка без патології.',
        'Ехопозитивні включення до 3 мм без акустичної тіні.',
      ]
    },
  ]

  doc.fontSize(9).font('DejaVuSans')
  for (const organ of organs) {
    doc.font('DejaVuSans-Bold').text(organ.name + ':')
    doc.font('DejaVuSans').text(randomItem(organ.findings), { indent: 15 })
    doc.moveDown(0.4)
  }

  doc.moveDown(0.3)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    'Ехографічних ознак патології органів черевної порожнини не виявлено.',
    'Ознаки жирової інфільтрації печінки. Інші органи без патології.',
    'Мікролітіаз нирок. Рекомендоване урологічне спостереження.',
    'УЗД картина без суттєвих патологічних змін.',
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 6. Рентген грудної клітки ───────────────
function generateXray(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ РЕНТГЕНОГРАФІЇ ОРГАНІВ ГРУДНОЇ КЛІТКИ')
  doc.moveDown(0.5)

  doc.fontSize(9).font('DejaVuSans')

  const sections = [
    ['Якість знімку:', 'Задовільна. Знімок у прямій проекції.'],
    ['Легеневі поля:', randomItem([
      'Легеневі поля прозорі. Вогнищевих та інфільтративних змін не виявлено.',
      'Посилення легеневого малюнка в прикореневих зонах.',
      'Легеневий малюнок помірно посилений. Коріння структурні.',
    ])],
    ['Корені легень:', randomItem(['Структурні, не розширені.', 'Дещо розширені та ущільнені.', 'Нормальні.'])],
    ['Серце:', randomItem([
      'Серце нормальних розмірів і форми. Кардіоторакальний індекс в нормі.',
      'Незначне збільшення лівого шлуночка.',
      'Форма і розміри серця в межах норми.',
    ])],
    ['Діафрагма:', randomItem(['Куполи діафрагми рівні, чіткі.', 'Правий купол дещо піднятий.', 'Без особливостей.'])],
    ['Синуси:', 'Костодіафрагмальні синуси вільні.'],
    ['Кісткова система:', randomItem(['Патологічних змін кісткової системи не виявлено.', 'Дегенеративні зміни хребта.', 'Без патології.'])],
  ]

  for (const [label, value] of sections) {
    doc.font('DejaVuSans-Bold').text(label, 52, doc.y, { width: 180, continued: true })
    doc.font('DejaVuSans').text(value, { width: 310 })
    doc.moveDown(0.4)
  }

  doc.moveDown(0.3)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    'Рентгенологічна картина органів грудної клітки без патологічних змін.',
    'Ознаки хронічного бронхіту. Рекомендована консультація пульмонолога.',
    'Серцево-судинна тінь без особливостей. Легені без вогнищевих змін.',
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 7. МРТ головного мозку ──────────────────
function generateMRI(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ МРТ ГОЛОВНОГО МОЗКУ')
  doc.moveDown(0.5)

  doc.fontSize(9).font('DejaVuSans')
  doc.text(`Методика: МРТ головного мозку в режимах T1, T2, FLAIR, DWI. Без контрастного підсилення.`)
  doc.moveDown(0.5)

  const sections = [
    ['Кора та біла речовина:', randomItem([
      'Диференціація кори та білої речовини збережена. Вогнищевих змін сигналу не виявлено.',
      'Поодинокі дрібні гіперінтенсивні вогнища в білій речовині лобових часток.',
      'Без патологічних змін.',
    ])],
    ['Шлуночкова система:', randomItem([
      'Шлуночки мозку симетричні, нормальних розмірів.',
      'Помірне розширення бокових шлуночків.',
      'Без особливостей.',
    ])],
    ['Мозолисте тіло:', 'Стандартних розмірів і форми, сигнал однорідний.'],
    ['Мозочок та стовбур:', 'Без вогнищевих змін.'],
    ['Гіпофіз:', randomItem(['Розміри та форма в нормі.', 'Незначне збільшення гіпофізу.', 'Без змін.'])],
    ['Субарахноїдальні простори:', randomItem(['Не розширені.', 'Помірно розширені.', 'В межах норми.'])],
    ['Внутрішні слухові ходи:', 'Симетричні.'],
  ]

  for (const [label, value] of sections) {
    doc.font('DejaVuSans-Bold').text(label, 52, doc.y, { width: 200, continued: true })
    doc.font('DejaVuSans').text(value, { width: 295 })
    doc.moveDown(0.4)
  }

  doc.moveDown(0.3)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    'МРТ картина без вогнищевої патології головного мозку.',
    'Поодинокі дрібні гіперінтенсивні вогнища судинного генезу в білій речовині. Клінічна оцінка необхідна.',
    'Ознаки помірної зовнішньої гідроцефалії. Рекомендована консультація невролога.',
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 8. Ехокардіографія ──────────────────────
function generateEcho(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ ЕХОКАРДІОГРАФІЇ')
  doc.moveDown(0.5)

  doc.fontSize(9).font('DejaVuSans')

  const ef = randomInt(50, 70)
  const lv = randomDecimal(42, 58)
  const params = [
    ['Фракція викиду ЛШ:', `${ef}%`, '≥55%'],
    ['КДР лівого шлуночка:', `${lv} мм`, '37–55 мм'],
    ['МШП:', `${randomDecimal(7, 12)} мм`, '7–11 мм'],
    ['ЗСЛШ:', `${randomDecimal(7, 12)} мм`, '7–11 мм'],
    ['Розмір лівого передсердя:', `${randomDecimal(28, 40)} мм`, '25–40 мм'],
    ['Мітральний клапан:', randomItem(['Без патології', 'Мінімальна регургітація', 'Ущільнення стулок']), ''],
    ['Аортальний клапан:', randomItem(['Без патології', 'Незначний кальциноз', 'Стулки не змінені']), ''],
    ['Перикард:', 'Без ознак випоту.', ''],
  ]

  // Заголовки
  doc.fontSize(8).fillColor('#888')
  doc.text('Параметр', 52, doc.y, { width: 200, continued: true })
  doc.text('Значення', 255, doc.y - doc.currentLineHeight(), { width: 100, continued: true })
  doc.text('Норма', 355, doc.y - doc.currentLineHeight(), { width: 190 })
  doc.fillColor('#000')
  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke()
  doc.moveDown(0.3)

  for (const [label, value, norm] of params) {
    doc.fontSize(9).font('DejaVuSans').text(label, 52, doc.y, { width: 200, continued: true })
    doc.font('DejaVuSans-Bold').text(value, 255, doc.y - doc.currentLineHeight(), { width: 100, continued: true })
    doc.font('DejaVuSans').fillColor('#888').text(norm, 355, doc.y - doc.currentLineHeight(), { width: 190 })
    doc.fillColor('#000')
    doc.moveDown(0.5)
  }

  doc.moveDown(0.5)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    `Глобальна скоротлива функція міокарду збережена (ФВ ${ef}%). Клапанної патології не виявлено.`,
    `ФВ ЛШ ${ef}%. Ознаки помірної гіпертрофії лівого шлуночка. Діастолічна дисфункція I типу.`,
    `Ехокардіографія в межах вікової норми. ФВ ${ef}%.`,
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 9. Спірометрія ──────────────────────────
function generateSpirometry(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ СПІРОМЕТРІЇ')
  doc.moveDown(0.5)

  doc.fontSize(9).font('DejaVuSans')

  const fvc = randomDecimal(70, 110)
  const fev1 = randomDecimal(65, 105)
  const ratio = randomDecimal(70, 85)

  const params = [
    ['ФЖЄЛ (FVC)', `${randomDecimal(2.5, 5.0)} л`, `${fvc}% від норми`, '≥80% від належного'],
    ['ОФВ1 (FEV1)', `${randomDecimal(2.0, 4.5)} л`, `${fev1}% від норми`, '≥80% від належного'],
    ['ОФВ1/ФЖЄЛ', `${ratio}%`, '', '>70%'],
    ['ПОШ (PEF)', `${randomDecimal(5.0, 10.0)} л/с`, `${randomDecimal(75, 105)}% від норми`, '≥80%'],
    ['МОШ25', `${randomDecimal(4.0, 8.0)} л/с`, `${randomDecimal(70, 100)}% від норми`, '≥80%'],
    ['МОШ75', `${randomDecimal(1.0, 4.0)} л/с`, `${randomDecimal(60, 100)}% від норми`, '≥80%'],
  ]

  doc.fontSize(8).fillColor('#888')
  doc.text('Показник', 52, doc.y, { width: 140, continued: true })
  doc.text('Абс.', 195, doc.y - doc.currentLineHeight(), { width: 80, continued: true })
  doc.text('% від норми', 275, doc.y - doc.currentLineHeight(), { width: 120, continued: true })
  doc.text('Норма', 395, doc.y - doc.currentLineHeight(), { width: 150 })
  doc.fillColor('#000')
  doc.moveDown(0.3)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke()
  doc.moveDown(0.3)

  for (const [label, abs, pct, norm] of params) {
    doc.fontSize(9).font('DejaVuSans').text(label, 52, doc.y, { width: 140, continued: true })
    doc.font('DejaVuSans-Bold').text(abs, 195, doc.y - doc.currentLineHeight(), { width: 80, continued: true })
    doc.font('DejaVuSans').text(pct, 275, doc.y - doc.currentLineHeight(), { width: 120, continued: true })
    doc.fillColor('#888').text(norm, 395, doc.y - doc.currentLineHeight(), { width: 150 })
    doc.fillColor('#000')
    doc.moveDown(0.5)
  }

  doc.moveDown(0.5)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Тип порушень вентиляції:')
  doc.font('DejaVuSans').text(ratio >= 70
    ? 'Обструктивних та рестриктивних порушень не виявлено.'
    : 'Обструктивні порушення легкого ступеня.')

  doc.moveDown(0.3)
  doc.font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    'Функція зовнішнього дихання в межах норми.',
    'Легкі обструктивні зміни. Рекомендована консультація пульмонолога.',
    'Показники спірометрії відповідають нормі для даного віку та зросту.',
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ── 10. КТ органів грудної клітки ──────────
function generateCT(doc, patientName, doctorName, date) {
  doc.fontSize(11).font('DejaVuSans-Bold').text('РЕЗУЛЬТАТИ КТ ОРГАНІВ ГРУДНОЇ КЛІТКИ')
  doc.moveDown(0.5)

  doc.fontSize(9).font('DejaVuSans')
  doc.text('Методика: МСКТ органів грудної клітки без внутрішньовенного контрастування. Зрізи 1 мм.')
  doc.moveDown(0.5)

  const sections = [
    ['Легені:', randomItem([
      'Легеневі поля без вогнищевих та інфільтративних змін. Легеневий малюнок не змінений.',
      'Поодинокі дрібні вогнища субплевральної локалізації до 3 мм. Ознаки пневмофіброзу.',
      'Без вогнищевої патології. Емфізематозні зміни в S1-S2 сегментах.',
    ])],
    ['Бронхи:', randomItem(['Прохідні на всіх рівнях.', 'Стінки бронхів дещо потовщені.', 'Без змін.'])],
    ['Плевра:', randomItem(['Плевральних випотів немає.', 'Мінімальний правосторонній гідроторакс.', 'Без патології.'])],
    ['Середостіння:', randomItem(['Лімфатичні вузли не збільшені. Зміщення середостіння немає.', 'Без особливостей.', 'Нормальне.'])],
    ['Серце:', randomItem(['Розміри та конфігурація серця в нормі.', 'Незначне розширення камер серця.', 'Без змін.'])],
    ['Кісткова система:', randomItem(['Дегенеративні зміни хребта.', 'Без патологічних змін.', 'Остеохондроз.'])],
  ]

  for (const [label, value] of sections) {
    doc.font('DejaVuSans-Bold').text(label, 52, doc.y, { width: 140, continued: true })
    doc.font('DejaVuSans').text(value, { width: 355 })
    doc.moveDown(0.4)
  }

  doc.moveDown(0.3)
  doc.fontSize(9).font('DejaVuSans-Bold').text('Висновок:')
  const conclusions = [
    'КТ картина без ознак гострої патології органів грудної клітки.',
    'Ознаки помірного пневмофіброзу. Рекомендована консультація пульмонолога.',
    'КТ органів грудної клітки в межах вікової норми.',
  ]
  doc.font('DejaVuSans').text(randomItem(conclusions))
}

// ─────────────────────────────────────────
// ОСНОВНА ФУНКЦІЯ ГЕНЕРАЦІЇ ОДНОГО PDF
// ─────────────────────────────────────────

const generators = {
  'Загальний аналіз крові':       generateBloodTest,
  'Біохімічний аналіз крові':     generateBiochemistry,
  'Загальний аналіз сечі':        generateUrineTest,
  'ЕКГ':                          generateECG,
  'УЗД черевної порожнини':       generateUltrasound,
  'Рентген грудної клітки':       generateXray,
  'МРТ головного мозку':          generateMRI,
  'КТ органів грудної клітки':    generateCT,
  'Ехокардіографія':              generateEcho,
  'Спірометрія':                  generateSpirometry,
}

export function generateResearchPdf({ researchType, patientName, doctorName, date, fileName }) {
  return new Promise((resolve, reject) => {
    ensureUploadsDir()

    const FONTS_DIR = path.join(__dirname, 'fonts')
    const filePath = path.join(UPLOADS_DIR, fileName)
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    doc.registerFont('DejaVuSans', path.join(FONTS_DIR, 'DejaVuSans.ttf'))
    doc.registerFont('DejaVuSans-Bold', path.join(FONTS_DIR, 'DejaVuSans-Bold.ttf'))
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // Шапка
    doc.fontSize(10).font('DejaVuSans').text('МедСкан — Медична інформаційна система', { align: 'center' })
    doc.fontSize(8).fillColor('#666').text('вул. Медична, 1, м. Київ | тел: +380 44 000-00-00', { align: 'center' })
    doc.fillColor('#000')
    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#999').lineWidth(1).stroke()
    doc.moveDown(0.5)

    // Мета-інфо
    doc.fontSize(9).font('DejaVuSans')
    doc.text(`Пацієнт: ${patientName}`, 52, doc.y, { continued: true })
    doc.text(`Дата: ${formatDate(date)}`, { align: 'right' })
    doc.text(`Лікар: ${doctorName}`)
    doc.moveDown(0.5)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke()
    doc.moveDown(0.8)

    // Контент по типу
    const generator = generators[researchType]
    if (generator) {
      generator(doc, patientName, doctorName, formatDate(date))
    } else {
      doc.fontSize(11).font('DejaVuSans-Bold').text(`РЕЗУЛЬТАТИ: ${researchType.toUpperCase()}`)
      doc.moveDown(0.5)
      doc.fontSize(9).font('DejaVuSans').text('Показники в межах норми. Патологічних змін не виявлено.')
    }

    // Підпис
    doc.moveDown(1.5)
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke()
    doc.moveDown(0.5)
    doc.fontSize(8).fillColor('#666')
    doc.text(`Лікар: ${doctorName}`, 52, doc.y, { continued: true })
    doc.text(`Дата видачі: ${formatDate(date)}`, { align: 'right' })
    doc.text('Підпис: ___________________', 52)
    doc.fillColor('#000')

    doc.end()

    stream.on('finish', () => resolve(filePath))
    stream.on('error', reject)
  })
}

export { randomItem, randomInt }