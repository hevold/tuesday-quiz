'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Venue, Team } from '../../../types/database'

export default function Quiz() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.venueId as string
  
  const [venue, setVenue] = useState<Venue | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [teamName, setTeamName] = useState('')
  const [entryAnswer, setEntryAnswer] = useState('')
  const [round1Score, setRound1Score] = useState('')
  const [round2Score, setRound2Score] = useState('')
  const [bonusScore, setBonusScore] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (venueId) {
      fetchVenue()
      if (typeof window !== 'undefined') {
        const savedTeamId = localStorage.getItem(`team_${venueId}`)
        if (savedTeamId) {
          fetchTeam(savedTeamId)
        }
      }
    }
  }, [venueId])

  // Rydd opp i localStorage ved oppstart
  useEffect(() => {
    const cleanupOldTeams = () => {
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith('team_') && !key.includes(venueId)) {
            // Fjern gamle team-IDer for andre venues
            localStorage.removeItem(key)
          }
        })
      }
    }
    cleanupOldTeams()
  }, [])

  const fetchVenue = async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single()
    
    if (error) {
      console.error('Error fetching venue:', error)
      setMessage('Feil ved lasting av utested')
    } else {
      setVenue(data)
    }
  }

  const fetchTeam = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()
      
      if (error) {
        console.error('Error fetching team:', error)
        // Hvis laget ikke finnes lenger, fjern det fra localStorage
        if (error.code === 'PGRST116') {
          console.log('Team not found, removing from localStorage')
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`team_${venueId}`)
          }
          setTeam(null)
        }
      } else if (data) {
        setTeam(data)
        setTeamName(data.team_name)
        setEntryAnswer(data.entry_answer?.toString() || '')
      }
    } catch (err) {
      console.error('Unexpected error fetching team:', err)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`team_${venueId}`)
      }
      setTeam(null)
    }
  }

  const registerTeam = async () => {
    if (!teamName.trim() || !entryAnswer.trim()) {
      setMessage('Vennligst fyll ut både lagnavn og inngangsspørsmål')
      return
    }
    
    setLoading(true)
    setMessage('')
    
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('id')
        .eq('is_active', true)
        .single()
      
      if (sessionError || !sessionData) {
        setMessage('Ingen aktiv quiz-sesjon funnet')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('teams')
        .insert({
          session_id: sessionData.id,
          venue_id: venueId,
          team_name: teamName.trim(),
          entry_answer: parseInt(entryAnswer)
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          setMessage('Dette lagnavnet er allerede tatt på dette utestedet')
        } else {
          setMessage('Feil ved registrering: ' + error.message)
        }
      } else {
        setTeam(data)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`team_${venueId}`, data.id)
        }
        setMessage('Lag registrert! Du kan nå sende inn poengsum.')
      }
    } catch (error) {
      setMessage('En uventet feil oppstod')
      console.error('Registration error:', error)
    }
    
    setLoading(false)
  }

  const submitScore = async (round: 'round1' | 'round2' | 'bonus', score: string) => {
    if (!team || !score.trim()) return
    
    const scoreNum = parseInt(score)
    if (isNaN(scoreNum) || scoreNum < 0) {
      setMessage('Ugyldig poengsum')
      return
    }
    
    setLoading(true)
    
    const updateData = {
      [`${round}_score`]: scoreNum,
      [`${round}_submitted`]: true
    }

    const { error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', team.id)

    if (error) {
      setMessage('Feil ved innsending: ' + error.message)
    } else {
      const roundNames = {
        round1: 'Runde 1',
        round2: 'Runde 2', 
        bonus: 'Bonus'
      }
      setMessage(`${roundNames[round]} poengsum sendt inn!`)
      fetchTeam(team.id)
    }
    
    setLoading(false)
  }

  // Default colors if venue doesn't have custom branding
  const gradientStart = venue?.background_gradient_start || '#3b82f6'
  const gradientEnd = venue?.background_gradient_end || '#8b5cf6'
  const primaryColor = venue?.primary_color || '#1e40af'
  const secondaryColor = venue?.secondary_color || '#3b82f6'
  const textColor = venue?.text_color || '#ffffff'

  const backgroundStyle = {
    background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
  }

  if (!venue && venueId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
        <div className="text-white text-xl">
          Laster utested...
        </div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={backgroundStyle}>
        <div className="text-white text-xl">Ingen utested funnet</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4" style={backgroundStyle}>
      {/* Custom CSS for venue-specific styling */}
      <style jsx>{`
        .venue-button {
          background-color: ${primaryColor};
          border-color: ${primaryColor};
        }
        .venue-button:hover {
          background-color: ${secondaryColor};
          border-color: ${secondaryColor};
        }
        .venue-button:disabled {
          background-color: #6b7280;
          border-color: #6b7280;
        }
        .venue-input:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 3px ${primaryColor}33;
        }
        .submit-button {
          background-color: ${secondaryColor};
        }
        .submit-button:hover {
          background-color: ${primaryColor};
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
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
        .font-arial {
          font-family: Arial, Helvetica, sans-serif;
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
        {/* Quizlo logo bottom left - clickable */}
        <div className="fixed bottom-8 left-8 z-10">
          <a 
            href="https://quizlo.no" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white text-3xl font-arial font-light hover:text-white/80 hover:scale-105 transition-all duration-200 cursor-pointer inline-block"
          >
            Quizlo
          </a>
        </div>

        {/* Header with logo and title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => router.push('/')}
              className="text-white/80 hover:text-white text-sm"
            >
              ← Tilbake til utested-valg
            </button>
            
            {venue.logo_url && (
              <div className="fixed bottom-8 right-8 z-10">
                <img 
                  src={venue.logo_url} 
                  alt={`${venue.name} logo`}
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}
          </div>
          
          <h1 className="custom-font text-white text-8xl mb-4 tracking-wider">
            TIRSDAGSQUIZEN
          </h1>
        </div>

        {message && (
          <div className={`max-w-2xl mx-auto mb-8 border px-6 py-4 rounded-lg ${
            message.includes('Feil') || message.includes('Ugyldig') 
              ? 'bg-red-100 border-red-400 text-red-700'
              : 'bg-white/90 border-white text-gray-800'
          }`}>
            {message}
            {message.includes('Error fetching team') && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem(`team_${venueId}`)
                      setTeam(null)
                      setMessage('')
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Prøv på nytt (fjern lagret data)
                </button>
              </div>
            )}
          </div>
        )}

        {!team ? (
          /* Registration Form */
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl">
              <div className="space-y-8">
                <div>
                  <label className="block text-xl font-arial font-medium text-gray-700 mb-4">
                    Lagnavn:
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="venue-input font-arial w-full p-4 text-xl text-black border-2 border-gray-300 rounded-xl focus:outline-none transition-all"
                    placeholder="Skriv inn lagnavnet ditt"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-xl font-arial font-medium text-gray-700 mb-4">
                    Inngang:
                  </label>
                  <input
                    type="number"
                    value={entryAnswer}
                    onChange={(e) => setEntryAnswer(e.target.value)}
                    className="venue-input font-arial w-full p-4 text-xl text-black border-2 border-gray-300 rounded-xl focus:outline-none transition-all"
                    placeholder="Svar på inngangsspørsmålet"
                  />
                </div>

                <button
                  onClick={registerTeam}
                  disabled={loading || !teamName.trim() || !entryAnswer.trim()}
                  className="venue-button font-arial w-full text-white p-4 text-xl font-semibold rounded-xl transition-all disabled:cursor-not-allowed"
                >
                  {loading ? 'Registrerer...' : 'Registrer lag'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Score Submission Form */
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl text-center">
              <h3 className="text-3xl font-bold text-gray-800">{team.team_name}</h3>
              <p className="text-xl text-gray-600 mt-2">Total poengsum: {team.total_score}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { round: 'round1', label: 'Runde 1', value: round1Score, setValue: setRound1Score },
                { round: 'round2', label: 'Runde 2', value: round2Score, setValue: setRound2Score },
                { round: 'bonus', label: 'Bonus', value: bonusScore, setValue: setBonusScore }
              ].map(({ round, label, value, setValue }) => (
                <div key={round} className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                  <label className="block text-xl font-medium text-gray-700 mb-4 text-center">
                    {label}:
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={team[`${round}_submitted` as keyof Team] as boolean}
                    className="venue-input w-full p-4 text-xl text-black text-center border-2 border-gray-300 rounded-xl focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="Poeng"
                    min="0"
                  />
                  <button
                    onClick={() => submitScore(round as 'round1' | 'round2' | 'bonus', value)}
                    disabled={loading || (team[`${round}_submitted` as keyof Team] as boolean) || !value.trim()}
                    className="submit-button w-full text-white p-3 text-lg font-semibold rounded-xl transition-all disabled:bg-gray-400 mt-4"
                  >
                    {(team[`${round}_submitted` as keyof Team] as boolean) ? '✓ Sendt inn' : 'Send inn'}
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <a 
                href="/results" 
                className="submit-button inline-block text-white px-12 py-4 text-xl font-semibold rounded-xl transition-all"
              >
                Se resultater
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}