'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setResult('Testing connection...')
    
    try {
      // Test 1: Basic connection
      setResult(prev => prev + '\n✅ Supabase client initialized')
      
      // Test 2: Simple query
      const { data, error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1)
      
      if (error) {
        setResult(prev => prev + '\n❌ Database query failed: ' + error.message)
      } else {
        setResult(prev => prev + '\n✅ Database query successful')
      }
      
      // Test 3: Auth status
      const { data: { session } } = await supabase.auth.getSession()
      setResult(prev => prev + '\n✅ Auth system accessible, session: ' + (session ? 'exists' : 'none'))
      
    } catch (err: any) {
      setResult(prev => prev + '\n❌ Error: ' + err.message)
    }
    
    setLoading(false)
  }

  const testSignIn = async () => {
    if (!email || !password) {
      setResult('Please enter email and password')
      return
    }
    
    setLoading(true)
    setResult('Testing sign-in...')
    
    try {
      console.log('🧪 [TestAuth] Starting sign-in test...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('🧪 [TestAuth] Sign-in result:', { user: data?.user?.id, error: error?.message })
      
      if (error) {
        setResult(prev => prev + '\n❌ Sign-in failed: ' + error.message)
      } else {
        setResult(prev => prev + '\n✅ Sign-in successful! User ID: ' + data.user?.id)
      }
      
    } catch (err: any) {
      console.error('🧪 [TestAuth] Unexpected error:', err)
      setResult(prev => prev + '\n❌ Unexpected error: ' + err.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Supabase Connection'}
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Sign-In Test</h2>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={testSignIn}
              disabled={loading || !email || !password}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Sign-In'}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Results:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result || 'No tests run yet'}</pre>
        </div>
      </div>
    </div>
  )
}
