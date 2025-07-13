'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState, ErrorState } from '@/components/LoadingState'
import { formatKES, formatDate } from '@/lib/utils'

// Add this at the top of the file to declare the module for TypeScript
// @ts-ignore: No types for intasend-inlinejs-sdk
// (Alternatively, add a .d.ts file in the project root)

// TypeScript declaration for window.IntaSend
declare global {
  interface Window {
    IntaSend?: any;
  }
}

const PLAN_CONFIG = {
  free: {
    id: 'free',
    name: 'Starter',
    price: 0,
    currency: 'KES',
    period: 'month',
    employees: 4,
    features: ['Basic dashboard', '2 check-ins per month', 'Email support'],
  },
  team: {
    id: 'team',
    name: 'Professional',
    price: 800,
    currency: 'KES',
    period: 'month',
    employees: 15,
    features: ['Advanced analytics', 'Weekly check-ins', 'AI insights', 'Priority support'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 2000,
    currency: 'KES',
    period: 'month',
    employees: 50,
    features: ['All features', 'Custom integrations', 'Dedicated support', 'Advanced security'],
  },
}

export default function Billing() {
  // All hooks at the top, before any return
  const paymentButtonRef = useRef<HTMLButtonElement | null>(null)
  const planUpgradeButtonRef = useRef<HTMLButtonElement | null>(null)
  const router = useRouter()
  const { profile } = useAuth()
  const [org, setOrg] = useState<any>(null)
  const [employeeCount, setEmployeeCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [errorPayments, setErrorPayments] = useState<string | null>(null)
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentInProgress, setPaymentInProgress] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [selectingPlan, setSelectingPlan] = useState<string | null>(null)
  const [selectPlanError, setSelectPlanError] = useState<string | null>(null)
  const [showPlanConfirm, setShowPlanConfirm] = useState(false)
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)
  const [bannerType, setBannerType] = useState<'success' | 'error' | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'verifying' | 'completed' | 'failed' | 'cancelled'>('idle')
  const [paymentWindowRef, setPaymentWindowRef] = useState<Window | null>(null)

  // ALL useEffect HOOKS MUST BE DECLARED HERE BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    async function fetchData() {
      if (!profile?.organization?.id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/billing?organizationId=${profile.organization.id}`)
        const result = await res.json()
        if (result.success) {
          setOrg(result.organization)
          setEmployeeCount(result.employeeCount || 0)
        } else {
          setError(result.error || 'Failed to fetch billing data')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch billing data')
      } finally {
        setLoading(false)
      }
    }
    if (profile?.organization?.id) {
      fetchData()
    }
  }, [profile?.organization?.id])

  useEffect(() => {
    async function fetchPaymentMethods() {
      if (!profile?.organization?.id) return
      setLoadingPayments(true)
      setErrorPayments(null)
      try {
        const res = await fetch(`/api/organization/payment-methods?organizationId=${profile.organization.id}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load payment methods')
        setPaymentMethods(data.payment_methods || [])
      } catch (err: any) {
        setErrorPayments(err.message || 'Failed to fetch payment methods')
        setPaymentMethods([])
      } finally {
        setLoadingPayments(false)
      }
    }
    if (profile?.organization?.id) {
      fetchPaymentMethods()
    }
  }, [profile?.organization?.id])

  useEffect(() => {
    async function fetchInvoices() {
      if (!profile?.organization?.id) return
      setLoadingInvoices(true)
      setErrorInvoices(null)
      try {
        const res = await fetch(`/api/organization/invoices?organizationId=${profile.organization.id}`)
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load invoices')
        setInvoices(data.invoices || [])
      } catch (err: any) {
        setErrorInvoices(err.message || 'Failed to fetch invoices')
        setInvoices([])
      } finally {
        setLoadingInvoices(false)
      }
    }
    if (profile?.organization?.id) {
      fetchInvoices()
    }
  }, [profile?.organization?.id])

  // Initialize IntaSend with event handlers - Following official docs
  const initializeIntaSend = () => {
    try {
      console.log('🔧 Initializing IntaSend with key:', process.env.NEXT_PUBLIC_INTASEND_PUBLIC_API_KEY?.substring(0, 20) + '...')

      // Initialize exactly as per IntaSend docs
      new (window as any).IntaSend({
        publicAPIKey: process.env.NEXT_PUBLIC_INTASEND_PUBLIC_API_KEY,
        live: false
      })
      .on('COMPLETE', async (results: any) => {
        console.log('🎉 [INTASEND EVENT] Payment COMPLETE received!')
        console.log('🎉 [INTASEND EVENT] Payment results:', results)
        setPaymentStatus('verifying')
        setPaymentInProgress(false)

        try {
          console.log('🎉 [INTASEND EVENT] Processing payment success...')
          await handlePaymentSuccess(results)
          console.log('🎉 [INTASEND EVENT] Payment success handled successfully')
        } catch (error) {
          console.error('❌ [INTASEND EVENT] Error handling payment success:', error)
          setPaymentStatus('failed')
          setPaymentError('Payment completed but failed to update subscription. Please contact support.')
        }
      })
      .on('FAILED', (results: any) => {
        console.error('❌ [INTASEND EVENT] Payment FAILED received!')
        console.error('❌ [INTASEND EVENT] Failure results:', results)
        setPaymentStatus('failed')
        setPaymentInProgress(false)
        setPaymentError(`Payment failed: ${results.error || results.message || 'Please try again.'}`)
      })
      .on('IN-PROGRESS', () => {
        console.log('⏳ [INTASEND EVENT] Payment IN-PROGRESS received!')
        setPaymentStatus('processing')
        setPaymentInProgress(true)
      })

      console.log('✅ IntaSend initialized successfully')

      // Debug payment buttons
      setTimeout(() => {
        const paymentButtons = document.querySelectorAll('.intaSendPayButton')
        console.log('💳 [DEBUG] Found payment buttons:', paymentButtons.length)
        paymentButtons.forEach((btn, index) => {
          const amount = btn.getAttribute('data-amount')
          const currency = btn.getAttribute('data-currency')
          const email = btn.getAttribute('data-email')
          const apiRef = btn.getAttribute('data-api_ref')
          const comment = btn.getAttribute('data-comment')

          console.log(`💳 [DEBUG] Button ${index}:`, {
            amount,
            currency,
            email,
            apiRef,
            comment,
            className: btn.className,
            id: btn.id || 'no-id'
          })

          if (!amount || amount === '0') {
            console.warn(`⚠️ [DEBUG] Button ${index} has invalid amount: ${amount}`)
          } else {
            console.log(`✅ [DEBUG] Button ${index} has valid amount: ${amount}`)
          }
        })

        // Also check if our specific refs are working
        console.log('💳 [DEBUG] Payment button refs:')
        console.log('💳 [DEBUG] paymentButtonRef.current:', paymentButtonRef.current)
        console.log('💳 [DEBUG] planUpgradeButtonRef.current:', planUpgradeButtonRef.current)
      }, 1000)
    } catch (error) {
      console.error('❌ Error initializing IntaSend:', error)
      setPaymentError('Payment system failed to initialize. Please refresh the page.')
    }
  }

  // IntaSend SDK Loading - Load AFTER org data is available
  useEffect(() => {
    // Only initialize IntaSend after org data is loaded
    if (!org || typeof window === 'undefined') return

    // Check if SDK is already loaded
    if ((window as any).IntaSend) {
      console.log('✅ IntaSend SDK already loaded')
      initializeIntaSend()
      return
    }

    console.log('📦 Loading IntaSend SDK from installed package...')

    // Dynamic import of the installed SDK package
    import('intasend-inlinejs-sdk')
      .then(() => {
        console.log('✅ IntaSend SDK imported successfully')

        // Wait a bit for the SDK to attach to window
        setTimeout(() => {
          if ((window as any).IntaSend) {
            console.log('✅ IntaSend SDK ready')
            initializeIntaSend()
          } else {
            console.error('❌ IntaSend object not found after import')
            setPaymentError('Payment system failed to initialize. Please refresh the page.')
          }
        }, 100)
      })
      .catch((error) => {
        console.error('❌ Failed to import IntaSend SDK:', error)
        setPaymentError('Payment system failed to load. Please refresh the page and try again.')
      })
  }, [org]) // Add org as dependency

  // Authentication is handled by dashboard layout AuthGuard
  if (!profile?.organization_id) {
    return <LoadingState message="Loading organization data..." />
  }

  // Wait for org data to load
  if (!org) {
    return <LoadingState message="Loading billing information..." />
  }







  // Only calculate plan details after confirming org is loaded
  let planKey: keyof typeof PLAN_CONFIG = 'free'
  let plan = PLAN_CONFIG['free']
  let planName = plan.name
  let planPrice = plan.price
  let planFeatures: string[] = plan.features
  let planEmployeeLimit = plan.employees
  let planPeriod = plan.period
  let planCurrency = plan.currency
  let planStatus = 'active'
  let nextBillingDate = 'N/A'
  let usage = ''
  let overLimit = false
  if (org) {
    planKey = (org.subscription_plan || 'free') as keyof typeof PLAN_CONFIG
    plan = PLAN_CONFIG[planKey] || PLAN_CONFIG['free']
    planName = plan.name
    planPrice = plan.price
    planFeatures = plan.features
    planEmployeeLimit = plan.employees
    planPeriod = plan.period
    planCurrency = plan.currency
    planStatus = org.subscription_status || 'active'
    nextBillingDate = org.subscription_end_date ? formatDate(org.subscription_end_date) : 'N/A'
    usage = `${employeeCount} / ${planEmployeeLimit} employees`
    overLimit = employeeCount > planEmployeeLimit
  }



  // Helper: Validate payment button data
  function validatePaymentData(customPrice?: number, customCurrency?: string) {
    if (!org) return { valid: false, error: 'Organization data not loaded.' }

    const priceToCheck = customPrice !== undefined ? customPrice : planPrice
    const currencyToCheck = customCurrency || planCurrency

    if (priceToCheck === 0) return { valid: false, error: 'No payment required for free plan.' }
    if (!priceToCheck || isNaN(priceToCheck) || priceToCheck <= 0) return { valid: false, error: 'Invalid amount.' }
    if (!currencyToCheck) return { valid: false, error: 'Currency is required.' }
    if (!org.billing_email && !org.email) return { valid: false, error: 'Billing email is required.' }
    const email = org.billing_email || org.email
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { valid: false, error: 'Invalid billing email.' }
    // Phone is optional for card payments, but validate format if provided
    if (org.phone && !/^\+?\d{10,15}$/.test(org.phone)) return { valid: false, error: 'Invalid phone number format. Use +254...' }
    if (!org.name) return { valid: false, error: 'Company name is required.' }
    if (typeof window === 'undefined' || !window.location.href) return { valid: false, error: 'Redirect URL is required.' }
    return { valid: true }
  }

  // Handle successful payment completion
  const handlePaymentSuccess = async (paymentResults: any) => {
    try {
      console.log('🔄 Processing payment success...', paymentResults)

      // Create invoice record
      const invoiceData = {
        organizationId: org.id,
        amount: paymentResults.net_amount || paymentResults.value || planPrice,
        currency: paymentResults.currency || planCurrency,
        status: 'paid',
        method: paymentResults.provider || 'intasend',
        description: `Subscription payment via IntaSend`,
        intasend_api_ref: paymentResults.api_ref || paymentResults.invoice_id
      }

      const invoiceResponse = await fetch('/api/organization/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      })

      if (!invoiceResponse.ok) {
        throw new Error('Failed to create invoice record')
      }

      // If this was a plan upgrade, update the subscription
      if (pendingPlanId) {
        const updateResponse = await fetch('/api/organization/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: org.id,
            subscription_plan: pendingPlanId,
            subscription_status: 'active',
            last_payment_date: new Date().toISOString()
          })
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update subscription plan')
        }

        // Log subscription event
        await fetch('/api/subscription/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: org.id,
            action: 'log_event',
            eventType: 'payment_success',
            metadata: {
              old_plan: org.subscription_plan,
              new_plan: pendingPlanId,
              amount: paymentResults.net_amount || paymentResults.value,
              payment_method: paymentResults.provider,
              intasend_ref: paymentResults.api_ref
            }
          })
        })

        setOrg((prev: any) => ({
          ...prev,
          subscription_plan: pendingPlanId,
          subscription_status: 'active'
        }))
        setPendingPlanId(null)
      }

      setPaymentStatus('completed')
      setBannerMessage('🎉 Payment successful! Your subscription has been updated and new features are now available.')
      setBannerType('success')

      // Refresh data after showing success message
      setTimeout(() => {
        router.refresh()
      }, 3000)

    } catch (error: any) {
      console.error('❌ Error processing payment success:', error)
      setPaymentStatus('failed')
      setPaymentError(`Payment completed but failed to update subscription: ${error.message}. Please contact support.`)
    }
  }

  // Handler for Pay Now/Add Payment Method button - Simple Payment Button method
  const handleShowPayment = () => {
    setPaymentError(null)
    setPaymentStatus('idle')

    // Validate payment data
    const validation = validatePaymentData()
    if (!validation.valid) {
      setPaymentError(validation.error || 'Invalid payment data')
      setPaymentStatus('failed')
      return
    }

    // Check if IntaSend SDK is loaded
    if (typeof window === 'undefined' || !(window as any).IntaSend) {
      setPaymentError('Payment system is still loading. Please wait a moment and try again.')
      setPaymentStatus('failed')
      return
    }

    console.log('💳 Triggering IntaSend Payment Button')
    console.log('💳 Payment button ref:', paymentButtonRef.current)
    console.log('💳 Payment data:', {
      amount: planPrice,
      currency: planCurrency,
      email: org?.billing_email || org?.email
    })
    setPaymentStatus('processing')
    setPaymentInProgress(true)

    // Simply click the payment button - IntaSend SDK handles the rest
    if (paymentButtonRef.current) {
      console.log('💳 Clicking payment button...')
      paymentButtonRef.current.click()
    } else {
      console.error('❌ Payment button not found')
      setPaymentError('Payment button not found. Please refresh the page.')
      setPaymentStatus('failed')
      setPaymentInProgress(false)
    }
  }

  // Handler for selecting a new plan
  const handleSelectPlan = async (planId: keyof typeof PLAN_CONFIG) => {
    console.log('🎯 [PLAN SELECTION] Starting plan selection:', planId)
    setSelectPlanError(null)
    setSelectingPlan(planId)
    setPendingPlanId(planId)
    const selectedPlan = PLAN_CONFIG[planId]
    console.log('🎯 [PLAN SELECTION] Selected plan details:', {
      id: planId,
      name: selectedPlan.name,
      price: selectedPlan.price,
      currency: selectedPlan.currency
    })

    if (selectedPlan.price > 0) {
      console.log('🎯 [PLAN SELECTION] Paid plan selected, showing confirmation dialog')
      // For paid plans, show confirmation dialog and do NOT update plan yet
      setShowPlanConfirm(true)
      setSelectingPlan(null)
      return
    }
    // Free plan, just update immediately
    try {
      const res = await fetch('/api/organization/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: org.id, subscription_plan: planId })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to update plan')
      setOrg((prev: any) => ({ ...prev, subscription_plan: planId }))
      setBannerMessage('Plan changed successfully!')
      setBannerType('success')
      router.refresh()
    } catch (e: any) {
      setSelectPlanError(e.message || 'Failed to select plan')
      setBannerMessage(e.message || 'Failed to select plan')
      setBannerType('error')
    }
    setSelectingPlan(null)
  }

  // Handler for confirming paid plan in dialog
  const handleConfirmPaidPlan = async () => {
    console.log('💰 [PAYMENT CONFIRM] Starting payment confirmation for plan:', pendingPlanId)
    if (!pendingPlanId) {
      console.error('💰 [PAYMENT CONFIRM] No pending plan ID found!')
      return
    }

    setShowPlanConfirm(false)
    setSelectingPlan(pendingPlanId)
    setPaymentError(null)
    setPaymentStatus('idle')

    try {
      const selectedPlan = PLAN_CONFIG[pendingPlanId as keyof typeof PLAN_CONFIG]
      console.log('💰 [PAYMENT CONFIRM] Selected plan for payment:', {
        id: pendingPlanId,
        name: selectedPlan.name,
        price: selectedPlan.price,
        currency: selectedPlan.currency
      })

      // Validate payment data for the new plan
      console.log('💰 [PAYMENT CONFIRM] Validating payment data for new plan...')
      const validation = validatePaymentData(selectedPlan.price, selectedPlan.currency)
      console.log('💰 [PAYMENT CONFIRM] Validation result:', validation)
      if (!validation.valid) {
        console.error('💰 [PAYMENT CONFIRM] Validation failed:', validation.error)
        setSelectPlanError(validation.error || 'Invalid payment data')
        setSelectingPlan(null)
        return
      }

      // Check if IntaSend SDK is loaded
      console.log('💰 [PAYMENT CONFIRM] Checking IntaSend SDK availability...')
      if (typeof window === 'undefined' || !(window as any).IntaSend) {
        console.error('💰 [PAYMENT CONFIRM] IntaSend SDK not available!')
        setSelectPlanError('Payment system is still loading. Please wait a moment and try again.')
        setSelectingPlan(null)
        return
      }
      console.log('💰 [PAYMENT CONFIRM] IntaSend SDK is available')

      // Update the plan upgrade payment button with new plan data
      console.log('💰 [PAYMENT CONFIRM] Updating payment button with plan data...')
      if (planUpgradeButtonRef.current) {
        console.log('💰 [PAYMENT CONFIRM] Payment button ref found, updating attributes...')

        const paymentData = {
          amount: String(selectedPlan.price),
          currency: selectedPlan.currency,
          email: org.billing_email || org.email,
          phone: org.phone || '',
          firstName: org.name,
          apiRef: `plan_${pendingPlanId}_${org.id}_${Date.now()}`,
          redirectUrl: window.location.href,
          comment: `Plan upgrade to ${selectedPlan.name}`
        }

        console.log('💰 [PAYMENT CONFIRM] Payment data to set:', paymentData)

        planUpgradeButtonRef.current.setAttribute('data-amount', paymentData.amount)
        planUpgradeButtonRef.current.setAttribute('data-currency', paymentData.currency)
        planUpgradeButtonRef.current.setAttribute('data-email', paymentData.email)
        planUpgradeButtonRef.current.setAttribute('data-phone_number', paymentData.phone)
        planUpgradeButtonRef.current.setAttribute('data-first_name', paymentData.firstName)
        planUpgradeButtonRef.current.setAttribute('data-api_ref', paymentData.apiRef)
        planUpgradeButtonRef.current.setAttribute('data-redirect_url', paymentData.redirectUrl)
        planUpgradeButtonRef.current.setAttribute('data-comment', paymentData.comment)

        console.log('💰 [PAYMENT CONFIRM] Button attributes updated successfully')
        console.log('💳 [PAYMENT TRIGGER] Triggering plan upgrade payment for:', selectedPlan.name)
        setPaymentStatus('processing')

        // Click the payment button - the global event handlers will take care of the rest
        console.log('💳 [PAYMENT TRIGGER] Clicking payment button...')
        planUpgradeButtonRef.current.click()
        console.log('💳 [PAYMENT TRIGGER] Payment button clicked!')
      } else {
        console.error('💰 [PAYMENT CONFIRM] Payment button ref not found!')
        throw new Error('Plan upgrade payment button not found')
      }

    } catch (e: any) {
      console.error('❌ Plan payment error:', e)
      setSelectPlanError(e.message || 'Failed to initialize payment')
      setBannerMessage(e.message || 'Failed to initialize payment')
      setBannerType('error')
      setSelectingPlan(null)
      setPaymentStatus('failed')
    }
  }

  // Handler for cancelling plan confirmation
  const handleCancelPlanConfirm = () => {
    setShowPlanConfirm(false)
    setPendingPlanId(null)
    setSelectingPlan(null)
  }

  // Show loading state while fetching billing data
  if (loading) {
    return <LoadingState message="Loading billing data..." />
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Banner */}
      {bannerMessage && (
        <div className={`w-full px-6 py-3 text-center font-semibold ${bannerType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{bannerMessage}</div>
      )}

      {/* Payment Status Indicator */}
      {paymentStatus !== 'idle' && (
        <div className={`w-full px-6 py-3 text-center font-medium ${
          paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
          paymentStatus === 'verifying' ? 'bg-yellow-100 text-yellow-800' :
          paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
          paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
          paymentStatus === 'cancelled' ? 'bg-gray-100 text-gray-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {paymentStatus === 'processing' && '💳 Processing payment...'}
          {paymentStatus === 'verifying' && '🔄 Verifying payment and updating subscription...'}
          {paymentStatus === 'completed' && '✅ Payment completed successfully!'}
          {paymentStatus === 'failed' && '❌ Payment failed'}
          {paymentStatus === 'cancelled' && '🚫 Payment cancelled'}
        </div>
      )}
      {/* Confirmation Dialog */}
      <Transition.Root show={showPlanConfirm} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCancelPlanConfirm}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-40 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-blue-700">
                    Confirm Plan Change
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 mb-2">
                      {(() => {
                        if (pendingPlanId && (pendingPlanId in PLAN_CONFIG)) {
                          const plan = PLAN_CONFIG[pendingPlanId as keyof typeof PLAN_CONFIG]
                          return (<>
                            You are about to upgrade to <span className="font-semibold text-blue-700">{plan.name}</span> for <span className="font-semibold text-blue-700">{formatKES(plan.price)}</span> per month.
                          </>)
                        }
                        return null
                      })()}
                    </p>
                    <p className="text-sm text-gray-600">You will be redirected to payment. Your plan will only be changed after successful payment.</p>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                      onClick={handleCancelPlanConfirm}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                      onClick={handleConfirmPaidPlan}
                    >
                      Continue to Payment
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Billing & Subscription</h1>
              <p className="text-purple-600 text-sm mt-1">Manage your subscription and billing information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {/* Current Plan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-blue-700">Current Plan</h2>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${planStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{planStatus.charAt(0).toUpperCase() + planStatus.slice(1)}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-blue-700">{planName} Plan</h3>
              <p className="text-purple-600 mt-1">{planName === 'Starter' ? 'Perfect for small teams' : planName === 'Professional' ? 'Perfect for growing teams' : 'For large organizations'}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-blue-700">{planPrice === 0 ? 'Free' : formatKES(planPrice)}</span>
                {planPrice > 0 && <span className="text-gray-600">/{planPeriod}</span>}
              </div>
              <div className="mt-4 space-y-2">
                <div className={`flex items-center text-sm ${overLimit ? 'text-red-600' : 'text-gray-600'}`}>
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {usage} {overLimit && <span className="ml-2 text-xs font-semibold text-red-600">Over limit!</span>}
                </div>
                {planFeatures.map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                    {feature}
                </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm text-gray-600">Next billing date</p>
                <p className="font-semibold text-blue-700">{nextBillingDate}</p>
              </div>
              <div className="mt-4 space-y-2">
                {/* Hidden IntaSend payment button for current plan renewals */}
                <button
                  ref={paymentButtonRef}
                  type="button"
                  className="intaSendPayButton absolute -left-[9999px] opacity-0 pointer-events-none"
                  data-amount={plan.price}
                  data-currency={plan.currency}
                  data-email={org.billing_email || org.email}
                  data-phone_number={org.phone || ''}
                  data-first_name={org.name}
                  data-api_ref={`sub_${org.id}_${Date.now()}`}
                  data-redirect_url={typeof window !== 'undefined' ? window.location.href : ''}
                  data-comment={`Subscription payment for ${plan.name}`}
                >
                  Pay Now
                </button>
                <button
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleShowPayment}
                  disabled={paymentInProgress || planPrice === 0 || paymentStatus === 'processing' || paymentStatus === 'verifying'}
                >
                  {planPrice === 0 ? 'No Payment Required' :
                   paymentStatus === 'processing' ? 'Processing Payment...' :
                   paymentStatus === 'verifying' ? 'Verifying Payment...' :
                   paymentInProgress ? 'Processing...' : 'Pay Now'}
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel Subscription
                </button>
                {paymentError && <div className="text-red-600 mt-2 text-sm">{paymentError}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.values(PLAN_CONFIG)
              .map((planOpt: typeof PLAN_CONFIG[keyof typeof PLAN_CONFIG]) => {
                const isCurrent = planOpt.id === planKey;
                return (
                  <div 
                    key={planOpt.id}
                    className={`p-6 rounded-xl border-2 transition-all border-gray-200 hover:border-gray-300 relative ${isCurrent ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50' : ''}`}
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-blue-700">{planOpt.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-blue-700">
                          {planOpt.price === 0 ? 'Free' : formatKES(planOpt.price)}
                        </span>
                        {planOpt.price > 0 && <span className="text-gray-600">/{planOpt.period}</span>}
                      </div>
                      <p className="text-sm text-purple-600 mt-2">Up to {planOpt.employees} employees</p>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {planOpt.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button 
                      className={`w-full mt-6 py-2 px-4 rounded-lg font-medium transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 ${isCurrent ? 'bg-blue-100 text-blue-500 cursor-not-allowed' : ''} ${selectingPlan === planOpt.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => !isCurrent && handleSelectPlan(planOpt.id as keyof typeof PLAN_CONFIG)}
                      disabled={isCurrent || selectingPlan === planOpt.id || paymentInProgress}
                    >
                      {isCurrent ? 'Current Plan' : (selectingPlan === planOpt.id ? 'Selecting...' : 'Select Plan')}
                    </button>
                    {isCurrent && (
                      <span className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">Current Plan</span>
                    )}
                    {selectPlanError && selectingPlan === planOpt.id && (
                      <div className="text-red-600 mt-2 text-sm">{selectPlanError}</div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Billing Info */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-6">Billing Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <span className="block text-sm text-gray-600">Company Name</span>
                <span className="font-medium text-blue-700">{org.name}</span>
              </div>
              <div className="mb-4">
                <span className="block text-sm text-gray-600">Billing Email</span>
                <span className="font-medium text-blue-700">{org.billing_email || org.email}</span>
              </div>
              <div className="mb-4">
                <span className="block text-sm text-gray-600">Address</span>
                <span className="font-medium text-blue-700">{org.address || 'N/A'}</span>
              </div>
              <div className="mb-4">
                <span className="block text-sm text-gray-600">Phone</span>
                <span className="font-medium text-blue-700">{org.phone || 'N/A'}</span>
              </div>
            </div>
            <div>
              <div className="mb-4">
                <span className="block text-sm text-gray-600">Subscription Status</span>
                <span className={`font-medium ${planStatus === 'active' ? 'text-green-700' : 'text-gray-700'}`}>{planStatus.charAt(0).toUpperCase() + planStatus.slice(1)}</span>
              </div>
              <div className="mb-4">
                <span className="block text-sm text-gray-600">Plan</span>
                <span className="font-medium text-blue-700">{planName}</span>
              </div>
              <div className="mb-4">
                <span className="block text-sm text-gray-600">Employee Usage</span>
                <span className={`font-medium ${overLimit ? 'text-red-700' : 'text-blue-700'}`}>{usage}</span>
              </div>
              <div className="mb-4">
                <span className="block text-sm text-gray-600">Next Billing Date</span>
                <span className="font-medium text-blue-700">{nextBillingDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method (real data) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-6">Payment Method</h2>
          {loadingPayments ? (
            <div className="text-gray-500">Loading payment methods...</div>
          ) : errorPayments ? (
            <div className="text-red-600">{errorPayments}</div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-gray-600 mb-4">No payment methods found.</div>
          ) : (
            <div className="space-y-4 mb-4">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      {/* Icon based on type */}
                      {pm.type === 'mpesa' ? (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      ) : pm.type === 'card' ? (
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      )}
                  </div>
                  <div>
                      <h3 className="font-medium text-blue-700 capitalize">{pm.type}</h3>
                      <p className="text-sm text-purple-600">
                        {pm.type === 'mpesa' && pm.details?.phone ? pm.details.phone : pm.type === 'card' && pm.details?.card_last4 ? `**** **** **** ${pm.details.card_last4}` : pm.type === 'bank' && pm.details?.account_number ? `A/C: ${pm.details.account_number}` : '—'}
                      </p>
                    </div>
                  </div>
                  {pm.is_primary && (
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Primary</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            ref={planUpgradeButtonRef}
            type="button"
            className="intaSendPayButton absolute -left-[9999px] opacity-0 pointer-events-none"
            data-amount={plan.price}
            data-currency={plan.currency}
            data-email={org.billing_email || org.email}
            data-phone_number={org.phone || ''}
            data-first_name={org.name}
            data-api_ref={`upgrade_${org.id}_${Date.now()}`}
            data-redirect_url={typeof window !== 'undefined' ? window.location.href : ''}
            data-comment={`Plan upgrade payment for ${plan.name}`}
          >
            Plan Upgrade Payment
          </button>
          <button 
            className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-4 px-4 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
            onClick={handleShowPayment}
            disabled={paymentInProgress || planPrice === 0}
          >
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            {planPrice === 0 ? 'No Payment Required' : paymentInProgress ? 'Loading payment system...' : 'Add Payment Method'}
            </button>
        </div>

        {/* Invoices (real data) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-6">Invoices</h2>
          {loadingInvoices ? (
            <div className="text-gray-500">Loading invoices...</div>
          ) : errorInvoices ? (
            <div className="text-red-600">{errorInvoices}</div>
          ) : invoices.length === 0 ? (
            <div className="text-gray-600">No invoices found.</div>
          ) : (
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                </tr>
              </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-2 text-sm text-blue-700 font-medium">{inv.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{inv.invoice_date ? formatDate(inv.invoice_date) : '—'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{formatKES(inv.amount)}</td>
                      <td className={`px-4 py-2 text-sm font-semibold ${inv.status === 'paid' ? 'text-green-700' : inv.status === 'pending' ? 'text-yellow-700' : 'text-red-700'}`}>{inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{inv.method ? inv.method.charAt(0).toUpperCase() + inv.method.slice(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
