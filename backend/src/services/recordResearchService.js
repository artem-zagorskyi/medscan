import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

export const getByRecord = async (recordId) => {
  return await prisma.recordResearch.findMany({
    where: { record_id: recordId },
    include: { research: true }
  })
}

export const add = async (data) => {
  const { record_id, research_id } = data

  const record = await prisma.record.findUnique({ where: { id: record_id } })
  if (!record) throw new AppError('Record not found', 404)
  if (record.status === 'SIGNED') throw new AppError('Cannot edit signed record', 400)

  const research = await prisma.research.findUnique({ where: { id: research_id } })
  if (!research) throw new AppError('Research not found', 404)

  const exists = await prisma.recordResearch.findFirst({
    where: { record_id, research_id }
  })
  if (exists) throw new AppError('Research already linked to this record', 400)

  return await prisma.recordResearch.create({
    data: { record_id, research_id },
    include: { research: true }
  })
}

export const remove = async (id) => {
  const found = await prisma.recordResearch.findUnique({ where: { id } })
  if (!found) throw new AppError('RecordResearch not found', 404)
  await prisma.recordResearch.delete({ where: { id } })
}