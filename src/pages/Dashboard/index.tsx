import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell } from 'recharts'
import {
  Check,
  X,
  Flame,
  CalendarCheck,
  Brain,
  Clock,
  Bell,
  ChevronRight,
  Crown,
  ArrowRight,
} from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import { membershipConfigs } from '@/mock/data'

const categoryConfig: Record<string, { label: string; color: string }> = {
  stretch: { label: '拉伸', color: 'bg-orange-400' },
  strength: { label: '力量', color: 'bg-teal-500' },
  mobility: { label: '活动度', color: 'bg-blue-400' },
  balance: { label: '平衡', color: 'bg-purple-400' },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
}

function formatDate() {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

const cardVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
}

export default function Dashboard() {
  const { user, plan, checkIns, notifications, markNotificationRead, setPath, todaysDate, assessments } = useStore()
  const navigate = useNavigate()

  const todayExercises = useMemo(
    () =>
      plan.exercises.map((ex) => {
        const ci = checkIns.find((c) => c.exerciseId === ex.id && c.planId === plan.id && c.date === todaysDate)
        return { ...ex, completed: ci?.completed ?? false }
      }),
    [plan.exercises, checkIns, plan.id, todaysDate]
  )

  const completedCount = useMemo(() => {
    return checkIns.filter((c) => c.date === todaysDate && c.completed).length
  }, [checkIns, todaysDate])

  const totalCount = todayExercises.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const latestNotification = useMemo(
    () => notifications.find((n) => !n.read),
    [notifications]
  )

  const avgAiScore = useMemo(() => {
    const done = checkIns.filter((c) => c.date === todaysDate && c.completed && c.aiScore > 0)
    if (done.length === 0) return 0
    return Math.round(done.reduce((s, c) => s + c.aiScore, 0) / done.length)
  }, [checkIns, todaysDate])

  const nextAssessmentDays = useMemo(() => {
    if (assessments.length === 0) return 3
    const last = [...assessments].sort((a, b) => b.date.localeCompare(a.date))[0]
    const lastDate = new Date(last.date)
    lastDate.setDate(lastDate.getDate() + 14)
    const today = new Date()
    const diff = Math.ceil((lastDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [assessments])

  const currentLevelIdx = membershipConfigs.findIndex((c) => c.level === user.membershipLevel)
  const nextLevel = currentLevelIdx < membershipConfigs.length - 1 ? membershipConfigs[currentLevelIdx + 1] : null
  const goldRequiredDays = membershipConfigs[2].requiredDays

  const levelGradient = {
    free: 'from-gray-400 via-gray-300 to-gray-500',
    silver: 'from-[#C0C0C0] via-[#D8D8D8] to-[#E8E8E8]',
    gold: 'from-[#FFD700] via-[#FFC000] to-[#FFA500]',
  } as const

  const levelLabel = { free: '免费会员', silver: '银卡会员', gold: '金卡会员' } as const
  const progressPercent = nextLevel
    ? Math.min((user.consecutiveDays / nextLevel.requiredDays) * 100, 100)
    : 100
  const textColorOnCard = user.membershipLevel === 'gold' ? 'text-gray-800' : 'text-gray-800'

  const pieData = [
    { name: 'done', value: completedCount },
    { name: 'remaining', value: totalCount - completedCount },
  ]

  const handleCardClick = () => {
    setPath('/checkin')
    navigate('/checkin')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{formatDate()}</p>
        </div>

        {latestNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3"
          >
            <Bell className="h-5 w-5 shrink-0 text-[#FF8C42]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{latestNotification.title}</p>
              <p className="truncate text-xs text-gray-500">{latestNotification.message}</p>
            </div>
            <button onClick={() => markNotificationRead(latestNotification.id)} className="shrink-0">
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          </motion.div>
        )}

        <div className="mb-5 flex items-center gap-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="relative h-28 w-28 shrink-0">
            <PieChart width={112} height={112}>
              <Pie
                data={pieData}
                innerRadius={38}
                outerRadius={52}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                <Cell fill="#0EA5A0" />
                <Cell fill="#E5E7EB" />
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
              <span className="text-[10px] text-gray-400">完成率</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">今日康复进度</h2>
            <p className="mt-1 text-sm text-gray-500">
              已完成 {completedCount}/{totalCount} 项训练
            </p>
            <p className="mt-2 text-xs text-gray-400">
              阶段 {plan.phase}/{plan.totalPhases}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="mb-3 text-base font-semibold text-gray-900">今日训练</h2>
          <div className="space-y-3">
            {todayExercises.map((exercise, i) => {
              const cat = categoryConfig[exercise.category] ?? categoryConfig.strength
              return (
                <motion.div
                  key={exercise.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={handleCardClick}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
                    'border-l-4',
                    exercise.completed ? 'border-l-[#34D399]' : 'border-l-[#0EA5A0]'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      exercise.completed ? 'bg-[#34D399]/15' : 'bg-[#0EA5A0]/15'
                    )}
                  >
                    {exercise.completed ? (
                      <Check className="h-4 w-4 text-[#34D399]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#0EA5A0]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{exercise.name}</p>
                    <p className="text-xs text-gray-400">
                      {exercise.sets}组 × {exercise.reps}次
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium text-white',
                      cat.color
                    )}
                  >
                    {cat.label}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        <motion.div
          key={user.membershipLevel}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            'mb-5 overflow-hidden rounded-2xl p-5 shadow-sm bg-gradient-to-br',
            levelGradient[user.membershipLevel]
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-gray-700" />
            <span className="text-sm font-semibold text-gray-800">{levelLabel[user.membershipLevel]}</span>
            {user.membershipLevel === 'gold' && <span className="text-xs font-medium text-gray-700">✨ 最高等级</span>}
          </div>
          <div className="mb-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-800">{user.consecutiveDays}</span>
            <span className="text-sm text-gray-700">天连续打卡</span>
          </div>
          {nextLevel ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-700">
                  升级{levelLabel[nextLevel.level]}进度
                </span>
                <span className="text-xs font-medium text-gray-800">
                  {user.consecutiveDays}/{nextLevel.requiredDays}天
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-400/40">
                <div
                  className={cn(
                    'h-full rounded-full',
                    user.membershipLevel === 'silver' ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500]' : 'bg-gradient-to-r from-gray-500 to-gray-700'
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <button
                onClick={() => { setPath('/membership'); navigate('/membership') }}
                className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900"
              >
                查看会员权益 <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-700">您已享受最高等级会员权益</p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Flame, label: '连续天数', value: user.consecutiveDays, color: 'text-[#FF8C42]' },
            { icon: CalendarCheck, label: '累计打卡', value: checkIns.length, color: 'text-[#0EA5A0]' },
            { icon: Brain, label: 'AI平均分', value: avgAiScore, color: 'text-purple-500' },
            { icon: Clock, label: '距下次评估', value: nextAssessmentDays + '天', color: 'text-[#0EA5A0]' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
            >
              <stat.icon className={cn('h-5 w-5', stat.color)} />
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-[10px] text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
