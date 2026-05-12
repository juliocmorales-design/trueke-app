'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import s from './chain.module.css'

/* ── Types ──────────────────────────────────────────────────────────── */
type Item = { id: number; title: string; images: string[] | null }

type Step = {
  id: number
  chain_id: number
  step_number: number
  item_id: number
  from_user_id: string
  to_user_id: string
  offer_id: number
  created_at: string
}

export type ChainData = {
  chain: {
    id: number
    creator_id: string
    initial_item_id: number
    status: string
    steps_count: number
    created_at: string
    personal_quote?: string
  }
  steps: Step[]
  itemMap: Record<number, Item>
}

/* ── ItemThumb ──────────────────────────────────────────────────────── */
function ItemThumb({ item, size = 80 }: { item: Item | undefined; size?: number }) {
  if (!item) return <div className={s.imgFallback} style={{ width: size, height: size }}>?</div>
  if (item.images?.[0]) {
    return (
      <img src={item.images[0]} alt={item.title} className={s.itemImg}
        style={{ width: size, height: size }} crossOrigin="anonymous" />
    )
  }
  return (
    <div className={s.imgFallback} style={{ width: size, height: size }}>
      {item.title.charAt(0).toUpperCase()}
    </div>
  )
}

/* ── CardContent ────────────────────────────────────────────────────────
   Pure visual renderer — no refs, no transforms. Used both for capture
   (off-screen at W×H) and preview (parent handles scale wrapper).
──────────────────────────────────────────────────────────────────────── */
function CardContent({
  W, H,
  initialItem,
  lastItem,
  stepsCount,
  days,
}: {
  W: number
  H: number
  initialItem: Item | undefined
  lastItem:    Item | undefined
  stepsCount:  number
  days:        number
}) {
  const isStory  = H > W
  const thumbSz  = isStory ? 200 : 160
  const logoSz   = isStory ? 52 : 40
  const logoFont = isStory ? 26 : 20
  const nameSz   = isStory ? 36 : 28
  const statSz   = isStory ? 42 : 32
  const subSz    = isStory ? 26 : 20
  const ctaSz    = isStory ? 24 : 18
  const gap      = isStory ? 48 : 32
  const arrowSz  = isStory ? 56 : 40
  const pad      = isStory ? '80px 60px' : '48px'
  const ctaPad   = isStory ? '20px 48px' : '14px 32px'
  const imgBr    = (sz: number) => sz * 0.18

  const imgStyle: React.CSSProperties = {
    width: thumbSz, height: thumbSz, borderRadius: imgBr(thumbSz),
    objectFit: 'cover', display: 'block', flexShrink: 0,
  }
  const fallStyle: React.CSSProperties = {
    ...imgStyle,
    background: '#F0EAE4', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: thumbSz * 0.35, fontWeight: 700, color: '#F97316',
  }

  return (
    <div style={{
      width: W, height: H, background: '#FDF8F3',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: pad, boxSizing: 'border-box', gap,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* background accents */}
      <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300,
        borderRadius:'50%', background:'rgba(232,100,44,0.07)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240,
        borderRadius:'50%', background:'rgba(26,39,68,0.05)', pointerEvents:'none' }} />

      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:logoSz, height:logoSz, background:'#F97316',
          borderRadius: logoSz*0.27, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ color:'#fff', fontWeight:900, fontSize:logoFont }}>T</span>
        </div>
        <span style={{ color:'#1A2744', fontWeight:900, fontSize:nameSz, letterSpacing:-0.5 }}>
          Trueke.app
        </span>
      </div>

      {/* Items */}
      <div style={{ display:'flex', alignItems:'center', gap: isStory ? 32 : 24 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          {initialItem?.images?.[0]
            ? <img src={initialItem.images[0]} crossOrigin="anonymous" style={imgStyle} alt={initialItem.title} />
            : <div style={fallStyle}>{initialItem?.title.charAt(0).toUpperCase() ?? '?'}</div>}
          <span style={{ fontSize: isStory ? 22 : 16, fontWeight:600, color:'#1A2744',
            maxWidth:thumbSz, textAlign:'center', lineHeight:1.2 }}>
            {initialItem?.title ?? '—'}
          </span>
        </div>

        <svg width={arrowSz} height={arrowSz} viewBox="0 0 24 24" fill="none"
          stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          {lastItem?.images?.[0]
            ? <img src={lastItem.images[0]} crossOrigin="anonymous" style={imgStyle} alt={lastItem.title} />
            : <div style={fallStyle}>{lastItem?.title.charAt(0).toUpperCase() ?? '?'}</div>}
          <span style={{ fontSize: isStory ? 22 : 16, fontWeight:600, color:'#1A2744',
            maxWidth:thumbSz, textAlign:'center', lineHeight:1.2 }}>
            {lastItem?.title ?? '—'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap: isStory ? 12 : 8 }}>
        <span style={{ fontSize:statSz, fontWeight:900, color:'#F97316', lineHeight:1 }}>
          {stepsCount} intercambio{stepsCount !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize:subSz, fontWeight:600, color:'#1A2744' }}>
          en {days} día{days !== 1 ? 's' : ''}
        </span>
      </div>

      {/* CTA pill */}
      <div style={{ background:'#1A2744', borderRadius:999, padding:ctaPad }}>
        <span style={{ color:'#fff', fontWeight:700, fontSize:ctaSz }}>
          Crea tu historia en Trueke.app
        </span>
      </div>
    </div>
  )
}

