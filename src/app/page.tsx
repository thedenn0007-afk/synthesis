import Link from 'next/link'

const PHASES = [
  { num: '01', title: 'Computer Basics',       count: 12, active: true,  desc: 'CPU, memory, binary, how code runs' },
  { num: '02', title: 'CS & Data Foundations', count: 9,  active: true,  desc: 'NumPy, vectors, algorithms, Big O' },
  { num: '03', title: 'Intro to AI',            count: 2,  active: false, desc: 'What AI is, ML vs DL' },
  { num: '04', title: 'Machine Learning',       count: 2,  active: false, desc: 'Supervised learning, data pipelines' },
  { num: '05', title: 'Deep Learning',          count: 1,  active: false, desc: 'Neural networks, backprop' },
  { num: '06', title: 'Modern AI Systems',      count: 3,  active: false, desc: 'Transformers, embeddings, RAG' },
  { num: '07', title: 'Real-World Products',    count: 1,  active: false, desc: 'APIs, production, deployment' },
  { num: '08', title: 'Mastery & Design',       count: 1,  active: false, desc: 'System design, architecture' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-c-bg">
      <div className="max-w-3xl mx-auto px-8 py-20">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="mb-16 animate-slide-up">
          <p className="font-mono text-[11px] text-c-faint uppercase tracking-[0.18em] mb-4">
            Adaptive learning platform
          </p>
          <h1 className="font-serif italic text-[52px] text-c-text leading-[1.1] mb-6">
            Synaptic<span className="text-c-purple">.</span>
          </h1>
          <p className="text-[16px] text-c-muted leading-[1.7] max-w-xl mb-8">
            Learn AI engineering from first principles. Adaptive questions, spaced repetition,
            and a prerequisite graph that ensures you never skip a foundation.
          </p>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-xl bg-c-purple hover:bg-[var(--purple-hover)] text-white text-[14px] font-medium transition-all hover:scale-[1.02] shadow-sm"
            >
              Start learning →
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl border border-[var(--border)] text-c-muted hover:text-c-text text-[14px] transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* ── Phase list ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3">
          {PHASES.map((phase, i) => (
            <div
              key={i}
              className={`p-5 rounded-xl border transition-all ${
                phase.active
                  ? 'border-[var(--border)] bg-c-bg2'
                  : 'border-[var(--border)] bg-c-bg4 opacity-55'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-c-faint">{phase.num}</span>
                  <span className="text-[14px] font-medium text-c-text">{phase.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-c-faint">{phase.count} skills</span>
                  {phase.active ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-c-green/10 border border-c-green/20 text-c-green">
                      Active
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)] text-c-ghost">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[12px] text-c-faint ml-8">{phase.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
