import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, AlertTriangle, Trophy, RotateCcw, Home, ArrowRight, Check } from 'lucide-react'
import { useStore } from '@/store'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

const categoryConfig: Record<string, { label: string; color: string }> = {
  stretch: { label: '拉伸', color: 'bg-[#FF8C42]' },
  strength: { label: '力量', color: 'bg-[#0EA5A0]' },
  mobility: { label: '活动度', color: 'bg-blue-500' },
  balance: { label: '平衡', color: 'bg-purple-500' },
}

function getScoreColor(score: number) {
  if (score < 60) return '#EF4444'
  if (score <= 80) return '#FF8C42'
  return '#34D399'
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = getScoreColor(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={6} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

export default function CheckIn() {
  const { plan, checkIns, completeCheckIn, finishDayTraining, user, getTodayAvgScore, todaysDate } = useStore()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const todayExercises = useMemo(() => plan.exercises, [plan.exercises])
  const total = todayExercises.length
  const completedCount = useMemo(
    () => checkIns.filter((c) => c.date === todaysDate && c.planId === plan.id && c.completed).length,
    [checkIns, todaysDate, plan.id]
  )

  const [currentIdx, setCurrentIdx] = useState(0)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<{ aiScore: number; aiFeedback: string; corrections: string[] } | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const currentExercise = todayExercises[currentIdx]
  const cat = categoryConfig[currentExercise?.category] ?? categoryConfig.strength

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhotoUrl(url)
    setIsAnalyzing(true)
    setAnalysisResult(null)

    setTimeout(() => {
      const result = completeCheckIn(currentExercise.id, url)
      setAnalysisResult(result)
      setIsAnalyzing(false)
    }, 1800)
  }

  const handleRetake = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    setAnalysisResult(null)
    setIsAnalyzing(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleComplete = () => {
    const isLast = currentIdx >= total - 1
    if (isLast) {
      finishDayTraining()
      setShowCelebration(true)
    } else {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
      setPhotoUrl(null)
      setAnalysisResult(null)
      setIsAnalyzing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setCurrentIdx((i) => i + 1)
    }
  }

  if (showCelebration) {
    const avgScore = getTodayAvgScore()
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0EA5A0] to-[#0d9490] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-4 text-6xl"
          >
            🎊
          </motion.div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">恭喜完成今日全部训练</h1>
          <p className="mb-6 text-sm text-gray-500">坚持就是胜利，继续加油！</p>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#0EA5A0]/10 p-4">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-[#FF8C42]" />
              <p className="text-xs text-gray-500">平均得分</p>
              <p className="text-2xl font-bold text-[#0EA5A0]">{avgScore}</p>
            </div>
            <div className="rounded-2xl bg-[#FF8C42]/10 p-4">
              <Check className="mx-auto mb-2 h-8 w-8 text-[#34D399]" />
              <p className="text-xs text-gray-500">连续打卡</p>
              <p className="text-2xl font-bold text-[#FF8C42]">{user.consecutiveDays} 天</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5A0] px-6 py-3.5 text-base font-medium text-white shadow-lg transition-colors hover:bg-[#0d9490]"
          >
            <Home className="h-5 w-5" />
            返回首页仪表盘
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              第 {currentIdx + 1} 项 / 共 {total} 项
            </span>
            <span className="text-xs text-gray-400">
              已完成 {completedCount}/{total}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <motion.div
              className="h-full rounded-full bg-[#0EA5A0]"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIdx + (analysisResult ? 1 : 0)) / total) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0EA5A0]/10">
                <span className="text-base font-bold text-[#0EA5A0]">{currentIdx + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900">{currentExercise.name}</h2>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white',
                      cat.color
                    )}
                  >
                    {cat.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {currentExercise.sets}组 × {currentExercise.reps}次
                </p>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-gray-600">
              {currentExercise.description}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!photoUrl && !isAnalyzing && !analysisResult && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={handleUploadClick}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5A0] px-4 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:bg-[#0d9490] active:scale-[0.98]"
              >
                <Camera className="h-5 w-5" />
                上传动作照片
              </motion.button>
            )}

            {photoUrl && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: '4/3' }}>
                  <img
                    src={photoUrl}
                    alt="动作照片"
                    className="h-full w-full object-cover"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="mb-3 h-12 w-12 rounded-full border-4 border-white/30 border-t-white"
                      />
                      <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-sm font-medium text-white"
                      >
                        AI 分析中...
                      </motion.p>
                    </div>
                  )}
                </div>

                {analysisResult && !isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden rounded-xl bg-gray-50 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <ScoreRing score={analysisResult.aiScore} size={72} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">AI 评分</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                          {analysisResult.aiFeedback}
                        </p>
                      </div>
                    </div>

                    {analysisResult.corrections.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-gray-700">纠正建议</p>
                        {analysisResult.corrections.map((c, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2 rounded-lg bg-white p-3 shadow-sm"
                          >
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF8C42]" />
                            <span className="text-xs text-gray-600">{c}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {!isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3"
                  >
                    <button
                      onClick={handleRetake}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 px-4 py-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      <RotateCcw className="h-4 w-4" />
                      重新拍摄
                    </button>
                    <button
                      onClick={handleComplete}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0EA5A0] px-4 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:bg-[#0d9490] active:scale-[0.98]"
                    >
                      {currentIdx >= total - 1 ? (
                        <>
                          <Trophy className="h-4 w-4" />
                          完成打卡
                        </>
                      ) : (
                        <>
                          完成打卡
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
