import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcrypt'
import 'dotenv/config'

const SALT_ROUNDS = 12
const PEPPER = process.env.PEPPER_SECRET

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
})

const prisma = new PrismaClient({ adapter })

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const hashPassword = async (password) => {
  return await bcrypt.hash(password + PEPPER, SALT_ROUNDS)
}

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ─────────────────────────────────────────
// DATA
// ─────────────────────────────────────────

const specializations = [
  'Кардіологія', 'Неврологія', 'Хірургія', 'Терапія',
  'Педіатрія', 'Офтальмологія', 'Ортопедія', 'Дерматологія',
  'Ендокринологія', 'Пульмонологія'
]

const doctorPersons = [
  { last_name: 'Коваленко', first_name: 'Олексій',   middle_name: 'Іванович',   gender: 'MALE',   contact_info: '+380501234567' },
  { last_name: 'Мельник',   first_name: 'Наталія',   middle_name: 'Петрівна',   gender: 'FEMALE', contact_info: '+380502345678' },
  { last_name: 'Шевченко',  first_name: 'Дмитро',    middle_name: 'Олегович',   gender: 'MALE',   contact_info: '+380503456789' },
  { last_name: 'Бойко',     first_name: 'Оксана',    middle_name: 'Василівна',  gender: 'FEMALE', contact_info: '+380504567890' },
  { last_name: 'Захаренко', first_name: 'Андрій',    middle_name: 'Миколайович',gender: 'MALE',   contact_info: '+380505678901' },
  { last_name: 'Лисенко',   first_name: 'Ірина',     middle_name: 'Сергіївна',  gender: 'FEMALE', contact_info: '+380506789012' },
  { last_name: 'Гриценко',  first_name: 'Василь',    middle_name: 'Федорович',  gender: 'MALE',   contact_info: '+380507890123' },
  { last_name: 'Марченко',  first_name: 'Людмила',   middle_name: 'Андріївна',  gender: 'FEMALE', contact_info: '+380508901234' },
  { last_name: 'Тимченко',  first_name: 'Олег',      middle_name: 'Вікторович', gender: 'MALE',   contact_info: '+380509012345' },
  { last_name: 'Павленко',  first_name: 'Тетяна',    middle_name: 'Юріївна',    gender: 'FEMALE', contact_info: '+380500123456' },
]

const patientPersons = [
  { last_name: 'Іваненко',  first_name: 'Микола',    middle_name: 'Петрович',   gender: 'MALE',   contact_info: '+380671234567' },
  { last_name: 'Петренко',  first_name: 'Ганна',     middle_name: 'Іванівна',   gender: 'FEMALE', contact_info: '+380672345678' },
  { last_name: 'Сидоренко', first_name: 'Олександр', middle_name: 'Васильович', gender: 'MALE',   contact_info: '+380673456789' },
  { last_name: 'Кравченко', first_name: 'Марія',     middle_name: 'Олексіївна', gender: 'FEMALE', contact_info: '+380674567890' },
  { last_name: 'Назаренко', first_name: 'Ігор',      middle_name: 'Дмитрович',  gender: 'MALE',   contact_info: '+380675678901' },
  { last_name: 'Романенко', first_name: 'Вікторія',  middle_name: 'Андріївна',  gender: 'FEMALE', contact_info: '+380676789012' },
  { last_name: 'Литвиненко',first_name: 'Сергій',    middle_name: 'Миколайович',gender: 'MALE',   contact_info: '+380677890123' },
  { last_name: 'Харченко',  first_name: 'Олена',     middle_name: 'Василівна',  gender: 'FEMALE', contact_info: '+380678901234' },
  { last_name: 'Данченко',  first_name: 'Юрій',      middle_name: 'Олегович',   gender: 'MALE',   contact_info: '+380679012345' },
  { last_name: 'Власенко',  first_name: 'Катерина',  middle_name: 'Сергіївна',  gender: 'FEMALE', contact_info: '+380670123456' },
  { last_name: 'Зінченко',  first_name: 'Павло',     middle_name: 'Іванович',   gender: 'MALE',   contact_info: '+380681234567' },
  { last_name: 'Панченко',  first_name: 'Наталія',   middle_name: 'Петрівна',   gender: 'FEMALE', contact_info: '+380682345678' },
  { last_name: 'Руденко',   first_name: 'Артем',     middle_name: 'Васильович', gender: 'MALE',   contact_info: '+380683456789' },
  { last_name: 'Величко',   first_name: 'Людмила',   middle_name: 'Федорівна',  gender: 'FEMALE', contact_info: '+380684567890' },
  { last_name: 'Пилипенко', first_name: 'Максим',    middle_name: 'Андрійович', gender: 'MALE',   contact_info: '+380685678901' },
  { last_name: 'Савченко',  first_name: 'Тетяна',    middle_name: 'Юріївна',    gender: 'FEMALE', contact_info: '+380686789012' },
  { last_name: 'Яценко',    first_name: 'Роман',     middle_name: 'Вікторович', gender: 'MALE',   contact_info: '+380687890123' },
  { last_name: 'Гавриленко',first_name: 'Ірина',     middle_name: 'Олексіївна', gender: 'FEMALE', contact_info: '+380688901234' },
  { last_name: 'Кириленко', first_name: 'Денис',     middle_name: 'Миколайович',gender: 'MALE',   contact_info: '+380689012345' },
  { last_name: 'Остапенко', first_name: 'Оксана',    middle_name: 'Дмитрівна',  gender: 'FEMALE', contact_info: '+380680123456' },
]

