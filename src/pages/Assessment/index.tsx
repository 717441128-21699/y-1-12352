import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import {
  ClipboardCheck,
  Star,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { useStore } from '@/store'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { StageAssessment } from '@/types'

interface PlanChangeInfo {
  phaseAdvanced: boolean
  periodExtended: boolean
  newPhase: number
  newEndDate: string
  oldPhase: number
  oldEndDate: string
}

const painEmojis = ['😊', '🙂', '😐', '😕', '😟', '😧', '😦', '😨', '😱', '😖', '💀']

const dimensionLabels: Record<string, string> = {
  pain: '疼痛',
  function: '功能',
  rangeOfMotion: '活动度',
  strength: '力量',
}

function toRadarData(a: { painScore: number; functionScore: number; rangeOfMotion: number; strengthScore: number }) {
  return [
    { dimension: dimensionLabels.pain, value: a.painScore },
    { dimension: dimensionLabels.function, value: a.functionScore },
    { dimension: dimensionLabels.rangeOfMotion, value: a.rangeOfMotion },
    { dimension: dimensionLabels.strength, value: a.strengthScore },
  ]
}

function computeOverall(pain: number, fn: number, rom: number, str: number) {
  return Math.round(((10 - pain) + fn * 2 + rom + str * 2) / 6 * 10) / 10
}

function generateAdjustment(overall: number, pain: number, fn: number, rom: number, str: number): string {
  const lines: string[] = []
  if (pain >= 6) lines.push('疼痛评分偏高，建议降低训练强度并增加冰敷频次')
  if (fn <= 2) lines.push('功能评分较低，建议增加功能性训练项目')
  if (rom <= 4) lines.push('关节活动度不足，建议增加拉伸和活动度训练')
  if (str <= 2) lines.push('肌力较弱，建议逐步增加抗阻训练负荷')
  if (overall >= 7) lines.push('整体恢复良好，可适当提升训练难度进入下一阶段')
  if (lines.length === 0) lines.push('恢复进展平稳，建议维持当前康复方案')
  return lines.join('；')
}

function daysUntilNextAssessment(lastDateStr: string): number {
  const last = new Date(lastDateStr)
  last.setDate(last.getDate() + 14)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((last.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="p-0.5">
          <Star
            className={cn(
              'h-7 w-7 transition-colors',
              i <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            )}
          />
        </button>
      ))}
    </div>
  )
}

