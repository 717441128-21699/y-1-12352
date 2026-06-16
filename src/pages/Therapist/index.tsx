import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  MessageCircle,
  Video,
  CalendarDays,
  Camera,
  Star,
  AlertCircle,
  Send,
  Copy,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  ImagePlus,
  Calendar,
  Clock,
} from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import type { ChatMessage, VideoAppointment, Therapist, CheckInRecord, Exercise } from '@/types'

type TabKey = 'dashboard' | 'chat' | 'booking' | 'appointments'

const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: '康复师看板', icon: LayoutDashboard },
  { key: 'chat', label: '在线答疑', icon: MessageCircle },
  { key: 'booking', label: '视频预约', icon: Video },
  { key: 'appointments', label: '我的预约', icon: CalendarDays },
]

const timeSlots = Array.from({ length: 16 }, (_, i) => {
  const h = 9 + Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const h2 = m === '00' ? h : h + 1
  const m2 = m === '00' ? '30' : '00'
  return { start: `${h}:${m}`, end: `${h2}:${m2}` }
})

const autoReplies = [
  '好的，我已记录您的情况，建议保持当前训练强度。',
  '训练中如有不适，请及时停止并联系我。',
  '您的恢复进展不错，继续坚持！',
  '建议训练前做好热身，训练后充分拉伸。',
  '下周可以尝试增加训练难度，注意循序渐进。',
]

const statusMap: Record<string, { label: string; color: string }> = {
  upcoming: { label: '即将开始', color: 'bg-teal-100 text-teal-700' },
  in_progress: { label: '进行中', color: 'bg-orange-100 text-orange-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
}

const levelMap: Record<string, { label: string; color: string }> = {
  expert: { label: '专家', color: 'bg-orange-100 text-[#FF8C42]' },
  senior: { label: '资深', color: 'bg-teal-100 text-[#0EA5A0]' },
  junior: { label: '初级', color: 'bg-gray-100 text-gray-600' },
}

function getNext7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return { date: d.toISOString().slice(0, 10), label: i === 0 ? '今天' : ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()] }
  })
}

type CheckInWithExercise = CheckInRecord & { exercise?: Exercise }

export default function TherapistPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="mx-auto max-w-md px-4 pt-4">
        <h1 className="mb-4 text-xl font-bold text-gray-900">康复师互动</h1>
        <div className="mb-4 flex rounded-xl bg-white p-1 shadow-sm">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[10px] font-medium transition-colors',
                  activeTab === t.key ? 'bg-[#0EA5A0] text-white shadow' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <DashboardTab key="dashboard" />}
          {activeTab === 'chat' && <ChatTab key="chat" />}
          {activeTab === 'booking' && <BookingTab key="book" onSuccess={() => setActiveTab('appointments')} />}
          {activeTab === 'appointments' && <MyAppointmentsTab key="appt" />}
        </AnimatePresence>
      </div>
    </div>
  )
}

