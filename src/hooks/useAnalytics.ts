'use client'

type EventName =
  | 'page_view' | 'session_start' | 'session_end'
  | 'diagnostic_start' | 'diagnostic_complete'
  | 'attempt_submit' | 'explanation_viewed'
  | 'skill_unlocked' | 'streak_milestone'

export function useAnalytics() {
  function track(event: { name: EventName; props?: Record<string, unknown> }) {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify(event))
    }
  }
  return { track }
}
