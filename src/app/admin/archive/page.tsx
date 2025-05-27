'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAdminAuth } from '../../../hooks/useAdminAuth'

interface Archive {
  archive_id: string
  quiz_date: string
  quiz_week: number
  quiz_year: number
  quiz_number: number
  quiz_title: string
  total_teams: number
  total_venues: number
  winner_team: string
  winner_venue: string
  winner_score: number
  archived_at: string
}

export default function ArchiveAdmin() {
  const { isAuthenticated, isLoading, logout } = useAdminAuth()
  const [archives, setArchives] = useState<Archive[]>([])
  const [currentStats, setCurrentStats] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState('')
  const [message, setMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      fetchArchives()
      fetchCurrentStats()
    }
  }, [isAuthenticated])

  const fetchArchives = async () => {
    try {
      const { data, error } = await supabase.rpc('get_quiz_archives')
      if (error) throw error
      setArchives(data || [])
    } catch (error) {
      console.error('Error fetching archives:', error)
    }
  }

  const fetchCurrentStats = async () => {
    try {
      // Få gjeldende sesjon stats
      const { data: session } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('is_active', true)
        .single()

      if (session) {
        const { data: teams } = await supabase
          .from('teams')
          .select('id, venue_id')
          .eq('session_id', session.id)

        const { data: venues } = await supabase
          .from('teams')
          .select('venue_id')
          .eq('session_id', session.id)

        const uniqueVenues = venues ? [...new Set(venues.map(t => t.venue_id))].length : 0

        setCurrentStats({
          session_date: session.quiz_date,
          total_teams: teams?.length || 0,
          active_venues: uniqueVenues,
          session_id: session.id
        })
      }
    } catch (error) {
      console.error('Error fetching current stats:', error)
    }
  }

  const archiveCurrentQuiz = async () => {
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.rpc('archive_current_quiz_and_start_new')
      
      if (error) throw error

      const result = data
      if (result.success) {
        setMessage(`✅ ${result.quiz_title} arkivert! ${result.archived_teams} lag fra ${result.archived_venues} utesteder arkivert. Ny quiz startet.`)
        setShowConfirm(false)
        await fetchArchives()
        await fetchCurrentStats()
      } else {
        setMessage(`❌ Feil: ${result.message}`)
      }
    } catch (error: any) {
      setMessage(`❌ Feil ved arkivering: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteArchive = async (archiveId: string, quizTitle: string) => {
    setDeleteLoading(archiveId)
    setMessage('')

    try {
      const { data, error } = await supabase.rpc('delete_quiz_archive', { archive_uuid: archiveId })
      
      if (error) throw error

      const result = data
      if (result.success) {
        setMessage(`✅ ${result.deleted_archive} slettet! ${result.deleted_teams} lag fjernet.`)
        setDeleteConfirm('')
        await fetchArchives()
      } else {
        setMessage(`❌ Feil: ${result.message}`)
      }
    } catch (error: any) {
      setMessage(`❌ Feil ved sletting: ${error.message}`)
    } finally {
      setDeleteLoading('')
    }
  }

  const viewArchivedResults = (archiveId: string, quizNumber: number, quizTitle: string) => {
    window.open(`/results/archive/${archiveId}`, '_blank')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quiz Arkiv Administration</h1>
            <p className="text-gray-600">Administrer ukentlige quiz-arkiver og start nye quiz-økter</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logg ut
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-700 border border-green-300' : 
            'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Current Quiz Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Gjeldende Quiz Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{currentStats.total_teams}</div>
              <div className="text-sm text-gray-600">Registrerte lag</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{currentStats.active_venues}</div>
              <div className="text-sm text-gray-600">Aktive utesteder</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {currentStats.session_date ? formatDate(currentStats.session_date) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Quiz-dato</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                #{archives.length > 0 ? (archives[0].quiz_number || 0) + 1 : 1}
              </div>
              <div className="text-sm text-gray-600">Neste quiz-nummer</div>
            </div>
          </div>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={currentStats.total_teams === 0}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              🗄️ Arkiver gjeldende quiz og start ny uke
            </button>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">⚠️ Bekreft arkivering</h3>
              <p className="text-orange-700 mb-4">
                Dette vil arkivere alle {currentStats.total_teams} lag som Quiz #{archives.length > 0 ? (archives[0].quiz_number || 0) + 1 : 1} og starte en helt ny quiz-økt. 
                Handlingen kan ikke angres.
              </p>
              <div className="space-x-4">
                <button
                  onClick={archiveCurrentQuiz}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  {loading ? 'Arkiverer...' : 'Ja, arkiver og start ny'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Avbryt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Archives History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quiz-arkiv Historikk</h2>
          
          {archives.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen arkiverte quiz-økter ennå</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left">Quiz</th>
                    <th className="px-4 py-3 text-left">Dato</th>
                    <th className="px-4 py-3 text-left">Lag</th>
                    <th className="px-4 py-3 text-left">Utesteder</th>
                    <th className="px-4 py-3 text-left">Vinner</th>
                    <th className="px-4 py-3 text-left">Poeng</th>
                    <th className="px-4 py-3 text-left">Arkivert</th>
                    <th className="px-4 py-3 text-left">Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {archives.map((archive) => (
                    <tr key={archive.archive_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">#{archive.quiz_number}</div>
                        <div className="text-sm text-gray-500">Uke {archive.quiz_week}, {archive.quiz_year}</div>
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(archive.quiz_date)}
                      </td>
                      <td className="px-4 py-3 font-medium">{archive.total_teams}</td>
                      <td className="px-4 py-3">{archive.total_venues}</td>
                      <td className="px-4 py-3">
                        {archive.winner_team ? (
                          <div>
                            <div className="font-medium">{archive.winner_team}</div>
                            <div className="text-sm text-gray-500">{archive.winner_venue}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Ingen lag</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold">{archive.winner_score || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(archive.archived_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewArchivedResults(archive.archive_id, archive.quiz_number, archive.quiz_title)}
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                          >
                            👁️ Se resultater
                          </button>
                          
                          {deleteConfirm === archive.archive_id ? (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => deleteArchive(archive.archive_id, archive.quiz_title)}
                                disabled={deleteLoading === archive.archive_id}
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:bg-gray-400"
                              >
                                {deleteLoading === archive.archive_id ? '...' : '✓'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm('')}
                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(archive.archive_id)}
                              className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                            >
                              🗑️ Slett
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/admin"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            ← Tilbake til Admin
          </a>
        </div>
      </div>
    </div>
  )
}