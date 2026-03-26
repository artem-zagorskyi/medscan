import prisma from '../config/prisma.js'

// Get all doctors with their person data
export const getAll = async () => {
  try {
    return await prisma.doctor.findMany({
      include: {
        person: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch doctors: ${error.message}`)
  }
}

// Get doctor by id with person data
export const getById = async (id) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        person: true
      }
    })

    if (!doctor) {
      throw new Error(`Doctor with id ${id} not found`)
    }

    return doctor
  } catch (error) {
    throw new Error(`Failed to fetch doctor: ${error.message}`)
  }
}

// Get doctors by specialization
export const getBySpecialization = async (specialization) => {
  try {
    return await prisma.doctor.findMany({
      where: {
        specialization: {
          // Case-insensitive search
          contains: specialization
        }
      },
      include: {
        person: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch doctors by specialization: ${error.message}`)
  }
}

// Get all patients assigned to a doctor
export const getPatients = async (doctorId) => {
  try {
    // Check if doctor exists
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
    throw new Error(`Failed to fetch patients for doctor: ${error.message}`)
  }
}

// Create a new doctor
// Note: person must be created first, then doctor is linked to it
export const create = async (data) => {
  try {
    const { person_id, specialization } = data

    // Check if doctor with this person_id already exists
    const existing = await prisma.doctor.findUnique({
      where: { person_id }
    })

    if (existing) {
      throw new Error(`Doctor with person_id ${person_id} already exists`)
    }

    return await prisma.doctor.create({
      data: {
        person_id,
        specialization
      },
      include: {
        person: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to create doctor: ${error.message}`)
  }
}

// Update doctor specialization
export const update = async (id, data) => {
  try {
    // Check if doctor exists before updating
    await getById(id)

    const { specialization } = data

    return await prisma.doctor.update({
      where: { id },
      data: { specialization },
      include: {
        person: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to update doctor: ${error.message}`)
  }
}

// Delete doctor by id
export const remove = async (id) => {
  try {
    // Check if doctor exists before deleting
    await getById(id)

    return await prisma.doctor.delete({
      where: { id }
    })
  } catch (error) {
    throw new Error(`Failed to delete doctor: ${error.message}`)
  }
}