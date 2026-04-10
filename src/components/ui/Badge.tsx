const COLOURS = {
  purple: 'text-[#7c6eff] border-[#7c6eff]/25 bg-[#7c6eff]/08',
  green:  'text-[#34d399] border-[#34d399]/25 bg-[#34d399]/08',
  yellow: 'text-[#fbbf24] border-[#fbbf24]/25 bg-[#fbbf24]/08',
  red:    'text-[#f87171] border-[#f87171]/25 bg-[#f87171]/08',
  blue:   'text-[#60a5fa] border-[#60a5fa]/25 bg-[#60a5fa]/08',
} as const

export function Badge({ children, colour = 'purple' }: { children: React.ReactNode; colour?: keyof typeof COLOURS }) {
  return (
    <span className={`inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded-full border ${COLOURS[colour]}`}>
      {children}
    </span>
  )
}
