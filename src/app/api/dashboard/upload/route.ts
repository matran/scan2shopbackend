import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getUserFromRequest } from '@/lib/auth'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // const user = getUserFromRequest(request)
    // if (!user) return unauthorizedResponse()

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return errorResponse('No file uploaded')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return errorResponse('Only image files are allowed')
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return errorResponse('File size must be less than 5MB')
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${originalName}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public/uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (err) {
      // Directory might already exist
    }

    const filepath = path.join(uploadsDir, filename)

    // Save file
    await writeFile(filepath, buffer)

    // Return URL
    const url = `/uploads/${filename}`
    
    console.log('File uploaded successfully:', url) // Debug log
    
    return successResponse({ url }, 'File uploaded successfully')
  } catch (error) {
    console.error('Upload error:', error)
    return errorResponse('Failed to upload file', 500)
  }
}