import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
   // const user = getUserFromRequest(request)
   // if (!user) return unauthorizedResponse()

    const { barcode } = await params

    const product = await prisma.product.findUnique({
      where: { barcode: barcode },
    })

    if (!product) {
      return errorResponse('Product not found', 404)
    }

    return successResponse({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      location: product.location,
      inStock: product.inStock,
      imageUrl: product.imageUrl,
    })
  } catch (error) {
    console.error('Get product error:', error)
    return errorResponse('Failed to fetch product', 500)
  }
}