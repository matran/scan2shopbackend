import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    
    if (!user) {
      return unauthorizedResponse()
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        points: true,
      },
    })

    if (!userData) {
      return errorResponse('User not found', 404)
    }

    return successResponse(userData)
  } catch (error) {
    console.error('Get current user error:', error)
    return errorResponse('Failed to fetch user', 500)
  }
}