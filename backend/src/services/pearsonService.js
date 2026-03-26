import prisma from '../config/prisma.js'

// Get all persons
export const getAll = async () => {
  try {
    return await prisma.person.findMany()
  } catch (error) {
    throw new Error(`Failed to fetch persons: ${error.message}`)
  }
}

// Get person by id
export const getById = async (id) => {
  try {
    const person = await prisma.person.findUnique({
      where: { id }
    })

    if (!person) {
      throw new Error(`Person with id ${id} not found`)
    }

    return person
  } catch (error) {
    throw new Error(`Failed to fetch person: ${error.message}`)
  }
}

// Create a new person
export const create = async (data) => {
  try {
    const { last_name, first_name, middle_name, birth_date, gender, contact_info, role } = data

    return await prisma.person.create({
      data: {
        last_name,
        first_name,
        middle_name,
        birth_date: new Date(birth_date),
        gender,
        contact_info,
        role
      }
    })
  } catch (error) {
    throw new Error(`Failed to create person: ${error.message}`)
  }
}

// Update person by id
export const update = async (id, data) => {
  try {
    // Check if person exists before updating
    await getById(id)

    const { last_name, first_name, middle_name, birth_date, gender, contact_info, role } = data

    return await prisma.person.update({
      where: { id },
      data: {
        last_name,
        first_name,
        middle_name,
        // Only update birth_date if provided
        birth_date: birth_date ? new Date(birth_date) : undefined,
        gender,
        contact_info,
        role
      }
    })
  } catch (error) {
    throw new Error(`Failed to update person: ${error.message}`)
  }
}

// Delete person by id
export const remove = async (id) => {
  try {
    // Check if person exists before deleting
    await getById(id)

    return await prisma.person.delete({
      where: { id }
    })
  } catch (error) {
    throw new Error(`Failed to delete person: ${error.message}`)
  }
}