const diseases = [
  { name: 'Гіпертонічна хвороба',          icd_code: 'I10'   },
  { name: 'Цукровий діабет 2 типу',         icd_code: 'E11'   },
  { name: 'Ішемічна хвороба серця',         icd_code: 'I25'   },
  { name: 'Бронхіальна астма',              icd_code: 'J45'   },
  { name: 'Хронічний гастрит',              icd_code: 'K29'   },
  { name: 'Остеохондроз хребта',            icd_code: 'M42'   },
  { name: 'Хронічний бронхіт',             icd_code: 'J42'   },
  { name: 'Залізодефіцитна анемія',         icd_code: 'D50'   },
  { name: 'Гіпотиреоз',                     icd_code: 'E03'   },
  { name: 'Варикозна хвороба вен',          icd_code: 'I83'   },
  { name: 'Пневмонія',                      icd_code: 'J18'   },
  { name: 'Хронічна ниркова недостатність', icd_code: 'N18'   },
]

const allergens = [
  { name: 'Пеніцилін',        category: 'DRUG'          },
  { name: 'Аспірин',          category: 'DRUG'          },
  { name: 'Ібупрофен',        category: 'DRUG'          },
  { name: 'Арахіс',           category: 'FOOD'          },
  { name: 'Молоко',           category: 'FOOD'          },
  { name: 'Яйця',             category: 'FOOD'          },
  { name: 'Морепродукти',     category: 'FOOD'          },
  { name: 'Пилок берези',     category: 'ENVIRONMENTAL' },
  { name: 'Домашній пил',     category: 'ENVIRONMENTAL' },
  { name: 'Шерсть кішок',     category: 'ENVIRONMENTAL' },
  { name: 'Укуси бджіл',      category: 'INSECT'        },
  { name: 'Укуси ос',         category: 'INSECT'        },
]

const bloodGroups = ['A', 'B', 'AB', 'O']
const rhFactors = ['POSITIVE', 'NEGATIVE']
const entryTypes = ['VISIT', 'RESEARCH_ORDERED', 'RESEARCH_REVIEW']
const researchTypes = [
  'Загальний аналіз крові',
  'Біохімічний аналіз крові',
  'Загальний аналіз сечі',
  'ЕКГ',
  'УЗД черевної порожнини',
  'Рентген грудної клітки',
  'МРТ головного мозку',
]
const diseaseStatuses = ['ACTIVE', 'RECOVERED', 'CHRONIC']
const severities = ['MILD', 'MODERATE', 'SEVERE']

