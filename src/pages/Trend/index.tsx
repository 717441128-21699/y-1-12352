import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Target,
  Star,
  AlertTriangle,
  MessageSquare,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts'
import { useStore } from '@/store'
import type { DailyTrendData } from '@/types'

function formatDateMMDD(dateStr: string) {
  const d = new Date(dateStr)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: typeof TrendingUp
  label: string
  value: string | number
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

function InsightCard({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  delay,
}: {
  title: string
  value: string
  subValue?: string
  icon: typeof TrendingUp
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl bg-white p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500">{title}</p>
          <p className="mt-0.5 text-base font-semibold text-gray-900">{value}</p>
          {subValue && <p className="mt-0.5 text-xs text-gray-400">{subValue}</p>}
        </div>
      </div>
    </motion.div>
  )
}

export default function Trend() {
  const s = useStore()
  const injury = useMemo(
    () => s.injuries.find((i) => i.id === s.plan.injuryId),
    [s.injuries, s.plan.injuryId]
  )

  const trendData = useMemo(() => {
    const data = s.getTrendData(s.plan.id, 14)
    return data.map((d) => ({
      ...d,
      dateLabel: formatDateMMDD(d.date),
    }))
  }, [s.plan.id])

  const stats = useMemo(() => {
    const validDays = trendData.filter((d) => d.exerciseCount > 0)
    const avgCompletionRate =
      validDays.length > 0
        ? Math.round(
            validDays.reduce((sum, d) => sum + d.completionRate, 0) / validDays.length
          )
        : 0

    const scoredDays = trendData.filter((d) => d.avgScore > 0)
    const avgScore =
      scoredDays.length > 0
        ? Math.round(
            scoredDays.reduce((sum, d) => sum + d.avgScore, 0) / scoredDays.length
          )
        : 0

    const totalLowScore = trendData.reduce((sum, d) => sum + d.lowScoreCount, 0)
    const totalFeedback = trendData.reduce((sum, d) => sum + d.feedbackCount, 0)

    return { avgCompletionRate, avgScore, totalLowScore, totalFeedback }
  }, [trendData])

  const insights = useMemo(() => {
    const validDays = trendData.filter((d) => d.exerciseCount > 0)

    let highestDay: DailyTrendData | null = null
    let lowestDay: DailyTrendData | null = null
    validDays.forEach((d) => {
      if (!highestDay || d.completionRate > highestDay.completionRate) highestDay = d
      if (!lowestDay || d.completionRate < lowestDay.completionRate) lowestDay = d
    })

    const scoredDays = validDays.filter((d) => d.avgScore > 0)
    let scoreTrend: 'up' | 'down' | 'stable' = 'stable'
    if (scoredDays.length >= 2) {
      const firstHalf = scoredDays.slice(0, Math.floor(scoredDays.length / 2))
      const secondHalf = scoredDays.slice(Math.floor(scoredDays.length / 2))
      const firstAvg =
        firstHalf.reduce((sum, d) => sum + d.avgScore, 0) / firstHalf.length
      const secondAvg =
        secondHalf.reduce((sum, d) => sum + d.avgScore, 0) / secondHalf.length
      if (secondAvg - firstAvg > 2) scoreTrend = 'up'
      else if (firstAvg - secondAvg > 2) scoreTrend = 'down'
    }

    const lowScoreExercises = new Map<string, number>()
    const lowCheckIns = s.getLowScoreCheckIns(s.plan.id, 70)
    lowCheckIns.forEach((ci) => {
      const name = ci.exercise?.name || '未知动作'
      lowScoreExercises.set(name, (lowScoreExercises.get(name) || 0) + 1)
    })
    const topLowExercises = Array.from(lowScoreExercises.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    return { highestDay, lowestDay, scoreTrend, topLowExercises }
  }, [trendData, s.plan.id])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl bg-white p-3 shadow-lg border border-gray-100">
          <p className="text-xs font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-gray-500">{entry.name}</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {entry.value}
                {entry.name.includes('率') ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const ScoreTrendIcon = insights.scoreTrend === 'up' ? ArrowUp : insights.scoreTrend === 'down' ? ArrowDown : Minus
  const scoreTrendColor = insights.scoreTrend === 'up' ? '#34D399' : insights.scoreTrend === 'down' ? '#EF4444' : '#9CA3AF'
  const scoreTrendText = insights.scoreTrend === 'up' ? '上升趋势' : insights.scoreTrend === 'down' ? '下降趋势' : '保持稳定'

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-xl font-bold text-gray-900">训练趋势</h1>
          <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0EA5A0]/10">
                <TrendingUp className="h-5 w-5 text-[#0EA5A0]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {injury?.bodyPart ?? '康复训练'}
                </p>
                <p className="text-xs text-gray-500">
                  第 {s.plan.phase}/{s.plan.totalPhases} 阶段 · {s.plan.exercises.length} 项训练
                </p>
              </div>
              {s.plans.length > 1 && (
                <select
                  value={s.plan.id}
                  onChange={(e) => s.setActivePlan(e.target.value)}
                  className="rounded-lg bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 outline-none"
                >
                  {s.plans.map((p, i) => (
                    <option key={p.id} value={p.id}>
                      计划 {i + 1}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Target}
              label="总完成率"
              value={`${stats.avgCompletionRate}%`}
              color="#0EA5A0"
              delay={0.15}
            />
            <StatCard
              icon={Star}
              label="平均AI评分"
              value={stats.avgScore || '-'}
              color="#34D399"
              delay={0.2}
            />
            <StatCard
              icon={AlertTriangle}
              label="低分动作数"
              value={stats.totalLowScore}
              color="#FF8C42"
              delay={0.25}
            />
            <StatCard
              icon={MessageSquare}
              label="康复师反馈"
              value={stats.totalFeedback}
              color="#8B5CF6"
              delay={0.3}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mb-5 rounded-2xl bg-white p-4 shadow-sm"
        >
          <h2 className="mb-4 text-base font-semibold text-gray-900">趋势图表</h2>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="completionRate"
                  name="完成率"
                  stroke="#0EA5A0"
                  fill="#0EA5A0"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#0EA5A0' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgScore"
                  name="平均分"
                  stroke="#34D399"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#34D399' }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="lowScoreCount"
                  name="低分动作"
                  fill="#FF8C42"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                />
                <Bar
                  yAxisId="right"
                  dataKey="feedbackCount"
                  name="反馈数"
                  fill="#8B5CF6"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h2 className="mb-3 text-base font-semibold text-gray-900">关键洞察</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InsightCard
              icon={Calendar}
              title="完成率最高"
              value={insights.highestDay ? formatDateMMDD(insights.highestDay.date) : '-'}
              subValue={insights.highestDay ? `${Math.round(insights.highestDay.completionRate)}% 完成率` : undefined}
              color="#34D399"
              delay={0.5}
            />
            <InsightCard
              icon={Calendar}
              title="完成率最低"
              value={insights.lowestDay ? formatDateMMDD(insights.lowestDay.date) : '-'}
              subValue={insights.lowestDay ? `${Math.round(insights.lowestDay.completionRate)}% 完成率` : undefined}
              color="#EF4444"
              delay={0.55}
            />
            <InsightCard
              icon={ScoreTrendIcon}
              title="评分趋势"
              value={scoreTrendText}
              subValue="近14天对比"
              color={scoreTrendColor}
              delay={0.6}
            />
          </div>

          {insights.topLowExercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="mt-4 rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#FF8C42]" />
                <h3 className="text-sm font-semibold text-gray-900">低分动作集中</h3>
              </div>
              <div className="space-y-2">
                {insights.topLowExercises.map(([name, count], idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{name}</span>
                    <span className="text-xs font-medium text-[#FF8C42]">{count} 次</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