function FeedbackModal({
  checkIn,
  onClose,
}: {
  checkIn: CheckInWithExercise
  onClose: () => void
}) {
  const { addTherapistReview, plan } = useStore()
  const [comment, setComment] = useState('')
  const [showToast, setShowToast] = useState(false)

  const handleSubmit = () => {
    if (!comment.trim()) return
    addTherapistReview(checkIn.id, plan.therapistId, checkIn.exercise?.name || '', comment.trim())
    setComment('')
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
      onClose()
    }, 1500)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">添加康复师反馈</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          {checkIn.exercise && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-900">{checkIn.exercise.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{checkIn.date} · AI评分: {checkIn.aiScore}</p>
            </div>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="请输入反馈意见..."
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-[#0EA5A0]"
          />
          <button
            onClick={handleSubmit}
            disabled={!comment.trim()}
            className={cn(
              'mt-4 w-full rounded-xl py-3 text-sm font-medium text-white transition-colors',
              comment.trim() ? 'bg-[#0EA5A0] hover:bg-[#0d9490]' : 'cursor-not-allowed bg-gray-300'
            )}
          >
            提交反馈
          </button>
          <AnimatePresence>
            {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-x-0 top-1/2 flex justify-center"
              >
                <div className="flex items-center gap-2 rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  反馈提交成功
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function CheckInRow({
  checkIn,
  isLowScore,
  onFeedback,
}: {
  checkIn: CheckInWithExercise
  isLowScore?: boolean
  onFeedback: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white p-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {checkIn.photoUrl ? (
            <img src={checkIn.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <Camera className="h-6 w-6" />
            </div>
          )}
          {isLowScore && (
            <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#EF4444]">
              <AlertCircle className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-gray-900">
              {checkIn.exercise?.name || '未知动作'}
            </p>
            {checkIn.therapistFeedback && (
              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] text-[#FF8C42]">
                <MessageSquare className="h-3 w-3" />
                已反馈
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-400">{checkIn.date}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-[#FF8C42] text-[#FF8C42]" />
              <span className={cn(
                'text-xs font-medium',
                checkIn.aiScore >= 70 ? 'text-green-600' : 'text-[#EF4444]'
              )}>
                {checkIn.aiScore}
              </span>
            </div>
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px]',
              checkIn.completed ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
            )}>
              {checkIn.completed ? '已完成' : '未完成'}
            </span>
          </div>
        </div>
        <button
          onClick={onFeedback}
          className={cn(
            'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            isLowScore
              ? 'bg-[#FF8C42] text-white hover:bg-[#e87a36]'
              : 'bg-[#0EA5A0]/10 text-[#0EA5A0] hover:bg-[#0EA5A0]/20'
          )}
        >
          添加反馈
        </button>
      </div>
      {checkIn.therapistFeedback && (
        <div className="mt-3 rounded-lg bg-orange-50 p-2.5">
          <div className="mb-1 flex items-center gap-1 text-[11px] font-medium text-[#FF8C42]">
            <MessageSquare className="h-3 w-3" />
            康复师反馈
          </div>
          <p className="text-xs leading-relaxed text-gray-700">{checkIn.therapistFeedback}</p>
        </div>
      )}
    </motion.div>
  )
}

function DashboardTab() {
  const { plan, user, therapists, getRecentCheckIns, getLowScoreCheckIns, checkIns } = useStore()
  const [feedbackCheckIn, setFeedbackCheckIn] = useState<CheckInWithExercise | null>(null)

  const recentCheckIns = getRecentCheckIns(plan.id, 10)
  const lowScoreCheckIns = getLowScoreCheckIns(plan.id, 70)
  const assignedTherapist = therapists.find((t) => t.id === plan.therapistId)

  const today = new Date().toISOString().split('T')[0]
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 6)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const weekDates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    weekDates.push(d.toISOString().split('T')[0])
  }

  const weekCheckInDays = new Set(
    checkIns
      .filter((c) => c.planId === plan.id && c.completed && c.date >= weekStartStr && c.date <= today)
      .map((c) => c.date)
  ).size

  const scoredCheckIns = checkIns.filter(
    (c) => c.planId === plan.id && c.completed && c.aiScore > 0
  )
  const avgAIScore =
    scoredCheckIns.length > 0
      ? Math.round(scoredCheckIns.reduce((s, c) => s + c.aiScore, 0) / scoredCheckIns.length)
      : 0

  const pendingFeedbackCount = checkIns.filter(
    (c) => c.planId === plan.id && c.completed && c.aiScore > 0 && !c.therapistFeedback
  ).length

  const todayTotal = checkIns.filter((c) => c.planId === plan.id && c.date === today).length
  const todayCompleted = checkIns.filter(
    (c) => c.planId === plan.id && c.date === today && c.completed
  ).length
  const incompleteRatio =
    todayTotal > 0 ? Math.round(((todayTotal - todayCompleted) / todayTotal) * 100) : 0

  const stats = [
    { label: '本周打卡天数', value: `${weekCheckInDays}/7`, color: 'text-[#0EA5A0]', bg: 'bg-[#0EA5A0]/10' },
    { label: '平均AI分数', value: `${avgAIScore}`, color: 'text-[#FF8C42]', bg: 'bg-[#FF8C42]/10' },
    { label: '待反馈动作数', value: `${pendingFeedbackCount}`, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' },
    { label: '未完成训练占比', value: `${incompleteRatio}%`, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0EA5A0]/15 text-lg font-bold text-[#0EA5A0]">
            {assignedTherapist?.name[0] ?? '?'}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">康复师工作台</p>
            <p className="text-xs text-gray-500">
              康复师: {assignedTherapist?.name ?? '未分配'} · 用户: {user.name}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className={cn('rounded-lg p-2.5', s.bg)}>
              <p className="text-[10px] text-gray-500">{s.label}</p>
              <p className={cn('mt-0.5 text-xl font-bold', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <AlertCircle className="h-4 w-4 text-[#EF4444]" />
          低分需关注动作
          <span className="ml-1 rounded-full bg-[#EF4444] px-1.5 py-0.5 text-[10px] text-white">
            {lowScoreCheckIns.length}
          </span>
        </h3>
        <div className="space-y-2">
          {lowScoreCheckIns.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-8 w-8 text-green-400" />
              <p className="mt-2 text-sm text-gray-500">暂无低分动作，表现良好！</p>
            </div>
          ) : (
            lowScoreCheckIns.map((ci) => (
              <CheckInRow
                key={ci.id}
                checkIn={ci}
                isLowScore
                onFeedback={() => setFeedbackCheckIn(ci)}
              />
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <CalendarDays className="h-4 w-4 text-[#0EA5A0]" />
          最近打卡记录
        </h3>
        <div className="space-y-2">
          {recentCheckIns.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center shadow-sm">
              <Camera className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">暂无打卡记录</p>
            </div>
          ) : (
            recentCheckIns.map((ci) => (
              <CheckInRow
                key={ci.id}
                checkIn={ci}
                onFeedback={() => setFeedbackCheckIn(ci)}
              />
            ))
          )}
        </div>
      </div>

      {feedbackCheckIn && (
        <FeedbackModal
          checkIn={feedbackCheckIn}
          onClose={() => setFeedbackCheckIn(null)}
        />
      )}
    </motion.div>
  )
}

function ChatTab() {
  const { messages, addMessage, user, therapists, plan } = useStore()
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const therapist = therapists.find((t) => t.id === plan.therapistId) ?? therapists[0]

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    const msg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: user.id,
      senderType: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    }
    addMessage(msg)
    setInput('')
    setTimeout(() => {
      addMessage({
        id: `msg_${Date.now()}_r`,
        senderId: therapist.id,
        senderType: 'therapist',
        content: autoReplies[Math.floor(Math.random() * autoReplies.length)],
        timestamp: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      })
    }, 1500)
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <div ref={listRef} className="flex h-[60vh] flex-col gap-3 overflow-y-auto pb-4">
        {messages.map((m) => {
          const isUser = m.senderType === 'user'
          return (
            <div key={m.id} className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
              <span className="mb-1 text-[10px] text-gray-400">
                {isUser ? user.name : therapist.name} · {m.timestamp}
              </span>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isUser ? 'rounded-br-md bg-gray-200 text-gray-800' : 'rounded-bl-md bg-[#0EA5A0] text-white'
                )}
              >
                {m.content}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
        <button className="text-gray-400 hover:text-gray-600">
          <ImagePlus className="h-5 w-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="输入消息..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
        <button onClick={handleSend} className="rounded-lg bg-[#0EA5A0] p-2 text-white shadow hover:bg-[#0d9490]">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

function BookingTab({ onSuccess }: { onSuccess: () => void }) {
  const { isSlotBooked, getAvailableTherapist, bookAppointment, therapists } = useStore()
  const days = getNext7Days()
  const [selDay, setSelDay] = useState(days[0].date)
  const [selSlot, setSelSlot] = useState<string | null>(null)
  const [successAppt, setSuccessAppt] = useState<VideoAppointment | null>(null)
  const [noTherapist, setNoTherapist] = useState(false)
  const [duplicateAlert, setDuplicateAlert] = useState(false)
  const [copied, setCopied] = useState(false)

  const matched: Therapist | null = selSlot
    ? getAvailableTherapist(selDay, selSlot, timeSlots.find((s) => s.start === selSlot)?.end || '')
    : null

  useEffect(() => {
    setNoTherapist(selSlot ? matched === null : false)
  }, [selSlot, matched])

  const handleCopy = (link: string) => {
    navigator.clipboard?.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleBook = () => {
    if (!selSlot || !matched) return
    const slot = timeSlots.find((s) => s.start === selSlot)!
    const result = bookAppointment(selDay, slot.start, slot.end)
    if (result === null) {
      setDuplicateAlert(true)
      setTimeout(() => setDuplicateAlert(false), 3000)
      return
    }
    setSuccessAppt(result)
    setSelSlot(null)
  }

  if (successAppt) {
    const t = therapists.find((th) => th.id === successAppt.therapistId)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <span className="text-lg font-bold text-gray-900">✅ 预约成功</span>
          </div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0EA5A0]/15 text-lg font-bold text-[#0EA5A0]">
              {t?.name[0] ?? '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t?.name ?? '康复师'}</p>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{successAppt.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{successAppt.startTime}-{successAppt.endTime}</span>
              </div>
            </div>
          </div>
          <div className="mb-4 rounded-lg bg-gray-50 p-3">
            <p className="mb-1.5 text-xs text-gray-500">会议链接</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 break-all text-xs text-[#0EA5A0] underline">{successAppt.meetingLink}</span>
              <button onClick={() => handleCopy(successAppt.meetingLink)} className="shrink-0 rounded-lg bg-[#0EA5A0]/10 p-1.5 text-[#0EA5A0] hover:bg-[#0EA5A0]/20">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copied && <p className="mt-1 text-[10px] text-green-600">已复制</p>}
          </div>
          <button onClick={onSuccess} className="w-full rounded-xl bg-[#0EA5A0] py-3 text-sm font-medium text-white shadow hover:bg-[#0d9490] transition-colors">
            查看我的预约
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <AnimatePresence>
        {duplicateAlert && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />该时段已被预约，请选择其他时段
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button key={d.date} onClick={() => { setSelDay(d.date); setSelSlot(null) }}
            className={cn('flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-xs transition-colors', selDay === d.date ? 'bg-[#0EA5A0] text-white' : 'bg-white text-gray-600')}>
            <span className="font-medium">{d.label}</span>
            <span className="mt-0.5">{d.date.slice(5)}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {timeSlots.map((s) => {
          const booked = isSlotBooked(selDay, s.start)
          const selected = selSlot === s.start
          return (
            <button key={s.start} disabled={booked} onClick={() => setSelSlot(s.start)}
              className={cn('rounded-lg py-2 text-xs font-medium transition-colors', booked && 'cursor-not-allowed bg-gray-100 text-gray-400',
                !booked && !selected && 'bg-green-50 text-green-700 hover:bg-green-100', !booked && selected && 'border-2 border-[#0EA5A0] bg-teal-50 text-[#0EA5A0]')}>
              {s.start}-{s.end}
            </button>
          )
        })}
      </div>
      <AnimatePresence mode="wait">
        {noTherapist && selSlot && (
          <motion.div key="no" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 flex items-center gap-2 rounded-xl bg-orange-50 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-orange-500" />
            <span className="text-sm text-orange-700">该时段暂无空闲康复师</span>
          </motion.div>
        )}
        {matched && !noTherapist && (
          <motion.div key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0EA5A0]/15 text-lg font-bold text-[#0EA5A0]">{matched.name[0]}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{matched.name}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', levelMap[matched.seniorLevel].color)}>{levelMap[matched.seniorLevel].label}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">{matched.specialty.join(' · ')}</p>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn('h-3 w-3', i < Math.round(matched.rating) ? 'fill-[#FF8C42] text-[#FF8C42]' : 'text-gray-300')} />
                  ))}
                  <span className="ml-1 text-xs text-gray-500">{matched.rating}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={handleBook} disabled={!selSlot || noTherapist}
        className={cn('w-full rounded-xl py-3 text-sm font-medium text-white shadow transition-colors', selSlot && !noTherapist ? 'bg-[#0EA5A0] hover:bg-[#0d9490]' : 'cursor-not-allowed bg-gray-300')}>
        确认预约
      </button>
    </motion.div>
  )
}

function MyAppointmentsTab() {
  const { appointments, therapists } = useStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const sorted = [...appointments].sort((a, b) => {
    const order = { upcoming: 0, in_progress: 1, completed: 2, cancelled: 3 } as const
    const sd = order[a.status as keyof typeof order] - order[b.status as keyof typeof order]
    return sd !== 0 ? sd : new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const handleCopy = (id: string, link: string) => {
    navigator.clipboard?.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
      {sorted.length === 0 && <p className="py-10 text-center text-sm text-gray-400">暂无预约记录</p>}
      {sorted.map((a) => {
        const t = therapists.find((th) => th.id === a.therapistId)
        const st = statusMap[a.status] ?? statusMap.upcoming
        return (
          <div key={a.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0EA5A0]/15 text-sm font-bold text-[#0EA5A0]">{t?.name[0] ?? '?'}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t?.name ?? '未知康复师'}</p>
                  <p className="text-xs text-gray-400">{a.date} {a.startTime}-{a.endTime}</p>
                </div>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-medium', st.color)}>{st.label}</span>
            </div>
            {a.status === 'upcoming' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-3 overflow-hidden">
                <div className="flex items-center gap-2">
                  <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="flex-1 break-all text-xs text-[#0EA5A0] underline">{a.meetingLink}</a>
                  <div className="relative">
                    <button onClick={() => handleCopy(a.id, a.meetingLink)} className="rounded-lg bg-[#0EA5A0]/10 p-1.5 text-[#0EA5A0] hover:bg-[#0EA5A0]/20">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <AnimatePresence>
                      {copiedId === a.id && (
                        <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                          className="absolute -top-7 right-0 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white">已复制</motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <button onClick={() => window.open(a.meetingLink, '_blank')}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0EA5A0] py-2 text-xs font-medium text-white hover:bg-[#0d9490] transition-colors">
                  <Video className="h-3.5 w-3.5" />进入会议<ChevronRight className="h-3 w-3" />
                </button>
              </motion.div>
            )}
          </div>
        )
      })}
    </motion.div>
  )
}
