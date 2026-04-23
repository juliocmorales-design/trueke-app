'use client'

import { useEffect, useState } from 'react'
import supabase from '../lib/supabase'

export default function usePresence(userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('online-users', {
      config: {
        presence: { key: userId },
      },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const users = Object.keys(state)
      setOnlineUsers(users)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() })
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { onlineUsers }
}