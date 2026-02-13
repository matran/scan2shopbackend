import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const { paymentId } = await params
    const paymentIdNumber = Number(paymentId)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentIdNumber},
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    })

    if (!payment) {
      return errorResponse('Payment not found', 404)
    }

    if (payment.userId !== user.userId) {
      return unauthorizedResponse()
    }

    return successResponse({ payment })
  } catch (error: any) {
    console.error('Get payment details error:', error)
    return errorResponse('Failed to get payment details', 500)
  }
}