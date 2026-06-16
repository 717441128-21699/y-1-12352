import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, CheckCircle2, Clock, ShieldCheck,
  ChevronDown, AlertTriangle, Dumbbell, Timer,
} from 'lucide-react'
import { useStore } from '@/store'
import type { Exercise } from '@/types'

const categoryConfig = {
  stretch: { label: '拉伸', bg: 'bg-blue-100', text: 'text-blue-700' },
  strength: { label: '力量', bg: 'bg-orange-100', text: 'text-orange-700' },
  mobility: { label: '活动度', bg: 'bg-teal-100', text: 'text-teal-700' },
  balance: { label: '平衡', bg: 'bg-purple-100', text: 'text-purple-700' },
}

const phaseNames = ['急性期', '恢复期', '强化期', '功能期']

const completionMap: Record<string, 'green' | 'orange' | 'gray'> = {
  '2026-06-01': 'green', '2026-06-02': 'green', '2026-06-03': 'orange',
  '2026-06-04': 'green', '2026-06-05': 'gray', '2026-06-06': 'green',
  '2026-06-07': 'orange', '2026-06-08': 'green', '2026-06-09': 'green',
  '2026-06-10': 'green', '2026-06-11': 'orange', '2026-06-12': 'green',
  '2026-06-13': 'gray', '2026-06-14': 'green', '2026-06-15': 'orange',
  '2026-06-16': 'green', '2026-06-17': 'orange',
}

function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const cat = categoryConfig[exercise.category]

  return (
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
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-gray-400" />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
              <div>
                <p className="text-sm font-medium text-teal-700 mb-1">要点提示</p>
                <ul className="space-y-1">
                  {exercise.keyPoints.map((p, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                      <CheckCircle2 size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />{p}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">常见错误</p>
                <ul className="space-y-1">
                  {exercise.commonErrors.map((e, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                      <AlertTriangle size={14} className="text-orange-400 mt-0.5 flex-shrink-0" />{e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function CalendarView() {
  const today = 17
  const daysInMonth = 30
  const startOffset = new Date(2026, 5, 1).getDay()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarDays size={18} className="text-[#0EA5A0]" />
        <span className="font-semibold text-gray-900">2026年6月</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {weekdays.map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `2026-06-${String(day).padStart(2, '0')}`
          const dot = completionMap[dateStr]
          const isToday = day === today
          return (
            <div key={day} className="flex flex-col items-center py-1">
              <span className={`text-sm ${isToday ? 'bg-[#0EA5A0] text-white w-6 h-6 rounded-full flex items-center justify-center font-medium' : 'text-gray-700'}`}>
                {day}
              </span>
              {dot && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dot === 'green' ? 'bg-green-500' : dot === 'orange' ? 'bg-orange-400' : 'bg-gray-300'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />全部完成</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />部分完成</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />未活动</span>
      </div>
    </div>
  )
}

export default function Plan() {
  const { plan, therapists } = useStore()
  const therapist = therapists.find((t) => t.id === plan.therapistId)

  return (
    <div className="max-w-lg mx-auto p-4 space-y-5 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold text-gray-900">康复计划</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
      >
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
          {plan.exercises.map((ex, i) => (
            <ExerciseCard key={ex.id} exercise={ex} index={i} />
          ))}
        </div>
      </div>

      <CalendarView />

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
          <div className="flex justify-between">
            <span className="text-gray-500">下次评估</span>
            <span className="text-gray-900 font-medium">2026-06-20</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
