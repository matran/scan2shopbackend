import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _count: {
          productId: true,
        },
        orderBy: {
          _count: {
            productId: 'desc',
          },
        },
        take: 5,
      }),
    ])

    // Get product details for top products
    const topProductIds = topProducts.map((item: typeof topProducts[number]) => item.productId)
    const productDetails = await prisma.product.findMany({
      where: {
        id: { in: topProductIds },
      },
    })

    const topProductsWithDetails = topProducts.map((item: typeof topProducts[number]) => {
      const product = productDetails.find((p: typeof productDetails[number]) => p.id === item.productId)
      return {
        product,
        count: item._count.productId,
      }
    })

    return successResponse({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
      },
      recentOrders,
      topProducts: topProductsWithDetails,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return errorResponse('Failed to fetch analytics', 500)
  }
}