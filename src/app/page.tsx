'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Venue } from '../types/database'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('region', { ascending: true })
      
      if (error) {
        console.error('Error fetching venues:', error)
      } else {
        setVenues(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVenueSelect = () => {
    if (selectedVenue) {
      router.push(`/quiz/${selectedVenue}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00A2FF' }}>
        <div className="text-white text-xl font-arial">Laster utesteder...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: '#00A2FF' }}>
      <style jsx>{`
        .font-arial {
          font-family: Arial, Helvetica, sans-serif;
        }
        .custom-title-font {
          font-family: 'Sigana', Arial, Helvetica, sans-serif;
          font-weight: normal;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        @media (min-width: 768px) {
          .custom-title-font {
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

      <div className="max-w-4xl mx-auto">
        {/* Quizlo logo bottom left */}
        <div className="absolute bottom-8 left-8">
          <div className="text-white text-3xl font-arial font-light">
            Quizlo
          </div>
        </div>

        {/* Main content centered */}
        <div className="flex flex-col items-center justify-center min-h-screen">
          {/* Title */}
          <h1 className="custom-title-font text-white text-8xl mb-16 tracking-wider">
            TIRSDAGSQUIZEN
          </h1>
          
          {/* Form box */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 max-w-2xl w-full shadow-2xl">
            <div className="space-y-8">
              <div>
                <label className="block text-xl font-arial font-medium text-gray-700 mb-4">
                  Velg ditt utested:
                </label>
                <select 
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  className="w-full p-4 text-xl font-arial text-black border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="">-- Velg utested --</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} ({venue.region})
                    </option>
                  ))}
                </select>
                {venues.length === 0 && (
                  <p className="text-red-500 text-sm mt-2 font-arial">
                    Feil ved lasting av utesteder. Sjekk Supabase-tilkoblingen.
                  </p>
                )}
              </div>

              <button
                onClick={handleVenueSelect}
                disabled={!selectedVenue}
                className="w-full text-white p-4 text-xl font-arial font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: selectedVenue ? '#00A2FF' : '#6b7280',
                  borderColor: selectedVenue ? '#00A2FF' : '#6b7280'
                }}
              >
                Fortsett til quiz
              </button>

              <div className="text-center">
                <a 
                  href="/results" 
                  className="text-blue-600 hover:text-blue-800 underline font-arial"
                >
                  Se resultater
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}