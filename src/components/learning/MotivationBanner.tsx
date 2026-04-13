'use client'

const MESSAGES: Record<string, { text: string; color: string }> = {
  frustrated: { text: "Let's take a step back — here's something you already know well.", color: 'var(--blue)' },
  bored:      { text: "You're clearly past this — trying something more challenging.",    color: 'var(--yellow)' },
  winning:    { text: "You're on a streak! Keep it up.",                                  color: 'var(--green)' },
}

export function MotivationBanner({ state }: { state: string }) {
  const msg = MESSAGES[state]
  if (!msg) return null
  return (
    <div
      className="mb-4 px-4 py-3 rounded-lg border bg-c-bg2"
      style={{ borderColor: `${msg.color}30` }}
    >
      <p className="text-[12px]" style={{ color: msg.color }}>{msg.text}</p>
    </div>
  )
}
