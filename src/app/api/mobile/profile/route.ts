import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        points: true,
        createdAt: true,
      },
    })

    if (!profile) {
      return errorResponse('User not found', 404)
    }

    return successResponse(profile)
  } catch (error) {
    console.error('Get profile error:', error)
    return errorResponse('Failed to fetch profile', 500)
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { firstName, lastName, phone } = body

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        points: true,
      },
    })

    return successResponse(updated, 'Profile updated successfully')
  } catch (error) {
    console.error('Update profile error:', error)
    return errorResponse('Failed to update profile', 500)
  }
}