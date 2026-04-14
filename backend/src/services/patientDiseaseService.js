import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

// Get all diseases for a patient by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.patientDisease.findMany({
      where: { medical_record_id: medicalRecordId },
      include: { disease: true },
      orderBy: { diagnosed_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch patient diseases: ${error.message}`, 500)
  }
}

// Get patient diseases filtered by status
// ACTIVE | RECOVERED | CHRONIC
export const getByStatus = async (medicalRecordId, status) => {
  try {
    return await prisma.patientDisease.findMany({
      where: {
        medical_record_id: medicalRecordId,
        status
      },
      include: { disease: true },
      orderBy: { diagnosed_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch patient diseases by status: ${error.message}`, 500)
  }
}

// Add a disease to a patient
export const add = async (data) => {
  try {
    const { medical_record_id, disease_id, status, diagnosed_at } = data

    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: medical_record_id }
    })

    if (!medicalRecord) {
      throw new AppError(`Medical record with id ${medical_record_id} not found`, 404)
    }

    const disease = await prisma.disease.findUnique({
      where: { id: disease_id }
    })

    if (!disease) {
      throw new AppError(`Disease with id ${disease_id} not found`, 404)
    }

    const existing = await prisma.patientDisease.findUnique({
      where: {
        medical_record_id_disease_id: {
          medical_record_id,
          disease_id
        }
      }
    })

    if (existing) {
      throw new AppError(`Disease with id ${disease_id} is already added to this patient`, 400)
    }

    return await prisma.patientDisease.create({
      data: {
        medical_record_id,
        disease_id,
        status,
        diagnosed_at: new Date(diagnosed_at)
      },
      include: { disease: true }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to add disease to patient: ${error.message}`, 500)
  }
}

// Update disease status for a patient
// ACTIVE | RECOVERED | CHRONIC
export const updateStatus = async (medicalRecordId, diseaseId, status) => {
  try {
    const existing = await prisma.patientDisease.findUnique({
      where: {
        medical_record_id_disease_id: {
          medical_record_id: medicalRecordId,
          disease_id: diseaseId
        }
      }
    })

    if (!existing) {
      throw new AppError(`Disease with id ${diseaseId} is not assigned to this patient`, 404)
    }

    return await prisma.patientDisease.update({
      where: {
        medical_record_id_disease_id: {
          medical_record_id: medicalRecordId,
          disease_id: diseaseId
        }
      },
      data: { status },
      include: { disease: true }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update patient disease status: ${error.message}`, 500)
  }
}

// Remove a disease from a patient
export const remove = async (medicalRecordId, diseaseId) => {
  try {
    const existing = await prisma.patientDisease.findUnique({
      where: {
        medical_record_id_disease_id: {
          medical_record_id: medicalRecordId,
          disease_id: diseaseId
        }
      }
    })

    if (!existing) {
      throw new AppError(`Disease with id ${diseaseId} is not assigned to this patient`, 404)
    }

    return await prisma.patientDisease.delete({
      where: {
        medical_record_id_disease_id: {
          medical_record_id: medicalRecordId,
          disease_id: diseaseId
        }
      }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to remove disease from patient: ${error.message}`, 500)
  }
}