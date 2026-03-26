import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

// Get all allergens sorted alphabetically
export const getAll = async () => {
  try {
    return await prisma.allergen.findMany({
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch allergens: ${error.message}`, 500)
  }
}

// Get allergen by id
export const getById = async (id) => {
  try {
    const allergen = await prisma.allergen.findUnique({
      where: { id }
    })

    if (!allergen) {
      throw new AppError(`Allergen with id ${id} not found`, 404)
    }

    return allergen
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch allergen: ${error.message}`, 500)
  }
}

// Get allergens by category
// FOOD | DRUG | ENVIRONMENTAL | INSECT | OTHER
export const getByCategory = async (category) => {
  try {
    return await prisma.allergen.findMany({
      where: { category },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    throw new AppError(`Failed to fetch allergens by category: ${error.message}`, 500)
  }
}

// Search allergens by name — partial case-insensitive match
export const search = async (query) => {
  try {
    return await prisma.allergen.findMany({
      where: {
        name: { contains: query }
      },
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    throw new AppError(`Failed to search allergens: ${error.message}`, 500)
  }
}

// Create a new allergen
export const create = async (data) => {
  try {
    const { name, category } = data

    const existing = await prisma.allergen.findFirst({
      where: { name: { equals: name } }
    })

    if (existing) {
      throw new AppError(`Allergen with name "${name}" already exists`, 400)
    }

    return await prisma.allergen.create({
      data: { name, category }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to create allergen: ${error.message}`, 500)
  }
}

// Update allergen
export const update = async (id, data) => {
  try {
    await getById(id)

    const { name, category } = data

    // If name is being changed check it is not already taken
    if (name) {
      const existing = await prisma.allergen.findFirst({
        where: {
          name: { equals: name },
          NOT: { id }
        }
      })

      if (existing) {
        throw new AppError(`Allergen with name "${name}" already exists`, 400)
      }
    }

    return await prisma.allergen.update({
      where: { id },
      data: {
        name: name ?? undefined,
        category: category ?? undefined
      }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update allergen: ${error.message}`, 500)
  }
}

// Delete allergen by id
export const remove = async (id) => {
  try {
    await getById(id)

    return await prisma.allergen.delete({
      where: { id }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete allergen: ${error.message}`, 500)
  }
}