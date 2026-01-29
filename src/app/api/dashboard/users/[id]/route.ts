import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const foundUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!foundUser) {
      return errorResponse('User not found', 404)
    }

    return successResponse(foundUser)
  } catch (error) {
    console.error('Get user error:', error)
    return errorResponse('Failed to fetch user', 500)
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { email, password, firstName, lastName, phone, role, points } = body

    let updateData: any = {
      email: email || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      role: role || undefined,
      points: points !== undefined ? parseInt(points) : undefined,
    }

    // Only update password if provided
    if (password) {
      updateData.password = await hashPassword(password)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        points: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return successResponse(updatedUser, 'User updated successfully')
  } catch (error) {
    console.error('Update user error:', error)
    return errorResponse('Failed to update user', 500)
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    await prisma.user.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'User deleted successfully')
  } catch (error) {
    console.error('Delete user error:', error)
    return errorResponse('Failed to delete user', 500)
  }
}