import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2))

    const stkCallback = body.Body?.stkCallback

    if (!stkCallback) {
      return successResponse({ message: 'Invalid callback data' })
    }

    const merchantRequestId = stkCallback.MerchantRequestID
    const checkoutRequestId = stkCallback.CheckoutRequestID
    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc

    // Find payment by checkoutRequestId
    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId },
    })

    if (!payment) {
      console.error('Payment not found:', checkoutRequestId)
      return successResponse({ message: 'Payment not found' })
    }

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
      
      const amount = callbackMetadata.find(
        (item: any) => item.Name === 'Amount'
      )?.Value
      
      const mpesaReceiptNumber = callbackMetadata.find(
        (item: any) => item.Name === 'MpesaReceiptNumber'
      )?.Value
      
      const transactionDate = callbackMetadata.find(
        (item: any) => item.Name === 'TransactionDate'
      )?.Value
      
      const phoneNumber = callbackMetadata.find(
        (item: any) => item.Name === 'PhoneNumber'
      )?.Value

      // Update payment status
      await prisma.payment.update({
        where: { checkoutRequestId },
        data: {
          status: 'COMPLETED',
          mpesaReceiptNumber,
          completedAt: new Date(),
        },
      })

      // Update order status if linked
      if (payment.orderId) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'PROCESSING' },
        })
      }

      console.log('Payment completed:', {
        checkoutRequestId,
        mpesaReceiptNumber,
        amount,
      })
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { checkoutRequestId },
        data: {
          status: 'FAILED',
          failureReason: resultDesc,
        },
      })

      console.log('Payment failed:', {
        checkoutRequestId,
        resultCode,
        resultDesc,
      })
    }

    return successResponse({ message: 'Callback processed successfully' })
  } catch (error: any) {
    console.error('Callback processing error:', error)
    // Always return success to M-Pesa to avoid retries
    return successResponse({ message: 'Callback received' })
  }
}
