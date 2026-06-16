import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ImagePlus, Star, Video, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import type { ChatMessage, VideoAppointment } from '@/types'

const tabs = ['在线答疑', '视频预约', '我的预约'] as const
type TabKey = (typeof tabs)[number]

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
    return { date: d.toISOString().slice(0, 10), label: i === 0 ? '今天' : ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()] }
  })
}

export default function TherapistPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('在线答疑')
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="mx-auto max-w-md px-4 pt-4">
        <h1 className="mb-4 text-xl font-bold text-gray-900">康复师互动</h1>
        <div className="mb-4 flex rounded-xl bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
                activeTab === t ? 'bg-[#0EA5A0] text-white shadow' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {activeTab === '在线答疑' && <ChatTab key="chat" />}
          {activeTab === '视频预约' && <BookingTab key="book" />}
          {activeTab === '我的预约' && <MyAppointmentsTab key="appt" />}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ChatTab() {
  const { messages, addMessage, user, therapists } = useStore()
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const therapist = therapists[0]

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
      const reply: ChatMessage = {
        id: `msg_${Date.now()}_r`,
        senderId: therapist.id,
        senderType: 'therapist',
        content: autoReplies[Math.floor(Math.random() * autoReplies.length)],
        timestamp: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      }
      addMessage(reply)
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
        <button
          onClick={handleSend}
          className="rounded-lg bg-[#0EA5A0] p-2 text-white shadow hover:bg-[#0d9490]"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

function BookingTab() {
  const { therapists, bookAppointment, user } = useStore()
  const days = getNext7Days()
  const [selDay, setSelDay] = useState(days[0].date)
  const [selSlot, setSelSlot] = useState<string | null>(null)
  const bookedSlots = ['9:30', '11:00', '14:00', '15:30']
  const matched = selSlot ? therapists[Math.floor(Math.random() * therapists.length)] : null

  const handleBook = () => {
    if (!selSlot || !matched) return
    const slot = timeSlots.find((s) => s.start === selSlot)!
    const appt: VideoAppointment = {
      id: `va_${Date.now()}`,
      userId: user.id,
      therapistId: matched.id,
      date: selDay,
      startTime: slot.start,
      endTime: slot.end,
      meetingLink: `https://meeting.rehab-app.com/room/${Date.now()}`,
      status: 'upcoming',
    }
    bookAppointment(appt)
    setSelSlot(null)
    alert('预约成功！')
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button
            key={d.date}
            onClick={() => { setSelDay(d.date); setSelSlot(null) }}
            className={cn(
              'flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-xs transition-colors',
              selDay === d.date ? 'bg-[#0EA5A0] text-white' : 'bg-white text-gray-600'
            )}
          >
            <span className="font-medium">{d.label}</span>
            <span className="mt-0.5">{d.date.slice(5)}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-4 gap-2">
        {timeSlots.map((s) => {
          const isBooked = bookedSlots.includes(s.start)
          const isSelected = selSlot === s.start
          return (
            <button
              key={s.start}
              disabled={isBooked}
              onClick={() => setSelSlot(s.start)}
              className={cn(
                'rounded-lg py-2 text-xs font-medium transition-colors',
                isBooked && 'cursor-not-allowed bg-gray-100 text-gray-400',
                !isBooked && !isSelected && 'bg-green-50 text-green-700 hover:bg-green-100',
                !isBooked && isSelected && 'border-2 border-[#0EA5A0] bg-teal-50 text-[#0EA5A0]'
              )}
            >
              {s.start}-{s.end}
            </button>
          )
        })}
      </div>
      {matched && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0EA5A0]/15 text-lg font-bold text-[#0EA5A0]">
              {matched.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">{matched.name}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', levelMap[matched.seniorLevel].color)}>
                  {levelMap[matched.seniorLevel].label}
                </span>
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
      <button
        onClick={handleBook}
        disabled={!selSlot}
        className={cn(
          'w-full rounded-xl py-3 text-sm font-medium text-white shadow transition-colors',
          selSlot ? 'bg-[#0EA5A0] hover:bg-[#0d9490]' : 'cursor-not-allowed bg-gray-300'
        )}
      >
        确认预约
      </button>
    </motion.div>
  )
}

function MyAppointmentsTab() {
  const { appointments, therapists } = useStore()
  const sorted = [...appointments].sort((a, b) => (a.status === 'upcoming' ? -1 : 1))

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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0EA5A0]/15 text-sm font-bold text-[#0EA5A0]">
                  {t?.name[0] ?? '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t?.name ?? '未知康复师'}</p>
                  <p className="text-xs text-gray-400">{a.date} {a.startTime}-{a.endTime}</p>
                </div>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-medium', st.color)}>{st.label}</span>
            </div>
            {a.status === 'upcoming' && (
              <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#0EA5A0] py-2 text-xs font-medium text-white hover:bg-[#0d9490]">
                <Video className="h-3.5 w-3.5" />
                进入会议
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )
      })}
    </motion.div>
  )
}
