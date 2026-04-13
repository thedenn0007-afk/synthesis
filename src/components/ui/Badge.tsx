// Badge uses semantic color tokens — stays correct in both dark and light mode
const COLOURS = {
  purple: 'text-c-purple border-c-purple/25 bg-c-purple/[0.08]',
  green:  'text-c-green  border-c-green/25  bg-c-green/[0.08]',
  yellow: 'text-c-yellow border-c-yellow/25 bg-c-yellow/[0.08]',
  red:    'text-c-red    border-c-red/25    bg-c-red/[0.08]',
  blue:   'text-c-blue   border-c-blue/25   bg-c-blue/[0.08]',
} as const

export function Badge({
  children,
  colour = 'purple',
}: {
  children: React.ReactNode
  colour?: keyof typeof COLOURS
}) {
  return (
    <span className={`inline-flex items-center font-mono text-[10px] px-2 py-0.5 rounded-full border ${COLOURS[colour]}`}>
      {children}
    </span>
  )
}
