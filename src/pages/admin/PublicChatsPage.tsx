import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { PageHeader } from '../../components/ui/PageHeader'
import { AppCard } from '../../components/ui/AppCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { MessageThread, type ThreadMessage } from '../../components/messaging/MessageThread'
import { formatRelative } from '../../lib/format'
import { cn } from '../../lib/utils'

export function PublicChatsPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loadingList, setLoadingList] = useState(true)

  useEffect(() => {
    loadConversations()
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
  }, [])

  async function loadConversations() {
    setLoadingList(true)
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .is('project_id', null)
      .order('created_at', { ascending: false })
    setConversations(data || [])
    setLoadingList(false)
  }

  async function openConversation(conv: any) {
    setSelected(conv)
    const { data } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at, profiles(full_name, email)')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    setMessages((data as ThreadMessage[]) || [])
  }

  async function sendReply(body: string) {
    if (!selected || !userId) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: selected.id,
      sender_id: userId,
      body,
    })
    const { data } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at, profiles(full_name, email)')
      .eq('conversation_id', selected.id)
      .order('created_at', { ascending: true })
    setMessages((data as ThreadMessage[]) || [])
    setSending(false)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Support"
        title="Public chats"
        description="Visitor conversations from the website chat widget."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_1fr]">
        <AppCard className="p-3 lg:max-h-[32rem] lg:overflow-y-auto">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Conversations
          </p>
          {loadingList ? (
            <p className="px-2 text-sm text-muted-foreground">Loading…</p>
          ) : conversations.length === 0 ? (
            <EmptyState title="No chats" description="Public chats appear when visitors start a conversation." className="py-8" />
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => openConversation(c)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 text-left text-sm transition',
                      selected?.id === c.id
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'hover:bg-muted',
                    )}
                  >
                    <span className="line-clamp-2">{c.title || 'Untitled chat'}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatRelative(c.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AppCard>

        <div>
          {!selected ? (
            <AppCard className="flex min-h-[24rem] items-center justify-center text-center text-muted-foreground">
              Select a conversation to view and reply
            </AppCard>
          ) : (
            <MessageThread
              messages={messages}
              currentUserId={userId}
              staffView
              onSend={sendReply}
              sending={sending}
              title={selected.title || 'Public chat'}
              maxHeightClass="max-h-[calc(32rem-8rem)]"
            />
          )}
        </div>
      </div>
    </div>
  )
}