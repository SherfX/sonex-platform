import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatMessageTime(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

export function formatRelative(iso?: string | null) {
  if (!iso) return ''
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return '—'
  return format(new Date(iso), 'MMM d, yyyy · h:mm a')
}