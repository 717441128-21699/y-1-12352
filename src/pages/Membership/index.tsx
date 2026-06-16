import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Check, Star, Video, Shield, Sparkles, Gift, Rocket } from 'lucide-react'
import { useStore } from '@/store'
import { membershipConfigs } from '@/mock/data'
import { cn } from '@/lib/utils'

const levelLabels: Record<string, string> = { free: '免费卡', silver: '银卡', gold: '金卡' }
const levelGradients: Record<string, string> = {
  free: 'from-gray-400 via-gray-300 to-gray-500',
  silver: 'from-[#C0C0C0] via-[#D8D8D8] to-[#E8E8E8]',
  gold: 'from-[#FFD700] via-[#FFC000] to-[#FFA500]',
}
const levelBorders: Record<string, string> = {
  free: '',
  silver: 'shadow-[0_0_15px_rgba(192,192,192,0.5)]',
  gold: 'shadow-[0_0_20px_rgba(255,215,0,0.6)]',
}

const cardVar = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const toastVar = { hidden: { opacity: 0, y: -20, scale: 0.9 }, visible: { opacity: 1, y: 0, scale: 1 } }

export default function Membership() {
  const { user, upgradeMembership, notifications } = useStore()
  const [showToast, setShowToast] = useState(false)

  const current = user.membershipLevel
  const currentIdx = membershipConfigs.findIndex((c) => c.level === current)
  const nextLevel = currentIdx < membershipConfigs.length - 1 ? membershipConfigs[currentIdx + 1] : null
  const progressPercent = nextLevel
    ? Math.min((user.consecutiveDays / nextLevel.requiredDays) * 100, 100)
    : 100
  const meetsDayRequirement = nextLevel ? user.consecutiveDays >= nextLevel.requiredDays : false

  const videoUsed = 1
  const aiUsed = 5
  const currentConfig = membershipConfigs[currentIdx]
  const videoLimit = currentConfig.videoGuidanceLimit
  const isVideoUnlimited = videoLimit === 'unlimited'
  const isGold = current === 'gold'

  const upgradeNotifications = notifications
    .filter((n) => n.type === 'upgrade' && !n.read)
    .slice(0, 3)

  const handleUpgrade = (level: 'silver' | 'gold') => {
    upgradeMembership(level)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const getUpgradeButtonText = () => {
    if (current === 'free') return '立即升级银卡 · ¥99'
    if (current === 'silver') return '立即升级金卡 · ¥199'
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8 relative">
      <AnimatePresence>
        {showToast && (
          <motion.div
            variants={toastVar}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-lg px-5 py-3 flex items-center gap-2 border border-green-100"
          >
            <span className="text-xl">🎉</span>
            <span className="text-sm font-medium text-gray-900">会员升级成功！</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-md px-4 pt-6 space-y-5">
        <h1 className="text-2xl font-bold text-gray-900">会员中心</h1>

        <motion.div
          key={current}
          variants={cardVar}
          initial="hidden"
          animate="visible"
          className={cn(
            'rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg transition-all duration-500',
            levelGradients[current],
            levelBorders[current]
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-white/80" />
              <span className="text-lg font-bold">{levelLabels[current]}</span>
            </div>
            <Star className="h-5 w-5 text-white/60" />
          </div>
          <p className="text-xl font-bold text-gray-800">{user.name}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-700">
            <span>连续打卡 {user.consecutiveDays} 天</span>
            <span>加入于 {user.joinDate}</span>
          </div>
        </motion.div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-gray-900">等级对比</h2>
          <div className="grid grid-cols-3 gap-2">
            {membershipConfigs.map((cfg, i) => {
              const isCurrent = cfg.level === current
              return (
                <motion.div
                  key={cfg.level}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.35 }}
                  className={cn(
                    'rounded-xl bg-white p-3 text-center shadow-sm transition-all duration-300',
                    isCurrent && cn('ring-2 ring-[#0EA5A0]', levelBorders[cfg.level])
                  )}
                >
                  <div
                    className={cn(
                      'mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br',
                      levelGradients[cfg.level]
                    )}
                  >
                    <Crown className="h-4 w-4 text-white/90" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{levelLabels[cfg.level]}</p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {cfg.requiredDays}天 · ¥{cfg.requiredPayment}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {cfg.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-1 text-[10px] text-gray-600">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#0EA5A0]" />
                        <span className="text-left">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <AnimatePresence mode="wait">
                    {isCurrent && (
                      <motion.span
                        key="current-badge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="mt-2 inline-block rounded-full bg-[#0EA5A0] px-2 py-0.5 text-[10px] font-medium text-white"
                      >
                        当前
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>

        {nextLevel ? (
          <motion.div variants={cardVar} initial="hidden" animate="visible" className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">升级进度</h2>

            {user.paidUpgrade ? (
              <div className="flex items-center gap-2 rounded-xl bg-[#FF8C42]/10 px-4 py-3">
                <Gift className="h-5 w-5 text-[#FF8C42]" />
                <span className="text-sm font-medium text-[#FF8C42]">已通过付费升级</span>
              </div>
            ) : meetsDayRequirement ? (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
                <Rocket className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">已达到升级条件！</span>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    连续打卡 {user.consecutiveDays}/{nextLevel.requiredDays} 天
                  </span>
                  <span className="font-medium text-[#0EA5A0]">{Math.round(progressPercent)}%</span>
                </div>
                <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#0EA5A0] to-[#34D399]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                  {[25, 50, 75].map((m) => (
                    <div
                      key={m}
                      className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-gray-300"
                      style={{ left: `${m}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                  <span>{levelLabels[current]}</span>
                  <span>{levelLabels[nextLevel.level]}</span>
                </div>
              </>
            )}

            {nextLevel.requiredPayment > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgrade(nextLevel.level as 'silver' | 'gold')}
                className="mt-4 w-full rounded-xl bg-[#FF8C42] py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#e07a35]"
              >
                {getUpgradeButtonText()}
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div variants={cardVar} initial="hidden" animate="visible" className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-center gap-2 py-4">
              <Crown className="h-6 w-6 text-[#FFD700]" />
              <span className="text-base font-semibold text-gray-900">您已是最高等级会员</span>
            </div>
          </motion.div>
        )}

        <motion.div variants={cardVar} initial="hidden" animate="visible" className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">权益使用</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0EA5A0]/10">
                <Video className="h-5 w-5 text-[#0EA5A0]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">视频指导</p>
                {isVideoUnlimited ? (
                  <p className="text-xs text-[#0EA5A0] font-medium">无限次</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500">
                      本周已使用 {videoUsed}/{videoLimit} 次
                    </p>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#C0C0C0]"
                        style={{ width: `${(videoUsed / (videoLimit as number)) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0EA5A0]/10">
                <Shield className="h-5 w-5 text-[#0EA5A0]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">优先匹配</p>
              </div>
              {currentConfig.priorityMatching ? (
                <span className="rounded-full bg-[#0EA5A0]/15 px-2.5 py-0.5 text-xs font-medium text-[#0EA5A0]">
                  是
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                  否
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0EA5A0]/10">
                <Sparkles className="h-5 w-5 text-[#0EA5A0]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">AI 动作分析</p>
                {isGold ? (
                  <p className="text-xs text-[#FFD700] font-medium">无限次</p>
                ) : (
                  <p className="text-xs text-gray-500">今日已使用 {aiUsed} 次</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {upgradeNotifications.length > 0 && (
          <motion.div variants={cardVar} initial="hidden" animate="visible" className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-900">升级通知</h2>
            <div className="space-y-2">
              {upgradeNotifications.map((n) => (
                <div key={n.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{n.timestamp}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
