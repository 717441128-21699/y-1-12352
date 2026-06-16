import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar, FileText, AlertCircle, X, Upload } from 'lucide-react'
import { useStore } from '@/store'
import type { InjuryRecord } from '@/types'

const BODY_PARTS = ['膝关节', '踝关节', '肩关节', '腰椎', '颈椎', '髋关节', '腕关节']
const SEVERITY_OPTIONS = [
  { key: 'mild' as const, label: '轻度', color: 'bg-green-100 text-green-700 border-green-300' },
  { key: 'moderate' as const, label: '中度', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { key: 'severe' as const, label: '重度', color: 'bg-red-100 text-red-700 border-red-300' },
]

const SEVERITY_DOT = { mild: 'bg-green-500', moderate: 'bg-yellow-500', severe: 'bg-red-500' }
const SEVERITY_BADGE = {
  mild: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  severe: 'bg-red-100 text-red-700',
}
const SEVERITY_LABEL = { mild: '轻度', moderate: '中度', severe: '重度' }

const emptyForm = { bodyPart: '', injuryDate: '', description: '', severity: 'mild' as InjuryRecord['severity'], diagnosisReport: '' }

export default function Injury() {
  const { injuries, addInjury } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const handleSubmit = () => {
    if (!form.bodyPart || !form.injuryDate || !form.description) return
    addInjury({
      id: crypto.randomUUID(),
      userId: '1',
      bodyPart: form.bodyPart,
      injuryDate: form.injuryDate,
      description: form.description,
      severity: form.severity,
      diagnosisReport: form.diagnosisReport || undefined,
      createdAt: new Date().toISOString(),
    })
    setForm(emptyForm)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">伤病史记录</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: showForm ? '#FF8C42' : '#0EA5A0' }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? '取消' : '添加伤病史'}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden rounded-xl bg-white p-5 shadow-sm"
            >
              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">受伤部位</label>
                  <select
                    value={form.bodyPart}
                    onChange={(e) => setForm({ ...form, bodyPart: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0EA5A0] focus:outline-none"
                  >
                    <option value="">请选择部位</option>
                    {BODY_PARTS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">受伤日期</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={form.injuryDate}
                      onChange={(e) => setForm({ ...form, injuryDate: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-[#0EA5A0] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">伤情描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0EA5A0] focus:outline-none"
                    placeholder="请描述受伤经过和症状"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">严重程度</label>
                  <div className="flex gap-2">
                    {SEVERITY_OPTIONS.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setForm({ ...form, severity: s.key })}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          form.severity === s.key ? s.color : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">诊断报告</label>
                  <div className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-6 text-gray-400 transition hover:border-[#0EA5A0] hover:text-[#0EA5A0]">
                    <Upload size={20} className="mr-2" />
                    <span className="text-sm">点击或拖拽上传诊断报告</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 rounded-lg py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: '#0EA5A0' }}
                  >
                    保存记录
                  </button>
                  <button
                    onClick={() => { setForm(emptyForm); setShowForm(false) }}
                    className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {injuries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <AlertCircle size={48} strokeWidth={1.5} />
            <p className="mt-3 text-sm">暂无伤病史记录</p>
            <p className="mt-1 text-xs text-gray-300">点击右上角按钮添加您的第一条伤病史</p>
          </div>
        ) : (
          <div className="relative ml-3 border-l-2 border-gray-200 pl-6">
            {injuries.map((injury, i) => (
              <motion.div
                key={injury.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="relative mb-6"
              >
                <div className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white ${SEVERITY_DOT[injury.severity]}`} />
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-800">{injury.bodyPart}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[injury.severity]}`}>
                      {SEVERITY_LABEL[injury.severity]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={12} />
                    <span>{injury.injuryDate}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{injury.description}</p>
                  {injury.diagnosisReport && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium" style={{ backgroundColor: '#FFF3E0', color: '#FF8C42' }}>
                      <FileText size={12} />
                      {injury.diagnosisReport}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
