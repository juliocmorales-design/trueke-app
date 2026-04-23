'use client'

import { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

export default function useChatRealtime(offerId: string) {
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    if (!offerId) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true })

      setMessages(data || [])
    }

    fetchMessages()

    const channel = supabase
      .channel(`chat-${offerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `offer_id=eq.${offerId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [offerId])

  return { messages }
}