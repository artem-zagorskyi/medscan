import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

// Get all diseases sorted alphabetically
export const getAll = async () => {
  try {
    return await prisma.disease.findMany({
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch diseases: ${error.message}`, 500)
  }
}

// Get disease by id
export const getById = async (id) => {
  try {
    const disease = await prisma.disease.findUnique({
      where: { id }
    })

    if (!disease) {
      throw new AppError(`Disease with id ${id} not found`, 404)
    }

    return disease
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch disease: ${error.message}`, 500)
  }
}

// Get disease by ICD code
export const getByIcdCode = async (icdCode) => {
  try {
    const disease = await prisma.disease.findFirst({
      where: { icd_code: { equals: icdCode } }
    })

    if (!disease) {
      throw new AppError(`Disease with ICD code ${icdCode} not found`, 404)
    }

    return disease
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch disease by ICD code: ${error.message}`, 500)
  }
}

// Search diseases by name or ICD code — partial case-insensitive match
export const search = async (query) => {
  try {
    return await prisma.disease.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { icd_code: { contains: query } }
        ]
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    throw new AppError(`Failed to search diseases: ${error.message}`, 500)
  }
}

// Create a new disease
export const create = async (data) => {
  try {
    const { name, icd_code } = data

    const existing = await prisma.disease.findFirst({
      where: { icd_code }
    })

    if (existing) {
      throw new AppError(`Disease with ICD code ${icd_code} already exists`, 400)
    }

    return await prisma.disease.create({
      data: { name, icd_code }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to create disease: ${error.message}`, 500)
  }
}

// Update disease
export const update = async (id, data) => {
  try {
    await getById(id)

    const { name, icd_code } = data

    // If icd_code is being changed check it is not already taken
    if (icd_code) {
      const existing = await prisma.disease.findFirst({
        where: {
          icd_code,
          NOT: { id }
        }
      })

      if (existing) {
        throw new AppError(`Disease with ICD code ${icd_code} already exists`, 400)
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
    throw error instanceof AppError ? error : new AppError(`Failed to update disease: ${error.message}`, 500)
  }
}

// Delete disease by id
export const remove = async (id) => {
  try {
    await getById(id)

    return await prisma.disease.delete({
      where: { id }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete disease: ${error.message}`, 500)
  }
}