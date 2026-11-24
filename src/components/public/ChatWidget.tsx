import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

type ChatMessage = {
  id: string
  body: string
  sender_id?: string | null
  created_at?: string
  is_bot?: boolean
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [visitorName, setVisitorName] = useState('')
  const [started, setStarted] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          body: 'Hello! Welcome to Sonex Contractors. How can we help you today?',
          is_bot: true,
          created_at: new Date().toISOString(),
        },
      ])
    }
  }, [open, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMessages(convId: string) {
    const { data, error: fetchError } = await supabase
      .from('messages')
      .select('id, body, sender_id, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError('Could not load messages.')
      return
    }
    setMessages(data || [])
  }

  async function startChat(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!visitorName.trim()) {
      setError('Please enter your name')
      return
    }

    setSending(true)
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        title: `Public chat - ${visitorName.trim()}`,
      })
      .select('id')
      .single()

    if (convError || !conv) {
      console.error(convError)
      setError('Could not start chat. Please try contact form or WhatsApp.')
      setSending(false)
      return
    }

    setConversationId(conv.id)
    setStarted(true)

    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_id: null,
      body: `Thanks ${visitorName.trim()}! An admin will reply shortly. You can also reach us on WhatsApp.`,
    })

    await loadMessages(conv.id)
    setSending(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !conversationId) return

    setSending(true)
    setError('')
    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: null,
      body: input.trim(),
    })

    if (insertError) {
      setError('Message failed to send.')
      setSending(false)
      return
    }

    setInput('')
    await loadMessages(conversationId)
    setSending(false)
  }

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
            {messages.map((m) => {
              const isVisitor = !m.sender_id && !m.is_bot
              const isStaff = Boolean(m.sender_id)
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    isVisitor
                      ? 'ml-auto bg-primary text-primary-foreground'
                      : isStaff
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-foreground'
                  }`}
                >
                  {m.body}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {!started ? (
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
                disabled={sending}
                className="w-full rounded-md bg-primary py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                {sending ? 'Starting…' : 'Start chat'}
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