'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'

interface ArchivedTeam {
  team_name: string
  venue_name: string
  region: string
  total_score: number
  round1_score: number
  round2_score: number
  bonus_score: number
  venue_rank?: number
  total_rank?: number
}

interface ArchiveInfo {
  quiz_date: string
  quiz_week: number
  quiz_year: number
  quiz_number: number
  total_teams: number
  total_venues: number
}

export default function ArchivedResults() {
  const params = useParams()
  const archiveId = params.archiveId as string
  
  const [archiveInfo, setArchiveInfo] = useState<ArchiveInfo | null>(null)
  const [totalResults, setTotalResults] = useState<ArchivedTeam[]>([])
  const [venueResults, setVenueResults] = useState<any[]>([])
  const [regionResults, setRegionResults] = useState<any[]>([])
  const [currentView, setCurrentView] = useState<'total' | 'venue' | 'region'>('total')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (archiveId) {
      fetchArchivedResults()
    }
  }, [archiveId])

  const fetchArchivedResults = async () => {
    try {
      // Få arkiv-info
      const { data: archiveData } = await supabase
        .from('quiz_archives')
        .select('*')
        .eq('id', archiveId)
        .single()

      if (archiveData) {
        setArchiveInfo(archiveData)
      }

      // Få arkiverte resultater
      const { data: totalData } = await supabase
        .from('archived_total_leaderboard')
        .select('*')
        .eq('archive_id', archiveId)

      const { data: venueData } = await supabase
        .from('archived_venue_leaderboard')
        .select('*')
        .eq('archive_id', archiveId)

      if (totalData) {
        setTotalResults(totalData)
      }

      if (venueData) {
        const groupedByVenue = venueData.reduce((acc: any, curr: any) => {
          if (!acc[curr.venue_name]) acc[curr.venue_name] = []
          acc[curr.venue_name].push(curr)
          return acc
        }, {})
        setVenueResults(Object.entries(groupedByVenue))

        const groupedByRegion = venueData.reduce((acc: any, curr: any) => {
          if (!acc[curr.region]) acc[curr.region] = []
          acc[curr.region].push(curr)
          return acc
        }, {})
        setRegionResults(Object.entries(groupedByRegion))
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching archived results:', error)
      setLoading(false)
    }
  }

  const renderTotalResults = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-4xl font-bold mb-8 text-center custom-font">🏆 Totalresultat</h2>
        {totalResults.slice(0, 20).map((team: ArchivedTeam, index: number) => (
          <div key={`${team.team_name}-${team.venue_name}`} className={`flex justify-between items-center p-6 rounded-xl backdrop-blur-sm transition-all ${
            index === 0 ? 'bg-yellow-400/30 border-2 border-yellow-400 shadow-lg scale-105' :
            index === 1 ? 'bg-gray-300/30 border-2 border-gray-300 shadow-md' :
            index === 2 ? 'bg-yellow-600/30 border-2 border-yellow-600 shadow-md' :
            'bg-white/20 hover:bg-white/30'
          }`}>
            <div className="flex items-center space-x-6">
              <span className="text-3xl font-bold w-12 font-arial">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
              </span>
              <div>
                <div className="text-2xl font-bold font-arial">{team.team_name}</div>
                <div className="text-lg opacity-75 font-arial">{team.venue_name}, {team.region}</div>
              </div>
            </div>
            <span className="text-3xl font-bold font-arial">{team.total_score}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderVenueResults = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-4xl font-bold mb-8 text-center custom-font">Resultater per utested</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venueResults.map(([venueName, teams]: any) => (
            <div key={venueName} className="bg-white/20 p-6 rounded-xl backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4 font-arial text-center">{venueName}</h3>
              <div className="space-y-2">
                {teams.slice(0, 5).map((team: any, index: number) => (
                  <div key={team.team_name} className="flex justify-between text-sm font-arial">
                    <span>{index + 1}. {team.team_name}</span>
                    <span>{team.total_score}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRegionResults = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-4xl font-bold mb-8 text-center custom-font">Resultater per region</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {regionResults.map(([regionName, teams]: any) => (
            <div key={regionName} className="bg-white/20 p-6 rounded-xl backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4 font-arial text-center">{regionName}</h3>
              <div className="space-y-3">
                {teams.slice(0, 10).map((team: any, index: number) => (
                  <div key={`${team.team_name}-${team.venue_name}`} className="flex justify-between items-center">
                    <div>
                      <div className="font-arial font-medium">{index + 1}. {team.team_name}</div>
                      <div className="text-sm opacity-75 font-arial">{team.venue_name}</div>
                    </div>
                    <span className="font-arial font-bold">{team.total_score}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00A2FF' }}>
        <div className="text-white text-2xl font-arial">Laster arkiverte resultater...</div>
      </div>
    )
  }

  if (!archiveInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00A2FF' }}>
        <div className="text-white text-2xl font-arial">Arkiv ikke funnet</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#00A2FF' }}>
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

      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-black/20 backdrop-blur-sm p-6 space-y-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold custom-font mb-2">QUIZ #{archiveInfo.quiz_number}</h1>
            <div className="text-sm font-arial opacity-75">
              <div>{new Date(archiveInfo.quiz_date).toLocaleDateString('nb-NO', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
              <div>Uke {archiveInfo.quiz_week}, {archiveInfo.quiz_year}</div>
              <div>{archiveInfo.total_teams} lag, {archiveInfo.total_venues} utesteder</div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setCurrentView('total')}
              className={`w-full p-4 rounded-xl font-arial font-semibold transition-all ${
                currentView === 'total' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              🏆 Totalresultat
            </button>

            <button
              onClick={() => setCurrentView('venue')}
              className={`w-full p-4 rounded-xl font-arial font-semibold transition-all ${
                currentView === 'venue' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              🏢 Per utested
            </button>

            <button
              onClick={() => setCurrentView('region')}
              className={`w-full p-4 rounded-xl font-arial font-semibold transition-all ${
                currentView === 'region' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              🌍 Per region
            </button>
          </div>

          <div className="pt-8 space-y-3">
            <a 
              href="/results"
              className="block w-full bg-white/20 text-center text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all font-arial"
            >
              Se gjeldende resultater
            </a>
            <a 
              href="/admin/archive" 
              className="block w-full bg-white/20 text-center text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all font-arial"
            >
              ← Tilbake til arkiv-admin
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {currentView === 'total' && renderTotalResults()}
            {currentView === 'venue' && renderVenueResults()}
            {currentView === 'region' && renderRegionResults()}
          </div>
        </div>
      </div>
    </div>
  )
}