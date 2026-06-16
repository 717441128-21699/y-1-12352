import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  Users, UserCheck, Stethoscope, CalendarDays,
  AlertTriangle,
} from 'lucide-react'
import { adminStats } from '@/mock/data'

const { totalUsers, activeUsers, totalTherapists, avgRehabDays,
  phaseDistribution, weeklyCheckIns, interventionSuggestions } = adminStats

const statCards = [
  { icon: Users, label: '总用户', value: totalUsers, color: '#0EA5A0', bg: 'bg-[#0EA5A0]/10' },
  { icon: UserCheck, label: '活跃用户', value: activeUsers, color: '#34D399', bg: 'bg-[#34D399]/10' },
  { icon: Stethoscope, label: '康复师', value: totalTherapists, color: '#FF8C42', bg: 'bg-[#FF8C42]/10' },
  { icon: CalendarDays, label: '平均康复天数', value: avgRehabDays, color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' },
]

const therapists = ['李康复', '王理疗', '陈治疗', '刘运动医', '赵康复师']
const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const scheduleGrid: boolean[][] = [
  [true, true, false, true, true, false, false],
  [true, false, true, true, false, true, false],
  [false, true, true, false, true, true, false],
  [true, true, true, false, true, false, true],
  [true, false, false, true, true, true, false],
]

const severityConfig = {
  high: { label: '高', className: 'bg-red-100 text-red-600', border: 'border-l-red-500' },
  medium: { label: '中', className: 'bg-orange-100 text-orange-600', border: 'border-l-orange-400' },
  low: { label: '低', className: 'bg-yellow-100 text-yellow-600', border: 'border-l-yellow-400' },
}

const cardAnim = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: 'easeOut' },
  }),
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">管理后台</h1>

        {/* Top Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={cardAnim}
              initial="hidden"
              animate="visible"
              className="rounded-xl bg-white p-5 shadow-sm"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-400">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Therapist Schedule */}
          <motion.div
            custom={4}
            variants={cardAnim}
            initial="hidden"
            animate="visible"
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-base font-semibold text-gray-900">康复师排班</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="pb-2 pr-3 text-left font-medium text-gray-500">康复师</th>
                    {days.map((d) => (
                      <th key={d} className="pb-2 text-center font-medium text-gray-500">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {therapists.map((name, ri) => (
                    <tr key={name}>
                      <td className="py-1.5 pr-3 font-medium text-gray-700 whitespace-nowrap">{name}</td>
                      {scheduleGrid[ri].map((avail, ci) => (
                        <td key={ci} className="py-1.5 text-center">
                          <span
                            className={`inline-block h-6 w-10 rounded ${
                              avail ? 'bg-[#34D399]/30' : 'bg-gray-200'
                            }`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-5 rounded bg-[#34D399]/30" /> 可约
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-5 rounded bg-gray-200" /> 已约
              </span>
            </div>
          </motion.div>

          {/* User Progress Distribution */}
          <motion.div
            custom={5}
            variants={cardAnim}
            initial="hidden"
            animate="visible"
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-base font-semibold text-gray-900">用户康复阶段分布</h2>
            <div className="flex items-center justify-center">
              <PieChart width={260} height={240}>
                <Pie
                  data={phaseDistribution}
                  cx={130}
                  cy={110}
                  innerRadius={50}
                  outerRadius={85}
                  dataKey="count"
                  nameKey="phase"
                  paddingAngle={2}
                  stroke="none"
                >
                  {phaseDistribution.map((entry) => (
                    <Cell key={entry.phase} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}人`, name]}
                />
              </PieChart>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {phaseDistribution.map((p) => (
                <span key={p.phase} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.phase} {p.count}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Weekly Check-in Trend */}
          <motion.div
            custom={6}
            variants={cardAnim}
            initial="hidden"
            animate="visible"
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-base font-semibold text-gray-900">本周打卡趋势</h2>
            <BarChart width={480} height={220} data={weeklyCheckIns}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0EA5A0" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </motion.div>

          {/* Intervention Suggestions */}
          <motion.div
            custom={7}
            variants={cardAnim}
            initial="hidden"
            animate="visible"
            className="rounded-xl bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#FF8C42]" />
              <h2 className="text-base font-semibold text-gray-900">干预建议</h2>
            </div>
            <div className="space-y-3">
              {interventionSuggestions.map((item, i) => {
                const sev = severityConfig[item.severity]
                return (
                  <motion.div
                    key={item.userId}
                    custom={8 + i}
                    variants={cardAnim}
                    initial="hidden"
                    animate="visible"
                    className={`rounded-lg border-l-4 ${sev.border} bg-gray-50 p-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{item.userName}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sev.className}`}>
                        {sev.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{item.reason}</p>
                    <p className="mt-1 text-xs text-gray-400">{item.suggestion}</p>
                    <button className="mt-2 rounded-md bg-[#0EA5A0] px-3 py-1 text-xs font-medium text-white hover:bg-[#0d9490]">
                      处理
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
