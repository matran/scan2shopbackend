import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// GET - Get all products
export async function GET(request: NextRequest) {
  try {
    // const user = getUserFromRequest(request)
    // if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')

    const skip = (page - 1) * limit

    let where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
      ]
    }
    if (category) {
      where.category = category
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return successResponse({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get products error:', error)
    return errorResponse('Failed to fetch products', 500)
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
   // const user = getUserFromRequest(request)
   // if (!user) return unauthorizedResponse()

    const body = await request.json()
    const {
      barcode,
      name,
      description,
      price,
      category,
      imageUrl,
      location,
      inStock,
      stockQuantity,
    } = body

    if (!barcode || !name || !price || !category) {
      return errorResponse('Required fields: barcode, name, price, category')
    }

    // Check if barcode exists
    const existing = await prisma.product.findUnique({
      where: { barcode },
    })

    if (existing) {
      return errorResponse('Product with this barcode already exists')
    }

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        location,
        inStock: inStock ?? true,
        stockQuantity: parseInt(stockQuantity) || 0,
      },
    })

    return successResponse(product, 'Product created successfully')
  } catch (error) {
    console.error('Create product error:', error)
    return errorResponse('Failed to create product', 500)
  }
}