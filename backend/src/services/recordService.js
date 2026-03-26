import prisma from '../config/prisma.js'

// Get all records
export const getAll = async () => {
  try {
    return await prisma.record.findMany({
      include: {
        doctor: {
          include: {
            person: true
          }
        },
        research: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch records: ${error.message}`)
  }
}

// Get record by id
export const getById = async (id) => {
  try {
    const record = await prisma.record.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            person: true
          }
        },
        research: true
      }
    })

    if (!record) {
      throw new Error(`Record with id ${id} not found`)
    }

    return record
  } catch (error) {
    throw new Error(`Failed to fetch record: ${error.message}`)
  }
}

// Get all records by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.record.findMany({
      where: { medical_record_id: medicalRecordId },
      include: {
        doctor: {
          include: {
            person: true
          }
        },
        research: true
      },
      // Sort by visit date descending — latest first
      orderBy: {
        visit_date: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch records by medical record: ${error.message}`)
  }
}

// Get all records by doctor id
export const getByDoctor = async (doctorId) => {
  try {
    return await prisma.record.findMany({
      where: { doctor_id: doctorId },
      include: {
        doctor: {
          include: {
            person: true
          }
        },
        research: true
      },
      orderBy: {
        visit_date: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch records by doctor: ${error.message}`)
  }
}

// Get all records by entry type
// VISIT | RESEARCH_ORDERED | RESEARCH_REVIEW
export const getByEntryType = async (entryType) => {
  try {
    return await prisma.record.findMany({
      where: { entry_type: entryType },
      include: {
        doctor: {
          include: {
            person: true
          }
        },
        research: true
      },
      orderBy: {
        visit_date: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch records by entry type: ${error.message}`)
  }
}

// Create a new record
export const create = async (data) => {
  try {
    const {
      medical_record_id,
      doctor_id,
      visit_date,
      entry_type,
      complaints,
      doctor_conclusion,
      treatment_plan,
      plan_text,
      research_id
    } = data

    // If entry type is RESEARCH_REVIEW, research_id must be provided
    if (entry_type === 'RESEARCH_REVIEW' && !research_id) {
      throw new Error('research_id is required for RESEARCH_REVIEW entry type')
    }

    // If entry type is VISIT, research_id should not be provided
    if (entry_type === 'VISIT' && research_id) {
      throw new Error('research_id should not be provided for VISIT entry type')
    }

    return await prisma.record.create({
      data: {
        medical_record_id,
        doctor_id,
        visit_date: new Date(visit_date),
        entry_type,
        complaints: complaints ?? null,
        doctor_conclusion: doctor_conclusion ?? null,
        treatment_plan: treatment_plan ?? null,
        plan_text: plan_text ?? null,
        research_id: research_id ?? null
      },
      include: {
        doctor: {
          include: {
            person: true
          }
        },
        research: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to create record: ${error.message}`)
  }
}

// Update record
export const update = async (id, data) => {
  try {
    // Check if record exists before updating
    await getById(id)

    const {
      visit_date,
      entry_type,
      complaints,
      doctor_conclusion,
      treatment_plan,
      plan_text,
      research_id
    } = data

    return await prisma.record.update({
      where: { id },
      data: {
        visit_date: visit_date ? new Date(visit_date) : undefined,
        entry_type: entry_type ?? undefined,
        complaints: complaints ?? undefined,
        doctor_conclusion: doctor_conclusion ?? undefined,
        treatment_plan: treatment_plan ?? undefined,
        plan_text: plan_text ?? undefined,
        research_id: research_id ?? undefined
      },
      include: {
        doctor: {
          include: {
            person: true
          }
        },
        research: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to update record: ${error.message}`)
  }
}

// Delete record by id
export const remove = async (id) => {
  try {
    // Check if record exists before deleting
    await getById(id)

    return await prisma.record.delete({
      where: { id }
    })
  } catch (error) {
    throw new Error(`Failed to delete record: ${error.message}`)
  }
}

// Attach research to a record
// Used when entry type is RESEARCH_ORDERED and research is created after the visit
export const attachResearch = async (id, researchId) => {
  try {
    // Check if record exists
    const record = await getById(id)

    // Only RESEARCH_ORDERED records can have research attached
    if (record.entry_type !== 'RESEARCH_ORDERED') {
      throw new Error('Research can only be attached to RESEARCH_ORDERED records')
    }

    return await prisma.record.update({
      where: { id },
      data: {
        research_id: researchId
      },
      include: {
        doctor: {
          include: {
            person: true
          }
        },
        research: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to attach research to record: ${error.message}`)
  }
}