import prisma from '../config/prisma.js'
import bcrypt from 'bcrypt'
import { AppError } from '../errors/AppError.js'

const SALT_ROUNDS = 12
const PEPPER = process.env.PEPPER_SECRET

// Get account by person id
export const getByPersonId = async (personId) => {
  try {
    const account = await prisma.account.findUnique({
      where: { person_id: personId }
    })

    if (!account) {
      throw new AppError(`Account with person_id ${personId} not found`, 404)
    }

    return account
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch account: ${error.message}`, 500)
  }
}

// Get account by email
export const getByEmail = async (email) => {
  try {
    const account = await prisma.account.findUnique({
      where: { email }
    })

    if (!account) {
      throw new AppError(`Account with email ${email} not found`, 404)
    }

    return account
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch account by email: ${error.message}`, 500)
  }
}

// Create a new account
export const create = async (data) => {
  try {
    const { person_id, email, password, rights } = data

    // Check if account with this email already exists
    const existing = await prisma.account.findUnique({
      where: { email }
    })

    if (existing) {
      throw new AppError(`Account with email ${email} already exists`, 400)
    }

    // Add pepper to password before hashing
    const hashedPassword = await bcrypt.hash(password + PEPPER, SALT_ROUNDS)

    return await prisma.account.create({
      data: {
        person_id,
        email,
        password: hashedPassword,
        rights: rights ?? 'USER'
      }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to create account: ${error.message}`, 500)
  }
}

// Update account password
export const updatePassword = async (personId, data) => {
  try {
    const { old_password, new_password } = data

    const account = await getByPersonId(personId)

    // Verify old password with pepper
    const isMatch = await bcrypt.compare(old_password + PEPPER, account.password)

    if (!isMatch) {
      throw new AppError('Old password is incorrect', 400)
    }

    const hashedPassword = await bcrypt.hash(new_password + PEPPER, SALT_ROUNDS)

    return await prisma.account.update({
      where: { person_id: personId },
      data: { password: hashedPassword }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update password: ${error.message}`, 500)
  }
}

// Update account rights (USER / ADMIN)
export const updateRights = async (personId, rights) => {
  try {
    await getByPersonId(personId)

    return await prisma.account.update({
      where: { person_id: personId },
      data: { rights }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to update rights: ${error.message}`, 500)
  }
}

// Delete account by person id
export const remove = async (personId) => {
  try {
    await getByPersonId(personId)

    return await prisma.account.delete({
      where: { person_id: personId }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to delete account: ${error.message}`, 500)
  }
}

// Deactivate account (block login)
export const deactivate = async (personId) => {
  try {
    await getByPersonId(personId)

    return await prisma.account.update({
      where: { person_id: personId },
      data: { is_active: false }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to deactivate account: ${error.message}`, 500)
  }
}

// Activate account (restore login)
export const activate = async (personId) => {
  try {
    await getByPersonId(personId)

    return await prisma.account.update({
      where: { person_id: personId },
      data: { is_active: true }
    })
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to activate account: ${error.message}`, 500)
  }
}