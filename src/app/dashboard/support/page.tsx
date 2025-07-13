'use client'

import { useState } from 'react'

export default function Support() {
  // Authentication is handled by dashboard layout AuthGuard
  const [activeTab, setActiveTab] = useState('help')
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    priority: 'medium',
    category: 'general',
    description: ''
  })

  const faqs = [
    {
      question: 'How do I add employees to my organization?',
      answer: 'Go to the Employees page and click "Add Employee" or use the "Import CSV" feature to bulk upload employee data.'
    },
    {
      question: 'Can employees respond anonymously?',
      answer: 'Yes, you can enable anonymous responses in Settings > General. Employees will have the option to submit feedback anonymously.'
    },
    {
      question: 'How often should I send mood check-ins?',
      answer: 'We recommend weekly check-ins for most teams. You can adjust the frequency in Settings based on your team\'s needs.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept M-Pesa for Kenyan customers and international credit cards for global customers.'
    },
    {
      question: 'How is my data protected?',
      answer: 'All data is encrypted in transit and at rest. We comply with GDPR and other data protection regulations.'
    }
  ]

  const tickets = [
    { id: 'TKT-001', subject: 'WhatsApp integration not working', status: 'Open', priority: 'High', date: '2024-01-15' },
    { id: 'TKT-002', subject: 'Export feature request', status: 'In Progress', priority: 'Medium', date: '2024-01-14' },
    { id: 'TKT-003', subject: 'Billing question', status: 'Resolved', priority: 'Low', date: '2024-01-13' },
  ]

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle ticket submission
    console.log('Ticket submitted:', ticketForm)
    // Reset form
    setTicketForm({ subject: '', priority: 'medium', category: 'general', description: '' })
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
              <p className="text-gray-600 text-sm mt-1">Get help and submit support requests</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Browse FAQ</h3>
            <p className="text-sm text-gray-600 mb-4">Find answers to common questions</p>
            <button 
              onClick={() => setActiveTab('help')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View FAQ →
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Submit Ticket</h3>
            <p className="text-sm text-gray-600 mb-4">Get personalized help from our team</p>
            <button 
              onClick={() => setActiveTab('ticket')}
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              Create Ticket →
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-600 mb-4">Reach out directly via email</p>
            <a 
              href="mailto:support@staffpulse.com"
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              support@staffpulse.com →
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('help')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'help'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Help & FAQ
              </button>
              <button
                onClick={() => setActiveTab('ticket')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'ticket'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Submit Ticket
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                My Tickets
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'help' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg">
                      <details className="group">
                        <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                          <span className="font-medium text-gray-900">{faq.question}</span>
                          <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </summary>
                        <div className="px-4 pb-4 text-gray-600">
                          {faq.answer}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'ticket' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Submit Support Ticket</h2>
                <form onSubmit={handleSubmitTicket} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={ticketForm.priority}
                        onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing</option>
                        <option value="feature">Feature Request</option>
                        <option value="integration">Integration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={ticketForm.description}
                      onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please provide detailed information about your issue..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Submit Ticket
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">My Support Tickets</h2>
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                          <p className="text-sm text-gray-500">Ticket #{ticket.id} • {ticket.date}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                            ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
