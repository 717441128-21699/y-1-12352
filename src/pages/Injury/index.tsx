import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Calendar, FileText, AlertCircle, X, Upload,
  Type, CheckCircle2, FileImage,
} from 'lucide-react'
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

const emptyForm = {
  bodyPart: '',
  injuryDate: '',
  description: '',
  severity: 'mild' as InjuryRecord['severity'],
  diagnosisReport: '',
}

type ReportMode = 'file' | 'text'

type FilePreview =
  | { type: 'image'; base64: string; fileName: string }
  | { type: 'pdf'; base64: string; fileName: string; fileSize: number }

function formatFileSize(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`
}

function parseDiagnosisReport(value: string) {
  if (value.startsWith('FILE_IMAGE:')) {
    const rest = value.slice(11)
    const idx = rest.lastIndexOf('|')
    if (idx === -1) return { type: 'image' as const, base64: rest, fileName: '图片' }
    return { type: 'image' as const, base64: rest.slice(0, idx), fileName: rest.slice(idx + 1) }
  }
  if (value.startsWith('FILE_PDF:')) {
    const rest = value.slice(9)
    const parts = rest.split('|')
    return { type: 'pdf' as const, base64: parts[0], fileName: parts[1] || '文档.pdf', fileSize: parts[2] ? parseInt(parts[2]) : 0 }
  }
  if (value.startsWith('TEXT:')) {
    return { type: 'text' as const, content: value.slice(5) }
  }
  if (value.startsWith('FILE:')) {
    const rest = value.slice(5)
    if (rest.startsWith('data:image')) {
      return { type: 'image' as const, base64: rest, fileName: '图片' }
    }
  }
  return null
}

function PdfModal({ base64, fileName, fileSize, onClose }: {
  base64: string; fileName: string; fileSize: number; onClose: () => void
}) {
  const handleOpen = () => {
    window.open(base64, '_blank')
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-[90%] max-w-md rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">PDF 文档</h3>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="flex flex-col items-center py-8">
          <FileText size={96} style={{ color: '#EF4444' }} />
          <p className="mt-4 text-sm font-medium text-gray-700">{fileName}</p>
          <p className="mt-1 text-xs text-gray-400">{formatFileSize(fileSize)}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpen}
            className="flex-1 rounded-lg py-2 text-sm font-medium text-white"
            style={{ backgroundColor: '#0EA5A0' }}
          >
            下载/打开
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DiagnosisReportDisplay({ value }: { value: string }) {
  const [expanded, setExpanded] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)

  const parsed = parseDiagnosisReport(value)

  if (!parsed) {
    return (
      <div className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium" style={{ backgroundColor: '#FFF3E0', color: '#FF8C42' }}>
        <FileText size={12} />
        {value.length > 30 ? value.slice(0, 30) + '...' : value}
      </div>
    )
  }

  if (parsed.type === 'image') {
    return (
      <div className="mt-2 flex items-center gap-2">
        <img
          src={parsed.base64}
          alt={parsed.fileName || '诊断报告'}
          className="w-20 cursor-pointer rounded-lg border border-gray-200 object-cover transition hover:opacity-80"
          onClick={() => window.open(parsed.base64, '_blank')}
        />
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium" style={{ backgroundColor: '#CCFBF1', color: '#0EA5A0' }}>
          <FileImage size={12} />
          图片报告
        </span>
      </div>
    )
  }

  if (parsed.type === 'pdf') {
    return (
      <>
        <div className="mt-2 flex items-center gap-3">
          <FileText size={32} style={{ color: '#EF4444' }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700">{parsed.fileName}</p>
            <p className="text-xs text-gray-400">{formatFileSize(parsed.fileSize)}</p>
          </div>
          <button
            onClick={() => setShowPdfModal(true)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: '#0EA5A0' }}
          >
            查看 PDF
          </button>
        </div>
        <AnimatePresence>
          {showPdfModal && (
            <PdfModal
              base64={parsed.base64}
              fileName={parsed.fileName}
              fileSize={parsed.fileSize}
              onClose={() => setShowPdfModal(false)}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  if (parsed.type === 'text') {
    const text = parsed.content
    const showExpand = text.length > 80
    const displayText = expanded || !showExpand ? text : text.slice(0, 80) + '...'

    return (
      <div
        className="mt-2 cursor-pointer rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-600 transition hover:bg-gray-100"
        onClick={() => setExpanded(!expanded)}
      >
        {displayText}
        {showExpand && (
          <span className="ml-1 text-xs font-medium" style={{ color: '#0EA5A0' }}>
            {expanded ? '收起' : '展开'}
          </span>
        )}
      </div>
    )
  }

  return null
}

export default function Injury() {
  const { injuries, addInjury, fileToBase64 } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [reportMode, setReportMode] = useState<ReportMode>('file')
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [converting, setConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setConverting(true)
    try {
      const base64 = await fileToBase64(file)
      let preview: FilePreview
      let diagnosisValue: string

      if (file.type.startsWith('image/')) {
        preview = { type: 'image', base64, fileName: file.name }
        diagnosisValue = `FILE_IMAGE:${base64}|${file.name}`
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        preview = { type: 'pdf', base64, fileName: file.name, fileSize: file.size }
        diagnosisValue = `FILE_PDF:${base64}|${file.name}|${file.size}`
      } else {
        setConverting(false)
        return
      }

      setFilePreview(preview)
      setForm({ ...form, diagnosisReport: diagnosisValue })
    } finally {
      setConverting(false)
    }
  }

  const removeFile = () => {
    setFilePreview(null)
    setForm({ ...form, diagnosisReport: '' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = () => {
    if (!form.bodyPart || !form.injuryDate || !form.description) return

    let diagnosisValue: string | undefined
    if (reportMode === 'file' && filePreview) {
      if (filePreview.type === 'image') {
        diagnosisValue = `FILE_IMAGE:${filePreview.base64}|${filePreview.fileName}`
      } else {
        diagnosisValue = `FILE_PDF:${filePreview.base64}|${filePreview.fileName}|${filePreview.fileSize}`
      }
    } else if (reportMode === 'text' && form.diagnosisReport.trim()) {
      const content = form.diagnosisReport.startsWith('TEXT:')
        ? form.diagnosisReport.slice(5)
        : form.diagnosisReport.trim()
      if (content) diagnosisValue = `TEXT:${content}`
    }

    addInjury({
      id: crypto.randomUUID(),
      userId: 'u001',
      bodyPart: form.bodyPart,
      injuryDate: form.injuryDate,
      description: form.description,
      severity: form.severity,
      diagnosisReport: diagnosisValue,
      createdAt: new Date().toISOString(),
    })

    setForm(emptyForm)
    setFilePreview(null)
    setReportMode('file')
    setShowForm(false)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  const handleCancel = () => {
    setFilePreview(null)
    setForm(emptyForm)
    setReportMode('file')
    setShowForm(false)
  }

  const renderPreview = () => {
    if (!filePreview) return null

    if (filePreview.type === 'image') {
      return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <img
            src={filePreview.base64}
            alt="预览"
            className="h-[120px] rounded-lg border border-gray-200 object-cover"
          />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FileImage size={16} className="flex-shrink-0 text-gray-400" />
            <span className="truncate text-sm text-gray-600">{filePreview.fileName}</span>
          </div>
          <button
            onClick={removeFile}
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <FileText size={48} style={{ color: '#EF4444' }} className="flex-shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="truncate text-sm text-gray-600">{filePreview.fileName}</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
              PDF 文档
            </span>
            <span className="text-xs text-gray-400">{formatFileSize(filePreview.fileSize)}</span>
          </div>
        </div>
        <button
          onClick={removeFile}
          className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
    )
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
          {showToast && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl px-5 py-3 shadow-lg"
              style={{ backgroundColor: '#10B981', color: 'white' }}
            >
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">新伤病记录已添加，系统已自动生成康复计划</span>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <div className="mb-2 flex gap-2">
                    <button
                      onClick={() => setReportMode('file')}
                      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        reportMode === 'file'
                          ? 'text-white'
                          : 'border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                      style={reportMode === 'file' ? { backgroundColor: '#0EA5A0' } : {}}
                    >
                      <Upload size={12} />上传文件
                    </button>
                    <button
                      onClick={() => setReportMode('text')}
                      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        reportMode === 'text'
                          ? 'text-white'
                          : 'border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }`}
                      style={reportMode === 'text' ? { backgroundColor: '#0EA5A0' } : {}}
                    >
                      <Type size={12} />输入内容
                    </button>
                  </div>

                  {reportMode === 'file' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {converting ? (
                        <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-6 text-gray-400">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#0EA5A0]" />
                          <span className="ml-2 text-sm">处理中...</span>
                        </div>
                      ) : filePreview ? (
                        renderPreview()
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-6 text-gray-400 transition hover:border-[#0EA5A0] hover:text-[#0EA5A0]"
                        >
                          <Upload size={20} className="mr-2" />
                          <span className="text-sm">点击或拖拽上传诊断报告</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={form.diagnosisReport.startsWith('TEXT:') ? form.diagnosisReport.slice(5) : form.diagnosisReport}
                        onChange={(e) => setForm({ ...form, diagnosisReport: e.target.value })}
                        rows={4}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0EA5A0] focus:outline-none"
                        placeholder="请输入或粘贴诊断报告内容..."
                      />
                    </div>
                  )}
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
                    onClick={handleCancel}
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
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{injury.description}</p>
                  {injury.diagnosisReport && (
                    <DiagnosisReportDisplay value={injury.diagnosisReport} />
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
