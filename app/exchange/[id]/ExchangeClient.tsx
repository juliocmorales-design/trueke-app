'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import s from './exchange.module.css'

/* ── Public types ───────────────────────────────────────────────── */
export interface ExchangeData {
  offer: {
    id: string
    from_user_id: string
    to_user_id: string
    from_item_id: string | null
    to_item_id: string | null
    status: string
    created_at: string
    meeting_point: string | null
  }
  offeredItem:   { id: string; title: string; images: string[] | null; user_id: string } | null
  requestedItem: { id: string; title: string; images: string[] | null; user_id: string } | null
  fromProfile:   { id: string; name: string; username: string | null; avatar_url: string | null } | null
  toProfile:     { id: string; name: string; username: string | null; avatar_url: string | null } | null
  fromScore: number | null
  toScore:   number | null
}

/* ── Status helpers ─────────────────────────────────────────────── */
const STATUS_LABEL: Record<string, string> = {
  pending:   'Esperando respuesta',
  accepted:  'Aceptado',
  completed: 'Completado',
  rejected:  'Rechazado',
}
const STATUS_PILL: Record<string, string> = {
  pending:   s.pillPending,
  accepted:  s.pillAccepted,
  completed: s.pillCompleted,
  rejected:  s.pillRejected,
}
const STATUS_ICON: Record<string, string> = {
  pending:   '⏳',
  accepted:  '✅',
  completed: '🎉',
  rejected:  '❌',
}

/* ── Item placeholder ───────────────────────────────────────────── */
function ItemDisplay({
  item,
  profile,
}: {
  item: ExchangeData['offeredItem']
  profile: ExchangeData['fromProfile']
}) {
  const imgUrl = item?.images?.[0] ?? null
  const isRemote = !!imgUrl && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'))
  const initials = item?.title
    ? item.title.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  return (
    <div className={s.itemDisplay}>
      {isRemote ? (
        <img src={imgUrl!} alt={item!.title} className={s.itemImg} />
      ) : (
        <div
          className={s.itemImgFallback}
          style={{ background: '#F5EFE8', fontSize: 22, fontWeight: 700, color: '#A0856C' }}
        >
          {initials}
        </div>
      )}
      <span className={s.itemTitle}>{item?.title ?? '—'}</span>
      {profile && <span className={s.itemUser}>@{profile.username || profile.name}</span>}
    </div>
  )
}

function AvatarOrInitials({ profile }: { profile: ExchangeData['fromProfile'] }) {
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} className={s.avatar} alt={profile.name} />
  }
  return (
    <div className={s.avatarInitials}>{(profile?.name ?? 'U').charAt(0).toUpperCase()}</div>
  )
}

