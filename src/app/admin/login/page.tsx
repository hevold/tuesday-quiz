'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        // Set authentication in localStorage and cookie
        localStorage.setItem('adminAuth', 'true')
        document.cookie = `adminAuth=true; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
        router.push('/admin')
      } else {
        setError('Feil passord')
      }
    } catch (error) {
      setError('En feil oppstod ved innlogging')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00A2FF' }}>
      <style jsx>{`
        .font-arial {
          font-family: Arial, Helvetica, sans-serif;
        }
        .custom-font {
          font-family: 'Sigana', Arial, Helvetica, sans-serif;
          font-weight: normal;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        @media (min-width: 768px) {
          .custom-font {
            transform: scaleX(1.5);
            transform-origin: center;
          }
        }
        @font-face {
          font-family: 'Sigana';
          src: url('/fonts/Sigana Condensed.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold custom-font mb-4" style={{ color: '#00A2FF' }}>
            ADMIN
          </h1>
          <p className="text-gray-600 font-arial">Logg inn for å administrere quiz-systemet</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 font-arial">
              Admin-passord:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-arial"
              placeholder="Skriv inn passord"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded font-arial">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full text-white p-3 rounded-md font-arial font-semibold transition-all disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: password.trim() ? '#00A2FF' : '#6b7280',
            }}
          >
            {loading ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="text-blue-600 hover:text-blue-800 underline font-arial text-sm"
          >
            ← Tilbake til quiz
          </a>
        </div>
      </div>
    </div>
  )
}