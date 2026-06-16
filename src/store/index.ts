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
} from '@/mock/data'

interface AppState {
  user: User
  injuries: InjuryRecord[]
  plan: RehabPlan
  checkIns: CheckInRecord[]
  assessments: StageAssessment[]
  therapists: Therapist[]
  appointments: VideoAppointment[]
  messages: ChatMessage[]
  notifications: Notification[]
  currentPath: string
  isAssessmentDue: boolean

  completeCheckIn: (exerciseId: string) => void
  addInjury: (injury: InjuryRecord) => void
  addMessage: (message: ChatMessage) => void
  markNotificationRead: (id: string) => void
  bookAppointment: (appointment: VideoAppointment) => void
  submitAssessment: (assessment: StageAssessment) => void
  setPath: (path: string) => void
}

export const useStore = create<AppState>((set) => ({
  user: currentUser,
  injuries: injuryRecords,
  plan: rehabPlan,
  checkIns: checkInRecords,
  assessments: stageAssessments,
  therapists: therapists,
  appointments: videoAppointments,
  messages: chatMessages,
  notifications: notifications,
  currentPath: '/dashboard',
  isAssessmentDue: true,

  completeCheckIn: (exerciseId) =>
    set((state) => ({
      checkIns: state.checkIns.map((ci) =>
        ci.exerciseId === exerciseId
          ? {
              ...ci,
              completed: true,
              aiScore: Math.floor(Math.random() * 25) + 72,
              aiFeedback:
                [
                  '动作整体规范，继续保持',
                  '姿势良好，注意保持呼吸节奏',
                  '完成度不错，建议注意动作末端控制',
                  '稳定性较好，可以适当增加幅度',
                ][Math.floor(Math.random() * 4)],
              corrections:
                Math.random() > 0.5
                  ? [
                      [
                        '注意保持核心收紧',
                        '动作速度可以再慢一些',
                        '注意呼吸节奏',
                        '幅度可以适当增加',
                      ][Math.floor(Math.random() * 4)],
                    ]
                  : [],
            }
          : ci
      ),
    })),

  addInjury: (injury) =>
    set((state) => ({
      injuries: [injury, ...state.injuries],
    })),

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

  bookAppointment: (appointment) =>
    set((state) => ({
      appointments: [...state.appointments, appointment],
    })),

  submitAssessment: (assessment) =>
    set((state) => ({
      assessments: [...state.assessments, assessment],
      isAssessmentDue: false,
    })),

  setPath: (path) => set({ currentPath: path }),
}))
