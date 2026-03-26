import prisma from '../config/prisma.js'

// Get all allergens
export const getAll = async () => {
  try {
    return await prisma.allergen.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch allergens: ${error.message}`)
  }
}

// Get allergen by id
export const getById = async (id) => {
  try {
    const allergen = await prisma.allergen.findUnique({
      where: { id }
    })

    if (!allergen) {
      throw new Error(`Allergen with id ${id} not found`)
    }

    return allergen
  } catch (error) {
    throw new Error(`Failed to fetch allergen: ${error.message}`)
  }
}

// Get allergens by category
// FOOD | DRUG | ENVIRONMENTAL | INSECT | OTHER
export const getByCategory = async (category) => {
  try {
    return await prisma.allergen.findMany({
      where: { category },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch allergens by category: ${error.message}`)
  }
}

// Search allergens by name — case insensitive partial match
export const search = async (query) => {
  try {
    return await prisma.allergen.findMany({
      where: {
        name: {
          contains: query
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  } catch (error) {
    throw new Error(`Failed to search allergens: ${error.message}`)
  }
}

// Create a new allergen
export const create = async (data) => {
  try {
    const { name, category } = data

    // Check if allergen with this name already exists
    const existing = await prisma.allergen.findFirst({
      where: {
        name: {
          equals: name
        }
      }
    })

    if (existing) {
      throw new Error(`Allergen with name "${name}" already exists`)
    }

    return await prisma.allergen.create({
      data: {
        name,
        category
      }
    })
  } catch (error) {
    throw new Error(`Failed to create allergen: ${error.message}`)
  }
}

// Update allergen
export const update = async (id, data) => {
  try {
    // Check if allergen exists before updating
    await getById(id)

    const { name, category } = data

    // If name is being changed check it is not already taken
    if (name) {
      const existing = await prisma.allergen.findFirst({
        where: {
          name: { equals: name },
          // Exclude current allergen from the check
          NOT: { id }
        }
      })

      if (existing) {
        throw new Error(`Allergen with name "${name}" already exists`)
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
    throw new Error(`Failed to update allergen: ${error.message}`)
  }
}

// Delete allergen by id
export const remove = async (id) => {
  try {
    // Check if allergen exists before deleting
    await getById(id)

    return await prisma.allergen.delete({
      where: { id }
    })
  } catch (error) {
    throw new Error(`Failed to delete allergen: ${error.message}`)
  }
}