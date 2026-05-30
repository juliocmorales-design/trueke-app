'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import s from './exchange.module.css'
import { useIsDesktop } from '@/app/hooks/useIsDesktop'

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
const STATUS_ICON: Record<string, React.ReactElement> = {
  completed: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  accepted: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  pending: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  rejected: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
}

/* ── Item placeholder ───────────────────────────────────────────── */
function ItemDisplay({
  item,
  profile,
  maxHeight,
}: {
  item: ExchangeData['offeredItem']
  profile: ExchangeData['fromProfile']
  maxHeight?: number
}) {
  const imgUrl = item?.images?.[0] ?? null
  const isRemote = !!imgUrl && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://'))
  const initials = item?.title
    ? item.title.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  const imgContainerStyle = maxHeight ? { maxHeight, overflow: 'hidden' as const, width: '100%' } : undefined

  return (
    <div className={s.itemDisplay}>
      <div style={imgContainerStyle}>
        {isRemote ? (
          <img src={imgUrl!} alt={item!.title} className={s.itemImg}
            style={{ width: '100%', height: '100%', objectFit: 'cover' as const }} />
        ) : (
          <div
            className={s.itemImgFallback}
            style={{ background: '#F5EFE8', fontSize: 22, fontWeight: 700, color: '#A0856C' }}
          >
            {initials}
          </div>
        )}
      </div>
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={s.headerCenter}>Detalle del intercambio</span>
        <div style={{ width: 40 }} />
      </div>
      <div className={s.errorWrap}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="#C4BAB1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="8" y1="15" x2="16" y2="15"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
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
  const isDesktop = useIsDesktop()
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined)
  const [loadingUser, setLoadingUser]     = useState(true)
  const [status, setStatus]               = useState<string>(data?.offer?.status ?? 'pending')
  const [acting, setActing]               = useState(false)
  const [completing, setCompleting]       = useState(false)
  const [shareError, setShareError]       = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [toast,           setToast]           = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

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
    if (acting) return
    setActing(true)
    try {
      await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id)
      setStatus('accepted')
      sendNotification(
        offer.from_user_id,
        'offer_accepted',
        'Tu oferta fue aceptada 🎉',
        `${requestedItem?.title || 'Tu ítem'} está listo para el intercambio`,
      )
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (acting) return
    setActing(true)
    try {
      await supabase.from('offers').update({ status: 'rejected' }).eq('id', offer.id)
      setStatus('rejected')
      sendNotification(
        offer.from_user_id,
        'offer_rejected',
        'Tu oferta fue rechazada',
        'La otra parte no pudo aceptar en este momento',
      )
    } finally {
      setActing(false)
    }
  }

  const handleCancelOffer = async () => {
    const { data: currentOffer } = await supabase
      .from('offers')
      .select('status')
      .eq('id', offerId)
      .single()

    if (currentOffer?.status !== 'pending') {
      showToast('Esta oferta ya no está pendiente.')
      router.refresh()
      return
    }

    const { error } = await supabase
      .from('offers')
      .update({ status: 'rejected' })
      .eq('id', offerId)
      .eq('from_user_id', currentUserId)

    if (error) {
      showToast('Error al cancelar la oferta. Intenta de nuevo.')
      return
    }

    router.push('/intercambios')
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


  const footerInner = {
    padding: '0',
    maxWidth: isDesktop ? 812 : '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  const footerStyle = {
    position: 'fixed' as const,
    bottom: 0,
    left: isDesktop ? 240 : 0,
    right: 0,
    width: 'auto',
    maxWidth: 'none',
    transform: 'none',
    background: '#FDF8F3',
    borderTop: '1px solid #F0EAE0',
    padding: '12px 0',
    zIndex: 50,
    boxSizing: 'border-box' as const,
  }

  return (
    <div className={s.page} style={{
      maxWidth: isDesktop ? 860 : '100%',
      margin: '0 auto',
      padding: isDesktop ? '32px 24px' : '0',
    }}>

      {/* HEADER */}
      <div className={s.header}>
        <button className={s.iconBtn} onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={s.headerCenter}>Detalle del intercambio</span>
        <button className={s.iconBtn} onClick={() => router.push(`/mensajes/${offerId}`)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#1A2744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      <div className={s.content}>

        {/* TARJETA PRINCIPAL */}
        <div className={s.mainCard}>
          <div className={s.itemsRow}>
            <ItemDisplay item={offeredItem}   profile={fromProfile}  maxHeight={isDesktop ? 400 : 280} />
            <div className={s.swapWrap}>
              <div className={s.swapCircle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 7h10M17 7l-3-3M17 7l-3 3"/>
                  <path d="M17 17H7M7 17l3-3M7 17l3 3"/>
                </svg>
              </div>
            </div>
            <ItemDisplay item={requestedItem} profile={toProfile}   maxHeight={isDesktop ? 400 : 280} />
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
                  <svg width="14" height="14" viewBox="0 0 24 24"
                    fill="#F97316" stroke="#F97316" strokeWidth="1" style={{ flexShrink: 0 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {score !== null ? (score as number).toFixed(1) : 'Nuevo'}
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
            <div className={s.detailIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className={s.detailTexts}>
              <span className={s.detailLabel}>Fecha de creación</span>
              <span className={s.detailValue}>{formatDate(offer.created_at)}</span>
            </div>
          </div>

          <div className={s.detailRow}>
            <div className={s.detailIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <div className={s.detailTexts}>
              <span className={s.detailLabel}>Ofrece</span>
              <span className={s.detailValue}>{offeredItem?.title ?? '—'}</span>
            </div>
          </div>

          <div className={s.detailRow}>
            <div className={s.detailIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <div className={s.detailTexts}>
              <span className={s.detailLabel}>Solicita</span>
              <span className={s.detailValue}>{requestedItem?.title ?? '—'}</span>
            </div>
          </div>

          {isChain && (
            <div className={s.detailRow}>
              <div className={s.detailIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className={s.detailTexts}>
                <span className={s.detailLabel}>Tipo</span>
                <span className={s.detailValue}>Cadena de intercambios</span>
              </div>
            </div>
          )}

          <div className={s.detailRow}>
            <div className={s.detailIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
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
        <div className={s.footer} style={{ ...footerStyle, visibility: 'hidden' }} />
      ) : status === 'accepted' ? (
        <div className={s.footer} style={footerStyle}>
          <div style={footerInner}>
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
                {completing ? 'Guardando...' : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {' '}Ya hicimos el intercambio
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : status === 'pending' && currentUserId === offer.to_user_id ? (
        <div className={s.footer} style={footerStyle}>
          <div style={footerInner}>
            <button className={s.btnPrimary} onClick={handleAccept} disabled={acting} style={{ opacity: acting ? 0.6 : 1 }}>
              {acting ? 'Procesando...' : 'Aceptar intercambio'}
            </button>
            <button className={s.btnSecondary} onClick={() => setShowRejectModal(true)} disabled={acting} style={{ opacity: acting ? 0.6 : 1 }}>
              Rechazar
            </button>
          </div>
        </div>
      ) : status === 'pending' && currentUserId === offer.from_user_id ? (
        <div className={s.footer} style={footerStyle}>
          <div style={footerInner}>
            <button className={s.btnSecondary} onClick={() => router.push(`/mensajes/${offerId}`)}>
              Ir al chat
            </button>
            <button className={s.btnDanger} onClick={() => setShowCancelModal(true)}>
              Cancelar oferta
            </button>
          </div>
        </div>
      ) : (
        <div className={s.footer} style={footerStyle}>
          <div style={footerInner}>
            <button className={s.btnPrimary} onClick={() => router.push(`/mensajes/${offerId}`)}>
              Ir al chat
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%',
          transform: 'translateX(-50%)',
          background: '#1A2744', color: '#fff',
          borderRadius: 99, padding: '12px 24px',
          fontSize: 14, fontWeight: 600,
          zIndex: 999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        }}>
          {toast}
        </div>
      )}

      {showRejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '24px', width: '100%', maxWidth: 500,
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A2744', margin: '0 0 8px' }}>
              ¿Rechazar esta oferta?
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
              Esta acción no se puede deshacer. El otro usuario será notificado.
            </p>
            <button onClick={() => { setShowRejectModal(false); handleReject() }}
              style={{ width: '100%', background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 16, padding: 16, fontSize: 16,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
              Sí, rechazar
            </button>
            <button onClick={() => setShowRejectModal(false)}
              style={{ width: '100%', background: 'none', border: 'none',
                color: '#6B7280', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff', borderRadius: '20px 20px 0 0',
            padding: '24px', width: '100%', maxWidth: 500,
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A2744', margin: '0 0 8px' }}>
              ¿Cancelar esta oferta?
            </h3>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
              Las ofertas canceladas aparecen como rechazadas. Esta acción no se puede deshacer.
            </p>
            <button onClick={() => { setShowCancelModal(false); handleCancelOffer() }}
              style={{ width: '100%', background: '#DC2626', color: '#fff',
                border: 'none', borderRadius: 16, padding: 16, fontSize: 16,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
              Sí, cancelar oferta
            </button>
            <button onClick={() => setShowCancelModal(false)}
              style={{ width: '100%', background: 'none', border: 'none',
                color: '#6B7280', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              Volver
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
