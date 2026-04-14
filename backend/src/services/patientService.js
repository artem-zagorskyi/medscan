import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

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
    throw new AppError(`Failed to fetch patients: ${error.message}`, 500)
  }
}

// Get patient by id
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
      throw new AppError(`Patient with id ${id} not found`, 404)
    }

    return patient
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch patient: ${error.message}`, 500)
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
    throw new AppError(`Failed to fetch patients by doctor: ${error.message}`, 500)
  }
}

// Create a new patient
export const create = async (data) => {
  try {
    const { person_id, medical_record_id } = data

    const existingPerson = await prisma.patient.findUnique({
      where: { person_id }
    })

    if (existingPerson) {
      throw new AppError(`Patient with person_id ${person_id} already exists`, 400)
    }

    const existingRecord = await prisma.patient.findUnique({
      where: { medical_record_id }
    })

    if (existingRecord) {
      throw new AppError(`Medical record with id ${medical_record_id} is already assigned to another patient`, 400)
    }

    return await prisma.patient.create({
      data: { person_id, medical_record_id },
      include: {
        person: true,
        medical_record: true
      }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to create patient: ${error.message}`, 500)
  }
}

// Update patient data
export const update = async (id, data) => {
  try {
    await getById(id)

    const { person_id, medical_record_id } = data

    return await prisma.patient.update({
      where: { id },
      data: { person_id, medical_record_id },
      include: {
        person: true,
        medical_record: true
      }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update patient: ${error.message}`, 500)
  }
}

// Delete patient by id
export const remove = async (id) => {
  try {
    await getById(id)

    return await prisma.patient.delete({
      where: { id }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete patient: ${error.message}`, 500)
  }
}