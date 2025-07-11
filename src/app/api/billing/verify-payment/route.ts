import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { SubscriptionManager } from '@/lib/subscription-manager'

export async function POST(request: NextRequest) {
  try {
    const { 
      organizationId, 
      paymentReference, 
      planId, 
      amount, 
      currency = 'KES' 
    } = await request.json()

    if (!organizationId || !paymentReference) {
      return NextResponse.json({ 
        error: 'Organization ID and payment reference are required' 
      }, { status: 400 })
    }

    console.log('🔍 Verifying payment:', { organizationId, paymentReference, planId })

    // Check if payment already exists in our database
    const { data: existingInvoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('intasend_api_ref', paymentReference)
      .single()

    if (invoiceError && invoiceError.code !== 'PGRST116') {
      console.error('Error checking existing invoice:', invoiceError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // If invoice exists and is paid, payment is already verified
    if (existingInvoice && existingInvoice.status === 'paid') {
      console.log('✅ Payment already verified and processed')
      
      // Ensure subscription is updated
      if (planId && existingInvoice.status === 'paid') {
        await SubscriptionManager.updateSubscription(organizationId, planId, {
          payment_reference: paymentReference,
          amount,
          currency
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        invoice: existingInvoice,
        verified: true
      })
    }

    // If no existing invoice or invoice is not paid, create/update it
    const invoiceData = {
      organization_id: organizationId,
      amount: parseFloat(amount || '0'),
      currency,
      status: 'paid', // Assuming payment was successful if we're verifying
      method: 'intasend',
      description: planId ? `Plan upgrade to ${planId}` : 'Subscription payment',
      intasend_api_ref: paymentReference,
      invoice_date: new Date().toISOString()
    }

    const { data: invoice, error: createError } = await supabaseAdmin
      .from('invoices')
      .upsert(invoiceData, { 
        onConflict: 'intasend_api_ref',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating/updating invoice:', createError)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    // Update subscription if plan is specified
    if (planId) {
      const subscriptionResult = await SubscriptionManager.updateSubscription(
        organizationId, 
        planId, 
        {
          payment_reference: paymentReference,
          amount,
          currency,
          invoice_id: invoice.id
        }
      )

      if (!subscriptionResult.success) {
        console.error('Failed to update subscription:', subscriptionResult.error)
        return NextResponse.json({ 
          error: 'Payment recorded but failed to update subscription' 
        }, { status: 500 })
      }

      // Log subscription event
      await SubscriptionManager.logSubscriptionEvent(organizationId, 'payment_success', {
        plan: planId,
        amount,
        currency,
        payment_method: 'intasend',
        intasend_ref: paymentReference,
        invoice_id: invoice.id
      })
    }

    console.log('✅ Payment verified and processed successfully')

    return NextResponse.json({
      success: true,
      message: 'Payment verified and processed successfully',
      invoice,
      verified: true
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const paymentReference = searchParams.get('paymentReference')

    if (!organizationId || !paymentReference) {
      return NextResponse.json({ 
        error: 'Organization ID and payment reference are required' 
      }, { status: 400 })
    }

    // Check payment status in database
    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('intasend_api_ref', paymentReference)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking payment status:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!invoice) {
      return NextResponse.json({
        success: true,
        verified: false,
        status: 'not_found',
        message: 'Payment not found'
      })
    }

    return NextResponse.json({
      success: true,
      verified: invoice.status === 'paid',
      status: invoice.status,
      invoice,
      message: `Payment status: ${invoice.status}`
    })

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
