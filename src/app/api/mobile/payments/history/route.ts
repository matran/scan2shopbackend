import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          phoneNumber: true,
          status: true,
          mpesaReceiptNumber: true,
          createdAt: true,
          completedAt: true,
          orderId: true,
        },
      }),
      prisma.payment.count({
        where: { userId: user.userId },
      }),
    ])

    return successResponse({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('Get payment history error:', error)
    return errorResponse('Failed to get payment history', 500)
  }
}
