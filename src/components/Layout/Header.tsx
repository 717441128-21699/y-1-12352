import { useLocation, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useStore } from '@/store'

const routeTitles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/injury': '伤情管理',
  '/plan': '康复计划',
  '/checkin': '每日打卡',
  '/assessment': '阶段评估',
  '/therapist': '治疗师',
  '/membership': '会员中心',
  '/admin': '系统管理',
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const notifications = useStore((s) => s.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0]
  const title = routeTitles[basePath] || '康复管家'

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">首页</span>
        <span className="text-gray-300 text-sm">/</span>
        <span className="text-sm font-semibold text-gray-900">{title}</span>
      </div>

      <button
        onClick={() => navigate('/notifications')}
        className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </header>
  )
}
