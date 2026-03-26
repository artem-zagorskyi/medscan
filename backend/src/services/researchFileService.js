import prisma from '../config/prisma.js'
import fs from 'fs/promises'
import path from 'path'

// Base directory for uploaded PDF files
const UPLOADS_DIR = path.resolve('uploads/researches')

// Get all research files
export const getAll = async () => {
  try {
    return await prisma.researchFile.findMany({
      include: {
        medical_record: true,
        research: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch research files: ${error.message}`)
  }
}

// Get research file by id
export const getById = async (id) => {
  try {
    const file = await prisma.researchFile.findUnique({
      where: { id },
      include: {
        medical_record: true,
        research: true
      }
    })

    if (!file) {
      throw new Error(`Research file with id ${id} not found`)
    }

    return file
  } catch (error) {
    throw new Error(`Failed to fetch research file: ${error.message}`)
  }
}

// Get all research files by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.researchFile.findMany({
      where: { medical_record_id: medicalRecordId },
      include: {
        research: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch research files by medical record: ${error.message}`)
  }
}

// Get all unclassified files — research_id is NULL
// These are files that have been uploaded but not yet reviewed by a doctor
export const getUnclassified = async () => {
  try {
    return await prisma.researchFile.findMany({
      where: { research_id: null },
      include: {
        medical_record: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch unclassified research files: ${error.message}`)
  }
}

// Get all research files by status
// PENDING | PROCESSED | ERROR
export const getByStatus = async (status) => {
  try {
    return await prisma.researchFile.findMany({
      where: { status },
      include: {
        medical_record: true,
        research: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch research files by status: ${error.message}`)
  }
}

// Upload a new PDF file
// file_path is provided by multer middleware after saving the file to disk
export const upload = async (data) => {
  try {
    const { medical_record_id, file_path } = data

    // Check if medical record exists
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: medical_record_id }
    })

    if (!medicalRecord) {
      throw new Error(`Medical record with id ${medical_record_id} not found`)
    }

    return await prisma.researchFile.create({
      data: {
        medical_record_id,
        file_path,
        // research_id is NULL — file is not classified yet
        research_id: null,
        status: 'PENDING'
      },
      include: {
        medical_record: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to upload research file: ${error.message}`)
  }
}

// Classify a research file manually — link it to an existing research
// Called when doctor reviews the PDF and identifies the research type himself
export const classify = async (id, researchId) => {
  try {
    // Check if file exists
    const file = await getById(id)
 
    // Check if research exists
    const research = await prisma.research.findUnique({
      where: { id: researchId }
    })
 
    if (!research) {
      throw new Error(`Research with id ${researchId} not found`)
    }
 
    // Make sure the file and research belong to the same medical record
    if (file.medical_record_id !== research.medical_record_id) {
      throw new Error('Research file and research do not belong to the same medical record')
    }
 
    return await prisma.researchFile.update({
      where: { id },
      data: {
        research_id: researchId,
        status: 'PROCESSED',
        processed_at: new Date()
      },
      include: {
        medical_record: true,
        research: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to classify research file: ${error.message}`)
  }
}
 
// TODO: ML classification — automatically classify a research file using ML model
// This function should:
//   1. Extract text from the PDF file (OCR or pdfjs)
//   2. Send extracted text to the ML model (local model)
//   3. Receive predicted research type from the model
//   4. Create a new Research record with the predicted type (status: PENDING)
//   5. Link the file to the created Research via classify()
//   6. Return the result so the doctor can confirm or correct it in the UI
//
 

// Update research file status
export const updateStatus = async (id, status) => {
  try {
    // Check if file exists before updating
    await getById(id)

    // Set processed_at timestamp when file is marked as PROCESSED
    const processed_at = status === 'PROCESSED' ? new Date() : undefined

    return await prisma.researchFile.update({
      where: { id },
      data: {
        status,
        processed_at
      }
    })
  } catch (error) {
    throw new Error(`Failed to update research file status: ${error.message}`)
  }
}

// Delete research file by id
// Also removes the physical PDF file from disk
export const remove = async (id) => {
  try {
    // Check if file exists before deleting
    const file = await getById(id)

    // Delete physical file from disk
    try {
      await fs.unlink(file.file_path)
    } catch (fsError) {
      // Log warning but don't block the DB deletion
      // File might have already been deleted manually
      console.warn(`Warning: could not delete physical file at ${file.file_path}: ${fsError.message}`)
    }

    return await prisma.researchFile.delete({
      where: { id }
    })
  } catch (error) {
    throw new Error(`Failed to delete research file: ${error.message}`)
  }
}