import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  User,
  InjuryRecord,
  RehabPlan,
  CheckInRecord,
  StageAssessment,
  Therapist,
  VideoAppointment,
  ChatMessage,
  Notification,
  Exercise,
} from '@/types'
import {
  currentUser,
  injuryRecords,
  rehabPlan,
  checkInRecords,
  stageAssessments,
  therapists,
  videoAppointments,
  chatMessages,
  notifications,
  membershipConfigs,
} from '@/mock/data'

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

function getDaysInRange(start: string, end: string): string[] {
  const result: string[] = []
  const cur = new Date(start)
  const last = new Date(end)
  if (cur > last) return result
  while (cur <= last) {
    result.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

const EXERCISES_LIBRARY: Exercise[] = [
  {
    id: 'lib_stretch_1',
    name: '股四头肌静态拉伸',
    description: '站立扶墙，患肢后弯，手抓脚背拉向臀部，保持20秒',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=person%20doing%20quadriceps%20static%20stretch%20exercise%20physical%20therapy&image_size=landscape_16_9',
    sets: 3,
    reps: 1,
    duration: 20,
    category: 'stretch',
    keyPoints: ['保持身体直立', '膝盖指向地面', '不要拱腰'],
    commonErrors: ['身体前倾', '膝盖向外撇'],
  },
  {
    id: 'lib_strength_1',
    name: '臀桥训练',
    description: '仰卧屈膝，双脚踩地，臀部抬起至身体呈直线',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=person%20doing%20glute%20bridge%20exercise%20physical%20therapy%20mat&image_size=landscape_16_9',
    sets: 3,
    reps: 15,
    duration: 3,
    category: 'strength',
    keyPoints: ['收紧臀部', '腹部不放松', '下放时缓慢控制'],
    commonErrors: ['腰部过度拱起', '下落速度过快'],
  },
  {
    id: 'lib_strength_2',
    name: '侧抬腿',
    description: '侧卧位，上方腿伸直侧抬约30度，保持2秒',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=person%20lying%20side%20doing%20side%20leg%20raise%20exercise%20physical%20therapy&image_size=landscape_16_9',
    sets: 3,
    reps: 12,
    duration: 2,
    category: 'strength',
    keyPoints: ['保持骨盆稳定', '脚尖朝前', '控制速度'],
    commonErrors: ['身体旋转', '抬腿过高'],
  },
  {
    id: 'lib_mobility_1',
    name: '踝关节绕环',
    description: '坐姿，踝关节顺时针、逆时针各做10次绕环',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=person%20doing%20ankle%20circles%20exercise%20physical%20therapy&image_size=landscape_16_9',
    sets: 2,
    reps: 10,
    duration: 2,
    category: 'mobility',
    keyPoints: ['幅度尽可能大', '动作匀速', '避免疼痛'],
    commonErrors: ['速度过快', '幅度不足'],
  },
  {
    id: 'lib_balance_1',
    name: '双脚平衡站立',
    description: '双脚并拢站立，双手自然下垂，保持身体稳定',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=person%20doing%20double%20leg%20balance%20stand%20physical%20therapy&image_size=landscape_16_9',
    sets: 3,
    reps: 1,
    duration: 30,
    category: 'balance',
    keyPoints: ['核心收紧', '目光平视', '膝盖微屈'],
    commonErrors: ['膝盖锁死', '低头看脚'],
  },
]

function generateExercisesForInjury(bodyPart: string, severity: string): Exercise[] {
  const base = EXERCISES_LIBRARY.slice(0, 3)
  const more = severity === 'severe' ? [] : EXERCISES_LIBRARY.slice(3)
  return [...base, ...more].map((ex, i) => ({ ...ex, id: `gen_${Date.now()}_${i}` }))
}

function computeOverall(pain: number, fn: number, rom: number, str: number) {
  return Math.round(((10 - pain) + fn * 2 + rom + str * 2) / 6 * 10) / 10
}

function analyzeExerciseOnly(): { aiScore: number; aiFeedback: string; corrections: string[] } {
  const score = Math.floor(Math.random() * 25) + 72
  const feedbackPool = [
    '动作整体规范，继续保持',
    '姿势良好，注意保持呼吸节奏',
    '完成度不错，建议注意动作末端控制',
    '稳定性较好，可以适当增加幅度',
  ]
  const aiFeedback = feedbackPool[Math.floor(Math.random() * feedbackPool.length)]
  const corrPool = ['注意保持核心收紧', '动作速度可以再慢一些', '注意呼吸节奏', '幅度可以适当增加']
  const corrections = Math.random() > 0.5 ? [corrPool[Math.floor(Math.random() * corrPool.length)]] : []
  return { aiScore: score, aiFeedback, corrections }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface AppState {
  user: User
  injuries: InjuryRecord[]
  plan: RehabPlan
  plans: RehabPlan[]
  checkIns: CheckInRecord[]
  assessments: StageAssessment[]
  therapists: Therapist[]
  appointments: VideoAppointment[]
  messages: ChatMessage[]
  notifications: Notification[]
  currentPath: string
  isAssessmentDue: boolean
  todaysDate: string
  hydrated: boolean
  therapistReviews: { checkInId: string; therapistId: string; comment: string; timestamp: string; exerciseName: string }[]

  analyzeExercise: (exerciseId: string, photoUrl: string) => { aiScore: number; aiFeedback: string; corrections: string[] }
  saveCheckIn: (exerciseId: string, date: string, photoUrl: string, analysis: { aiScore: number; aiFeedback: string; corrections: string[] }) => void
  initializeDayCheckIns: (planId: string, date: string) => void
  initializeTodayCheckIns: () => void
  getCheckInsForDate: (planId: string, date: string) => (CheckInRecord & { exercise?: Exercise })[]
  addInjury: (injury: InjuryRecord) => void
  addMessage: (message: ChatMessage) => void
  markNotificationRead: (id: string) => void
  bookAppointment: (date: string, startTime: string, endTime: string) => VideoAppointment | null
  getAvailableTherapist: (date: string, startTime: string, endTime: string) => Therapist | null
  submitAssessment: (assessment: StageAssessment) => { phaseAdvanced: boolean; periodExtended: boolean; newPhase: number; newEndDate: string; oldPhase: number; oldEndDate: string }
  setPath: (path: string) => void
  finishDayTraining: (planId: string, date: string) => void
  upgradeMembership: (level: 'silver' | 'gold') => void
  setActivePlan: (planId: string) => void
  getTodayAvgScore: (planId?: string) => number
  getTodayCompletedCount: (planId?: string) => number
  getTotalCountForDate: (planId: string, date: string) => { completed: number; total: number; avg: number }
  getConsecutiveDaysForPlan: (planId: string) => number
  isSlotBooked: (date: string, startTime: string) => boolean
  addTherapistReview: (checkInId: string, therapistId: string, exerciseName: string, comment: string) => void
  getRecentCheckIns: (planId: string, limit?: number) => (CheckInRecord & { exercise?: Exercise })[]
  getLowScoreCheckIns: (planId: string, threshold?: number) => (CheckInRecord & { exercise?: Exercise })[]
  fileToBase64: (file: File) => Promise<string>
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: currentUser,
      injuries: injuryRecords,
      plan: rehabPlan,
      plans: [rehabPlan],
      checkIns: checkInRecords,
      assessments: stageAssessments,
      therapists: therapists,
      appointments: videoAppointments,
      messages: chatMessages,
      notifications: notifications,
      currentPath: '/dashboard',
      isAssessmentDue: true,
      todaysDate: getTodayKey(),
      hydrated: false,
      therapistReviews: [],

      fileToBase64,

      getTodayAvgScore: (planId) => {
        const state = get()
        const today = state.todaysDate
        const pid = planId ?? state.plan.id
        const done = state.checkIns.filter((c) => c.date === today && c.planId === pid && c.completed && c.aiScore > 0)
        if (done.length === 0) return 0
        return Math.round(done.reduce((s, c) => s + c.aiScore, 0) / done.length)
      },

      getTodayCompletedCount: (planId) => {
        const state = get()
        const today = state.todaysDate
        const pid = planId ?? state.plan.id
        return state.checkIns.filter((c) => c.date === today && c.planId === pid && c.completed).length
      },

      getTotalCountForDate: (planId, date) => {
        const state = get()
        const list = state.checkIns.filter((c) => c.date === date && c.planId === planId)
        const completed = list.filter((c) => c.completed)
        const avg = completed.length > 0 && completed.some((c) => c.aiScore > 0)
          ? Math.round(completed.filter((c) => c.aiScore > 0).reduce((s, c) => s + c.aiScore, 0) / completed.filter((c) => c.aiScore > 0).length)
          : 0
        return { completed: completed.length, total: list.length, avg }
      },

      getConsecutiveDaysForPlan: (planId) => {
        const state = get()
        const today = new Date(state.todaysDate)
        let count = 0
        let d = new Date(today)
        while (true) {
          const dk = d.toISOString().split('T')[0]
          const { completed, total } = state.getTotalCountForDate(planId, dk)
          if (total > 0 && completed === total) {
            count++
            d.setDate(d.getDate() - 1)
          } else {
            break
          }
        }
        return count
      },

      isSlotBooked: (date, startTime) => {
        const state = get()
        return state.appointments.some(
          (a) => a.date === date && a.startTime === startTime && a.status !== 'cancelled'
        )
      },

      analyzeExercise: (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        exerciseId,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        photoUrl
      ) => analyzeExerciseOnly(),

      saveCheckIn: (exerciseId, date, photoUrl, analysis) => {
        set((state) => {
          const existing = state.checkIns.find((c) => c.exerciseId === exerciseId && c.date === date)
          if (existing) {
            return {
              checkIns: state.checkIns.map((ci) =>
                ci.exerciseId === exerciseId && ci.date === date
                  ? { ...ci, completed: true, aiScore: analysis.aiScore, aiFeedback: analysis.aiFeedback, corrections: analysis.corrections, photoUrl }
                  : ci
              ),
            }
          } else {
            return {
              checkIns: [
                ...state.checkIns,
                {
                  id: `ck_${Date.now()}_${exerciseId}`,
                  userId: 'u001',
                  planId: state.plan.id,
                  exerciseId,
                  date,
                  photoUrl,
                  aiScore: analysis.aiScore,
                  aiFeedback: analysis.aiFeedback,
                  corrections: analysis.corrections,
                  completed: true,
                },
              ],
            }
          }
        })
      },

      initializeDayCheckIns: (planId, date) => {
        const state = get()
        const thePlan = state.plans.find((p) => p.id === planId)
        if (!thePlan) return
        const existing = state.checkIns.filter((c) => c.planId === planId && c.date === date)
        if (existing.length > 0) return
        const newCheckIns: CheckInRecord[] = thePlan.exercises.map((ex) => ({
          id: `ck_${Date.now()}_${ex.id}_${date}`,
          userId: 'u001',
          planId,
          exerciseId: ex.id,
          date,
          photoUrl: '',
          aiScore: 0,
          aiFeedback: '',
          corrections: [],
          completed: false,
        }))
        set((s) => ({ checkIns: [...s.checkIns, ...newCheckIns] }))
      },

      initializeTodayCheckIns: () => {
        const state = get()
        const today = getTodayKey()
        state.initializeDayCheckIns(state.plan.id, today)
        // Also init past 14 days for calendar visibility
        const yesterday = new Date()
        for (let i = 1; i <= 14; i++) {
          const d = new Date(yesterday)
          d.setDate(d.getDate() - i)
          const dk = d.toISOString().split('T')[0]
          if (dk >= state.plan.startDate) {
            state.initializeDayCheckIns(state.plan.id, dk)
          }
        }
      },

      getCheckInsForDate: (planId, date) => {
        const state = get()
        const thePlan = state.plans.find((p) => p.id === planId)
        if (!thePlan) return []
        const byExId = new Map<string, CheckInRecord>()
        state.checkIns
          .filter((c) => c.planId === planId && c.date === date)
          .forEach((c) => byExId.set(c.exerciseId, c))
        return thePlan.exercises.map((ex) => {
          const ci = byExId.get(ex.id)
          return ci ? { ...ci, exercise: ex } : ({
            id: `tmp_${ex.id}`,
            userId: 'u001',
            planId,
            exerciseId: ex.id,
            date,
            photoUrl: '',
            aiScore: 0,
            aiFeedback: '',
            corrections: [],
            completed: false,
            exercise: ex,
          })
        })
      },

      addInjury: (injury) => {
        const newExercises = generateExercisesForInjury(injury.bodyPart, injury.severity)
        const startDate = new Date()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 4)
        const newPlan: RehabPlan = {
          id: `plan_${Date.now()}`,
          userId: 'u001',
          injuryId: injury.id,
          phase: 1,
          totalPhases: 4,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          exercises: newExercises,
          therapistId: 't001',
          status: 'active',
          approvedByTherapist: true,
        }
        set((state) => ({
          injuries: [injury, ...state.injuries],
          plans: [newPlan, ...state.plans],
          plan: newPlan,
          notifications: [
            {
              id: `n_${Date.now()}`,
              type: 'approval',
              title: '新康复计划已生成',
              message: `针对您的${injury.bodyPart}损伤，系统已生成新的康复计划`,
              timestamp: new Date().toLocaleString('zh-CN'),
              read: false,
            },
            ...state.notifications,
          ],
        }))
        get().initializeTodayCheckIns()
      },

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      getAvailableTherapist: (date, startTime) => {
        const state = get()
        const bookedTherapistIds = state.appointments
          .filter((a) => a.date === date && a.startTime === startTime && a.status !== 'cancelled')
          .map((a) => a.therapistId)
        const available = state.therapists.filter((t) => !bookedTherapistIds.includes(t.id))
        if (available.length === 0) return null
        if (state.user.membershipLevel === 'gold') {
          const experts = available.filter((t) => t.seniorLevel === 'expert')
          if (experts.length > 0) return experts[0]
        }
        return available[0]
      },

      bookAppointment: (date, startTime, endTime) => {
        const state = get()
        if (state.isSlotBooked(date, startTime)) return null
        const therapist = state.getAvailableTherapist(date, startTime, endTime)
        if (!therapist) return null
        const appt: VideoAppointment = {
          id: `va_${Date.now()}`,
          userId: state.user.id,
          therapistId: therapist.id,
          date,
          startTime,
          endTime,
          meetingLink: `https://meeting.rehab-app.com/room/${Date.now()}`,
          status: 'upcoming',
        }
        set((s) => ({
          appointments: [...s.appointments, appt],
          notifications: [
            {
              id: `n_${Date.now()}`,
              type: 'appointment',
              title: '视频指导预约确认',
              message: `您已成功预约${date} ${startTime} ${therapist.name}的视频指导`,
              timestamp: new Date().toLocaleString('zh-CN'),
              read: false,
            },
            ...s.notifications,
          ],
        }))
        return appt
      },

      submitAssessment: (assessment) => {
        const overall = computeOverall(
          assessment.painScore,
          assessment.functionScore,
          assessment.rangeOfMotion,
          assessment.strengthScore
        )
        const state = get()
        const currentPlan = state.plan
        const oldPhase = currentPlan.phase
        const oldEndDate = currentPlan.endDate
        const shouldAdvance = overall >= 7
        const newPhase = shouldAdvance
          ? Math.min(currentPlan.phase + 1, currentPlan.totalPhases)
          : currentPlan.phase
        const newEndDateObj = new Date(currentPlan.endDate)
        if (!shouldAdvance) newEndDateObj.setDate(newEndDateObj.getDate() + 14)
        const newEndDate = newEndDateObj.toISOString().split('T')[0]
        const phaseAdvanced = newPhase > oldPhase
        const periodExtended = newEndDate !== oldEndDate

        const updatedPlan: RehabPlan = { ...currentPlan, phase: newPhase, endDate: newEndDate }

        set((s) => ({
          assessments: [...s.assessments, assessment],
          isAssessmentDue: false,
          plan: updatedPlan,
          plans: s.plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)),
          notifications: [
            {
              id: `n_${Date.now()}`,
              type: 'assessment',
              title: '康复方案已更新',
              message: shouldAdvance
                ? `评估结果良好，方案已推进到第${newPhase}阶段`
                : `评估完成，康复方案已根据结果调整，周期延长2周`,
              timestamp: new Date().toLocaleString('zh-CN'),
              read: false,
            },
            ...s.notifications,
          ],
        }))

        get().initializeTodayCheckIns()
        return { phaseAdvanced, periodExtended, newPhase, newEndDate, oldPhase, oldEndDate }
      },

      setPath: (path) => set({ currentPath: path }),

      finishDayTraining: (planId, date) => {
        const state = get()
        const { completed, total } = state.getTotalCountForDate(planId, date)
        if (total === 0 || completed < total) return

        const consecutive = state.getConsecutiveDaysForPlan(planId)
        // We'll bump user.consecutiveDays to reflect max across plans
        const newConsecutive = Math.max(state.user.consecutiveDays, consecutive)
        let newLevel = state.user.membershipLevel
        const cfg = membershipConfigs
        if (newLevel === 'free' && newConsecutive >= cfg[1].requiredDays) newLevel = 'silver'
        else if (newLevel === 'silver' && newConsecutive >= cfg[2].requiredDays) newLevel = 'gold'

        set((s) => ({
          user: {
            ...s.user,
            consecutiveDays: newConsecutive,
            membershipLevel: newLevel,
            paidUpgrade: newLevel !== s.user.membershipLevel ? false : s.user.paidUpgrade,
          },
          notifications: newLevel !== s.user.membershipLevel
            ? [
                {
                  id: `n_${Date.now()}`,
                  type: 'upgrade',
                  title: '恭喜会员升级！',
                  message: `您已连续打卡${newConsecutive}天，会员等级已升级为${newLevel === 'silver' ? '银卡' : '金卡'}`,
                  timestamp: new Date().toLocaleString('zh-CN'),
                  read: false,
                },
                ...s.notifications,
              ]
            : s.notifications,
        }))
      },

      upgradeMembership: (level) => {
        set((s) => ({
          user: { ...s.user, membershipLevel: level, paidUpgrade: true },
          notifications: [
            {
              id: `n_${Date.now()}`,
              type: 'upgrade',
              title: '会员升级成功',
              message: `恭喜您已升级为${level === 'silver' ? '银卡' : '金卡'}会员，享受专属权益`,
              timestamp: new Date().toLocaleString('zh-CN'),
              read: false,
            },
            ...s.notifications,
          ],
        }))
      },

      setActivePlan: (planId) => {
        const state = get()
        const found = state.plans.find((p) => p.id === planId)
        if (found) {
          set({ plan: found })
          get().initializeTodayCheckIns()
        }
      },

      addTherapistReview: (checkInId, therapistId, exerciseName, comment) => {
        const timestamp = new Date().toLocaleString('zh-CN')
        set((state) => ({
          therapistReviews: [
            { checkInId, therapistId, exerciseName, comment, timestamp },
            ...state.therapistReviews,
          ],
          checkIns: state.checkIns.map((c) =>
            c.id === checkInId
              ? { ...c, therapistFeedback: comment, therapistId, therapistTimestamp: timestamp }
              : c
          ),
          notifications: [
            {
              id: `n_${Date.now()}`,
              type: 'approval',
              title: '康复师反馈已到达',
              message: `您的${exerciseName}训练收到了康复师的反馈`,
              timestamp,
              read: false,
            },
            ...state.notifications,
          ],
        }))
      },

      getRecentCheckIns: (planId, limit = 20) => {
        const state = get()
        const thePlan = state.plans.find((p) => p.id === planId)
        if (!thePlan) return []
        const exMap = new Map(thePlan.exercises.map((e) => [e.id, e]))
        return state.checkIns
          .filter((c) => c.planId === planId && c.completed)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, limit)
          .map((c) => ({ ...c, exercise: exMap.get(c.exerciseId) }))
      },

      getLowScoreCheckIns: (planId, threshold = 70) => {
        const state = get()
        const thePlan = state.plans.find((p) => p.id === planId)
        if (!thePlan) return []
        const exMap = new Map(thePlan.exercises.map((e) => [e.id, e]))
        return state.checkIns
          .filter((c) => c.planId === planId && c.completed && c.aiScore > 0 && c.aiScore < threshold)
          .sort((a, b) => a.aiScore - b.aiScore)
          .map((c) => ({ ...c, exercise: exMap.get(c.exerciseId) }))
      },
    }),
    {
      name: 'rehab-app-storage',
      partialize: (state) => ({
        user: state.user,
        injuries: state.injuries,
        plans: state.plans,
        plan: state.plan,
        checkIns: state.checkIns,
        assessments: state.assessments,
        appointments: state.appointments,
        messages: state.messages,
        notifications: state.notifications,
        isAssessmentDue: state.isAssessmentDue,
        therapistReviews: state.therapistReviews,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true
          state.todaysDate = getTodayKey()
          // Delay a tick to ensure state is fully restored
          setTimeout(() => state.initializeTodayCheckIns(), 100)
        }
      },
    }
  )
)
