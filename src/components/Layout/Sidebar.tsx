import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  HeartPulse,
  ClipboardList,
  CheckCircle,
  ClipboardCheck,
  Users,
  Crown,
  Settings,
} from 'lucide-react'
import { useStore } from '@/store'

const navItems = [
  { icon: LayoutDashboard, label: '仪表盘', path: '/dashboard' },
  { icon: HeartPulse, label: '伤情管理', path: '/injury' },
  { icon: ClipboardList, label: '康复计划', path: '/plan' },
  { icon: CheckCircle, label: '每日打卡', path: '/checkin' },
  { icon: ClipboardCheck, label: '阶段评估', path: '/assessment' },
  { icon: Users, label: '治疗师', path: '/therapist' },
  { icon: Crown, label: '会员中心', path: '/membership' },
  { icon: Settings, label: '系统管理', path: '/admin' },
]

const membershipLabel: Record<string, string> = {
  free: '免费版',
  silver: '银卡会员',
  gold: '金卡会员',
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useStore((s) => s.user)

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm">
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0EA5A0] flex items-center justify-center">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">康复管家</span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#0EA5A0] text-white shadow-md shadow-[#0EA5A0]/25'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </motion.button>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#0EA5A0]/20"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <span
              className={`inline-block text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                user.membershipLevel === 'gold'
                  ? 'bg-amber-50 text-amber-600'
                  : user.membershipLevel === 'silver'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-50 text-gray-400'
              }`}
            >
              {membershipLabel[user.membershipLevel]}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
