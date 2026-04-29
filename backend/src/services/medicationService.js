import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

export const getAll = async () => {
  return await prisma.medication.findMany({
    orderBy: { name: 'asc' }
  })
}

export const getById = async (id) => {
  const found = await prisma.medication.findUnique({ where: { id } })
  if (!found) throw new AppError('Medication not found', 404)
  return found
}

export const search = async (query) => {
  return await prisma.medication.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { active_substance: { contains: query } },
      ]
    },
    orderBy: { name: 'asc' }
  })
}

export const create = async (data) => {
  const { name, form, active_substance, dosage_unit } = data
  return await prisma.medication.create({
    data: { name, form, active_substance, dosage_unit }
  })
}

export const update = async (id, data) => {
  const found = await prisma.medication.findUnique({ where: { id } })
  if (!found) throw new AppError('Medication not found', 404)

  const { name, form, active_substance, dosage_unit } = data

  return await prisma.medication.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(form !== undefined && { form }),
      ...(active_substance !== undefined && { active_substance }),
      ...(dosage_unit !== undefined && { dosage_unit }),
    }
  })
}

export const remove = async (id) => {
  const found = await prisma.medication.findUnique({ where: { id } })
  if (!found) throw new AppError('Medication not found', 404)
  await prisma.medication.delete({ where: { id } })
}