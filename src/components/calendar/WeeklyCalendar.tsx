import { useState } from 'react'
import { useBookings } from '../../contexts/BookingsContext'
import BookingCard from '../bookings/BookingCard'
import LoadingSpinner from '../shared/LoadingSpinner'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns'
import { he } from 'date-fns/locale'
import { Booking, ActivePage } from '../../types'

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

interface Props {
  onNavigate: (page: ActivePage) => void
}

const STATUS_DOT: Record<string, string> = {
  pending:  'bg-pending-DEFAULT',
  approved: 'bg-approved-DEFAULT',
  rejected: 'bg-rejected-DEFAULT',
}

export default function WeeklyCalendar({ onNavigate }: Props) {
  const { bookings, loading } = useBookings()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function getBookingsForDay(day: Date): Booking[] {
    return bookings.filter(b => isSameDay(new Date(b.start_time), day))
  }

  function getDotStatuses(day: Date) {
    const dayBookings = getBookingsForDay(day)
    return [...new Set(dayBookings.map(b => b.status))].slice(0, 3)
  }

  const selectedBookings = selectedDay ? getBookingsForDay(selectedDay) : []

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Calendar header */}
      <div className="bg-white shadow-card px-4 pt-14 pb-4">
        {/* Month + nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekStart(w => subWeeks(w, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-background active:bg-border transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7068" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <button
            onClick={() => {
              setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))
              setSelectedDay(new Date())
            }}
            className="flex flex-col items-center"
          >
            <span className="text-xl font-extrabold text-textBase tracking-tight leading-none">
              {format(weekStart, 'MMMM', { locale: he })}
            </span>
            <span className="text-xs text-textMuted font-medium mt-0.5">
              {format(weekStart, 'yyyy')}
            </span>
          </button>

          <button
            onClick={() => setWeekStart(w => addWeeks(w, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-background active:bg-border transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A7068" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* Day selector */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const statuses = getDotStatuses(day)
            const selected = selectedDay ? isSameDay(day, selectedDay) : false
            const today = isToday(day)

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(selected ? null : day)}
                className={`flex flex-col items-center py-2 rounded-2xl transition-all duration-200 active:scale-95
                  ${selected
                    ? 'bg-primary-500 shadow-primary-sm'
                    : today
                    ? 'bg-primary-50 ring-1 ring-primary-200'
                    : 'hover:bg-background'}`}
              >
                <span className={`text-[10px] font-semibold mb-1
                  ${selected ? 'text-primary-200' : 'text-textMuted'}`}>
                  {DAY_NAMES[i]}
                </span>
                <span className={`text-sm font-bold leading-none
                  ${selected ? 'text-white' : today ? 'text-primary-600' : 'text-textBase'}`}>
                  {format(day, 'd')}
                </span>
                <div className="flex gap-0.5 mt-1.5 h-1.5 items-center justify-center">
                  {statuses.map((status, j) => (
                    <span
                      key={j}
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${selected ? 'bg-white opacity-70' : STATUS_DOT[status]}`}
                    />
                  ))}
                  {statuses.length === 0 && <span className="w-1 h-1 rounded-full bg-transparent" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bookings list */}
      <div className="flex-1 overflow-y-auto scroll-container px-4 pt-4 pb-28">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : selectedDay ? (
          <div className="animate-fade-in">
            {/* Day heading */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-textBase text-base">
                {format(selectedDay, 'EEEE, d בMMMM', { locale: he })}
              </h2>
              {isToday(selectedDay) && (
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
                {selectedBookings
                  .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                  .map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-14 text-textMuted text-sm font-medium">
            <span className="text-3xl mb-3">👆</span>
            בחר יום לצפייה בבקשות
          </div>
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
