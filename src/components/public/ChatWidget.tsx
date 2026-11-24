import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type ChatMessage = {
  id: string
  body: string
  sender_id?: string | null
  created_at?: string
}

const LS_CONVERSATION_ID = 'sonex_public_chat_conversation_id'
const LS_VISITOR_NAME = 'sonex_public_chat_visitor_name'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [visitorName, setVisitorName] = useState('')
  const [started, setStarted] = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const persistSession = useCallback((convId: string, name: string) => {
    localStorage.setItem(LS_CONVERSATION_ID, convId)
    localStorage.setItem(LS_VISITOR_NAME, name)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(LS_CONVERSATION_ID)
    setConversationId(null)
    setStarted(false)
    setMessages([])
  }, [])

  const loadMessages = useCallback(async (convId: string) => {
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError('Could not load messages.')
      return false
    }
    setMessages(data || [])
    return true
  }, [])

  const resumeConversation = useCallback(
    async (convId: string) => {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', convId)
        .is('project_id', null)
        .maybeSingle()

      if (convError || !conv) {
        localStorage.removeItem(LS_CONVERSATION_ID)
        setConversationId(null)
        setStarted(false)
        setMessages([])
        return
      }

      setConversationId(convId)
      setStarted(true)
      const ok = await loadMessages(convId)
      if (!ok) clearSession()
    },
    [clearSession, loadMessages],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const storedName = localStorage.getItem(LS_VISITOR_NAME)
      const storedId = localStorage.getItem(LS_CONVERSATION_ID)
      if (storedName) setVisitorName(storedName)
      if (storedId && !cancelled) await resumeConversation(storedId)
      if (!cancelled) setHydrating(false)
    })()
    return () => {
      cancelled = true
    }
  }, [resumeConversation])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`public-chat-messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row]
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function startChat(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!visitorName.trim()) {
      setError('Please enter your name')
      return
    }

    const existingId = localStorage.getItem(LS_CONVERSATION_ID)
    if (existingId) {
      await resumeConversation(existingId)
      return
    }

    setSending(true)
    const name = visitorName.trim()
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        title: `Public chat - ${name}`,
      })
      .select('id')
      .single()

    if (convError || !conv) {
      console.error(convError)
      setError('Could not start chat. Please try contact form or WhatsApp.')
      setSending(false)
      return
    }

    persistSession(conv.id, name)
    setConversationId(conv.id)
    setStarted(true)

    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_id: null,
      body: `Thanks ${name}! An admin will reply shortly. You can also reach us on WhatsApp.`,
    })

    await loadMessages(conv.id)
    setSending(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !conversationId) return

    setSending(true)
    setError('')
    const body = input.trim()
    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: null,
      body,
    })

    if (insertError) {
      setError('Message failed to send.')
      setSending(false)
      return
    }

    setInput('')
    setSending(false)
  }

  const showComposer = started && !hydrating

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition hover:bg-accent/90"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[min(500px,70vh)] w-[min(20rem,calc(100vw-2rem))] flex-col rounded-xl border border-border bg-background shadow-2xl">
          <div className="border-b px-4 py-3 font-semibold">Chat with Sonex</div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {hydrating ? (
              <p className="text-muted-foreground">Loading your conversation…</p>
            ) : (
              <>
                {!showComposer && messages.length === 0 && (
                  <p className="rounded-lg bg-muted px-3 py-2 text-foreground">
                    Hello! Welcome to Sonex Contractors. How can we help you today?
                  </p>
                )}
                {messages.map((m) => {
                  const isVisitor = !m.sender_id
                  return (
                    <div
                      key={m.id}
                      className={`max-w-[85%] rounded-lg px-3 py-2 ${
                        isVisitor
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground'
                      }`}
                    >
                      {m.body}
                    </div>
                  )
                })}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {!showComposer ? (
            <form onSubmit={startChat} className="space-y-2 border-t p-3">
              <input
                required
                placeholder="Your name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={sending || hydrating}
                className="w-full rounded-md bg-primary py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {sending ? 'Starting…' : hydrating ? 'Loading…' : 'Start chat'}
              </button>
            </form>
          ) : (
            <form onSubmit={sendMessage} className="border-t p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            </form>
          )}
        </div>
      )}
    </>
  )
}