/* ── Scaled preview wrapper ─────────────────────────────────────────── */
function CardPreview({ W, H, scale, ...rest }: { W:number; H:number; scale:number } & React.ComponentProps<typeof CardContent>) {
  return (
    <div style={{ width: W * scale, height: H * scale, overflow: 'hidden', borderRadius: 12, flexShrink: 0 }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <CardContent W={W} H={H} {...rest} />
      </div>
    </div>
  )
}

/* ── ShareCardV1 — 400×600 para WhatsApp/Telegram ───────────────────── */
function ShareCardV1({
  initialItem,
  lastItem,
  stepsCount,
  days,
  personalQuote,
  logoSrc,
}: {
  initialItem:    Item | undefined
  lastItem:       Item | undefined
  stepsCount:     number
  days:           number
  personalQuote?: string
  logoSrc?:       string
}) {
  const circleSize = 80
  const circleStyle: React.CSSProperties = {
    width: circleSize, height: circleSize, borderRadius: '50%',
    background: '#F0EAE0', display: 'flex', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
  }
  const imgStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' }

  return (
    <div style={{
      width: 400, height: 600, background: '#FAF3ED',
      borderRadius: 20, padding: 28, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* A) Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <img src={logoSrc} style={{ width: 36, height: 36, objectFit: 'contain' }} alt="Trueke" />
        <span style={{ fontSize: 20, fontWeight: 800, color: '#1A2744' }}>
          Trueke<span style={{ color: '#F97316' }}>.app</span>
        </span>
      </div>

      {/* B) Headline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1A2744', lineHeight: 1.3 }}>
          De{' '}
          <span style={{ color: '#F97316' }}>{initialItem?.title ?? '—'}</span>
          {' '}a{' '}
          <span style={{ color: '#F97316' }}>{lastItem?.title ?? '—'}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1A2744' }}>
          en {stepsCount} intercambio{stepsCount !== 1 ? 's' : ''}
        </div>
        <div style={{ fontSize: 12, color: '#6B7680' }}>Todo es posible en Trueke.app</div>
      </div>

      {/* C) Progresión */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={circleStyle}>
            {initialItem?.images?.[0]
              ? <img src={initialItem.images[0]} crossOrigin="anonymous" style={imgStyle} alt="" />
              : <span style={{ fontWeight: 700, fontSize: 28, color: '#F97316' }}>
                  {initialItem?.title?.charAt(0).toUpperCase() ?? '?'}
                </span>}
          </div>
          <div style={{ fontSize: 11, color: '#6B7680', textAlign: 'center', maxWidth: 90, lineHeight: 1.3 }}>
            <span style={{ color: '#1A2744', fontWeight: 700 }}>Inicio</span><br />
            {initialItem?.title ?? '—'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#F97316', lineHeight: 1 }}>{stepsCount}</span>
          <span style={{ fontSize: 10, color: '#6B7680', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            pasos
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={circleStyle}>
            {lastItem?.images?.[0]
              ? <img src={lastItem.images[0]} crossOrigin="anonymous" style={imgStyle} alt="" />
              : <span style={{ fontWeight: 700, fontSize: 28, color: '#F97316' }}>
                  {lastItem?.title?.charAt(0).toUpperCase() ?? '?'}
                </span>}
          </div>
          <div style={{ fontSize: 11, color: '#6B7680', textAlign: 'center', maxWidth: 90, lineHeight: 1.3 }}>
            <span style={{ color: '#1A2744', fontWeight: 700 }}>Objetivo</span><br />
            {lastItem?.title ?? '—'}
          </div>
        </div>
      </div>

      {/* D) Stats pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: '#F0EAE0', borderRadius: 999, padding: '8px 14px', fontSize: 13, color: '#1A2744', fontWeight: 600 }}>
          📅 {days} día{days !== 1 ? 's' : ''} duración
        </div>
        <div style={{ background: '#F0EAE0', borderRadius: 999, padding: '8px 14px', fontSize: 13, color: '#1A2744', fontWeight: 600 }}>
          🎯 Objetivo alcanzado
        </div>
      </div>

      {/* E) Frase personal */}
      {personalQuote
        ? (
          <div style={{ padding: '12px 16px', background: '#F0EAE0', borderRadius: 12, borderLeft: '3px solid #F97316' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6B7680', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{personalQuote}"
            </p>
          </div>
        )
        : <div />}

      {/* F) Footer naranja */}
      <div style={{ background: '#F97316', borderRadius: 12, padding: '14px 20px', textAlign: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>🔗 Crea tu historia en Trueke.app</span>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function ChainClient({ data, logoSrc }: { data: ChainData; logoSrc: string }) {
  const router = useRouter()
  const { chain, steps, itemMap } = data

  const [showShareModal, setShowShareModal] = useState(false)
  const [downloading, setDownloading]       = useState<string | null>(null)
  const [igTooltip,    setIgTooltip]        = useState(false)
  const [storyTooltip, setStoryTooltip]     = useState(false)

  /* Refs point ONLY to the off-screen capture divs */
  const refWhatsapp  = useRef<HTMLDivElement>(null!)
  const refInstagram = useRef<HTMLDivElement>(null!)
  const refStory     = useRef<HTMLDivElement>(null!)
  const refV1        = useRef<HTMLDivElement>(null!)

  const initialItem = itemMap[chain.initial_item_id]
  const lastStep    = steps[steps.length - 1]
  const lastItem    = lastStep ? itemMap[lastStep.item_id] : initialItem

  const days = Math.max(1, Math.round(
    (Date.now() - new Date(chain.created_at).getTime()) / 86_400_000,
  ))

  const cardProps   = { initialItem, lastItem, stepsCount: chain.steps_count, days }
  const v1CardProps = { ...cardProps, personalQuote: chain.personal_quote, logoSrc }

  /* Bubbles */
  const bubbles: Array<{ item: Item | undefined; active: boolean; future: boolean }> = steps.map(
    (step, i) => ({ item: itemMap[step.item_id], active: i === steps.length - 1, future: false }),
  )
  bubbles.push({ item: undefined, active: false, future: true })

  const truncateWords = (t: string, maxWords = 2) => {
    const words = t.trim().split(/\s+/)
    return words.length <= maxWords ? t : words.slice(0, maxWords).join(' ') + '…'
  }

  /* ── Download helper (returns true on success) ─────────────────────── */
  const captureAndDownload = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current || downloading) return false
    setDownloading(filename)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(ref.current, {
        useCORS: true, allowTaint: false, scale: 2, backgroundColor: '#FDF8F3',
      })
      const link    = document.createElement('a')
      link.download = filename
      link.href     = canvas.toDataURL('image/png')
      link.click()
      return true
    } catch (e) {
      console.error('html2canvas error:', e)
      alert('No se pudo generar la imagen')
      return false
    } finally {
      setDownloading(null)
    }
  }

  /* ── Per-network handlers ──────────────────────────────────────────── */
  const handleWhatsApp = async () => {
    await captureAndDownload(refWhatsapp, 'trueke-whatsapp.png')
    const texto = encodeURIComponent(
      `¡Hice ${chain.steps_count} intercambio${chain.steps_count !== 1 ? 's' : ''} en Trueke.app! 🔄 ` +
      `Empecé con "${initialItem?.title ?? '...'}" y terminé con "${lastItem?.title ?? '...'}". ` +
      `Crea tu historia en trueke.app`
    )
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  const handleInstagram = async () => {
    const ok = await captureAndDownload(refInstagram, 'trueke-instagram.png')
    if (ok) {
      setIgTooltip(true)
      setTimeout(() => setIgTooltip(false), 3000)
    }
  }

  const handleStory = async () => {
    const ok = await captureAndDownload(refStory, 'trueke-story.png')
    if (ok) {
      setStoryTooltip(true)
      setTimeout(() => setStoryTooltip(false), 3000)
    }
  }

  const handleV1Download = async () => {
    await captureAndDownload(refV1, 'trueke-historia.png')
  }

  const handleFacebook = () => {
    const url = encodeURIComponent('https://trueke.app')
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
  }

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div className={s.screen}>

      {/* HEADER */}
      <div className={s.header}>
        <button className={s.backBtn} onClick={() => router.back()} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className={s.headerTitle}>Mi cadena</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={s.body}>

        {/* PROGRESS BUBBLES */}
        <div className={s.progressWrap}>
          <div className={s.progressTrack}>
            {bubbles.map((b, i) => (
              <div key={i} className={s.bubbleCol}>
                {i > 0 && (
                  <div className={[s.connector, b.future ? s.connectorFuture : s.connectorDone].join(' ')} />
                )}
                <div className={s.nodeWrap}>
                  {b.future ? (
                    <div className={s.bubbleFuture}>?</div>
                  ) : (
                    <>
                      {b.item?.images?.[0] ? (
                        <img src={b.item.images[0]} alt={b.item.title} className={s.nodeImg} crossOrigin="anonymous" />
                      ) : (
                        <div className={s.nodeImgFallback}>
                          {b.item?.title.charAt(0).toUpperCase() ?? '?'}
                        </div>
                      )}
                      <span className={s.nodeBadge}>{i + 1}</span>
                    </>
                  )}
                </div>
                <div className={s.bubbleLabel}>
                  {b.future ? '...' : truncateWords(b.item?.title ?? '')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className={s.summaryCard}>
          <div className={s.summaryRow}>
            <ItemThumb item={initialItem} size={64} />
            <svg className={s.arrow} width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
            <ItemThumb item={lastItem} size={64} />
          </div>
          <div className={s.summaryLabel}>
            {chain.steps_count} intercambio{chain.steps_count !== 1 ? 's' : ''} completado{chain.steps_count !== 1 ? 's' : ''}
          </div>
        </div>

        {/* INITIAL ITEM */}
        <div className={s.section}>
          <div className={s.sectionLabel}>Objeto inicial</div>
          <div className={s.itemRow}>
            <ItemThumb item={initialItem} size={80} />
            <div className={s.itemInfo}>
              <div className={s.itemTitle}>{initialItem?.title ?? '—'}</div>
              <div className={s.itemSub}>Con esto empezaste la cadena</div>
            </div>
          </div>
        </div>

        {/* CURRENT ITEM */}
        <div className={s.section}>
          <div className={s.sectionLabel}>Tienes ahora</div>
          <div className={s.itemRow}>
            <ItemThumb item={lastItem} size={80} />
            <div className={s.itemInfo}>
              <div className={s.itemTitle}>{lastItem?.title ?? '—'}</div>
              <div className={s.itemSub}>Último objeto recibido</div>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className={s.footer}>
        <button className={s.ctaBtn} onClick={() => router.push('/crear')}>
          Intercambiar lo que recibí
        </button>
        {chain.steps_count >= 2 && (
          <button className={s.shareBtn} onClick={() => setShowShareModal(true)}>
            Compartir
          </button>
        )}
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className={s.shareOverlay} onClick={() => setShowShareModal(false)}>
          <div className={s.shareModal} onClick={e => e.stopPropagation()}>

            <div className={s.shareModalHeader}>
              <span className={s.shareModalTitle}>Compartir cadena</span>
              <button className={s.shareModalClose} onClick={() => setShowShareModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={s.shareScroll}>

              {/* WHATSAPP / PNG — tarjeta V1 */}
              <div className={s.cardVariant}>
                <div className={s.cardVariantLabel}>WHATSAPP / PNG</div>
                <div className={s.cardPreviewWrap}>
                  <div style={{ width: 400 * 0.55, height: 600 * 0.55, overflow: 'hidden', borderRadius: 12, flexShrink: 0 }}>
                    <div style={{ width: 400, height: 600, transform: 'scale(0.55)', transformOrigin: 'top left' }}>
                      <ShareCardV1 {...v1CardProps} />
                    </div>
                  </div>
                </div>
                <button className={s.downloadBtn}
                  onClick={handleV1Download}
                  disabled={!!downloading}>
                  {downloading === 'trueke-historia.png' ? 'Generando…' : 'Descargar PNG'}
                </button>
              </div>

              {/* WhatsApp */}
              <div className={s.cardVariant}>
                <div className={s.cardVariantLabel}>WhatsApp</div>
                <div className={s.cardPreviewWrap}>
                  <CardPreview W={600} H={600} scale={0.47} {...cardProps} />
                </div>
                <button className={s.downloadBtn}
                  onClick={handleWhatsApp}
                  disabled={!!downloading}>
                  {downloading === 'trueke-whatsapp.png' ? 'Generando…' : 'Descargar para WhatsApp'}
                </button>
              </div>

              {/* Instagram Feed */}
              <div className={s.cardVariant}>
                <div className={s.cardVariantLabel}>Instagram Feed</div>
                <div className={s.cardPreviewWrap}>
                  <CardPreview W={600} H={600} scale={0.47} {...cardProps} />
                </div>
                <button className={s.downloadBtn}
                  onClick={handleInstagram}
                  disabled={!!downloading}>
                  {downloading === 'trueke-instagram.png' ? 'Descargando…' : 'Descargar para Instagram'}
                </button>
                {igTooltip && (
                  <p className={s.tooltip}>Imagen descargada — ábrela desde tu galería en Instagram</p>
                )}
              </div>

              {/* Stories */}
              <div className={s.cardVariant}>
                <div className={s.cardVariantLabel}>Stories (9:16)</div>
                <div className={s.cardPreviewWrap}>
                  <CardPreview W={600} H={1067} scale={0.30} {...cardProps} />
                </div>
                <button className={s.downloadBtn}
                  onClick={handleStory}
                  disabled={!!downloading}>
                  {downloading === 'trueke-story.png' ? 'Descargando…' : 'Descargar para Stories'}
                </button>
                {storyTooltip && (
                  <p className={s.tooltip}>Imagen descargada — ábrela desde tu galería en Instagram</p>
                )}
              </div>

              {/* Facebook */}
              <div className={s.cardVariant}>
                <div className={s.cardVariantLabel}>Facebook</div>
                <button className={s.downloadBtn} onClick={handleFacebook}>
                  Compartir en Facebook
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Off-screen capture targets — html2canvas reads these */}
      <div style={{ position:'fixed', top:-9999, left:-9999, pointerEvents:'none', zIndex:-1 }}>
        <div ref={refWhatsapp}>
          <CardContent W={600} H={600}  {...cardProps} />
        </div>
        <div ref={refInstagram}>
          <CardContent W={600} H={600}  {...cardProps} />
        </div>
        <div ref={refStory}>
          <CardContent W={600} H={1067} {...cardProps} />
        </div>
        <div ref={refV1}>
          <ShareCardV1 {...v1CardProps} />
        </div>
      </div>

    </div>
  )
}
