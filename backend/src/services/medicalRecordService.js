import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

export const getById = async (id) => {
  const medicalRecord = await prisma.medicalRecord.findUnique({
    where: { id }
  })
  if (!medicalRecord) throw new AppError(`Medical record with id ${id} not found`, 404)
  return medicalRecord
}

export const getByPatientId = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { medical_record: true }
  })
  if (!patient) throw new AppError(`Patient with id ${patientId} not found`, 404)
  if (!patient.medical_record) throw new AppError(`Medical record for patient ${patientId} not found`, 404)
  return patient.medical_record
}

export const getFullRecord = async (id) => {
  const medicalRecord = await prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      patient: {
        include: { person: true }
      },
      cases: {
        include: {
          records: {
            include: {
              author: { include: { person: true } },
              record_diagnoses: { include: { disease: true } },
              record_medications: { include: { medication: true } },
              record_researches: { include: { research: true } },
              record_allergies: { include: { allergen: true } },
              record_doctors: { include: { doctor: { include: { person: true } } } },
            },
            orderBy: { visit_date: 'desc' }
          },
          researches: true,
        },
        orderBy: { opening_date: 'desc' }
      },
      patient_diseases: {
        include: { disease: true }
      },
      patient_allergies: {
        include: { allergen: true }
      },
      researches: {
        orderBy: { created_at: 'desc' }
      },
      research_files: true,
    }
  })
  if (!medicalRecord) throw new AppError(`Medical record with id ${id} not found`, 404)
  return medicalRecord
}

export const create = async (data) => {
  const { blood_group, rh_factor, height, weight } = data
  return await prisma.medicalRecord.create({
    data: {
      blood_group: blood_group ?? null,
      rh_factor: rh_factor ?? null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
    }
  })
}

export const updateBloodInfo = async (id, data) => {
  await getById(id)
  const { blood_group, rh_factor } = data
  return await prisma.medicalRecord.update({
    where: { id },
    data: {
      blood_group: blood_group ?? undefined,
      rh_factor: rh_factor ?? undefined,
    }
  })
}

export const updatePhysicalInfo = async (id, data) => {
  await getById(id)
  const { height, weight } = data
  return await prisma.medicalRecord.update({
    where: { id },
    data: {
      ...(height !== undefined && { height: height ? parseFloat(height) : null }),
      ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
    }
  })
}