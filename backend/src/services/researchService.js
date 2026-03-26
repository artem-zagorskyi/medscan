import prisma from '../config/prisma.js'

// Get all researches
export const getAll = async () => {
  try {
    return await prisma.research.findMany({
      include: {
        medical_record: true,
        research_files: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch researches: ${error.message}`)
  }
}

// Get research by id
export const getById = async (id) => {
  try {
    const research = await prisma.research.findUnique({
      where: { id },
      include: {
        medical_record: true,
        research_files: true
      }
    })

    if (!research) {
      throw new Error(`Research with id ${id} not found`)
    }

    return research
  } catch (error) {
    throw new Error(`Failed to fetch research: ${error.message}`)
  }
}

// Get all researches by medical record id
export const getByMedicalRecord = async (medicalRecordId) => {
  try {
    return await prisma.research.findMany({
      where: { medical_record_id: medicalRecordId },
      include: {
        research_files: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch researches by medical record: ${error.message}`)
  }
}

// Get all researches by status
// PENDING | PROCESSING | PROCESSED | ERROR
export const getByStatus = async (status) => {
  try {
    return await prisma.research.findMany({
      where: { status },
      include: {
        medical_record: true,
        research_files: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch researches by status: ${error.message}`)
  }
}

// Create a new research (draft)
// Called after RESEARCH_ORDERED visit
export const create = async (data) => {
  try {
    const { medical_record_id, research_type } = data

    return await prisma.research.create({
      data: {
        medical_record_id,
        research_type,
        // New research always starts as PENDING
        status: 'PENDING'
      },
      include: {
        medical_record: true,
        research_files: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to create research: ${error.message}`)
  }
}

// Update research results
// Called when doctor fills in the results manually or after classification
export const update = async (id, data) => {
  try {
    // Check if research exists before updating
    await getById(id)

    const { research_type, extracted_text, results } = data

    return await prisma.research.update({
      where: { id },
      data: {
        research_type: research_type ?? undefined,
        extracted_text: extracted_text ?? undefined,
        results: results ?? undefined
      },
      include: {
        medical_record: true,
        research_files: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to update research: ${error.message}`)
  }
}

// Update research status
// PENDING → PROCESSING → PROCESSED | ERROR
export const updateStatus = async (id, status) => {
  try {
    // Check if research exists before updating
    await getById(id)

    // Set processed_at timestamp when research is marked as PROCESSED
    const processed_at = status === 'PROCESSED' ? new Date() : undefined

    return await prisma.research.update({
      where: { id },
      data: {
        status,
        processed_at
      }
    })
  } catch (error) {
    throw new Error(`Failed to update research status: ${error.message}`)
  }
}

// Delete research by id
export const remove = async (id) => {
  try {
    // Check if research exists before deleting
    await getById(id)

    return await prisma.research.delete({
      where: { id }
    })
  } catch (error) {
    throw new Error(`Failed to delete research: ${error.message}`)
  }
}