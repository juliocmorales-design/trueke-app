'use client'

import { useEffect, useRef, useState } from 'react'
import supabase from '@/app/lib/supabase'

export default function useUnreadMessages() {
  const [unread, setUnread] = useState(0)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const userIdRef = useRef<string | null>(null)

  const loadUnread = async (userId: string) => {
    if (!userId) return

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver', userId)
      .eq('is_read', false)

    console.log('[unread] userId:', userId, 'count:', count)

    if (error) {
      console.log('❌ unread error', error)
      return
    }

    setUnread(count ?? 0)
  }

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user

      if (!user) return

      userIdRef.current = user.id

      if (channelRef.current) return

      const channel = supabase.channel(`unread-${user.id}`)

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver=eq.${user.id}`,
        },
        () => loadUnread(user.id)
      )

      channel.subscribe()

      channelRef.current = channel

      await loadUnread(user.id)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && userIdRef.current) {
        loadUnread(userIdRef.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    init()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [])

  return unread
}