import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: number } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return errorResponse('Product not found', 404)
    }

    return successResponse(product)
  } catch (error) {
    console.error('Get product error:', error)
    return errorResponse('Failed to fetch product', 500)
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: number } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

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

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        barcode: barcode || undefined,
        name: name || undefined,
        description: description || undefined,
        price: price ? parseFloat(price) : undefined,
        category: category || undefined,
        imageUrl: imageUrl || undefined,
        location: location || undefined,
        inStock: inStock !== undefined ? inStock : undefined,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : undefined,
      },
    })

    return successResponse(product, 'Product updated successfully')
  } catch (error) {
    console.error('Update product error:', error)
    return errorResponse('Failed to update product', 500)
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: number } }
) {
  try {
    const user = getUserFromRequest(request)
    if (!user) return unauthorizedResponse()

    await prisma.product.delete({
      where: { id: params.id },
    })

    return successResponse(null, 'Product deleted successfully')
  } catch (error) {
    console.error('Delete product error:', error)
    return errorResponse('Failed to delete product', 500)
  }
}
