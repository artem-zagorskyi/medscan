import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

const includeRelations = {
  medical_record: true,
  research_files: true
}

// Get all researches
export const getAll = async () => {
  try {
    return await prisma.research.findMany({
      include: includeRelations,
      orderBy: { created_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch researches: ${error.message}`, 500)
  }
}

// Get research by id
export const getById = async (id) => {
  try {
    const research = await prisma.research.findUnique({
      where: { id },
      include: includeRelations
    })

    if (!research) {
      throw new AppError(`Research with id ${id} not found`, 404)
    }

    return research
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch research: ${error.message}`, 500)
  }
}

// Get all researches by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.research.findMany({
      where: { medical_record_id: medicalRecordId },
      include: { research_files: true },
      orderBy: { created_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch researches by medical record: ${error.message}`, 500)
  }
}

// Get all researches by status
// PENDING | PROCESSING | PROCESSED | ERROR
export const getByStatus = async (status) => {
  try {
    return await prisma.research.findMany({
      where: { status },
      include: includeRelations,
      orderBy: { created_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch researches by status: ${error.message}`, 500)
  }
}

// Create a new research draft
// Called after RESEARCH_ORDERED visit
export const create = async (data) => {
  try {
    const { medical_record_id, research_type } = data

    return await prisma.research.create({
      data: {
        medical_record_id,
        research_type,
        status: 'PENDING'
      },
      include: includeRelations
    })
  } catch (error) {
    throw new AppError(`Failed to create research: ${error.message}`, 500)
  }
}

// Update research results and extracted text
export const update = async (id, data) => {
  try {
    await getById(id)

    const { research_type, extracted_text, results } = data

    return await prisma.research.update({
      where: { id },
      data: {
        research_type: research_type ?? undefined,
        extracted_text: extracted_text ?? undefined,
        results: results ?? undefined
      },
      include: includeRelations
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update research: ${error.message}`, 500)
  }
}

// Update research status
// PENDING → PROCESSING → PROCESSED | ERROR
export const updateStatus = async (id, status) => {
  try {
    await getById(id)

    // Set processed_at when research is marked as PROCESSED
    const processed_at = status === 'PROCESSED' ? new Date() : undefined

    return await prisma.research.update({
      where: { id },
      data: { status, processed_at }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update research status: ${error.message}`, 500)
  }
}

// Delete research by id
export const remove = async (id) => {
  try {
    await getById(id)

    return await prisma.research.delete({
      where: { id }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete research: ${error.message}`, 500)
  }
}