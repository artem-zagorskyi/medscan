import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

export const getByRecord = async (recordId) => {
  return await prisma.recordDiagnosis.findMany({
    where: { record_id: recordId },
    include: { disease: true }
  })
}

export const add = async (data) => {
  const { record_id, disease_id, description, is_final, is_main } = data

  const record = await prisma.record.findUnique({ where: { id: record_id } })
  if (!record) throw new AppError('Record not found', 404)
  if (record.status === 'SIGNED') throw new AppError('Cannot edit signed record', 400)

  // Синхронізуємо з PatientDiseases
  const existsInPatient = await prisma.patientDisease.findUnique({
    where: {
      medical_record_id_disease_id: {
        medical_record_id: record.medical_record_id,
        disease_id
      }
    }
  })

  if (!existsInPatient) {
    await prisma.patientDisease.create({
      data: {
        medical_record_id: record.medical_record_id,
        disease_id,
        status: 'ACTIVE',
        diagnosed_at: new Date()
      }
    })
  }

  return await prisma.recordDiagnosis.create({
    data: {
      record_id,
      disease_id,
      description: description ?? null,
      is_final: is_final ?? false,
      is_main: is_main ?? true,
    },
    include: { disease: true }
  })
}

export const update = async (id, data) => {
  const found = await prisma.recordDiagnosis.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordDiagnosis not found', 404)

  const { description, is_final, is_main } = data

  return await prisma.recordDiagnosis.update({
    where: { id },
    data: {
      ...(description !== undefined && { description }),
      ...(is_final !== undefined && { is_final }),
      ...(is_main !== undefined && { is_main }),
    },
    include: { disease: true }
  })
}

export const remove = async (id) => {
  const found = await prisma.recordDiagnosis.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordDiagnosis not found', 404)
  await prisma.recordDiagnosis.delete({ where: { id } })
}