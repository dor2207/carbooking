import { useState, useRef, useEffect } from 'react'

const pad     = (n: number) => String(n).padStart(2, '0')
const HOURS   = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

function parseRaw(raw: string): { h: number; m: number } | null {
  const noColon = raw.replace(':', '')
  if (/^\d{3,4}$/.test(noColon)) {
    const h = parseInt(noColon.slice(0, -2))
    const m = parseInt(noColon.slice(-2))
    if (h <= 23 && m <= 59) return { h, m }
  }
  if (/^\d{1,2}$/.test(raw)) {
    const h = parseInt(raw)
    if (h <= 23) return { h, m: 0 }
  }
  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (match) {
    const h = parseInt(match[1]), m = parseInt(match[2])
    if (h <= 23 && m <= 59) return { h, m }
  }
  return null
}

interface Props {
  value: string // "HH:MM"
  onChange: (v: string) => void
  className?: string
}

export default function TimePicker({ value, onChange, className = '' }: Props) {
  const [open,     setOpen]     = useState(false)
  const [inputVal, setInputVal] = useState(value)
  const ref     = useRef<HTMLDivElement>(null)
  const hourRef = useRef<HTMLDivElement>(null)
  const minRef  = useRef<HTMLDivElement>(null)

  // Keep typed input in sync when picker scroll changes the value
  useEffect(() => { setInputVal(value) }, [value])

  const parts = value ? value.split(':').map(Number) : [0, 0]
  const h = parts[0] ?? 0
  const m = parts[1] ?? 0

  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      ;(hourRef.current?.children[h] as HTMLElement | undefined)?.scrollIntoView({ block: 'center', behavior: 'instant' })
      ;(minRef.current?.children[m]  as HTMLElement | undefined)?.scrollIntoView({ block: 'center', behavior: 'instant' })
    })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const setHour = (hour: number) => onChange(`${pad(hour)}:${pad(m)}`)
  const setMin  = (min: number)  => onChange(`${pad(h)}:${pad(min)}`)

  function handleType(raw: string) {
    setInputVal(raw)
    const parsed = parseRaw(raw)
    if (parsed) onChange(`${pad(parsed.h)}:${pad(parsed.m)}`)
  }

  function handleBlur() {
    const parsed = parseRaw(inputVal)
    if (parsed) {
      const formatted = `${pad(parsed.h)}:${pad(parsed.m)}`
      onChange(formatted)
      setInputVal(formatted)
    } else {
      setInputVal(value) // revert to last valid
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger: editable text + clock icon */}
      <div
        dir="ltr"
        className="flex items-center bg-[#F5F3EE] border border-[#E8E3D8] rounded-2xl overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-primary-300 focus-within:border-primary-400 focus-within:bg-white"
      >
        <input
          type="text"
          value={inputVal}
          onChange={e => handleType(e.target.value)}
          onBlur={handleBlur}
          placeholder="00:00"
          maxLength={5}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-center font-semibold tabular-nums text-textBase text-sm px-2 py-3"
        />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="px-2.5 py-3 border-l border-[#E8E3D8] text-textMuted hover:text-primary-500 hover:bg-primary-50 transition-colors"
          tabIndex={-1}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          dir="ltr"
          className="absolute z-50 bg-white rounded-2xl shadow-lg border border-[#E8E3D8] p-3 mt-1 flex gap-2 items-start animate-scale-in"
          style={{ right: 0 }}
        >
          {/* Hours 00-23 */}
          <div
            ref={hourRef}
            className="h-44 overflow-y-auto w-14 rounded-xl"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {HOURS.map(hour => (
              <button
                key={hour}
                type="button"
                onClick={() => setHour(hour)}
                className={`w-full py-1.5 text-sm font-semibold rounded-lg text-center transition-colors ${
                  hour === h ? 'bg-primary-500 text-white' : 'text-textBase hover:bg-primary-50'
                }`}
              >
                {pad(hour)}
              </button>
            ))}
          </div>

          <div className="flex items-center self-center text-textMuted font-bold text-lg leading-none">:</div>

          {/* Minutes 00-59 */}
          <div
            ref={minRef}
            className="h-44 overflow-y-auto w-14 rounded-xl"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {MINUTES.map(min => (
              <button
                key={min}
                type="button"
                onClick={() => setMin(min)}
                className={`w-full py-1.5 text-sm font-semibold rounded-lg text-center transition-colors ${
                  min === m ? 'bg-primary-500 text-white' : 'text-textBase hover:bg-primary-50'
                }`}
              >
                {pad(min)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
