import prisma from '../config/prisma.js'

// Get all patients with their person and medical record data
export const getAll = async () => {
  try {
    return await prisma.patient.findMany({
      include: {
        person: true,
        medical_record: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch patients: ${error.message}`)
  }
}

// Get patient by id with person and medical record data
export const getById = async (id) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        person: true,
        medical_record: true
      }
    })

    if (!patient) {
      throw new Error(`Patient with id ${id} not found`)
    }

    return patient
  } catch (error) {
    throw new Error(`Failed to fetch patient: ${error.message}`)
  }
}

// Get all patients assigned to a specific doctor
export const getByDoctorId = async (doctorId) => {
  try {
    return await prisma.doctorPatient.findMany({
      where: { doctor_id: doctorId },
      include: {
        patient: {
          include: {
            person: true,
            medical_record: true
          }
        }
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch patients by doctor: ${error.message}`)
  }
}

// Create a new patient
// Note: person and medical record must be created first
export const create = async (data) => {
  try {
    const { person_id, medical_record_id } = data

    // Check if patient with this person_id already exists
    const existing = await prisma.patient.findUnique({
      where: { person_id }
    })

    if (existing) {
      throw new Error(`Patient with person_id ${person_id} already exists`)
    }

    // Check if medical record is already taken by another patient
    const medicalRecordTaken = await prisma.patient.findUnique({
      where: { medical_record_id }
    })

    if (medicalRecordTaken) {
      throw new Error(`Medical record with id ${medical_record_id} is already assigned to another patient`)
    }

    return await prisma.patient.create({
      data: {
        person_id,
        medical_record_id
      },
      include: {
        person: true,
        medical_record: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to create patient: ${error.message}`)
  }
}

// Update patient data
export const update = async (id, data) => {
  try {
    // Check if patient exists before updating
    await getById(id)

    const { person_id, medical_record_id } = data

    return await prisma.patient.update({
      where: { id },
      data: {
        person_id,
        medical_record_id
      },
      include: {
        person: true,
        medical_record: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to update patient: ${error.message}`)
  }
}

// Delete patient by id
export const remove = async (id) => {
  try {
    // Check if patient exists before deleting
    await getById(id)

    return await prisma.patient.delete({
      where: { id }
    })
  } catch (error) {
    throw new Error(`Failed to delete patient: ${error.message}`)
  }
}