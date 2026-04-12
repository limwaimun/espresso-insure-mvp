import { createClient } from '@/lib/supabase/server'

export type TrialStatus = 'active_trial' | 'expired_trial' | 'paying'

export interface TrialStatusResult {
  status: TrialStatus
  daysLeft?: number
  trialEndsAt?: string
  subscriptionStatus?: string
}

/**
 * Check an IFA's trial/subscription status
 * Returns one of three states:
 * - "active_trial" — trial still running, Maya works
 * - "expired_trial" — trial over, no subscription, Maya stops
 * - "paying" — has Stripe subscription, Maya always works
 */
export async function checkTrialStatus(userId?: string): Promise<TrialStatusResult> {
  const supabase = await createClient()
  
  // If no userId provided, try to get current user
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('No user authenticated')
    }
    targetUserId = user.id
  }

  // Get user profile with subscription info
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('subscription_status, trial_ends_at, stripe_customer_id')
    .eq('id', targetUserId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    throw new Error('Failed to fetch user profile')
  }

  // Check subscription status first
  if (userProfile.subscription_status === 'active' || userProfile.subscription_status === 'trialing') {
    return {
      status: 'paying',
      subscriptionStatus: userProfile.subscription_status,
    }
  }

  // Check trial status
  if (userProfile.trial_ends_at) {
    const trialEndsAt = new Date(userProfile.trial_ends_at)
    const now = new Date()
    
    if (trialEndsAt > now) {
      // Trial is still active
      const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        status: 'active_trial',
        daysLeft,
        trialEndsAt: userProfile.trial_ends_at,
        subscriptionStatus: userProfile.subscription_status,
      }
    } else {
      // Trial has expired
      return {
        status: 'expired_trial',
        trialEndsAt: userProfile.trial_ends_at,
        subscriptionStatus: userProfile.subscription_status,
      }
    }
  }

  // No trial end date found - treat as expired
  return {
    status: 'expired_trial',
    subscriptionStatus: userProfile.subscription_status,
  }
}

/**
 * Helper to check if Maya should process messages for a user
 */
export async function canMayaProcessMessages(userId?: string): Promise<boolean> {
  try {
    const { status } = await checkTrialStatus(userId)
    return status === 'active_trial' || status === 'paying'
  } catch (error) {
    console.error('Error checking Maya permissions:', error)
    return false
  }
}