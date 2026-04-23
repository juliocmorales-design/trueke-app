'use client'

import { useEffect, useState } from 'react'
import supabase from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PerfilPage() {
  const router = useRouter()

  const [tab, setTab] = useState<'objetos' | 'cadenas'>('objetos')
  const [profile, setProfile] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)

    const { data: itemsData } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)

    setItems(itemsData || [])

    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando...</div>
  }

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <img
          src={
            profile?.avatar_url ||
            'https://via.placeholder.com/100?text=User'
          }
          style={styles.avatar}
        />

        <div>
          <div style={styles.name}>
            {profile?.name || 'Usuario'}
          </div>

          <div style={styles.username}>
            @{profile?.username || 'user'}
          </div>

          <div style={styles.trust}>
            {items.length * 5} · Confiable
          </div>

          <button
            onClick={() => router.push('/perfil/edit')}
            style={styles.editBtn}
          >
            ✏️ Editar perfil
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={styles.stats}>
        <Stat label="Intercambios" value={items.length} />
        <Stat label="Calificación" value="4.9" />
        <Stat label="Reseñas" value="0" />
      </div>

      {/* TABS */}
      <div style={styles.tabs}>
        <button
          style={tab === 'objetos' ? styles.tabActive : styles.tab}
          onClick={() => setTab('objetos')}
        >
          Objetos
        </button>

        <button
          style={tab === 'cadenas' ? styles.tabActive : styles.tab}
          onClick={() => setTab('cadenas')}
        >
          Cadenas
        </button>
      </div>

      {/* OBJETOS */}
      {tab === 'objetos' && (
        <div style={styles.grid}>
          {items.map((item) => {
            const image =
              Array.isArray(item.images) && item.images.length > 0
                ? item.images[0]
                : '/images/placeholder.jpg'

            return (
              <div key={item.id} style={styles.card}>
                <img src={image} style={styles.image} />
                <div style={styles.itemTitle}>
                  {item.title}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: any) {
  return (
    <div style={styles.stat}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

const styles: any = {
  container: {
    padding: 16,
    paddingBottom: 120,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    objectFit: 'cover',
    background: '#ddd',
  },

  name: {
    fontSize: 18,
    fontWeight: 700,
  },

  username: {
    fontSize: 13,
    color: '#777',
  },

  trust: {
    fontSize: 13,
    color: '#22C55E',
  },

  editBtn: {
    marginTop: 8,
    fontSize: 13,
    color: '#F97316',
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
  },

  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 16,
  },

  stat: {
    textAlign: 'center',
  },

  statValue: {
    fontWeight: 600,
  },

  statLabel: {
    fontSize: 12,
    color: '#777',
  },

  tabs: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
  },

  tab: {
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid #ddd',
    background: '#fff',
  },

  tabActive: {
    padding: '8px 12px',
    borderRadius: 10,
    border: 'none',
    background: '#F97316',
    color: '#fff',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },

  card: {
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
  },

  image: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
  },

  itemTitle: {
    padding: 8,
    fontSize: 13,
    fontWeight: 600,
  },
}