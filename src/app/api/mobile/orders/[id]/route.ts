import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// GET - Get order details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return errorResponse('Invalid order ID')
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: user.userId, // Ensure user can only access their own orders
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    })

    if (!order) {
      return errorResponse('Order not found', 404)
    }

    return successResponse({ order })
  } catch (error: any) {
    console.error('Get order error:', error)
    return errorResponse(error.message || 'Failed to fetch order', 500)
  }
}