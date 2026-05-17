'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        router.replace('/login?error=confirmation_failed')
        return
      }

      const user = data.session.user

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username) {
        router.replace('/')
      } else {
        router.replace('/onboarding')
      }
    }

    handleCallback()
  }, [])

  return (
    <div style={{
      minHeight: '100svh',
      background: '#FAF3ED',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <img src="/images/logo.png" style={{ width: 120 }} />
      <p style={{
        fontSize: 16,
        color: '#1A2744',
        fontWeight: 600,
        margin: 0,
      }}>
        Verificando tu cuenta...
      </p>
    </div>
  )
}
