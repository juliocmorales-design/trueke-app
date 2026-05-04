'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import s from './rating.module.css'

/* ── Types ──────────────────────────────────────────────────────── */
type Item    = { id: number; title: string; images: string[] | null } | null
type Profile = { id: string; name: string; username: string | null; avatar_url: string | null } | null

export interface RatingData {
  offer: {
    id: number
    from_user_id: string
    to_user_id: string
    from_item_id: number | null
    to_item_id:   number | null
    status: string
  }
  fromItem:    Item
  toItem:      Item
  fromProfile: Profile
  toProfile:   Profile
}

/* ── Star icon ──────────────────────────────────────────────────── */
function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24"
      fill={filled ? '#F97316' : 'none'}
      stroke={filled ? '#F97316' : '#C5B9B0'}
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

/* ── Component ──────────────────────────────────────────────────── */
export default function RatingClient({ offerId, data }: { offerId: string; data: RatingData }) {
  const router = useRouter()

  const [stars,        setStars]        = useState(0)
  const [hovered,      setHovered]      = useState(0)
  const [comment,      setComment]      = useState('')
  const [saving,       setSaving]       = useState(false)
  const [ready,        setReady]        = useState(false)
  const [showModal,    setShowModal]    = useState(false)
  const [myChains,     setMyChains]     = useState<any[]>([])
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)

  /* Resolved per current user */
  const [receivedItem,  setReceivedItem]  = useState<Item>(null)
  const [ratedProfile,  setRatedProfile]  = useState<Profile>(null)
  const [raterId,       setRaterId]       = useState<string | null>(null)

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const iAmFrom    = user.id === data.offer.from_user_id
    const received   = iAmFrom ? data.toItem      : data.fromItem
    const rated      = iAmFrom ? data.toProfile   : data.fromProfile

    /* Check if already rated to avoid duplicates */
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('offer_id', data.offer.id)
      .eq('rater_id', user.id)
      .maybeSingle()

    if (existing) { router.replace('/intercambios'); return }

    setReceivedItem(received)
    setRatedProfile(rated)
    setRaterId(user.id)
    setReady(true)
  }

  const handleSave = async () => {
    if (!stars || !raterId || !ratedProfile || saving) return
    setSaving(true)

    await supabase.from('ratings').insert({
      offer_id: data.offer.id,
      rater_id: raterId,
      rated_id: ratedProfile.id,
      score:    stars,
      comment:  comment.trim() || null,
    })

    // Notify the person who was rated
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''
    fetch('/api/notifications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        userId:  ratedProfile.id,
        type:    'new_rating',
        title:   '¡Tienes una nueva valoración! ⭐',
        body:    `Recibiste ${stars} estrella${stars !== 1 ? 's' : ''} en tu último intercambio`,
        offerId: data.offer.id,
      }),
    }).catch(() => {})

    // Fetch active chains in parallel with notification fire-and-forget
    const { data: chainsData } = await supabase
      .from('chains')
      .select('id, goal_description, initial_item_id')
      .eq('creator_id', raterId)
      .eq('status', 'active')

    const chains = chainsData || []
    setMyChains(chains)
    if (chains.length > 0) setSelectedChainId(chains[0].id)

    setSaving(false)
    setShowModal(true)
  }

  /* While checking auth — no flash of content */
  if (!ready) return <div className={s.screen} />

  const initials = (ratedProfile?.name || ratedProfile?.username || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('')

  const displayStars = hovered || stars

  return (
    <div className={s.screen}>

      {/* HEADER */}
      <div className={s.header}>
        <button className={s.backBtn} onClick={() => router.back()} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className={s.headerTitle}>Califica el intercambio</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={s.body}>

        {/* ITEM RECIBIDO */}
        {receivedItem && (
          <div className={s.itemCard}>
            {receivedItem.images?.[0] ? (
              <img
                src={receivedItem.images[0]}
                className={s.itemImg}
                alt={receivedItem.title}
              />
            ) : (
              <div className={s.itemImgFallback}>
                {receivedItem.title.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={s.itemInfo}>
              <div className={s.itemTitle}>{receivedItem.title}</div>
              <div className={s.itemSub}>
                Recibiste de @{ratedProfile?.username || ratedProfile?.name || 'usuario'}
              </div>
            </div>
          </div>
        )}

        {/* CALIFICACIÓN */}
        <div className={s.section}>
          <div className={s.sectionLabel}>¿Cómo fue la experiencia?</div>

          <div className={s.ratedUser}>
            <div className={s.avatar}>{initials}</div>
            <span className={s.ratedName}>
              {ratedProfile?.name || ratedProfile?.username || 'Usuario'}
            </span>
          </div>

          <div className={s.stars}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={s.starBtn}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onTouchStart={() => setHovered(n)}
                onClick={() => { setStars(n); setHovered(0) }}
                aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
              >
                <Star filled={displayStars >= n} />
              </button>
            ))}
          </div>

          {stars > 0 && (
            <div className={s.starsLabel}>
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][stars]}
            </div>
          )}
        </div>

        {/* COMENTARIO */}
        <div className={s.section}>
          <div className={s.sectionLabel}>Comentario (opcional)</div>
          <textarea
            className={s.textarea}
            placeholder="¿Algo que quieras compartir sobre este intercambio?"
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 300))}
            rows={4}
          />
          <div className={s.charCount}>{comment.length} / 300</div>
        </div>

      </div>

      {/* MODAL POST-CALIFICACIÓN */}
      {showModal && (
        <div className={s.overlay}>
          <div className={s.modal}>
            {receivedItem?.images?.[0] ? (
              <img
                src={receivedItem.images[0]}
                className={s.modalImg}
                alt={receivedItem?.title}
              />
            ) : (
              <div className={s.modalImgFallback}>
                {receivedItem?.title?.charAt(0).toUpperCase() ?? '?'}
              </div>
            )}

            <div className={s.modalItemTitle}>{receivedItem?.title}</div>

            <div className={s.modalTitle}>¿Qué haces con lo que recibiste?</div>
            <div className={s.modalSub}>Puedes continuar una cadena o empezar una nueva</div>

            {myChains.length > 0 && (
              <>
                {myChains.length > 1 && (
                  <select
                    className={s.chainSelect}
                    value={selectedChainId ?? ''}
                    onChange={e => setSelectedChainId(Number(e.target.value))}
                  >
                    {myChains.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.goal_description || `Cadena #${c.id}`}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  className={s.modalBtnPrimary}
                  onClick={() => router.replace(`/crear?chainId=${selectedChainId}&itemId=${receivedItem?.id}`)}
                >
                  Continuar una cadena existente
                </button>
              </>
            )}

            <button
              className={myChains.length > 0 ? s.modalBtnSecondary : s.modalBtnPrimary}
              onClick={() => router.replace(`/crear?newChain=true&itemId=${receivedItem?.id}`)}
            >
              Empezar cadena nueva
            </button>
            <button
              className={s.modalBtnSecondary}
              onClick={() => router.replace('/intercambios')}
            >
              No, ya terminé
            </button>
          </div>
        </div>
      )}

      {/* FOOTER STICKY */}
      <div className={s.footer}>
        <button
          className={`${s.saveBtn} ${!stars || saving ? s.saveBtnOff : ''}`}
          onClick={handleSave}
          disabled={!stars || saving}
        >
          {saving ? 'Guardando…' : 'Guardar calificación'}
        </button>
      </div>

    </div>
  )
}
