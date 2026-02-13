import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// POST - Cancel an order
export async function POST(
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

    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: user.userId,
      },
      include: {
        payments: true,
      },
    })

    if (!order) {
      return errorResponse('Order not found', 404)
    }

    // Check if order can be cancelled
    if (order.status === 'CANCELLED') {
      return errorResponse('Order is already cancelled')
    }

    if (order.status === 'COMPLETED') {
      return errorResponse('Cannot cancel a completed order')
    }

    // Check if payment was successful
    const hasSuccessfulPayment = order.payments.some(
      (payment) => payment.status === 'COMPLETED'
    )

    if (hasSuccessfulPayment && order.status === 'PROCESSING') {
      return errorResponse(
        'Cannot cancel order that is being processed. Please contact support.'
      )
    }

    // Update order status to cancelled
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: 'CANCELLED',
      },
    })

    return successResponse(
      {
        order: updatedOrder,
      },
      'Order cancelled successfully'
    )
  } catch (error: any) {
    console.error('Cancel order error:', error)
    return errorResponse(error.message || 'Failed to cancel order', 500)
  }
}