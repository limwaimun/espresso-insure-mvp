import { NextRequest, NextResponse } from 'next/server'
import { canMayaProcessMessages } from '@/lib/trial-status'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract WhatsApp message details
    const { from, text, timestamp } = body
    
    if (!from) {
      return NextResponse.json({ error: 'Missing sender information' }, { status: 400 })
    }
    
    // TODO: Extract IFA ID from WhatsApp number
    // This will be implemented once we have the 360dialog API integration
    // For now, we'll use a placeholder logic
    const ifaId = await getIfaIdFromWhatsAppNumber(from)
    
    if (!ifaId) {
      // IFA not found in our system
      // TODO: Send "You're not registered" message via 360dialog API
      return NextResponse.json({ 
        processed: false, 
        reason: 'IFA not found' 
      })
    }
    
    // Check trial status
    const canProcess = await canMayaProcessMessages(ifaId)
    
    if (!canProcess) {
      // Trial expired or no active subscription
      // TODO: Send upgrade message via 360dialog API
      const upgradeMessage = `Your Espresso trial has ended. To continue using Maya, please upgrade your account at ${process.env.NEXT_PUBLIC_APP_URL}/upgrade`
      
      // TODO: Call 360dialog API to send message
      // await sendWhatsAppMessage(from, upgradeMessage)
      
      console.log(`Trial expired for IFA ${ifaId}. Would send: ${upgradeMessage}`)
      
      return NextResponse.json({ 
        processed: false, 
        reason: 'Trial expired',
        messageSent: upgradeMessage
      })
    }
    
    // Trial is active or user is paying - process the message
    // TODO: Forward to Maya's message processing system
    // await processMessageWithMaya(ifaId, text)
    
    console.log(`Message from ${ifaId} processed by Maya: "${text}"`)
    
    return NextResponse.json({ 
      processed: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * TODO: Implement once 360dialog API is available
 * Extract IFA ID from WhatsApp number
 */
async function getIfaIdFromWhatsAppNumber(whatsappNumber: string): Promise<string | null> {
  // Placeholder logic - will be replaced with actual database lookup
  // This should query the users table by whatsapp column
  
  // For now, return a placeholder
  return 'placeholder-ifa-id'
}

/**
 * TODO: Implement once 360dialog API is available
 * Send WhatsApp message via 360dialog
 */
async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  // Placeholder - will be implemented with 360dialog API
  console.log(`Would send WhatsApp to ${to}: ${message}`)
}

/**
 * TODO: Implement once Maya processing is available
 * Process message with Maya AI
 */
async function processMessageWithMaya(ifaId: string, message: string): Promise<void> {
  // Placeholder - will be implemented with Maya's AI processing
  console.log(`Maya processing for ${ifaId}: ${message}`)
}