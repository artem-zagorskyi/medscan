import prisma from '../config/prisma.js'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

// Pepper is a server-wide secret stored in .env
// It is added to the password before hashing for extra security
// Even if the database is leaked, attacker still needs the pepper
const PEPPER = process.env.PEPPER_SECRET

// Get account by person id
export const getByPersonId = async (personId) => {
  try {
    const account = await prisma.account.findUnique({
      where: { person_id: personId }
    })

    if (!account) {
      throw new Error(`Account with person_id ${personId} not found`)
    }

    return account
  } catch (error) {
    throw new Error(`Failed to fetch account: ${error.message}`)
  }
}

// Get account by email
export const getByEmail = async (email) => {
  try {
    const account = await prisma.account.findUnique({
      where: { email }
    })

    if (!account) {
      throw new Error(`Account with email ${email} not found`)
    }

    return account
  } catch (error) {
    throw new Error(`Failed to fetch account by email: ${error.message}`)
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
      throw new Error(`Account with email ${email} already exists`)
    }

    // Add pepper to password before hashing
    // bcrypt automatically generates and stores a unique salt inside the hash
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
    throw new Error(`Failed to create account: ${error.message}`)
  }
}

// Update account password
export const updatePassword = async (personId, data) => {
  try {
    const { old_password, new_password } = data

    // Check if account exists
    const account = await getByPersonId(personId)

    // Verify old password with pepper before allowing update
    const isMatch = await bcrypt.compare(old_password + PEPPER, account.password)

    if (!isMatch) {
      throw new Error('Old password is incorrect')
    }

    // Hash new password with pepper before saving
    const hashedPassword = await bcrypt.hash(new_password + PEPPER, SALT_ROUNDS)

    return await prisma.account.update({
      where: { person_id: personId },
      data: { password: hashedPassword }
    })
  } catch (error) {
    throw new Error(`Failed to update password: ${error.message}`)
  }
}

// Update account rights (USER / ADMIN)
export const updateRights = async (personId, rights) => {
  try {
    // Check if account exists before updating
    await getByPersonId(personId)

    return await prisma.account.update({
      where: { person_id: personId },
      data: { rights }
    })
  } catch (error) {
    throw new Error(`Failed to update rights: ${error.message}`)
  }
}

// Delete account by person id
export const remove = async (personId) => {
  try {
    // Check if account exists before deleting
    await getByPersonId(personId)

    return await prisma.account.delete({
      where: { person_id: personId }
    })
  } catch (error) {
    throw new Error(`Failed to delete account: ${error.message}`)
  }
}