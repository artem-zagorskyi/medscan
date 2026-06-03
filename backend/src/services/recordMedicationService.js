import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

export const getByRecord = async (recordId) => {
  return await prisma.recordMedication.findMany({
    where: { record_id: recordId },
    include: { medication: true }
  })
}

export const add = async (data) => {
  const { record_id, medication_id, dosage, frequency, duration, comment } = data

  const record = await prisma.record.findUnique({ where: { id: record_id } })
  if (!record) throw new AppError('Record not found', 404)
  if (record.status === 'SIGNED') throw new AppError('Cannot edit signed record', 400)

  const medication = await prisma.medication.findUnique({ where: { id: medication_id } })
  if (!medication) throw new AppError('Medication not found', 404)

  return await prisma.recordMedication.create({
    data: {
      record_id,
      medication_id,
      dosage: dosage ?? null,
      frequency: frequency ?? null,
      duration: duration ?? null,
      comment: comment ?? null,
    },
    include: { medication: true }
  })
}

export const update = async (id, data) => {
  const found = await prisma.recordMedication.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordMedication not found', 404)

  const { dosage, frequency, duration, comment } = data

  return await prisma.recordMedication.update({
    where: { id },
    data: {
      ...(dosage !== undefined && { dosage }),
      ...(frequency !== undefined && { frequency }),
      ...(duration !== undefined && { duration }),
      ...(comment !== undefined && { comment }),
    },
    include: { medication: true }
  })
}

export const remove = async (id) => {
  const found = await prisma.recordMedication.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordMedication not found', 404)
  await prisma.recordMedication.delete({ where: { id } })
}