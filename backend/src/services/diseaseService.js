import prisma from '../config/prisma.js'

// Get all diseases
export const getAll = async () => {
  try {
    return await prisma.disease.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch diseases: ${error.message}`)
  }
}

// Get disease by id
export const getById = async (id) => {
  try {
    const disease = await prisma.disease.findUnique({
      where: { id }
    })

    if (!disease) {
      throw new Error(`Disease with id ${id} not found`)
    }

    return disease
  } catch (error) {
    throw new Error(`Failed to fetch disease: ${error.message}`)
  }
}

// Get disease by ICD code
export const getByIcdCode = async (icdCode) => {
  try {
    const disease = await prisma.disease.findFirst({
      where: {
        icd_code: {
          equals: icdCode
        }
      }
    })

    if (!disease) {
      throw new Error(`Disease with ICD code ${icdCode} not found`)
    }

    return disease
  } catch (error) {
    throw new Error(`Failed to fetch disease by ICD code: ${error.message}`)
  }
}

// Search diseases by name — case insensitive partial match
export const search = async (query) => {
  try {
    return await prisma.disease.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query
            }
          },
          {
            icd_code: {
              contains: query
            }
          }
        ]
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to search diseases: ${error.message}`)
  }
}

// Create a new disease
export const create = async (data) => {
  try {
    const { name, icd_code } = data

    // Check if disease with this ICD code already exists
    const existing = await prisma.disease.findFirst({
      where: { icd_code }
    })

    if (existing) {
      throw new Error(`Disease with ICD code ${icd_code} already exists`)
    }

    return await prisma.disease.create({
      data: {
        name,
        icd_code
      }
    })
  } catch (error) {
    throw new Error(`Failed to create disease: ${error.message}`)
  }
}

// Update disease
export const update = async (id, data) => {
  try {
    // Check if disease exists before updating
    await getById(id)

    const { name, icd_code } = data

    // If icd_code is being changed check it is not already taken
    if (icd_code) {
      const existing = await prisma.disease.findFirst({
        where: {
          icd_code,
          // Exclude current disease from the check
          NOT: { id }
        }
      })

      if (existing) {
        throw new Error(`Disease with ICD code ${icd_code} already exists`)
      }
    }

    return await prisma.disease.update({
      where: { id },
      data: {
        name: name ?? undefined,
        icd_code: icd_code ?? undefined
      }
    })
  } catch (error) {
    throw new Error(`Failed to update disease: ${error.message}`)
  }
}

// Delete disease by id
export const remove = async (id) => {
  try {
    // Check if disease exists before deleting
    await getById(id)

    return await prisma.disease.delete({
      where: { id }
    })
  } catch (error) {
    throw new Error(`Failed to delete disease: ${error.message}`)
  }
}