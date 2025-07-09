'use client'

import { Fragment, useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useAuth } from '@/lib/auth'
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
  const { profile, loading: authLoading } = useAuth()
  const [org, setOrg] = useState<any>(null)
  const [employeeCount, setEmployeeCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [loadingInvoices, setLoadingInvoices] = useState(true)
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

  useEffect(() => {
    async function fetchData() {
      if (!profile?.organization?.id) return
      setLoading(true)
      setError(null)
      try {
        const [orgRes, empRes] = await Promise.all([
          fetch(`/api/organization/settings?organizationId=${profile.organization.id}`),
          fetch(`/api/employees?organizationId=${profile.organization.id}`)
        ])
        const orgData = await orgRes.json()
        const empData = await empRes.json()
        if (!orgData.success || !orgData.settings) throw new Error(orgData.error || 'Failed to load organization info')
        if (!empData.success) throw new Error(empData.error || 'Failed to load employees')
        setOrg(orgData.settings)
        setEmployeeCount((empData.employees || []).length)
      } catch (e: any) {
        setError(e.message || 'Failed to load billing data')
        setOrg(null)
        setEmployeeCount(0)
      }
      setLoading(false)
    }
    if (!authLoading && profile?.organization?.id) {
      fetchData()
    }
  }, [authLoading, profile?.organization?.id])

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
      } catch (e: any) {
        setErrorPayments(e.message || 'Failed to load payment methods')
        setPaymentMethods([])
      }
      setLoadingPayments(false)
    }
    if (!authLoading && profile?.organization?.id) {
      fetchPaymentMethods()
    }
  }, [authLoading, profile?.organization?.id])

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
      } catch (e: any) {
        setErrorInvoices(e.message || 'Failed to load invoices')
        setInvoices([])
      }
      setLoadingInvoices(false)
    }
    if (!authLoading && profile?.organization?.id) {
      fetchInvoices()
    }
  }, [authLoading, profile?.organization?.id])

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

  // IntaSend Payment Button integration (official method)
  useEffect(() => {
    if (typeof window === 'undefined' || !org) return
    let intaSendInstance: any = null
    let isMounted = true
    let sdkLoaded = false
    async function loadIntaSend() {
      try {
        // Dynamically import SDK for SSR safety
        await import('intasend-inlinejs-sdk')
        sdkLoaded = true
        if (!window.IntaSend) throw new Error('IntaSend SDK failed to load')
        intaSendInstance = new window.IntaSend({
          publicAPIKey: 'ISPubKey_test_91ffc81a-8ac4-419e-8008-7091caa8d73f',
          live: false
        })
        .on('COMPLETE', async (results: any) => {
          if (!isMounted) return
          setPaymentInProgress(false)
          setShowPaymentModal(false)
          try {
            await fetch('/api/organization/invoices', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organizationId: org.id,
                amount: plan.price,
                currency: plan.currency,
                status: 'paid',
                method: results.method || 'unknown',
                payment_method_id: null,
                description: `Subscription payment via IntaSend (${results.method || 'unknown'})`
              })
            })
            // Dispatch a custom event to notify plan change handler
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('paymentComplete'))
            }
            window.location.reload()
          } catch (e: any) {
            setPaymentError('Payment succeeded but failed to record invoice. Please contact support.')
          }
        })
        .on('FAILED', (results: any) => {
          if (!isMounted) return
          setPaymentInProgress(false)
          setPaymentError('Payment failed. Please try again.')
        })
        .on('IN-PROGRESS', () => {
          if (!isMounted) return
          setPaymentInProgress(true)
        })
      } catch (e: any) {
        setPaymentError('Payment system failed to initialize. Please refresh and try again.\nDetails: ' + (e?.message || e))
        setPaymentInProgress(false)
      }
    }
    loadIntaSend()
    return () => { isMounted = false }
  }, [org, plan.price, plan.currency])

  // Helper: Validate payment button data
  function validatePaymentData() {
    if (planPrice === 0) return { valid: false, error: 'No payment required for free plan.' }
    if (!planPrice || isNaN(planPrice) || planPrice <= 0) return { valid: false, error: 'Invalid amount.' }
    if (!planCurrency) return { valid: false, error: 'Currency is required.' }
    if (!org.billing_email && !org.email) return { valid: false, error: 'Billing email is required.' }
    const email = org.billing_email || org.email
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { valid: false, error: 'Invalid billing email.' }
    if (!org.phone) return { valid: false, error: 'Phone number is required.' }
    if (!/^\+?\d{10,15}$/.test(org.phone)) return { valid: false, error: 'Invalid phone number format. Use +254...' }
    if (!org.name) return { valid: false, error: 'Company name is required.' }
    if (typeof window === 'undefined' || !window.location.href) return { valid: false, error: 'Redirect URL is required.' }
    return { valid: true }
  }

  // Handler for Pay Now/Add Payment Method button
  const handleShowPayment = () => {
    setPaymentError(null)
    setPaymentInProgress(true)
    // Validate payment data
    const validation = validatePaymentData()
    if (!validation.valid) {
      setPaymentError(validation.error || 'Invalid payment data')
      setPaymentInProgress(false)
      return
    }
    // Log data attributes for debugging
    if (typeof window !== 'undefined') {
      console.log('IntaSend Payment Data:', {
        amount: planPrice,
        currency: planCurrency,
        email: org.billing_email || org.email,
        phone: org.phone,
        first_name: org.name,
        redirect_url: window.location.href
      })
    }
    // Simulate click on the payment button
    setTimeout(() => {
      paymentButtonRef.current?.click()
      setPaymentInProgress(false)
    }, 100)
  }

  // Handler for selecting a new plan
  const handleSelectPlan = async (planId: keyof typeof PLAN_CONFIG) => {
    setSelectPlanError(null)
    setSelectingPlan(planId)
    setPendingPlanId(planId)
    const selectedPlan = PLAN_CONFIG[planId]
    if (selectedPlan.price > 0) {
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
      window.location.reload()
    } catch (e: any) {
      setSelectPlanError(e.message || 'Failed to select plan')
      setBannerMessage(e.message || 'Failed to select plan')
      setBannerType('error')
    }
    setSelectingPlan(null)
  }

  // Handler for confirming paid plan in dialog
  const handleConfirmPaidPlan = async () => {
    if (!pendingPlanId) return
    setShowPlanConfirm(false)
    setSelectingPlan(pendingPlanId)
    try {
      const selectedPlan = PLAN_CONFIG[pendingPlanId as keyof typeof PLAN_CONFIG]
      // Update payment button data attributes
      setTimeout(() => {
        if (paymentButtonRef.current) {
          paymentButtonRef.current.setAttribute('data-amount', String(selectedPlan.price))
          paymentButtonRef.current.setAttribute('data-currency', selectedPlan.currency)
          paymentButtonRef.current.setAttribute('data-email', org.billing_email || org.email)
          paymentButtonRef.current.setAttribute('data-phone_number', org.phone || '')
          paymentButtonRef.current.setAttribute('data-first_name', org.name)
          paymentButtonRef.current.setAttribute('data-redirect_url', typeof window !== 'undefined' ? window.location.href : '')
          // Remove any previous event listeners to avoid duplicate updates
          window.removeEventListener('paymentComplete', window.__onPaymentComplete)
          // Attach a one-time payment success handler
          window.__onPaymentComplete = async () => {
            try {
              // Update org plan in backend after payment
              const res = await fetch('/api/organization/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: org.id, subscription_plan: pendingPlanId })
              })
              const data = await res.json()
              if (!data.success) throw new Error(data.error || 'Failed to update plan after payment')
              setOrg((prev: any) => ({ ...prev, subscription_plan: pendingPlanId }))
              setBannerMessage('Plan changed successfully!')
              setBannerType('success')
              window.location.reload()
            } catch (e: any) {
              setSelectPlanError(e.message || 'Failed to update plan after payment')
              setBannerMessage(e.message || 'Failed to update plan after payment')
              setBannerType('error')
            }
            setSelectingPlan(null)
            window.removeEventListener('paymentComplete', window.__onPaymentComplete)
          }
          window.addEventListener('paymentComplete', window.__onPaymentComplete)
        }
        setPaymentError(null)
        setPaymentInProgress(true)
        paymentButtonRef.current?.click()
        setPaymentInProgress(false)
      }, 200)
    } catch (e: any) {
      setSelectPlanError(e.message || 'Failed to select plan')
      setBannerMessage(e.message || 'Failed to select plan')
      setBannerType('error')
      setSelectingPlan(null)
    }
  }

  // Handler for cancelling plan confirmation
  const handleCancelPlanConfirm = () => {
    setShowPlanConfirm(false)
    setPendingPlanId(null)
    setSelectingPlan(null)
  }

  // Now, after all hooks, do your conditional rendering:
  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading billing info...</div>
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-600">{error}</div>
  }
  if (!org) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">No organization data found.</div>
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Banner */}
      {bannerMessage && (
        <div className={`w-full px-6 py-3 text-center font-semibold ${bannerType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{bannerMessage}</div>
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
                <button
                  ref={paymentButtonRef}
                  type="button"
                  className="intaSendPayButton hidden"
                  data-amount={plan.price}
                  data-currency={plan.currency}
                  data-email={org.billing_email || org.email}
                  data-phone_number={org.phone || ''}
                  data-first_name={org.name}
                  data-redirect_url={typeof window !== 'undefined' ? window.location.href : ''}
                >
                  Pay Now
                </button>
                <button
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleShowPayment}
                  disabled={paymentInProgress || planPrice === 0}
                >
                  {planPrice === 0 ? 'No Payment Required' : paymentInProgress ? 'Processing Payment...' : 'Pay Now'}
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
            ref={paymentButtonRef}
            type="button"
            className="intaSendPayButton hidden"
            data-amount={plan.price}
            data-currency={plan.currency}
            data-email={org.billing_email || org.email}
            data-phone_number={org.phone || ''}
            data-first_name={org.name}
            data-redirect_url={typeof window !== 'undefined' ? window.location.href : ''}
          >
            Add Payment Method
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
