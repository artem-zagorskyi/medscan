import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

export const getByRecord = async (recordId) => {
  return await prisma.recordDoctor.findMany({
    where: { record_id: recordId },
    include: { doctor: { include: { person: true } } }
  })
}

export const add = async (data) => {
  const { record_id, doctor_id, role } = data

  const record = await prisma.record.findUnique({ where: { id: record_id } })
  if (!record) throw new AppError('Record not found', 404)
  if (record.status === 'SIGNED') throw new AppError('Cannot edit signed record', 400)

  const exists = await prisma.recordDoctor.findFirst({
    where: { record_id, doctor_id }
  })
  if (exists) throw new AppError('Doctor already added to this record', 400)

  return await prisma.recordDoctor.create({
    data: { record_id, doctor_id, role: role ?? 'Консультант' },
    include: { doctor: { include: { person: true } } }
  })
}

export const update = async (id, data) => {
  const found = await prisma.recordDoctor.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordDoctor not found', 404)

  return await prisma.recordDoctor.update({
    where: { id },
    data: { role: data.role },
    include: { doctor: { include: { person: true } } }
  })
}

export const remove = async (id) => {
  const found = await prisma.recordDoctor.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordDoctor not found', 404)
  await prisma.recordDoctor.delete({ where: { id } })
}