import { NextRequest, NextResponse } from 'next/server'
import { checkTrialStatus } from '@/lib/trial-status'

export async function GET(request: NextRequest) {
  try {
    const { status, daysLeft, trialEndsAt, subscriptionStatus } = await checkTrialStatus()
    
    return NextResponse.json({
      status,
      daysLeft,
      trialEndsAt,
      subscriptionStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Trial status check error:', error)
    
    // If user is not authenticated, return 401
    if (error instanceof Error && error.message === 'No user authenticated') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to check trial status' },
      { status: 500 }
    )
  }
}