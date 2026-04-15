import type { ReviewUrgency } from '@/types'

export interface ReviewUrgencyInfo {
  urgency:       ReviewUrgency
  days_until_due: number   // negative = overdue, positive = future
  label:         string    // e.g. "Overdue by 2 days", "Due today", "Due tomorrow"
}

export function deriveUrgency(due_at: string, now = new Date()): ReviewUrgencyInfo {
  const due      = new Date(due_at)
  const diffMs   = due.getTime() - now.getTime()
  const daysUntil = diffMs / 86400000

  let urgency: ReviewUrgency
  if (daysUntil < 0)      urgency = 'overdue'
  else if (daysUntil < 1) urgency = 'due_today'
  else if (daysUntil <= 3) urgency = 'due_soon'
  else                     urgency = 'upcoming'

  const days_until_due = Math.round(daysUntil * 10) / 10

  let label: string
  if (urgency === 'overdue') {
    const daysAgo = Math.max(1, Math.ceil(-daysUntil))
    label = daysAgo === 1 ? 'Overdue by 1 day' : `Overdue by ${daysAgo} days`
    if (-daysUntil < 0.1) label = 'Due now'
  } else if (urgency === 'due_today') {
    label = 'Due today'
  } else {
    const days = Math.ceil(daysUntil)
    label = days === 1 ? 'Due tomorrow' : `Due in ${days} days`
  }

  return { urgency, days_until_due, label }
}
