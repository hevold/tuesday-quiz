'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type ViewMode = 'total' | 'venue' | 'region'

export default function Results() {
  const [currentView, setCurrentView] = useState<ViewMode>('total')
  const [venueResults, setVenueResults] = useState<any[]>([])
  const [regionResults, setRegionResults] = useState<any[]>([])
  const [totalResults, setTotalResults] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenueId, setSelectedVenueId] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('results')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchResults()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchResults = async () => {
    try {
      // Fetch all venues
      const { data: venuesData } = await supabase
        .from('venues')
        .select('*')
        .order('name')

      // Fetch venue results
      const { data: venueData } = await supabase
        .from('venue_leaderboard')
        .select('*')
        .order('venue_name', { ascending: true })
        .order('venue_rank', { ascending: true })
      
      // Fetch region results  
      const { data: regionData } = await supabase
        .from('region_leaderboard')
        .select('*')
        .order('region', { ascending: true })
        .order('region_rank', { ascending: true })
      
      // Fetch total results
      const { data: totalData } = await supabase
        .from('total_leaderboard')
        .select('*')
        .order('total_rank', { ascending: true })

      if (venuesData) setVenues(venuesData)

      if (venueData) {
        const groupedByVenue = venueData.reduce((acc: any, curr: any) => {
          if (!acc[curr.venue_name]) {
            acc[curr.venue_name] = {
              venue_id: venuesData?.find(v => v.name === curr.venue_name)?.id,
              teams: []
            }
          }
          acc[curr.venue_name].teams.push(curr)
          return acc
        }, {})
        setVenueResults(Object.entries(groupedByVenue))
      }

      if (regionData) {
        const groupedByRegion = regionData.reduce((acc: any, curr: any) => {
          if (!acc[curr.region]) acc[curr.region] = []
          acc[curr.region].push(curr)
          return acc
        }, {})
        setRegionResults(Object.entries(groupedByRegion))
      }

      if (totalData) setTotalResults(totalData)
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching results:', error)
      setLoading(false)
    }
  }

  const renderTotalResults = () => {
    return (
      <div className="space-y-4">
        <h2 className="text-4xl font-bold mb-8 text-center custom-font">🏆 Totalresultat - Norge</h2>
        {totalResults.slice(0, 20).map((team: any, index: number) => (
          <div key={team.team_name} className={`flex justify-between items-center p-6 rounded-xl backdrop-blur-sm transition-all ${
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
    if (selectedVenueId) {
      // Show specific venue
      const venueEntry = venueResults.find(([venueName, data]: any) => data.venue_id === selectedVenueId)
      if (!venueEntry) return <div className="text-center text-white">Ingen resultater for dette utestedet</div>
      
      const [venueName, data] = venueEntry
      const teams = data.teams

      return (
        <div className="space-y-4">
          <h2 className="text-4xl font-bold mb-8 text-center custom-font">{venueName}</h2>
          {teams.slice(0, 15).map((team: any, index: number) => (
            <div key={team.team_name} className="flex justify-between items-center bg-white/20 hover:bg-white/30 p-6 rounded-xl backdrop-blur-sm transition-all">
              <div className="flex items-center space-x-6">
                <span className="text-2xl font-bold w-8 font-arial">{index + 1}.</span>
                <span className="text-xl font-arial">{team.team_name}</span>
              </div>
              <span className="text-2xl font-bold font-arial">{team.total_score}</span>
            </div>
          ))}
        </div>
      )
    } else {
      // Show all venues overview
      return (
        <div className="space-y-6">
          <h2 className="text-4xl font-bold mb-8 text-center custom-font">Alle utesteder</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venueResults.map(([venueName, data]: any) => {
              const teams = data.teams
              const topTeam = teams[0]
              return (
                <div key={venueName} className="bg-white/20 hover:bg-white/30 p-6 rounded-xl backdrop-blur-sm transition-all cursor-pointer"
                     onClick={() => setSelectedVenueId(data.venue_id)}>
                  <h3 className="text-xl font-bold mb-4 font-arial">{venueName}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-arial">
                      <span>1. {topTeam?.team_name}</span>
                      <span>{topTeam?.total_score}</span>
                    </div>
                    <div className="text-sm opacity-75 font-arial">{teams.length} lag totalt</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  }

  const renderRegionResults = () => {
    if (selectedRegion) {
      // Show specific region
      const regionEntry = regionResults.find(([regionName]: any) => regionName === selectedRegion)
      if (!regionEntry) return <div className="text-center text-white">Ingen resultater for denne regionen</div>
      
      const [regionName, teams] = regionEntry

      return (
        <div className="space-y-4">
          <h2 className="text-4xl font-bold mb-8 text-center custom-font">{regionName} - Region</h2>
          {teams.slice(0, 15).map((team: any, index: number) => (
            <div key={team.team_name} className="flex justify-between items-center bg-white/20 hover:bg-white/30 p-6 rounded-xl backdrop-blur-sm transition-all">
              <div className="flex items-center space-x-6">
                <span className="text-2xl font-bold w-8 font-arial">{index + 1}.</span>
                <div>
                  <div className="text-xl font-arial">{team.team_name}</div>
                  <div className="text-sm opacity-75 font-arial">{team.venue_name}</div>
                </div>
              </div>
              <span className="text-2xl font-bold font-arial">{team.total_score}</span>
            </div>
          ))}
        </div>
      )
    } else {
      // Show all regions overview
      return (
        <div className="space-y-6">
          <h2 className="text-4xl font-bold mb-8 text-center custom-font">Alle regioner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {regionResults.map(([regionName, teams]: any) => {
              const topTeam = teams[0]
              return (
                <div key={regionName} className="bg-white/20 hover:bg-white/30 p-6 rounded-xl backdrop-blur-sm transition-all cursor-pointer"
                     onClick={() => setSelectedRegion(regionName)}>
                  <h3 className="text-xl font-bold mb-4 font-arial">{regionName}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-lg font-arial">
                      <span>1. {topTeam?.team_name}</span>
                      <span>{topTeam?.total_score}</span>
                    </div>
                    <div className="text-sm opacity-75 font-arial">{teams.length} lag totalt</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00A2FF' }}>
        <div className="text-white text-2xl font-arial">Laster resultater...</div>
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
            <h1 className="text-4xl font-bold custom-font mb-4">RESULTATER</h1>
          </div>

          {/* Navigation Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => { setCurrentView('total'); setSelectedVenueId(''); setSelectedRegion(''); }}
              className={`w-full p-4 rounded-xl font-arial font-semibold transition-all ${
                currentView === 'total' ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              🏆 Totalresultat
            </button>

            <button
              onClick={() => { setCurrentView('venue'); setSelectedVenueId(''); setSelectedRegion(''); }}
              className={`w-full p-4 rounded-xl font-arial font-semibold transition-all ${
                currentView === 'venue' && !selectedVenueId ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              🏢 Alle utesteder
            </button>

            {/* Individual Venue Buttons */}
            {currentView === 'venue' && (
              <div className="pl-4 space-y-2">
                {venues.map(venue => (
                  <button
                    key={venue.id}
                    onClick={() => setSelectedVenueId(venue.id)}
                    className={`w-full p-3 rounded-lg font-arial text-sm transition-all ${
                      selectedVenueId === venue.id ? 'bg-white text-blue-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {venue.name}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setCurrentView('region'); setSelectedVenueId(''); setSelectedRegion(''); }}
              className={`w-full p-4 rounded-xl font-arial font-semibold transition-all ${
                currentView === 'region' && !selectedRegion ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              🌍 Alle regioner
            </button>

            {/* Individual Region Buttons */}
            {currentView === 'region' && (
              <div className="pl-4 space-y-2">
                {regionResults.map(([regionName]: any) => (
                  <button
                    key={regionName}
                    onClick={() => setSelectedRegion(regionName)}
                    className={`w-full p-3 rounded-lg font-arial text-sm transition-all ${
                      selectedRegion === regionName ? 'bg-white text-blue-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {regionName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-8">
            <a 
              href="/" 
              className="block w-full bg-white/20 text-center text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all font-arial"
            >
              ← Tilbake til quiz
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