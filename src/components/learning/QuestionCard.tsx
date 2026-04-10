'use client'
import type { Question } from '@/types'

interface Props {
  question: Question
  selected: string | null
  fillAnswer: string
  revealed: boolean
  onSelect: (id: string) => void
  onFillChange: (val: string) => void
}

export function QuestionCard({ question: q, selected, fillAnswer, revealed, onSelect, onFillChange }: Props) {
  // Split stem into prose + optional code block
  const lines     = (q.stem || q.prompt || '').split('\n')
  const codeStart = lines.findIndex(l => l.startsWith('    ') || l.trim().startsWith('def ') || l.trim().startsWith('for ') || l.trim().startsWith('import ') || l.trim().startsWith('class '))
  const prose     = codeStart > 0 ? lines.slice(0, codeStart).join('\n') : (q.stem || q.prompt || '')
  const code      = codeStart > 0 ? lines.slice(codeStart).join('\n') : null

  return (
    <div>
      <p className="text-[15px] text-[#e8e8f0] leading-[1.65] mb-4">{prose}</p>
      {code && (
        <pre className="text-[12px] text-[#c8d0e8] bg-[#0e0e16] border border-white/[0.06] rounded-xl p-4 mb-5 overflow-x-auto font-mono leading-[1.8]">{code}</pre>
      )}

      {q.format === 'mcq' && q.options && (
        <div className="space-y-2.5">
          {q.options.map(opt => {
            const isSel = selected === opt.id
            const isOk  = revealed && opt.id === q.correct_option_id
            const isBad = revealed && isSel && opt.id !== q.correct_option_id
            let cls = 'w-full text-left px-5 py-3.5 rounded-xl border transition-all text-[13px] flex items-start gap-3 '
            if (isOk)       cls += 'border-[#34d399]/40 bg-[#34d399]/[0.08] text-[#34d399]'
            else if (isBad) cls += 'border-[#f87171]/40 bg-[#f87171]/[0.08] text-[#f87171]'
            else if (isSel) cls += 'border-[#7c6eff]/50 bg-[#7c6eff]/10 text-[#7c6eff]'
            else            cls += 'border-white/[0.08] bg-[#111118] text-[#9898b0] hover:border-white/[0.16] hover:text-[#e8e8f0] cursor-pointer'
            return (
              <button key={opt.id} className={cls} onClick={() => !revealed && onSelect(opt.id)} disabled={revealed}>
                <span className="font-mono text-[11px] mt-0.5 opacity-60">{opt.id.toUpperCase()}</span>
                <span>{opt.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {q.format === 'fill' && (
        <div>
          <input
            type="text" value={fillAnswer} onChange={e => onFillChange(e.target.value)}
            disabled={revealed} placeholder="Type your answer…"
            className="w-full px-4 py-3 rounded-xl bg-[#111118] border border-white/[0.08] text-[#e8e8f0] placeholder:text-[#3a3a50] text-[14px] focus:border-[#7c6eff]/50 focus:outline-none focus:ring-1 focus:ring-[#7c6eff]/30 disabled:opacity-60 transition-colors"
          />
          {revealed && (
            <p className="mt-2 text-[12px] text-[#5a5a72] font-mono">Expected: <span className="text-[#fbbf24]">{q.correct_answer}</span></p>
          )}
        </div>
      )}

      {q.format === 'explain' && (
        <textarea
          value={fillAnswer} onChange={e => onFillChange(e.target.value)}
          disabled={revealed} placeholder="Explain in your own words…" rows={4}
          className="w-full px-4 py-3 rounded-xl bg-[#111118] border border-white/[0.08] text-[#e8e8f0] placeholder:text-[#3a3a50] text-[13px] focus:border-[#7c6eff]/50 focus:outline-none resize-none disabled:opacity-60 transition-colors"
        />
      )}
    </div>
  )
}
