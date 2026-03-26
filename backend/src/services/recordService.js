import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

const includeRelations = {
  doctor: {
    include: { person: true }
  },
  research: true
}

// Get all records
export const getAll = async () => {
  try {
    return await prisma.record.findMany({
      include: includeRelations,
      orderBy: { visit_date: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch records: ${error.message}`, 500)
  }
}

// Get record by id
export const getById = async (id) => {
  try {
    const record = await prisma.record.findUnique({
      where: { id },
      include: includeRelations
    })

    if (!record) {
      throw new AppError(`Record with id ${id} not found`, 404)
    }

    return record
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch record: ${error.message}`, 500)
  }
}

// Get all records by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.record.findMany({
      where: { medical_record_id: medicalRecordId },
      include: includeRelations,
      orderBy: { visit_date: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch records by medical record: ${error.message}`, 500)
  }
}

// Get all records by doctor id
export const getByDoctor = async (doctorId) => {
  try {
    return await prisma.record.findMany({
      where: { doctor_id: doctorId },
      include: includeRelations,
      orderBy: { visit_date: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch records by doctor: ${error.message}`, 500)
  }
}

// Get all records by entry type
// VISIT | RESEARCH_ORDERED | RESEARCH_REVIEW
export const getByEntryType = async (entryType) => {
  try {
    return await prisma.record.findMany({
      where: { entry_type: entryType },
      include: includeRelations,
      orderBy: { visit_date: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch records by entry type: ${error.message}`, 500)
  }
}

// Create a new record
export const create = async (data) => {
  try {
    const {
      medical_record_id,
      doctor_id,
      visit_date,
      entry_type,
      complaints,
      doctor_conclusion,
      treatment_plan,
      plan_text,
      research_id
    } = data

    // RESEARCH_REVIEW requires a research_id
    if (entry_type === 'RESEARCH_REVIEW' && !research_id) {
      throw new AppError('research_id is required for RESEARCH_REVIEW entry type', 400)
    }

    // VISIT must not have a research_id
    if (entry_type === 'VISIT' && research_id) {
      throw new AppError('research_id should not be provided for VISIT entry type', 400)
    }

    return await prisma.record.create({
      data: {
        medical_record_id,
        doctor_id,
        visit_date: new Date(visit_date),
        entry_type,
        complaints: complaints ?? null,
        doctor_conclusion: doctor_conclusion ?? null,
        treatment_plan: treatment_plan ?? null,
        plan_text: plan_text ?? null,
        research_id: research_id ?? null
      },
      include: includeRelations
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to create record: ${error.message}`, 500)
  }
}

// Update record
export const update = async (id, data) => {
  try {
    await getById(id)

    const {
      visit_date,
      entry_type,
      complaints,
      doctor_conclusion,
      treatment_plan,
      plan_text,
      research_id
    } = data

    return await prisma.record.update({
      where: { id },
      data: {
        visit_date: visit_date ? new Date(visit_date) : undefined,
        entry_type: entry_type ?? undefined,
        complaints: complaints ?? undefined,
        doctor_conclusion: doctor_conclusion ?? undefined,
        treatment_plan: treatment_plan ?? undefined,
        plan_text: plan_text ?? undefined,
        research_id: research_id ?? undefined
      },
      include: includeRelations
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update record: ${error.message}`, 500)
  }
}

// Delete record by id
export const remove = async (id) => {
  try {
    await getById(id)

    return await prisma.record.delete({
      where: { id }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete record: ${error.message}`, 500)
  }
}

// Attach research to a RESEARCH_ORDERED record
export const attachResearch = async (id, researchId) => {
  try {
    const record = await getById(id)

    if (record.entry_type !== 'RESEARCH_ORDERED') {
      throw new AppError('Research can only be attached to RESEARCH_ORDERED records', 400)
    }

    return await prisma.record.update({
      where: { id },
      data: { research_id: researchId },
      include: includeRelations
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to attach research to record: ${error.message}`, 500)
  }
}