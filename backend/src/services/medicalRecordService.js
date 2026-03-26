import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

// Get medical record by id
export const getById = async (id) => {
  try {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id }
    })

    if (!medicalRecord) {
      throw new AppError(`Medical record with id ${id} not found`, 404)
    }

    return medicalRecord
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch medical record: ${error.message}`, 500)
  }
}

// Get medical record by patient id
export const getByPatientId = async (patientId) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { medical_record: true }
    })

    if (!patient) {
      throw new AppError(`Patient with id ${patientId} not found`, 404)
    }

    if (!patient.medical_record) {
      throw new AppError(`Medical record for patient with id ${patientId} not found`, 404)
    }

    return patient.medical_record
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch medical record by patient: ${error.message}`, 500)
  }
}

// Get full medical record with all related data
export const getFullRecord = async (id) => {
  try {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        patient: {
          include: { person: true }
        },
        records: {
          include: {
            doctor: {
              include: { person: true }
            },
            research: true
          }
        },
        patient_diseases: {
          include: { disease: true }
        },
        patient_allergies: {
          include: { allergen: true }
        },
        researches: true,
        research_files: true
      }
    })

    if (!medicalRecord) {
      throw new AppError(`Medical record with id ${id} not found`, 404)
    }

    return medicalRecord
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch full medical record: ${error.message}`, 500)
  }
}

// Create a new medical record
export const create = async (data) => {
  try {
    const { blood_group, rh_factor } = data

    return await prisma.medicalRecord.create({
      data: {
        blood_group: blood_group ?? null,
        rh_factor: rh_factor ?? null
      }
    })
  } catch (error) {
    throw new AppError(`Failed to create medical record: ${error.message}`, 500)
  }
}

// Update blood group and rh factor
export const updateBloodInfo = async (id, data) => {
  try {
    await getById(id)

    const { blood_group, rh_factor } = data

    return await prisma.medicalRecord.update({
      where: { id },
      data: {
        blood_group: blood_group ?? undefined,
        rh_factor: rh_factor ?? undefined
      }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update blood info: ${error.message}`, 500)
  }
}