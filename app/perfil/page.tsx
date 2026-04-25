'use client'

import { useEffect, useState } from 'react'
import supabase from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PerfilPage() {
  const router = useRouter()

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

    const { data: itemsData } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)

    setProfile(profileData)
    setItems(itemsData || [])
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando...</div>
  }

  const score = Math.min(100, items.length * 4)

  return (
    <div style={styles.container}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Perfil</h1>

        <div
          style={styles.icon}
          onClick={() => router.push('/perfil/editar')}
        >
          ⚙️
        </div>
      </div>

      {/* TOP INFO */}
      <div style={styles.topSection}>
        
        <img
          src={
            profile?.avatar_url ||
            'https://via.placeholder.com/100?text=User'
          }
          style={styles.avatar}
        />

        <div style={{ flex: 1 }}>
          <div style={styles.name}>
            {profile?.name || 'Usuario'}
          </div>

          <div style={styles.username}>
            @{profile?.username || 'user'}
          </div>
        </div>

        {/* SCORE */}
        <div style={styles.scoreBox}>
          <div style={styles.score}>{score}</div>
          <div style={styles.scoreLabel}>Confiable</div>
        </div>
      </div>

      {/* STATS */}
      <div style={styles.stats}>
        <Stat label="Intercambios" value={items.length} />
        <Divider />
        <Stat label="Calificación" value="4.9" />
        <Divider />
        <Stat label="Reseñas" value="0" />
      </div>

      {/* LOGROS */}
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>Logros</div>
        <div style={styles.link}>Ver todos</div>
      </div>

      <div style={styles.achievements}>
        <Achievement title="Primer intercambio" />
        <Achievement title="Comunidad activa" />
        <Achievement title="Confiable" />
      </div>

      {/* MENU */}
      <div style={styles.menu}>
        <MenuItem
          label="Mis publicaciones"
          onClick={() => router.push('/perfil/publicaciones')}
        />
        <MenuItem
          label="Mis reseñas"
          onClick={() => router.push('/perfil/resenas')}
        />
        <MenuItem
          label="Ayuda y soporte"
          onClick={() => alert('Soporte próximamente')}
        />
        <MenuItem
          label="Configuración"
          onClick={() => router.push('/perfil/editar')}
        />
      </div>
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

function Divider() {
  return <div style={styles.divider} />
}

function Achievement({ title }: any) {
  return (
    <div style={styles.achievement}>
      <div style={styles.achievementIcon}>🏆</div>
      <div style={styles.achievementText}>{title}</div>
    </div>
  )
}

function MenuItem({ label, onClick }: any) {
  return (
    <div style={styles.menuItem} onClick={onClick}>
      <div>{label}</div>
      <div style={{ color: '#aaa' }}>›</div>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 26,
    margin: 0,
  },

  icon: {
    cursor: 'pointer',
  },

  topSection: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    objectFit: 'cover',
  },

  name: {
    fontSize: 18,
    fontWeight: 700,
  },

  username: {
    fontSize: 13,
    color: '#777',
  },

  scoreBox: {
    background: '#d1e7d6',
    padding: 12,
    borderRadius: 16,
    textAlign: 'center',
    minWidth: 70,
  },

  score: {
    fontSize: 20,
    fontWeight: 700,
  },

  scoreLabel: {
    fontSize: 12,
  },

  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
  },

  divider: {
    width: 1,
    height: 30,
    background: '#eee',
  },

  stat: {
    textAlign: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: 700,
  },

  statLabel: {
    fontSize: 12,
    color: '#777',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 24,
    alignItems: 'center',
  },

  sectionTitle: {
    fontWeight: 700,
  },

  link: {
    color: '#F97316',
    fontSize: 13,
    cursor: 'pointer',
  },

  achievements: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  achievement: {
    alignItems: 'center',
    textAlign: 'center',
    width: '30%',
  },

  achievementIcon: {
    fontSize: 24,
  },

  achievementText: {
    fontSize: 12,
    marginTop: 6,
  },

  menu: {
    marginTop: 20,
    background: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },

  menuItem: {
    padding: 14,
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
}