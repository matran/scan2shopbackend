import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest, hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// GET - Get all users
export async function GET(request: NextRequest) {
  try {
   // const user = getUserFromRequest(request)
   // if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role')

    const skip = (page - 1) * limit

    let where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
      ]
    }
    if (role) {
      where.role = role
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.user.count({ where }),
    ])

    return successResponse({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get users error:', error)
    return errorResponse('Failed to fetch users', 500)
  }
}

// POST - Create user
export async function POST(request: NextRequest) {
  try {
   // const user = getUserFromRequest(request)
   // if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { email, password, firstName, lastName, phone, role, points } = body

    if (!email || !password || !firstName || !lastName) {
      return errorResponse('Required fields: email, password, firstName, lastName')
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return errorResponse('User with this email already exists')
    }

    const hashedPassword = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role: role || 'CUSTOMER',
        points: points || 0,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        points: true,
        createdAt: true,
      },
    })

    return successResponse(newUser, 'User created successfully')
  } catch (error) {
    console.error('Create user error:', error)
    return errorResponse('Failed to create user', 500)
  }
}
