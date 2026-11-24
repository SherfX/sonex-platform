import { useEffect, useRef, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { formatMessageTime } from '../../lib/format'
import { cn } from '../../lib/utils'
import { buttonPrimaryClassName, inputClassName } from '../ui/inputStyles'

export type ThreadMessage = {
  id: string
  body: string
  sender_id?: string | null
  created_at?: string | null
  profiles?: { full_name?: string | null; email?: string | null } | null
  is_bot?: boolean
}

type MessageThreadProps = {
  messages: ThreadMessage[]
  currentUserId?: string | null
  /** When true, null sender = visitor (left); staff = right */
  staffView?: boolean
  onSend: (body: string) => void | Promise<void>
  sending?: boolean
  placeholder?: string
  title?: string
  emptyLabel?: string
  className?: string
  maxHeightClass?: string
}

export function MessageThread({
  messages,
  currentUserId,
  staffView = false,
  onSend,
  sending,
  placeholder = 'Type a message…',
  title = 'Messages',
  emptyLabel = 'No messages yet. Start the conversation.',
  className,
  maxHeightClass = 'max-h-[28rem]',
}: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = inputRef.current?.value.trim()
    if (!value || sending) return
    await onSend(value)
    if (inputRef.current) inputRef.current.value = ''
  }

  function bubbleSide(m: ThreadMessage): 'left' | 'right' {
    if (staffView) {
      if (m.sender_id === currentUserId) return 'right'
      return 'left'
    }
    if (m.is_bot || !m.sender_id) return 'left'
    if (m.sender_id === currentUserId) return 'right'
    return 'left'
  }

  function senderLabel(m: ThreadMessage): string | null {
    if (m.is_bot) return 'Sonex'
    if (!m.sender_id) return staffView ? 'Visitor' : 'Sonex team'
    if (m.sender_id === currentUserId) return 'You'
    return m.profiles?.full_name || m.profiles?.email || 'Team'
  }

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm',
        className,
      )}
    >
      <div className="border-b border-border/60 bg-muted/30 px-4 py-3">
        <p className="text-sm font-semibold">{title}</p>
      </div>

      <div
        className={cn(
          'flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,oklch(0.98_0.004_255)_0%,oklch(0.995_0.002_250)_100%)] px-3 py-4',
          maxHeightClass,
        )}
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        )}
        {messages.map((m) => {
          const side = bubbleSide(m)
          const label = senderLabel(m)
          return (
            <div
              key={m.id}
              className={cn(
                'flex flex-col gap-0.5',
                side === 'right' && 'items-end',
                side === 'left' && 'items-start',
              )}
            >
              {label && side === 'left' && (
                <span className="px-1 text-[11px] font-medium text-muted-foreground">{label}</span>
              )}
              <div
                className={cn(
                  'max-w-[min(85%,20rem)] px-3.5 py-2 text-sm leading-relaxed shadow-sm',
                  side === 'right'
                    ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
                    : m.is_bot
                      ? 'rounded-2xl rounded-bl-md border border-border/60 bg-background text-foreground'
                      : 'rounded-2xl rounded-bl-md bg-card border border-border/50 text-foreground',
                  side === 'left' && !m.is_bot && staffView && !m.sender_id && 'bg-accent/15 border-accent/25',
                )}
              >
                {m.body}
              </div>
              <span
                className={cn(
                  'px-1 text-[10px] text-muted-foreground',
                  side === 'right' && 'text-right',
                )}
              >
                {formatMessageTime(m.created_at)}
                {side === 'right' && label === 'You' ? '' : side === 'right' ? ` · ${label}` : ''}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border/60 bg-card p-3">
        <input
          ref={inputRef}
          disabled={sending}
          placeholder={placeholder}
          className={cn(inputClassName, 'flex-1 rounded-full')}
        />
        <button
          type="submit"
          disabled={sending}
          className={cn(buttonPrimaryClassName, 'h-10 w-10 shrink-0 rounded-full p-0')}
          aria-label="Send message"
        >
          <Send className="mx-auto h-4 w-4" />
        </button>
      </form>
    </div>
  )
}