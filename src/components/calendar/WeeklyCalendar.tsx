import { useState } from 'react'
import { useBookings } from '../../contexts/BookingsContext'
import BookingCard from '../bookings/BookingCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  isSameDay, isToday, startOfMonth,
  addMonths, subMonths, isSameMonth,
  startOfDay, endOfDay, eachDayOfInterval,
} from 'date-fns'
import { he } from 'date-fns/locale'
import { Booking, ActivePage } from '../../types'

type CalView = 'day' | 'week' | 'month'

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06:00–23:00
const HOUR_H = 60 // px per hour
const DAY_START = 6 // first visible hour

function getUserColor(b: Booking): string {
  return b.profiles?.color ?? '#7C6FF7'
}

function overlapsDay(b: Booking, day: Date): boolean {
  return new Date(b.start_time) < endOfDay(day) && new Date(b.end_time) > startOfDay(day)
}

function getTimeSlot(b: Booking, day: Date): { top: number; height: number } {
  const bStart = new Date(b.start_time)
  const bEnd = new Date(b.end_time)
  const effStart = bStart < startOfDay(day) ? startOfDay(day) : bStart
  const effEnd = bEnd > endOfDay(day) ? endOfDay(day) : bEnd
  const startH = effStart.getHours() + effStart.getMinutes() / 60
  const endH = effEnd.getHours() + effEnd.getMinutes() / 60
  const cStart = Math.max(startH, DAY_START)
  const cEnd = Math.min(endH, DAY_START + HOURS.length)
  return {
    top: (cStart - DAY_START) * HOUR_H,
    height: Math.max((cEnd - cStart) * HOUR_H, 40),
  }
}

interface Props {
  onNavigate: (page: ActivePage) => void
}

