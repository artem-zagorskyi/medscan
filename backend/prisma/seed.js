import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcrypt'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import 'dotenv/config'
import {
  generateResearchPdfFromDataset,
  buildExtractedText,
  UPLOADS_DIR,
  randomItem,
  randomInt,
} from './generatePdfs.js'

const SALT_ROUNDS = 12
const PEPPER      = process.env.PEPPER_SECRET
const DATASET_PATH = './dataset_uk.csv'

const adapter = new PrismaMariaDb({
  host:                    'localhost',
  port:                    3306,
  user:                    process.env.DB_USER,
  password:                process.env.DB_PASSWORD,
  database:                process.env.DB_NAME,
  connectionLimit:         5,
  allowPublicKeyRetrieval: true,
})

const prisma = new PrismaClient({ adapter })

// ─────────────────────────────────────────
// ДАТАСЕТ
// Кожен рядок CSV = окремий звіт (один параметр)
// Поля: mimic_label, common_name, unofficial_name, category, fluid, value, valuenum, unit, flag
// ─────────────────────────────────────────

let datasetRecords = []
try {
  const raw = fs.readFileSync(DATASET_PATH, 'utf-8')
  datasetRecords = parse(raw, { columns: true, skip_empty_lines: true })
  console.log(`📊 Dataset loaded: ${datasetRecords.length} records from ${DATASET_PATH}`)
} catch (e) {
  console.warn(`⚠️  Dataset not found at ${DATASET_PATH}`)
  console.warn('   PDF generation will be skipped.')
}

function pickDatasetRecord() {
  if (datasetRecords.length === 0) return null
  return datasetRecords[Math.floor(Math.random() * datasetRecords.length)]
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const hashPassword = async (pw) => bcrypt.hash(pw + PEPPER, SALT_ROUNDS)

const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))

const randomDecimal = (min, max, decimals = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals))

// ─────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────

const specializations = [
  'Кардіологія', 'Неврологія', 'Хірургія', 'Терапія',
  'Педіатрія', 'Офтальмологія', 'Ортопедія', 'Дерматологія',
  'Ендокринологія', 'Пульмонологія',
]

const doctorPersons = [
  { last_name: 'Коваленко', first_name: 'Олексій',   middle_name: 'Іванович',    gender: 'MALE',   contact_info: '+380501234567' },
  { last_name: 'Мельник',   first_name: 'Наталія',   middle_name: 'Петрівна',    gender: 'FEMALE', contact_info: '+380502345678' },
  { last_name: 'Шевченко',  first_name: 'Дмитро',    middle_name: 'Олегович',    gender: 'MALE',   contact_info: '+380503456789' },
  { last_name: 'Бойко',     first_name: 'Оксана',    middle_name: 'Василівна',   gender: 'FEMALE', contact_info: '+380504567890' },
  { last_name: 'Захаренко', first_name: 'Андрій',    middle_name: 'Миколайович', gender: 'MALE',   contact_info: '+380505678901' },
  { last_name: 'Лисенко',   first_name: 'Ірина',     middle_name: 'Сергіївна',   gender: 'FEMALE', contact_info: '+380506789012' },
  { last_name: 'Гриценко',  first_name: 'Василь',    middle_name: 'Федорович',   gender: 'MALE',   contact_info: '+380507890123' },
  { last_name: 'Марченко',  first_name: 'Людмила',   middle_name: 'Андріївна',   gender: 'FEMALE', contact_info: '+380508901234' },
  { last_name: 'Тимченко',  first_name: 'Олег',      middle_name: 'Вікторович',  gender: 'MALE',   contact_info: '+380509012345' },
  { last_name: 'Павленко',  first_name: 'Тетяна',    middle_name: 'Юріївна',     gender: 'FEMALE', contact_info: '+380500123456' },
]

const patientPersons = [
  { last_name: 'Іваненко',   first_name: 'Микола',    middle_name: 'Петрович',    gender: 'MALE',   contact_info: '+380671234567' },
  { last_name: 'Петренко',   first_name: 'Ганна',     middle_name: 'Іванівна',    gender: 'FEMALE', contact_info: '+380672345678' },
  { last_name: 'Сидоренко',  first_name: 'Олександр', middle_name: 'Васильович',  gender: 'MALE',   contact_info: '+380673456789' },
  { last_name: 'Кравченко',  first_name: 'Марія',     middle_name: 'Олексіївна',  gender: 'FEMALE', contact_info: '+380674567890' },
  { last_name: 'Назаренко',  first_name: 'Ігор',      middle_name: 'Дмитрович',   gender: 'MALE',   contact_info: '+380675678901' },
  { last_name: 'Романенко',  first_name: 'Вікторія',  middle_name: 'Андріївна',   gender: 'FEMALE', contact_info: '+380676789012' },
  { last_name: 'Литвиненко', first_name: 'Сергій',    middle_name: 'Миколайович', gender: 'MALE',   contact_info: '+380677890123' },
  { last_name: 'Харченко',   first_name: 'Олена',     middle_name: 'Василівна',   gender: 'FEMALE', contact_info: '+380678901234' },
  { last_name: 'Данченко',   first_name: 'Юрій',      middle_name: 'Олегович',    gender: 'MALE',   contact_info: '+380679012345' },
  { last_name: 'Власенко',   first_name: 'Катерина',  middle_name: 'Сергіївна',   gender: 'FEMALE', contact_info: '+380670123456' },
  { last_name: 'Зінченко',   first_name: 'Павло',     middle_name: 'Іванович',    gender: 'MALE',   contact_info: '+380681234567' },
  { last_name: 'Панченко',   first_name: 'Наталія',   middle_name: 'Петрівна',    gender: 'FEMALE', contact_info: '+380682345678' },
  { last_name: 'Руденко',    first_name: 'Артем',     middle_name: 'Васильович',  gender: 'MALE',   contact_info: '+380683456789' },
  { last_name: 'Величко',    first_name: 'Людмила',   middle_name: 'Федорівна',   gender: 'FEMALE', contact_info: '+380684567890' },
  { last_name: 'Пилипенко',  first_name: 'Максим',    middle_name: 'Андрійович',  gender: 'MALE',   contact_info: '+380685678901' },
  { last_name: 'Савченко',   first_name: 'Тетяна',    middle_name: 'Юріївна',     gender: 'FEMALE', contact_info: '+380686789012' },
  { last_name: 'Яценко',     first_name: 'Роман',     middle_name: 'Вікторович',  gender: 'MALE',   contact_info: '+380687890123' },
  { last_name: 'Гавриленко', first_name: 'Ірина',     middle_name: 'Олексіївна',  gender: 'FEMALE', contact_info: '+380688901234' },
  { last_name: 'Кириленко',  first_name: 'Денис',     middle_name: 'Миколайович', gender: 'MALE',   contact_info: '+380689012345' },
  { last_name: 'Остапенко',  first_name: 'Оксана',    middle_name: 'Дмитрівна',   gender: 'FEMALE', contact_info: '+380680123456' },
]

const diseases = [
  { name: 'Гіпертонічна хвороба',          icd_code: 'I10' },
  { name: 'Цукровий діабет 2 типу',         icd_code: 'E11' },
  { name: 'Ішемічна хвороба серця',         icd_code: 'I25' },
  { name: 'Бронхіальна астма',              icd_code: 'J45' },
  { name: 'Хронічний гастрит',              icd_code: 'K29' },
  { name: 'Остеохондроз хребта',            icd_code: 'M42' },
  { name: 'Хронічний бронхіт',             icd_code: 'J42' },
  { name: 'Залізодефіцитна анемія',         icd_code: 'D50' },
  { name: 'Гіпотиреоз',                     icd_code: 'E03' },
  { name: 'Варикозна хвороба вен',          icd_code: 'I83' },
  { name: 'Пневмонія',                      icd_code: 'J18' },
  { name: 'Хронічна ниркова недостатність', icd_code: 'N18' },
  { name: 'Мігрень',                        icd_code: 'G43' },
  { name: 'Ревматоїдний артрит',            icd_code: 'M05' },
  { name: 'Виразкова хвороба шлунка',       icd_code: 'K25' },
]

