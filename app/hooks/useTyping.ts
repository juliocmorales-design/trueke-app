'use client'

import { useEffect, useRef, useState } from 'react'
import supabase from '../lib/supabase'

export default function useTyping(offerId: string, userId: string) {
  const [otherTyping, setOtherTyping] = useState(false)

  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!offerId || !userId) return

    const channel = supabase.channel(`typing-${offerId}`)

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId: senderId, typing } = payload.payload

        if (senderId !== userId) {
          setOtherTyping(typing)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [offerId, userId])

  const sendTyping = (typing: boolean) => {
    if (!channelRef.current) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        typing,
      },
    })
  }

  return { otherTyping, sendTyping }
}