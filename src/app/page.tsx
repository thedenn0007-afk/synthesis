import Link from 'next/link'

const PHASES = [
  { num: '01', title: 'Computer Basics',      count: 12, active: true,  desc: 'CPU, memory, binary, how code runs' },
  { num: '02', title: 'CS & Data Foundations',count: 9,  active: true,  desc: 'NumPy, vectors, algorithms, Big O' },
  { num: '03', title: 'Intro to AI',           count: 2,  active: false, desc: 'What AI is, ML vs DL' },
  { num: '04', title: 'Machine Learning',      count: 2,  active: false, desc: 'Supervised learning, data pipelines' },
  { num: '05', title: 'Deep Learning',         count: 1,  active: false, desc: 'Neural networks, backprop' },
  { num: '06', title: 'Modern AI Systems',     count: 3,  active: false, desc: 'Transformers, embeddings, RAG' },
  { num: '07', title: 'Real-World Products',   count: 1,  active: false, desc: 'APIs, production, deployment' },
  { num: '08', title: 'Mastery & Design',      count: 1,  active: false, desc: 'System design, architecture' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-3xl mx-auto px-8 py-20">
        <div className="mb-16 animate-slide-up">
          <p className="font-mono text-[11px] text-[#5a5a72] uppercase tracking-[0.18em] mb-4">Adaptive learning platform</p>
          <h1 className="font-serif italic text-[52px] text-[#e8e8f0] leading-[1.1] mb-6">
            Synaptic<span className="text-[#7c6eff]">.</span>
          </h1>
          <p className="text-[16px] text-[#9898b0] leading-[1.7] max-w-xl mb-8">
            Learn AI engineering from first principles. Adaptive questions, spaced repetition, and a prerequisite graph that ensures you never skip a foundation.
          </p>
          <div className="flex gap-3">
            <Link href="/signup" className="px-6 py-3 rounded-xl bg-[#7c6eff] hover:bg-[#6a5cdd] text-white text-[14px] font-medium transition-all hover:scale-[1.02]">
              Start learning →
            </Link>
            <Link href="/login" className="px-6 py-3 rounded-xl border border-white/[0.1] text-[#9898b0] hover:text-[#e8e8f0] text-[14px] transition-all">
              Sign in
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {PHASES.map((phase, i) => (
            <div key={i} className={`p-5 rounded-xl border transition-all ${phase.active ? 'border-white/[0.08] bg-[#111118]' : 'border-white/[0.04] bg-[#0d0d13] opacity-60'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[#5a5a72]">{phase.num}</span>
                  <span className="text-[14px] font-medium text-[#e8e8f0]">{phase.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#5a5a72]">{phase.count} skills</span>
                  {phase.active
                    ? <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399]">Active</span>
                    : <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#5a5a72]">Coming soon</span>
                  }
                </div>
              </div>
              <p className="text-[12px] text-[#5a5a72] ml-8">{phase.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
