import { useState, useRef, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Camera,
  Trophy,
  Check,
  AlertTriangle,
  MessageSquare,
  RotateCcw,
} from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import type { CheckInRecord, Exercise } from '@/types'

const categoryConfig: Record<string, { label: string; color: string }> = {
  stretch: { label: '拉伸', color: 'bg-[#FF8C42]' },
  strength: { label: '力量', color: 'bg-[#0EA5A0]' },
  mobility: { label: '活动度', color: 'bg-blue-500' },
  balance: { label: '平衡', color: 'bg-purple-500' },
}

function getScoreColor(score: number) {
  if (score < 60) return '#EF4444'
  if (score <= 80) return '#FF8C42'
  return '#34D399'
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = getScoreColor(score)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={6} strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

type DayStatus = 'all' | 'partial' | 'none' | 'missed' | 'future'
const statusDotColor: Record<DayStatus, string> = {
  all: 'bg-[#34D399]', partial: 'bg-[#FF8C42]', none: 'bg-gray-300',
  missed: 'bg-[#EF4444]', future: 'bg-transparent',
}

function getDayStatus(checkIns: (CheckInRecord & { exercise?: Exercise })[], dateKey: string, todayKey: string): DayStatus {
  if (dateKey > todayKey) return 'future'
  if (checkIns.length === 0) return 'none'
  const completed = checkIns.filter((c) => c.completed).length
  const total = checkIns.length
  if (completed === 0) return dateKey < todayKey ? 'missed' : 'none'
  if (completed === total) return 'all'
  return 'partial'
}

function fmtDateCN(d: Date) { return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` }
function dateKey(d: Date) { return d.toISOString().split('T')[0] }

export default function CheckIn() {
  const s = useStore()
  const injury = useMemo(() => s.injuries.find((i) => i.id === s.plan.injuryId), [s.injuries, s.plan.injuryId])

  const [view, setView] = useState<'calendar' | 'detail'>('calendar')
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selDate, setSelDate] = useState(new Date())
  const [celebrate, setCelebrate] = useState(false)
  const [wfOpen, setWfOpen] = useState(false)
  const [wfEx, setWfEx] = useState<Exercise | null>(null)
  const [wfDate, setWfDate] = useState('')
  const [photoB64, setPhotoB64] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<{ aiScore: number; aiFeedback: string; corrections: string[] } | null>(null)
  const [photoModal, setPhotoModal] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const monthDays = useMemo(() => {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth()
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0)
    const days: Date[] = []
    for (let i = first.getDay() - 1; i >= 0; i--) days.push(new Date(y, m, -i))
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i))
    for (let i = 1; days.length < 42; i++) days.push(new Date(y, m + 1, i))
    return days
  }, [viewMonth])

  const monthStats = useMemo(() => {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth()
    let completedDays = 0, totalScore = 0, scoredDays = 0, best = 0, cur = 0
    const last = new Date(y, m + 1, 0)
    for (let d = 1; d <= last.getDate(); d++) {
      const k = dateKey(new Date(y, m, d))
      s.initializeDayCheckIns(s.plan.id, k)
      const { completed, total, avg } = s.getTotalCountForDate(s.plan.id, k)
      if (total > 0 && completed === total) {
        completedDays++; cur++; best = Math.max(best, cur)
        if (avg > 0) { totalScore += avg; scoredDays++ }
      } else cur = 0
    }
    return { completedDays, avgScore: scoredDays > 0 ? Math.round(totalScore / scoredDays) : 0, bestStreak: best }
  }, [viewMonth, s])

  const selKey = dateKey(selDate)
  const selCheckIns = useMemo(() => {
    s.initializeDayCheckIns(s.plan.id, selKey)
    return s.getCheckInsForDate(s.plan.id, selKey)
  }, [s.plan.id, selKey, wfOpen])
  const selStats = s.getTotalCountForDate(s.plan.id, selKey)
  const allDone = selStats.total > 0 && selStats.completed === selStats.total
  const todayK = s.todaysDate

  const resetWf = () => { setPhotoB64(null); setAnalysis(null); setAnalyzing(false); if (fileRef.current) fileRef.current.value = '' }
  const openWf = (ex: Exercise, dk: string) => { setWfEx(ex); setWfDate(dk); resetWf(); setWfOpen(true) }
  const closeWf = () => { setWfOpen(false); setWfEx(null); resetWf() }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || !wfEx) return
    const b64 = await s.fileToBase64(f)
    setPhotoB64(b64); setAnalyzing(true); setAnalysis(null)
    await new Promise((r) => setTimeout(r, 1500))
    setAnalysis(s.analyzeExercise(wfEx.id, b64)); setAnalyzing(false)
  }

  const saveWf = () => {
    if (!wfEx || !analysis || !photoB64) return
    s.saveCheckIn(wfEx.id, wfDate, photoB64, analysis)
    closeWf()
  }

  useEffect(() => () => { if (fileRef.current) fileRef.current.value = '' }, [])

  if (celebrate) {
    const avg = selStats.avg, consec = s.getConsecutiveDaysForPlan(s.plan.id)
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0EA5A0] to-[#0d9490] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#FF8C42]/20">
            <Trophy className="h-10 w-10 text-[#FF8C42]" />
          </motion.div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">恭喜完成今日全部训练</h1>
          <p className="mb-6 text-sm text-gray-500">坚持就是胜利，继续加油！</p>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#0EA5A0]/10 p-4">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-[#0EA5A0]" />
              <p className="text-xs text-gray-500">平均得分</p>
              <p className="text-2xl font-bold text-[#0EA5A0]">{avg}</p>
            </div>
            <div className="rounded-2xl bg-[#FF8C42]/10 p-4">
              <Check className="mx-auto mb-2 h-8 w-8 text-[#FF8C42]" />
              <p className="text-xs text-gray-500">连续打卡</p>
              <p className="text-2xl font-bold text-[#FF8C42]">{consec} 天</p>
            </div>
          </div>
          <button onClick={() => { setView('calendar'); setCelebrate(false) }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5A0] px-6 py-3.5 text-base font-medium text-white shadow-lg hover:bg-[#0d9490]">
            <Calendar className="h-5 w-5" /> 返回日历
          </button>
        </motion.div>
      </div>
    )
  }

  if (view === 'detail') {
    const isFuture = selKey > todayK
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="mx-auto max-w-md px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-3">
            <button onClick={() => setView('calendar')} className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div className="flex-1"><h1 className="text-lg font-bold text-gray-900">{fmtDateCN(selDate)}</h1></div>
            <div className={cn('rounded-full px-3 py-1.5 text-xs font-medium',
              allDone ? 'bg-[#34D399]/15 text-[#34D399]' : selStats.completed > 0 ? 'bg-[#FF8C42]/15 text-[#FF8C42]' : 'bg-gray-100 text-gray-500')}>
              {selStats.completed}/{selStats.total} 完成
            </div>
          </motion.div>

          <AnimatePresence>
            {allDone && selKey <= todayK && (
              <motion.button initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }} onClick={() => { s.finishDayTraining(s.plan.id, selKey); setCelebrate(true) }}
                className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0EA5A0] to-[#0d9490] px-4 py-3.5 text-sm font-medium text-white shadow-md hover:shadow-lg active:scale-[0.98]">
                <Trophy className="h-5 w-5" /> 完成今日训练
              </motion.button>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            {selCheckIns.map((ci, idx) => {
              const ex = ci.exercise!
              const cat = categoryConfig[ex.category] ?? categoryConfig.strength
              const done = ci.completed
              const isPast = selKey < todayK
              return (
                <motion.div key={ci.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0EA5A0]/10">
                        <span className="text-sm font-bold text-[#0EA5A0]">{idx + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">{ex.name}</h3>
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium text-white', cat.color)}>{cat.label}</span>
                          {done && <span className="rounded-full bg-[#34D399]/15 px-2 py-0.5 text-[10px] font-medium text-[#34D399]">已完成</span>}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{ex.sets}组 × {ex.reps}次</p>
                      </div>
                    </div>
                    {done ? (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          {ci.photoUrl && (
                            <button onClick={() => setPhotoModal(ci.photoUrl)} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl shadow-sm">
                              <img src={ci.photoUrl} alt={ex.name} className="h-full w-full object-cover" />
                            </button>
                          )}
                          <div className="flex-1 flex items-start gap-3">
                            <ScoreRing score={ci.aiScore} size={56} />
                            <div className="min-w-0 flex-1 pt-1">
                              <p className="text-xs font-medium text-gray-900">AI 评分</p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 line-clamp-2">{ci.aiFeedback}</p>
                            </div>
                          </div>
                        </div>
                        {ci.corrections.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg bg-[#FF8C42]/5 p-2">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF8C42]" />
                            <span className="text-[11px] text-gray-600">{c}</span>
                          </div>
                        ))}
                        {ci.therapistFeedback && (
                          <div className="flex items-start gap-2 rounded-lg bg-[#FF8C42]/10 p-2.5">
                            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#FF8C42]" />
                            <div>
                              <p className="text-[10px] font-medium text-[#FF8C42]">康复师反馈</p>
                              <p className="mt-0.5 text-[11px] text-gray-700">{ci.therapistFeedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => !isFuture && openWf(ex, selKey)} disabled={isFuture}
                        className={cn('flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                          isFuture ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#0EA5A0] text-white shadow-md hover:bg-[#0d9490] active:scale-[0.98]')}>
                        <Camera className="h-4 w-4" />
                        {isFuture ? '未到打卡日期' : isPast ? '补打' : '开始打卡'}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <AnimatePresence>
          {wfOpen && wfEx && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={closeWf}>
              <motion.div initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0EA5A0]/10">
                    <Camera className="h-5 w-5 text-[#0EA5A0]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{wfEx.name}</h3>
                    <p className="text-xs text-gray-500">{wfDate}</p>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
                {!photoB64 && !analyzing && !analysis && (
                  <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5A0] px-4 py-4 text-sm font-medium text-white shadow-md hover:bg-[#0d9490] active:scale-[0.98]">
                    <Camera className="h-5 w-5" /> 上传动作照片
                  </motion.button>
                )}
                {photoB64 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: '4/3' }}>
                      <img src={photoB64} alt="动作照片" className="h-full w-full object-cover" />
                      {analyzing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="mb-3 h-12 w-12 rounded-full border-4 border-white/30 border-t-white" />
                          <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-sm font-medium text-white">AI 分析中...</motion.p>
                        </div>
                      )}
                    </div>
                    {analysis && !analyzing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden rounded-xl bg-gray-50 p-4">
                        <div className="flex items-start gap-4">
                          <ScoreRing score={analysis.aiScore} size={64} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">AI 评分</p>
                            <p className="mt-1 text-xs leading-relaxed text-gray-500">{analysis.aiFeedback}</p>
                          </div>
                        </div>
                        {analysis.corrections.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-medium text-gray-700">纠正建议</p>
                            {analysis.corrections.map((c, i) => (
                              <div key={i} className="flex items-start gap-2 rounded-lg bg-white p-2.5 shadow-sm">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF8C42]" />
                                <span className="text-xs text-gray-600">{c}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                    {!analyzing && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-3">
                        <button onClick={resetWf}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 px-4 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-300">
                          <RotateCcw className="h-4 w-4" /> 重新拍摄
                        </button>
                        <button onClick={saveWf} disabled={!analysis}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0EA5A0] px-4 py-3.5 text-sm font-medium text-white shadow-md hover:bg-[#0d9490] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                          <Check className="h-4 w-4" /> 保存打卡
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {photoModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPhotoModal(null)}>
              <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                src={photoModal} alt="打卡照片" className="max-h-[85vh] max-w-full rounded-xl shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="mx-auto max-w-md px-4 pt-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">训练日历</h1>
          <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0EA5A0]/10">
                <Calendar className="h-5 w-5 text-[#0EA5A0]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{injury?.bodyPart ?? '康复训练'}</p>
                <p className="text-xs text-gray-500">第 {s.plan.phase}/{s.plan.totalPhases} 阶段 · {s.plan.exercises.length} 项训练</p>
              </div>
              {s.plans.length > 1 && (
                <select value={s.plan.id} onChange={(e) => s.setActivePlan(e.target.value)}
                  className="rounded-lg bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 outline-none">
                  {s.plans.map((p, i) => <option key={p.id} value={p.id}>计划 {i + 1}</option>)}
                </select>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div key={`${viewMonth.getFullYear()}-${viewMonth.getMonth()}`}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <p className="text-base font-bold text-gray-900">{viewMonth.getFullYear()}年{viewMonth.getMonth() + 1}月</p>
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="py-1.5 text-[11px] font-medium text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((d, idx) => {
              const k = dateKey(d)
              s.initializeDayCheckIns(s.plan.id, k)
              const status = getDayStatus(s.getCheckInsForDate(s.plan.id, k), k, todayK)
              const inMonth = d.getMonth() === viewMonth.getMonth()
              const isToday = k === todayK
              const isSel = k === selKey
              return (
                <button key={idx} onClick={() => { setSelDate(d); setView('detail') }}
                  className={cn('relative flex aspect-square flex-col items-center justify-center rounded-xl transition-all',
                    isToday && 'ring-2 ring-[#0EA5A0] ring-offset-1',
                    isSel && !isToday && 'bg-gray-100',
                    inMonth ? 'text-gray-900' : 'text-gray-300',
                    'hover:bg-gray-50 active:scale-95')}>
                  <span className={cn('text-sm font-medium', isToday && 'text-[#0EA5A0] font-bold')}>{d.getDate()}</span>
                  {status !== 'future' && s.getCheckInsForDate(s.plan.id, k).length > 0 && (
                    <span className={cn('mt-1 h-1.5 w-1.5 rounded-full', statusDotColor[status])} />
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3">
            {[['#34D399', '全部完成'], ['#FF8C42', '部分完成'], ['#EF4444', '未完成'], ['gray-300', '无记录']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', c.startsWith('#') ? '' : 'bg-' + c)} style={c.startsWith('#') ? { background: c } : undefined} />
                <span className="text-[10px] text-gray-500">{l}</span>
              </div>
            ))}
            <button onClick={() => { setViewMonth(new Date()); setSelDate(new Date()) }}
              className="ml-auto rounded-full bg-[#0EA5A0]/10 px-3 py-1 text-[11px] font-medium text-[#0EA5A0] hover:bg-[#0EA5A0]/20">
              今天
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#0EA5A0]">{monthStats.completedDays}</p>
            <p className="mt-1 text-[11px] text-gray-500">本月完成天数</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#FF8C42]">{monthStats.avgScore || '-'}</p>
            <p className="mt-1 text-[11px] text-gray-500">平均得分</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#34D399]">{monthStats.bestStreak}</p>
            <p className="mt-1 text-[11px] text-gray-500">最佳连续</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
