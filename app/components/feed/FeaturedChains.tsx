'use client'

import { useRouter } from 'next/navigation'

type Chain = {
  id: number
  initial_item_id: number
  creator_id?: string
  initial_item_title?: string
  initial_item_image?: string
  final_item_title?: string
  final_item_image?: string
  creator_username?: string
  creator_avatar?: string
  steps_count: number
  created_at: string
}

/* ── Empty state ─────────────────────────────────────────────────────── */
function ChainIllustration() {
  const circle = (label: string, x: number) => (
    <g key={label} transform={`translate(${x}, 0)`}>
      <circle cx="22" cy="22" r="22" fill="#FDE8DC" />
      <text x="22" y="28" textAnchor="middle" fontSize="18" fontWeight="700" fill="#F97316">
        {label}
      </text>
    </g>
  )
  const arrow = (x: number) => (
    <g key={`a${x}`} transform={`translate(${x}, 12)`}>
      <line x1="0" y1="10" x2="20" y2="10" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
      <polyline points="14,4 20,10 14,16" stroke="#F97316" strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
  return (
    <svg width="164" height="44" viewBox="0 0 164 44" fill="none">
      {circle('A', 0)} {arrow(50)} {circle('B', 76)} {arrow(126)} {circle('C', 142)}
    </svg>
  )
}

const trunc = (s: string, n = 18) => s && s.length > n ? s.slice(0, n) + '…' : (s ?? '')

/* ── Item thumb ──────────────────────────────────────────────────────── */
function Thumb({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div style={{
      width: 60, height: 60, borderRadius: 12,
      overflow: 'hidden', background: '#EDE7DF', flexShrink: 0,
    }}>
      {src
        ? <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', background: '#E0D8D0' }} />
      }
    </div>
  )
}

/* ── Chain card ──────────────────────────────────────────────────────── */
function ChainCard({ chain, onClick }: { chain: Chain; onClick: () => void }) {
  const initTitle  = chain.initial_item_title ?? `Item #${chain.initial_item_id}`
  const finalTitle = chain.final_item_title ?? null
  const steps      = chain.steps_count

  return (
    <div
      onClick={onClick}
      style={{
        minWidth: 240,
        maxWidth: 260,
        background: '#fff',
        borderRadius: 16,
        padding: 14,
        border: '1px solid #EDE7E1',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        flexShrink: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Two item photos + arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Thumb src={chain.initial_item_image} alt={initTitle} />

        <svg width="20" height="16" viewBox="0 0 20 16" fill="none" style={{ flexShrink: 0 }}>
          <line x1="0" y1="8" x2="16" y2="8" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
          <polyline points="10,2 16,8 10,14" stroke="#F97316" strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <Thumb src={chain.final_item_image} alt={finalTitle ?? ''} />
      </div>

      {/* Title + steps count */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2744', lineHeight: 1.3 }}>
          {trunc(initTitle, 20)}
        </span>
        <span style={{ fontSize: 12, color: '#9AA3AB' }}>
          {steps} intercambio{steps !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Creator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 999,
          overflow: 'hidden', background: '#EDE7DF', flexShrink: 0,
        }}>
          {chain.creator_avatar
            ? <img src={chain.creator_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: '#D8D0C8' }} />
          }
        </div>
        <span style={{ fontSize: 12, color: '#9AA3AB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {chain.creator_username ?? 'Usuario'}
        </span>
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function FeaturedChains({ chains }: { chains: Chain[] }) {
  const router = useRouter()

  return (
    <div style={{ marginTop: 24 }}>

      <div style={{ marginBottom: 12 }}>
        <strong style={{ fontSize: 17, color: '#1A2744' }}>Cadenas destacadas</strong>
      </div>

      {chains.length === 0 ? (

        <div style={{
          background: '#fff',
          borderRadius: 20,
          padding: '28px 24px',
          border: '1px solid #EDE7E1',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <ChainIllustration />
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1A2744', textAlign: 'center', lineHeight: 1.3 }}>
            Sé el primero en crear una cadena épica
          </p>
          <p style={{ margin: 0, fontSize: 13, color: '#9AA3AB', textAlign: 'center', lineHeight: 1.4 }}>
            Intercambia en cadena y llega más lejos
          </p>
          <button
            onClick={() => router.push('/crear')}
            style={{
              marginTop: 4, background: '#F97316', color: '#fff',
              border: 'none', borderRadius: 999, padding: '10px 24px',
              fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            Crear mi cadena
          </button>
        </div>

      ) : (

        <div style={{
          display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4,
          marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 40,
          scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}>
          {chains.map(chain => (
            <ChainCard
              key={chain.id}
              chain={chain}
              onClick={() => router.push(`/chain/${chain.id}`)}
            />
          ))}
        </div>

      )}
    </div>
  )
}
