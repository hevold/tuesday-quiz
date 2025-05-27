import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check localStorage first (for immediate feedback)
      const localAuth = localStorage.getItem('adminAuth')
      
      // Then verify with server
      const response = await fetch('/api/admin/auth')
      const data = await response.json()
      
      if (data.authenticated && localAuth === 'true') {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        localStorage.removeItem('adminAuth')
        router.push('/admin/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      router.push('/admin/login')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('adminAuth')
    document.cookie = 'adminAuth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    setIsAuthenticated(false)
    router.push('/admin/login')
  }

  return { isAuthenticated, isLoading, logout }
}