import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// GET - Get user's order history with pagination
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return errorResponse('Invalid pagination parameters')
    }

    const skip = (page - 1) * limit

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: user.userId,
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  barcode: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
              mpesaReceiptNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: {
          userId: user.userId,
        },
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return successResponse({
      orders,
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error: any) {
    console.error('Get order history error:', error)
    return errorResponse(error.message || 'Failed to fetch order history', 500)
  }
}