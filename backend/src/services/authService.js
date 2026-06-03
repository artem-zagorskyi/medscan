import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import prisma from '../config/prisma.js'
import { AppError } from '../errors/AppError.js'

const PEPPER = process.env.PEPPER_SECRET
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'
const SALT_ROUNDS = 12

// Register — create Person + Account in a single transaction
// Used by admin to register new doctors or staff
export const register = async (data) => {
  try {
    const {
      // Person fields
      last_name,
      first_name,
      middle_name,
      birth_date,
      gender,
      contact_info,
      role,
      // Account fields
      email,
      password,
      rights,
      // Doctor fields
      specialization
    } = data

    // Check if account with this email already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    })

    if (existingAccount) {
      throw new AppError(`Account with email ${email} already exists`, 400)
    }

    if (role === 'DOCTOR' && !specialization) {
      throw new AppError('Specialization is required for DOCTOR role', 400)
    }

    // Hash password with pepper before saving
    const hashedPassword = await bcrypt.hash(password + PEPPER, SALT_ROUNDS)

    // Create Person, Account (and Doctor if needed) in a single transaction
    // If one fails — all are rolled back
    const result = await prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
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

      const account = await tx.account.create({
        data: {
          person_id: person.id,
          email,
          password: hashedPassword,
          rights: rights ?? 'USER'
        }
      })

      // Якщо роль DOCTOR — створюємо запис лікаря
      let doctor = null
      if (role === 'DOCTOR') {
        doctor = await tx.doctor.create({
          data: {
            person_id: person.id,
            specialization
          }
        })
      }

      return { person, account, doctor }
    })

    // Build JWT payload
    const payload = {
      account_id: result.account.id,
      person_id: result.person.id,
      email: result.account.email,
      rights: result.account.rights,
      role: result.person.role
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    return {
      token,
      account_id: result.account.id,
      person_id: result.person.id,
      email: result.account.email,
      rights: result.account.rights,
      role: result.person.role,
      doctor_id: result.doctor?.id ?? null
    }
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Registration failed: ${error.message}`, 500)
  }
}

// Login — verify credentials and return JWT token
export const login = async (email, password) => {
  try {
    const account = await prisma.account.findUnique({
      where: { email },
      include: { person: true }
    })

    if (!account) {
      throw new AppError('Invalid email or password', 401)
    }

    const isMatch = await bcrypt.compare(password + PEPPER, account.password)

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401)
    }

    if (!account.is_active) {
      throw new AppError('Обліковий запис деактивовано. Зверніться до адміністратора.', 403)
    }

    const payload = {
      account_id: account.id,
      person_id: account.person_id,
      email: account.email,
      rights: account.rights,
      role: account.person.role
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    return {
      token,
      account_id: account.id,
      person_id: account.person_id,
      email: account.email,
      rights: account.rights,
      role: account.person.role
    }
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Login failed: ${error.message}`, 500)
  }
}

// Verify JWT token and return decoded payload
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new AppError(`Invalid or expired token: ${error.message}`, 401)
  }
}

// Get current user by person id from token
export const me = async (personId) => {
  try {
    const account = await prisma.account.findUnique({
      where: { person_id: personId },
      include: { person: true }
    })

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    // Return account info without password
    const { password, ...accountWithoutPassword } = account

    return accountWithoutPassword
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to fetch current user: ${error.message}`, 500)
  }
}

// Change password — used when user is already logged in
export const changePassword = async (personId, data) => {
  try {
    const { old_password, new_password } = data

    const account = await prisma.account.findUnique({
      where: { person_id: personId }
    })

    if (!account) {
      throw new AppError('Account not found', 404)
    }

    const isMatch = await bcrypt.compare(old_password + PEPPER, account.password)

    if (!isMatch) {
      throw new AppError('Old password is incorrect', 400)
    }

    const hashedPassword = await bcrypt.hash(new_password + PEPPER, SALT_ROUNDS)

    await prisma.account.update({
      where: { person_id: personId },
      data: { password: hashedPassword }
    })

    return { message: 'Password changed successfully' }
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(`Failed to change password: ${error.message}`, 500)
  }
}