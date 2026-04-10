'use client'
interface Props { correct: boolean; explanation_after?: string }
export function FeedbackBanner({ correct, explanation_after }: Props) {
  return (
    <div className={`rounded-xl px-5 py-4 border ${correct ? 'bg-[#34d399]/[0.07] border-[#34d399]/20' : 'bg-[#f87171]/[0.07] border-[#f87171]/20'}`}>
      <p className={`font-semibold text-[13px] mb-1 ${correct ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
        {correct ? '✓ Correct' : '✗ Incorrect'}
      </p>
      {explanation_after && <p className="text-[12px] text-[#9898b0] leading-[1.6]">{explanation_after}</p>}
    </div>
  )
}
