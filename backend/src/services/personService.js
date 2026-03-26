import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

// Get all persons
export const getAll = async () => {
  try {
    return await prisma.person.findMany()
  } catch (error) {
    throw new AppError(`Failed to fetch persons: ${error.message}`, 500)
  }
}

// Get person by id
export const getById = async (id) => {
  try {
    const person = await prisma.person.findUnique({
      where: { id }
    })

    if (!person) {
      throw new AppError(`Person with id ${id} not found`, 404)
    }

    return person
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch person: ${error.message}`, 500)
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
    throw error instanceof AppError ? error : new AppError(`Failed to create person: ${error.message}`, 500)
  }
}

// Update person by id
export const update = async (id, data) => {
  try {
    await getById(id)

    const { last_name, first_name, middle_name, birth_date, gender, contact_info, role } = data

    return await prisma.person.update({
      where: { id },
      data: {
        last_name,
        first_name,
        middle_name,
        birth_date: birth_date ? new Date(birth_date) : undefined,
        gender,
        contact_info,
        role
      }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update person: ${error.message}`, 500)
  }
}

// Delete person by id
export const remove = async (id) => {
  try {
    await getById(id)

    return await prisma.person.delete({
      where: { id }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete person: ${error.message}`, 500)
  }
}