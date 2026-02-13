import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'
import { queryStkPushStatus } from '@/lib/mpesa'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ checkoutRequestId: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const { checkoutRequestId } = await params

    // Get payment from database
    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId },
    })

    if (!payment) {
      return errorResponse('Payment not found', 404)
    }

    // Check if payment already completed/failed
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      return successResponse({
        status: payment.status,
        message: payment.status === 'COMPLETED' 
          ? 'Payment completed successfully' 
          : 'Payment failed',
        payment: {
          id: payment.id,
          amount: payment.amount,
          phoneNumber: payment.phoneNumber,
          mpesaReceiptNumber: payment.mpesaReceiptNumber,
          status: payment.status,
          completedAt: payment.completedAt,
        },
        failureReason: payment.failureReason,
      })
    }

    // Query M-Pesa API for status
    try {
      const mpesaResponse = await queryStkPushStatus(checkoutRequestId)

      // Parse M-Pesa response
      const resultCode = mpesaResponse.ResultCode
      const resultDesc = mpesaResponse.ResultDesc

      if (resultCode === '0') {
        // Payment successful
        const callbackMetadata = mpesaResponse.CallbackMetadata?.Item || []
        const receiptNumber = callbackMetadata.find(
          (item: any) => item.Name === 'MpesaReceiptNumber'
        )?.Value

        // Update payment in database
        await prisma.payment.update({
          where: { checkoutRequestId },
          data: {
            status: 'COMPLETED',
            mpesaReceiptNumber: receiptNumber,
            completedAt: new Date(),
          },
        })

        return successResponse({
          status: 'COMPLETED',
          message: 'Payment completed successfully',
          payment: {
            id: payment.id,
            amount: payment.amount,
            phoneNumber: payment.phoneNumber,
            mpesaReceiptNumber: receiptNumber,
            status: 'COMPLETED',
          },
        })
      } else if (resultCode === '1032') {
        // User cancelled
        await prisma.payment.update({
          where: { checkoutRequestId },
          data: {
            status: 'CANCELLED',
            failureReason: resultDesc,
          },
        })

        return successResponse({
          status: 'CANCELLED',
          message: 'Payment cancelled by user',
          failureReason: resultDesc,
        })
      } else if (resultCode !== '1037') {
        // Failed (but not timeout)
        await prisma.payment.update({
          where: { checkoutRequestId },
          data: {
            status: 'FAILED',
            failureReason: resultDesc,
          },
        })

        return successResponse({
          status: 'FAILED',
          message: 'Payment failed',
          failureReason: resultDesc,
        })
      } else {
        // Still pending (1037 = timeout/still processing)
        return successResponse({
          status: 'PENDING',
          message: 'Payment still pending',
        })
      }
    } catch (mpesaError: any) {
      // M-Pesa query failed, but payment might still be pending
      console.error('M-Pesa query error:', mpesaError)
      
      return successResponse({
        status: 'PENDING',
        message: 'Payment status check in progress',
      })
    }
  } catch (error: any) {
    console.error('Verify payment error:', error)
    return errorResponse(error.message || 'Failed to verify payment', 500)
  }
}