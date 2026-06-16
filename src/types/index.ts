export interface User {
  id: string
  name: string
  avatar: string
  phone: string
  membershipLevel: 'free' | 'silver' | 'gold'
  consecutiveDays: number
  joinDate: string
  paidUpgrade: boolean
}

export interface InjuryRecord {
  id: string
  userId: string
  bodyPart: string
  injuryDate: string
  description: string
  diagnosisReport?: string
  severity: 'mild' | 'moderate' | 'severe'
  createdAt: string
}

export interface Exercise {
  id: string
  name: string
  description: string
  imageUrl: string
  sets: number
  reps: number
  duration: number
  category: 'stretch' | 'strength' | 'mobility' | 'balance'
  keyPoints: string[]
  commonErrors: string[]
}

export interface RehabPlan {
  id: string
  userId: string
  injuryId: string
  phase: number
  totalPhases: number
  startDate: string
  endDate: string
  exercises: Exercise[]
  therapistId: string
  status: 'active' | 'paused' | 'completed'
  approvedByTherapist: boolean
}

export interface CheckInRecord {
  id: string
  userId: string
  planId: string
  exerciseId: string
  date: string
  photoUrl: string
  aiScore: number
  aiFeedback: string
  corrections: string[]
  completed: boolean
}

export interface StageAssessment {
  id: string
  userId: string
  planId: string
  date: string
  painScore: number
  functionScore: number
  rangeOfMotion: number
  strengthScore: number
  overallScore: number
  planAdjustment: string
  previousScore?: number
}

export interface Therapist {
  id: string
  name: string
  avatar: string
  specialty: string[]
  rating: number
  seniorLevel: 'junior' | 'senior' | 'expert'
  schedule: ScheduleSlot[]
}

export interface ScheduleSlot {
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  appointmentId?: string
}

export interface VideoAppointment {
  id: string
  userId: string
  therapistId: string
  date: string
  startTime: string
  endTime: string
  meetingLink: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
}

export interface MembershipConfig {
  level: 'free' | 'silver' | 'gold'
  requiredDays: number
  requiredPayment: number
  benefits: string[]
  videoGuidanceLimit: number | 'unlimited'
  priorityMatching: boolean
}

export interface ChatMessage {
  id: string
  senderId: string
  senderType: 'user' | 'therapist'
  content: string
  timestamp: string
  imageUrl?: string
}

export interface Notification {
  id: string
  type: 'reminder' | 'assessment' | 'upgrade' | 'approval' | 'appointment'
  title: string
  message: string
  timestamp: string
  read: boolean
}
