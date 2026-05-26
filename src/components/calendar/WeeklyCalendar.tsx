import { useState } from 'react'
import { useBookings } from '../../contexts/BookingsContext'
import { useAuth } from '../../contexts/AuthContext'
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
const HOUR_H = 56 // px per hour
const DAY_START = 6

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
    height: Math.max((cEnd - cStart) * HOUR_H, 36),
  }
}

/* ─────────────────── BOOKING DETAIL SHEET ─────────────────── */

const STATUS_LABEL: Record<string, string> = {
  pending:   'ממתין לאישור',
  approved:  'מאושר',
  rejected:  'נדחה',
  cancelled: 'בוטל',
}
const STATUS_PILL: Record<string, string> = {
  pending:   'bg-pending-light text-pending-text border border-pending-border',
  approved:  'bg-approved-light text-approved-text border border-approved-border',
  rejected:  'bg-rejected-light text-rejected-text border border-rejected-border',
  cancelled: 'bg-gray-100 text-gray-400 border border-gray-200',
}

function BookingDetailSheet({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { user, profile } = useAuth()
  const { cancelBooking } = useBookings()
  const [cancelling, setCancelling] = useState(false)

  const canCancel =
    booking.status === 'approved' &&
    (user?.id === booking.user_id || profile?.role === 'admin')

  async function handleCancel() {
    if (!confirm('לבטל את ההזמנה המאושרת?')) return
    setCancelling(true)
    await cancelBooking(booking.id)
    setCancelling(false)
    onClose()
  }

  const start = new Date(booking.start_time)
  const end   = new Date(booking.end_time)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" />

      {/* Modal card */}
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-background text-textMuted hover:text-textBase transition-colors z-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="px-5 pt-5 pb-6">
          {/* User row */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: getUserColor(booking) + '20' }}
            >
              {booking.profiles?.avatar_emoji ?? '🙂'}
            </div>
            <div>
              <p className="font-bold text-textBase text-base leading-snug">{booking.title}</p>
              <p className="text-sm text-textMuted font-medium">{booking.profiles?.full_name}</p>
            </div>
            <span className={`status-pill mr-auto flex-shrink-0 ${STATUS_PILL[booking.status] ?? ''}`}>
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
          </div>

          {/* Description */}
          {booking.description && (
            <p className="text-sm text-textMuted leading-relaxed mb-4 bg-background rounded-2xl px-4 py-3">
              {booking.description}
            </p>
          )}

          {/* Time block */}
          <div className="bg-background rounded-2xl px-4 py-3 flex items-center gap-3 mb-3">
            <span className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C6FF7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-textBase">
                {format(start, 'EEEE, d בMMMM', { locale: he })}
              </p>
              <p className="text-xs text-textMuted font-medium mt-0.5">
                {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                {start.toDateString() !== end.toDateString() && (
                  <span className="mr-1">({format(end, 'd/M')})</span>
                )}
              </p>
            </div>
          </div>

          {/* Admin note */}
          {booking.admin_note && (
            <div className="bg-background rounded-2xl px-4 py-3 text-sm text-textMuted border border-border mb-3">
              <span className="font-semibold text-textBase">הערת מנהל: </span>
              {booking.admin_note}
            </div>
          )}

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="mt-2 w-full py-3.5 rounded-2xl text-sm font-bold border border-rejected-border
                bg-rejected-light text-rejected-text hover:bg-rejected-DEFAULT hover:text-white
                active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              )}
              בטל הזמנה
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── MAIN COMPONENT ─────────────────── */

interface Props {
  onNavigate: (page: ActivePage) => void
}

