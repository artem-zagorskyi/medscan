import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

const researchInclude = {
  medical_record: true,
  case: true,
  doctor: { include: { person: true } },
  research_files: true,
  record_researches: {
    include: {
      record: {
        select: { id: true, visit_date: true, type: true }
      }
    }
  }
}

export const getAll = async () => {
  return await prisma.research.findMany({
    include: researchInclude,
    orderBy: { created_at: 'desc' }
  })
}

export const getById = async (id) => {
  const found = await prisma.research.findUnique({
    where: { id },
    include: researchInclude
  })
  if (!found) throw new AppError('Research not found', 404)
  return found
}

export const getByMedicalRecord = async (medicalRecordId) => {
  return await prisma.research.findMany({
    where: { medical_record_id: medicalRecordId },
    include: researchInclude,
    orderBy: { created_at: 'desc' }
  })
}

export const getByCase = async (caseId) => {
  return await prisma.research.findMany({
    where: { case_id: caseId },
    include: researchInclude,
    orderBy: { created_at: 'desc' }
  })
}

export const getByStatus = async (status) => {
  return await prisma.research.findMany({
    where: { status },
    include: researchInclude,
    orderBy: { created_at: 'desc' }
  })
}

export const getUnclassified = async () => {
  return await prisma.research.findMany({
    where: { case_id: null },
    include: researchInclude,
    orderBy: { created_at: 'desc' }
  })
}

export const create = async (data) => {
  const { medical_record_id, case_id, doctor_id, research_type } = data

  if (case_id) {
    const caseFound = await prisma.case.findUnique({ where: { id: case_id } })
    if (!caseFound) throw new AppError('Case not found', 404)
    if (caseFound.status === 'CLOSED') throw new AppError('Cannot add research to closed case', 400)
  }

  return await prisma.research.create({
    data: {
      medical_record_id,
      case_id: case_id ?? null,
      doctor_id: doctor_id ?? null,
      research_type,
      status: 'PENDING',
    },
    include: researchInclude
  })
}

export const update = async (id, data) => {
  const found = await prisma.research.findUnique({ where: { id } })
  if (!found) throw new AppError('Research not found', 404)

  const { research_type, results, extracted_text, case_id, doctor_id } = data

  return await prisma.research.update({
    where: { id },
    data: {
      ...(research_type && { research_type }),
      ...(results !== undefined && { results }),
      ...(extracted_text !== undefined && { extracted_text }),
      ...(case_id !== undefined && { case_id }),
      ...(doctor_id !== undefined && { doctor_id }),
    },
    include: researchInclude
  })
}

export const updateStatus = async (id, status) => {
  const found = await prisma.research.findUnique({ where: { id } })
  if (!found) throw new AppError('Research not found', 404)

  return await prisma.research.update({
    where: { id },
    data: {
      status,
      ...(status === 'PROCESSED' && { processed_at: new Date() }),
    },
    include: researchInclude
  })
}

export const assignToCase = async (id, caseId) => {
  const found = await prisma.research.findUnique({ where: { id } })
  if (!found) throw new AppError('Research not found', 404)

  const caseFound = await prisma.case.findUnique({ where: { id: caseId } })
  if (!caseFound) throw new AppError('Case not found', 404)

  return await prisma.research.update({
    where: { id },
    data: { case_id: caseId },
    include: researchInclude
  })
}

export const remove = async (id) => {
  const found = await prisma.research.findUnique({ where: { id } })
  if (!found) throw new AppError('Research not found', 404)
  await prisma.research.delete({ where: { id } })
}