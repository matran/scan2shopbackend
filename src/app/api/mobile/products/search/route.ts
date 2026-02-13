import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')

    let where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },      // Case-insensitive search
        { barcode: { contains: query, mode: 'insensitive' } },   // Case-insensitive search
      ],
    }

    if (category) {
      where.category = category
    }

    const products = await prisma.product.findMany({
      where,
      take: 50,
      orderBy: { name: 'asc' },
    })

    const productsData = products.map((p: typeof products[number]) => ({
      id: p.id,
      barcode: p.barcode,
      name: p.name,
      price: p.price,
      category: p.category,
      location: p.location,
      inStock: p.inStock,
      imageUrl: p.imageUrl,
    }))

    return successResponse(productsData)
  } catch (error) {
    console.error('Search products error:', error)
    return errorResponse('Failed to search products', 500)
  }
}