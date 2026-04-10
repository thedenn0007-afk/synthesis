'use client'
import { useState } from 'react'
import type { Explanation } from '@/types'
import { mdToHtml } from '@/components/ui/mdToHtml'

type Sub = 'body' | 'real_world' | 'build_task' | 'explain_back'

interface Props {
  explanation: Explanation
  onExplainBack?: (text: string) => void
  onBuildTaskDone?: () => void
}

export function ExplanationPanel({ explanation: e, onExplainBack, onBuildTaskDone }: Props) {
  const [sub, setSub] = useState<Sub>('body')
  const [explainText, setExplainText] = useState('')
  const [buildDone, setBuildDone] = useState(false)

  const tabs: [Sub, string][] = [
    ['body', 'Explanation'],
    ...(e.real_world_usage   ? [['real_world',  'Used in practice'] as [Sub, string]] : []),
    ...(e.build_task         ? [['build_task',  'Build it']         as [Sub, string]] : []),
    ...(e.explain_back_prompt ? [['explain_back', 'Explain it back'] as [Sub, string]] : []),
  ]

  return (
    <div className="rounded-2xl bg-[#111118] border border-white/[0.07] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <p className="text-[11px] font-mono text-[#5a5a72] uppercase tracking-[0.14em] mb-1">Explanation</p>
        <h3 className="text-[16px] font-semibold text-[#e8e8f0] mb-3">{e.title}</h3>
        {e.key_insight && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-[#7c6eff]/[0.08] border border-[#7c6eff]/20">
            <p className="text-[12px] text-[#7c6eff] italic">"{e.key_insight}"</p>
          </div>
        )}
        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-1 mb-0 border-b border-white/[0.06]">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setSub(id)}
                className={`px-3 py-2 text-[11px] font-mono transition-colors border-b-2 -mb-px ${sub === id ? 'text-[#7c6eff] border-[#7c6eff]' : 'text-[#5a5a72] border-transparent hover:text-[#9898b0]'}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        {sub === 'body' && (
          <div>
            <div className="prose-synaptic text-[13px] text-[#9898b0] leading-[1.7]"
              dangerouslySetInnerHTML={{ __html: mdToHtml(e.body) }} />
            {e.common_mistakes && e.common_mistakes.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/[0.05]">
                <p className="text-[10px] font-mono text-[#5a5a72] uppercase tracking-[0.14em] mb-3">Common mistakes</p>
                <ul className="space-y-2">
                  {e.common_mistakes.map((m, i) => (
                    <li key={i} className="flex gap-2 text-[12px] text-[#9898b0]">
                      <span className="text-[#f87171] mt-0.5">·</span><span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {e.mini_exercise && (
              <div className="mt-4 p-4 rounded-xl bg-[#17171f] border border-white/[0.06]">
                <p className="text-[10px] font-mono text-[#5a5a72] uppercase tracking-[0.14em] mb-2">Try it</p>
                <p className="text-[12px] text-[#9898b0] leading-[1.6]">{e.mini_exercise}</p>
              </div>
            )}
          </div>
        )}

        {sub === 'real_world' && e.real_world_usage && (
          <div>
            <p className="text-[11px] font-mono text-[#34d399] uppercase tracking-[0.12em] mb-3">Production use</p>
            <div className="text-[13px] text-[#9898b0] leading-[1.7]"
              dangerouslySetInnerHTML={{ __html: mdToHtml(e.real_world_usage) }} />
          </div>
        )}

        {sub === 'build_task' && e.build_task && (
          <div>
            <p className="text-[11px] font-mono text-[#fbbf24] uppercase tracking-[0.12em] mb-2">Build task</p>
            <p className="text-[15px] font-medium text-[#e8e8f0] mb-1">{e.build_task.title}</p>
            {e.build_task.context && <p className="text-[12px] text-[#9898b0] mb-4">{e.build_task.context}</p>}
            <ol className="space-y-2 mb-4">
              {e.build_task.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-[13px] text-[#9898b0]">
                  <span className="font-mono text-[11px] text-[#5a5a72] mt-0.5 w-5 flex-shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            {e.build_task.expected_output && (
              <div className="p-3 rounded-lg bg-[#17171f] border border-white/[0.06] mb-3">
                <p className="text-[10px] font-mono text-[#5a5a72] mb-1">Expected output</p>
                <p className="text-[12px] text-[#9898b0]">{e.build_task.expected_output}</p>
              </div>
            )}
            {e.build_task.hint && !buildDone && (
              <p className="text-[12px] text-[#fbbf24] mb-3">Hint: {e.build_task.hint}</p>
            )}
            {e.build_task.starter_code && (
              <pre className="text-[11px] bg-[#0e0e16] rounded-lg p-3 text-[#9898b0] font-mono mb-4 overflow-x-auto">{e.build_task.starter_code}</pre>
            )}
            <button onClick={() => { setBuildDone(true); onBuildTaskDone?.() }}
              className="px-4 py-2 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24] text-[12px] hover:bg-[#fbbf24]/20 transition-all">
              {buildDone ? '✓ Marked complete' : 'Mark as done'}
            </button>
          </div>
        )}

        {sub === 'explain_back' && e.explain_back_prompt && (
          <div>
            <p className="text-[11px] font-mono text-[#60a5fa] uppercase tracking-[0.12em] mb-3">Explain it back</p>
            <p className="text-[13px] text-[#e8e8f0] mb-4 leading-[1.6]">{e.explain_back_prompt}</p>
            <textarea value={explainText} onChange={e2 => setExplainText(e2.target.value)} rows={5}
              placeholder="Write your explanation here…"
              className="w-full px-4 py-3 rounded-xl bg-[#17171f] border border-white/[0.08] text-[#e8e8f0] placeholder:text-[#3a3a50] text-[13px] focus:border-[#60a5fa]/50 focus:outline-none resize-none transition-colors mb-3" />
            <button onClick={() => onExplainBack?.(explainText)} disabled={!explainText.trim()}
              className="px-4 py-2 rounded-lg bg-[#60a5fa]/10 border border-[#60a5fa]/20 text-[#60a5fa] text-[12px] hover:bg-[#60a5fa]/20 transition-all disabled:opacity-40">
              Submit explanation
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
