import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { cartItems, totalAmount, deliveryAddress, paymentMethod } = body

    // Validate required fields
    if (!cartItems || cartItems.length === 0) {
      return errorResponse('Cart items are required')
    }

    if (!totalAmount || totalAmount <= 0) {
      return errorResponse('Invalid total amount')
    }

    if (!deliveryAddress) {
      return errorResponse('Delivery address is required')
    }

    // Validate cart items structure
    for (const item of cartItems) {
      if (!item.productId || !item.quantity || !item.price) {
        return errorResponse('Invalid cart item structure')
      }
    }

    // Create order with order items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: user.userId,
          totalAmount,
          status: 'PENDING',
          paymentMethod: paymentMethod || 'M-PESA',
          deliveryAddress,
          orderItems: {
            create: cartItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      })

      return newOrder
    })

    return successResponse(
      {
        orderId: order.id,
        order: {
          id: order.id,
          userId: order.userId,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          deliveryAddress: order.deliveryAddress,
          createdAt: order.createdAt,
          orderItems: order.orderItems,
        },
      },
      'Order created successfully'
    )
  } catch (error: any) {
    console.error('Create order error:', error)
    return errorResponse(error.message || 'Failed to create order', 500)
  }
}