/* ── Error view ─────────────────────────────────────────────────── */
function ErrorView({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  const router = useRouter()
  return (
    <div className={s.page}>
      <div className={s.header}>
        <button className={s.iconBtn} onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className={s.headerCenter}>Detalle del intercambio</span>
        <div style={{ width: 40 }} />
      </div>
      <div className={s.errorWrap}>
        <span>😕</span>
        <span>{msg}</span>
        <button
          className={s.btnPrimary}
          style={{ width: 'auto', padding: '12px 24px' }}
          onClick={onRetry}
        >
          Reintentar
        </button>
      </div>
    </div>
  )
}

/* ── Main client component ──────────────────────────────────────── */
export default function ExchangeClient({
  offerId,
  data,
  errorMsg,
  isChain = false,
  chainId = null,
}: {
  offerId: string
  data: ExchangeData | null
  errorMsg?: string
  isChain?: boolean
  chainId?: number | null
}) {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [loadingUser, setLoadingUser]     = useState(true)
  const [status, setStatus]               = useState<string>(data?.offer?.status ?? 'pending')
  const [acting, setActing]               = useState(false)
  const [completing, setCompleting]       = useState(false)
  const [shareError, setShareError]       = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => {
      setCurrentUserId(s.session?.user?.id ?? undefined)
      setLoadingUser(false)
    })
  }, [])

  if (errorMsg || !data?.offer) {
    return <ErrorView msg={errorMsg ?? 'No se pudo cargar el intercambio'} onRetry={() => router.refresh()} />
  }

  const { offer, offeredItem, requestedItem, fromProfile, toProfile, fromScore, toScore } = data

  const sendNotification = async (userId: string, type: string, title: string, body: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''
    fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, type, title, body, offerId: offer.id }),
    }).catch(() => {})
  }

  const handleAccept = async () => {
    setActing(true)
    await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id)
    setStatus('accepted')
    setActing(false)
    sendNotification(
      offer.from_user_id,
      'offer_accepted',
      'Tu oferta fue aceptada 🎉',
      `${requestedItem?.title || 'Tu ítem'} está listo para el intercambio`,
    )
  }

  const handleReject = async () => {
    setActing(true)
    await supabase.from('offers').update({ status: 'rejected' }).eq('id', offer.id)
    setStatus('rejected')
    setActing(false)
    sendNotification(
      offer.from_user_id,
      'offer_rejected',
      'Tu oferta fue rechazada',
      'La otra parte no pudo aceptar en este momento',
    )
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    await supabase.from('offers').update({ status: 'completed' }).eq('id', offer.id)
    setStatus('completed')
    await Promise.all([
      sendNotification(offer.from_user_id, 'offer_completed', '¡Intercambio completado! 🎉', 'Ya pueden calificarse mutuamente'),
      sendNotification(offer.to_user_id,   'offer_completed', '¡Intercambio completado! 🎉', 'Ya pueden calificarse mutuamente'),
    ])
    router.push(`/rating/${offerId}`)
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })


  return (
    <div className={s.page}>

      {/* HEADER */}
      <div className={s.header}>
        <button className={s.iconBtn} onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className={s.headerCenter}>Detalle del intercambio</span>
        <button className={s.iconBtn} onClick={() => router.push(`/mensajes/${offerId}`)}>💬</button>
      </div>

      <div className={s.content}>

        {/* TARJETA PRINCIPAL */}
        <div className={s.mainCard}>
          <div className={s.itemsRow}>
            <ItemDisplay item={offeredItem}   profile={fromProfile} />
            <div className={s.swapWrap}>
              <div className={s.swapCircle}>⇄</div>
            </div>
            <ItemDisplay item={requestedItem} profile={toProfile} />
          </div>

          <div className={`${s.pill} ${STATUS_PILL[status] ?? s.pillPending}`}>
            <span>{STATUS_ICON[status]}</span>
            <span>{STATUS_LABEL[status]}</span>
          </div>

          {isChain && chainId && (
            <div className={s.chainSection}>
              <span className={s.chainLabel}>Cadena de intercambios</span>
              <button className={s.chainLink} onClick={() => router.push(`/chain/${chainId}`)}>
                Ver mi cadena →
              </button>
            </div>
          )}
        </div>

        {/* SCORE DE CONFIANZA */}
        <div className={s.section}>
          <div className={s.sectionTitle}>Score de confianza</div>
          {[
            { profile: fromProfile, score: fromScore },
            { profile: toProfile,   score: toScore   },
          ].map(({ profile, score }, idx) => (
            <div
              key={idx}
              className={s.scoreRow}
              onClick={() => profile && router.push(`/perfil/${profile.id}`)}
            >
              <AvatarOrInitials profile={profile} />
              <div className={s.scoreInfo}>
                <div className={s.scoreName}>{profile?.name ?? 'Usuario'}</div>
                <div className={s.scorePill}>
                  {score !== null ? `⭐ ${(score as number).toFixed(1)}` : '⭐ Nuevo'}
                </div>
              </div>
              <span className={s.chevron}>›</span>
            </div>
          ))}
        </div>

        {/* DETALLES */}
        <div className={s.section}>
          <div className={s.sectionTitle}>Detalles</div>

          <div className={s.detailRow}>
            <div className={s.detailIcon}>📅</div>
            <div className={s.detailTexts}>
              <span className={s.detailLabel}>Fecha de creación</span>
              <span className={s.detailValue}>{formatDate(offer.created_at)}</span>
            </div>
          </div>

          <div className={s.detailRow}>
            <div className={s.detailIcon}>📦</div>
            <div className={s.detailTexts}>
              <span className={s.detailLabel}>Ofrece</span>
              <span className={s.detailValue}>{offeredItem?.title ?? '—'}</span>
            </div>
          </div>

          <div className={s.detailRow}>
            <div className={s.detailIcon}>🎯</div>
            <div className={s.detailTexts}>
              <span className={s.detailLabel}>Solicita</span>
              <span className={s.detailValue}>{requestedItem?.title ?? '—'}</span>
            </div>
          </div>

          {isChain && (
            <div className={s.detailRow}>
              <div className={s.detailIcon}>🔗</div>
              <div className={s.detailTexts}>
                <span className={s.detailLabel}>Tipo</span>
                <span className={s.detailValue}>Cadena de intercambios</span>
              </div>
            </div>
          )}

          <div className={s.detailRow}>
            <div className={s.detailIcon}>📊</div>
            <div className={s.detailTexts}>
              <span className={s.detailLabel}>Estado</span>
              <span className={s.detailValue}>{STATUS_LABEL[status]}</span>
            </div>
          </div>
        </div>

      </div>

      {shareError && (
        <div className={s.shareErrorBanner}>{shareError}</div>
      )}

      {/* FOOTER */}
      {loadingUser ? (
        <div className={s.footer} style={{ visibility: 'hidden' }} />
      ) : status === 'accepted' ? (
        <div className={s.footer}>
          <button className={s.btnPrimary} onClick={() => router.push(`/meeting/${offerId}`)}>
            Acordar punto de encuentro
          </button>
          <button className={s.btnSecondary} onClick={() => router.push(`/mensajes/${offerId}`)}>
            Ir al chat
          </button>
          {offer.meeting_point && (
            <button
              className={s.btnSecondary}
              style={{ color: '#166534', background: '#DCFCE7' }}
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? 'Guardando...' : '✓ Ya hicimos el intercambio'}
            </button>
          )}
        </div>
      ) : status === 'pending' && currentUserId === offer.to_user_id ? (
        <div className={s.footer}>
          <button className={s.btnPrimary} onClick={handleAccept} disabled={acting}>
            Aceptar intercambio
          </button>
          <button className={s.btnSecondary} onClick={handleReject} disabled={acting}>
            Rechazar
          </button>
        </div>
      ) : (
        <div className={s.footer}>
          <button className={s.btnPrimary} onClick={() => router.push(`/mensajes/${offerId}`)}>
            Ir al chat
          </button>
        </div>
      )}

    </div>
  )
}
