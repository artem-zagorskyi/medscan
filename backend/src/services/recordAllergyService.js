import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

export const getByRecord = async (recordId) => {
  return await prisma.recordAllergy.findMany({
    where: { record_id: recordId },
    include: { allergen: true }
  })
}

export const add = async (data) => {
  const { record_id, allergen_id, reaction_severity, reaction_description } = data

  const record = await prisma.record.findUnique({ where: { id: record_id } })
  if (!record) throw new AppError('Record not found', 404)
  if (record.status === 'SIGNED') throw new AppError('Cannot edit signed record', 400)

  const allergen = await prisma.allergen.findUnique({ where: { id: allergen_id } })
  if (!allergen) throw new AppError('Allergen not found', 404)

  // Синхронізуємо з PatientAllergies
  const existsInPatient = await prisma.patientAllergy.findUnique({
    where: {
      medical_record_id_allergen_id: {
        medical_record_id: record.medical_record_id,
        allergen_id
      }
    }
  })

  if (!existsInPatient) {
    await prisma.patientAllergy.create({
      data: {
        medical_record_id: record.medical_record_id,
        allergen_id,
        reaction_severity,
        reaction_description: reaction_description ?? null,
        diagnosed_at: new Date()
      }
    })
  }

  return await prisma.recordAllergy.create({
    data: {
      record_id,
      allergen_id,
      reaction_severity,
      reaction_description: reaction_description ?? null,
    },
    include: { allergen: true }
  })
}

export const update = async (id, data) => {
  const found = await prisma.recordAllergy.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordAllergy not found', 404)

  const { reaction_severity, reaction_description } = data

  return await prisma.recordAllergy.update({
    where: { id },
    data: {
      ...(reaction_severity && { reaction_severity }),
      ...(reaction_description !== undefined && { reaction_description }),
    },
    include: { allergen: true }
  })
}

export const remove = async (id) => {
  const found = await prisma.recordAllergy.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordAllergy not found', 404)
  await prisma.recordAllergy.delete({ where: { id } })
}