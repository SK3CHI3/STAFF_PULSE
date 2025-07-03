'use client'

import { useState } from 'react'

export default function Billing() {
  const [currentPlan] = useState('professional')

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      currency: 'KES',
      period: 'month',
      employees: 4,
      features: ['Basic dashboard', '2 check-ins per month', 'Email support'],
      current: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 800,
      currency: 'KES',
      period: 'month',
      employees: 15,
      features: ['Advanced analytics', 'Weekly check-ins', 'AI insights', 'Priority support'],
      current: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 2000,
      currency: 'KES',
      period: 'month',
      employees: 50,
      features: ['All features', 'Custom integrations', 'Dedicated support', 'Advanced security'],
      current: false
    }
  ]

  const invoices = [
    { id: 'INV-001', date: '2024-01-01', amount: 800, status: 'Paid', method: 'M-Pesa' },
    { id: 'INV-002', date: '2023-12-01', amount: 800, status: 'Paid', method: 'M-Pesa' },
    { id: 'INV-003', date: '2023-11-01', amount: 800, status: 'Paid', method: 'M-Pesa' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
              <p className="text-gray-600 text-sm mt-1">Manage your subscription and billing information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {/* Current Plan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Active
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Professional Plan</h3>
              <p className="text-gray-600 mt-1">Perfect for growing teams</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">KES 800</span>
                <span className="text-gray-600">/month</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Up to 15 employees
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Weekly check-ins
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI mood analysis
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm text-gray-600">Next billing date</p>
                <p className="font-semibold text-gray-900">February 1, 2024</p>
              </div>
              <div className="mt-4 space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Upgrade Plan
                </button>
                <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Available Plans */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`p-6 rounded-xl border-2 transition-all ${
                  plan.current 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price === 0 ? 'Free' : `${plan.currency} ${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-gray-600">/{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Up to {plan.employees} employees</p>
                </div>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <button 
                  className={`w-full mt-6 py-2 px-4 rounded-lg font-medium transition-colors ${
                    plan.current
                      ? 'bg-blue-600 text-white cursor-default'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Select Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Method</h2>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">M-Pesa</h3>
                    <p className="text-sm text-gray-500">+254 712 345 678</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Primary
                </span>
              </div>
            </div>
            
            <button className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-4 px-4 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors">
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Payment Method
            </button>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Download All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.id}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.date}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      KES {invoice.amount}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.method}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
