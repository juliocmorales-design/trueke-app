'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from './lib/supabase'
import Feed from './components/feed/Feed'

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    checkFlow()
  }, [])

  const checkFlow = async () => {
    try {
      // 🔥 1. ONBOARDING
      const seen = localStorage.getItem('onboarding_seen')

      if (!seen) {
        router.replace('/onboarding')
        return
      }

      // 🔥 2. AUTH
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.replace('/login')
        return
      }

      // 🔥 3. PERFIL
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // ❌ NO EXISTE PERFIL
      if (!profile) {
        router.replace('/perfil/setup')
        return
      }

      // 🔥 PERFIL INCOMPLETO (CLAVE)
      if (profile.name === 'Usuario') {
        router.replace('/perfil/setup')
        return
      }

      // ✅ TODO OK → mostrar app
      setReady(true)
    } catch (err) {
      console.error('FLOW ERROR:', err)
      router.replace('/login')
    }
  }

  if (!ready) {
    return (
      <div style={styles.loading}>
        Cargando...
      </div>
    )
  }

  return <Feed />
}

const styles: any = {
  loading: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
  },
}