import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'
import { initiateStkPush, formatPhoneNumber } from '@/lib/mpesa'

export async function POST(request: NextRequest) {
  try {
    // ✅ Get authenticated user
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const body = await request.json()
    const { amount, phoneNumber, orderId, description } = body

    // Validate required fields
    if (!amount || !phoneNumber) {
      return errorResponse('Amount and phone number are required')
    }

    // Validate amount
    if (amount < 1) {
      return errorResponse('Amount must be at least KSh 1')
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber)

    // Validate Kenyan phone number
    if (!formattedPhone.match(/^254[17]\d{8}$/)) {
      return errorResponse('Invalid Kenyan phone number')
    }

    // Validate orderId if provided
    if (orderId) {
      const orderExists = await prisma.order.findUnique({
        where: { 
          id: parseInt(orderId),
          userId: user.userId, // ✅ Ensure user owns the order
        }
      })
      if (!orderExists) {
        return errorResponse('Invalid order ID or order does not belong to you')
      }
    }

    // Initiate STK Push
    const stkResponse = await initiateStkPush({
      amount,
      phoneNumber: formattedPhone,
      accountReference: orderId ? `ORDER-${orderId}` : `TEST-${Date.now()}`,
      transactionDesc: description || (orderId ? `Payment for Order #${orderId}` : 'Payment'),
    })

    // Check if STK Push was successful
    if (stkResponse.ResponseCode !== '0') {
      return errorResponse(
        stkResponse.CustomerMessage || 'Failed to initiate payment'
      )
    }

    // Save payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId: user.userId, // ✅ Use authenticated user ID
        ...(orderId && { orderId: parseInt(orderId) }), // ✅ Include orderId if provided
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        phoneNumber: formattedPhone,
        amount,
        status: 'PENDING',
      },
    })

    return successResponse(
      {
        paymentId: payment.id,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        message: stkResponse.CustomerMessage,
      },
      'Payment initiated successfully. Please check your phone.'
    )
  } catch (error: any) {
    console.error('Initiate payment error:', error)
    return errorResponse(error.message || 'Failed to initiate payment', 500)
  }
}