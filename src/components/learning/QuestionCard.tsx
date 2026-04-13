'use client'
import type { Question } from '@/types'

interface Props {
  question:     Question
  selected:     string | null
  fillAnswer:   string
  revealed:     boolean
  onSelect:     (id: string) => void
  onFillChange: (val: string) => void
}

export function QuestionCard({ question: q, selected, fillAnswer, revealed, onSelect, onFillChange }: Props) {
  // Split stem into prose + optional code block
  const lines     = (q.stem || q.prompt || '').split('\n')
  const codeStart = lines.findIndex(
    l => l.startsWith('    ') || l.trim().startsWith('def ') || l.trim().startsWith('for ')
      || l.trim().startsWith('import ') || l.trim().startsWith('class ')
  )
  const prose = codeStart > 0 ? lines.slice(0, codeStart).join('\n') : (q.stem || q.prompt || '')
  const code  = codeStart > 0 ? lines.slice(codeStart).join('\n') : null

  return (
    <div>
      {/* Question stem */}
      <p className="text-[15px] text-c-text leading-[1.65] mb-4">{prose}</p>

      {/* Inline code block */}
      {code && (
        <pre className="text-[12px] text-c-muted bg-c-bg4 border border-[var(--border)] rounded-xl p-4 mb-5 overflow-x-auto font-mono leading-[1.8]">
          {code}
        </pre>
      )}

      {/* MCQ options */}
      {q.format === 'mcq' && q.options && (
        <div className="space-y-2.5">
          {q.options.map(opt => {
            const isSel = selected === opt.id
            const isOk  = revealed && opt.id === q.correct_option_id
            const isBad = revealed && isSel && opt.id !== q.correct_option_id

            let cls = 'w-full text-left px-5 py-3.5 rounded-xl border transition-all text-[13px] flex items-start gap-3 '
            if (isOk)       cls += 'border-c-green/40 bg-c-green/[0.08] text-c-green'
            else if (isBad) cls += 'border-c-red/40   bg-c-red/[0.08]   text-c-red'
            else if (isSel) cls += 'border-c-purple/50 bg-c-purple/10   text-c-purple'
            else            cls += 'border-[var(--border)] bg-c-bg2 text-c-muted hover:border-[var(--border-hi)] hover:text-c-text cursor-pointer'

            return (
              <button key={opt.id} className={cls} onClick={() => !revealed && onSelect(opt.id)} disabled={revealed}>
                <span className="font-mono text-[11px] mt-0.5 opacity-60 flex-shrink-0">
                  {opt.id.toUpperCase()}
                </span>
                <span>{opt.text}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Fill-in */}
      {q.format === 'fill' && (
        <div>
          <input
            type="text"
            value={fillAnswer}
            onChange={e => onFillChange(e.target.value)}
            disabled={revealed}
            placeholder="Type your answer…"
            className="w-full px-4 py-3 rounded-xl bg-c-bg2 border border-[var(--border)] text-c-text placeholder:text-c-ghost text-[14px] focus:border-c-purple/50 focus:outline-none focus:ring-1 focus:ring-c-purple/30 disabled:opacity-60 transition-colors"
          />
          {revealed && (
            <p className="mt-2 text-[12px] text-c-faint font-mono">
              Expected: <span className="text-c-yellow">{q.correct_answer}</span>
            </p>
          )}
        </div>
      )}

      {/* Explain */}
      {q.format === 'explain' && (
        <textarea
          value={fillAnswer}
          onChange={e => onFillChange(e.target.value)}
          disabled={revealed}
          placeholder="Explain in your own words…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-c-bg2 border border-[var(--border)] text-c-text placeholder:text-c-ghost text-[13px] focus:border-c-purple/50 focus:outline-none resize-none disabled:opacity-60 transition-colors"
        />
      )}
    </div>
  )
}
