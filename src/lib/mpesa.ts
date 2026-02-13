
// ============================================
// lib/mpesa.ts - M-Pesa Utility Functions
// ============================================
import axios from 'axios'

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ''
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ''
const MPESA_PASSKEY = process.env.MPESA_PASSKEY || ''
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || ''
const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || ''
const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox' // 'sandbox' or 'production'

const MPESA_BASE_URL = 
  MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

export interface MpesaAccessTokenResponse {
  access_token: string
  expires_in: string
}

export interface StkPushRequest {
  amount: number
  phoneNumber: string
  accountReference: string
  transactionDesc: string
}

export interface StkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

// Generate M-Pesa access token
export async function getMpesaAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64')
    
    const response = await axios.get<MpesaAccessTokenResponse>(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    )

    return response.data.access_token
  } catch (error: any) {
    console.error('M-Pesa token error:', error.response?.data || error.message)
    throw new Error('Failed to get M-Pesa access token')
  }
}

// Generate M-Pesa password
export function generateMpesaPassword(timestamp: string): string {
  const data = MPESA_SHORTCODE + MPESA_PASSKEY + timestamp
  return Buffer.from(data).toString('base64')
}

// Generate timestamp in format YYYYMMDDHHmmss
export function generateTimestamp(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`
}

// Format phone number to 254XXXXXXXXX
export function formatPhoneNumber(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/[\s\-\+]/g, '')
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1)
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned
  }
  
  return cleaned
}

// Initiate STK Push
export async function initiateStkPush(data: StkPushRequest): Promise<StkPushResponse> {
  try {
    const accessToken = await getMpesaAccessToken()
    const timestamp = generateTimestamp()
    const password = generateMpesaPassword(timestamp)
    const formattedPhone = formatPhoneNumber(data.phoneNumber)

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(data.amount), // M-Pesa requires integer
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: data.accountReference,
      TransactionDesc: data.transactionDesc,
    }

    const response = await axios.post<StkPushResponse>(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('STK Push error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.errorMessage || 'Failed to initiate STK Push')
  }
}

// Query STK Push status
export async function queryStkPushStatus(checkoutRequestId: string): Promise<any> {
  try {
    const accessToken = await getMpesaAccessToken()
    const timestamp = generateTimestamp()
    const password = generateMpesaPassword(timestamp)

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error: any) {
    console.error('STK Query error:', error.response?.data || error.message)
    throw new Error('Failed to query STK Push status')
  }
}