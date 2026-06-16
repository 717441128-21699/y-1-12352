import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useStore } from '@/store'

export default function AppLayout() {
  const notifications = useStore((s) => s.notifications)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        {unreadCount > 0 && (
          <div className="bg-[#0EA5A0]/10 border-b border-[#0EA5A0]/20 px-6 py-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#0EA5A0]" />
            <span className="text-sm text-[#0EA5A0] font-medium">
              您有 {unreadCount} 条未读通知
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
