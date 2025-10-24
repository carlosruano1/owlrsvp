'use client'

import { useState, useEffect } from 'react'
import AdminNavigation from '@/components/AdminNavigation'
import ScrollToTop from '@/components/ScrollToTop'

export default function CreateEventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          setIsLoggedIn(true)
        }
      } catch (err) {
        // Not logged in
      }
    }
    checkAuth()
  }, [])

  return (
    <>
      {isLoggedIn && <AdminNavigation />}
      <div className={isLoggedIn ? "pt-16" : ""}>
        {children}
      </div>
      <ScrollToTop />
    </>
  )
}

