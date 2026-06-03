import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

// Get all allergies for a patient by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.patientAllergy.findMany({
      where: { medical_record_id: medicalRecordId },
      include: { allergen: true },
      orderBy: { diagnosed_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch patient allergies: ${error.message}`, 500)
  }
}

// Get patient allergies filtered by reaction severity
// MILD | MODERATE | SEVERE
export const getBySeverity = async (medicalRecordId, severity) => {
  try {
    return await prisma.patientAllergy.findMany({
      where: {
        medical_record_id: medicalRecordId,
        reaction_severity: severity
      },
      include: { allergen: true },
      orderBy: { diagnosed_at: 'desc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch patient allergies by severity: ${error.message}`, 500)
  }
}

// Add an allergy to a patient
export const add = async (data) => {
  try {
    const {
      medical_record_id,
      allergen_id,
      reaction_severity,
      reaction_description,
      diagnosed_at
    } = data

    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: medical_record_id }
    })

    if (!medicalRecord) {
      throw new AppError(`Medical record with id ${medical_record_id} not found`, 404)
    }

    const allergen = await prisma.allergen.findUnique({
      where: { id: allergen_id }
    })

    if (!allergen) {
      throw new AppError(`Allergen with id ${allergen_id} not found`, 404)
    }

    const existing = await prisma.patientAllergy.findUnique({
      where: {
        medical_record_id_allergen_id: {
          medical_record_id,
          allergen_id
        }
      }
    })

    if (existing) {
      throw new AppError(`Allergy with allergen id ${allergen_id} is already added to this patient`, 400)
    }

    return await prisma.patientAllergy.create({
      data: {
        medical_record_id,
        allergen_id,
        reaction_severity,
        reaction_description: reaction_description ?? null,
        diagnosed_at: new Date(diagnosed_at)
      },
      include: { allergen: true }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to add allergy to patient: ${error.message}`, 500)
  }
}

// Update allergy reaction severity and description for a patient
export const updateSeverity = async (medicalRecordId, allergenId, data) => {
  try {
    const { reaction_severity, reaction_description } = data

    const existing = await prisma.patientAllergy.findUnique({
      where: {
        medical_record_id_allergen_id: {
          medical_record_id: medicalRecordId,
          allergen_id: allergenId
        }
      }
    })

    if (!existing) {
      throw new AppError(`Allergy with allergen id ${allergenId} is not assigned to this patient`, 404)
    }

    return await prisma.patientAllergy.update({
      where: {
        medical_record_id_allergen_id: {
          medical_record_id: medicalRecordId,
          allergen_id: allergenId
        }
      },
      data: {
        reaction_severity,
        reaction_description: reaction_description ?? undefined
      },
      include: { allergen: true }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update patient allergy severity: ${error.message}`, 500)
  }
}

// Remove an allergy from a patient
export const remove = async (medicalRecordId, allergenId) => {
  try {
    const existing = await prisma.patientAllergy.findUnique({
      where: {
        medical_record_id_allergen_id: {
          medical_record_id: medicalRecordId,
          allergen_id: allergenId
        }
      }
    })

    if (!existing) {
      throw new AppError(`Allergy with allergen id ${allergenId} is not assigned to this patient`, 404)
    }

    return await prisma.patientAllergy.delete({
      where: {
        medical_record_id_allergen_id: {
          medical_record_id: medicalRecordId,
          allergen_id: allergenId
        }
      }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to remove allergy from patient: ${error.message}`, 500)
  }
}