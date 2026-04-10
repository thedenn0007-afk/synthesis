import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { verifyToken } from '@/lib/db/auth'
import { getLearnerProfile, getAllSkillStates, getRecentSessions, getRecentAttempts } from '@/lib/db/queries'
import { getAllNodes } from '@/lib/graph'
import { Navbar } from '@/components/layout/Navbar'

export default async function ProfilePage() {
  const cookieStore = cookies()
  const token = cookieStore.get('synaptic_token')?.value
  if (!token) redirect('/login')
  const user = verifyToken(token)
  if (!user) redirect('/login')

  const profile    = getLearnerProfile(user.id)
  if (!profile) redirect('/login')

  const skillStates = getAllSkillStates(user.id)
  const sessions    = getRecentSessions(user.id, 10)
  const attempts    = getRecentAttempts(user.id, 200)
  const allNodes    = getAllNodes()

  const mastered    = skillStates.filter(s => s.mastery_state === 'mastered').length
  const learning    = skillStates.filter(s => ['learning','fragile'].includes(s.mastery_state)).length
  const totalAttempts = attempts.length
  const accuracy    = totalAttempts > 0 ? Math.round(attempts.filter(a => a.correct).length / totalAttempts * 100) : 0

  // Top skills by attempt count
  const skillCount: Record<string, number> = {}
  for (const a of attempts) skillCount[a.skill_id] = (skillCount[a.skill_id] ?? 0) + 1
  const topSkills = Object.entries(skillCount).sort(([,a],[,b]) => b-a).slice(0,5)
    .map(([id, count]) => ({ id, count, label: allNodes.find(n => n.id === id)?.label ?? id }))

  // 7-day activity
  const days = Array.from({length:7},(_,i) => {
    const d = new Date(Date.now() - (6-i)*86400000)
    const str = d.toISOString().slice(0,10)
    const count = attempts.filter(a => a.attempted_at?.slice(0,10) === str).length
    return { str, count, label: d.toLocaleDateString('en-US',{weekday:'short'})[0] }
  })

  const completedSessions = sessions.filter(s => s.ended_at)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-start gap-5 mb-10 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-[#7c6eff]/20 border border-[#7c6eff]/30 flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-2xl text-[#7c6eff]">{(profile.display_name ?? 'L')[0].toUpperCase()}</span>
          </div>
          <div>
            <h1 className="font-serif italic text-[28px] text-[#e8e8f0] mb-1">{profile.display_name ?? 'Learner'}</h1>
            <p className="text-[12px] text-[#5a5a72] font-mono">{profile.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24]">🔥 {profile.streak_days} day streak</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { val: mastered, lbl: 'Mastered', col: '#34d399' },
            { val: learning, lbl: 'Learning', col: '#fbbf24' },
            { val: totalAttempts, lbl: 'Attempts', col: '#7c6eff' },
            { val: `${accuracy}%`, lbl: 'Accuracy', col: '#60a5fa' },
          ].map((s,i) => (
            <div key={i} className="p-4 rounded-xl border border-white/[0.07] bg-[#111118]">
              <p className="font-serif text-[28px] leading-none mb-1" style={{ color: s.col }}>{s.val}</p>
              <p className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.1em]">{s.lbl}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Top skills */}
          <div className="p-5 rounded-xl border border-white/[0.07] bg-[#111118]">
            <p className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.14em] mb-4">Most practiced</p>
            {topSkills.length > 0 ? topSkills.map((s,i) => (
              <div key={s.id} className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#3a3a50]">{i+1}</span>
                  <span className="text-[12px] text-[#9898b0]">{s.label}</span>
                </div>
                <span className="font-mono text-[11px] text-[#5a5a72]">{s.count}×</span>
              </div>
            )) : <p className="text-[12px] text-[#3a3a50]">No attempts yet</p>}
          </div>

          {/* Recent sessions */}
          <div className="p-5 rounded-xl border border-white/[0.07] bg-[#111118]">
            <p className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.14em] mb-4">Recent sessions</p>
            {completedSessions.slice(0,5).map(s => {
              const acc = s.tasks_count > 0 ? Math.round(s.correct_count/s.tasks_count*100) : 0
              return (
                <div key={s.id} className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[12px] text-[#9898b0]">{new Date(s.started_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
                    <p className="font-mono text-[10px] text-[#5a5a72]">{s.tasks_count} q</p>
                  </div>
                  <span className={`font-mono text-[12px] ${acc>=70?'text-[#34d399]':acc>=40?'text-[#fbbf24]':'text-[#f87171]'}`}>{acc}%</span>
                </div>
              )
            })}
            {completedSessions.length === 0 && <p className="text-[12px] text-[#3a3a50]">No sessions yet</p>}
          </div>
        </div>

        {/* 7-day heatmap */}
        <div className="p-5 rounded-xl border border-white/[0.07] bg-[#111118]">
          <p className="font-mono text-[10px] text-[#5a5a72] uppercase tracking-[0.14em] mb-4">Last 7 days</p>
          <div className="flex gap-2">
            {days.map((d,i) => {
              const intensity = d.count === 0 ? 0 : d.count < 5 ? 1 : d.count < 15 ? 2 : 3
              const colours   = ['#17171f','#7c6eff30','#7c6eff60','#7c6eff']
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full h-8 rounded-md" style={{background:colours[intensity]}} title={`${d.count} attempts`} />
                  <span className="text-[10px] font-mono text-[#3a3a50]">{d.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
