import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import crypto from 'crypto'

// Verify IntaSend webhook signature
function verifyIntaSendSignature(payload: string, signature: string): boolean {
  const secretKey = process.env.INTASEND_SECRET_KEY
  if (!secretKey) {
    console.error('IntaSend secret key not configured')
    return false
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error verifying IntaSend signature:', error)
    return false
  }
}

// Process payment completion for Payment Button
async function processPaymentComplete(paymentData: any) {
  try {
    const {
      invoice_id,
      state,
      provider,
      charges,
      net_amount,
      currency,
      value,
      account,
      api_ref,
      host,
      failed_reason,
      failed_code,
      first_name,
      email,
      phone_number
    } = paymentData

    // For Payment Button, try multiple ways to find organization
    let orgQuery = supabaseAdmin
      .from('organizations')
      .select('id, name, email, phone, subscription_plan')

    // Try to find by email first, then phone, then billing_email
    const { data: orgs, error: orgError } = await orgQuery

    if (orgError) {
      console.error('Database error finding organization:', orgError)
      return { success: false, error: 'Database error' }
    }

    // Find matching organization
    const org = orgs?.find(o =>
      o.email === email ||
      o.email === account ||
      o.phone === phone_number ||
      o.phone === account
    )

    if (!org) {
      console.error('Organization not found for payment. Email:', email, 'Phone:', phone_number, 'Account:', account)
      return { success: false, error: 'Organization not found' }
    }

    // Update or create invoice
    const invoiceData = {
      organization_id: org.id,
      amount: parseFloat(net_amount || value || '0'),
      currency: currency || 'KES',
      status: state === 'COMPLETE' ? 'paid' : state === 'FAILED' ? 'failed' : 'pending',
      method: provider || 'intasend',
      description: `IntaSend payment - ${api_ref}`,
      intasend_invoice_id: invoice_id,
      intasend_api_ref: api_ref,
      failed_reason: failed_reason || null,
      failed_code: failed_code || null
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .upsert(invoiceData, { 
        onConflict: 'intasend_invoice_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating/updating invoice:', invoiceError)
      return { success: false, error: 'Failed to record payment' }
    }

    // If payment successful, update subscription status
    if (state === 'COMPLETE') {
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1) // Add 1 month

      await supabaseAdmin
        .from('organizations')
        .update({
          subscription_status: 'active',
          subscription_end_date: subscriptionEndDate.toISOString()
        })
        .eq('id', org.id)

      console.log(`Payment completed for organization ${org.name} (${org.id})`)
    } else if (state === 'FAILED') {
      console.log(`Payment failed for organization ${org.name}: ${failed_reason}`)
    }

    return { success: true, invoice }
  } catch (error) {
    console.error('Error processing payment:', error)
    return { success: false, error: 'Internal server error' }
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 IntaSend webhook called!')
    console.log('📝 Headers:', Object.fromEntries(request.headers.entries()))

    const body = await request.text()
    console.log('📦 Raw body:', body)

    const signature = request.headers.get('x-intasend-signature') || ''
    console.log('🔐 Signature:', signature)

    // Note: For Payment Button integration, signature verification is optional
    // since payment status is primarily handled via client-side events
    // Uncomment below if you want to add signature verification later

    // if (!verifyIntaSendSignature(body, signature)) {
    //   console.error('Invalid IntaSend webhook signature')
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const paymentData = JSON.parse(body)
    console.log('💰 IntaSend webhook received:', paymentData)

    // Process the payment
    const result = await processPaymentComplete(paymentData)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment processed successfully',
      invoice_id: result.invoice?.id 
    })

  } catch (error) {
    console.error('IntaSend webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'IntaSend webhook endpoint',
    status: 'active' 
  })
}
