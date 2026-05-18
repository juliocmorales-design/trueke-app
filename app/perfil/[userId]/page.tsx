import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { userId } = await params

  const [{ data: profile }, { data: items }, { data: ratingsData }] =
    await Promise.all([
      adminClient.from('profiles').select('*').eq('id', userId).single(),
      adminClient.from('items').select('*').eq('user_id', userId).eq('active', true),
      adminClient.from('ratings').select('score').eq('rated_id', userId),
    ])

  if (!profile) redirect('/')

  const avgRating =
    ratingsData && ratingsData.length > 0
      ? ratingsData.reduce((sum: number, r: any) => sum + r.score, 0) / ratingsData.length
      : null

  const reviewCount = ratingsData?.length ?? 0
  const itemList = items || []
  const score = Math.min(100, itemList.length * 4 + 60)

  return (
    <div style={s.container}>

      {/* HEADER */}
      <div style={s.header}>
        <Link href="/" style={s.backBtn} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 style={s.title}>Perfil</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* CARD PERFIL */}
      <div style={s.contentCard}>
        <div style={s.topSection}>
          <div style={s.avatarWrap}>
            <img
              src={profile.avatar_url || '/images/avatar.svg'}
              style={s.avatar}
              alt="avatar"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={s.name}>{profile.name || profile.username || 'Usuario'}</div>
            <div style={s.username}>@{profile.username || 'user'}</div>
            {profile.bio && (
              <p style={{ fontSize: 13, color: '#6B7280', margin: '6px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
                {profile.bio}
              </p>
            )}
          </div>
          <div style={s.scoreBox}>
            <div style={s.score}>{score}</div>
            <div style={s.scoreLabel}>Confiable</div>
          </div>
        </div>

        {/* STATS */}
        <div style={s.stats}>
          <div style={s.stat}>
            <div style={s.statValue}>{itemList.length}</div>
            <div style={s.statLabel}>Publicaciones</div>
          </div>
          <div style={s.statDivider} />
          <div style={s.stat}>
            <div style={s.statValue}>{avgRating ? avgRating.toFixed(1) : 'Nuevo'}</div>
            <div style={s.statLabel}>Calificación</div>
          </div>
          <div style={s.statDivider} />
          <div style={s.stat}>
            <div style={s.statValue}>{reviewCount}</div>
            <div style={s.statLabel}>Reseñas</div>
          </div>
        </div>
      </div>

      {/* SUS PUBLICACIONES */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>Sus publicaciones</span>
        </div>

        {itemList.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyText}>Este usuario aún no tiene publicaciones</p>
          </div>
        ) : (
          <div style={s.grid}>
            {itemList.map((item: any) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

function ItemCard({ item }: { item: any }) {
  const image = item?.images?.[0] || null
  return (
    <Link href={`/item/${item.id}`} style={s.card}>
      <div style={s.cardImg}>
        {image
          ? <img src={image} style={s.imgEl} alt={item.title} />
          : <div style={s.imgFallback} />
        }
      </div>
      <div style={s.cardBody}>
        <div style={s.cardTitle}>{item.title}</div>
        <div style={s.cardWanted}>por {item.wanted || 'algo'}</div>
        {item.city && <div style={s.cardCity}>{item.city}</div>}
      </div>
    </Link>
  )
}

const s: any = {
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

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#F0EAE0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#1A2744',
    textDecoration: 'none',
    flexShrink: 0,
  },

  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1A2744',
    margin: 0,
  },

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

  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
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

  section: {
    marginBottom: 16,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A2744',
  },

  empty: {
    background: '#FFFFFF',
    borderRadius: 14,
    padding: '28px 16px',
    textAlign: 'center',
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
  },

  emptyText: {
    margin: 0,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: 500,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },

  card: {
    background: '#fff',
    border: '1px solid #F0EBE3',
    borderRadius: 16,
    overflow: 'hidden',
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'block',
  },

  cardImg: {
    width: '100%',
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    background: '#EDE7DF',
  },

  imgEl: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  imgFallback: {
    width: '100%',
    height: '100%',
    background: '#E8E0D8',
  },

  cardBody: { padding: 10 },

  cardTitle: {
    fontWeight: 700,
    fontSize: 13,
    color: '#1A2744',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  cardWanted: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  cardCity: { fontSize: 11, color: '#C4BAB1', marginTop: 4 },
}
