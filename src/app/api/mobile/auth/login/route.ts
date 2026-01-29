import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return errorResponse('Email and password are required')
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return errorResponse('Invalid credentials', 401)
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return errorResponse('Invalid credentials', 401)
    }

    const token = generateToken(user.id, user.email)

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        points: user.points,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Login failed', 500)
  }
}