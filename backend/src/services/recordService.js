import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

const recordInclude = {
  author: { include: { person: true } },
  case: true,
  record_doctors: {
    include: { doctor: { include: { person: true } } }
  },
  record_diagnoses: {
    include: { disease: true }
  },
  record_medications: {
    include: { medication: true }
  },
  record_researches: {
    include: { research: true }
  },
  record_allergies: {
    include: { allergen: true }
  },
}

export const getAllRecords = async () => {
  return await prisma.record.findMany({
    include: recordInclude,
    orderBy: { visit_date: 'desc' }
  })
}

export const getRecordById = async (id) => {
  const found = await prisma.record.findUnique({
    where: { id },
    include: recordInclude
  })
  if (!found) throw new AppError('Record not found', 404)
  return found
}

export const getRecordsByMedicalRecord = async (medicalRecordId) => {
  return await prisma.record.findMany({
    where: { medical_record_id: medicalRecordId },
    include: recordInclude,
    orderBy: { visit_date: 'desc' }
  })
}

export const getRecordsByCase = async (caseId) => {
  return await prisma.record.findMany({
    where: { case_id: caseId },
    include: recordInclude,
    orderBy: { visit_date: 'desc' }
  })
}

export const getRecordsByDoctor = async (doctorId) => {
  return await prisma.record.findMany({
    where: { author_id: doctorId },
    include: recordInclude,
    orderBy: { visit_date: 'desc' }
  })
}

export const createRecord = async (data) => {
  const {
    medical_record_id,
    case_id,
    author_id,
    parent_record_id,
    visit_date,
    type,
    status,
    complaints,
    history_of_illness,
    history_of_life,
    social_habits,
    height,
    weight,
    temperature,
    blood_pressure,
    heart_rate,
    spo2,
    general_condition,
    skin_status,
    respiratory_system,
    cardiovascular,
    doctor_conclusion,
    treatment_plan,
  } = data

  // Проверяем что кейс существует
  const caseFound = await prisma.case.findUnique({ where: { id: case_id } })
  if (!caseFound) throw new AppError('Case not found', 404)

  // Проверяем что кейс открыт
  if (caseFound.status === 'CLOSED') throw new AppError('Cannot add record to closed case', 400)

  const record = await prisma.record.create({
    data: {
      medical_record_id,
      case_id,
      author_id,
      parent_record_id: parent_record_id ?? null,
      visit_date: new Date(visit_date),
      type: type ?? 'EXAM',
      status: status ?? 'DRAFT',
      complaints,
      history_of_illness,
      history_of_life,
      social_habits,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      temperature: temperature ? parseFloat(temperature) : null,
      blood_pressure,
      heart_rate: heart_rate ? parseInt(heart_rate) : null,
      spo2: spo2 ? parseInt(spo2) : null,
      general_condition,
      skin_status,
      respiratory_system,
      cardiovascular,
      doctor_conclusion,
      treatment_plan,
    },
    include: recordInclude
  })

  // Обновляем height/weight в медкарте если указаны
  if (height || weight) {
    await prisma.medicalRecord.update({
      where: { id: medical_record_id },
      data: {
        ...(height && { height: parseFloat(height) }),
        ...(weight && { weight: parseFloat(weight) }),
      }
    })
  }

  return record
}

export const updateRecord = async (id, data) => {
  const found = await prisma.record.findUnique({ where: { id } })
  if (!found) throw new AppError('Record not found', 404)

  // Подписанную запись нельзя редактировать
  if (found.status === 'SIGNED') throw new AppError('Cannot edit signed record', 400)

  const {
    visit_date,
    type,
    status,
    complaints,
    history_of_illness,
    history_of_life,
    social_habits,
    height,
    weight,
    temperature,
    blood_pressure,
    heart_rate,
    spo2,
    general_condition,
    skin_status,
    respiratory_system,
    cardiovascular,
    doctor_conclusion,
    treatment_plan,
  } = data

  const updated = await prisma.record.update({
    where: { id },
    data: {
      ...(visit_date && { visit_date: new Date(visit_date) }),
      ...(type && { type }),
      ...(status && { status }),
      ...(complaints !== undefined && { complaints }),
      ...(history_of_illness !== undefined && { history_of_illness }),
      ...(history_of_life !== undefined && { history_of_life }),
      ...(social_habits !== undefined && { social_habits }),
      ...(height !== undefined && { height: height ? parseFloat(height) : null }),
      ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
      ...(temperature !== undefined && { temperature: temperature ? parseFloat(temperature) : null }),
      ...(blood_pressure !== undefined && { blood_pressure }),
      ...(heart_rate !== undefined && { heart_rate: heart_rate ? parseInt(heart_rate) : null }),
      ...(spo2 !== undefined && { spo2: spo2 ? parseInt(spo2) : null }),
      ...(general_condition !== undefined && { general_condition }),
      ...(skin_status !== undefined && { skin_status }),
      ...(respiratory_system !== undefined && { respiratory_system }),
      ...(cardiovascular !== undefined && { cardiovascular }),
      ...(doctor_conclusion !== undefined && { doctor_conclusion }),
      ...(treatment_plan !== undefined && { treatment_plan }),
    },
    include: recordInclude
  })

  // Обновляем height/weight в медкарте
  if (height || weight) {
    await prisma.medicalRecord.update({
      where: { id: found.medical_record_id },
      data: {
        ...(height && { height: parseFloat(height) }),
        ...(weight && { weight: parseFloat(weight) }),
      }
    })
  }

  return updated
}

export const signRecord = async (id) => {
  const found = await prisma.record.findUnique({ where: { id } })
  if (!found) throw new AppError('Record not found', 404)
  if (found.status === 'SIGNED') throw new AppError('Record already signed', 400)

  return await prisma.record.update({
    where: { id },
    data: { status: 'SIGNED' },
    include: recordInclude
  })
}

export const deleteRecord = async (id) => {
  const found = await prisma.record.findUnique({ where: { id } })
  if (!found) throw new AppError('Record not found', 404)
  if (found.status === 'SIGNED') throw new AppError('Cannot delete signed record', 400)
  await prisma.record.delete({ where: { id } })
}