// ─────────────────────────────────────────
// SEED
// ─────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting seed...')

  // Clear existing data in correct order
  console.log('🗑  Clearing existing data...')
  await prisma.researchFile.deleteMany()
  await prisma.research.deleteMany()
  await prisma.record.deleteMany()
  await prisma.patientAllergy.deleteMany()
  await prisma.patientDisease.deleteMany()
  await prisma.doctorPatient.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.account.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.person.deleteMany()
  await prisma.disease.deleteMany()
  await prisma.allergen.deleteMany()

  // ── 1. DISEASES ──────────────────────────
  console.log('💊 Seeding diseases...')
  const createdDiseases = await Promise.all(
    diseases.map(d => prisma.disease.create({ data: d }))
  )

  // ── 2. ALLERGENS ─────────────────────────
  console.log('🌿 Seeding allergens...')
  const createdAllergens = await Promise.all(
    allergens.map(a => prisma.allergen.create({ data: a }))
  )

  // ── 3. ADMIN ──────────────────────────────
  console.log('👤 Seeding admin...')
  const adminPerson = await prisma.person.create({
    data: {
      last_name:    'Адміністратор',
      first_name:   'Головний',
      middle_name:  'Системний',
      birth_date:   new Date('1980-01-01'),
      gender:       'MALE',
      contact_info: '+380501111111',
      role:         'ADMIN'
    }
  })

  await prisma.account.create({
    data: {
      person_id: adminPerson.id,
      email:     'admin@medscan.com',
      password:  await hashPassword('admin123'),
      rights:    'ADMIN'
    }
  })

  // ── 4. DOCTORS ────────────────────────────
  console.log('👨‍⚕️ Seeding doctors...')
  const createdDoctors = []

  for (let i = 0; i < doctorPersons.length; i++) {
    const dp = doctorPersons[i]

    const person = await prisma.person.create({
      data: {
        ...dp,
        birth_date: randomDate(new Date('1965-01-01'), new Date('1990-01-01')),
        role: 'DOCTOR'
      }
    })

    const doctor = await prisma.doctor.create({
      data: {
        person_id:      person.id,
        specialization: specializations[i]
      }
    })

    await prisma.account.create({
      data: {
        person_id: person.id,
        email:     `doctor${i + 1}@medscan.com`,
        password:  await hashPassword('doctor123'),
        rights:    'USER'
      }
    })

    createdDoctors.push(doctor)
  }

  // ── 5. PATIENTS ───────────────────────────
  console.log('🧑‍⚕️ Seeding patients...')
  const createdPatients = []

  for (let i = 0; i < patientPersons.length; i++) {
    const pp = patientPersons[i]

    const person = await prisma.person.create({
      data: {
        ...pp,
        birth_date: randomDate(new Date('1950-01-01'), new Date('2000-01-01')),
        role: 'PATIENT'
      }
    })

    // Create medical record first
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        blood_group: randomItem(bloodGroups),
        rh_factor:   randomItem(rhFactors)
      }
    })

    const patient = await prisma.patient.create({
      data: {
        person_id:         person.id,
        medical_record_id: medicalRecord.id
      }
    })

    createdPatients.push({ patient, medicalRecord })

    // ── 5a. Assign 1-2 doctors to patient ──
    const numDoctors = Math.floor(Math.random() * 2) + 1
    const shuffled = [...createdDoctors].sort(() => Math.random() - 0.5)
    const assignedDoctors = shuffled.slice(0, numDoctors)

    for (const doctor of assignedDoctors) {
      await prisma.doctorPatient.create({
        data: {
          patient_id: patient.id,
          doctor_id:  doctor.id
        }
      })
    }

    // ── 5b. Add 1-3 diseases to patient ────
    const numDiseases = Math.floor(Math.random() * 3) + 1
    const shuffledDiseases = [...createdDiseases].sort(() => Math.random() - 0.5)
    const assignedDiseases = shuffledDiseases.slice(0, numDiseases)

    for (const disease of assignedDiseases) {
      await prisma.patientDisease.create({
        data: {
          medical_record_id: medicalRecord.id,
          disease_id:        disease.id,
          status:            randomItem(diseaseStatuses),
          diagnosed_at:      randomDate(new Date('2018-01-01'), new Date())
        }
      })
    }

    // ── 5c. Add 0-2 allergies to patient ───
    const numAllergies = Math.floor(Math.random() * 3)
    if (numAllergies > 0) {
      const shuffledAllergens = [...createdAllergens].sort(() => Math.random() - 0.5)
      const assignedAllergens = shuffledAllergens.slice(0, numAllergies)

      for (const allergen of assignedAllergens) {
        await prisma.patientAllergy.create({
          data: {
            medical_record_id:    medicalRecord.id,
            allergen_id:          allergen.id,
            reaction_severity:    randomItem(severities),
            reaction_description: 'Виявлено під час обстеження',
            diagnosed_at:         randomDate(new Date('2018-01-01'), new Date())
          }
        })
      }
    }

    // ── 5d. Add 2-4 visit records ───────────
    const numRecords = Math.floor(Math.random() * 3) + 2

    for (let r = 0; r < numRecords; r++) {
      const doctor = randomItem(assignedDoctors)
      const entryType = randomItem(entryTypes)
      const visitDate = randomDate(new Date('2023-01-01'), new Date())

      // For RESEARCH_REVIEW we need a research first
      // so we use VISIT or RESEARCH_ORDERED for simplicity
      const safeEntryType = entryType === 'RESEARCH_REVIEW' ? 'VISIT' : entryType

      const record = await prisma.record.create({
        data: {
          medical_record_id: medicalRecord.id,
          doctor_id:         doctor.id,
          visit_date:        visitDate,
          entry_type:        safeEntryType,
          complaints:        'Скарги на загальне нездужання, слабкість',
          doctor_conclusion: 'Стан задовільний, призначено лікування',
          treatment_plan:    'Медикаментозна терапія, повторний огляд через 2 тижні',
          plan_text:         'Дотримуватись режиму відпочинку та дієти'
        }
      })

      // ── 5e. Add research for RESEARCH_ORDERED records ──
      if (safeEntryType === 'RESEARCH_ORDERED') {
        const research = await prisma.research.create({
          data: {
            medical_record_id: medicalRecord.id,
            research_type:     randomItem(researchTypes),
            status:            randomItem(['PENDING', 'PROCESSED']),
            results:           'Результати в межах норми',
            created_at:        visitDate,
            processed_at:      new Date()
          }
        })

        // Link research to record
        await prisma.record.update({
          where: { id: record.id },
          data:  { research_id: research.id }
        })
      }
    }
  }

  console.log('\n✅ Seed completed successfully!')
  console.log(`   👤 Admin:    1`)
  console.log(`   👨‍⚕️ Doctors:  ${createdDoctors.length}`)
  console.log(`   🧑‍⚕️ Patients: ${createdPatients.length}`)
  console.log(`   💊 Diseases: ${createdDiseases.length}`)
  console.log(`   🌿 Allergens: ${createdAllergens.length}`)
  console.log('\n📋 Test credentials:')
  console.log('   Admin:    admin@medscan.com    / admin123')
  console.log('   Doctor 1: doctor1@medscan.com  / doctor123')
  console.log('   Doctor 2: doctor2@medscan.com  / doctor123')
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })