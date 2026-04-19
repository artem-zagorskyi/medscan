import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

// Get all doctors with their person data
export const getAll = async () => {
  try {
    return await prisma.doctor.findMany({
      include: { person: true }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch doctors: ${error.message}`, 500)
  }
}

// Get doctor by id with person data
export const getById = async (id) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: { person: true }
    })

    if (!doctor) {
      throw new AppError(`Doctor with id ${id} not found`, 404)
    }

    return doctor
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch doctor: ${error.message}`, 500)
  }
}

// Get doctors by specialization — partial case-insensitive match
export const getBySpecialization = async (specialization) => {
  try {
    return await prisma.doctor.findMany({
      where: {
        specialization: { contains: specialization }
      },
      include: { person: true }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch doctors by specialization: ${error.message}`, 500)
  }
}

// Get all patients assigned to a doctor
export const getPatients = async (doctorId) => {
  try {
    await getById(doctorId)

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
    throw error instanceof AppError ? error : new AppError(`Failed to fetch patients for doctor: ${error.message}`, 500)
  }
}

// Create a new doctor
export const create = async (data) => {
  try {
    const { person_id, specialization } = data

    const existing = await prisma.doctor.findUnique({
      where: { person_id }
    })

    if (existing) {
      throw new AppError(`Doctor with person_id ${person_id} already exists`, 400)
    }

    return await prisma.doctor.create({
      data: { person_id, specialization },
      include: { person: true }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to create doctor: ${error.message}`, 500)
  }
}

// Update doctor specialization
export const update = async (id, data) => {
  try {
    await getById(id)

    return await prisma.doctor.update({
      where: { id },
      data: { specialization: data.specialization },
      include: { person: true }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update doctor: ${error.message}`, 500)
  }
}

// Delete doctor by id
export const remove = async (id) => {
  try {
    await getById(id)

    return await prisma.doctor.delete({
      where: { id }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete doctor: ${error.message}`, 500)
  }
}

// Get doctor by person_id
export const getByPersonId = async (personId) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { person_id: personId },
      include: { person: true }
    })

    if (!doctor) {
      throw new AppError(`Doctor with person_id ${personId} not found`, 404)
    }

    return doctor
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch doctor by person_id: ${error.message}`, 500)
  }
}