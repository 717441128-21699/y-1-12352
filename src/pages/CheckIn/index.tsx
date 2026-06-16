import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Camera, AlertTriangle, Trophy } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'

const categoryConfig: Record<string, { label: string; color: string }> = {
  stretch: { label: '拉伸', color: 'bg-orange-400' },
  strength: { label: '力量', color: 'bg-teal-500' },
  mobility: { label: '活动度', color: 'bg-blue-400' },
  balance: { label: '平衡', color: 'bg-purple-400' },
}

function getScoreColor(score: number) {
  if (score < 60) return '#EF4444'
  if (score <= 80) return '#FF8C42'
  return '#34D399'
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = getScoreColor(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={4} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

function AnalysisPanel({ checkIn }: { checkIn: { aiScore: number; aiFeedback: string; corrections: string[] } }) {
  const color = getScoreColor(checkIn.aiScore)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3 overflow-hidden rounded-xl bg-gray-50 p-4"
    >
      <div className="flex items-start gap-4">
        <ScoreRing score={checkIn.aiScore} size={72} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">AI 评分</p>
          <p className="mt-1 text-xs text-gray-500">{checkIn.aiFeedback}</p>
        </div>
      </div>
      {checkIn.corrections.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-gray-700">纠正建议</p>
          {checkIn.corrections.map((c, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-white p-2.5 shadow-sm">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF8C42]" />
              <span className="text-xs text-gray-600">{c}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function CheckIn() {
  const { plan, checkIns, completeCheckIn, user } = useStore()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const enriched = useMemo(
    () =>
      plan.exercises.map((ex) => {
        const ci = checkIns.find((c) => c.exerciseId === ex.id)
        return { ...ex, checkIn: ci }
      }),
    [plan.exercises, checkIns]
  )

  const completedCount = enriched.filter((e) => e.checkIn?.completed).length
  const totalCount = enriched.length
  const allDone = completedCount === totalCount

  const handleCheckIn = (exerciseId: string) => {
    setLoadingId(exerciseId)
    setTimeout(() => {
      completeCheckIn(exerciseId)
      setLoadingId(null)
      setExpandedId(exerciseId)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="mb-5 text-xl font-bold text-gray-900">每日打卡</h1>

        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              今日训练 {completedCount}/{totalCount} 已完成
            </span>
            <span className="text-xs text-gray-400">{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-[#0EA5A0]"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {enriched.map((exercise, i) => {
            const cat = categoryConfig[exercise.category] ?? categoryConfig.strength
            const ci = exercise.checkIn
            const done = ci?.completed ?? false
            const isLoading = loadingId === exercise.id
            const isExpanded = expandedId === exercise.id

            return (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  'rounded-2xl bg-white p-4 shadow-sm',
                  done && 'ring-1 ring-[#34D399]/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                      done ? 'bg-[#34D399]/15' : 'bg-[#0EA5A0]/10'
                    )}
                  >
                    {done ? (
                      <Check className="h-5 w-5 text-[#34D399]" />
                    ) : (
                      <span className="text-sm font-semibold text-[#0EA5A0]">{i + 1}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{exercise.name}</p>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium text-white',
                          cat.color
                        )}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {exercise.sets}组 × {exercise.reps}次
                    </p>
                  </div>

                  {done && ci && (
                    <ScoreRing score={ci.aiScore} size={44} />
                  )}
                </div>

                {done && ci && (
                  <div className="mt-2 flex items-start gap-2 pl-[52px]">
                    <p className="text-xs text-gray-500">{ci.aiFeedback}</p>
                  </div>
                )}

                {done && ci && ci.corrections.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 pl-[52px]">
                    {ci.corrections.map((c, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 rounded-md bg-[#FF8C42]/10 px-2 py-0.5 text-[10px] text-[#FF8C42]"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 pl-[52px]">
                  {!done && !isLoading && (
                    <button
                      onClick={() => handleCheckIn(exercise.id)}
                      className="rounded-lg bg-[#0EA5A0] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0d9490]"
                    >
                      开始训练
                    </button>
                  )}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-[#0EA5A0]">
                      <Camera className="h-3.5 w-3.5 animate-pulse" />
                      <span>拍照上传中...</span>
                    </div>
                  )}
                  {done && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : exercise.id)}
                      className="text-xs text-[#0EA5A0] hover:underline"
                    >
                      {isExpanded ? '收起详情' : '查看详情'}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {done && ci && isExpanded && <AnalysisPanel checkIn={ci} />}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="mt-6 rounded-2xl bg-gradient-to-br from-[#0EA5A0] to-[#0d9490] p-6 text-center text-white shadow-lg"
            >
              <p className="mb-1 text-3xl">🎊</p>
              <p className="text-lg font-bold">恭喜完成今日训练！</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-300" />
                <span className="text-sm">已连续打卡 {user.consecutiveDays + 1} 天</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
