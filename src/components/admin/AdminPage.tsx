import { useState } from 'react'
import { useBookings } from '../../contexts/BookingsContext'
import { Booking } from '../../types'
import LoadingSpinner from '../shared/LoadingSpinner'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

export default function AdminPage() {
  const { bookings, loading, approveBooking, rejectBooking } = useBookings()
  const [noteMap,       setNoteMap]       = useState<Record<string, string>>({})
  const [openNoteId,    setOpenNoteId]    = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError,   setActionError]   = useState<string | null>(null)

  const pending = bookings
    .filter(b => b.status === 'pending')
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  async function handleApprove(booking: Booking) {
    setActionError(null)
    setActionLoading(booking.id + '-approve')
    const { error } = await approveBooking(booking.id, noteMap[booking.id])
    setActionLoading(null)
    if (error) {
      setActionError(error.message)
    } else {
      setOpenNoteId(null)
    }
  }

  async function handleReject(booking: Booking) {
    setActionLoading(booking.id + '-reject')
    await rejectBooking(booking.id, noteMap[booking.id])
    setActionLoading(null)
    setOpenNoteId(null)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const recentlyHandled = bookings
    .filter(b => b.status !== 'pending')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  return (
    <div className="flex-1 overflow-y-auto scroll-container bg-background pb-28">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-textBase tracking-tight flex items-center gap-2">
              לוח ניהול
              <span className="text-lg">⭐</span>
            </h1>
            <p className="text-sm text-textMuted font-medium mt-0.5">אישור ודחיית בקשות</p>
          </div>
          {pending.length > 0 && (
            <div className="bg-rejected-light border border-rejected-border rounded-2xl px-3 py-2 text-center">
              <p className="text-2xl font-extrabold text-rejected-text leading-none">{pending.length}</p>
              <p className="text-[10px] text-rejected-text font-semibold">ממתינות</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {actionError && (
          <div className="bg-rejected-light border border-rejected-border text-rejected-text text-sm px-4 py-3 rounded-2xl flex items-center gap-2 animate-scale-in">
            <span className="flex-shrink-0">⚠️</span>
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="mr-auto text-rejected-text/60 hover:text-rejected-text">✕</button>
          </div>
        )}
        {pending.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-24 h-24 bg-approved-light rounded-3xl shadow-card flex items-center justify-center text-5xl mb-5">✅</div>
            <p className="text-textBase font-bold text-lg">אין בקשות ממתינות</p>
            <p className="text-textMuted text-sm mt-1">כל הבקשות טופלו</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-textMuted font-semibold px-1">{pending.length} בקשות ממתינות לאישורך</p>
            {pending.map(booking => {
              const start       = new Date(booking.start_time)
              const end         = new Date(booking.end_time)
              const isApproving = actionLoading === booking.id + '-approve'
              const isRejecting = actionLoading === booking.id + '-reject'
              const hasNote     = openNoteId === booking.id
              const conflictsWithOtherPending = pending.some(other =>
                other.id !== booking.id &&
                start < new Date(other.end_time) &&
                end > new Date(other.start_time)
              )

              return (
                <div key={booking.id} className="bg-white rounded-3xl shadow-card overflow-hidden animate-fade-in">
                  {/* Pending accent bar */}
                  <div className="h-1 bg-gradient-to-r from-pending-DEFAULT to-amber-300" />

                  <div className="p-4">
                    {/* User + title */}
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-primary-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                        {booking.profiles?.avatar_emoji ?? '🙂'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-textBase text-sm">{booking.title}</p>
                            <p className="text-xs text-textMuted font-medium mt-0.5">{booking.profiles?.full_name}</p>
                          </div>
                          <span className="text-[11px] text-textMuted flex-shrink-0">
                            {format(new Date(booking.created_at), 'd/M HH:mm')}
                          </span>
                        </div>

                        {booking.description && (
                          <p className="text-xs text-textMuted mt-1.5 leading-relaxed">{booking.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Conflict warning */}
                    {conflictsWithOtherPending && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-2 rounded-2xl flex items-center gap-2">
                        <span>⚠️</span>
                        <span>חפיפה עם בקשה ממתינה אחרת — ניתן לאשר רק אחת מהן</span>
                      </div>
                    )}

                    {/* Time block */}
                    <div className="mt-3 bg-background rounded-2xl px-4 py-3 flex items-center gap-3">
                      <span className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C6FF7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-bold text-textBase">
                          {format(start, 'EEEE, d בMMMM', { locale: he })}
                        </p>
                        <p className="text-xs text-textMuted font-medium mt-0.5">
                          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                          {start.toDateString() !== end.toDateString() && (
                            <span className="text-textMuted mr-1">({format(end, 'd/M')})</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Note field */}
                    {hasNote && (
                      <div className="mt-3 animate-scale-in">
                        <input
                          type="text"
                          value={noteMap[booking.id] ?? ''}
                          onChange={e => setNoteMap(prev => ({ ...prev, [booking.id]: e.target.value }))}
                          placeholder="הערה למשתמש (אופציונלי)..."
                          className="input-field"
                          autoFocus
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleApprove(booking)}
                        disabled={!!actionLoading}
                        className="flex-1 bg-approved-DEFAULT text-white py-3 rounded-2xl text-sm font-bold
                          hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50
                          flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        {isApproving ? (
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                        אשר
                      </button>

                      <button
                        onClick={() => setOpenNoteId(hasNote ? null : booking.id)}
                        className={`w-11 h-11 rounded-2xl text-sm transition-all flex items-center justify-center flex-shrink-0
                          ${hasNote ? 'bg-primary-100 text-primary-600' : 'bg-background text-textMuted hover:bg-border'}`}
                        title="הוסף הערה"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => handleReject(booking)}
                        disabled={!!actionLoading}
                        className="flex-1 bg-rejected-light text-rejected-text py-3 rounded-2xl text-sm font-bold
                          hover:bg-rejected-DEFAULT hover:text-white active:scale-95 transition-all disabled:opacity-50
                          flex items-center justify-center gap-1.5 border border-rejected-border"
                      >
                        {isRejecting ? (
                          <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                          </svg>
                        )}
                        דחה
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* Recently handled */}
        {recentlyHandled.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xs font-bold text-textMuted uppercase tracking-widest mb-3 px-1">טופלו לאחרונה</h2>
            <div className="space-y-2">
              {recentlyHandled.map(b => (
                <div key={b.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-card">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{b.profiles?.avatar_emoji ?? '🙂'}</span>
                    <div>
                      <p className="text-sm font-semibold text-textBase">{b.title}</p>
                      <p className="text-xs text-textMuted">{b.profiles?.full_name}</p>
                    </div>
                  </div>
                  <span className={`status-pill ${b.status === 'approved'
                    ? 'bg-approved-light text-approved-text border border-approved-border'
                    : 'bg-rejected-light text-rejected-text border border-rejected-border'}`}>
                    {b.status === 'approved' ? 'אושר' : 'נדחה'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
