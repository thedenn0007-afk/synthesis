'use client'
const MESSAGES: Record<string, { text: string; colour: string }> = {
  frustrated: { text: "Let's take a step back — here's something you already know well.", colour: '#60a5fa' },
  bored:      { text: "You're clearly past this — trying something more challenging.", colour: '#fbbf24' },
  winning:    { text: "You're on a streak! Keep it up.", colour: '#34d399' },
}
export function MotivationBanner({ state }: { state: string }) {
  const msg = MESSAGES[state]
  if (!msg) return null
  return (
    <div className="mb-4 px-4 py-3 rounded-lg border border-white/[0.06] bg-[#111118]">
      <p className="text-[12px]" style={{ color: msg.colour }}>{msg.text}</p>
    </div>
  )
}
