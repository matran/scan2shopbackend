import { NextResponse } from 'next/server'

export function successResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    message: message || 'Success',
    data,
  })
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status }
  )
}

export function unauthorizedResponse() {
  return errorResponse('Unauthorized', 401)
}