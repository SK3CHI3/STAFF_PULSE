'use client'

import Link from 'next/link'

export default function Demo() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Glass Morphism Floating Navigation */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-6">
        <div className="glass backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-6 py-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded-md"></div>
              </div>
              <span className="text-xl font-bold text-gray-900">StaffPulse</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Features</Link>
              <Link href="/#pricing" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Pricing</Link>
              <Link href="/demo" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">Demo</Link>
              <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Video */}
      <section className="min-h-screen pt-32 pb-16 px-6 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 relative overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Live Demo • AI Powered • Real-time
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                See StaffPulse
                <br />
                <span className="text-blue-600">In Action</span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-md">
                Watch how StaffPulse transforms team wellness monitoring through WhatsApp.
                See real AI insights, dashboard analytics, and automated check-ins in action.
              </p>

              <div className="flex gap-3">
                <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Start Free Trial
                </Link>
                <Link href="/" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Back to Home
                </Link>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">60s</div>
                  <div className="text-sm text-gray-600">Setup Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">95%</div>
                  <div className="text-sm text-gray-600">Response Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">15+</div>
                  <div className="text-sm text-gray-600">Languages</div>
                </div>
              </div>
            </div>

            {/* Right Video - Large Professional Size - Takes 2 columns */}
            <div className="relative lg:col-span-2 flex flex-col justify-end">
              <div className="glass backdrop-blur-xl bg-white/10 border border-white/20 p-4 rounded-3xl shadow-2xl">
                <div className="relative w-full h-80 lg:h-96 xl:h-[28rem] rounded-2xl overflow-hidden bg-gray-900">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="StaffPulse Demo Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Content Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 via-blue-600/10 to-indigo-600/10"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  What You Just Saw
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  The demo showcases StaffPulse's complete workflow from initial setup to actionable insights.
                  Here's what makes our platform revolutionary for team wellness monitoring.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">WhatsApp Integration</h3>
                    <p className="text-gray-600">
                      No app downloads required. Works seamlessly with your team's existing WhatsApp numbers,
                      ensuring 100% adoption from day one.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Powered Analysis</h3>
                    <p className="text-gray-600">
                      Advanced sentiment analysis processes responses in real-time, identifying patterns
                      and predicting burnout before it impacts productivity.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Dashboard</h3>
                    <p className="text-gray-600">
                      Beautiful, intuitive dashboards provide instant visibility into team wellness trends,
                      with actionable insights and automated alerts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Statistics */}
            <div className="space-y-8">
              <div className="glass backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Demo Highlights</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Setup Time</span>
                    <span className="text-2xl font-bold text-blue-600">&lt; 60 seconds</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Response Rate</span>
                    <span className="text-2xl font-bold text-emerald-600">95%+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">AI Accuracy</span>
                    <span className="text-2xl font-bold text-purple-600">98.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Languages Supported</span>
                    <span className="text-2xl font-bold text-orange-600">15+</span>
                  </div>
                </div>
              </div>

              <div className="glass backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Join hundreds of companies already using StaffPulse to build stronger, happier teams.
                </p>
                <div className="space-y-3">
                  <Link href="/auth/signup" className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
                    Start Free Trial
                  </Link>
                  <Link href="/auth/login" className="block w-full glass backdrop-blur-xl bg-white/10 border border-white/20 text-gray-700 text-center py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features from Demo */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-purple-600/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Features Demonstrated</h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Every feature you saw in the demo is available in your StaffPulse dashboard from day one
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Mobile-First Design</h3>
              <p className="text-white/70">Optimized for WhatsApp and mobile usage patterns your team already knows.</p>
            </div>

            <div className="glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Smart Alerts</h3>
              <p className="text-white/70">Proactive notifications when team wellness metrics need attention.</p>
            </div>

            <div className="glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Instant Setup</h3>
              <p className="text-white/70">From signup to first check-in in under 60 seconds. No technical knowledge required.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20"></div>
        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience This
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"> Yourself?</span>
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Start your free trial today and see how StaffPulse can transform your team's wellness in just minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105">
              Start Free Trial
            </Link>
            <Link href="/" className="glass backdrop-blur-xl bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all duration-300">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
