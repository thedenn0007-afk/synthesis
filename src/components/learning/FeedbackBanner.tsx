'use client'
interface Props { correct: boolean; explanation_after?: string }

export function FeedbackBanner({ correct, explanation_after }: Props) {
  return (
    <div className={`rounded-xl px-5 py-4 border ${
      correct
        ? 'bg-c-green/[0.07] border-c-green/25'
        : 'bg-c-red/[0.07]   border-c-red/25'
    }`}>
      <p className={`font-semibold text-[13px] mb-1 ${correct ? 'text-c-green' : 'text-c-red'}`}>
        {correct ? '✓ Correct' : '✗ Incorrect'}
      </p>
      {explanation_after && (
        <p className="text-[12px] text-c-muted leading-[1.6]">{explanation_after}</p>
      )}
    </div>
  )
}
