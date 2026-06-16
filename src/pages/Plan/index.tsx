import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, CheckCircle2, Clock, ShieldCheck,
  ChevronDown, AlertTriangle, Dumbbell, Timer,
  Calendar, Sparkles, TrendingUp, MessageSquare,
  Image as ImageIcon,
} from 'lucide-react'
import { useStore } from '@/store'
import type { Exercise, RehabPlan, CheckInRecord } from '@/types'

const categoryConfig = {
  stretch: { label: '拉伸', bg: 'bg-blue-100', text: 'text-blue-700' },
  strength: { label: '力量', bg: 'bg-orange-100', text: 'text-orange-700' },
  mobility: { label: '活动度', bg: 'bg-teal-100', text: 'text-teal-700' },
  balance: { label: '平衡', bg: 'bg-purple-100', text: 'text-purple-700' },
}

const phaseNames = ['急性期', '恢复期', '强化期', '功能期']

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}

function getScoreColor(score: number) {
  if (score < 60) return '#EF4444'
  if (score <= 80) return '#FF8C42'
  return '#34D399'
}

function MiniScoreRing({ score, size = 36 }: { score: number; size?: number }) {
  const r = (size - 4) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = getScoreColor(score)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={3} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={3} strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = getScoreColor(score)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
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
        <span className="text-lg font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

function formatDateCN(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function ExerciseCard({
  exercise,
  lastCheckIn,
  index,
}: {
  exercise: Exercise
  lastCheckIn?: CheckInRecord & { date: string }
  index: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [photoModal, setPhotoModal] = useState<string | null>(null)
  const cat = categoryConfig[exercise.category]
  const hasCheckIn = lastCheckIn && lastCheckIn.completed
  const hasTherapistFeedback = lastCheckIn?.therapistFeedback

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div
          className="flex items-center gap-3 p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900 truncate">{exercise.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                {cat.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Dumbbell size={14} />{exercise.sets}×{exercise.reps}</span>
              <span className="flex items-center gap-1"><Timer size={14} />{exercise.duration}s</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {hasCheckIn ? (
              <div className="flex items-center gap-2">
                <MiniScoreRing score={lastCheckIn.aiScore} />
                {hasTherapistFeedback && (
                  <div className="relative">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#FF8C42' }}
                    >
                      <MessageSquare size={14} className="text-white" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">未打卡</span>
            )}
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={18} className="text-gray-400" />
            </motion.div>
          </div>
        </div>

        {hasCheckIn && (
          <div className="px-4 pb-2 -mt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <CalendarDays size={12} />
              <span>最近打卡：{formatDateCN(lastCheckIn.date)}</span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-4">
                {hasCheckIn ? (
                  <>
                    <div className="flex gap-3 items-start">
                      {lastCheckIn.photoUrl ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPhotoModal(lastCheckIn.photoUrl) }}
                          className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm relative group"
                        >
                          <img
                            src={lastCheckIn.photoUrl}
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImageIcon size={20} className="text-white" />
                          </div>
                        </button>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={24} className="text-gray-300" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <ScoreRing score={lastCheckIn.aiScore} size={56} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">AI 评分</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {lastCheckIn.aiScore >= 90 ? '优秀' : lastCheckIn.aiScore >= 75 ? '良好' : lastCheckIn.aiScore >= 60 ? '及格' : '需改进'}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{lastCheckIn.aiFeedback}</p>
                      </div>
                    </div>

                    {lastCheckIn.corrections.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1.5">
                          <AlertTriangle size={14} />纠正要点
                        </p>
                        <ul className="space-y-1.5">
                          {lastCheckIn.corrections.map((c, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C42] mt-1.5 flex-shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lastCheckIn.therapistFeedback && (
                      <div className="rounded-lg p-3 border" style={{ backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }}>
                        <p className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: '#FF8C42' }}>
                          <MessageSquare size={12} />康复师评语
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{lastCheckIn.therapistFeedback}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                      <CalendarDays size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">暂无训练记录</p>
                    <p className="text-xs text-gray-400 mt-1">完成打卡后这里会显示训练反馈</p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-teal-700 mb-1.5">要点提示</p>
                    <ul className="space-y-1">
                      {exercise.keyPoints.map((p, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                          <CheckCircle2 size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1.5">常见错误</p>
                    <ul className="space-y-1">
                      {exercise.commonErrors.map((e, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                          <AlertTriangle size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {photoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPhotoModal(null)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={photoModal}
              alt="打卡照片"
              className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function PlanSelector({ plans, injuries, activeId, onSelect }: {
  plans: RehabPlan[]
  injuries: { id: string; bodyPart: string }[]
  activeId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
      <p className="text-xs font-medium text-gray-400 mb-2 px-1">我的康复计划</p>
      <div className="flex flex-wrap gap-2">
        {plans.map((p) => {
          const injury = injuries.find((i) => i.id === p.injuryId)
          const isActive = p.id === activeId
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
              style={isActive ? { backgroundColor: '#0EA5A0' } : {}}
            >
              <span>{injury?.bodyPart ?? '未知部位'}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}>
                第{p.phase}阶段
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Plan() {
  const { plan, plans, injuries, therapists, assessments, setActivePlan, getExercisesWithLastCheckIn } = useStore()
  const therapist = therapists.find((t) => t.id === plan.therapistId)

  const exercisesWithLastCheckIn = useMemo(() => {
    return getExercisesWithLastCheckIn(plan.id)
  }, [plan.id, getExercisesWithLastCheckIn])

  const { planAssessments, nextAssessmentDate, showUpdatedBadge, showPhaseBadge } = useMemo(() => {
    const pa = assessments.filter((a) => a.planId === plan.id).sort((a, b) => b.date.localeCompare(a.date))
    const latest = pa[0]
    const baseDate = latest?.date ?? plan.startDate
    const next = addDays(baseDate, 14)
    const today = new Date().toISOString().split('T')[0]
    const updated = latest ? daysBetween(latest.date, today) <= 7 : false
    const phaseAdvanced = latest ? latest.previousScore !== undefined && latest.overallScore >= 7 : false
    return {
      planAssessments: pa,
      nextAssessmentDate: next,
      showUpdatedBadge: updated,
      showPhaseBadge: phaseAdvanced,
    }
  }, [plan, assessments])

  return (
    <div className="max-w-lg mx-auto p-4 space-y-5 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold text-gray-900">康复计划</h1>

      <PlanSelector
        plans={plans}
        injuries={injuries.map((i) => ({ id: i.id, bodyPart: i.bodyPart }))}
        activeId={plan.id}
        onSelect={setActivePlan}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
      >
        {(showUpdatedBadge || showPhaseBadge) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {showPhaseBadge && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                <TrendingUp size={12} />已进入新阶段
              </span>
            )}
            {showUpdatedBadge && planAssessments[0] && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
                <Sparkles size={12} />方案已根据阶段评估更新于 {planAssessments[0].date}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">
            阶段 {plan.phase}/{plan.totalPhases}
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
              <CheckCircle2 size={12} />进行中
            </span>
            {plan.approvedByTherapist && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">
                <ShieldCheck size={12} />已审核
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: plan.totalPhases }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-2 w-full rounded-full ${i < plan.phase ? 'bg-[#0EA5A0]' : i === plan.phase - 1 ? 'bg-[#0EA5A0]' : 'bg-gray-200'}`} />
              <span className={`text-[10px] ${i === plan.phase - 1 ? 'text-[#0EA5A0] font-semibold' : 'text-gray-400'}`}>
                {phaseNames[i]}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Clock size={14} />{plan.startDate}</span>
          <span>→</span>
          <span className="flex items-center gap-1"><Clock size={14} />{plan.endDate}</span>
        </div>
      </motion.div>

      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">训练项目</h2>
        <div className="space-y-3">
          {exercisesWithLastCheckIn.map((item, i) => (
            <ExerciseCard
              key={item.exercise.id}
              exercise={item.exercise}
              lastCheckIn={item.lastCheckIn}
              index={i}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
      >
        <h2 className="text-base font-semibold text-gray-900 mb-3">计划状态</h2>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">康复师</span>
            <span className="text-gray-900 font-medium">{therapist?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">审核状态</span>
            <span className={plan.approvedByTherapist ? 'text-teal-600 font-medium' : 'text-orange-500'}>
              {plan.approvedByTherapist ? '已审核通过' : '待审核'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 flex items-center gap-1">
              <Calendar size={14} />下次评估
            </span>
            <span className="text-gray-900 font-medium">{nextAssessmentDate}</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
