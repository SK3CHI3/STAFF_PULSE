'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const carouselItems = [
    {
      title: "WhatsApp Integration",
      description: "Seamless team communication through existing WhatsApp channels. No new apps to download or learn.",
      details: "100% adoption rate • Works on any device • Instant deployment",
      gradient: "from-emerald-400/80 to-teal-500/80",
      shadowColor: "emerald-500/30",
      glowColor: "emerald-400/20",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      title: "AI-Powered Analytics",
      description: "Advanced sentiment analysis and predictive insights that identify wellness patterns before they become problems.",
      details: "98.5% accuracy • Real-time processing • Predictive alerts",
      gradient: "from-violet-400/80 to-purple-500/80",
      shadowColor: "purple-500/30",
      glowColor: "violet-400/20",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      title: "Live Dashboard",
      description: "Beautiful real-time dashboards with actionable insights, trend analysis, and automated reporting for HR teams.",
      details: "Live updates • Custom reports • Team insights",
      gradient: "from-sky-400/80 to-blue-500/80",
      shadowColor: "blue-500/30",
      glowColor: "sky-400/20",
      icon: (
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Remove the global background effects since each section will have its own */}

      {/* Glass Morphism Floating Navigation */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-6">
        <div className="glass backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-6 py-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="StaffPulse Logo" className="w-10 h-10 rounded-xl bg-white p-1 shadow" />
              <span className="text-xl font-bold text-gray-900">StaffPulse</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Pricing</a>
              <Link href="/demo" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">Demo</Link>
              <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Full Height */}
      <section className="min-h-screen pt-32 pb-16 px-6 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 relative overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content - Enhanced */}
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full text-blue-700 text-sm font-medium">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mr-2 animate-pulse"></div>
                AI-Powered • WhatsApp Native • Enterprise Ready
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transform Your
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Team Culture</span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                Proactive team wellness monitoring through WhatsApp. Our AI identifies burnout patterns,
                predicts mental health risks, and provides actionable insights to build thriving workplaces.
              </p>

              <div className="flex gap-3">
                <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Start Free
                </Link>
                <Link href="/demo" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Demo
                </Link>
              </div>

              {/* Enhanced Statistics */}
              <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t border-gray-200">
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">500+</div>
                  <div className="text-sm text-gray-600 font-medium">Companies</div>
                  <div className="text-xs text-gray-500 mt-1">Across 15 countries</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">50K+</div>
                  <div className="text-sm text-gray-600 font-medium">Employees</div>
                  <div className="text-xs text-gray-500 mt-1">Monitored daily</div>
                </div>
                <div className="text-center group">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">98%</div>
                  <div className="text-sm text-gray-600 font-medium">Satisfaction</div>
                  <div className="text-xs text-gray-500 mt-1">HR team approval</div>
                </div>
              </div>
            </div>

            {/* Right Modern Carousel */}
            <div className="relative">
              <div className="relative h-96 overflow-hidden rounded-3xl">
                {carouselItems.map((item, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === currentSlide
                        ? 'opacity-100 transform translate-x-0 scale-100'
                        : index < currentSlide
                          ? 'opacity-0 transform -translate-x-full scale-95'
                          : 'opacity-0 transform translate-x-full scale-95'
                    }`}
                  >
                    {/* Color casting background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-3xl blur-xl opacity-30`}></div>
                    <div className={`absolute inset-0 bg-${item.glowColor} rounded-3xl blur-2xl`}></div>

                    {/* Main card */}
                    <div className={`relative h-full bg-gradient-to-br ${item.gradient} backdrop-blur-sm rounded-3xl p-8 flex flex-col justify-between text-white shadow-2xl border border-white/20`}>
                      {/* Header with icon */}
                      <div className="flex items-start justify-between">
                        <div className={`p-3 bg-white/25 rounded-2xl backdrop-blur-sm shadow-lg shadow-${item.shadowColor}`}>
                          {item.icon}
                        </div>
                        <div className="text-right">
                          <div className="w-2 h-2 bg-white/60 rounded-full mb-1"></div>
                          <div className="w-2 h-2 bg-white/40 rounded-full mb-1"></div>
                          <div className="w-2 h-2 bg-white/20 rounded-full"></div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <h3 className="text-2xl font-bold leading-tight">{item.title}</h3>
                        <p className="text-white/90 text-base leading-relaxed">{item.description}</p>

                        {/* Details */}
                        <div className="pt-4 border-t border-white/20">
                          <p className="text-white/70 text-sm font-medium">{item.details}</p>
                        </div>
                      </div>

                      {/* Bottom accent */}
                      <div className="flex justify-center mt-6">
                        <div className="w-12 h-1 bg-white/30 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modern Indicators */}
              <div className="flex justify-center space-x-4 mt-8">
                {carouselItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`relative transition-all duration-300 ${
                      index === currentSlide
                        ? 'scale-125'
                        : 'scale-100 hover:scale-110'
                    }`}
                  >
                    {/* Glow effect for active indicator */}
                    {index === currentSlide && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-full blur-sm opacity-60`}></div>
                    )}
                    <div className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? `bg-gradient-to-r ${item.gradient} shadow-lg`
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}></div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-100 via-blue-100 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 via-blue-600/10 to-indigo-600/10"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to transform your workplace culture</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group glass backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                  1
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Send Check-ins</h3>
              <p className="text-gray-700 leading-relaxed">Automated WhatsApp messages sent weekly to your team. No apps, no friction, just simple questions.</p>
            </div>

            <div className="group glass backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                  2
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Collect Responses</h3>
              <p className="text-gray-700 leading-relaxed">Staff reply with 1-5 ratings and optional comments. Anonymous options available for honest feedback.</p>
            </div>

            <div className="group glass backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-3xl hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                  3
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Analysis</h3>
              <p className="text-gray-700 leading-relaxed">Advanced sentiment analysis provides actionable insights, burnout alerts, and HR recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-purple-600/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">Powerful Features</h2>
            <p className="text-xl text-white/70 font-light max-w-2xl mx-auto">Everything you need to build a thriving workplace culture</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Instant Setup</h3>
              <p className="text-white/70 leading-relaxed">Zero configuration required. Works with existing WhatsApp numbers. Deploy in under 60 seconds.</p>
            </div>

            <div className="group glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI Intelligence</h3>
              <p className="text-white/70 leading-relaxed">Advanced sentiment analysis with predictive burnout detection and personalized recommendations.</p>
            </div>

            <div className="group glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h9a1 1 0 001-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Real-time Alerts</h3>
              <p className="text-white/70 leading-relaxed">Instant notifications when team wellness metrics drop below thresholds you define.</p>
            </div>

            <div className="group glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Privacy First</h3>
              <p className="text-white/70 leading-relaxed">Anonymous feedback options with enterprise-grade security and GDPR compliance.</p>
            </div>

            <div className="group glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Rich Analytics</h3>
              <p className="text-white/70 leading-relaxed">Beautiful dashboards with trend analysis, heatmaps, and exportable executive reports.</p>
            </div>

            <div className="group glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Local Payments</h3>
              <p className="text-white/70 leading-relaxed">M-Pesa integration with Kenyan pricing. Built specifically for African businesses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-gradient-to-br from-blue-900 via-emerald-900 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-emerald-600/10 to-teal-600/10"></div>
        <div className="absolute top-40 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">Choose Your Plan</h2>
            <p className="text-xl text-white/70 font-light">Transparent pricing that scales with your team</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-2xl mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <div className="text-4xl font-black text-white mb-2">Free</div>
                <p className="text-white/60 mb-8">Perfect for small teams</p>

                <ul className="text-left space-y-4 mb-10">
                  <li className="flex items-center text-white/80">
                    <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 4 employees
                  </li>
                  <li className="flex items-center text-white/80">
                    <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    2 check-ins per month
                  </li>
                  <li className="flex items-center text-white/80">
                    <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Basic dashboard
                  </li>
                </ul>

                <Link href="/auth/signup" className="w-full glass backdrop-blur-xl bg-white/10 border border-white/20 text-white py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300 text-center block">
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Starter Plan - Popular */}
            <div className="relative glass backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 p-8 rounded-3xl hover:scale-105 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="text-4xl font-black text-white mb-1">KES 800</div>
                <p className="text-cyan-200 mb-8">per month</p>

                <ul className="text-left space-y-4 mb-10">
                  <li className="flex items-center text-white">
                    <svg className="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 15 employees
                  </li>
                  <li className="flex items-center text-white">
                    <svg className="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Weekly check-ins
                  </li>
                  <li className="flex items-center text-white">
                    <svg className="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI mood analysis
                  </li>
                  <li className="flex items-center text-white">
                    <svg className="w-5 h-5 text-cyan-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced analytics
                  </li>
                </ul>

                <Link href="/auth/signup" className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 text-center block">
                  Start 14-Day Trial
                </Link>
              </div>
            </div>

            {/* Team Plan */}
            <div className="glass backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <div className="text-4xl font-black text-white mb-1">KES 2,000</div>
                <p className="text-white/60 mb-8">per month</p>

                <ul className="text-left space-y-4 mb-10">
                  <li className="flex items-center text-white/80">
                    <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 50 employees
                  </li>
                  <li className="flex items-center text-white/80">
                    <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced AI insights
                  </li>
                  <li className="flex items-center text-white/80">
                    <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Burnout prediction
                  </li>
                  <li className="flex items-center text-white/80">
                    <svg className="w-5 h-5 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                </ul>

                <Link href="/auth/signup" className="w-full glass backdrop-blur-xl bg-white/10 border border-white/20 text-white py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-300 text-center block">
                  Start 14-Day Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20"></div>
        <div className="absolute top-20 left-1/3 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="max-w-5xl mx-auto text-center relative">
          <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
            Ready to Transform
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"> Your Culture?</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/70 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
            Join forward-thinking companies using AI to build happier, more resilient teams.
            Start your transformation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auth/signup" className="group bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-12 py-6 rounded-2xl text-xl font-bold hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105">
              <span className="flex items-center">
                Start Free Today
                <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            <Link href="/demo" className="glass backdrop-blur-xl bg-white/10 border border-white/20 text-white px-12 py-6 rounded-2xl text-xl font-semibold hover:bg-white/20 transition-all duration-300">
              Schedule Demo
            </Link>
          </div>

          <div className="mt-16 glass backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <p className="text-white/80 text-lg">
              <span className="font-semibold text-cyan-400">No credit card required</span> •
              <span className="font-semibold text-purple-400"> 14-day free trial</span> •
              <span className="font-semibold text-pink-400"> Cancel anytime</span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <img src="/logo.svg" alt="StaffPulse Logo" className="w-12 h-12 rounded-2xl bg-white p-1 shadow" />
                <span className="text-2xl font-bold text-white">StaffPulse</span>
              </div>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                AI-powered team wellness monitoring through WhatsApp.
                Building stronger, happier workplaces across Africa.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-white/60">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-white/40 mb-4 md:mb-0">
                © 2024 StaffPulse. Crafted with precision for the future of work.
              </p>
              <div className="flex space-x-6 text-white/40">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Support</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
