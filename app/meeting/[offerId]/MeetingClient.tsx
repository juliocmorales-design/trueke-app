'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/app/lib/supabase'
import s from './meeting.module.css'

export interface MeetingData {
  offer: {
    id: number
    from_user_id: string
    to_user_id: string
    from_item_id: number | null
    to_item_id:   number | null
    status: string
  }
  fromProfile: { id: string; name: string; username: string | null; avatar_url: string | null } | null
  toProfile:   { id: string; name: string; username: string | null; avatar_url: string | null } | null
}

export default function MeetingClient({ offerId, data }: { offerId: string; data: MeetingData }) {
  const router = useRouter()
  const [place,  setPlace]  = useState('')
  const [saving, setSaving] = useState(false)

  const handleConfirm = async () => {
    if (!place.trim() || saving) return
    setSaving(true)

    await Promise.all([
      supabase
        .from('offers')
        .update({
          meeting_point:        place.trim(),
          meeting_confirmed_at: new Date().toISOString(),
        })
        .eq('id', data.offer.id),

      supabase.from('messages').insert({
        offer_id:  data.offer.id,
        sender_id: data.offer.from_user_id,
        sender:    data.offer.from_user_id,
        receiver:  data.offer.to_user_id,
        text:      `📍 Punto acordado: ${place.trim()}. Coordinen la hora en el chat.`,
        is_read:   false,
      }),
    ])

    router.replace(`/mensajes/${offerId}`)
  }

  const canConfirm = place.trim().length > 0 && !saving

  return (
    <div className={s.screen}>

      {/* HEADER */}
      <div className={s.header}>
        <button className={s.backBtn} onClick={() => router.back()} aria-label="Volver">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className={s.headerText}>
          <span className={s.headerTitle}>¿Dónde se encuentran?</span>
          <span className={s.headerSub}>Escribe el lugar donde se van a encontrar</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* BODY */}
      <div className={s.body}>
        <input
          className={s.input}
          type="text"
          placeholder="Ej: Parque Fundidora, Oxxo de Constitución…"
          value={place}
          onChange={e => setPlace(e.target.value.slice(0, 100))}
          autoFocus
        />
        <p className={s.hint}>Elige un lugar público y seguro para ambos</p>
      </div>

      {/* FOOTER */}
      <div className={s.footer}>
        <button
          className={`${s.confirmBtn} ${!canConfirm ? s.confirmBtnOff : ''}`}
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          {saving ? 'Confirmando…' : 'Confirmar punto'}
        </button>
      </div>

    </div>
  )
}
