import { create } from 'zustand'
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

  completeCheckIn: (exerciseId: string, photoUrl: string) => { aiScore: number; aiFeedback: string; corrections: string[] }
  addInjury: (injury: InjuryRecord) => void
  addMessage: (message: ChatMessage) => void
  markNotificationRead: (id: string) => void
  bookAppointment: (date: string, startTime: string, endTime: string) => VideoAppointment | null
  getAvailableTherapist: (date: string, startTime: string, endTime: string) => Therapist | null
  submitAssessment: (assessment: StageAssessment) => { phaseAdvanced: boolean; periodExtended: boolean; newPhase: number; newEndDate: string; oldPhase: number; oldEndDate: string }
  setPath: (path: string) => void
  finishDayTraining: () => void
  upgradeMembership: (level: 'silver' | 'gold') => void
  setActivePlan: (planId: string) => void
  getTodayAvgScore: () => number
  getTodayCompletedCount: () => number
  isSlotBooked: (date: string, startTime: string) => boolean
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

export const useStore = create<AppState>((set, get) => ({
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

  getTodayAvgScore: () => {
    const state = get()
    const today = state.todaysDate
    const done = state.checkIns.filter((c) => c.date === today && c.completed && c.aiScore > 0)
    if (done.length === 0) return 0
    return Math.round(done.reduce((s, c) => s + c.aiScore, 0) / done.length)
  },

  getTodayCompletedCount: () => {
    const state = get()
    const today = state.todaysDate
    return state.checkIns.filter((c) => c.date === today && c.completed).length
  },

  isSlotBooked: (date, startTime) => {
    const state = get()
    return state.appointments.some(
      (a) => a.date === date && a.startTime === startTime && a.status !== 'cancelled'
    )
  },

  completeCheckIn: (exerciseId, photoUrl) => {
    const today = get().todaysDate
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

    set((state) => ({
      checkIns: state.checkIns.map((ci) =>
        ci.exerciseId === exerciseId && ci.date === today
          ? { ...ci, completed: true, aiScore: score, aiFeedback, corrections, photoUrl }
          : ci
      ),
    }))
    return { aiScore: score, aiFeedback, corrections }
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
    const today = getTodayKey()
    const newCheckIns: CheckInRecord[] = newExercises.map((ex) => ({
      id: `ck_${Date.now()}_${ex.id}`,
      userId: 'u001',
      planId: newPlan.id,
      exerciseId: ex.id,
      date: today,
      photoUrl: '',
      aiScore: 0,
      aiFeedback: '',
      corrections: [],
      completed: false,
    }))
    set((state) => ({
      injuries: [injury, ...state.injuries],
      plans: [newPlan, ...state.plans],
      plan: newPlan,
      checkIns: [...state.checkIns, ...newCheckIns],
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
  },

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  getAvailableTherapist: (date, startTime, endTime) => {
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

    const updatedPlan: RehabPlan = {
      ...currentPlan,
      phase: newPhase,
      endDate: newEndDate,
    }

    const today = getTodayKey()
    const existingIds = state.checkIns.filter((c) => c.planId === currentPlan.id && c.date >= today).map((c) => c.exerciseId)
    const newCheckIns: CheckInRecord[] = currentPlan.exercises
      .filter((ex) => !existingIds.includes(ex.id))
      .map((ex) => ({
        id: `ck_${Date.now()}_${ex.id}`,
        userId: 'u001',
        planId: currentPlan.id,
        exerciseId: ex.id,
        date: today,
        photoUrl: '',
        aiScore: 0,
        aiFeedback: '',
        corrections: [],
        completed: false,
      }))

    set((s) => ({
      assessments: [...s.assessments, assessment],
      isAssessmentDue: false,
      plan: updatedPlan,
      plans: s.plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)),
      checkIns: [...s.checkIns, ...newCheckIns],
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

    return { phaseAdvanced, periodExtended, newPhase, newEndDate, oldPhase, oldEndDate }
  },

  setPath: (path) => set({ currentPath: path }),

  finishDayTraining: () => {
    const state = get()
    const today = state.todaysDate
    const plan = state.plan
    const doneCount = state.checkIns.filter((c) => c.date === today && c.planId === plan.id && c.completed).length
    const totalCount = state.checkIns.filter((c) => c.date === today && c.planId === plan.id).length
    if (totalCount === 0 || doneCount < totalCount) return

    const newConsecutive = state.user.consecutiveDays + 1
    let newLevel = state.user.membershipLevel
    const cfg = membershipConfigs
    if (newLevel === 'free' && newConsecutive >= cfg[1].requiredDays) {
      newLevel = 'silver'
    } else if (newLevel === 'silver' && newConsecutive >= cfg[2].requiredDays) {
      newLevel = 'gold'
    }

    set((s) => ({
      user: { ...s.user, consecutiveDays: newConsecutive, membershipLevel: newLevel, paidUpgrade: newLevel !== s.user.membershipLevel ? false : s.user.paidUpgrade },
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
    if (found) set({ plan: found })
  },
}))
