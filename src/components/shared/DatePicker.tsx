import { useState, useRef, useEffect } from 'react'

const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
const DAYS   = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳']

const pad = (n: number) => String(n).padStart(2, '0')

function displayDate(val: string) {
  const [y, m, d] = val.split('-').map(Number)
  return `${d} ב${MONTHS[m - 1]} ${y}`
}

interface Props {
  value: string
  onChange: (v: string) => void
  min?: string
  className?: string
}

export default function DatePicker({ value, onChange, min, className = '' }: Props) {
  const today = new Date()
  const [open, setOpen]  = useState(false)
  const [vy,   setVy]    = useState(() => value ? +value.slice(0, 4)     : today.getFullYear())
  const [vm,   setVm]    = useState(() => value ? +value.slice(5, 7) - 1 : today.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  function prev() { vm === 0  ? (setVm(11), setVy(y => y - 1)) : setVm(m => m - 1) }
  function next() { vm === 11 ? (setVm(0),  setVy(y => y + 1)) : setVm(m => m + 1) }

  function pick(day: number) {
    onChange(`${vy}-${pad(vm + 1)}-${pad(day)}`)
    setOpen(false)
  }

  function goToday() {
    const t = today
    onChange(`${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`)
    setVy(t.getFullYear())
    setVm(t.getMonth())
    setOpen(false)
  }

  const firstDow    = new Date(vy, vm, 1).getDay()
  const daysInMonth = new Date(vy, vm + 1, 0).getDate()
  const cell        = (day: number) => `${vy}-${pad(vm + 1)}-${pad(day)}`
  const isSel       = (day: number) => value === cell(day)
  const isNow       = (day: number) => today.getFullYear() === vy && today.getMonth() === vm && today.getDate() === day
  const isDis       = (day: number) => !!min && cell(day) < min

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-field flex items-center justify-between gap-2 cursor-pointer"
      >
        <span className={value ? 'text-textBase' : 'text-textMuted'}>
          {value ? displayDate(value) : 'בחר תאריך'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-textMuted shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && (
        <div
          dir="ltr"
          className="absolute z-50 bg-white rounded-2xl shadow-lg border border-[#E8E3D8] p-4 mt-1 animate-scale-in"
          style={{ width: '17rem', right: 0 }}
        >
          {/* Month / year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prev} className="p-1 rounded-lg hover:bg-[#F5F3EE] text-textMuted transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="font-bold text-sm text-textBase">{MONTHS[vm]} {vy}</span>
            <button type="button" onClick={next} className="p-1 rounded-lg hover:bg-[#F5F3EE] text-textMuted transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-textMuted py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <div key={day} className="flex items-center justify-center">
                <button
                  type="button"
                  disabled={isDis(day)}
                  onClick={() => pick(day)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    isSel(day) ? 'bg-primary-500 text-white' :
                    isNow(day) ? 'border-2 border-primary-400 text-primary-600' :
                    isDis(day) ? 'text-gray-300 cursor-not-allowed' :
                                 'hover:bg-primary-50 text-textBase'
                  }`}
                >
                  {day}
                </button>
              </div>
            ))}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-3 border-t border-[#E8E3D8] flex justify-center">
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors"
            >
              היום
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