export default function WeeklyCalendar({ onNavigate }: Props) {
  const { bookings, loading } = useBookings()
  const [view, setView] = useState<CalView>('week')
  const [anchor, setAnchor] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(new Date())
  const [sheetBooking, setSheetBooking] = useState<Booking | null>(null)

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

        {/* Nav row */}
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

        {/* Month-view day-name headers */}
        {view === 'month' && (
          <div className="grid grid-cols-7">
            {DAY_NAMES.map((n, i) => (
              <div key={i} className="text-center text-[10px] font-semibold text-textMuted py-1">{n}</div>
            ))}
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
            onBookingClick={setSheetBooking}
          />
        ) : view === 'week' ? (
          <WeekBody
            weekDays={weekDays}
            approved={approved}
            bookings={bookings}
            onBookingClick={setSheetBooking}
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
            onBookingClick={setSheetBooking}
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

      {/* Booking detail sheet */}
      {sheetBooking && (
        <BookingDetailSheet
          booking={sheetBooking}
          onClose={() => setSheetBooking(null)}
        />
      )}
    </div>
  )
}

/* ─────────────────── DAY VIEW ─────────────────── */

function DayBody({
  day,
  approved,
  allBookings,
  onBookingClick,
}: {
  day: Date
  approved: Booking[]
  allBookings: Booking[]
  onBookingClick: (b: Booking) => void
}) {
  const dayBookings = allBookings
    .filter(b => isSameDay(new Date(b.start_time), day))
    .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time))

  const now = new Date()
  const nowH = now.getHours() + now.getMinutes() / 60
  const showNowLine = isToday(day) && nowH >= DAY_START && nowH <= DAY_START + HOURS.length

  return (
    <div className="pb-28">
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
          {HOURS.map((_, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-border/50" style={{ top: i * HOUR_H }} />
          ))}
          {HOURS.map((_, i) => (
            <div key={`h${i}`} className="absolute left-0 right-0 border-t border-dashed border-border/25" style={{ top: i * HOUR_H + HOUR_H / 2 }} />
          ))}

          {approved.map(b => {
            const { top, height } = getTimeSlot(b, day)
            const color = getUserColor(b)
            return (
              <button
                key={b.id}
                onClick={() => onBookingClick(b)}
                className="absolute left-1 right-1 rounded-xl px-2 py-1 overflow-hidden text-right active:brightness-95 transition-all"
                style={{ top, height, backgroundColor: color + '22', borderRight: `3px solid ${color}` }}
              >
                <p className="text-[11px] font-bold leading-tight truncate" style={{ color }}>
                  {b.profiles?.avatar_emoji} {b.title}
                </p>
                {height >= 48 && (
                  <p className="text-[10px] mt-0.5 opacity-75" style={{ color }}>
                    {format(new Date(b.start_time), 'HH:mm')}–{format(new Date(b.end_time), 'HH:mm')}
                  </p>
                )}
              </button>
            )
          })}

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

      {dayBookings.length > 0 && (
        <div className="px-4 pt-5 space-y-3" dir="rtl">
          <h3 className="font-bold text-textBase text-sm">כל הבקשות ליום זה</h3>
          {dayBookings.map(b => (
            <button key={b.id} className="w-full text-right" onClick={() => onBookingClick(b)}>
              <div className="pointer-events-none">
                <BookingCardSimple booking={b} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────── WEEK VIEW ─────────────────── */

function WeekBody({
  weekDays,
  approved,
  bookings,
  onBookingClick,
}: {
  weekDays: Date[]
  approved: Booking[]
  bookings: Booking[]
  onBookingClick: (b: Booking) => void
}) {
  const now = new Date()
  const nowH = now.getHours() + now.getMinutes() / 60

  return (
    <div dir="ltr" className="flex flex-col pb-28">

      {/* Sticky day-header row */}
      <div className="sticky top-0 z-10 bg-white border-b border-border flex shadow-sm">
        <div className="w-10 flex-shrink-0" />
        {weekDays.map((day, i) => {
          const today = isToday(day)
          return (
            <div key={i} className="flex-1 flex flex-col items-center py-1.5 border-r border-border/50 last:border-r-0">
              <span className="text-[9px] font-semibold text-textMuted">{DAY_NAMES[i]}</span>
              <span
                className={`text-[13px] font-bold w-6 h-6 flex items-center justify-center rounded-full mt-0.5
                  ${today ? 'bg-primary-500 text-white' : 'text-textBase'}`}
              >
                {format(day, 'd')}
              </span>
            </div>
          )
        })}
      </div>

      {/* Timeline grid */}
      <div className="flex">
        {/* Hour labels */}
        <div className="w-10 flex-shrink-0 select-none">
          {HOURS.map(h => (
            <div
              key={h}
              className="flex items-start justify-end pr-1 text-[9px] font-semibold text-textMuted"
              style={{ height: HOUR_H }}
            >
              <span className="-mt-2">{String(h).padStart(2, '0')}</span>
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {weekDays.map((day, i) => {
          const dayApproved = approved.filter(b => overlapsDay(b, day))
          const today = isToday(day)
          const showNow = today && nowH >= DAY_START && nowH <= DAY_START + HOURS.length

          return (
            <div
              key={i}
              className={`flex-1 relative border-r border-border/40 last:border-r-0 ${today ? 'bg-primary-50/40' : ''}`}
              style={{ height: HOURS.length * HOUR_H }}
            >
              {/* Hour lines */}
              {HOURS.map((_, j) => (
                <div key={j} className="absolute left-0 right-0 border-t border-border/40" style={{ top: j * HOUR_H }} />
              ))}
              {/* Half-hour lines */}
              {HOURS.map((_, j) => (
                <div key={`h${j}`} className="absolute left-0 right-0 border-t border-dashed border-border/20" style={{ top: j * HOUR_H + HOUR_H / 2 }} />
              ))}

              {/* Approved booking blocks */}
              {dayApproved.map(b => {
                const { top, height } = getTimeSlot(b, day)
                const color = getUserColor(b)
                return (
                  <button
                    key={b.id}
                    onClick={() => onBookingClick(b)}
                    className="absolute inset-x-0.5 rounded-md overflow-hidden active:brightness-95 transition-all"
                    style={{ top, height, backgroundColor: color + '28', borderRight: `2px solid ${color}` }}
                  >
                    <p
                      className="text-[9px] font-bold px-1 pt-0.5 truncate leading-tight"
                      style={{ color }}
                    >
                      {b.profiles?.avatar_emoji}
                      {height >= 44 ? ` ${b.profiles?.full_name?.split(' ')[0] ?? ''}` : ''}
                    </p>
                    {height >= 56 && (
                      <p className="text-[8px] px-1 opacity-70 leading-tight" style={{ color }}>
                        {format(new Date(b.start_time), 'HH:mm')}
                      </p>
                    )}
                  </button>
                )
              })}

              {/* Current-time line */}
              {showNow && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-primary-500 pointer-events-none z-10"
                  style={{ top: (nowH - DAY_START) * HOUR_H }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 -mt-1 -ml-1" />
                </div>
              )}

              {/* Pending bookings dot indicator */}
              {bookings.filter(b => b.status === 'pending' && isSameDay(new Date(b.start_time), day)).length > 0 && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-pending-DEFAULT" />
              )}
            </div>
          )
        })}
      </div>
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
  onBookingClick,
}: {
  monthDates: Date[]
  anchor: Date
  approved: Booking[]
  selected: Date | null
  onSelect: (day: Date) => void
  selectedBookings: Booking[]
  onNavigate: (page: ActivePage) => void
  onBookingClick: (b: Booking) => void
}) {
  return (
    <div className="pb-28" dir="rtl">
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
                  ${today ? 'bg-primary-500 text-white'
                    : sel ? 'bg-primary-100 text-primary-700'
                    : inMonth ? 'text-textBase'
                    : 'text-border'}`}
              >
                {format(day, 'd')}
              </span>

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
              {selectedBookings.map(b => (
                <button key={b.id} className="w-full text-right" onClick={() => onBookingClick(b)}>
                  <div className="pointer-events-none">
                    <BookingCardSimple booking={b} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────── INLINE BOOKING CARD (calendar-only) ─────────────────── */

const STATUS_BAR: Record<string, string> = {
  pending:   'bg-pending-DEFAULT',
  approved:  'bg-approved-DEFAULT',
  rejected:  'bg-rejected-DEFAULT',
  cancelled: 'bg-gray-300',
}

function BookingCardSimple({ booking }: { booking: Booking }) {
  const start = new Date(booking.start_time)
  const end   = new Date(booking.end_time)
  const color = getUserColor(booking)

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="flex">
        <div className={`w-1 flex-shrink-0 ${STATUS_BAR[booking.status] ?? 'bg-gray-300'}`} />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: color + '20' }}
                >
                  {booking.profiles?.avatar_emoji ?? '🙂'}
                </span>
                <span className="text-xs text-textMuted font-medium truncate">{booking.profiles?.full_name ?? 'משתמש'}</span>
              </div>
              <h3 className="font-bold text-textBase text-sm leading-snug">{booking.title}</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7C6FF7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                <span className="text-xs font-semibold text-textBase">
                  {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={`status-pill ${STATUS_PILL[booking.status] ?? ''}`}>
                {STATUS_LABEL[booking.status] ?? booking.status}
              </span>
              <span className="text-[10px] text-textMuted/60">לחץ לפרטים</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
