'use client'

import React, { useEffect, useState } from 'react'
import supabase from '@/app/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PerfilPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [items,   setItems]   = useState<any[]>([])
  const [chains,     setChains]     = useState<any[]>([])
  const [avgRating,  setAvgRating]  = useState<number | null>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()

    const { data: itemsData } = await supabase
      .from('items').select('*').eq('user_id', user.id)

    const { data: chainsData } = await supabase
      .from('chains')
      .select('id, initial_item_id, steps_count')
      .eq('creator_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)

    const rawChains = chainsData || []
    if (rawChains.length > 0) {
      const itemIds = rawChains.map((c: any) => c.initial_item_id).filter(Boolean)
      const { data: chainItems } = await supabase
        .from('items').select('id, title').in('id', itemIds)
      const titleMap: Record<number, string> = {}
      chainItems?.forEach((i: any) => { titleMap[i.id] = i.title })
      setChains(rawChains.map((c: any) => ({
        ...c,
        initial_item_title: titleMap[c.initial_item_id] ?? null,
      })))
    }

    const { data: ratingsData } = await supabase
      .from('ratings')
      .select('score')
      .eq('rated_id', user.id)

    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((sum: number, r: any) => sum + r.score, 0) / ratingsData.length
      setAvgRating(avg)
    }

    setProfile(profileData)
    setItems(itemsData || [])
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 20, background: '#FDF8F3', minHeight: '100vh' }}>Cargando...</div>

  const score = Math.min(100, items.length * 4)

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>Perfil</h1>
        <div style={styles.settingsBtn} onClick={() => router.push('/perfil/edit')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
      </div>

      {/* PERFIL + STATS + LOGROS — sobre card blanca */}
      <div style={styles.contentCard}>
      <div style={styles.topSection}>
        <div style={styles.avatarWrap}>
          <img
            src={profile?.avatar_url || '/images/avatar.svg'}
            style={styles.avatar}
            alt="avatar"
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={styles.name}>{profile?.name || profile?.username || 'Usuario'}</div>
          <div style={styles.username}>@{profile?.username || 'user'}</div>
        </div>

        <div style={styles.scoreBox}>
          <div style={styles.score}>{score}</div>
          <div style={styles.scoreLabel}>Confiable</div>
        </div>
      </div>

      {/* STATS — directo sobre fondo crema */}
      <div style={styles.stats}>
        <Stat label="Publicaciones" value={items.length} />
        <div style={styles.statDivider} />
        <Stat label="Calificación" value={avgRating ? avgRating.toFixed(1) : '—'} />
        <div style={styles.statDivider} />
        <Stat label="Reseñas" value="0" />
      </div>

      </div>{/* /contentCard */}

      {/* MIS CADENAS */}
      <div style={styles.chainsSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTitle}>Mis cadenas</span>
          <span style={styles.link} onClick={() => router.push('/mis-cadenas')}>Ver todas</span>
        </div>

        {chains.length === 0 ? (
          <div style={styles.chainsEmpty}>
            <p style={styles.chainsEmptyText}>Aún no tienes cadenas activas</p>
            <button style={styles.chainsBtn} onClick={() => router.push('/crear')}>
              Publicar algo para empezar
            </button>
          </div>
        ) : (
          <div style={styles.chainsList}>
            {chains.map((c: any) => (
              <ChainRow key={c.id} chain={c} onClick={() => router.push(`/chain/${c.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* MENÚ */}
      <div style={styles.menu}>
        <MenuItem label="Mis publicaciones" type="publicaciones" onClick={() => router.push('/perfil/publicaciones')} />
        <MenuItem label="Mis reseñas"       type="resenas"       onClick={() => router.push('/perfil/resenas')} />
        <MenuItem label="Ayuda y soporte"   type="ayuda"         onClick={() => alert('Soporte próximamente')} />
        <MenuItem label="Configuración"     type="config"        onClick={() => alert('Próximamente')} last />
      </div>

    </div>
  )
}

/* ── Sub-componentes ── */

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

function Achievement({ type, title }: { type: string; title: string }) {
  const icons: Record<string, React.ReactElement> = {
    'primer-intercambio': (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 7h10M17 7l-3-3M17 7l-3 3"/>
        <path d="M17 17H7M7 17l3-3M7 17l3 3"/>
      </svg>
    ),
    'comunidad-activa': (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    'confiable': (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  }

  return (
    <div style={styles.achievement}>
      <div style={styles.achievementCircle}>
        {icons[type]}
      </div>
      <div style={styles.achievementText}>{title}</div>
    </div>
  )
}

function MenuItem({ label, type, onClick, last = false }: {
  label: string; type: string; onClick: () => void; last?: boolean
}) {
  const icons: Record<string, React.ReactElement> = {
    publicaciones: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    resenas: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    ayuda: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    config: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  }

  return (
    <div
      style={{ ...styles.menuItem, borderBottom: last ? 'none' : '1px solid #F0EBE3' }}
      onClick={onClick}
    >
      <div style={styles.menuLeft}>
        <div style={styles.menuIcon}>{icons[type]}</div>
        <span style={styles.menuLabel}>{label}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C4BAB1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}

const trunc = (s: string, n = 20) => s && s.length > n ? s.slice(0, n) + '…' : (s ?? '')

function ChainRow({ chain, onClick }: { chain: any; onClick: () => void }) {
  return (
    <div style={styles.chainRow} onClick={onClick}>
      <div style={styles.chainIconWrap}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h10M17 7l-3-3M17 7l-3 3"/>
          <path d="M17 17H7M7 17l3-3M7 17l3 3"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.chainTitle}>{trunc(chain.initial_item_title ?? `Cadena #${chain.id}`)}</div>
        <div style={styles.chainSteps}>{chain.steps_count} intercambio{chain.steps_count !== 1 ? 's' : ''}</div>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4BAB1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  )
}

/* ── Estilos ── */

const styles: any = {
  container: {
    padding: '16px 16px 120px',
    background: '#FDF8F3',
    minHeight: '100vh',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1A2744',
    margin: 0,
  },

  settingsBtn: {
    cursor: 'pointer',
    padding: 4,
  },

  /* Card blanca que agrupa perfil + stats + logros */
  contentCard: {
    background: '#FFFFFF',
    borderRadius: 20,
    padding: '20px 16px',
    marginBottom: 16,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },

  topSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },

  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    background: '#EDE7DF',
  },

  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  name: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1A2744',
    lineHeight: 1.2,
  },

  username: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 3,
  },

  scoreBox: {
    background: '#DCFCE7',
    padding: '10px 16px',
    borderRadius: 14,
    textAlign: 'center',
    minWidth: 76,
    flexShrink: 0,
  },

  score: {
    fontSize: 24,
    fontWeight: 700,
    color: '#16A34A',
    lineHeight: 1,
  },

  scoreLabel: {
    fontSize: 11,
    color: '#16A34A',
    marginTop: 3,
    fontWeight: 500,
  },

  /* Stats — sobre fondo crema */
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 4,
  },

  statDivider: {
    width: 1,
    height: 36,
    background: '#E5DDD5',
  },

  stat: {
    textAlign: 'center',
    flex: 1,
  },

  statValue: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1A2744',
    lineHeight: 1,
  },

  statLabel: {
    fontSize: 13,
    color: '#1A2744',
    marginTop: 5,
  },

  /* Logros */
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A2744',
  },

  link: {
    color: '#F97316',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 500,
  },

  achievements: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  achievement: {
    alignItems: 'center',
    textAlign: 'center',
    flex: 1,
  },

  achievementCircle: {
    width: 60,
    height: 60,
    borderRadius: '50%',
    background: '#FDE8DC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 8px',
  },

  achievementText: {
    fontSize: 13,
    color: '#1A2744',
    lineHeight: 1.3,
    marginTop: 2,
  },

  /* Mis cadenas */
  chainsSection: {
    marginBottom: 16,
  },

  chainsEmpty: {
    background: '#FFFFFF',
    borderRadius: 14,
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },

  chainsEmptyText: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#1A2744',
  },

  chainsBtn: {
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    padding: '12px 28px',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },

  chainsList: {
    background: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },

  chainRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '13px 16px',
    borderBottom: '1px solid #F0EBE3',
    cursor: 'pointer',
  },

  chainIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#FFF5F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  chainTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1A2744',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  chainSteps: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  /* Menú */
  menu: {
    background: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },

  menuItem: {
    padding: '16px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },

  menuLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },

  menuIcon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },

  menuLabel: {
    fontSize: 15,
    color: '#1A2744',
    fontWeight: 500,
  },
}
