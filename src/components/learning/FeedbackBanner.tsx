'use client'
interface Props { correct: boolean; explanation_after?: string }

export function FeedbackBanner({ correct, explanation_after }: Props) {
  return (
    <div
      className={`rounded-xl px-5 py-4 border-2 animate-slide-up ${
        correct
          ? 'bg-c-green/[0.12] border-c-green/40'
          : 'bg-c-red/[0.12]   border-c-red/40'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        {/* Icon */}
        {correct ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-c-green flex-shrink-0">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-c-red flex-shrink-0">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        )}
        <p className={`font-semibold text-[15px] ${correct ? 'text-c-green' : 'text-c-red'}`}>
          {correct ? 'Correct!' : 'Not quite'}
        </p>
      </div>
      {explanation_after && (
        <p className="text-[14px] text-c-muted leading-[1.6] ml-[26px]">{explanation_after}</p>
      )}
    </div>
  )
}
