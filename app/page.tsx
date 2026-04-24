'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from './lib/supabase'

export default function Home() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    checkFlow()
  }, [])

  const checkFlow = async () => {
    try {
      const seen = localStorage.getItem('onboarding_seen')
      if (!seen) {
        router.replace('/onboarding')
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.name === 'Usuario') {
        router.replace('/perfil/setup')
        return
      }

      const { data } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      setItems(data || [])
      setReady(true)

    } catch (err) {
      console.error(err)
      router.replace('/login')
    }
  }

  if (!ready) {
    return <div style={styles.loading}>Cargando...</div>
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.location}>
            <svg viewBox="0 0 24 24" fill="#F97316" width={20}>
              <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"/>
            </svg>
            Monterrey
          </div>

          <div style={styles.icons}>
            <svg viewBox="0 0 24 24" stroke="#1E1E1E" fill="none" strokeWidth="2" width={20}>
              <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18"/>
            </svg>

            <div onClick={() => router.push('/mensajes')}>
              <svg viewBox="0 0 24 24" stroke="#1E1E1E" fill="none" strokeWidth="2" width={20}>
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7"/>
              </svg>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div style={styles.search}>
          <svg viewBox="0 0 24 24" stroke="#6F7A82" fill="none" strokeWidth="2" width={18}>
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16" y2="16"/>
          </svg>
          Buscar objetos o personas...
        </div>

        {/* CERCA */}
        <Section title="Cerca de ti" />

        <div style={styles.grid}>
          {items.slice(0, 2).map((item) => (
            <Card key={item.id} router={router} item={item} />
          ))}
        </div>

        {/* RECOMENDADOS */}
        <Section title="Recomendados" right="Nuevo" />

        <div style={styles.grid}>
          {items.slice(2, 6).map((item) => (
            <Card key={item.id} router={router} item={item} />
          ))}
        </div>

      </div>
    </div>
  )
}

function Section({ title, right = 'Ver todo' }: any) {
  return (
    <div style={styles.section}>
      <div style={styles.title}>
        <strong>{title}</strong>
        <span style={styles.link}>{right}</span>
      </div>
    </div>
  )
}

function getImage(item: any) {
  try {
    if (!item.images) return null

    // array válido
    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images[0]
    }

    // string JSON
    if (typeof item.images === 'string') {
      const parsed = JSON.parse(item.images)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0]
      }
    }

    return null
  } catch {
    return null
  }
}

function Card({ router, item }: any) {

  const image = getImage(item)

  return (
    <div
      style={styles.card}
      onClick={() => router.push(`/item/${item.id}`)}
    >
      <img
        src={image || '/placeholder.png'}
        style={styles.image}
        onError={(e: any) => {
          e.currentTarget.src = '/placeholder.png'
        }}
      />

      <div style={styles.cardBody}>
        <div style={styles.name}>{item.title}</div>
        <div style={styles.sub}>{item.description}</div>
      </div>
    </div>
  )
}

const styles: any = {
  loading: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  wrapper: {
    background: '#EDE7E1',
    display: 'flex',
    justifyContent: 'center',
    padding: 20,
  },

  container: {
    width: '100%',
    maxWidth: 500,
    background: '#F6F3F0',
    borderRadius: 30,
    padding: 20,
    minHeight: '100vh',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  location: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
  },

  icons: {
    display: 'flex',
    gap: 15,
  },

  search: {
    marginTop: 15,
    background: '#EFE7E0',
    borderRadius: 25,
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#6F7A82',
  },

  section: {
    marginTop: 20,
  },

  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  link: {
    color: '#F97316',
    fontSize: 14,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginTop: 10,
  },

  card: {
    background: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    cursor: 'pointer',
  },

  image: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    background: '#ddd',
  },

  cardBody: {
    padding: 10,
  },

  name: {
    fontWeight: 600,
  },

  sub: {
    fontSize: 13,
    color: '#6F7A82',
  },
}