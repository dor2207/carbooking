import { useState, FormEvent } from 'react'
import { useBookings } from '../../contexts/BookingsContext'
import { ActivePage } from '../../types'
import DatePicker from '../shared/DatePicker'
import TimePicker from '../shared/TimePicker'

interface Props {
  onNavigate: (page: ActivePage) => void
  initialDate?: Date
}

const pad = (n: number) => String(n).padStart(2, '0')

function splitDateTime(d: Date) {
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`)
}

export default function NewBookingPage({ onNavigate, initialDate }: Props) {
  const { createBooking, bookings } = useBookings()
  const now   = initialDate ?? new Date()
  const later = new Date(now.getTime() + 60 * 60 * 1000)

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [startDate,   setStartDate]   = useState(splitDateTime(now).date)
  const [startTime,   setStartTime]   = useState(splitDateTime(now).time)
  const [endDate,     setEndDate]     = useState(splitDateTime(later).date)
  const [endTime,     setEndTime]     = useState(splitDateTime(later).time)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  function checkOverlap(start: Date, end: Date) {
    return bookings.some(b => {
      if (b.status !== 'approved') return false
      const bs = new Date(b.start_time)
      const be = new Date(b.end_time)
      return start < be && end > bs
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const start = combineDateTime(startDate, startTime)
    const end   = combineDateTime(endDate, endTime)

    if (end <= start)      { setError('שעת הסיום חייבת להיות אחרי שעת ההתחלה'); return }
    if (start < new Date()) { setError('לא ניתן להזמין בתאריך שעבר'); return }
    if (checkOverlap(start, end)) {
      setError('קיימת חפיפה עם הזמנה מאושרת אחרת בטווח זמן זה')
      return
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setError('יש למלא תאריך ושעה')
      return
    }

    setLoading(true)
    const { error } = await createBooking({
      title:       title.trim(),
      description: description.trim() || undefined,
      start_time:  start.toISOString(),
      end_time:    end.toISOString(),
    })
    setLoading(false)

    if (error) {
      setError('שגיאה בשליחת הבקשה, נסה שוב')
    } else {
      onNavigate('my-bookings')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-container bg-background pb-28">
      {/* Page header */}
      <div className="bg-white px-5 pt-14 pb-5 shadow-card mb-1">
        <h1 className="text-2xl font-extrabold text-textBase tracking-tight">בקשה חדשה</h1>
        <p className="text-sm text-textMuted mt-1 font-medium">מלא את הפרטים ושלח לאישור המנהל</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {/* Details card */}
        <div className="card p-5 space-y-4">
          <h2 className="text-xs font-bold text-textMuted uppercase tracking-widest">פרטי הבקשה</h2>

          <div>
            <label className="block text-sm font-semibold text-textBase mb-1.5">
              כותרת <span className="text-rejected-DEFAULT">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="למשל: נסיעה לים, קניות, עבודה..."
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-textBase mb-1.5">
              תיאור <span className="text-textMuted font-normal text-xs">(אופציונלי)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="פרטים נוספים..."
              rows={2}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Time card */}
        <div className="card p-5 space-y-4">
          <h2 className="text-xs font-bold text-textMuted uppercase tracking-widest">זמן השימוש</h2>

          <div>
            <label className="block text-sm font-semibold text-textBase mb-1.5">תחילת השימוש</label>
            <div className="flex gap-2">
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                min={new Date().toISOString().slice(0, 10)}
                className="flex-1"
              />
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                className="w-28"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-textBase mb-1.5">סיום השימוש</label>
            <div className="flex gap-2">
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                min={startDate || new Date().toISOString().slice(0, 10)}
                className="flex-1"
              />
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                className="w-28"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rejected-light border border-rejected-border text-rejected-text text-sm px-4 py-3 rounded-2xl flex items-center gap-2 animate-scale-in">
            <span className="flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Info note */}
        <div className="flex items-start gap-3 bg-primary-50 border border-primary-100 rounded-2xl p-4">
          <span className="text-primary-500 mt-0.5 flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </span>
          <p className="text-xs text-primary-700 font-medium leading-relaxed">
            הבקשה תישלח למנהל לאישור. תקבל עדכון בזמן אמת.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full btn-primary text-white py-4 rounded-2xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
              <span>שולח...</span>
            </span>
          ) : 'שלח בקשה'}
        </button>
      </form>
    </div>
  )
}