export default function WeeklyCalendar({ onNavigate }: Props) {
  const { bookings, loading } = useBookings()
  const [view, setView] = useState<CalView>('week')
  const [anchor, setAnchor] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(new Date())

  const approved = bookings.filter(b => b.status === 'approved')

  function prev() {
    if (view === 'day') setAnchor(d => addDays(d, -1))
    else if (view === 'week') setAnchor(d => subWeeks(d, 1))
    else setAnchor(d => subMonths(d, 1))
  }
  function next() {
    if (view === 'day') setAnchor(d => addDays(d, 1))
    else if (view === 'week') setAnchor(d => addWeeks(d, 1))
    else setAnchor(d => addMonths(d, 1))
  }
  function goToday() {
    const today = new Date()
    setAnchor(today)
    setSelected(today)
  }

  function changeView(v: CalView) {
    if (v === 'day' && selected) setAnchor(selected)
    setView(v)
  }

  function headerLabel(): string {
    if (view === 'day') return format(anchor, 'EEEE, d בMMMM', { locale: he })
    if (view === 'week') {
      const ws = startOfWeek(anchor, { weekStartsOn: 0 })
      const we = addDays(ws, 6)
      if (ws.getMonth() === we.getMonth())
        return `${format(ws, 'd')}–${format(we, 'd MMMM', { locale: he })}`
      return `${format(ws, 'd MMM', { locale: he })} – ${format(we, 'd MMM', { locale: he })}`
    }
    return format(anchor, 'MMMM yyyy', { locale: he })
  }

  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const calStart = startOfWeek(startOfMonth(anchor), { weekStartsOn: 0 })
  const monthDates = eachDayOfInterval({ start: calStart, end: addDays(calStart, 41) })

  function selectDay(day: Date) {
    setSelected(s => (s && isSameDay(s, day) ? null : day))
  }

  const selectedBookings = selected
    ? bookings
        .filter(b => isSameDay(new Date(b.start_time), selected))
        .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))
    : []

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ===== HEADER ===== */}
      <div className="bg-white shadow-card px-4 pt-14 pb-3 z-10">

        {/* Nav row — RTL: first child = right = prev, last child = left = next */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prev}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-background active:bg-border transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7068" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <button onClick={goToday} className="flex flex-col items-center px-2">
            <span className="text-base font-extrabold text-textBase leading-snug">
              {headerLabel()}
            </span>
            <span className="text-[10px] text-textMuted font-medium mt-0.5">לחץ לחזרה להיום</span>
          </button>

          <button
            onClick={next}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-background active:bg-border transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7068" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* View switcher */}
        <div className="flex bg-background rounded-2xl p-1 gap-1 mb-2">
          {(['day', 'week', 'month'] as const).map(v => (
            <button
              key={v}
              onClick={() => changeView(v)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all duration-150
                ${view === v ? 'bg-white text-primary-600 shadow-sm' : 'text-textMuted hover:text-textBase'}`}
            >
              {v === 'day' ? 'יומי' : v === 'week' ? 'שבועי' : 'חודשי'}
            </button>
          ))}
        </div>

        {/* Day-name headers — shown for week + month */}
        {view !== 'day' && (
          <div className="grid grid-cols-7">
            {DAY_NAMES.map((n, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-textMuted py-1">{n}</div>
            ))}
          </div>
        )}

        {/* Week-view day-selector row */}
        {view === 'week' && (
          <div className="grid grid-cols-7 gap-0.5">
            {weekDays.map((day, i) => {
              const sel = selected ? isSameDay(day, selected) : false
              const today = isToday(day)
              const dots = approved.filter(b => overlapsDay(b, day)).slice(0, 3)
              return (
                <button
                  key={i}
                  onClick={() => selectDay(day)}
                  className={`flex flex-col items-center py-2 rounded-2xl transition-all duration-150 active:scale-95
                    ${sel ? 'bg-primary-500' : today ? 'bg-primary-50 ring-1 ring-primary-200' : 'hover:bg-background'}`}
                >
                  <span className={`text-sm font-bold leading-none
                    ${sel ? 'text-white' : today ? 'text-primary-600' : 'text-textBase'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex gap-0.5 mt-1.5 h-1.5">
                    {dots.map(b => (
                      <span
                        key={b.id}
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sel ? 'rgba(255,255,255,0.75)' : getUserColor(b) }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== BODY ===== */}
      <div className="flex-1 overflow-y-auto scroll-container">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : view === 'day' ? (
          <DayBody
            day={anchor}
            approved={approved.filter(b => overlapsDay(b, anchor))}
            allBookings={bookings}
          />
        ) : view === 'week' ? (
          <DayDetailPanel
            selected={selected}
            selectedBookings={selectedBookings}
            onNavigate={onNavigate}
          />
        ) : (
          <MonthBody
            monthDates={monthDates}
            anchor={anchor}
            approved={approved}
            selected={selected}
            onSelect={selectDay}
            selectedBookings={selectedBookings}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => onNavigate('new-booking')}
        className="fixed bottom-24 left-4 w-14 h-14 btn-primary text-white rounded-full flex items-center justify-center z-40"
        aria-label="הוסף הזמנה חדשה"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

/* ─────────────────── DAY VIEW ─────────────────── */

function DayBody({
  day,
  approved,
  allBookings,
}: {
  day: Date
  approved: Booking[]
  allBookings: Booking[]
}) {
  const dayBookings = allBookings
    .filter(b => isSameDay(new Date(b.start_time), day))
    .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))

  const now = new Date()
  const nowH = now.getHours() + now.getMinutes() / 60
  const showNowLine = isToday(day) && nowH >= DAY_START && nowH <= DAY_START + HOURS.length

  return (
    <div className="pb-28">
      {/* Timeline — use LTR so time labels are always on the left */}
      <div className="flex" dir="ltr">
        {/* Hour labels */}
        <div className="w-14 flex-shrink-0 select-none">
          {HOURS.map(h => (
            <div
              key={h}
              className="flex items-start justify-end pr-2 text-[10px] font-semibold text-textMuted"
              style={{ height: HOUR_H }}
            >
              <span className="-mt-2">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Grid + events */}
        <div className="flex-1 relative border-r border-border" style={{ height: HOURS.length * HOUR_H }}>
          {/* Hour lines */}
          {HOURS.map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-border/50"
              style={{ top: i * HOUR_H }}
            />
          ))}
          {/* Half-hour dashed lines */}
          {HOURS.map((_, i) => (
            <div
              key={`h${i}`}
              className="absolute left-0 right-0 border-t border-dashed border-border/25"
              style={{ top: i * HOUR_H + HOUR_H / 2 }}
            />
          ))}

          {/* Approved booking blocks */}
          {approved.map(b => {
            const { top, height } = getTimeSlot(b, day)
            const color = getUserColor(b)
            return (
              <div
                key={b.id}
                className="absolute left-1 right-1 rounded-xl px-2 py-1 overflow-hidden"
                style={{
                  top,
                  height,
                  backgroundColor: color + '22',
                  borderRight: `3px solid ${color}`,
                }}
              >
                <p
                  className="text-[11px] font-bold leading-tight truncate"
                  style={{ color }}
                >
                  {b.profiles?.avatar_emoji} {b.title}
                </p>
                {height >= 48 && (
                  <p className="text-[10px] mt-0.5 opacity-75" style={{ color }}>
                    {format(new Date(b.start_time), 'HH:mm')}–{format(new Date(b.end_time), 'HH:mm')}
                  </p>
                )}
              </div>
            )
          })}

          {/* Current-time line */}
          {showNowLine && (
            <div
              className="absolute left-0 right-0 flex items-center pointer-events-none"
              style={{ top: (nowH - DAY_START) * HOUR_H }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-primary-500 -ml-1.5 flex-shrink-0" />
              <div className="flex-1 border-t-2 border-primary-500" />
            </div>
          )}
        </div>
      </div>

      {/* All bookings list for this day (all statuses) */}
      {dayBookings.length > 0 && (
        <div className="px-4 pt-5 space-y-3" dir="rtl">
          <h3 className="font-bold text-textBase text-sm">כל הבקשות ליום זה</h3>
          {dayBookings.map(b => <BookingCard key={b.id} booking={b} />)}
        </div>
      )}

      {dayBookings.length === 0 && approved.length === 0 && (
        <div className="flex flex-col items-center py-10 text-textMuted" dir="rtl">
          <span className="text-3xl mb-2">🚗</span>
          <p className="text-sm font-semibold">הרכב פנוי ביום זה</p>
        </div>
      )}
    </div>
  )
}

/* ─────────────────── WEEK DETAIL PANEL ─────────────────── */

function DayDetailPanel({
  selected,
  selectedBookings,
  onNavigate,
}: {
  selected: Date | null
  selectedBookings: Booking[]
  onNavigate: (page: ActivePage) => void
}) {
  if (!selected) {
    return (
      <div className="flex flex-col items-center py-14 text-textMuted text-sm font-medium">
        <span className="text-3xl mb-3">👆</span>
        בחר יום לצפייה בבקשות
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-28 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-textBase text-base">
          {format(selected, 'EEEE, d בMMMM', { locale: he })}
        </h2>
        {isToday(selected) && (
          <span className="bg-primary-100 text-primary-700 text-[11px] px-2.5 py-1 rounded-full font-bold">היום</span>
        )}
      </div>

      {selectedBookings.length === 0 ? (
        <div className="flex flex-col items-center py-14">
          <div className="w-20 h-20 bg-background rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-card">🚗</div>
          <p className="text-textMuted font-semibold text-sm">הרכב פנוי ביום זה</p>
          <button
            onClick={() => onNavigate('new-booking')}
            className="mt-4 text-primary-600 text-sm font-bold hover:text-primary-700 transition-colors flex items-center gap-1"
          >
            <span className="text-lg leading-none">+</span> הוסף בקשה
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {selectedBookings.map(b => <BookingCard key={b.id} booking={b} />)}
        </div>
      )}
    </div>
  )
}

/* ─────────────────── MONTH VIEW ─────────────────── */

function MonthBody({
  monthDates,
  anchor,
  approved,
  selected,
  onSelect,
  selectedBookings,
  onNavigate,
}: {
  monthDates: Date[]
  anchor: Date
  approved: Booking[]
  selected: Date | null
  onSelect: (day: Date) => void
  selectedBookings: Booking[]
  onNavigate: (page: ActivePage) => void
}) {
  return (
    <div className="pb-28" dir="rtl">
      {/* 6×7 grid */}
      <div className="grid grid-cols-7 gap-px bg-border mx-4 mt-2 rounded-2xl overflow-hidden border border-border">
        {monthDates.map((day, i) => {
          const inMonth = isSameMonth(day, anchor)
          const sel = selected ? isSameDay(day, selected) : false
          const today = isToday(day)
          const dayApproved = approved.filter(b => overlapsDay(b, day))

          return (
            <button
              key={i}
              onClick={() => onSelect(day)}
              className={`bg-white flex flex-col items-center pt-1.5 pb-1 px-0.5 min-h-[56px] transition-colors duration-100
                ${sel ? 'bg-primary-50' : 'active:bg-background'}`}
            >
              <span
                className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 flex-shrink-0
                  ${today
                    ? 'bg-primary-500 text-white'
                    : sel
                    ? 'bg-primary-100 text-primary-700'
                    : inMonth
                    ? 'text-textBase'
                    : 'text-border'}`}
              >
                {format(day, 'd')}
              </span>

              {/* Colored event bars */}
              <div className="flex flex-col gap-px w-full px-0.5 flex-1">
                {dayApproved.slice(0, 2).map(b => (
                  <div
                    key={b.id}
                    className="w-full rounded-sm"
                    style={{ height: 4, backgroundColor: getUserColor(b) }}
                  />
                ))}
                {dayApproved.length > 2 && (
                  <span className="text-[8px] text-textMuted font-semibold text-center leading-none mt-0.5">
                    +{dayApproved.length - 2}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Day detail panel */}
      {selected && (
        <div className="px-4 pt-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-textBase text-base">
              {format(selected, 'EEEE, d בMMMM', { locale: he })}
            </h2>
            {isToday(selected) && (
              <span className="bg-primary-100 text-primary-700 text-[11px] px-2.5 py-1 rounded-full font-bold">היום</span>
            )}
          </div>

          {selectedBookings.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 bg-background rounded-3xl flex items-center justify-center text-3xl mb-3 shadow-card">🚗</div>
              <p className="text-textMuted font-semibold text-sm">הרכב פנוי ביום זה</p>
              <button
                onClick={() => onNavigate('new-booking')}
                className="mt-3 text-primary-600 text-sm font-bold hover:text-primary-700 transition-colors flex items-center gap-1"
              >
                <span className="text-lg leading-none">+</span> הוסף בקשה
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedBookings.map(b => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