const allergens = [
  { name: 'Пеніцилін',    category: 'DRUG'          },
  { name: 'Аспірин',      category: 'DRUG'          },
  { name: 'Ібупрофен',    category: 'DRUG'          },
  { name: 'Арахіс',       category: 'FOOD'          },
  { name: 'Молоко',       category: 'FOOD'          },
  { name: 'Яйця',         category: 'FOOD'          },
  { name: 'Морепродукти', category: 'FOOD'          },
  { name: 'Пилок берези', category: 'ENVIRONMENTAL' },
  { name: 'Домашній пил', category: 'ENVIRONMENTAL' },
  { name: 'Шерсть кішок', category: 'ENVIRONMENTAL' },
  { name: 'Укуси бджіл',  category: 'INSECT'        },
  { name: 'Укуси ос',     category: 'INSECT'        },
]

const medications = [
  { name: 'Амлодипін',    form: 'Таблетки',  active_substance: 'Амлодипіну безилат',     dosage_unit: 'мг'  },
  { name: 'Метформін',    form: 'Таблетки',  active_substance: 'Метформіну гідрохлорид',  dosage_unit: 'мг'  },
  { name: 'Аторвастатин', form: 'Таблетки',  active_substance: 'Аторвастатин',            dosage_unit: 'мг'  },
  { name: 'Омепразол',    form: 'Капсули',   active_substance: 'Омепразол',               dosage_unit: 'мг'  },
  { name: 'Еналаприл',    form: 'Таблетки',  active_substance: 'Еналаприлу малеат',       dosage_unit: 'мг'  },
  { name: 'Бісопролол',   form: 'Таблетки',  active_substance: 'Бісопрололу фумарат',     dosage_unit: 'мг'  },
  { name: 'Сальбутамол',  form: 'Інгалятор', active_substance: 'Сальбутамол',             dosage_unit: 'мкг' },
  { name: 'Левотироксин', form: 'Таблетки',  active_substance: 'Левотироксин натрій',     dosage_unit: 'мкг' },
  { name: 'Діклофенак',   form: 'Таблетки',  active_substance: 'Діклофенак натрію',       dosage_unit: 'мг'  },
  { name: 'Пантопразол',  form: 'Таблетки',  active_substance: 'Пантопразол',             dosage_unit: 'мг'  },
  { name: 'Цефтріаксон',  form: 'Ін\'єкції', active_substance: 'Цефтріаксон',             dosage_unit: 'г'   },
  { name: 'Ібупрофен',    form: 'Таблетки',  active_substance: 'Ібупрофен',               dosage_unit: 'мг'  },
]

const bloodGroups     = ['A', 'B', 'AB', 'O']
const rhFactors       = ['POSITIVE', 'NEGATIVE']
const diseaseStatuses = ['ACTIVE', 'RECOVERED', 'CHRONIC']
const severities      = ['MILD', 'MODERATE', 'SEVERE']

const complaintsPool = [
  'Скарги на головний біль, запаморочення, підвищений тиск',
  'Відчуття болю в грудях, задишка при фізичному навантаженні',
  'Загальна слабкість, підвищена стомлюваність, зниження апетиту',
  'Болі в суглобах, набряк колінних суглобів',
  'Кашель з мокротою, підвищена температура тіла до 38.2°C',
  'Болі в животі, нудота, порушення стільця',
  'Підвищений рівень цукру в крові, спрага, часте сечовипускання',
  'Болі в попереку, обмеження рухомості хребта',
]

const conclusionsPool = [
  'Стан задовільний. Призначено корекцію медикаментозної терапії.',
  'Динаміка позитивна. Рекомендовано продовжити лікування.',
  'Виявлено погіршення показників. Необхідна консультація суміжного спеціаліста.',
  'Стан стабільний. Показники в межах допустимої норми.',
  'Відзначається покращення загального стану пацієнта.',
  'Потребує додаткового обстеження для уточнення діагнозу.',
]

