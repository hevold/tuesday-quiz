'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Venue } from '../../types/database'
import { useAdminAuth } from '../../hooks/useAdminAuth'

export default function AdminBranding() {
  const { isAuthenticated, isLoading, logout } = useAdminAuth()
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchVenues()
    }
  }, [isAuthenticated])

  const fetchVenues = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('name')
    
    if (data) setVenues(data)
  }

  const updateVenueBranding = async () => {
    if (!selectedVenue) return
    
    setLoading(true)
    const { error } = await supabase
      .from('venues')
      .update({
        logo_url: selectedVenue.logo_url,
        primary_color: selectedVenue.primary_color,
        secondary_color: selectedVenue.secondary_color,
        background_gradient_start: selectedVenue.background_gradient_start,
        background_gradient_end: selectedVenue.background_gradient_end,
        text_color: selectedVenue.text_color
      })
      .eq('id', selectedVenue.id)

    if (error) {
      setMessage('Feil ved oppdatering: ' + error.message)
    } else {
      setMessage('Branding oppdatert!')
      fetchVenues()
    }
    setLoading(false)
  }

  const updateField = (field: keyof Venue, value: string) => {
    if (selectedVenue) {
      setSelectedVenue({ ...selectedVenue, [field]: value })
    }
  }

  const previewStyle = selectedVenue ? {
    background: `linear-gradient(135deg, ${selectedVenue.background_gradient_start || '#3b82f6'}, ${selectedVenue.background_gradient_end || '#8b5cf6'})`
  } : {}

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Sjekker tilgang...</div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null // useAdminAuth will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logg ut
          </button>
        </div>
        
        {/* Quiz Administration Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-black">Quiz Administration</h2>
          <div className="space-y-4">
            <a 
              href="/admin/archive"
              className="block w-full bg-blue-600 text-white text-center p-4 rounded-lg hover:bg-blue-700 transition-all"
            >
              🗄️ Arkiv Administration - Start ny uke
            </a>
            <p className="text-sm text-black">
              Arkiver gjeldende quiz-resultater og start en ny quiz-økt for neste uke.
            </p>
          </div>
        </div>

        {/* Venue Branding Section */}
        <h2 className="text-2xl font-bold mb-6 text-black">Venue Branding</h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded ${
            message.includes('Feil') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Venue Selector */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4 text-black">Velg venue</h3>
            <select 
              className="w-full p-3 border rounded text-black"
              onChange={(e) => {
                const venue = venues.find(v => v.id === e.target.value)
                setSelectedVenue(venue || null)
              }}
            >
              <option value="">-- Velg venue --</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>

            {selectedVenue && (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block font-medium mb-2 text-black">Logo URL:</label>
                  <input
                    type="url"
                    value={selectedVenue.logo_url || ''}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                    className="w-full p-2 border rounded text-black"
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2 text-black">Primary Color:</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedVenue.primary_color || '#1e40af'}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      className="w-12 h-10 border rounded"
                    />
                    <input
                      type="text"
                      value={selectedVenue.primary_color || '#1e40af'}
                      onChange={(e) => updateField('primary_color', e.target.value)}
                      className="flex-1 p-2 border rounded text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2 text-black">Secondary Color:</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedVenue.secondary_color || '#3b82f6'}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      className="w-12 h-10 border rounded"
                    />
                    <input
                      type="text"
                      value={selectedVenue.secondary_color || '#3b82f6'}
                      onChange={(e) => updateField('secondary_color', e.target.value)}
                      className="flex-1 p-2 border rounded text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2 text-black">Background Gradient Start:</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedVenue.background_gradient_start || '#3b82f6'}
                      onChange={(e) => updateField('background_gradient_start', e.target.value)}
                      className="w-12 h-10 border rounded"
                    />
                    <input
                      type="text"
                      value={selectedVenue.background_gradient_start || '#3b82f6'}
                      onChange={(e) => updateField('background_gradient_start', e.target.value)}
                      className="flex-1 p-2 border rounded text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2 text-black">Background Gradient End:</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedVenue.background_gradient_end || '#8b5cf6'}
                      onChange={(e) => updateField('background_gradient_end', e.target.value)}
                      className="w-12 h-10 border rounded"
                    />
                    <input
                      type="text"
                      value={selectedVenue.background_gradient_end || '#8b5cf6'}
                      onChange={(e) => updateField('background_gradient_end', e.target.value)}
                      className="flex-1 p-2 border rounded text-black"
                    />
                  </div>
                </div>

                <button
                  onClick={updateVenueBranding}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Oppdaterer...' : 'Oppdater Branding'}
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          {selectedVenue && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4 text-black">Forhåndsvisning</h3>
              <div className="aspect-video rounded-lg overflow-hidden" style={previewStyle}>
                <div className="h-full flex flex-col items-center justify-center text-white p-8">
                  {selectedVenue.logo_url && (
                    <div className="absolute bottom-4 right-4">
                      <img 
                        src={selectedVenue.logo_url} 
                        alt="Logo"
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                  )}
                  <h1 className="text-4xl font-bold mb-8">TIRSDAGSQUIZEN</h1>
                  
                  <div className="bg-white/95 rounded-xl p-6 max-w-sm w-full">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Lagnavn:</label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded"
                          placeholder="Eksempel lag"
                          readOnly
                        />
                      </div>
                      <button
                        className="w-full p-3 rounded text-white font-semibold"
                        style={{ backgroundColor: selectedVenue.primary_color || '#1e40af' }}
                      >
                        Registrer lag
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <a 
                  href={`/quiz/${selectedVenue.id}`}
                  target="_blank"
                  className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  Åpne faktisk side
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4 text-black">Hurtigoppsett</h3>
          <p className="text-black mb-4">
            For å legge til logo-er, last dem opp til Supabase Storage og bruk URL-en her.
          </p>
          <div className="space-y-2 text-sm text-black">
            <p><strong>Tips:</strong></p>
            <p>• Logo-er bør være PNG/SVG i 16:9 format eller kvadratiske</p>
            <p>• Maks størrelse: 2MB</p>
            <p>• Bruk transparente bakgrunner for best resultat</p>
            <p>• Test på både lys og mørk bakgrunn</p>
          </div>
        </div>
      </div>
    </div>
  )
}