import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ThreadMessage } from '../components/messaging/MessageThread'

const MESSAGE_SELECT = 'id, body, sender_id, created_at, profiles(full_name, email)'

export function useConversationMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [loading, setLoading] = useState(false)

  const appendUnique = useCallback((msg: ThreadMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
  }, [])

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([])
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages((data as ThreadMessage[]) || [])
    setLoading(false)
  }, [conversationId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const row = payload.new as { id: string }
          const { data } = await supabase.from('messages').select(MESSAGE_SELECT).eq('id', row.id).single()
          if (data) appendUnique(data as ThreadMessage)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, appendUnique])

  return { messages, setMessages, loading, reload: load, appendUnique }
}