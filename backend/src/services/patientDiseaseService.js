import prisma from '../config/prisma.js'

// Get all diseases for a specific patient by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.patientDisease.findMany({
      where: { medical_record_id: medicalRecordId },
      include: {
        disease: true
      },
      orderBy: {
        diagnosed_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch patient diseases: ${error.message}`)
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
      include: {
        disease: true
      },
      orderBy: {
        diagnosed_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch patient diseases by status: ${error.message}`)
  }
}

// Add a disease to a patient
export const add = async (data) => {
  try {
    const { medical_record_id, disease_id, status, diagnosed_at } = data

    // Check if medical record exists
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: medical_record_id }
    })

    if (!medicalRecord) {
      throw new Error(`Medical record with id ${medical_record_id} not found`)
    }

    // Check if disease exists
    const disease = await prisma.disease.findUnique({
      where: { id: disease_id }
    })

    if (!disease) {
      throw new Error(`Disease with id ${disease_id} not found`)
    }

    // Check if this disease is already added to this patient
    const existing = await prisma.patientDisease.findUnique({
      where: {
        medical_record_id_disease_id: {
          medical_record_id,
          disease_id
        }
      }
    })

    if (existing) {
      throw new Error(`Disease with id ${disease_id} is already added to this patient`)
    }

    return await prisma.patientDisease.create({
      data: {
        medical_record_id,
        disease_id,
        status,
        diagnosed_at: new Date(diagnosed_at)
      },
      include: {
        disease: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to add disease to patient: ${error.message}`)
  }
}

// Update disease status for a patient
// ACTIVE | RECOVERED | CHRONIC
export const updateStatus = async (medicalRecordId, diseaseId, status) => {
  try {
    // Check if this patient disease relation exists
    const existing = await prisma.patientDisease.findUnique({
      where: {
        medical_record_id_disease_id: {
          medical_record_id: medicalRecordId,
          disease_id: diseaseId
        }
      }
    })

    if (!existing) {
      throw new Error(`Disease with id ${diseaseId} is not assigned to this patient`)
    }

    return await prisma.patientDisease.update({
      where: {
        medical_record_id_disease_id: {
          medical_record_id: medicalRecordId,
          disease_id: diseaseId
        }
      },
      data: { status },
      include: {
        disease: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to update patient disease status: ${error.message}`)
  }
}

// Remove a disease from a patient
export const remove = async (medicalRecordId, diseaseId) => {
  try {
    // Check if this patient disease relation exists
    const existing = await prisma.patientDisease.findUnique({
      where: {
        medical_record_id_disease_id: {
          medical_record_id: medicalRecordId,
          disease_id: diseaseId
        }
      }
    })

    if (!existing) {
      throw new Error(`Disease with id ${diseaseId} is not assigned to this patient`)
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
    throw new Error(`Failed to remove disease from patient: ${error.message}`)
  }
}