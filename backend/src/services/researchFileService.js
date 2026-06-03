import prisma from '../config/prisma.js'
import fs from 'fs/promises'
import { AppError } from '../errors/AppError.js'

const includeRelations = {
  medical_record: true,
  research: true
}

// Get all research files
export const getAll = async () => {
  try {
    return await prisma.researchFile.findMany({
      include: includeRelations,
      orderBy: { created_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch research files: ${error.message}`, 500)
  }
}

// Get research file by id
export const getById = async (id) => {
  try {
    const file = await prisma.researchFile.findUnique({
      where: { id },
      include: includeRelations
    })

    if (!file) {
      throw new AppError(`Research file with id ${id} not found`, 404)
    }

    return file
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch research file: ${error.message}`, 500)
  }
}

// Get all research files by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.researchFile.findMany({
      where: { medical_record_id: medicalRecordId },
      include: { research: true },
      orderBy: { created_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch research files by medical record: ${error.message}`, 500)
  }
}

// Get all unclassified files — research_id is NULL
// These are files uploaded but not yet reviewed by a doctor
export const getUnclassified = async () => {
  try {
    return await prisma.researchFile.findMany({
      where: { research_id: null },
      include: { medical_record: true },
      orderBy: { created_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch unclassified research files: ${error.message}`, 500)
  }
}

// Get all research files by status
// PENDING | PROCESSED | ERROR
export const getByStatus = async (status) => {
  try {
    return await prisma.researchFile.findMany({
      where: { status },
      include: includeRelations,
      orderBy: { created_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch research files by status: ${error.message}`, 500)
  }
}

// Upload a new PDF file
// file_path is provided by multer middleware after saving the file to disk
export const upload = async (data) => {
  try {
    const { medical_record_id, file_path } = data

    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: medical_record_id }
    })

    if (!medicalRecord) {
      throw new AppError(`Medical record with id ${medical_record_id} not found`, 404)
    }

    return await prisma.researchFile.create({
      data: {
        medical_record_id,
        file_path,
        research_id: null,
        status: 'PENDING'
      },
      include: { medical_record: true }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to upload research file: ${error.message}`, 500)
  }
}

// Classify a research file manually — link it to an existing research
// Called when doctor reviews the PDF and identifies the research type himself
export const classify = async (id, researchId) => {
  try {
    const file = await getById(id)

    const research = await prisma.research.findUnique({
      where: { id: researchId }
    })

    if (!research) {
      throw new AppError(`Research with id ${researchId} not found`, 404)
    }

    // Make sure the file and research belong to the same medical record
    if (file.medical_record_id !== research.medical_record_id) {
      throw new AppError('Research file and research do not belong to the same medical record', 400)
    }

    return await prisma.researchFile.update({
      where: { id },
      data: {
        research_id: researchId,
        status: 'PROCESSED',
        processed_at: new Date()
      },
      include: includeRelations
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to classify research file: ${error.message}`, 500)
  }
}

// Update research file status
export const updateStatus = async (id, status) => {
  try {
    await getById(id)

    const processed_at = status === 'PROCESSED' ? new Date() : undefined

    return await prisma.researchFile.update({
      where: { id },
      data: { status, processed_at }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update research file status: ${error.message}`, 500)
  }
}

// Delete research file by id
// Also removes the physical PDF file from disk
export const remove = async (id) => {
  try {
    const file = await getById(id)

    // Delete physical file from disk
    try {
      await fs.unlink(file.file_path)
    } catch (fsError) {
      // Log warning but don't block the DB deletion
      console.warn(`Warning: could not delete physical file at ${file.file_path}: ${fsError.message}`)
    }

    return await prisma.researchFile.delete({
      where: { id }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete research file: ${error.message}`, 500)
  }
}