function RangeSlider({ value, onChange, max = 10 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[#0EA5A0]"
    />
  )
}

function AssessmentCard({ assessment, prevScore, planPhase }: { assessment: StageAssessment; prevScore?: number; planPhase?: number }) {
  const radarData = useMemo(() => toRadarData(assessment), [assessment])
  const diff = prevScore != null ? assessment.overallScore - prevScore : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-5 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{assessment.date}</span>
          {planPhase && (
            <span className="text-xs rounded-full bg-teal-50 text-[#0EA5A0] px-2 py-0.5 font-medium">
              第{planPhase}阶段
            </span>
          )}
        </div>
        {diff != null && (
          <span className={cn('flex items-center gap-1 text-sm font-medium', diff >= 0 ? 'text-[#34D399]' : 'text-red-500')}>
            {diff >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
          </span>
        )}
      </div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-[#0EA5A0]">{assessment.overallScore}</span>
        <span className="text-sm text-gray-400">综合评分</span>
      </div>
      <div className="mx-auto h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Radar dataKey="value" stroke="#0EA5A0" fill="#0EA5A0" fillOpacity={0.25} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-gray-600 leading-relaxed">{assessment.planAdjustment}</p>
    </motion.div>
  )
}

function PlanChangeBadges({ changeInfo }: { changeInfo: PlanChangeInfo }) {
  const hasAnyChange = changeInfo.phaseAdvanced || changeInfo.periodExtended

  if (!hasAnyChange) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-xl bg-gray-50 p-3"
      >
        <CheckCircle2 className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-gray-600 font-medium">当前方案维持不变</span>
      </motion.div>
    )
  }

  return (
    <div className="space-y-2">
      {changeInfo.phaseAdvanced && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 rounded-xl bg-green-50 p-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <span className="inline-flex items-center rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-semibold text-white">
              阶段推进
            </span>
            <p className="mt-0.5 text-sm text-green-800 font-medium">
              康复方案已推进到第 {changeInfo.newPhase} 阶段
            </p>
          </div>
        </motion.div>
      )}
      {changeInfo.periodExtended && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 rounded-xl bg-orange-50 p-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
            <CalendarDays className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <span className="inline-flex items-center rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-semibold text-white">
              周期延长
            </span>
            <p className="mt-0.5 text-sm text-orange-800 font-medium">
              康复周期已延长 2 周，新结束日期为 {changeInfo.newEndDate}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function Assessment() {
  const { assessments, submitAssessment, isAssessmentDue, plan } = useStore()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [latestResult, setLatestResult] = useState<StageAssessment | null>(null)
  const [planChangeInfo, setPlanChangeInfo] = useState<PlanChangeInfo | null>(null)

  const [painScore, setPainScore] = useState(3)
  const [functionScore, setFunctionScore] = useState(3)
  const [rangeOfMotion, setRangeOfMotion] = useState(5)
  const [strengthScore, setStrengthScore] = useState(3)

  const handleSubmit = () => {
    const overall = computeOverall(painScore, functionScore, rangeOfMotion, strengthScore)
    const adjustment = generateAdjustment(overall, painScore, functionScore, rangeOfMotion, strengthScore)
    const prevScore = assessments.length > 0 ? assessments[0].overallScore : undefined

    const newAssessment: StageAssessment = {
      id: `sa${Date.now()}`,
      userId: 'u001',
      planId: plan.id,
      date: new Date().toISOString().split('T')[0],
      painScore,
      functionScore,
      rangeOfMotion,
      strengthScore,
      overallScore: overall,
      planAdjustment: adjustment,
      previousScore: prevScore,
    }

    const changeInfo = submitAssessment(newAssessment)
    setPlanChangeInfo(changeInfo)
    setLatestResult(newAssessment)
    setShowForm(false)
    setSubmitted(true)
  }

  const sortedAssessments = useMemo(
    () => [...assessments].sort((a, b) => b.date.localeCompare(a.date)),
    [assessments]
  )

  const lastAssessmentDate = sortedAssessments.length > 0
    ? sortedAssessments[0].date
    : new Date().toISOString().split('T')[0]
  const daysRemaining = daysUntilNextAssessment(lastAssessmentDate)

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">阶段评估</h1>

        <AnimatePresence mode="wait">
          {submitted && !isAssessmentDue ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-[#34D399] to-[#0EA5A0] p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">评估已完成</p>
                  <p className="text-sm text-white/80">第{plan.phase}阶段评估已成功提交</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    当前阶段：第 {plan.phase} 阶段
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    计划结束：{plan.endDate}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    距离下次评估还剩 {daysRemaining} 天
                  </span>
                </div>
              </div>
            </motion.div>
          ) : isAssessmentDue && !showForm ? (
            <motion.div
              key="due"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 rounded-2xl bg-gradient-to-r from-[#0EA5A0] to-teal-600 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <ClipboardCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">第二阶段评估已到期</p>
                    <p className="text-sm text-white/80">请尽快完成评估以调整康复方案</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0EA5A0] shadow-sm transition-shadow hover:shadow-md"
                >
                  开始评估
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 rounded-2xl bg-white p-5 shadow-sm"
          >
            <h2 className="mb-5 text-lg font-semibold text-gray-900">阶段评估表</h2>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">疼痛评分</label>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{painEmojis[painScore]}</span>
                  <span className="text-lg font-bold text-[#0EA5A0]">{painScore}</span>
                </div>
              </div>
              <RangeSlider value={painScore} onChange={setPainScore} />
              <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                <span>无痛</span><span>剧烈疼痛</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">功能评分</label>
                <span className="text-lg font-bold text-[#0EA5A0]">{functionScore}/5</span>
              </div>
              <StarRating value={functionScore} onChange={setFunctionScore} />
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">关节活动度</label>
                <span className="text-lg font-bold text-[#0EA5A0]">{rangeOfMotion}/10</span>
              </div>
              <RangeSlider value={rangeOfMotion} onChange={setRangeOfMotion} />
            </div>

            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">力量评分</label>
                <span className="text-lg font-bold text-[#0EA5A0]">{strengthScore}/5</span>
              </div>
              <StarRating value={strengthScore} onChange={setStrengthScore} />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full rounded-xl bg-[#0EA5A0] py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              提交评估
            </button>
          </motion.div>
        )}

        {submitted && latestResult && planChangeInfo && !showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h2 className="mb-3 text-base font-semibold text-gray-900">评估报告</h2>

            <div className="mb-4">
              <PlanChangeBadges changeInfo={planChangeInfo} />
            </div>

            <AssessmentCard
              assessment={latestResult}
              prevScore={latestResult.previousScore}
              planPhase={planChangeInfo.newPhase}
            />

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate('/plan')}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-[#0EA5A0] py-3 text-base font-semibold text-[#0EA5A0] shadow-sm transition-all hover:bg-teal-50"
            >
              查看更新后的康复计划
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        )}

        {sortedAssessments.length > 0 && (
          <div>
            <h2 className="mb-3 text-base font-semibold text-gray-900">历史评估</h2>
            <div className="space-y-4">
              {sortedAssessments.map((a, i) => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  prevScore={i < sortedAssessments.length - 1 ? sortedAssessments[i + 1].overallScore : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
