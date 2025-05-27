import { NextRequest, NextResponse } from 'next/server'

// ENDRE DETTE PASSORDET TIL DITT EGET!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'quiz2025admin'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ 
        success: true, 
        message: 'Innlogget' 
      })

      // Set secure cookie
      response.cookies.set('adminAuth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 // 7 days
      })

      return response
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Feil passord' 
      }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: 'Server feil' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const adminAuth = request.cookies.get('adminAuth')
  
  if (adminAuth?.value === 'true') {
    return NextResponse.json({ authenticated: true })
  } else {
    return NextResponse.json({ authenticated: false })
  }
}