const treatmentPlansPool = [
  'Медикаментозна терапія згідно призначень. Контроль АТ двічі на день.',
  'Дієтотерапія, обмеження фізичних навантажень, повторний огляд через 2 тижні.',
  'Фізіотерапія, лікувальна фізкультура, медикаментозне лікування.',
  'Госпіталізація не потрібна. Амбулаторне лікування.',
  'Суворий постільний режим, рясне пиття, жарознижуючі препарати.',
]

const addresses = [
  'м. Київ, вул. Хрещатик, 15, кв. 42',
  'м. Львів, вул. Городоцька, 78, кв. 5',
  'м. Харків, пр. Науки, 34, кв. 18',
  'м. Дніпро, вул. Робоча, 12, кв. 7',
  'м. Одеса, вул. Дерибасівська, 9, кв. 33',
  'м. Запоріжжя, вул. Перемоги, 56, кв. 11',
  'м. Вінниця, вул. Соборна, 23, кв. 4',
  'м. Полтава, вул. Пушкіна, 44, кв. 16',
]

// ─────────────────────────────────────────
// SEED
// ─────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting seed...')

  // ── CLEAR ──
  console.log('🗑  Clearing existing data...')
  await prisma.recordAllergy.deleteMany()
  await prisma.recordMedication.deleteMany()
  await prisma.recordDiagnosis.deleteMany()
  await prisma.recordDoctor.deleteMany()
  await prisma.recordResearch.deleteMany()
  await prisma.researchFile.deleteMany()
  await prisma.research.deleteMany()
  await prisma.record.deleteMany()
  await prisma.case.deleteMany()
  await prisma.patientAllergy.deleteMany()
  await prisma.patientDisease.deleteMany()
  await prisma.doctorPatient.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.account.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.person.deleteMany()
  await prisma.medication.deleteMany()
  await prisma.disease.deleteMany()
  await prisma.allergen.deleteMany()

  // ── 1. ДОВІДНИКИ ──
  console.log('💊 Seeding diseases...')
  const createdDiseases = await Promise.all(diseases.map(d => prisma.disease.create({ data: d })))

  console.log('🌿 Seeding allergens...')
  const createdAllergens = await Promise.all(allergens.map(a => prisma.allergen.create({ data: a })))

  console.log('💉 Seeding medications...')
  const createdMedications = await Promise.all(medications.map(m => prisma.medication.create({ data: m })))

  // ── 2. ADMIN ──
  console.log('👤 Seeding admin...')
  const adminPerson = await prisma.person.create({
    data: {
      last_name: 'Адміністратор', first_name: 'Головний', middle_name: 'Системний',
      birth_date: new Date('1980-01-01'), gender: 'MALE',
      contact_info: '+380501111111', role: 'ADMIN',
    }
  })
  await prisma.account.create({
    data: {
      person_id: adminPerson.id, email: 'admin@medscan.com',
      password: await hashPassword('admin123'), rights: 'ADMIN',
    }
  })

  // ── 3. DOCTORS ──
  console.log('👨‍⚕️ Seeding doctors...')
  const createdDoctors = []
  const doctorNames    = []

  for (let i = 0; i < doctorPersons.length; i++) {
    const dp     = doctorPersons[i]
    const person = await prisma.person.create({
      data: { ...dp, birth_date: randomDate(new Date('1965-01-01'), new Date('1990-01-01')), role: 'DOCTOR' }
    })
    const doctor = await prisma.doctor.create({
      data: { person_id: person.id, specialization: specializations[i] }
    })
    await prisma.account.create({
      data: {
        person_id: person.id, email: `doctor${i + 1}@medscan.com`,
        password: await hashPassword('doctor123'), rights: 'USER',
      }
    })
    createdDoctors.push(doctor)
    doctorNames.push(`${dp.last_name} ${dp.first_name[0]}. ${dp.middle_name[0]}.`)
  }

  // ── 4. PATIENTS ──
  console.log('🧑‍⚕️ Seeding patients...')
  let totalCases = 0, totalRecords = 0, totalResearches = 0, totalFiles = 0

  for (let i = 0; i < patientPersons.length; i++) {
    const pp     = patientPersons[i]
    const person = await prisma.person.create({
      data: { ...pp, birth_date: randomDate(new Date('1950-01-01'), new Date('2000-01-01')), role: 'PATIENT' }
    })

    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        blood_group: randomItem(bloodGroups),
        rh_factor:   randomItem(rhFactors),
        height:      randomDecimal(155, 190, 1),
        weight:      randomDecimal(50, 110, 1),
      }
    })

    const patient = await prisma.patient.create({
      data: { person_id: person.id, medical_record_id: medicalRecord.id, address: randomItem(addresses) }
    })

    const patientName = `${pp.last_name} ${pp.first_name} ${pp.middle_name}`

    // Лікарі
    const numDoctors      = randomInt(1, 2)
    const assignedDoctors = [...createdDoctors].sort(() => Math.random() - 0.5).slice(0, numDoctors)
    for (const doctor of assignedDoctors) {
      await prisma.doctorPatient.create({ data: { patient_id: patient.id, doctor_id: doctor.id } })
    }

    // Хвороби
    const numDiseases      = randomInt(1, 3)
    const assignedDiseases = [...createdDiseases].sort(() => Math.random() - 0.5).slice(0, numDiseases)
    for (const disease of assignedDiseases) {
      await prisma.patientDisease.create({
        data: {
          medical_record_id: medicalRecord.id, disease_id: disease.id,
          status: randomItem(diseaseStatuses),
          diagnosed_at: randomDate(new Date('2018-01-01'), new Date()),
        }
      })
    }

    // Алергії
    const numAllergies      = randomInt(0, 2)
    const assignedAllergens = [...createdAllergens].sort(() => Math.random() - 0.5).slice(0, numAllergies)
    for (const allergen of assignedAllergens) {
      await prisma.patientAllergy.create({
        data: {
          medical_record_id: medicalRecord.id, allergen_id: allergen.id,
          reaction_severity: randomItem(severities),
          reaction_description: 'Виявлено під час обстеження',
          diagnosed_at: randomDate(new Date('2018-01-01'), new Date()),
        }
      })
    }

    // ── Кейси ──
    const numCases = randomInt(1, 3)
    for (let c = 0; c < numCases; c++) {
      const caseDisease = randomItem(assignedDiseases)
      const isClosed    = Math.random() > 0.4
      const openDate    = randomDate(new Date('2022-01-01'), new Date('2023-06-01'))
      const closeDate   = isClosed ? randomDate(openDate, new Date()) : null

      const patientCase = await prisma.case.create({
        data: {
          medical_record_id: medicalRecord.id,
          status:            isClosed ? 'CLOSED' : 'OPEN',
          opening_date:      openDate,
          closing_date:      closeDate,
          main_condition:    caseDisease.name,
          description:       `Лікування ${caseDisease.name.toLowerCase()}. Спостереження в динаміці.`,
        }
      })
      totalCases++

      // ── Записи ──
      const numRecords = randomInt(2, 5)
      let prevRecordId = null

      for (let r = 0; r < numRecords; r++) {
        const author      = randomItem(assignedDoctors)
        const authorIdx   = createdDoctors.findIndex(d => d.id === author.id)
        const authorName  = doctorNames[authorIdx] ?? 'Лікар'
        const isConsilium = Math.random() < 0.15
        const recordType  = isConsilium ? 'CONSILIUM' : randomItem(['EXAM', 'EXAM', 'EXAM', 'EPICRISIS'])
        const visitDate   = randomDate(openDate, closeDate ?? new Date())

        const record = await prisma.record.create({
          data: {
            medical_record_id:  medicalRecord.id,
            case_id:            patientCase.id,
            author_id:          author.id,
            parent_record_id:   prevRecordId,
            visit_date:         visitDate,
            type:               recordType,
            // Закриті кейси — тільки підписані записи
            status: isClosed ? 'SIGNED' : randomItem(['SIGNED', 'SIGNED', 'SIGNED', 'DRAFT']),
            complaints:         randomItem(complaintsPool),
            history_of_illness: 'Хворіє протягом кількох років. Лікування проводилось амбулаторно.',
            history_of_life:    'Хронічні захворювання згідно медичної карти. Операцій не було.',
            social_habits:      'Не курить. Алкоголь вживає помірно.',
            height:             randomDecimal(155, 190, 1),
            weight:             randomDecimal(50, 110, 1),
            temperature:        randomDecimal(36.4, 37.8, 1),
            blood_pressure:     `${randomInt(110, 160)}/${randomInt(70, 100)}`,
            heart_rate:         randomInt(60, 100),
            spo2:               randomInt(94, 100),
            general_condition:  randomItem(['Задовільний', 'Середньої тяжкості', 'Стабільний']),
            skin_status:        'Шкіра звичайного кольору, чиста, помірної вологості.',
            respiratory_system: 'Дихання везикулярне, хрипів немає. ЧД 16/хв.',
            cardiovascular:     'Тони серця ритмічні, приглушені. Шумів не виявлено.',
            doctor_conclusion:  randomItem(conclusionsPool),
            treatment_plan:     randomItem(treatmentPlansPool),
          }
        })
        totalRecords++
        prevRecordId = record.id

        // Консиліум
        if (isConsilium) {
          const consiliumDoctors = [...createdDoctors]
            .filter(d => d.id !== author.id)
            .sort(() => Math.random() - 0.5)
            .slice(0, randomInt(1, 2))
          for (const doc of consiliumDoctors) {
            await prisma.recordDoctor.create({
              data: { record_id: record.id, doctor_id: doc.id, role: randomItem(['Консультант', 'Голова консиліуму', 'Фахівець']) }
            })
          }
        }

        // Діагнози
        const recordDiseases = [...assignedDiseases].sort(() => Math.random() - 0.5).slice(0, randomInt(1, 2))
        for (let di = 0; di < recordDiseases.length; di++) {
          await prisma.recordDiagnosis.create({
            data: {
              record_id: record.id, disease_id: recordDiseases[di].id,
              description: `Підтверджено клінічно. ${randomItem(conclusionsPool)}`,
              is_final: Math.random() > 0.3, is_main: di === 0,
            }
          })
        }

        // Медикаменти
        const recordMeds = [...createdMedications].sort(() => Math.random() - 0.5).slice(0, randomInt(1, 3))
        for (const med of recordMeds) {
          await prisma.recordMedication.create({
            data: {
              record_id: record.id, medication_id: med.id,
              dosage:    `${randomInt(5, 500)} ${med.dosage_unit}`,
              frequency: randomItem(['1 раз на день', '2 рази на день', '3 рази на день']),
              duration:  randomItem(['7 днів', '14 днів', '30 днів', '3 місяці']),
              comment:   randomItem(['Після їжі', 'До їжі', 'Незалежно від їжі']),
            }
          })
        }

        // Алергії на прийомі
        if (Math.random() < 0.2 && assignedAllergens.length > 0) {
          await prisma.recordAllergy.create({
            data: {
              record_id: record.id, allergen_id: randomItem(assignedAllergens).id,
              reaction_severity: randomItem(severities),
              reaction_description: 'Виявлено під час огляду',
            }
          })
        }

        // ── Дослідження + PDF ──
        if (Math.random() < 0.6 && datasetRecords.length > 0) {
          const datasetRec   = pickDatasetRecord()
          const timestamp    = Date.now() + Math.floor(Math.random() * 10000)
          const fileName     = `research_${medicalRecord.id}_${timestamp}.pdf`
          const relativePath = path.join('uploads', 'research', fileName)
          const isProcessed  = Math.random() < 0.65

          try {
            await generateResearchPdfFromDataset({
              record:     datasetRec,
              patientName,
              doctorName: authorName,
              date:       visitDate,
              fileName,
              outputDir:  UPLOADS_DIR,
            })
          } catch (err) {
            console.warn(`⚠️  PDF failed: ${fileName}: ${err.message}`)
          }

          if (isProcessed) {
            // results — текстовий рядок з ключовими даними дослідження
            const resultsText = [
              `Дослідження: ${datasetRec.unofficial_name}`,
              `Стандартна назва: ${datasetRec.common_name}`,
              `Результат: ${datasetRec.value} ${datasetRec.unit}`,
              `Категорія: ${datasetRec.category}`,
              `Біоматеріал: ${datasetRec.fluid}`,
              datasetRec.flag ? `Позначка: ${datasetRec.flag}` : '',
            ].filter(Boolean).join('\n')

            const research = await prisma.research.create({
              data: {
                medical_record_id: medicalRecord.id,
                case_id:           patientCase.id,
                doctor_id:         author.id,
                research_type:     datasetRec.common_name,
                status:            'PROCESSED',
                extracted_text:    buildExtractedText(datasetRec, patientName, authorName, visitDate),
                results:           resultsText,
                created_at:        visitDate,
                processed_at:      new Date(),
              }
            })
            totalResearches++

            await prisma.researchFile.create({
              data: {
                medical_record_id: medicalRecord.id,
                research_id:       research.id,
                file_path:         relativePath,
                status:            'PROCESSED',
                created_at:        visitDate,
                processed_at:      new Date(),
              }
            })
            totalFiles++

            await prisma.recordResearch.create({
              data: { record_id: record.id, research_id: research.id }
            })
          } else {
            await prisma.researchFile.create({
              data: {
                medical_record_id: medicalRecord.id,
                research_id:       null,
                file_path:         relativePath,
                status:            'PENDING',
                created_at:        visitDate,
              }
            })
            totalFiles++
          }
        }
      }
    }

    // ── Inbox файли (PENDING, без прив'язки до запису) ──
    const numInboxFiles = randomInt(1, 3)
    for (let f = 0; f < numInboxFiles; f++) {
      if (datasetRecords.length === 0) break

      const datasetRec   = pickDatasetRecord()
      const inboxDate    = randomDate(new Date('2024-01-01'), new Date())
      const timestamp    = Date.now() + Math.floor(Math.random() * 100000)
      const fileName     = `inbox_${medicalRecord.id}_${timestamp}.pdf`
      const relativePath = path.join('uploads', 'research', fileName)
      const authorDoctor = randomItem(assignedDoctors)
      const authorIdx    = createdDoctors.findIndex(d => d.id === authorDoctor.id)
      const authorName   = doctorNames[authorIdx] ?? 'Лікар'

      try {
        await generateResearchPdfFromDataset({
          record:     datasetRec,
          patientName,
          doctorName: authorName,
          date:       inboxDate,
          fileName,
          outputDir:  UPLOADS_DIR,
        })
      } catch (err) {
        console.warn(`⚠️  Inbox PDF failed: ${fileName}: ${err.message}`)
      }

      await prisma.researchFile.create({
        data: {
          medical_record_id: medicalRecord.id,
          research_id:       null,
          file_path:         relativePath,
          status:            'PENDING',
          created_at:        inboxDate,
        }
      })
      totalFiles++
    }
  }

  // ── ПІДСУМОК ──
  console.log('\n✅ Seed completed!')
  console.log(`   👤 Admin:       1`)
  console.log(`   👨‍⚕️ Doctors:     ${createdDoctors.length}`)
  console.log(`   🧑‍⚕️ Patients:    ${patientPersons.length}`)
  console.log(`   📁 Cases:       ${totalCases}`)
  console.log(`   📋 Records:     ${totalRecords}`)
  console.log(`   🔬 Researches:  ${totalResearches}`)
  console.log(`   📄 PDF files:   ${totalFiles}`)
  console.log('\n📋 Credentials:')
  console.log('   admin@medscan.com / admin123')
  console.log('   doctor1@medscan.com / doctor123')
  console.log(`\n📂 PDFs saved to: ${UPLOADS_DIR}`)
}

seed()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())