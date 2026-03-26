import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import prisma from '../config/prisma.js'

// Pepper must match the one used in account.service.js
const PEPPER = process.env.PEPPER_SECRET
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'

// Login — verify credentials and return JWT token
export const login = async (email, password) => {
  try {
    // Find account by email, include person data for the token payload
    const account = await prisma.account.findUnique({
      where: { email },
      include: {
        person: true
      }
    })

    if (!account) {
      throw new Error('Invalid email or password')
    }

    // Compare password with pepper against stored hash
    const isMatch = await bcrypt.compare(password + PEPPER, account.password)

    if (!isMatch) {
      throw new Error('Invalid email or password')
    }

    // Build JWT payload with useful info
    const payload = {
      account_id: account.id,
      person_id: account.person_id,
      email: account.email,
      rights: account.rights,
      role: account.person.role
    }

    // Sign and return the token
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
    throw new Error(`Login failed: ${error.message}`)
  }
}

// Verify JWT token and return decoded payload
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error.message}`)
  }
}

// Get current user by token payload
export const me = async (personId) => {
  try {
    const account = await prisma.account.findUnique({
      where: { person_id: personId },
      include: {
        person: true
      }
    })

    if (!account) {
      throw new Error('Account not found')
    }

    // Return account info without password
    const { password, ...accountWithoutPassword } = account

    return accountWithoutPassword
  } catch (error) {
    throw new Error(`Failed to fetch current user: ${error.message}`)
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
      throw new Error('Account not found')
    }

    // Verify old password with pepper
    const isMatch = await bcrypt.compare(old_password + PEPPER, account.password)

    if (!isMatch) {
      throw new Error('Old password is incorrect')
    }

    // Hash new password with pepper
    const hashedPassword = await bcrypt.hash(new_password + PEPPER, 12)

    await prisma.account.update({
      where: { person_id: personId },
      data: { password: hashedPassword }
    })

    return { message: 'Password changed successfully' }
  } catch (error) {
    throw new Error(`Failed to change password: ${error.message}`)
  }
}