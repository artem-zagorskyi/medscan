import prisma from '../config/prisma.js'

// Get all doctors assigned to a specific patient
export const getDoctorsByPatient = async (patientId) => {
  try {
    const relations = await prisma.doctorPatient.findMany({
      where: { patient_id: patientId },
      include: {
        doctor: {
          include: {
            person: true
          }
        }
      }
    })

    if (!relations.length) {
      throw new Error(`No doctors found for patient with id ${patientId}`)
    }

    return relations
  } catch (error) {
    throw new Error(`Failed to fetch doctors by patient: ${error.message}`)
  }
}

// Get all patients assigned to a specific doctor
export const getPatientsByDoctor = async (doctorId) => {
  try {
    const relations = await prisma.doctorPatient.findMany({
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

    if (!relations.length) {
      throw new Error(`No patients found for doctor with id ${doctorId}`)
    }

    return relations
  } catch (error) {
    throw new Error(`Failed to fetch patients by doctor: ${error.message}`)
  }
}