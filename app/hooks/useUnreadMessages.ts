'use client'

import { useEffect, useRef, useState } from 'react'
import supabase from '@/app/lib/supabase'

export default function useUnreadMessages() {
  const [unread, setUnread] = useState(0)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) return

      await loadUnread(user.id)

      if (channelRef.current) return

      const channel = supabase.channel(`unread-${user.id}`)

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => loadUnread(user.id)
      )

      channel.subscribe()

      channelRef.current = channel
    }

    init()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  const loadUnread = async (userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('receiver', userId)
      .eq('is_read', false)

    if (error) {
      console.log('❌ unread error', error)
      return
    }

    setUnread(data?.length || 0)
  }

  return unread
}