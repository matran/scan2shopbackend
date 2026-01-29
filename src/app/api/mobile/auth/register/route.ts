import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone } = body

    if (!email || !password || !firstName || !lastName) {
      return errorResponse('All fields are required')
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return errorResponse('User already exists')
    }

    // Create user
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
      },
    })

    const token = generateToken(user.id, user.email)

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          points: user.points,
        },
        token,
      },
      'User registered successfully'
    )
  } catch (error) {
    console.error('Registration error:', error)
    return errorResponse('Registration failed', 500)
  }
}
