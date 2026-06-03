import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

export const getAllCases = async () => {
  return await prisma.case.findMany({
    include: {
      medical_record: true,
      records: { select: { id: true, visit_date: true, type: true, status: true } },
      researches: { select: { id: true, research_type: true, status: true } },
    },
    orderBy: { opening_date: 'desc' }
  })
}

export const getCaseById = async (id) => {
  const found = await prisma.case.findUnique({
    where: { id },
    include: {
      records: {
        include: {
          author: { include: { person: true } },
          record_diagnoses: { include: { disease: true } },
          record_medications: { include: { medication: true } },
          record_researches: { include: { research: true } },
          record_allergies: { include: { allergen: true } },
          record_doctors: { include: { doctor: { include: { person: true } } } },
        },
        orderBy: { visit_date: 'desc' }
      },
      researches: true,
    }
  })
  if (!found) throw new AppError('Case not found', 404)
  return found
}

export const getCasesByMedicalRecord = async (medicalRecordId) => {
  return await prisma.case.findMany({
    where: { medical_record_id: medicalRecordId },
    include: {
      records: {
        select: {
          id: true,
          visit_date: true,
          type: true,
          status: true,
          author: { include: { person: true } },
        },
        orderBy: { visit_date: 'desc' }
      },
      researches: {
        select: { id: true, research_type: true, status: true, created_at: true }
      },
    },
    orderBy: { opening_date: 'desc' }
  })
}

export const createCase = async (data) => {
  const { medical_record_id, main_condition, description, opening_date } = data

  return await prisma.case.create({
    data: {
      medical_record_id,
      main_condition,
      description,
      opening_date: opening_date ? new Date(opening_date) : new Date(),
      status: 'OPEN',
    }
  })
}

export const updateCase = async (id, data) => {
  const found = await prisma.case.findUnique({ where: { id } })
  if (!found) throw new AppError('Case not found', 404)

  const { status, main_condition, description, closing_date } = data

  return await prisma.case.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(main_condition && { main_condition }),
      ...(description !== undefined && { description }),
      ...(closing_date && { closing_date: new Date(closing_date) }),
      // Если закрываем — ставим дату закрытия автоматически
      ...(status === 'CLOSED' && !closing_date && { closing_date: new Date() }),
    }
  })
}

export const deleteCase = async (id) => {
  const found = await prisma.case.findUnique({ where: { id } })
  if (!found) throw new AppError('Case not found', 404)
  await prisma.case.delete({ where: { id } })
}