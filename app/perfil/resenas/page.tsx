'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'

type Rating = {
  id: string
  score: number
  comment: string | null
  created_at: string
  rater_id: string
  raterName: string
  raterAvatar: string | null
}

function Stars({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= score ? '#F97316' : 'none'}
          stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MisResenasPage() {
  const router = useRouter()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) { router.replace('/login'); return }

    const { data: rawRatings } = await supabase
      .from('ratings')
      .select('id, score, comment, created_at, rater_id')
      .eq('rated_id', user.id)
      .order('created_at', { ascending: false })

    if (!rawRatings || rawRatings.length === 0) {
      setRatings([])
      setLoading(false)
      return
    }

    const raterIds = [...new Set(rawRatings.map((r: any) => r.rater_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', raterIds)

    const profileMap: Record<string, any> = {}
    profiles?.forEach((p: any) => { profileMap[p.id] = p })

    setRatings(rawRatings.map((r: any) => ({
      ...r,
      raterName:   profileMap[r.rater_id]?.username ?? 'Usuario',
      raterAvatar: profileMap[r.rater_id]?.avatar_url ?? null,
    })))
    setLoading(false)
  }

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <h1 style={styles.title}>Mis reseñas</h1>
        <div style={{ width: 40 }} />
      </div>

      {loading ? (
        <div style={styles.center}>Cargando...</div>
      ) : ratings.length === 0 ? (
        <div style={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1C8BE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <p style={styles.emptyText}>Aún no tienes reseñas</p>
          <p style={styles.emptySubtext}>Completa intercambios para recibir calificaciones</p>
        </div>
      ) : (
        <div style={styles.list}>
          {ratings.map(r => (
            <div key={r.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.avatarWrap}>
                  {r.raterAvatar
                    ? <img src={r.raterAvatar} alt={r.raterName} style={styles.avatar} />
                    : <div style={styles.avatarFallback}>
                        {r.raterName[0]?.toUpperCase()}
                      </div>
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.raterName}>{r.raterName}</div>
                  <Stars score={r.score} />
                </div>
                <div style={styles.date}>{formatDate(r.created_at)}</div>
              </div>
              {r.comment && (
                <p style={styles.comment}>{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: any = {
  container: {
    background: '#FDF8F3',
    minHeight: '100vh',
    paddingBottom: 68,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 12px',
    background: '#FDF8F3',
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F0EAE0',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A2744',
    margin: 0,
  },

  center: {
    display: 'flex',
    justifyContent: 'center',
    padding: 40,
    color: '#9CA3AF',
  },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '60px 32px',
    textAlign: 'center',
  },

  emptyText: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#1A2744',
  },

  emptySubtext: {
    margin: 0,
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 1.5,
  },

  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '4px 16px',
  },

  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #F0EBE3',
  },

  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },

  avatarWrap: {
    width: 40,
    height: 40,
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

  avatarFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    color: '#F97316',
    background: '#FFF5F0',
  },

  raterName: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1A2744',
    marginBottom: 4,
  },

  date: {
    fontSize: 11,
    color: '#9CA3AF',
    flexShrink: 0,
    alignSelf: 'flex-start',
  },

  comment: {
    margin: 0,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 1.5,
    paddingTop: 10,
    borderTop: '1px solid #F5F0EA',
  },
}
